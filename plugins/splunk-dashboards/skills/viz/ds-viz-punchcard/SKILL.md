---
name: ds-viz-punchcard
description: |
  splunk.punchcard - reveals cyclical patterns by plotting bubbles at the
  intersection of two dimensions, sized by an aggregated metric, optionally
  colored by a fourth field. Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_punchcard_dark
  - ds_viz_punchcard_light
related:
  - ds-viz-bubble
  - ds-viz-table
  - ds-viz-line
  - ds-viz-events
---

# splunk.punchcard

Use a punchcard to surface **cyclical or schedule-driven patterns** in your
data. The chart plots a grid of bubbles where each cell is the intersection of
two dimensions (typically `hour` x `weekday`), the bubble's size is the
aggregated metric, and an optional fourth field tints the bubble.

> "Punchcards" got their name from the punched calendar cards in old factory
> floors - they made it visually obvious *when* work happened.

## When to use it

| You want to show...                          | Punchcard? |
| -------------------------------------------- | ---------- |
| When events/load cluster across hour x day   | Yes        |
| Detection rule firing patterns               | Yes        |
| Failed login concentration by time           | Yes        |
| 1D time series                               | No -> line |
| Continuous numeric vs numeric                | No -> scatter / bubble |
| Rare events with timestamp + payload         | No -> events |

## Data shape

Use a query that returns rows in this exact column order (the visualization
infers bindings from index by default):

| Column 1                     | Column 2                       | Column 3                | Column 4 (optional) |
| ---------------------------- | ------------------------------ | ----------------------- | ------------------- |
| `<first_dimension>` (e.g. `date_hour`) | `<second_dimension>` (e.g. `date_wday`) | metric (size)           | color field         |

Canonical SPL skeleton:

```
... | stats <fn>(<metric>) [<fn>(<color_field>)] by <first_dimension> <second_dimension>
```

If the third column has zero variance, every bubble will be the same size -
use a stats function (`count`, `sum`, `avg`) that produces meaningful spread.

## DOS bindings

By default a punchcard maps:

| Option       | Default                         |
| ------------ | ------------------------------- |
| `x`          | `> primary | seriesByIndex(0)`  |
| `y`          | `> primary | seriesByIndex(1)`  |
| `size`       | `> primary | seriesByIndex(2)`  |
| `category`   | `> primary | seriesByIndex(3)`  |
| `xField`     | `> x | getField()`              |
| `yField`     | `> y | getField()`              |
| `sizeField`  | `> size | getField()`           |
| `categoryField` | `> category | getField()`    |

Use `seriesByName('<col>')` instead of `seriesByIndex` when your SPL doesn't
emit columns in the canonical order.

## Sizing options

| Option                  | Type / values         | Default |
| ----------------------- | --------------------- | ------- |
| `bubbleRadiusMin`       | number (px)           | `1`     |
| `bubbleRadiusMax`       | number (px)           | `15`    |
| `bubbleSizeMin`         | number (multiplier)   | `0.25`  |
| `bubbleSizeMax`         | number (multiplier)   | `1`     |
| `bubbleSizeMethod`      | `"radius"` \| `"area"` | `area` |
| `bubbleRowScale`        | `"global"` \| `"row"` | `global` |
| `showDynamicBubbleSize` | boolean               | `true`  |

- `bubbleSizeMethod = "area"` (default) makes the **area** of the bubble
  proportional to the value - perceptually correct.
- `bubbleSizeMethod = "radius"` makes large values feel bigger but
  exaggerates differences. Use sparingly.
- `bubbleRowScale = "row"` is essential when one row dominates - it
  recovers the within-row pattern at the cost of cross-row comparison.
- `showDynamicBubbleSize = false` collapses all bubbles to one size. Useful
  when only color carries the signal.

## Color options

| Option                  | Type / values                       | Default               |
| ----------------------- | ----------------------------------- | --------------------- |
| `colorMode`             | `"dynamic"` \| `"categorical"`     | `dynamic`             |
| `bubbleColor`           | DOS string \| array                 | gradient by `size`    |
| `seriesColors`          | string (CSV) \| array               | platform palette      |
| `backgroundColor`       | string (hex)                        | theme default         |
| `legendDisplay`         | `"right"` \| `"off"`                | `right`               |

- `colorMode = "dynamic"` (default) tints all bubbles with a gradient based
  on the size metric.
- `colorMode = "categorical"` requires a fourth column (`category`) and
  draws a unique color per category from `seriesColors`.

## Other toggles

| Option                  | Type     | Default | Purpose |
| ----------------------- | -------- | ------- | ------- |
| `showMaxValuePulsation` | boolean  | `true`  | Pulses the largest bubble. Turn off for static screenshots. |
| `bubbleLabelDisplay`    | `all` \| `max` \| `off` | `all` | Show every value, only the max, or none. |
| `showDefaultSort`       | boolean  | `false` | Apply built-in chronological sort to the y-axis when applicable. |

## Verified patterns

13 patterns are deployed in `ds_viz_punchcard_dark` / `ds_viz_punchcard_light`:

