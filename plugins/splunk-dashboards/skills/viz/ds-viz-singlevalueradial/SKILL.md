---
name: ds-viz-singlevalueradial
description: Splunk Dashboard Studio splunk.singlevalueradial visualization — single value rendered as a radial fill (ring) where maxValue sets the ceiling and the arc shows progress against it. Provides patterns for SLA uptime, backup completion, capacity used, daily quota progress, traffic-light arc colouring, and the "big number with breakdown ring" overlay. Use when the user asks about radial gauges, progress rings, percent-of-whole, maxValue, radialStrokeColor, or quota meters in Splunk Dashboard Studio.
---

# splunk.singlevalueradial — radial fill ring

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_singlevalueradial_dark` /
`ds_viz_singlevalueradial_light`.

A single value drawn inside a partial ring. The arc fills from 0 to
`maxValue` (default 100) — read it as *"percentage of a known whole"*.

## When to use

- **Progress against a known whole** — SLA uptime (% of 100), backup
  completion, disk used (GB of capacity), orders toward daily quota.
- **Visual fill ratio** is part of the message — a half-empty ring
  reads "halfway there" without parsing the number.
- **Dynamic `radialStrokeColor`** for traffic-light arcs.

## When NOT to use

- **No meaningful ceiling** (revenue, error count, latency) → 
  `splunk.singlevalue`.
- **Number against a target range** (low / high zones) → 
  `splunk.markergauge` or `splunk.fillergauge`.
- **Sparkline-driven tile** — radial does NOT support sparklines.
- **Categorical breakdown** → `splunk.pie` (different semantics,
  similar shape).

## Layout requirement

`splunk.singlevalueradial` **only renders inside Absolute layout**. In
Grid layout the arc collapses and the panel falls back to plain
singlevalue.

```json
"layout": { "type": "absolute", "options": { "width": 1440, "height": 900 } }
```

## Quick start

```json
{
  "type": "splunk.singlevalueradial",
  "title": "Uptime SLA",
  "dataSources": { "primary": "ds_uptime" },
  "options": {
    "underLabel": "Uptime SLA",
    "unit": "%",
    "unitPosition": "after",
    "trendDisplay": "percent",
    "radialStrokeColor": "> primary | seriesByName('pct') | lastPoint() | rangeValue(thresholds)"
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

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Layout:** Absolute only. | Grid layout — arc collapses. |
| **Set `maxValue`** explicitly when ceiling isn't 100 (orders, GB, ticket count). | Pass absolute values without `maxValue` — fill ratio meaningless against default 100. |
| **Threshold colouring:** `radialStrokeColor` DOS + `rangeValue(thresholds)` with disjoint, gap-free buckets. | Overlapping bands — middle bucket unreachable; arc never amber. |
| **High-is-bad metrics:** dynamic `majorColor` to flip the number; keep arc for context. | Use the same colour scale for "low good" (uptime) and "high bad" (disk used) — opposite reading. |
| **Big-number overlay:** chrome-stripped donut + this radial stacked = breakdown ring + KPI number. | Try to use both `splunk.pie` AND `splunk.singlevalueradial` for the same metric — they compete. |

## Verified patterns

12 panels in `ds_viz_singlevalueradial_dark`:

1. **Default high pct** — `maxValue: 100`, value high, reads "almost full".
2. **Mid pct** — visible track + arc contrast at mid-range.
3. **Low pct** — eye reads unfilled portion as "how much left".
4. **`maxValue: 1000`** — non-percentage radial (orders / 1000 quota).
5. **Dynamic `radialStrokeColor`** — traffic-light via `rangeValue`.
6. **Dynamic `majorColor`** — number flips, arc stays calm.
7. **`underLabel` + `unit: "GB"`** — capacity used.
8. **`shouldAbbreviateTrendValue: true`** — compact deltas.
9. **`trendDisplay: "off"`** — static KPI, no time dimension.
10. **`backgroundColor` flips** — whole-tile alert.
11. **Custom `radialBackgroundColor`** — tinted track.
12. **Compact strip pattern** — transparent + locked font sizes.

## Options summary

`maxValue`, `value` (DOS), `majorValue` / `majorValueField` /
`majorColor` / `majorFontSize`, `numberPrecision`, `unit` /
`unitPosition`, `underLabel`, `trendValue` / `trendDisplay` /
`trendColor` / `shouldAbbreviateTrendValue`, `radialStrokeColor`,
`radialBackgroundColor`, `backgroundColor`,
`shouldUseThousandSeparators`.

Full table inline above; no separate OPTIONS file.

## What singlevalueradial does NOT have

- **No sparkline** — `sparkline*` silently ignored.
- **No icon** — that's `splunk.singlevalueicon`.
- **No `gaugeRanges`** — that's markergauge.
- **No legend, axes, `dataValuesDisplay`.**

## See also

- `ds-viz-singlevalue` — number is hero; supports sparklines.
- `ds-viz-singlevalueicon` — KPI tile with icon.
- `ds-viz-markergauge` / `ds-viz-fillergauge` — banded against a range.
- `ds-viz-pie` — chrome-stripped donut for "big number with breakdown
  ring" overlay.
