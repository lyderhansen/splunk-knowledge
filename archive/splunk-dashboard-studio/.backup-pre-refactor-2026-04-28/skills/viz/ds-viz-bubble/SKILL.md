---
name: ds-viz-bubble
description: |
  splunk.bubble - shows three numeric dimensions: position (x, y) plus
  marker size, with optional fourth-dimension category color. Verified
  against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_bubble_dark
  - ds_viz_bubble_light
---

# splunk.bubble

A bubble chart is a scatter chart with one extra encoding: marker **size**. Position encodes two dimensions (x, y), size encodes a third, and category encodes a fourth as color.

## When to use it

| Story                                                | Pick                  |
| ---------------------------------------------------- | --------------------- |
| Three numeric dimensions in one panel                | `splunk.bubble`       |
| Two numeric dimensions only                          | `splunk.scatter`      |
| Categorical x, y heatmap with intensity              | `splunk.punchcard`    |
| Many dimensions per row (>3)                         | `splunk.parallelcoordinates` |
| Time on x with size = volume                         | `splunk.line` with `markerDisplay` |

Pick `splunk.bubble` when:

- All three of x, y, and size are **meaningfully numeric**.
- You want the third dimension to feel **proportional**, not categorical.
- A fourth field as **category color** adds insight (status, segment, service).

## Data shape

The PDF canonical example pulls four columns:

```spl
index=_internal sourcetype=splunkd_access
| stats count sum(bytes) AS total_bytes by status, date_hour
| table date_hour count total_bytes status
```

Bindings:
- `x = date_hour` (column 0)
- `y = count` (column 1)
- `size = total_bytes` (column 2)
- `category = status` (column 3)

Defaults bind to `seriesByIndex(0|1|2|3)`. If you don't use `table`, column order is unstable - bind explicitly with `seriesByName(...)`.

## Options (verified against 10.4 PDF)

### DOS bindings

| Option          | Type             | Default                              | Notes                                     |
| --------------- | ---------------- | ------------------------------------ | ----------------------------------------- |
| `x`             | string \| number | `> primary \| seriesByIndex(0)`      | Numeric x-axis values                     |
| `y`             | string \| number | `> primary \| seriesByIndex(1)`      | Numeric y-axis values                     |
| `size`          | number           | `> primary \| seriesByIndex(2)`      | Marker size encoding                      |
| `category`      | string \| number | n/a                                  | Optional - splits points into colored series |
| `xField`        | string           | `> x \| getField()`                  | Field label for x; auto from binding      |
| `yField`        | string           | `> y \| getField()`                  | Field label for y                         |
| `sizeField`     | string           | `> size \| getField()`               | Field label for size                      |
| `categoryField` | string           | `> category \| getField()`           | Field label for category                  |

### Bubble sizing

| Option              | Type                        | Default | Notes                                                                      |
| ------------------- | --------------------------- | ------- | -------------------------------------------------------------------------- |
| `bubbleSizeMin`     | number                      | 10      | Smallest rendered marker (pixels)                                          |
| `bubbleSizeMax`     | number                      | 50      | Largest rendered marker                                                    |
| `bubbleSizeMethod`  | enum (`area` \| `diameter`) | `area`  | `area` is perceptually correct; `diameter` exaggerates large values        |
| `resultLimit`       | number                      | 50000   | Hard cap on points sent to the renderer                                    |

### Color

| Option                | Type     | Default                                              | Notes                                          |
| --------------------- | -------- | ---------------------------------------------------- | ---------------------------------------------- |
| `seriesColors`        | string[] | `#7B56DB,#009CEB,#00CDAF,#DD9900,#FF677B,...`        | Maps to series in **alphabetical** category order |
| `seriesColorsByField` | object   | n/a                                                  | `{ "api": "#7AA2FF" }` - locks color to value  |
| `backgroundColor`     | string   | theme default                                        | Panel background                                |

### Legend

