---
name: ds-ref-syntax
description: Splunk Dashboard Studio v2 JSON schema reference — top-level keys, dataSources (ds.search / ds.savedSearch / ds.chain / ds.test), visualizations container, inputs and tokens, defaults, expressions, layout (absolute / grid / tabs), drilldowns, and the XML envelope used for file deployment. Use when authoring or editing Dashboard Studio JSON by hand, when ds-create needs field-level detail, or when answering standalone questions about Dashboard Studio syntax. For Dynamic Options Syntax (DOS), see the companion DOS-REFERENCE.md.
---

# ds-ref-syntax — Dashboard Studio JSON reference

## Visualization ID naming convention

Splunk's editor (and likely future strict validators) emit:

> "Visualization IDs must start with `viz_` and contain only letters, numbers, dash, and underscore."

**Rule:** every key under `visualizations` and every `dataSources` key should match `^[a-zA-Z0-9_-]+$` AND every visualization ID should start with `viz_`. Same applies to layout `structure[].item` references — they must match the visualization key.

```json
// ✅ Conformant
"visualizations": {
  "viz_kpi_critical": { ... },
  "viz_card_kpi_critical": { ... },
  "viz_shadow_kpi_critical": { ... }
}

// ❌ Non-conformant — no viz_ prefix
"visualizations": {
  "kpi_critical": { ... },
  "shadow_kpi_critical": { ... }
}
```

**Status on 10.2.1 / 10.4.2604:** non-prefixed IDs currently render successfully (confirmed empirically) but the editor's validator warns. Treat the `viz_` prefix as forward-compatible best practice — strict validation may be enforced in future versions.

**dataSource IDs** have a separate naming rule: `[A-Za-z0-9 -_.]` per ds-viz-table. Slashes, parentheses, and `/` break the data-source picker even though the JSON parses.

## Top-level keys

A Dashboard Studio definition is a JSON object with these keys:

| Key | Type | Required | Purpose |
|---|---|---|---|
| `title` | string | yes | Dashboard title shown in the UI. |
| `description` | string | no | Subtitle / description. |
| `theme` | string | no | `"light"` or `"dark"` (also settable in XML envelope). |
| `dataSources` | object | yes | Named searches. |
| `visualizations` | object | yes | Panels, keyed by id. |
| `inputs` | object | no | User-facing filters (tokens). |
| `defaults` | object | no | Default options for `dataSources` / `visualizations` types and initial token values (`defaults.tokens.default.<name>.value`). |
| `expressions` | object | no | Named visibility conditions (`expressions.conditions`) and named token-eval expressions (`expressions.eval`). |
| `layout` | object | yes | Grid structure placing visualizations on screen. |

## dataSources

> **Hard rule — `name` field character set.** The user-facing `name`
> field on every dataSource is validated against
> `^[A-Za-z0-9 \-_.]+$`. Letters, numbers, spaces, dashes, underscores,
> periods only. Any other character (`/` `:` `()` `[]` `|` `,` `?` `&`
> `+` `*` `=` `'` `"`, smart quotes, non-ASCII) is rejected.
>
> The JSON object key (`"ds_alerts":`) is internal and follows
> JS-identifier rules. Don't confuse the two.

### `ds.search` — SPL

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

### `ds.savedSearch`

```json
"ds_2": {
  "type": "ds.savedSearch",
  "name": "Weekly report",
  "options": { "ref": "Weekly Auth Report" }
}
```

### `ds.chain` — post-process another data source

```json
"ds_3": {
  "type": "ds.chain",
  "options": {
    "extend": "ds_1",
    "query": "| head 10"
  }
}
```

### `ds.test` — inline mock data

Columnar format. Prototyping only — replace before production.

```json
"ds_mock": {
  "type": "ds.test",
  "options": {
    "data": {
      "fields": [
        { "name": "category", "type": "string" },
        { "name": "count",    "type": "number" }
      ],
      "columns": [
        ["web", "api", "db"],
        [120, 85, 45]
      ]
    }
  }
}
```

### Base-search + chain pattern

