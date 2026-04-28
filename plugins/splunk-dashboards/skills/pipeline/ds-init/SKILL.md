---
name: ds-init
description: Use this skill to scope a new Splunk Dashboard Studio dashboard. Runs an interactive question flow, creates a workspace under ./.splunk-dashboards/<project>/, and writes requirements.md. Also accepts --autopilot to run non-interactively with defaults, --quick for minimum scoping, and --resume to continue from an existing workspace. Entry point for the splunk-dashboards plugin pipeline.
---

# ds-init — Splunk Dashboard scoping

## When to use

When the user says they want to build a new Splunk Dashboard Studio dashboard and no workspace exists yet (or they pass `--resume`).

## What it does

1. Asks the user a ten-question scoping flow (below).
2. Creates `./.splunk-dashboards/<project-name>/` with `state.json`.
3. Writes `requirements.md` under the workspace.
4. Prints the next recommended skill (`ds-data-explore` or `ds-mock`).

## Flags

- `--autopilot` — skip all questions, use defaults, and let downstream skills also run with defaults.
- `--quick` — ask only questions 3 (goal) and 7 (has-data). Skip design phase later.
- `--resume` — if a workspace already exists for the project name, load it instead of re-asking.

## Question flow

Ask these one at a time. Prefer multiple-choice where options are listed.

### Group 1 — Context

1. **Role?** Options: SOC analyst / DevOps / Platform admin / Developer / Business / Other.
2. **Audience?** Options: Self / Team / Leadership / External.
3. **Primary goal (one sentence)?** Free text.

### Group 2 — Content

4. **Focus?** Options: Technical/operational / Business/executive / Mixed.
5. **Which 3–5 questions should the dashboard answer?** Free text, one per line.
6. **Does a similar dashboard already exist?** If yes, capture the path or URL.

### Group 3 — Data

7. **Is the data already in Splunk?** Options: yes / no / partial.
8. *(if yes or partial)* **Which indexes/sourcetypes are relevant?** Free text or comma-separated list.

### Group 4 — Scope

9. **Customization level?** Options: standard (apply archetype conventions verbatim) / moderate (customize layout and viz choices) / bespoke (fully custom layout, heavy tailoring).
10. **Nice-to-haves?** Multi-select: drilldowns / alerts / scheduled reports / tokens / dark theme / other.

## Defaults used by `--autopilot`

| Field | Default |
|---|---|
| role | "Developer" (auto-detect from CLAUDE.md if mentioned) |
| audience | "Self" |
| focus | "Mixed" |
| questions | infer from goal sentence |
| reference_dashboard | null |
| has_data | "no" (routes to ds-mock) unless Splunk MCP is configured |
| indexes | [] |
| customization | "moderate" |
| nice_to_haves | ["drilldowns", "tokens"] |

## How to produce the workspace

Once all answers are collected, assemble them into a JSON payload and invoke:

```bash
PYTHONPATH=<path-to-repo>/plugins/splunk-dashboards/src python3 -m splunk_dashboards.requirements from-json - <<'JSON'
{
  "project": "<kebab-case-project-name>",
  "goal": "<goal sentence>",
  "role": "<role>",
  "audience": "<audience>",
  "focus": "<focus>",
  "questions": ["<q1>", "<q2>"],
  "has_data": "yes|no|partial",
  "indexes": ["<idx1>"],
  "customization": "standard|moderate|bespoke",
  "nice_to_haves": ["drilldowns"],
  "reference_dashboard": null,
  "autopilot": false
}
JSON
```

The CLI writes `.splunk-dashboards/<project>/state.json` and `.splunk-dashboards/<project>/requirements.md` in the current working directory.

## Next step

Read the `## Next step` line at the bottom of `requirements.md`. Invoke the suggested skill(s).