| Option             | Type        | Default       | Values                                                          |
| ------------------ | ----------- | ------------- | --------------------------------------------------------------- |
| `legendDisplay`    | enum        | `"right"`     | `"right"`, `"left"`, `"top"`, `"bottom"`, `"off"`               |
| `legendTruncation` | enum        | `"ellipsisEnd"` | `"ellipsisEnd"`, `"ellipsisMiddle"`, `"ellipsisStart"`, `"ellipsisOff"` |

### Axes (mirrored x and y)

Same surface as `splunk.scatter`:

| Option                          | Type          | Default | Notes                                           |
| ------------------------------- | ------------- | ------- | ----------------------------------------------- |
| `xAxisMin` / `yAxisMin`         | string\|number | `"auto"` | Lock axis floor                                 |
| `xAxisMax` / `yAxisMax`         | string\|number | `"auto"` | Lock axis ceiling                               |
| `xAxisScale` / `yAxisScale`     | enum          | `"linear"` | `"linear"` or `"log"`                         |
| `xAxisAbbreviation`             | enum          | `"off"`  | `"auto"` enables 1.2k, 3M shorthand            |
| `yAxisAbbreviation`             | enum          | `"auto"` |                                                 |
| `showXAxisExtendedRange`        | boolean       | TRUE    | Adds breathing room beyond min/max              |
| `showYAxisExtendedRange`        | boolean       | TRUE    |                                                 |
| `showXAxisWithZero`             | boolean       | FALSE   | Force include zero on the axis                  |
| `showYAxisWithZero`             | boolean       | FALSE   |                                                 |
| `showRoundedXAxisLabels`        | boolean       | FALSE   |                                                 |
| `showYMajorGridLines`           | boolean       | TRUE    |                                                 |
| `showXMinorGridLines`           | boolean       | FALSE   |                                                 |
| `showYMinorGridLines`           | boolean       | FALSE   |                                                 |
| `xAxisLabelRotation`            | enum          | 0       | `-90`, `-45`, `0`, `45`, `90`                   |
| `xAxisLabelVisibility`          | enum          | `"auto"` | `"auto"`, `"show"`, `"hide"`                   |
| `yAxisLabelVisibility`          | enum          | `"auto"` |                                                 |
| `xAxisLineVisibility`           | enum          | `"hide"` | `"show"`, `"hide"`                             |
| `yAxisLineVisibility`           | enum          | `"hide"` |                                                 |
| `xAxisMajorTickInterval`        | string\|number | `"auto"` |                                                 |
| `yAxisMajorTickInterval`        | string\|number | `"auto"` |                                                 |
| `xAxisMajorTickSize`            | number        | 6       |                                                 |
| `yAxisMajorTickSize`            | number        | 6       |                                                 |
| `xAxisMinorTickSize`            | number        | 6       |                                                 |
| `yAxisMinorTickSize`            | number        | 6       |                                                 |
| `xAxisMajorTickVisibility`      | enum          | `"auto"` |                                                 |
| `yAxisMajorTickVisibility`      | enum          | `"auto"` |                                                 |
| `xAxisMinorTickVisibility`      | enum          | `"auto"` |                                                 |
| `yAxisMinorTickVisibility`      | enum          | `"auto"` |                                                 |
| `xAxisTitleText`                | string        | -       | Title under the x-axis                          |
| `yAxisTitleText`                | string        | -       | Title alongside the y-axis                      |
| `xAxisTitleVisibility`          | enum          | `"show"` |                                                 |
| `yAxisTitleVisibility`          | enum          | `"show"` |                                                 |

## Verified patterns (from test-dashboard)

