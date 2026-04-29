# Dynamic Options Syntax (DOS) — full reference

DOS is the expression language used in Dashboard Studio to dynamically
configure visualization options based on data. Every DOS expression
starts with `>`.

## Structure

```
"> <data_source> | <selector> | <formatter>"
```

- **Data source**: `primary`, `table`, or a reference to another
  option key defined in `context`.
- **Selectors** pick or reshape data from the source.
- **Formatters** transform the result into a usable value (colour,
  string, number).
- Multiple selectors and formatters can be chained with `|`.

## Selector table

| Selector | Level | Description |
|---|---|---|
| `seriesByName("field")` | DataFrame → DataSeries | Select column by name. |
| `seriesByIndex(n)` | DataFrame → DataSeries | Select column by zero-based index. |
| `seriesByPrioritizedTypes("number","string")` | DataFrame → DataSeries | First column matching given type priority. |
| `frameBySeriesNames("a","b","c")` | DataFrame → DataFrame | Keep only listed columns. |
| `frameWithoutSeriesNames("x","y")` | DataFrame → DataFrame | Drop listed columns. **Used heavily by bubble-map `bubbleSize`.** |
| `frameBySeriesTypes("number")` | DataFrame → DataFrame | Keep only columns matching the type. |
| `firstPoint()` | DataSeries → DataPoint | First value in series. |
| `lastPoint()` | DataSeries → DataPoint | Last value in series. |
| `pointByIndex(n)` | DataSeries → DataPoint | Value at index n. |
| `delta(n)` | DataSeries → DataPoint | Difference between last n points. Negative `n` = "n points back from now". |
| `getField()` | DataPoint → string | Get field name of data point. |
| `getType()` | DataPoint → string | Get data type of data point. |
| `getValue()` | DataPoint → value | Get raw value of data point. |
| `frame(label, value)` | DataFrame | Reshape two columns into a label/value frame. Used for input items. |
| `renameSeries("newName")` | DataSeries → DataSeries | Rename column in-place. |
| `prepend(items)` | DataFrame → DataFrame | Prepend a static frame (e.g. `[["All"], ["*"]]`) to dynamic input items. |
| `objects()` | DataFrame → object[] | Convert frame into `[{label, value}]` array shape that `input.dropdown.options.items` expects. **Always last in dynamic-dropdown chains.** |

## Formatter table

| Formatter | Description | Example |
|---|---|---|
| `rangeValue(config)` | Map numeric ranges to values (e.g. colours). `config` is `[{from, to, value}]`. | `rangeValue(colorConfig)` |
| `matchValue(config)` | Map exact string matches to values. `config` is `[{match, value}]`. Verified working on `splunk.timeline` `dataColors` and `splunk.table` `rowBackgroundColors`. | `matchValue(statusColors)` |
| `gradient(config)` | Smooth-interpolated colour gradient between stops. `config` is `{colors: ["#1F3A5F", "#26A69A", "#FFD166"]}`. | `gradient(usersGradient)` |
| `formatByType(config)` | Format data by type (number, string). `config` is `{"number": {"thousandSeparated": true, "prefix": "$"}}`. | `formatByType(numFormat)` |
| `multiFormat(config)` | Apply different formatters to different columns in a DataFrame. | `multiFormat(colFormats)` |
| `pick(contextVar)` | Cycle / select from a context array. Used for table row-colour stripes. | `pick(rowColorsByTheme)` |
| `prefix("str")` | Prepend a static string to each value. | `prefix("$")` |
| `suffix("str")` | Append a static string to each value. | `suffix(" ms")` |
| `type()` | Return data type of each element as a string. | `> primary \| seriesByIndex(0) \| type()` |

## `context` configuration store

The `context` block on a visualization stores named configuration
objects referenced by DOS expressions:

