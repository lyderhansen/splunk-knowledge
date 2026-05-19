# Dashboard Interactivity for Viz Packs

Drilldown token flows, input controls, default token wiring, and SPL consumption patterns for Dashboard Studio v2 viz pack dashboards.

## 1. Drilldown Token Flow (setToken baseline) — INT-01

Use `drilldown.setToken` to capture a click value and set a named token. Downstream searches consume that token via SPL.

The panel itself MUST have `"options": { "drilldown": "all" }` — omitting it means clicks fire nothing (invisible failure).

> **Mandatory for every panel:** Apply this pattern to EVERY custom viz panel in the dashboard,
> not just one example. A single viz panel without `"drilldown": "all"` silently disables click
> interaction on that panel. Iterate all `{app_id}.*` type panels and confirm each has both
> `options.drilldown: "all"` and an `eventHandlers` entry.

```json
{
  "visualizations": {
    "viz_kpi": {
      "type": "myapp.kpi",
      "dataSources": { "primary": "ds_hosts" },
      "options": {
        "myapp.kpi.valueField": "count",
        "drilldown": "all"
      },
      "eventHandlers": [
        {
          "type": "drilldown.setToken",
          "options": {
            "tokens": [
              { "token": "selected_host", "key": "click.value" }
            ]
          }
        }
      ]
    }
  }
}
```

Key rules (verified against ds-int-drilldowns SKILL.md):

- `tokens` is an **array** of `{token, key}` objects — NOT a map (WRONG pattern below)
- `key` is bare (`click.value`, `row.host.value`) — NO `$...$` wrapping around the key
- `options.drilldown: "all"` is required on the panel or clicks fire nothing
- Tables use `row.<field>.value`; charts and custom vizs use `click.value` — these are mutually exclusive
- Context tokens are transient — only persist after `setToken` copies them to a named token

## 2. switchToTab — INT-01 (D-02)

