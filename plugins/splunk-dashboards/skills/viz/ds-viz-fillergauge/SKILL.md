---
name: ds-viz-fillergauge
description: |
  splunk.fillergauge - a single value plotted as a *filled bar* against a 0-100 scale.
  Use when the message is "how full / how complete" (capacity, quota, completion %).
  Same option set as splunk.markergauge, but the bar fills with a single solid colour
  (gaugeColor) instead of resolving to banded zones (gaugeRanges).
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_fillergauge_dark
  - ds_viz_fillergauge_light
---

# splunk.fillergauge

A single value plotted as a *filled bar* against a 0-100 scale.

## When to use it

Pick `splunk.fillergauge` when the **message is "how full / how complete"** - capacity used, quota progress, completion percent, ratio. The fill area itself reads as the answer.

Pick something else when:

| Decision           | Use instead                                                           |
| ------------------ | --------------------------------------------------------------------- |
| Banded zones       | `splunk.markergauge` (NPS, latency budget, CSAT zones)                |
| Number is the hero | `splunk.singlevalue` / `splunk.singlevalueradial`                     |
| Trend over time    | `splunk.line` / `splunk.area`                                         |

## Data shape

The viz expects a **single numeric value** (one row, one column).

```spl
| makeresults
| eval value = 78
| table value
```

The `value` field is bound implicitly. There is **no `value` option** in the JSON for `splunk.fillergauge` - it picks the first numeric field in `primary`.

Default scale is `0-100`. There is **no `maxValue`** option (unlike `splunk.singlevalueradial`). For values that aren't already 0-100, scale upstream in SPL:

```spl
| stats sum(orders) AS orders
| eval value = round(orders / 1000 * 100)
| table value
```

## Layout

Filler gauges read fine in fairly compact panels. Recommended sizing:

| Orientation | Min size (w x h) | Sweet spot |
| ----------- | ---------------- | ---------- |
| `vertical`  | 200 x 240        | 280 x 300  |
| `horizontal`| 320 x 140        | 460 x 220  |

In KPI rows of 4-6 tiles, prefer `horizontal` so labels don't crop.

## All 7 options (10.4 reference)

| Option              | Type          | Default          | Notes                                                              |
| ------------------- | ------------- | ---------------- | ------------------------------------------------------------------ |
| `value`             | number / DOS  | first numeric col| Override the bound value with a DOS expression if needed.          |
| `gaugeColor`        | colour / DOS  | theme primary    | The fill colour. **Single colour only** - no banded zones.         |
| `orientation`       | enum          | `vertical`       | `vertical` or `horizontal`.                                        |
| `labelDisplay`      | enum          | `number`         | `number`, `percentage`, `off` - axis labels.                       |
| `valueDisplay`      | enum          | `number`         | `number`, `percentage`, `off` - the value readout.                 |
| `majorTickInterval` | number (px)   | auto             | Pixel spacing of major ticks. Pin when auto produces too few/many. |
| `backgroundColor`   | colour        | theme panel bg   | Panel tint hex. Must contrast with `gaugeColor`.                   |

That is the complete option set. There is **no `maxValue`, no `gaugeRanges`, no `trendValue`, no legend**, and **no annotations**.

## Verified patterns (test dashboard `ds_viz_fillergauge_dark`)

The test dashboard has 12 panels covering every option:

1. Default vertical, low value (22) - bar fills 22% from bottom.
2. Default vertical, mid (58) - fill reaches the middle.
3. Default vertical, high (94) - bar nearly full.
4. `orientation: horizontal` - reads left-to-right.
5. `gaugeColor: "#33FF99"` static green.
6. `gaugeColor: "#FFB627"` static amber - side-by-side proves it's a single fill, not banded.
7. `gaugeColor` dynamic via `rangeValue` - fill flips colour on threshold (rose <50, amber 50-80, green >80).
8. Disk-used inverse thresholds (high=bad).
9. Quota progress with upstream scaling (640/1000 -> value 64) - shows the no-maxValue workaround.
10. `labelDisplay: percentage`, `valueDisplay: percentage`.
11. `labelDisplay: off`, `valueDisplay: off` - pure visual fill, no chrome.
12. `majorTickInterval: 25` plus custom `backgroundColor` panel tint.

The light-theme companion `ds_viz_fillergauge_light` uses the same 12 patterns with the light palette (blue / amber / rose).

## Threshold colouring with DOS

`splunk.fillergauge` does NOT have a `gaugeRanges` option. To get banded behaviour, use a Dynamic Options Syntax (DOS) expression on `gaugeColor` plus a `rangeValue` lookup in `context`:

```json
{
  "type": "splunk.fillergauge",
  "dataSources": { "primary": "ds_kpi" },
  "options": {
    "gaugeColor": "> primary | seriesByName('value') | lastPoint() | rangeValue(thresholds)",
    "orientation": "horizontal"
  },
  "context": {
    "thresholds": [
      { "to": 50,             "value": "#FF2D95" },
      { "from": 50, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  }
}
```

The pipeline:

- `seriesByName('value')` selects the bound field.
- `lastPoint()` returns the latest scalar (since fillergauge is single-value, this is the only value).
- `rangeValue(thresholds)` resolves the scalar against the bands and returns the matching colour string.

Bands MUST be contiguous. Leave a gap and the missing range falls back to the theme primary, not transparent.

## Gotchas

- **No `gaugeRanges`.** That option only exists on `markergauge`. If you need banded zones, switch viz type.
- **No `maxValue`.** Default scale is 0-100. Re-scale upstream for non-percentage values.
- **`gaugeColor` is a single colour.** Static hex or DOS expression - both produce one fill colour at any given moment. Side-by-side panels 5 and 6 in the test dashboard demonstrate this.
- **`majorTickInterval` is in pixels, not values.** `25` means "tick every 25px along the gauge axis", not "tick every 25 units of value".
- **`labelDisplay` and `valueDisplay` accept `percentage` only when the source value range matches.** With a 0-100 scale, `percentage` and `number` render identically. The mode becomes meaningful only when the source units differ from the gauge scale.
- **`backgroundColor` must contrast with `gaugeColor`.** Dark fill on dark bg disappears. Pick from the theme palette or use a tinted near-black for alarm tiles.
- **No annotations, no overlay, no trend line.** Use a sibling `splunk.singlevalue` with a sparkline if you need history alongside the fill.

## Cross-references

- `splunk.markergauge` - banded zones via `gaugeRanges` (use when message is "which zone are we in").
- `splunk.singlevalueradial` - radial fill with `maxValue` support and a separate `radialBackgroundColor`.
- `splunk.singlevalue` - the number is the hero; supports sparklines and trend.
- `splunk-dashboard-couture` - palette and panel-tint guidance.
