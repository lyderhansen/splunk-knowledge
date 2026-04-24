---
name: ds-syntax
description: Reference skill documenting the Splunk Dashboard Studio (v2) JSON schema. Covers top-level keys, dataSources (ds.search, ds.savedSearch, ds.chain, ds.test), visualizations container shape, inputs and token definitions, defaults, layout structures (absolute, grid, tabs), drilldowns, Dynamic Options Syntax (DOS), token filters, color palette, and the XML envelope used for file deployment. Use this skill when authoring or editing Dashboard Studio JSON by hand, when ds-create needs field-level detail, or when answering standalone questions about Dashboard Studio syntax.
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

### `ds.test` — inline mock data

Provides static inline data for prototyping without dispatching a real search. Use it to build and test layout and DOS expressions before wiring up live SPL.

Data is in columnar format: `fields` is an array of `{name, type}` descriptors; `columns` is a parallel array of value arrays (one per field).

```json
"ds_mock": {
  "type": "ds.test",
  "name": "Mock Category Data",
  "options": {
    "data": {
      "fields": [
        {"name": "category", "type": "string"},
        {"name": "count",    "type": "number"}
      ],
      "columns": [
        ["web", "api", "db"],
        [120, 85, 45]
      ]
    }
  }
}
```

Intended for prototyping only. Replace with `ds.search` or `ds.savedSearch` before production deployment.

### Base Search + Chain pattern

One `ds.search` is dispatched once; multiple `ds.chain` entries each extend it with a different post-process SPL. Every chained search reuses the already-fetched result set, so only a single search job is counted against concurrency limits. Ideal when several visualizations need variations of the same base data.

```json
"dataSources": {
  "ds_base": {
    "type": "ds.search",
    "name": "Firewall Base Search",
    "options": {
      "query": "index=firewall | stats count by src_ip, action, dest_port",
      "queryParameters": {
        "earliest": "$global_time.earliest$",
        "latest": "$global_time.latest$"
      }
    }
  },
  "ds_allowed": {
    "type": "ds.chain",
    "name": "Allowed Traffic Top 10",
    "options": {
      "extend": "ds_base",
      "query": "| where action=\"allowed\" | sort -count | head 10"
    }
  },
  "ds_blocked": {
    "type": "ds.chain",
    "name": "Blocked Traffic Top 10",
    "options": {
      "extend": "ds_base",
      "query": "| where action=\"blocked\" | sort -count | head 10"
    }
  }
}
```

Why: one search dispatched, many views. Avoids redundant search concurrency.

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
    "options": { "token": "global_time", "defaultValue": "-24h@h,now" }
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

