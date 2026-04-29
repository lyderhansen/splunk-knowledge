---
name: ds-design
description: Use this skill to wireframe a Splunk dashboard layout in a local browser-based editor. Launches a Python HTTP server on localhost, serves a Gridstack.js drag-and-drop grid, and saves panels (position, size, visualization type) to design/layout.json. Advances workspace state from data-ready to designed on save. Requires a workspace at data-ready stage (produced by ds-data-explore or ds-mock).
---

# ds-design — Wireframe editor

## When to use

After `ds-data-explore` or `ds-mock` has produced `data-sources.json`. Workspace must be at `current_stage=data-ready`.

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

## ⚠️ MUST LOAD — before wireframing

Wireframing without context produces 12 evenly-sized panels in a
grid that ignores reading order, visual hierarchy, and audience.
Three skills MUST be consulted before placing the first panel:

1. **`ds-couture`** — **start with the Design Context Protocol**
   (audience, tone, anti-reference, brand). Without these
   answers, the layout is a guess. The skill also sets the
   archetype-specific layout shape (executive = anchor + 3 KPIs +
   trend; SOC = top tile + tabs + master-detail; operational = tile
   row + drill-down list; analytical = filters left + chart right).
2. **`ds-ref-design-principles`** — archetype catalog,
   F-pattern reading order, visual hierarchy, grouping rules,
   KPI sizing (anchor 1.5x supporting), PALETTE.md, CHART-SELECTION.md
   (the 27-viz decision table), and the absolute bans.
3. **`ds-pick-viz`** — for every question in `data-sources.json`,
   pick the viz that matches the data shape. Catches the common
   mismatches early (pie >6 slices, bar without sort, scatter for
   time-series, choropleth for non-spatial categories).

If you skip `ds-couture` you will produce a layout that passes
schema validation but fails the Slop Test the moment the user
opens it.

Once the wireframe is set, `ds-create` will require loading the
specific `ds-viz-<type>` skill for every viz type chosen here.
Picking a viz at this stage that doesn't fit the data shape costs
a re-design later — use `ds-pick-viz` now.
