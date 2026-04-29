# splunk.punchcard — gotchas

## 1. Column order matters

If `count` ends up in column 4 instead of 3 (e.g. you forgot to put
the metric before the colour field), the chart will look wrong.
Either fix the SPL with `| table dim1 dim2 metric color` or set
explicit DOS bindings.

## 2. Single-row data degenerates

If the second dimension only has one value, the chart degenerates to
a single horizontal strip. Switch to a line chart.

## 3. High-cardinality dimensions

More than ~10 values on either axis makes the chart unreadable.
Bucket via `eval` or use `top` / `rare`.

## 4. `showMaxValuePulsation` is distracting on wallboards

Pulse animation draws the eye constantly. Set `false` for production
NOC walls.

## 5. `bubbleSizeMin: 0` hides low-value cells entirely

Default `0.25` is usually right. Setting `0` makes near-zero values
invisible.

## 6. Categorical mode requires explicit `colorMode`

Chart defaults to `dynamic` colour even if you provide a fourth
column. You **must** explicitly set `colorMode: "categorical"` to
get categorical colouring.

## 7. Min panel size: 500 × 300 px

Below that, the bubbles render correctly, but the **hover-tooltip
hit-area shrinks faster than the visible bubble** — tooltip lands in
the wrong cell, or doesn't surface at all. Hardest to spot on dense
grids (24h × 7d).

If layout forces a smaller tile, use:

- `splunk.singlevalue` if user only needs the headline number.
- `splunk.line` of the metric over time if cyclic pattern isn't critical.
- A larger panel reached via drilldown from a smaller indicator.

## 8. Wide panels need bigger bubble radius

`bubbleRadiusMax: 15` is calibrated for compact tiles (~400–700 px
wide). On big panels, bubbles either feel lost in whitespace, or the
**largest** cells balloon and overlap neighbours.

| Rendered width | Suggested `bubbleRadiusMax` |
|---|---|
| ≤ 480 px (compact tile) | 12–15 (default-ish) |
| 480–800 px (mid panel) | 18–22 |
| 800–1200 px (full row) | 22–28 |
| ≥ 1200 px (wallboard) | 26–32 |

## 9. Always lift `bubbleRadiusMin` together with `Max`

If you push `bubbleRadiusMax: 28` while leaving `bubbleRadiusMin: 1`,
dynamic range becomes so wide that mid-cells render almost
invisibly while peak cells dominate. Ratio ~1:8 keeps mid-cells
readable.

## 10. Static size on dense grids causes tooltip overlap

With `showDynamicBubbleSize: false` on a 24-hour-by-7-day grid,
neighbouring cells overlap and the hover tooltip lands between two
bubbles. Drop `bubbleRadiusMax` to ~8–10 for static-size dense grids.

## 11. Categorical colour + static size = categorical heatmap

Combining `showDynamicBubbleSize: false` with `colorMode:
"categorical"` becomes a categorical heatmap. Same overlap rule
applies — keep `bubbleRadiusMax` small (≤ 10) so each cell stays a
distinct dot.
