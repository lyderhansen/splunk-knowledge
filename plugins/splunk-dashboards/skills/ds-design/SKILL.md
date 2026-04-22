---
name: ds-design
description: Use this skill to wireframe a Splunk dashboard layout in a local browser-based editor. Launches a Python HTTP server on localhost, serves a Gridstack.js drag-and-drop grid, and saves panels (position, size, visualization type) to design/layout.json. Advances workspace state from data-ready to designed on save. Requires a workspace at data-ready stage (produced by ds-data-explore or ds-mock).
---

# ds-design — Wireframe editor

## When to use

After `ds-data-explore` or `ds-mock` has produced `data-sources.json`. Workspace must be at `current_stage=data-ready`. If the user wants to start from a pattern, run `ds-template load <name> --project <proj>` first to seed the layout.

## Prerequisites

- Workspace exists with `current_stage=data-ready`.
- `data-sources.json` exists (panels will reference these questions).
- A browser is available to the user.

## What it does

1. Starts a local HTTP server on an auto-assigned port.
2. Serves a Gridstack.js grid editor at `http://127.0.0.1:<port>/`.
3. Loads any existing layout from `design/layout.json` via `GET /api/layout`.
4. The user drags, resizes, adds panels, and picks a viz type per panel.
5. On **Save & Exit**, the browser POSTs to `/save`, which writes `design/layout.json` and advances `state.json` from `data-ready` to `designed`.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.design launch <project-name>
```

The command prints a URL like `http://127.0.0.1:54321/`. Open it in a browser. The server runs in the foreground — press Ctrl-C to abort without saving.

## Panel fields (written to layout.json)

| Field | Type | Description |
|---|---|---|
| `id` | string | Panel id (e.g., `p1`) — unique within the layout |
| `title` | string | Shown at the top of the panel |
| `x`, `y` | int | Grid coordinates (12-column grid) |
| `w`, `h` | int | Grid size (in cells) |
| `viz_type` | string | One of the 10 Splunk Dashboard Studio viz types |
| `data_source_ref` | string \| null | `question` value from `data-sources.json` entry, or null |

Supported viz types: `splunk.singlevalue`, `splunk.line`, `splunk.column`, `splunk.bar`, `splunk.pie`, `splunk.area`, `splunk.table`, `splunk.timeline`, `splunk.choropleth`, `splunk.markergauge`.

## After saving

- `design/layout.json` contains the panel grid.
- `state.json` has `current_stage=designed`.
- Next step: `ds-create` to generate the full Dashboard Studio JSON from layout + data sources.

## See also

Before wireframing, invoke **`ds-design-principles`** for:
- The four dashboard archetypes (executive / operational / analytical / SOC) — pick one based on `requirements.md` audience.
- Layout principles (F-pattern reading, visual hierarchy, grouping).
- KPI sizing rules and the chart-selection decision table.