One `ds.search` dispatched once; multiple `ds.chain` extend it with
different post-process SPL. Single search job against concurrency
limits. Ideal when several visualizations need variations of the same
base data.

## visualizations

```json
"viz_p1": {
  "type": "splunk.singlevalue",
  "title": "Failed Logins",
  "description": "Last 24 hours",
  "dataSources": { "primary": "ds_1" },
  "options": { "majorColor": "#d13d3d" },
  "cornerRadius": [12, 12, 12, 12]
}
```

> **Top-level vs `options` placement.** Most viz keys go inside
> `options`. A few render-affecting keys live at the **top level**
> (peer of `type` / `options` / `dataSources`):
>
> - `cornerRadius` — rounded panel chrome. Inside `options` is silently
>   ignored on 10.2.1, the editor emits it at top level. See
>   `ds-viz-singlevalue` OPTIONS.
> - `dataSources`, `eventHandlers`, `context`, `containerOptions`,
>   `showProgressBar`, `showLastUpdated`, `title`, `description` —
>   structural keys, top level by design.
>
> When in doubt: copy a pattern from the editor (Source view), don't
> guess.

For per-type options, see the appropriate `ds-viz-<type>` skill.

## inputs and tokens

```json
"inputs": {
  "input_timerange": {
    "type": "input.timerange",
    "title": "Time range",
    "options": { "token": "global_time", "defaultValue": "-24h@h,now" }
  }
}
```

Reference tokens in SPL as `$token_name$`. For timerange inputs, use
`$<token>.earliest$` / `$<token>.latest$`.

> **CRITICAL — `input.timerange.defaultValue` MUST be a comma-separated
> string.** Object form `{"earliest": "...", "latest": "..."}` is
> rejected with schema error. See `ds-int-inputs`.

## defaults

Type-level default applied to every search:

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

Plus default token values:

```json
"defaults": {
  "tokens": {
    "default": {
      "selected_host": { "value": "" }
    }
  }
}
```

See `ds-int-defaults`.

## expressions

```json
"expressions": {
  "conditions": {
    "condition_host_set": {
      "name": "host is set",
      "value": "$selected_host$ != \"\""
    }
  },
  "eval": {
    "expr_label": {
      "name": "trendBtnLabel",
      "value": "$showTrend$ = 'true' ? 'Show metrics' : 'Show trends'"
    }
  }
}
```

### Conditions — visibility predicates

| Operator | Meaning |
|---|---|
| `=` | Equals (single equals; `==` not accepted). |
| `!=` | Not equals. |
| `and` / `or` / `not` | Lowercase Boolean. |
| `()` | Grouping. |
| `isSet($tok$)` | Cloud-only. **Enterprise 10.2.x rejects.** Use `$tok$ != ""` for portability. |

Token references inside conditions are **bare**: `$selected_host$ =
"web-01"`, NOT `"$selected_host$" = "web-01"`. See
`ds-int-visibility`.

### Eval — derived token values

JSONata expressions. Reference result as `$eval:<name>$`.

## visibility (under `containerOptions`)

```json
"viz_x": {
  "containerOptions": {
    "visibility": {
      "showConditions": ["condition_host_set"],
      "hideConditions": ["condition_in_maintenance"],
      "showWhenConditions": "all-true",
      "hideWhenNoData": true,
      "hideInViewMode": true
    }
  }
}
```

`visibility` at the panel root is rejected with `must NOT have
additional properties`. Always nest under `containerOptions`. Full
guide in `ds-int-visibility`.

## layout

### Absolute (pixel-based)

```json
"layout": {
  "globalInputs": [],
  "tabs": {
    "items": [
      { "layoutId": "layout_main", "label": "Main" }
    ],
    "options": { "barPosition": "top", "showTabBar": false }
  },
  "layoutDefinitions": {
    "layout_main": {
      "type": "absolute",
      "options": { "width": 1920, "height": 1080 },
      "structure": [
        { "item": "viz_p1", "type": "block",
          "position": { "x": 0, "y": 0, "w": 600, "h": 320 } }
      ]
    }
  }
}
```

