---
name: ds-int-defaults
description: Splunk Dashboard Studio dashboard-root defaults block — sets shared options on every data source or visualization of a given type. Most commonly used to wire a global timerange into every ds.search, set a project-wide refresh cadence, define dataset-wide visualization defaults, or initialise drilldown-populated tokens with defaults.tokens.default. Use when the user asks about defaults, global timerange, queryParameters, refresh / refreshType, shared options, or "why does one search ignore the time picker" in Splunk Dashboard Studio.
---

# ds-int-defaults — dashboard-wide option defaults

Verified against Splunk Enterprise 10.2.1 + Splunk Cloud 10.1.2507.
Live test bench: `splunk-knowledge-testing/ds_interactivity_core_dark`
root `defaults` block.

## What `defaults` does

A dashboard-root key that lets you set option values **once, keyed by
type**, instead of pasting them onto every data source or
visualization. Anything under `defaults.dataSources["ds.search"]
.options` applies to every `ds.search` on the dashboard, unless that
search overrides the same key locally.

This is **the** mechanism for wiring a global timerange into every
panel.

## The canonical pattern — global timerange

```json
"defaults": {
  "dataSources": {
    "ds.search": {
      "options": {
        "queryParameters": {
          "earliest": "$global_time.earliest$",
          "latest":   "$global_time.latest$"
        }
      }
    }
  }
}
```

Pairs with `input.timerange` writing `global_time`:

```json
"input_global_time": {
  "type": "input.timerange",
  "options": {
    "token": "global_time",
    "defaultValue": "-24h@h,now"
  }
}
```

With both blocks in place, **every `ds.search`** receives `earliest`
and `latest` as REST query parameters at runtime. No need to add
`earliest=$global_time.earliest$` to each query string.

## Schema shape

```json
"defaults": {
  "dataSources":    { "<type>": { "options": { ... } } },
  "visualizations": { "<type>": { "options": { ... } } },
  "tokens":         { "default": { "<token>": { "value": "..." } } }
}
```

Three top-level keys:

- **`dataSources`** — keyed by data source type (`ds.search`,
  `ds.savedSearch`, `ds.chain`, `ds.test`).
- **`visualizations`** — keyed by viz type (`splunk.line`, etc.).
- **`tokens.default`** — initial values for tokens written by
  drilldowns / eval expressions.

**Sibling stanza:** `expressions` (top-level, same level as `defaults`) defines derived tokens (`expressions.eval`) and visibility conditions (`expressions.conditions`). See `ds-int-tokens` for eval syntax, `ds-int-visibility` for conditions.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Global timerange:** wire via `defaults.dataSources["ds.search"].options.queryParameters`. | Hardcode `earliest=$global_time.earliest$` in every search query string. |
| **Drilldown-populated tokens:** initialise to `""` in `defaults.tokens.default`. | Leave undefined — visibility conditions like `$tok$ = ""` evaluate oddly; SPL interpolation may break. |
| **Per-dashboard refresh cadence:** `defaults.dataSources["ds.search"].options.refresh: "30s"`. | Set `refresh` on every search — defeat of the defaults block. |
| **Refresh policy:** `refreshType: "delay"` for status dashboards (waits AFTER results), `"interval"` for live wallboards. | Confuse the two — `interval` re-fires regardless of result return. |
| **Project-wide viz consistency:** `defaults.visualizations["splunk.line"].options.lineWidth: 2`. | Repeat 30 panels with the same `lineWidth` value. |
| **Override locally** when a single panel needs different options. | Try to override `defaults` from another `defaults` block — single block per dashboard. |

## Initialising tokens — `defaults.tokens.default`

Tokens that aren't owned by an `input` (drilldown-populated, eval
expressions) are **undefined** until something writes them. Problem
for visibility conditions and SPL interpolation.

```json
"defaults": {
  "tokens": {
    "default": {
      "selected_host":   { "value": "" },
      "selected_action": { "value": "" },
      "showTrend":       { "value": "false" },
      "metric":          { "value": "*" }
    }
  }
}
```

Each entry maps a token name to `{ "value": <string> }`. After this:

- Visibility conditions like `$selected_host$ = ""` evaluate cleanly
  before first click.
- SPL interpolation like `host=$selected_host$` becomes `host=`
  (empty) instead of `host=` (literal token text).

The block lives at `defaults.tokens.default` — `default` is the
bucket name, not a typo.

Eval expression results (referenced via `$eval:name$`) re-evaluate automatically whenever their dependency tokens change. No manual refresh or re-dispatch needed.

## What you can put under `dataSources["ds.search"].options`

| Key | Purpose |
|---|---|
| `queryParameters.earliest` | Default earliest time (token-bindable). |
| `queryParameters.latest` | Default latest time. |
| `refresh` | Auto-refresh interval (`30s`, `5m`). |
| `refreshType` | `"delay"` (after results) or `"interval"` (regardless). |
| `enablePreview` | `true` to stream preview results. |
| `cancelOnUnload` | `true` to kill jobs when dashboard closes. |
| `enableSmartSources` | `true` for inputs/searches depending on upstream tokens. |

## What you can put under `visualizations["splunk.<type>"].options`

```json
"defaults": {
  "visualizations": {
    "splunk.line": {
      "options": {
        "showLegend": true,
        "lineWidth": 2
      }
    }
  }
}
```

Rarely necessary but useful for project-wide style consistency.

## See also

- `ds-int-tokens` — what reads what's set here.
- `ds-int-inputs` — `input.timerange` writes the `global_time` token
  consumed in this block.
- `ds-int-tabs` — defaults still apply across tabs.
- `ds-ref-syntax` — JSON envelope.
