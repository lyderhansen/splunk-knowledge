---
name: ds-viz-scatter
description: |
  splunk.scatter - shows the relationship between two numeric dimensions
  with optional categorical split. Three DOS bindings: x, y, category.
  Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_scatter_dark
  - ds_viz_scatter_light
---

# splunk.scatter

A scatter chart plots discrete points across two numeric axes. A third categorical field optionally splits the points into series, each with its own color.

## When to use it

| Story                                    | Pick                |
| ---------------------------------------- | ------------------- |
| Relationship between two numeric values  | `splunk.scatter`    |
| Same, but third dimension as marker size | `splunk.bubble`     |
| Density / categorical heatmap by hour    | `splunk.punchcard`  |
| Many dimensions per row                  | `splunk.parallelcoordinates` |
| Time on x-axis                           | `splunk.line` (preferred) |

Pick `splunk.scatter` when:

- Both x and y are **numeric** (not time, not categorical text).
- You want to see **clusters, outliers, or correlations**.
- Third field as **category color** is useful (status, service, segment).

## Data shape

```spl
... | table <x_field> <y_field> [<category_field>]
```

The PDF canonical example:

```spl
index=_internal sourcetype=splunkd_access
| stats count by status, date_hour
| table date_hour count status
```

`x` defaults to column 0, `y` to column 1, `category` to column 2 - so column ordering matters when you don't bind them explicitly.

## Options (verified against 10.4 PDF)

### DOS bindings

| Option          | Type             | Default                              | Notes                                     |
| --------------- | ---------------- | ------------------------------------ | ----------------------------------------- |
| `x`             | DOS string       | `> primary \| seriesByIndex(0)`      | Numeric x-axis values                     |
| `y`             | DOS string       | `> primary \| seriesByIndex(1)`      | Numeric y-axis values                     |
| `category`      | DOS string       | `> primary \| seriesByIndex(2)`      | Optional - splits points into series      |
| `xField`        | string           | `> x \| getField()`                  | Field label for x; auto from binding      |
| `yField`        | string           | `> y \| getField()`                  | Field label for y                         |
| `categoryField` | string           | `> category \| getField()`           | Field label for category                  |

### Markers + result limit

| Option        | Type   | Default | Notes                                           |
| ------------- | ------ | ------- | ----------------------------------------------- |
| `markerSize`  | number | 4       | Increase for low point counts; 6-10 reads well  |
| `resultLimit` | number | 50000   | Hard cap on points sent to the renderer         |

### Color

| Option                | Type     | Default                                              | Notes                                          |
| --------------------- | -------- | ---------------------------------------------------- | ---------------------------------------------- |
| `seriesColors`        | string[] | `#7B56DB,#009CEB,#00CDAF,#DD9900,#FF677B,...`        | Maps to series in **alphabetical** category order |
| `seriesColorsByField` | object   | -                                                    | `{ "api": "#7AA2FF", "db": "#FF2D95" }` - locks color to value |
| `backgroundColor`     | string   | theme default                                        | Panel background                                |

### Legend

| Option             | Type        | Default       | Values                                                          |
| ------------------ | ----------- | ------------- | --------------------------------------------------------------- |
| `legendDisplay`    | string enum | `"right"`     | `"right"`, `"left"`, `"top"`, `"bottom"`, `"off"`               |
| `legendTruncation` | string enum | `"ellipsisEnd"` | `"ellipsisEnd"`, `"ellipsisMiddle"`, `"ellipsisStart"`, `"ellipsisOff"` |

### Axes (mirrored x and y)

