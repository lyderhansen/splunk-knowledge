---
name: ds-syntax
description: Reference skill documenting the Splunk Dashboard Studio (v2) JSON schema. Covers top-level keys, dataSources (ds.search, ds.savedSearch, ds.chain), visualizations container shape, inputs and token definitions, defaults, layout structures (absolute, grid), drilldowns, and the XML envelope used for file deployment. Use this skill when authoring or editing Dashboard Studio JSON by hand, when ds-create needs field-level detail, or when answering standalone questions about Dashboard Studio syntax.
---

# ds-syntax — Dashboard Studio JSON reference

## Top-level keys

A Dashboard Studio definition is a JSON object with these keys:

| Key | Type | Required | Purpose |
|---|---|---|---|
| `title` | string | yes | Dashboard title shown in the UI |
| `description` | string | no | Subtitle / description |
| `theme` | string | no | `"light"` or `"dark"` (also settable in the XML envelope) |
| `dataSources` | object | yes | Named searches — see next section |
| `visualizations` | object | yes | Panels, keyed by id |
| `inputs` | object | no | User-facing filters (tokens) |
| `defaults` | object | no | Default token values + global time range |
| `layout` | object | yes | Grid structure placing visualizations on screen |

## dataSources

Each entry is a named search. The three common types:

### `ds.search` (SPL)

```json
"ds_1": {
  "type": "ds.search",
  "name": "Failed Logins by Source",
  "options": {
    "query": "index=auth action=failure | stats count by src",
    "queryParameters": {
      "earliest": "$global_time.earliest$",
      "latest": "$global_time.latest$"
    },
    "refresh": "30s",
    "refreshType": "delay"
  }
}
```

Fields:

- `name` (string, required) — human-readable label shown in the editor.
- `options.query` (string, required) — SPL. Use `\n` for multi-line.
- `options.queryParameters.earliest` / `latest` — absolute string (`-24h`, `now`) or a token reference (`$global_time.earliest$`).
- `options.refresh` — optional auto-refresh interval.
- `options.refreshType` — `"delay"` (wait for completion) or `"interval"` (fixed cadence).

### `ds.savedSearch`

Reference a saved search by name:

```json
"ds_2": {
  "type": "ds.savedSearch",
  "name": "Weekly report",
  "options": { "ref": "Weekly Auth Report" }
}
```

### `ds.chain`

Chain a post-process onto another data source (no extra search dispatch):

```json
"ds_3": {
  "type": "ds.chain",
  "options": {
    "extend": "ds_1",
    "query": "| head 10"
  }
}
```

## visualizations

Each entry is a panel that renders data:

```json
"viz_p1": {
  "type": "splunk.singlevalue",
  "title": "Failed Logins",
  "description": "Last 24 hours",
  "dataSources": { "primary": "ds_1" },
  "options": { "majorColor": "#d13d3d" }
}
```

Fields:

- `type` (required) — one of the built-in types (see `ds-viz` for per-type options).
- `title` / `description` — shown in the panel header.
- `dataSources.primary` — key in `dataSources` that feeds this viz. Some types also accept `dataSources.annotations` or `dataSources.comparison`.
- `options` — per-type configuration object.

## inputs and tokens

`inputs` declares filters the user can manipulate at the top of the dashboard.

```json
"inputs": {
  "input_timerange": {
    "type": "input.timerange",
    "title": "Time range",
    "options": { "token": "global_time", "defaultValue": { "earliest": "-24h", "latest": "now" } }
  },
  "input_index": {
    "type": "input.dropdown",
    "title": "Index",
    "options": {
      "token": "selected_index",
      "items": [
        { "label": "auth", "value": "auth" },
        { "label": "web", "value": "web" }
      ],
      "defaultValue": "auth"
    }
  }
}
```

Reference tokens in SPL as `$token_name$`. For timerange inputs, use `$<token>.earliest$` and `$<token>.latest$`.

## defaults

Top-level defaults (often just a global time range):

```json
"defaults": {
  "dataSources": {
    "global": { "options": { "queryParameters": { "earliest": "-24h", "latest": "now" } } }
  }
}
```

## layout

Two layout types:

### Absolute

Pixel-based positioning. `ds-create` emits this.

```json
"layout": {
  "type": "absolute",
  "options": { "width": 1440, "height": 960 },
  "structure": [
    { "item": "viz_p1", "type": "block", "position": { "x": 0, "y": 0, "w": 600, "h": 320 } }
  ]
}
```

### Grid

Row-oriented, auto-sized columns:

```json
"layout": {
  "type": "grid",
  "structure": [
    { "type": "row", "items": [ { "item": "viz_p1", "width": 50 }, { "item": "viz_p2", "width": 50 } ] }
  ]
}
```

## drilldowns

Per-visualization click-through behavior, declared under `options.drilldown`:

```json
"viz_p1": {
  "type": "splunk.table",
  "options": {
    "drilldown": "all",
    "drilldownTarget": "row",
    "drilldownAction": {
      "type": "link.url",
      "url": "https://example.com/search?q=$row.src$"
    }
  }
}
```

Common actions: `link.url`, `link.dashboard`, `setToken`, `unsetToken`.

## XML envelope (deployment)

For deploying to Splunk, wrap the JSON in XML:

```xml
<dashboard version="2" theme="dark">
  <label>Failed Logins Dashboard</label>
  <description>Monitors auth failures</description>
  <definition><![CDATA[
    { ...JSON definition... }
  ]]></definition>
</dashboard>
```

- `version="2"` marks this as Dashboard Studio (not classic Simple XML).
- `theme` overrides the JSON's `theme`.
- The JSON goes inside `<![CDATA[...]]>`.

## When to use this skill standalone

- "How do I define a dropdown input?" — section `inputs and tokens`.
- "What's the difference between ds.search and ds.chain?" — section `dataSources`.
- "How do drilldowns work?" — section `drilldowns`.

For per-visualization options (e.g., what fields does `splunk.pie` accept?), invoke `ds-viz`.
