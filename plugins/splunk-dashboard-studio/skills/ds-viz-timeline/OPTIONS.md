# splunk.timeline — full options reference

Source: help.splunk.com Cloud 10.3.2512 docs (timeline is NOT in the
10.4 PDF). Verified empirically against Cloud 10.2.x runtime.

| Property | Type | Default | Notes |
|---|---|---|---|
| `x` | DOS | `> primary \| seriesByType("time")` | x-axis source. |
| `y` | DOS | `> primary \| seriesByPrioritizedTypes("string","number")` | y-axis source. |
| `xField` | string | `> x \| getField()` | x-axis field name. |
| `yField` | string | `> y \| getField()` | y-axis field name. |
| `category` | DOS | `> primary \| seriesByName("category")` | Lane field. **Must be DOS, not plain field name.** |
| `categoryField` | string | `> category \| getField()` | Category field name. |
| `duration` | DOS | `> primary \| seriesByPrioritizedTypes("number","time")` | Interval length in seconds. `0` forces a circle for that row. |
| `durationField` | string | `> duration \| getField()` | Duration field name. |
| `additionalTooltipFields` | string[] | `[]` | Extra fields shown on hover. |
| `backgroundColor` | string (hex) | theme | Events-area tint. |
| `dataColors` | DOS or string[] | falls back to `seriesColors` | Per-event colour via `dataColorConfig`. |
| `dataColorConfig` | array | — | Used by `dataColors` DOS expression. Bands for `rangeValue` or `matchValue` rules. |
| `legendDisplay` | enum | `"off"` | `"right"` \| `"bottom"` \| `"off"`. **Default is `"off"` — unusual; most charts default to visible.** |
| `legendTruncation` | enum | `"ellipsisEnd"` | `"ellipsisEnd"` \| `"ellipsisMiddle"` \| `"ellipsisStart"` \| `"off"`. |
| `resultLimit` | number | `10000` | Max events. **Hard truncation, not top-N** — picks first N rows in source order. |
| `seriesColors` | string[] | Splunk Prisma 20-colour palette | Lane palette. **Must be array, not CSV string.** Maps **alphabetically** to lanes. |
| `yAxisLabelWidth` | number | `100` | px width for lane labels. |

## Two flavours of dynamic colouring

### `rangeValue` — numeric thresholds

Canonical for severity, percent-utilization, latency.

```json
"options": {
  "dataColors": "> primary | seriesByName('cpu_pct') | rangeValue(dataColorConfig)",
  "dataColorConfig": [
    { "to": 30,                "value": "#1F77B4" },
    { "from": 30, "to": 60,    "value": "#FFB627" },
    { "from": 60, "to": 80,    "value": "#FF6B35" },
    { "from": 80,              "value": "#FF2D95" }
  ]
}
```

### `matchValue` — exact string match (with `*` wildcard)

Canonical for status enums where same value must always carry same
colour.

```json
"options": {
  "dataColors": "> primary | seriesByName('status') | matchValue(dataColorConfig)",
  "dataColorConfig": [
    { "match": "deployed",    "value": "#33FF99" },
    { "match": "in_progress", "value": "#7AA2FF" },
    { "match": "failed",      "value": "#FF2D95" },
    { "match": "reverted",    "value": "#FFB627" }
  ]
}
```

Wildcard rules: `*` matches any length. Exact matches win first;
longer / less-wildcarded patterns next; ties resolve in declaration
order.

## Schema gotcha — same as sankey

`seriesColors` and `dataColors` (when used as a literal palette) must
be **JSON arrays**, not CSV strings. Passing `"#aaa,#bbb"` triggers
`must be array / must match pattern "^>.*"`.

## What timeline does NOT have

- **No `dataValuesDisplay`** — no labels per event/bar.
- **No `yAxis*`** — y-axis is the lane index, not a numeric axis.
- **No annotation overlay** — for that, use `splunk.line`.
- **No stacking, no dual axis.**

## Source

- help.splunk.com Cloud 10.3.2512 — `dashboard-studio/visualizations/timelines`.
- Splunk UI Timeline package docs — for the Categorical Timeline
  pattern reference.