**CRITICAL:** The `tabs` + `layoutDefinitions` wrapper is mandatory for
ALL dashboards — even single-page layouts with no visible tabs. Set
`"showTabBar": false` to hide the tab bar. The flat format
(`"layout": { "type": "absolute", ... }`) is rejected by the current
schema validator. `layout.options` only accepts `width` and `height` —
for canvas background color, use a full-canvas `splunk.rectangle` as
the first item in `structure`.

### Grid (row-oriented)

```json
"layout": {
  "type": "grid",
  "structure": [
    { "type": "row",
      "items": [
        { "item": "viz_p1", "width": 50 },
        { "item": "viz_p2", "width": 50 }
      ] }
  ]
}
```

### Tabbed (multi-page)

The same `tabs` + `layoutDefinitions` structure as absolute above, but
with multiple layout entries and `"showTabBar": true`. See `ds-int-tabs`
for full patterns.

**Note:** `tabs` + `layoutDefinitions` is the ONLY valid layout format.
Both single-page (absolute, grid) and multi-page dashboards use it.

### Line connections (absolute only)

```json
{
  "item": "viz_line1",
  "type": "line",
  "position": {
    "from": { "item": "viz_box1", "port": "s" },
    "to":   { "item": "viz_box2", "port": "n" }
  }
}
```

`viz_line1` must be a `splunk.line` (shape) viz for stroke styling.

## drilldowns

Use `eventHandlers` array (legacy `options.drilldown` /
`options.drilldownAction` deprecated):

- `drilldown.setToken` — capture click context.
- `drilldown.linkToSearch` — open Splunk search prefilled.
- `drilldown.linkToDashboard` — navigate, optionally pass tokens
  (**array shape**, not map).
- `drilldown.customUrl` — open external URL (use `|u` filter).

Full reference in `ds-int-drilldowns`.

## XML envelope (deployment)

```xml
<dashboard version="2" theme="dark">
  <label>Failed Logins Dashboard</label>
  <description>Monitors auth failures</description>
  <definition><![CDATA[
    { ...JSON definition... }
  ]]></definition>
</dashboard>
```

- `version="2"` marks Dashboard Studio (not Classic Simple XML).
- `theme` overrides JSON's `theme`.
- JSON goes inside `<![CDATA[...]]>`.

## Default colour palette

Dashboard Studio dark-theme default palette (20 colours, in order):

```
#7B56DB  #009CEB  #00CDAF  #DD9900  #FF677B
#CB2196  #813193  #0051B5  #008C80  #99B100
#FFA476  #FF6ACE  #AE8CFF  #00689D  #00490A
#465D00  #9D6300  #F6540B  #FF969E  #E47BFE
```

Semantic conventions (dark theme):

| Semantic | Hex |
|---|---|
| Healthy / success | `#54a353` |
| Critical / failure | `#dc4e41` |
| Warning | `#f1813f` |
| Info / neutral | `#006eb9` |
| Caution / medium | `#f8be34` |

## Token filters

| Syntax | Filter | Use |
|---|---|---|
| `$token\|h$` | HTML escape | XSS-safe markdown injection. |
| `$token\|u$` | URL encode | `customUrl` interpolation. |
| `$token\|s$` | Quote each value | Multiselect into SPL `IN()`. |

Canonical multiselect pattern:

```spl
| where field IN ($tok|s$) OR ("$tok$" = "*")
```

## See also

- [DOS-REFERENCE.md](DOS-REFERENCE.md) — companion. Selectors,
  formatters, escaping, `context` configuration store.
- `ds-ref-design-principles` — visual hierarchy, when not to use a chart.
- `ds-ref-pitfalls` — cross-skill traps matrix (viz + interactivity + schema).
- `ds-int-tokens` — token consumption.
- `ds-int-inputs` — input declarations.
- `ds-int-defaults` — global defaults block.
- `ds-int-visibility` — `containerOptions.visibility`.
- `ds-int-drilldowns` — `eventHandlers` actions.
- `ds-int-tabs` — tabbed layouts.