| Option                          | Type          | Default | Notes                                           |
| ------------------------------- | ------------- | ------- | ----------------------------------------------- |
| `xAxisMin` / `yAxisMin`         | string\|number | `"auto"` | Lock axis floor                                 |
| `xAxisMax` / `yAxisMax`         | string\|number | `"auto"` | Lock axis ceiling                               |
| `xAxisScale` / `yAxisScale`     | enum          | `"linear"` | `"linear"` or `"log"` - log when range spans orders of magnitude |
| `xAxisAbbreviation` / `yAxisAbbreviation` | enum | x: `"off"`, y: `"auto"` | `"auto"` enables 1.2k, 3M shorthand           |
| `showXAxisExtendedRange`        | boolean       | TRUE    | Adds breathing room beyond min/max              |
| `showYAxisExtendedRange`        | boolean       | TRUE    |                                                 |
| `showXAxisWithZero`             | boolean       | FALSE   | Force include zero on the axis                  |
| `showYAxisWithZero`             | boolean       | FALSE   |                                                 |
| `showRoundedXAxisLabels`        | boolean       | FALSE   | Round x-axis tick labels                        |
| `showYMajorGridLines`           | boolean       | TRUE    |                                                 |
| `showXMinorGridLines`           | boolean       | FALSE   |                                                 |
| `showYMinorGridLines`           | boolean       | FALSE   | Set TRUE only on log scales when needed         |
| `xAxisLabelRotation`            | enum          | 0       | `-90`, `-45`, `0`, `45`, `90`                   |
| `xAxisLabelVisibility`          | enum          | `"auto"` | `"auto"`, `"show"`, `"hide"`                   |
| `yAxisLabelVisibility`          | enum          | `"auto"` |                                                 |
| `xAxisLineVisibility`           | enum          | `"hide"` | `"show"`, `"hide"` (axis line itself)          |
| `yAxisLineVisibility`           | enum          | `"hide"` |                                                 |
| `xAxisMajorTickInterval`        | string\|number | `"auto"` |                                                 |
| `yAxisMajorTickInterval`        | string\|number | `"auto"` |                                                 |
| `xAxisMajorTickSize` / `yAxisMajorTickSize` | number | 6   |                                                 |
| `xAxisMinorTickSize` / `yAxisMinorTickSize` | number | 6   |                                                 |
| `xAxisMajorTickVisibility`      | enum          | `"auto"` | `"auto"`, `"show"`, `"hide"`                   |
| `yAxisMajorTickVisibility`      | enum          | `"auto"` |                                                 |
| `xAxisMinorTickVisibility`      | enum          | `"auto"` |                                                 |
| `yAxisMinorTickVisibility`      | enum          | `"auto"` |                                                 |
| `xAxisTitleText`                | string        | -       | Title under the x-axis                          |
| `yAxisTitleText`                | string        | -       | Title alongside the y-axis                      |
| `xAxisTitleVisibility`          | enum          | `"show"` | `"show"`, `"hide"`                              |
| `yAxisTitleVisibility`          | enum          | `"show"` |                                                 |

## Verified patterns (from test-dashboard)

| # | Pattern                                       | Key options                                                  |
| - | --------------------------------------------- | ------------------------------------------------------------ |
| 1 | Default - two columns                         | none                                                         |
| 2 | Explicit x/y by name                          | `x`/`y` via `seriesByName`                                   |
| 3 | Three-series with category                    | `category` + axis titles                                     |
| 4 | Large markers                                 | `markerSize: 10`                                             |
| 5 | Custom palette                                | `seriesColors: [...]`                                        |
| 6 | Lock color to category value                  | `seriesColorsByField: { ... }`                               |
| 7 | Log y                                         | `yAxisScale: "log"`                                          |
| 8 | Tight axes                                    | `yAxisMin: 0`, `showXAxisExtendedRange: false`               |
| 9 | Hide axis titles, keep labels                 | `*AxisTitleVisibility: "hide"`                               |
| 10 | Stripped editorial style                     | titles + lines + grids off; `legendDisplay: "off"`           |
| 11 | Legend bottom, ellipsisMiddle                | `legendDisplay: "bottom"`, `legendTruncation`               |
| 12 | Canonical PDF example                        | `status` x `date_hour` from splunkd_access                  |
| 13 | backgroundColor tint                         | `backgroundColor` + brand `seriesColors`                     |

## Drilldown

`primary.click` event handlers fire when a marker is clicked. The clicked row is exposed via `row.<field>` tokens. Same shape as line/column drilldowns.

```json
"viz_scatter": {
  "type": "splunk.scatter",
  "dataSources": { "primary": "ds_perf" },
  "options": {
    "x": "> primary | seriesByName('throughput')",
    "y": "> primary | seriesByName('latency')",
    "category": "> primary | seriesByName('service')"
  },
  "eventHandlers": [
    {
      "type": "drilldown.customUrl",
      "options": { "url": "/app/myapp/service?name=$row.service$" }
    }
  ]
}
```

## Gotchas

- **Default ordering matters.** With no `x`/`y`/`category` set, the chart binds to columns 0/1/2 in result order. If your SPL doesn't use `table`, the order can change unexpectedly.
- **`category` is alphabetical, not result-ordered.** `seriesColors[0]` lands on the alphabetically first category. Use `seriesColorsByField` if you want a value-locked color (e.g. always orange for `"db"`).
- **Time on x is wrong tool.** Scatter axes are linear/log numeric. For `_time`, use `splunk.line` instead - it knows how to render a time axis.
- **`resultLimit: 50000` is high.** Don't fight performance; aggregate with `stats` before plotting if your SPL returns 100k+ rows.
- **Log scale with zero/negative values fails.** When `*AxisScale: "log"`, exclude `<= 0` values upstream.
- **Annotations aren't in the scatter options table.** Unlike line/area/column, scatter has no annotation overlay - put context elsewhere on the dashboard.

## Cross-references

- [`ds-viz-bubble`](../ds-viz-bubble/SKILL.md) - same shape but with marker-size as a third numeric dimension
- [`ds-viz-line`](../ds-viz-line/SKILL.md) - when x is `_time`
- [`ds-viz-punchcard`](../ds-viz-punchcard/SKILL.md) - categorical x and y with intensity
- [`ds-viz-parallelcoordinates`](../ds-viz-parallelcoordinates/SKILL.md) - more than three dimensions
- [`ds-design-principles`](../../design/ds-design-principles/SKILL.md) - chart selection table
