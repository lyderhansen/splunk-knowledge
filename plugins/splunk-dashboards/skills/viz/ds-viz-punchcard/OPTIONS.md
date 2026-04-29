# splunk.punchcard — full options reference

Cross-checked against the 10.4 PDF.

## DOS bindings

By default punchcard maps:

| Option | Default |
|---|---|
| `x` | `> primary \| seriesByIndex(0)` |
| `y` | `> primary \| seriesByIndex(1)` |
| `size` | `> primary \| seriesByIndex(2)` |
| `category` | `> primary \| seriesByIndex(3)` |
| `xField` | `> x \| getField()` |
| `yField` | `> y \| getField()` |
| `sizeField` | `> size \| getField()` |
| `categoryField` | `> category \| getField()` |

Use `seriesByName('<col>')` instead of `seriesByIndex` when SPL
column order isn't stable.

## Sizing options

| Option | Type / values | Default |
|---|---|---|
| `bubbleRadiusMin` | number (px) | `1` |
| `bubbleRadiusMax` | number (px) | `15` |
| `bubbleSizeMin` | number (multiplier) | `0.25` |
| `bubbleSizeMax` | number (multiplier) | `1` |
| `bubbleSizeMethod` | `"radius"` \| `"area"` | `area` |
| `bubbleRowScale` | `"global"` \| `"row"` | `global` |
| `showDynamicBubbleSize` | boolean | `true` |

- `area` (default) makes bubble **area** proportional — perceptually
  correct.
- `radius` exaggerates differences. Use sparingly.
- `bubbleRowScale: "row"` essential when one row dominates — recovers
  within-row pattern at the cost of cross-row comparison.
- `showDynamicBubbleSize: false` collapses all bubbles to one size.
  Useful when only colour carries the signal.

## Colour options

| Option | Type / values | Default |
|---|---|---|
| `colorMode` | `"dynamic"` \| `"categorical"` | `dynamic` |
| `bubbleColor` | DOS string \| array | gradient by `size` |
| `seriesColors` | string (CSV) \| array | platform palette |
| `backgroundColor` | string (hex) | theme default |
| `legendDisplay` | `"right"` \| `"off"` | `right` |

- `dynamic` (default) tints bubbles with a gradient based on size.
- `categorical` requires a fourth column (`category`) and draws a
  unique colour per category from `seriesColors`.

## Other toggles

| Option | Type | Default | Purpose |
|---|---|---|---|
| `showMaxValuePulsation` | boolean | `true` | Pulses the largest bubble. Turn off for static screenshots. |
| `bubbleLabelDisplay` | `all` \| `max` \| `off` | `all` | Show every value, only the max, or none. |
| `showDefaultSort` | boolean | `false` | Apply built-in chronological sort to y-axis when applicable. |

## What punchcard does NOT have

- **No `xAxis*` / `yAxis*` axis tuning** — the grid axes are derived
  from data, not configurable.
- **No `xAxisScale: "log"`** — values are categorical, not numeric.
- **No annotations**, dual axis, stacking, splits.

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Punchcard options table.
