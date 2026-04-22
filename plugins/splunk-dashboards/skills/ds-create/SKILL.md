---
name: ds-create
description: Use this skill to generate a full Splunk Dashboard Studio JSON definition (dashboard.json) from a workspace's layout.json and data-sources.json. Reads Panel positions, visualization types, and SPL queries; produces the complete dataSources + visualizations + layout.structure. Advances workspace state from designed to built. Requires a workspace at designed stage produced by ds-design.
---

# ds-create — Dashboard Studio JSON builder

## When to use

After `ds-design` has written `design/layout.json` and advanced state to `designed`. Combined with `data-sources.json` from `ds-data-explore` or `ds-mock`, this skill produces the complete `dashboard.json` that a Splunk instance can consume.

## Prerequisites

- Workspace exists with `current_stage=designed`.
- `design/layout.json` has panels.
- `data-sources.json` has one entry per question.

## What it does

1. Reads `design/layout.json` (panels: id, title, grid position, viz_type, data_source_ref).
2. Reads `data-sources.json` (sources: question, SPL, earliest, latest, name).
3. Generates Dashboard Studio JSON:
   - One `ds.search` entry per data source, keyed `ds_1`, `ds_2`, …
   - One visualization per panel, keyed `viz_<panel.id>`, with `dataSources.primary` pointing to the matching `ds_N`.
   - Absolute layout structure: grid cells × `GRID_UNIT_W`/`GRID_UNIT_H` (100 × 80 pixels).
4. Writes `dashboard.json` at the workspace root.
5. Advances state `designed` → `built`.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.create build <project-name> \
  --title "<dashboard title>" \
  --description "<optional description>"
```

The `title` becomes the dashboard's top-level title (shown in the Splunk UI). `description` is optional.

## Output shape

`dashboard.json` matches the Splunk Dashboard Studio (v2) schema:

```json
{
  "title": "...",
  "description": "...",
  "theme": "dark",
  "dataSources": { "ds_1": { "type": "ds.search", "name": "...", "options": { "query": "...", "queryParameters": { "earliest": "...", "latest": "..." } } } },
  "visualizations": { "viz_p1": { "type": "splunk.singlevalue", "title": "...", "dataSources": { "primary": "ds_1" }, "options": {} } },
  "inputs": {},
  "defaults": {},
  "layout": { "type": "absolute", "options": { "width": 1440, "height": 960 }, "structure": [ { "item": "viz_p1", "type": "block", "position": { "x": 0, "y": 0, "w": 600, "h": 320 } } ] }
}
```

For deeper schema details, invoke `ds-syntax`. For per-visualization option fields, invoke `ds-viz`.

## New: global time input, drilldowns, grid layout

### CLI flags

- `--no-time-input` — Omits the global time-range input and the `defaults` block that wires panel queries to it. Useful when embedding a dashboard in a context that supplies its own time picker, or for static dashboards.
- `--layout grid` — Emits a grid layout instead of absolute positioning. Panels are grouped into rows by their `y` coordinate and sorted by `x` within each row. Each row becomes a `{"type": "row", "items": [...]}` entry with `width` expressed as a percentage of the row. Default is `--layout absolute`.

### Global time input (default on)

When `--no-time-input` is NOT passed (the default), `ds-create` automatically:

1. Adds an `input.timerange` keyed `input_global_time` with token `global_time` to the `inputs` block.
2. Adds a `defaults.dataSources.global` block that wires every panel's `queryParameters.earliest` / `latest` to `$global_time.earliest$` / `$global_time.latest$`.

This means users get a working time-range picker that controls all panels without any extra configuration.

### Panel drilldowns

Panels in `layout.json` can carry a `drilldown` field:

```json
{
  "id": "p1",
  "title": "My Panel",
  "drilldown": {"type": "link.dashboard", "dashboard": "target_dash"}
}
```

`ds-create` translates this into `options.drilldown = "all"` and `options.drilldownAction = <drilldown value>` on the matching visualization, enabling click-through behavior in the rendered dashboard.

## After building

- `dashboard.json` exists at the workspace root.
- `state.json` has `current_stage=built`.
- Next step: `ds-validate` (lint SPL, tokens, drilldowns) before `ds-deploy`.
