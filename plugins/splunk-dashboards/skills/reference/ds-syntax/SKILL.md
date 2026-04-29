---
name: ds-syntax
description: Splunk Dashboard Studio v2 JSON schema reference — top-level keys, dataSources (ds.search / ds.savedSearch / ds.chain / ds.test), visualizations container, inputs and tokens, defaults, expressions, layout (absolute / grid / tabs), drilldowns, and the XML envelope used for file deployment. Use when authoring or editing Dashboard Studio JSON by hand, when ds-create needs field-level detail, or when answering standalone questions about Dashboard Studio syntax. For Dynamic Options Syntax (DOS), see the companion DOS-REFERENCE.md.
---

# ds-syntax — Dashboard Studio JSON reference

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
  "options": { "majorColor": "#d13d3d" }
}
```

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
> rejected with schema error. See `interactivity/ds-inputs`.

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

See `interactivity/ds-defaults`.

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
`interactivity/ds-visibility`.

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
guide in `interactivity/ds-visibility`.

## layout

### Absolute (pixel-based)

```json
"layout": {
  "type": "absolute",
  "options": { "width": 1440, "height": 960 },
  "structure": [
    { "item": "viz_p1", "type": "block",
      "position": { "x": 0, "y": 0, "w": 600, "h": 320 } }
  ]
}
```

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

### Tabbed

Use `tabs` + `layoutDefinitions`. Omit `layout.type` at root. See
`interactivity/ds-tabs`.

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

Full reference in `interactivity/ds-drilldowns`.

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
- `ds-design-principles` — visual hierarchy, when not to use a chart.
- `ds-viz-pitfalls` — cross-skill viz-specific traps matrix.
- `interactivity/ds-tokens` — token consumption.
- `interactivity/ds-inputs` — input declarations.
- `interactivity/ds-defaults` — global defaults block.
- `interactivity/ds-visibility` — `containerOptions.visibility`.
- `interactivity/ds-drilldowns` — `eventHandlers` actions.
- `interactivity/ds-tabs` — tabbed layouts.
