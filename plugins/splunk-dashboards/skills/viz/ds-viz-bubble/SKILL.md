---
name: ds-viz-bubble
description: Splunk Dashboard Studio splunk.bubble visualization — three-numeric-dimension scatter with marker size as third encoding. Provides patterns for performance plots (throughput × latency × volume), cohort splitting via category colour, panel-aware bubble sizing, and the canonical 4-dimensional encoding. Use when the user asks about bubble charts, three-dimensional plots, scatter with size, or service performance signatures in Splunk Dashboard Studio.
---

# splunk.bubble — three-dimension scatter

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_bubble_dark` / `ds_viz_bubble_light`.

A bubble chart is a scatter chart with one extra encoding: marker
**size**. Position encodes two dimensions (x, y), size encodes a
third, and category encodes a fourth as colour.

## When to use

- All three of x, y, and size are **meaningfully numeric**.
- Third dimension should feel **proportional**, not categorical.
- A fourth field as **category colour** adds insight (status, segment,
  service).

## When NOT to use

| Story | Pick instead |
|---|---|
| Two numeric dimensions only | `splunk.scatter` |
| Categorical x, y heatmap with intensity | `splunk.punchcard` |
| Many dimensions per row (>3) | `splunk.parallelcoordinates` |
| Time on x with size = volume | `splunk.line` with `markerDisplay` |

## Quick start

```json
{
  "type": "splunk.bubble",
  "title": "Service performance",
  "dataSources": { "primary": "ds_perf" },
  "options": {
    "x": "> primary | seriesByName('throughput')",
    "y": "> primary | seriesByName('latency')",
    "size": "> primary | seriesByName('requests')",
    "category": "> primary | seriesByName('service')",
    "bubbleSizeMin": 6,
    "bubbleSizeMax": 28,
    "bubbleSizeMethod": "area",
    "xAxisTitleText": "Throughput (req/s)",
    "yAxisTitleText": "p95 latency (ms)"
  }
}
```

```spl
... | stats avg(throughput) as throughput, avg(latency_p95) as latency,
            sum(requests) as requests by service
| table service throughput latency requests
```

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Sizing method:** `bubbleSizeMethod: "area"` (perceptually correct). | `"diameter"` — exaggerates large values; doubles effective area per diameter step. |
| **Size source:** numeric and positive. Filter `\| where size > 0` upstream. | Negative or zero sizes — render at minimum or fail silently. |
| **Bind explicitly:** `seriesByName(...)` for x/y/size/category when SPL output isn't stable. | Rely on default `seriesByIndex(0/1/2/3)` without `\| table` — column order can shift. |
| **Colour-by-value:** `seriesColorsByField: { api: "#7AA2FF" }` to lock palette to category values. | `seriesColors` array with categories — palette maps **alphabetically** to categories, not in SPL order. |
| **Panel-aware sizing:** lift both `bubbleSizeMin` AND `bubbleSizeMax` together as panel grows. | Lift max alone — dynamic range becomes so wide that mid-bubbles disappear and one peak fills panel. |
| **Time on x:** switch to `splunk.line` with `markerDisplay`. | Use bubble with `_time` on x — bubble axes are linear/log numeric. |
| **Log scale:** filter `\| where x > 0` upstream. | Combine `xAxisScale: "log"` with zero/negative values — fails silently. |

## Panel-aware bubble sizing

Bubble sizing is in **absolute pixels**, not panel ratios. Calibrate to
rendered panel size, not data alone:

| Rendered width | `bubbleSizeMin` / `Max` |
|---|---|
| ≤ 400 px (compact tile) | 4 / 18 |
| 400–700 px (mid panel) | 6 / 28 |
| 700–1100 px (full row) | 8 / 40 (default-ish) |
| ≥ 1100 px (hero / board) | 10 / 60 |

## See also

- [PATTERNS.md](PATTERNS.md) — 13 verified patterns: default, explicit
  bindings, four-dim with category, custom palette, log y, stripped
  editorial style, canonical PDF example.
- [OPTIONS.md](OPTIONS.md) — full bubble-specific + axis options table.
- `ds-viz-scatter` — same shape without size dimension.
- `ds-viz-line` — when x is `_time`.
- `ds-viz-punchcard` — categorical x and y with intensity.
- `ds-viz-parallelcoordinates` — more than 4 dimensions.
- `ds-design-principles` — chart selection table.