> **CRITICAL — `input.timerange` defaultValue format.** Use the comma-separated string form `"-24h@h,now"` (matching Splunk's canonical skeleton). The object form `{"earliest": "-24h", "latest": "now"}` renders on some versions but silently fails on others — the picker shows but searches never receive the tokens. When in doubt, use string form.

### Multiselect

`input.multiselect` allows the user to pick multiple values simultaneously. The token receives all selected values. Use the `formattedStatics` + `objects()` pattern (same as dynamic dropdown) when mixing static and search-populated options.

```json
"input_status": {
  "type": "input.multiselect",
  "title": "Status Codes",
  "options": {
    "token": "status",
    "defaultValue": ["200", "201"],
    "items": [
      {"label": "200 OK",       "value": "200"},
      {"label": "201 Created",  "value": "201"},
      {"label": "404 Not Found","value": "404"},
      {"label": "500 Error",    "value": "500"}
    ]
  }
}
```

`defaultValue` is an array for multiselect. In SPL, reference as `$status$`; the token expands to a comma-separated quoted list when used in `IN()`.

### Text input

`input.text` renders a free-text field. The token value is whatever the user types.

```json
"input_search_text": {
  "type": "input.text",
  "title": "Search Filter",
  "options": {
    "token": "search_text",
    "defaultValue": "*"
  }
}
```

Use `$search_text$` in SPL to inject the value. Apply the `|s` token filter when inserting into search strings to prevent injection: `$search_text|s$`.

### Dynamic dropdown

Populate dropdown items from a dataSource using a DOS expression on `options.items`. The search must produce `label` and `value` columns. Use the `frame(label, value)` selector followed by `prepend(formattedStatics) | objects()` to merge static options (e.g., "All") with search results.

```json
"input_host": {
  "type": "input.dropdown",
  "title": "Host",
  "dataSources": {
    "primary": "ds_hosts"
  },
  "options": {
    "token": "host_filter",
    "defaultValue": "*",
    "items": "> primary | frame(label, value) | prepend(formattedStatics) | objects()"
  },
  "context": {
    "formattedConfig": {
      "number": {"prefix": ""}
    },
    "formattedStatics": "> statics | formatByType(formattedConfig)",
    "statics": [["All"], ["*"]],
    "label": "> primary | seriesByName(\"label\") | renameSeries(\"label\") | formatByType(formattedConfig)",
    "value": "> primary | seriesByName(\"label\") | renameSeries(\"value\") | formatByType(formattedConfig)"
  }
}
```

The SPL for `ds_hosts` must produce `label` and `value` fields:
```spl
index=main | stats count by host | rename host AS label | eval value=label | fields label, value
```

## defaults

Top-level defaults (most commonly used to wire the global time input to every `ds.search`). Key the block under `"ds.search"` — this is the type-level default and applies to every search.

```json
"defaults": {
  "dataSources": {
    "ds.search": {
      "options": {
        "queryParameters": {
          "earliest": "$global_time.earliest$",
          "latest": "$global_time.latest$"
        }
      }
    }
  }
}
```

> **CRITICAL — rely on `defaults`, don't set `queryParameters` per search.** When a global time input exists, put `queryParameters` in `defaults.dataSources."ds.search".options.queryParameters`. Do NOT also set `queryParameters` on individual `ds.search` entries — the per-search version silently overrides the default and any later change to the default stops taking effect.

### End-to-end: global time picker wiring

Getting the time picker to actually control searches requires three coordinated pieces. All three must be present, or the picker appears but does nothing.

1. **Declare the input** (pick any id; the `token` is what SPL references):
   ```json
   "inputs": {
     "input_global_time": {
       "type": "input.timerange",
       "title": "Time range",
       "options": { "token": "global_time", "defaultValue": "-24h@h,now" }
     }
   }
   ```
2. **Wire it via `defaults`** (applies to every `ds.search` — see example above).
3. **Expose it on the layout** so it renders at the top of the dashboard:
   ```json
   "layout": { "globalInputs": ["input_global_time"], ... }
   ```

Only step 3 makes the picker visible; only step 2 makes searches react to it. Miss either and the dashboard looks correct but the time control is a no-op.

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

### Tabbed layout

Use `tabs` + `layoutDefinitions` to create a multi-tab dashboard. Each tab references a named layout definition by `layoutId`. The `tabs` object has an `items` array of `{label, layoutId}` pairs. Each `layoutDefinitions` entry can be `"type": "grid"` or `"type": "absolute"`.

```json
"layout": {
  "globalInputs": ["input_global_trp"],
  "tabs": {
    "items": [
      {"layoutId": "layout_overview", "label": "Overview"},
      {"layoutId": "layout_details",  "label": "Details"},
      {"layoutId": "layout_threats",  "label": "Threats"}
    ],
    "options": {
      "barPosition": "top",
      "showTabBar": true
    }
  },
  "layoutDefinitions": {
    "layout_overview": {
      "type": "grid",
      "structure": [
        {"item": "viz_1", "type": "block", "position": {"x": 0, "y": 0, "w": 1200, "h": 300}}
      ]
    },
    "layout_details": {
      "type": "grid",
      "structure": [
        {"item": "viz_2", "type": "block", "position": {"x": 0, "y": 0, "w": 1200, "h": 400}}
      ]
    }
  }
}
```

Note: absolute layout requires the `layoutDefinitions` + `tabs` wrapper even for single-tab dashboards.

### Line connections (absolute only)

In absolute layout, structure entries of `"type": "line"` draw connector lines between two visualizations. The `position.from` and `position.to` objects reference a viz id plus a compass port (`"n"`, `"s"`, `"e"`, `"w"`).

```json
{
  "item": "viz_line1",
  "type": "line",
  "position": {
    "from": {"item": "viz_box1", "port": "s"},
    "to":   {"item": "viz_box2", "port": "n"}
  }
}
```

The `viz_line1` item must correspond to a `splunk.line` (shape) visualization in the `visualizations` section (for styling stroke color, width, arrow heads, etc.).

## drilldowns

Per-visualization click-through behavior. Declared via `eventHandlers` on the visualization, or via legacy `options.drilldown` / `options.drilldownAction`. The `eventHandlers` array is preferred.

### 1. setToken on click

Capture a clicked row value into a dashboard token. Use `drilldown.setToken` with `key: "row.<field>.value"`.

```json
"viz_table": {
  "type": "splunk.table",
  "options": {
    "drilldown": "all"
  },
  "eventHandlers": [
    {
      "type": "drilldown.setToken",
      "options": {
        "tokens": [
          {
            "token": "selected_host",
            "key": "row.host.value"
          }
        ]
      }
    }
  ]
}
```

`drilldown: "all"` enables click events on any cell. Use `"row"` to restrict to row clicks only. After the click, `$selected_host$` is set and any visualization bound to it will re-query.

### 2. link.url — external URL with row interpolation

Open an external URL, injecting row field values via token syntax. Apply `|u` filter to URL-encode values safely.

```json
"eventHandlers": [
  {
    "type": "drilldown.customUrl",
    "options": {
      "url": "https://example.com/investigate?host=$row.host.value|u$&action=$row.action.value|u$",
      "newTab": true
    }
  }
]
```

### 3. link.dashboard — navigate to another dashboard

Navigate to a different Dashboard Studio dashboard, optionally passing token values as URL parameters.

```json
"eventHandlers": [
  {
    "type": "drilldown.linkToDashboard",
    "options": {
      "app": "search",
      "dashboard": "host_detail_view",
      "newTab": true,
      "tokens": {
        "form.host": "$row.host.value$",
        "form.earliest": "$global_time.earliest$"
      }
    }
  }
]
```

`app` is the Splunk app name. `dashboard` is the dashboard id (filename without `.xml`).

### 4. link.search — open Splunk search UI

Launch the Splunk Search app with a pre-filled SPL query and time range.

```json
"eventHandlers": [
  {
    "type": "drilldown.linkToSearch",
    "options": {
      "query": "index=main host=$row.host.value$ | stats count by sourcetype",
      "earliest": "$global_time.earliest$",
      "latest": "$global_time.latest$",
      "newTab": true
    }
  }
]
```

### 5. Conditional visibility

Show or hide a visualization based on a token value. Use the `visibility` property on the visualization (absolute layout) or wrap in a conditional layout item.

```json
"viz_details_panel": {
  "type": "splunk.table",
  "title": "Host Details",
  "dataSources": {"primary": "ds_host_detail"},
  "options": {},
  "visibility": "$selected_host$!=\"\""
}
```

`visibility` is a boolean expression string. Common patterns:
- `"$token$==\"value\""` — show when token equals a specific value
- `"$token$!=\"\""` — show when token is set (non-empty)
- `"$token$==\"\""` — show only when token is unset (default state)

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

## Dynamic Options Syntax (DOS)

DOS is the expression language used in Dashboard Studio to dynamically configure visualization options based on data. Every DOS expression starts with `>`.

### Structure

```
"> <data_source> | <selector> | <formatter>"
```

- Data source: `primary`, `table`, or a reference to another option key defined in `context`.
- Selectors pick or reshape data from the source.
- Formatters transform the result into a usable value (color, string, number).
- Multiple selectors and formatters can be chained with `|`.

### Selector table

| Selector | Level | Description |
|---|---|---|
| `seriesByName("field")` | DataFrame → DataSeries | Select a column by name |
| `seriesByIndex(n)` | DataFrame → DataSeries | Select a column by zero-based index |
| `seriesByPrioritizedTypes("number","string")` | DataFrame → DataSeries | Select first column matching given type priority |
| `firstPoint()` | DataSeries → DataPoint | First value in the series |
| `lastPoint()` | DataSeries → DataPoint | Last value in the series |
| `pointByIndex(n)` | DataSeries → DataPoint | Value at index n |
| `delta(n)` | DataSeries → DataPoint | Difference between last n points |
| `getField()` | DataPoint → string | Get field name of the data point |
| `getType()` | DataPoint → string | Get data type of the data point |
| `getValue()` | DataPoint → value | Get the raw value of the data point |
| `pick(contextVar)` | any | Pick a value from a context variable |
| `frame(label, value)` | DataFrame | Create label/value pairs (used for input items) |

### Formatter table

| Formatter | Description | Example |
|---|---|---|
| `rangeValue(config)` | Map numeric ranges to values (e.g., colors). `config` is a context array of `{from, to, value}` entries. | `rangeValue(colorConfig)` |
| `matchValue(config)` | Map exact string matches to values. **BROKEN — causes `e.map is not a function` at runtime. Use `rangeValue` with a numeric rank field instead.** | — |
| `formatByType(config)` | Format data by type (number, string). `config` is a context object like `{"number": {"thousandSeparated": true}}`. | `formatByType(numFormat)` |
| `prefix("str")` | Prepend a static string to each value. | `prefix("$")` |
| `suffix("str")` | Append a static string to each value. | `suffix(" ms")` |
| `prepend(items)` | Prepend items to a list (used for static options in inputs). | `prepend(staticItems)` |
| `multiFormat(config)` | Apply different formatters to different columns in a DataFrame. | `multiFormat(colFormats)` |
| `type()` | Return the data type of each element as a string. | `> primary \| seriesByIndex(0) \| type()` |

### `context` configuration store

The `context` block on a visualization stores named configuration objects referenced by DOS expressions. Declare color range configs, format configs, and static data here.

```json
"viz_kpi": {
  "type": "splunk.singlevalue",
  "dataSources": {"primary": "ds_count"},
  "options": {
    "majorColor": "> primary | seriesByName(\"count\") | lastPoint() | rangeValue(colorConfig)"
  },
  "context": {
    "colorConfig": [
      {"value": "#dc4e41", "to": 100},
      {"value": "#f1813f", "from": 100, "to": 500},
      {"value": "#54a353", "from": 500}
    ]
  }
}
```

Each `colorConfig` entry specifies `from` (inclusive lower bound), `to` (exclusive upper bound), and `value` (the output, typically a hex color). Omit `from` on the first entry and `to` on the last.

### Escaping note

Use a backslash to escape `$` inside DOS strings when you do not want token substitution:

```
"> primary | seriesByName(\"count\") | prefix(\"\$\")"
```

String arguments inside DOS use `\"` for double-quoted strings, or single-quote wrappers `'field'`.

## Token filters

Apply filters after the token name with `|`:

| Syntax | Filter | Use case |
|---|---|---|
| `$token|h$` | HTML escape | Prevents XSS when injecting token values into `splunk.markdown` or text panels |
| `$token|u$` | URL encode | Required for token values inserted into `link.url` targets |
| `$token|s$` | Raw string (default) | No transformation; safe for SPL search strings |

Example: `https://example.com/search?q=$search_term|u$`

## Default color palette

The Dashboard Studio dark-theme default palette (20 colors, in order):

```
#7B56DB  #009CEB  #00CDAF  #DD9900  #FF677B
#CB2196  #813193  #0051B5  #008C80  #99B100
#FFA476  #FF6ACE  #AE8CFF  #00689D  #00490A
#465D00  #9D6300  #F6540B  #FF969E  #E47BFE
```

Semantic color conventions (dark theme):

| Semantic meaning | Color | Hex |
|---|---|---|
| Healthy / success | Green | `#54a353` |
| Critical / failure | Red | `#dc4e41` |
| Warning | Orange | `#f1813f` |
| Info / neutral | Blue | `#006eb9` |
| Caution / medium | Yellow | `#f8be34` |

These map directly to the `value` field in `rangeValue` context configs and to `majorColor` / `seriesColors` options.

## When to use this skill standalone

- "How do I define a dropdown input?" — section `inputs and tokens`.
- "What's the difference between ds.search and ds.chain?" — section `dataSources`.
- "How do drilldowns work?" — section `drilldowns`.

For per-visualization options (e.g., what fields does `splunk.pie` accept?), invoke `ds-viz`.