| #  | Pattern                                       | Key options                                                  |
| -- | --------------------------------------------- | ------------------------------------------------------------ |
| 1  | Default - x, y, size from cols 0/1/2          | none                                                         |
| 2  | Explicit bindings by name                     | `x`/`y`/`size` via `seriesByName`                            |
| 3  | Four-dim with category                        | adds `category` for service color split                      |
| 4  | `bubbleSizeMax: 100`                          | bigger headline bubbles                                      |
| 5  | Tight range `bubbleSizeMin: 4, Max: 20`       | compresses size variance                                     |
| 6  | `bubbleSizeMethod: "diameter"`                | exaggerates large values                                     |
| 7  | Custom palette                                | `seriesColors: [...]`                                        |
| 8  | Lock color to value                           | `seriesColorsByField: { ... }`                               |
| 9  | Log y                                         | `yAxisScale: "log"`                                          |
| 10 | Stripped editorial style                      | titles, lines, grids off, legend off                         |
| 11 | Legend bottom + truncation                    | `legendDisplay`, `legendTruncation`                          |
| 12 | Canonical PDF example                         | status × date_hour × count × total_bytes                     |
| 13 | `backgroundColor` tint                        | brand palette + custom panel bg                              |

## Drilldown

`primary.click` event handlers fire when a bubble is clicked. The clicked row is exposed via `row.<field>` tokens. Same shape as line/column drilldowns.

```json
"viz_bubble": {
  "type": "splunk.bubble",
  "dataSources": { "primary": "ds_perf" },
  "options": {
    "x": "> primary | seriesByName('throughput')",
    "y": "> primary | seriesByName('latency')",
    "size": "> primary | seriesByName('requests')",
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

- **Use `area` for honest size encoding.** `bubbleSizeMethod: "diameter"` doubles the effective visual area for each diameter step, exaggerating large values. Default `area` is the right answer most of the time.
- **`size` must be numeric and positive.** Negative or zero sizes either render at minimum or fail silently. Filter or `abs()` upstream.
- **`category` is alphabetical.** `seriesColors[0]` lands on the alphabetically first category. Use `seriesColorsByField` to pin specific colors to specific values.
- **Default ordering matters.** Without `x`/`y`/`size` set, columns 0/1/2 in result order are bound. Always finish your SPL with an explicit `table` to lock order.
- **No annotation overlay.** Unlike line/area/column, bubble has no annotation support. Place context off-panel.
- **Time on x is wrong tool.** Bubble axes are linear/log numeric. For `_time`, switch to `splunk.line` with `markerDisplay` for size effects.
- **`resultLimit: 50000` is high.** Pre-aggregate with `stats` before plotting if your SPL returns 100k+ rows.
- **Log scale with zero/negative values fails.** When `*AxisScale: "log"`, exclude `<= 0` values upstream.
- **Bubble sizing scales with absolute pixels, not panel width.** `bubbleSizeMin: 10 / Max: 50` is calibrated for compact tiles. On a wide hero panel (>= 1200 px), the largest bubbles can balloon and overlap neighbors. On a tiny tile (<= 400 px), they obscure the whole plot. Tune sizing to the rendered panel size, not the data alone:

  | Rendered panel width | Suggested `bubbleSizeMin` / `Max` |
  | -------------------- | --------------------------------- |
  | `<= 400 px` (compact)         | 4 / 18                |
  | 400-700 px (mid)              | 6 / 28                |
  | 700-1100 px (full row)        | 8 / 40 (default-ish)  |
  | `>= 1100 px` (hero / board)   | 10 / 60               |

  Always lift `bubbleSizeMin` when you lift `bubbleSizeMax` - otherwise
  the dynamic range becomes so wide that mid-value bubbles disappear
  while one peak fills the panel.

## Cross-references

- [`ds-viz-scatter`](../ds-viz-scatter/SKILL.md) - same shape without the size dimension
- [`ds-viz-line`](../ds-viz-line/SKILL.md) - when x is `_time`
- [`ds-viz-punchcard`](../ds-viz-punchcard/SKILL.md) - categorical x and y with intensity
- [`ds-viz-parallelcoordinates`](../ds-viz-parallelcoordinates/SKILL.md) - more than four dimensions
- [`ds-design-principles`](../../reference/ds-design-principles/SKILL.md) - chart selection table
