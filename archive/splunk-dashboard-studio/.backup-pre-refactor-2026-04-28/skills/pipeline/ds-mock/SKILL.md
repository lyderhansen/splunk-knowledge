---
name: ds-mock
description: Use this skill to generate inline synthetic data for a Splunk dashboard when real data is not yet available. Produces makeresults-based SPL queries (one per dashboard question) and writes them to data-sources.json under the workspace. Advances workspace state from scoped to data-ready. Requires an existing workspace created by ds-init.
---

# ds-mock — Synthetic data generator

## When to use

When `requirements.md` reports `Has data: no` (or `partial` and the user wants mock for the missing questions), or when the user explicitly asks to mock data.

## Prerequisites

- Workspace exists at `./.splunk-dashboards/<project>/state.json`.
- `current_stage` is `scoped`.
- `requirements.md` lists 1–5 questions.

If the workspace does not exist, run `ds-init` first.

## What it does

1. Reads the dashboard questions from `requirements.md`.
2. For each question, drafts a `makeresults`-based SPL snippet that produces plausible synthetic events.
3. Assembles a JSON payload with one entry per question.
4. Invokes the `data_sources write` CLI to persist `data-sources.json` and advance state to `data-ready`.

## Pattern library

Compose mock SPL from these building blocks. Pick patterns based on the question type.

### Categorical field (fixed vocabulary)

```spl
| makeresults count=100
| eval user=mvindex(split("alice,bob,carol,dave,erin",","), random()%5)
| eval action=mvindex(split("success,failure,timeout",","), random()%3)
```

### Numeric distribution (counts, latencies)

```spl
| makeresults count=200
| eval latency_ms=round(10 + random()%500, 0)
| eval bytes=round(1024 + random()%(1024*1024), 0)
```

### Timestamps over a window (for trends / time charts)

```spl
| makeresults count=500
| eval _time=now()-round(random()%(24*3600), 0)
```

### IP addresses (for network-ish data)

```spl
| makeresults count=150
| eval src="10.0.0.".(random()%254+1)
| eval dest="192.168.1.".(random()%254+1)
```

### Top-N friendly shape

After generating events, aggregate — this produces realistic leaderboards:

```spl
| makeresults count=500
| eval src=mvindex(split("10.0.0.1,10.0.0.2,10.0.0.3,10.0.0.4,10.0.0.5",","), random()%5)
| stats count by src
| sort -count
```

## How to produce the data-sources.json

1. For each question in `requirements.md`, draft an SPL using the patterns above. Favor shapes that naturally answer the question — if the question asks "top sources", end with `| stats count by src | sort -count`.
2. Set `earliest` to `-24h` and `latest` to `now` unless the question implies a different window.
3. Give each source a short `name` (human-readable label shown in the dashboard UI later).
4. Assemble this JSON payload and write it via the CLI:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.data_sources write - <<'JSON'
{
  "project": "<project-name-from-state.json>",
  "source": "mock",
  "sources": [
    {
      "question": "What are the top failed login sources?",
      "spl": "| makeresults count=500\n| eval src=\"10.0.0.\".(random()%254+1)\n| eval action=if(random()%3==0,\"failure\",\"success\")\n| where action=\"failure\"\n| stats count by src\n| sort -count",
      "earliest": "-24h",
      "latest": "now",
      "name": "Failed Logins by Source"
    }
  ]
}
JSON
```

The CLI:

- Validates that the workspace exists.
- Writes `.splunk-dashboards/<project>/data-sources.json`.
- Advances `state.json` from `current_stage=scoped` to `current_stage=data-ready` (appending `scoped` to `stages_completed`).

## Next step

After this skill completes, move to `ds-design` to wireframe the dashboard layout.
