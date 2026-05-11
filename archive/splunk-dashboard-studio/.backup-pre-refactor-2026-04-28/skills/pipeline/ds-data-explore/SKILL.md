---
name: ds-data-explore
description: Use this skill to discover real Splunk data and draft SPL queries for a dashboard when the user has indicated they have data in Splunk. Reads requirements.md, probes available indexes and sourcetypes, drafts SPL per dashboard question (verifying with Splunk MCP if available), and writes data-sources.json. Advances workspace state from scoped to data-ready. Requires an existing workspace created by ds-init.
---

# ds-data-explore — Discover real Splunk data

## When to use

When `requirements.md` reports `Has data: yes` (or `partial` for the yes-portion of questions). Requires `current_stage=scoped`.

## What it does

1. Reads the questions and declared indexes from `requirements.md`.
2. (If Splunk MCP is configured) probes the listed indexes for sourcetypes and sample events.
3. Drafts an SPL query per question, using real index/sourcetype names where possible.
4. (If Splunk MCP is configured) runs each query with a tight time window to validate it parses and returns rows.
5. Assembles a JSON payload and writes it via the generic data-sources CLI, advancing state to `data-ready`.

## MCP vs. no-MCP paths

**If `splunk` MCP tools are available in the session:**

- Use `splunk_search` (or equivalent) to verify each drafted SPL returns rows within a short `earliest` window (e.g., `-1h`).
- If a query fails to parse or returns 0 rows, iterate: inspect sourcetype fields, adjust field names, re-run.
- Persist only queries that parsed and returned rows.

**If no MCP tools are available:**

- Draft SPL using the indexes declared in `requirements.md` and reasonable field-name heuristics (e.g., auth data uses `src`, `user`, `action`; web data uses `status`, `uri`, `clientip`).
- Mark each drafted query with a short comment the user should review before deploy: `| comment "Review field names against actual data"`.
- Do NOT fabricate field values or promise correctness — the skill is best-effort here.

## Heuristic hints for common question shapes

| Question pattern | SPL skeleton |
|---|---|
| "Top N <thing> by <metric>" | `index=<idx> <sourcetype?> | stats count by <field> | sort -count | head N` |
| "Trend of <metric> over time" | `index=<idx> <sourcetype?> | timechart span=<span> count` |
| "Failures / errors" | `index=<idx> (action=failure OR status>=400) | stats count by <grouping>` |
| "Per-user activity" | `index=<idx> user=* | stats count by user | sort -count` |
| "Unique <thing> count" | `index=<idx> | stats dc(<field>)` |

## How to produce the data-sources.json

Same CLI as `ds-mock`, but set `"source": "explore"` and use real `index=`-based SPL instead of `makeresults`:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.data_sources write - <<'JSON'
{
  "project": "<project-name>",
  "source": "explore",
  "sources": [
    {
      "question": "What are the top failed login sources?",
      "spl": "index=auth action=failure | stats count by src | sort -count | head 10",
      "earliest": "-24h",
      "latest": "now",
      "name": "Failed Logins by Source"
    }
  ]
}
JSON
```

The CLI:

- Validates the workspace exists.
- Writes `.splunk-dashboards/<project>/data-sources.json`.
- Advances `state.json` from `current_stage=scoped` to `current_stage=data-ready`.

## Next step

Move to `ds-design` to wireframe the layout.