Use when clicking a summary panel should navigate to a detail tab. Useful for executive-to-analyst drill-in flows (KPI overview tab → detail tab). The array order matters — `setToken` runs first, then `switchToTab`.

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": {
      "tokens": [{ "token": "selected_host", "key": "click.value" }]
    }
  },
  {
    "type": "drilldown.switchToTab",
    "options": { "layoutId": "tab_detail" }
  }
]
```

`layoutId` must match a key in `layout.layoutDefinitions` — e.g., `"tab_detail"` means there must be a `"layoutDefinitions": { "tab_detail": { ... } }` block.

## 3. resetTokens / unsetTokens — D-04

Two additional handler types are available for cleanup flows:

- `drilldown.resetTokens` — resets all tokens to their `defaults.tokens.default` values (good for "clear filter" buttons)
- `drilldown.unsetTokens` — removes specified tokens entirely (tokens become undefined, not "*")

These are supplemental options. Claude decides whether to include them based on the dashboard interaction model. The baseline pattern (setToken) is sufficient for most generated dashboards.

## 4. Input Controls — INT-02

### A. input.timerange (mandatory on every generated dashboard — D-05)

Every generated dashboard MUST include a time range picker. Wire it to `global_time` token and fan it to all searches via `defaults.dataSources` (see Section 5).

```json
{
  "inputs": {
    "input_global_time": {
      "type": "input.timerange",
      "title": "Time range",
      "options": {
        "token": "global_time",
        "defaultValue": "-24h@h,now"
      }
    }
  },
  "layout": {
    "globalInputs": ["input_global_time"],
    "type": "absolute",
    "options": { "width": 1920, "height": 1080 }
  }
}
```

Key rules:

- `defaultValue` is a **comma-separated string** (`"-24h@h,now"`) — NOT an object
- Read as `$global_time.earliest$` / `$global_time.latest$` in queryParameters — NEVER bare `$global_time$`
- Domain time defaults are in Section 6 below

### B. input.dropdown (domain-specific — D-05)

Include a category dropdown when the domain has meaningful discrete filters. Claude decides whether to include it.

```json
"input_category": {
  "type": "input.dropdown",
  "title": "Category",
  "options": {
    "token": "selected_category",
    "defaultValue": "*",
    "items": [
      { "label": "All", "value": "*" },
      { "label": "Critical", "value": "critical" },
      { "label": "Warning", "value": "warning" }
    ]
  }
}
```

SPL consumption: `WHERE category="$selected_category$" OR "$selected_category$"="*"`

The wildcard default (`"*"`) combined with the OR clause shows all data before any selection.

### C. Input placement rule (D-06)

Every input key declared in `inputs` MUST appear in EITHER:

- `layout.globalInputs` — for inputs that apply to all tabs / the whole dashboard
- `layoutDefinitions[n].inputs` — for per-tab inputs with truly different data domains

**Declared but unplaced is dead JSON** — the input renders nowhere and users never see it.

Default: use `layout.globalInputs`. Per-tab placement is only warranted when tabs have genuinely different data domains (e.g., network tab vs endpoint tab with different time context).

## 5. Defaults Block Wiring — INT-03 (D-07, D-08)

The `defaults` block fans options to ALL data sources of a type and initializes tokens. One block, zero per-search edits needed.

```json
{
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
    },
    "tokens": {
      "default": {
        "selected_host":   { "value": "*" },
        "selected_action": { "value": "*" }
      }
    }
  }
}
```

Important:

- The `"default"` bucket name under `tokens` is **literal** — it is not a placeholder. Do not rename it.
- Wildcard `"*"` initialization enables the `OR "$tok$"="*"` SPL pattern so all data shows before any click (INT-03).
- The `queryParameters` block fans to ALL `ds.search` instances automatically — no per-search edits required.
- Every token written by a `drilldown.setToken` handler MUST have a corresponding entry in `tokens.default`. Missing entries cause the DS5 validator check to fail.

## 6. Domain Time Defaults — D-08

Pick the default time range based on the dashboard audience and data freshness needs.

| Domain | Default value | Notes |
|--------|--------------|-------|
| SOC / NOC | `-24h@h,now` | Real-time threat visibility; shift-length context |
| Executive / trend | `-7d@d,now` | Longer trend window; daily rollup queries |
| Real-time / streaming | `-15m@h,now` | Near-real-time posture; high-volume ingest |

Set via `inputs.input_global_time.options.defaultValue` (the `input.timerange` declaration in Section 4A).

## 7. SPL Consumption Patterns

Downstream searches that consume drilldown tokens should show all data before any click and filter on click.

**Single-value filter (standard dropdown or click token):**

```spl
| inputlookup myapp_demo_events.csv
| WHERE host="$selected_host$" OR "$selected_host$"="*"
```

The `OR "$tok$"="*"` condition is why the defaults must be `"*"` — when `selected_host` is `"*"`, the second condition is true and all rows pass.

**Time range wiring (in each ds.search query — optional, handled by defaults block):**

If using the defaults block (Section 5), the `earliest`/`latest` parameters are set automatically. Explicit per-query wiring is NOT needed when the defaults block is present.

**Multiselect variant (`|s` operator — for multi-select inputs, not default):**

```spl
| WHERE status IN ($selected_status|s$)
```

The `|s` suffix formats a comma-separated multi-select value into an IN list. This is for `input.multiselect` inputs only — the standard `input.dropdown` above is single-select.

## 8. Built-in Viz Panel Colors — DR-03

Built-in Dashboard Studio vizs (splunk.area, splunk.line, splunk.column, splunk.bar, etc.) do NOT
use formatter color pickers. Their series colors are set via JSON `options` in the panel definition.

Two complementary options available:

**`seriesColors` — positional array (maps to series in alphabetical category order):**

```json
{
  "visualizations": {
    "viz_trend": {
      "type": "splunk.area",
      "dataSources": { "primary": "ds_trend" },
      "options": {
        "seriesColors": ["#0077B6", "#00B4D8", "#90E0EF", "#ADE8F4"],
        "backgroundColor": "transparent",
        "seriesColorsByField": {}
      }
    }
  }
}
```

**`seriesColorsByField` — locks color to a specific field/category value (recommended — refactor-safe):**

```json
{
  "visualizations": {
    "viz_column": {
      "type": "splunk.column",
      "dataSources": { "primary": "ds_by_status" },
      "options": {
        "seriesColorsByField": {
          "critical": "#E63946",
          "warning":  "#F4A261",
          "ok":       "#2A9D8F"
        }
      }
    }
  }
}
```

Rules:
- Use `seriesColors` for time-series or numeric series where category names are unknown at design time.
- Use `seriesColorsByField` for categorical fields where values are known (status, tier, region). It is refactor-safe — adding a new series does not shift all colors.
- Both can coexist: `seriesColorsByField` overrides specific fields; `seriesColors` fills remaining series.
- Source the hex values from `shared/theme.js` brand palette — use the same series colors defined there for brand consistency across custom and built-in panels.
- Custom vizs use formatter color pickers (series1Color–series5Color). Built-in vizs use this JSON options approach. Do NOT mix the two.

---

## WRONG patterns

```
WRONG: "tokens": {"selected_host": "click.value"}    -- map form; must be array of {token, key}
WRONG: "token": "form.host"                           -- Classic Simple XML prefix; silently broken in DS v2
WRONG: $global_time$                                  -- bare token; must use .earliest/.latest subfields
WRONG: input declared but absent from globalInputs    -- dead JSON, renders nowhere
WRONG: omitting "options": {"drilldown": "all"}       -- clicks fire nothing without this
```