```json
"viz_kpi": {
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_count" },
  "options": {
    "majorColor": "> primary | seriesByName('count') | lastPoint() | rangeValue(colorConfig)"
  },
  "context": {
    "colorConfig": [
      { "to": 100,             "value": "#dc4e41" },
      { "from": 100, "to": 500,"value": "#f1813f" },
      { "from": 500,           "value": "#54a353" }
    ]
  }
}
```

### `rangeValue` semantics — top-down, half-open

Each entry: `{from, to, value}`.

- `to: X` is **exclusive** (matches `< X`).
- `from: X` is **inclusive** (matches `>= X`).
- Top-down evaluation; **first match wins**.

**Disjoint, gap-free buckets are mandatory.** Overlapping
`[{to:70}, {from:60, to:80}, {from:70}]` makes the second bucket
unreachable. Gaps `[{to:60}, {from:80}]` route values 60–79 to no
bucket → fallback colour.

Canonical RAG shape:

```json
[
  { "to": 60,             "value": "#FF2D95" },
  { "from": 60, "to": 80, "value": "#FFB627" },
  { "from": 80,           "value": "#33FF99" }
]
```

Verify with at least one demo value per bucket.

### `matchValue` wildcard rules

- `*` matches any number of characters.
- Exact matches win first.
- Longer / less-wildcarded patterns win next.
- Ties resolve in declaration order.

## Escaping

Backslash to escape `$` inside DOS strings (no token substitution):

```json
"> primary | seriesByName('count') | prefix('\\$')"
```

String arguments inside DOS use `\"` for double-quoted strings, or
single-quote wrappers `'field'`.

## Common DOS recipes

### Singlevalue with thresholded colour

```json
"options": {
  "majorColor": "> primary | seriesByName('value') | lastPoint() | rangeValue(thresholds)"
},
"context": {
  "thresholds": [
    { "to": 60,             "value": "#FF2D95" },
    { "from": 60, "to": 80, "value": "#FFB627" },
    { "from": 80,           "value": "#33FF99" }
  ]
}
```

### Bubble map size + colour

```json
{
  "type": "bubble",
  "bubbleSize": "> primary | frameWithoutSeriesNames('geobin', 'latitude', 'longitude') | frameBySeriesTypes('number')",
  "dataColors": "> dataValues | rangeValue(dataColorsEditorConfig)"
}
```

Note: `dataValues` (not `seriesByName(...)`) — bubble-specific token.

### Dynamic dropdown items with "All" sentinel

```json
"items": "> primary | frame(label, value) | prepend(formattedStatics) | objects()",
"context": {
  "formattedConfig": { "number": { "prefix": "" } },
  "formattedStatics": "> statics | formatByType(formattedConfig)",
  "statics": [["All"], ["*"]],
  "label": "> primary | seriesByName('label') | renameSeries('label') | formatByType(formattedConfig)",
  "value": "> primary | seriesByName('label') | renameSeries('value') | formatByType(formattedConfig)"
}
```

### Table row tinting (heatmap pattern)

```json
"tableFormat": {
  "rowBackgroundColors": "> table | seriesByName('_color_rank') | rangeValue(rowBg)"
}
```

`_color_rank` is computed upstream in SPL. Half-step thresholds
(`1.5`, `2.5`) so integer ranks land cleanly. See `ds-viz-table`.

### Sparkline per-column colour

```json
"columnFormat": {
  "trend_cpu": { "sparklineColors": ["#33FF99"] },
  "trend_mem": { "sparklineColors": ["#7AA2FF"] }
}
```

`columnFormat` is the **only** way to get per-column sparkline colour.
`tableFormat.sparklineColors` distributes per-row, not per-column. See
`ds-viz-table`.

### Boundary-test demo data

```json
"context": {
  "thresholds": [
    { "to": 60,             "value": "#FF2D95" },
    { "from": 60, "to": 80, "value": "#FFB627" },
    { "from": 80,           "value": "#33FF99" }
  ]
}
```

Drive demo with values `20, 60, 95` to exercise all three buckets.
Demo with `20, 95` only and the middle bucket is never tested.
