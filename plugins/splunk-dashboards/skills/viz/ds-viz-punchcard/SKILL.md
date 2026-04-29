---
name: ds-viz-punchcard
description: Splunk Dashboard Studio splunk.punchcard visualization — cyclical-pattern grid where each cell is the intersection of two dimensions, sized by an aggregated metric, optionally tinted by a fourth field. Provides patterns for hour-by-day load profiles, detection rule firing patterns, failed-login concentration, schedule-driven cycles, and panel-aware bubble sizing. Use when the user asks about punchcard charts, hour-by-day patterns, cyclical visualization, schedule-driven analysis, or when-events-cluster patterns in Splunk Dashboard Studio.
---

# splunk.punchcard — cyclical pattern grid

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_punchcard_dark` / `ds_viz_punchcard_light`.

Use a punchcard to surface **cyclical or schedule-driven patterns**.
The chart plots a grid of bubbles where each cell is the intersection
of two dimensions (typically `hour` × `weekday`); the bubble's size
is the aggregated metric; an optional fourth field tints the bubble.

## When to use


| You want to show...                          | Punchcard?                             |
| -------------------------------------------- | -------------------------------------- |
| When events / load cluster across hour × day | ✅                                      |
| Detection rule firing patterns               | ✅                                      |
| Failed login concentration by time           | ✅                                      |
| 1D time series                               | ❌ → `splunk.line`                      |
| Continuous numeric vs numeric                | ❌ → `splunk.scatter` / `splunk.bubble` |
| Rare events with timestamp + payload         | ❌ → `splunk.events`                    |


## Quick start

```json
{
  "type": "splunk.punchcard",
  "title": "Failed logins by hour and weekday",
  "dataSources": { "primary": "ds_login_pattern" },
  "options": {
    "bubbleRadiusMin": 3,
    "bubbleRadiusMax": 22,
    "bubbleSizeMethod": "area",
    "bubbleLabelDisplay": "max",
    "showMaxValuePulsation": false
  }
}
```

```spl
| ... | stats count by date_hour date_wday
| table date_hour date_wday count
```

Column order: `dimension1, dimension2, size_metric, [color_field]`.

## Do / Don't


| ✅ Do                                                                                                | ❌ Don't                                                                                        |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **SPL column order:** `| table dim1 dim2 metric [color]`.                                           | Trust positional binding without `| table` — `| stats` reorders.                               |
| **Bubble sizing:** `area` (default, perceptually correct).                                          | `radius` for default — exaggerates large values.                                               |
| **Panel-aware sizing:** lift `bubbleRadiusMin` AND `bubbleRadiusMax` together as panel grows.       | Lift `Max` alone — mid-cells render almost invisibly while peaks dominate.                     |
| **Categorical mode:** explicit `colorMode: "categorical"` even when 4th column is present.          | Pass 4th column expecting auto-categorical — it stays `dynamic` (gradient) by default.         |
| **Outlier dampening:** `bubbleRowScale: "row"` recovers within-row patterns when one row dominates. | Default `"global"` with one dominant row — every other row flatlines.                          |
| **Wallboards:** `showMaxValuePulsation: false` for screenshots.                                     | Keep pulsation on wallboards — visually distracting.                                           |
| **Min panel size:** ≥ 500 × 300 px.                                                                 | Render in <500×300 — tooltip hit-area shrinks faster than bubble; tooltips land in wrong cell. |
| **High cardinality:** bucket via `| eval` or `| top` to ≤10 values per axis.                        | Render 24-bucket × 7-day grid in a small tile — hover tooltips break.                          |


## Panel-aware sizing

Default `bubbleRadiusMax: 15` is calibrated for compact tiles
(~400–700 px wide). On big panels, bubbles either feel lost or peak
cells balloon and overlap.


| Rendered width          | `bubbleRadiusMax`   | Notes                        |
| ----------------------- | ------------------- | ---------------------------- |
| ≤ 480 px (compact tile) | 12–15 (default-ish) | Published default.           |
| 480–800 px (mid panel)  | 18–22               | Headline-friendly.           |
| 800–1200 px (full row)  | 22–28               | Pair `bubbleRadiusMin: 3–4`. |
| ≥ 1200 px (wallboard)   | 26–32               | Confirm by eye.              |


**Always raise `bubbleRadiusMin` when you raise `Max`.** If you push
`Max: 28` while leaving `Min: 1`, dynamic range becomes so wide that
mid-cells render almost invisibly.

## Verified patterns

13 panels in `ds_viz_punchcard_dark`:

1. **Default** — `dynamic` colour from size metric.
2. **Categorical** — `colorMode: "categorical"` with region field.
3. **Label max** — only the peak cell.
4. **Label off** — editorial / cleaner.
5. **Row scale** — `bubbleRowScale: "row"` recovers within-row patterns.
6. **Radius method** — `bubbleSizeMethod: "radius"` makes large values pop.
7. **Bigger bubbles** — `bubbleRadiusMax: 24` for headline.
8. **No pulsation** — `showMaxValuePulsation: false`.
9. **Static size** — `showDynamicBubbleSize: false` so colour carries signal.
10. **Legend off** — compact tiles + categorical colour.
11. **SOC pattern** — night-clustering of failures.
12. **Default sort** — chronological.
13. **Tinted** — custom `backgroundColor` + brand `seriesColors`.

## Options summary

Sizing (`bubbleRadiusMin`, `bubbleRadiusMax`, `bubbleSizeMin`,
`bubbleSizeMax`, `bubbleSizeMethod`, `bubbleRowScale`,
`showDynamicBubbleSize`), colour (`colorMode`, `bubbleColor`,
`seriesColors`, `backgroundColor`, `legendDisplay`), toggles
(`showMaxValuePulsation`, `bubbleLabelDisplay`, `showDefaultSort`).

Full table inline above; no separate OPTIONS file.

## Drilldown

```json
"eventHandlers": [
  {
    "type": "drilldown.linkToSearch",
    "options": {
      "search": "index=auth date_hour=$row.punch_hour$ date_wday=$row.punch_day$"
    }
  }
]
```

Available tokens: `$click.value$` (size metric), `$click.value2$`
(category, when `colorMode: "categorical"`), `$row.<field>$`.

## Gotchas

- Column order matters — fix SPL with `| table` or set explicit DOS.
- Single-row data degenerates to a horizontal strip — use line chart.
- > 10 values per axis = unreadable. Bucket via `| eval` / `| top`.
- `showMaxValuePulsation` distracting on always-on wallboards.
- `bubbleSizeMin = 0` hides low-value cells entirely. Default `0.25`
is usually right.
- Chart defaults to `dynamic` colour even with 4th column — must set
`colorMode: "categorical"` explicitly.
- Min panel size 500 × 300 px — below that, tooltip hit-area breaks.

## See also

- `ds-viz-bubble` — continuous numeric × numeric (no grid).
- `ds-viz-line` — single dimension over time.
- `ds-viz-table` — exact cell inspection.
- `ds-viz-events` — payload inspection.