1. **Default** - `dynamic` color from the size metric.
2. **Categorical** - `colorMode: "categorical"` with a region field.
3. **Label max** - `bubbleLabelDisplay: "max"` highlights only the peak cell.
4. **Label off** - editorial / cleaner look.
5. **Row scale** - `bubbleRowScale: "row"` recovers patterns hidden by an
   outlier cell.
6. **Radius method** - `bubbleSizeMethod: "radius"` makes large values pop.
7. **Bigger bubbles** - `bubbleRadiusMax: 24` for headline panels.
8. **No pulsation** - `showMaxValuePulsation: false` for screenshots.
9. **Static size** - `showDynamicBubbleSize: false` so only color carries
   the signal.
10. **Legend off** - compact tiles still benefit from categorical color.
11. **SOC pattern** - night-clustering of failures becomes visible.
12. **Default sort** - `showDefaultSort: true` for chronological order.
13. **Tinted** - custom `backgroundColor` + brand `seriesColors`.

## Drilldown

Punchcards support drilldowns just like other charts. Tokens you can use:

- `$click.value$` - the size metric of the clicked bubble.
- `$click.value2$` - the category metric (when `colorMode: "categorical"`).
- `$row.<field>$` - any field from the underlying row, e.g. `$row.punch_hour$`,
  `$row.punch_day$`.

Pattern - drill into the underlying events:

```json
"eventActions": {
  "actions": [
    {
      "type": "openSearch",
      "search": "index=auth date_hour=$row.punch_hour$ date_wday=$row.punch_day$"
    }
  ]
}
```

## Common gotchas

- **Column order matters.** If `count` ends up in column 4 instead of 3
  (e.g. you forgot to put the metric before the color field), the chart
  will look wrong. Either fix the SPL or set explicit DOS bindings.
- **Single-row data** - if the second dimension only has one value the
  chart degenerates to a single horizontal strip; consider a line chart.
- **High-cardinality dimensions** - more than ~10 values on either axis
  makes the chart unreadable. Bucket via `eval` or use `top`/`rare`.
- **`showMaxValuePulsation`** can be visually distracting on always-on
  wallboards. Most production dashboards turn it off.
- **`bubbleSizeMin = 0`** can hide low-value cells entirely. The default of
  `0.25` is usually right.
- The chart defaults to `dynamic` color even if you provide a fourth
  column - you must explicitly set `colorMode: "categorical"`.

## Sizing for large panels

**The default `bubbleRadiusMax: 15` is calibrated for compact tiles
(~400-700 px wide). On big panels - full-width hero rows or wallboards -
bubbles either feel lost in whitespace, or, more dangerously, the
*largest* cells balloon and overlap their neighbors. Tune sizing to the
panel's rendered size, not just to the data.

| Rendered panel width | Suggested `bubbleRadiusMax` | Notes |
| -------------------- | --------------------------- | ----- |
| `<= 480 px` (compact tile) | 12-15 (default-ish) | The published default. |
| 480-800 px (mid panel)     | 18-22                | Headline-friendly. |
| 800-1200 px (full row)     | 22-28                | Pair with `bubbleRadiusMin: 3-4` so low cells stay legible. |
| `>= 1200 px` (wallboard)   | 26-32                | Confirm by eye - wider grid spacing tolerates bigger bubbles. |

**Always raise `bubbleRadiusMin` when you raise `Max`.** If you push
`bubbleRadiusMax: 28` while leaving `bubbleRadiusMin: 1`, the dynamic
range becomes so wide that mid-value cells render almost invisibly while
peak cells dominate the grid.

**Watch `showDynamicBubbleSize: false` on dense grids.** When every
bubble renders at `bubbleRadiusMax`, neighboring cells overlap and the
hover tooltip can land between two bubbles - users either get the wrong
tooltip or no tooltip at all. The pattern is fine for small grids
(`<= 8` cells per row) but on a 24-hour-by-7-day grid you must drop
`bubbleRadiusMax` to ~8-10 to keep cells readable. This is the failure
mode in panel 9 of the test bench: 24 columns x same-size bubbles =
unreadable centers.

**Categorical color + static size on dense grids.** When you combine
`showDynamicBubbleSize: false` with `colorMode: "categorical"` (panel
10 of the test bench), the chart becomes a *categorical heatmap*. Same
overlap rule applies - keep `bubbleRadiusMax` small (`<= 10`) so each
cell stays a distinct dot.

## Minimum readable panel size

**Don't render a punchcard in a panel smaller than ~500 x 300 px.** Below
that threshold the bubbles render correctly, but the hover-tooltip
hit-area shrinks faster than the visible bubble - the tooltip lands in
the wrong cell, or doesn't surface at all, and the user can't read off
the value. This is hardest to spot on dense grids (24h x 7d) where
neighboring bubbles are already close together.

If your layout forces a smaller tile, prefer one of these instead:

- A **`splunk.singlevalue`** if the user only needs the headline number.
- A **`splunk.line`** of the metric over time if the cyclic pattern
  isn't critical.
- A larger panel reached via drilldown from a smaller indicator.

## Reference

Verified against `SplunkCloud-10.4.2604-DashStudio` PDF.
