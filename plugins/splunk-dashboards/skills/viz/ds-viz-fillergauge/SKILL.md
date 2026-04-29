---
name: ds-viz-fillergauge
description: Splunk Dashboard Studio splunk.fillergauge visualization — single value plotted as a filled bar against a 0-100 scale. Provides patterns for capacity used, quota progress, completion percent, severity-coloured fills via DOS rangeValue, and KPI tile banks. Use when the user asks about filler gauges, capacity bars, fill ratio, quota meters, completion percentage, or how-full visualization in Splunk Dashboard Studio.
---

# splunk.fillergauge — filled-bar gauge

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_fillergauge_dark` /
`ds_viz_fillergauge_light`.

A single value plotted as a *filled bar* against a 0-100 scale. The
fill area itself reads as the answer.

## When to use

- Message is "how full / how complete" — capacity used, quota
  progress, completion percent, ratio.
- Single-colour fill with optional DOS-driven threshold colouring.

## When NOT to use

| Decision | Use instead |
|---|---|
| Banded zones (NPS / latency budget / CSAT zones) | `splunk.markergauge` |
| Number is the hero | `splunk.singlevalue` / `splunk.singlevalueradial` |
| Trend over time | `splunk.line` / `splunk.area` |

## Quick start

```json
{
  "type": "splunk.fillergauge",
  "title": "Disk used",
  "dataSources": { "primary": "ds_disk_pct" },
  "options": {
    "gaugeColor": "> primary | seriesByName('value') | lastPoint() | rangeValue(thresholds)",
    "orientation": "horizontal"
  },
  "context": {
    "thresholds": [
      { "to": 50,             "value": "#33FF99" },
      { "from": 50, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#FF2D95" }
    ]
  }
}
```

```spl
| ... | eval value = round(used / total * 100) | table value
```

Default scale is 0-100. There's **no `maxValue`** — re-scale upstream
for non-percentage values.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Re-scale upstream** to fit 0-100 (`\| eval value = round(orders/1000 * 100)`). | Pass a 0-1000 value expecting Splunk to auto-scale — there's no `maxValue` option. |
| **Threshold colour:** `gaugeColor` DOS + `rangeValue(thresholds)` with disjoint, gap-free buckets. | Overlapping or gap thresholds — middle band unreachable, gauge falls back to theme purple. |
| **Bands:** if you actually need banded zones, switch to `splunk.markergauge`. | Try to express bands via multiple `gaugeColor` values — `gaugeColor` is **single colour at any moment**. |
| **KPI bank:** `backgroundColor: "transparent"` + `labelDisplay: "off"` + `valueDisplay: "off"` for dense packing. | Drop below editor minimum (200 × 200 vertical, 200 × 150 horizontal) — bar artwork clips. |
| **Contrast:** ensure `gaugeColor` contrasts with `backgroundColor`. | Dark fill on dark bg — fill disappears. |
| **Severity ramps across bank:** vary `gaugeColor` deliberately (green/amber/red). | Random colours across tiles — destroys at-a-glance grouping. |

## Threshold colouring (the canonical pattern)

`splunk.fillergauge` does NOT have `gaugeRanges`. To get banded
behaviour, use DOS `rangeValue`:

```json
"options": {
  "gaugeColor": "> primary | seriesByName('value') | lastPoint() | rangeValue(thresholds)"
},
"context": {
  "thresholds": [
    { "to": 50,             "value": "#FF2D95" },
    { "from": 50, "to": 80, "value": "#FFB627" },
    { "from": 80,           "value": "#33FF99" }
  ]
}
```

**Threshold semantics:**

- `to: X` is **exclusive** (`< X`).
- `from: X` is **inclusive** (`>= X`).
- Top-down evaluation; first match wins.

Always write disjoint, gap-free buckets. Overlapping `[{to:70},
{from:50, to:80}, {from:70}]` makes the second bucket unreachable for
values < 70.

## Seven options (10.4 reference)

| Option | Type | Default | Notes |
|---|---|---|---|
| `value` | number / DOS | first numeric col | Override binding with DOS. |
| `gaugeColor` | colour / DOS | theme primary | Fill colour. **Single colour only.** |
| `orientation` | enum | `vertical` | `vertical` \| `horizontal`. |
| `labelDisplay` | enum | `number` | `number` \| `percentage` \| `off`. |
| `valueDisplay` | enum | `number` | `number` \| `percentage` \| `off`. |
| `majorTickInterval` | number (px) | auto | Pixel spacing of major ticks. |
| `backgroundColor` | colour | theme panel bg | Panel tint. |

## Verified patterns

20 panels in `ds_viz_fillergauge_dark`. Inspect for live JSON. Patterns
include: default at low/mid/high, horizontal orientation, static
`gaugeColor`, dynamic threshold colouring, upstream-scaled quota
progress, percentage display modes, no-chrome 4-up vertical bank
(CPU/MEM/DISK/NET), stacked horizontal queue panel.

## What fillergauge does NOT have

- No `gaugeRanges` (markergauge only).
- No `maxValue` (singlevalueradial only).
- No `trendValue` / `trendDisplay`.
- No legend, no axes, no annotations, no overlay.
- `gaugeColor` is single colour at any moment — no banded zones.

## See also

- `ds-viz-markergauge` — banded zones via `gaugeRanges`.
- `ds-viz-singlevalueradial` — radial fill with `maxValue` and
  `radialBackgroundColor`.
- `ds-viz-singlevalue` — the number is hero; supports sparklines and
  trend.
- `ds-design-principles` — palette, panel-tint guidance.
