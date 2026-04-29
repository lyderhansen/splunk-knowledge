---
name: ds-viz-markergauge
description: Splunk Dashboard Studio splunk.markergauge visualization — single value plotted as a marker against a banded scale. Provides patterns for NPS gauges, CSAT bands, latency budgets, capacity bands, KPI tile banks, and executive scorecards. Use when the user asks about marker gauges, banded gauges, gaugeRanges, NPS, CSAT, SLO bands, or value-within-band displays in Splunk Dashboard Studio.
---

# splunk.markergauge — banded marker gauge

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_markergauge_dark` /
`ds_viz_markergauge_light`.

`splunk.markergauge` is a single value plotted as a marker against a
banded scale. The bands come from `gaugeRanges` (a list of
`{from, to, value}` entries where `value` is a hex colour); the
marker's position shows where the live value sits within those bands.

## When to use

- The metric has a **target zone or band** — NPS (Detractor / Passive
  / Promoter), CSAT (poor / acceptable / great), latency budget
  (under SLO / warning / breach), capacity bands.
- *Position within bands* is part of the message — "we're well into
  the warning band" reads better than "318 ms".
- Executive scorecards pairing a number with banded context.

## When NOT to use

- **Fill ratio** (X% of fixed total) → `splunk.singlevalueradial`.
- **Banded fill** (the band itself fills, not just a marker on it) →
  `splunk.fillergauge`.
- **Plain trend metric with no zones** (revenue, errors, MAU) →
  `splunk.singlevalue` with sparkline.

## Quick start

```json
{
  "type": "splunk.markergauge",
  "title": "API latency p95",
  "dataSources": { "primary": "ds_latency" },
  "options": {
    "orientation": "vertical",
    "gaugeRanges": [
      { "from":   0, "to": 100, "value": "#33FF99" },
      { "from": 100, "to": 200, "value": "#FFB627" },
      { "from": 200, "to": 500, "value": "#FF2D95" }
    ]
  }
}
```

Marker reads `> primary | seriesByType("number") | lastPoint()` —
first numeric column, last point.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **`gaugeRanges` covers full value range** so the marker always lands somewhere. | Define bands that don't span the data — marker disappears off the end. |
| **Square or wide panels:** vertical 460×280, horizontal 460×220. | Drop below editor minimum (vertical 200×200, horizontal 200×150) — marker artwork clips. |
| **KPI tile banks:** `backgroundColor: "transparent"` + `labelDisplay: "off"` + `valueDisplay: "off"` for dense packing. | Edge-to-edge tiles — looks glued; keep 4–8 px gap. |
| **Consistent bands across a bank** — same colours mean same severity across CPU/MEM/DISK/NET tiles. | Different `gaugeRanges` per tile in a bank — destroys at-a-glance pattern. |
| **Show the number too** when context is unfamiliar — sibling `splunk.singlevalue`, or `valueDisplay: "number"`. | Hide both label and value AND lack a sibling number — viewer can't decode the marker position. |
| **Threshold semantics:** `from` inclusive, `to` exclusive, top-down evaluation. | Overlap bands — value lands in first match (top-down), not "best fit". |

## Minimum panel sizes

| Orientation | Editor minimum | Sweet spot |
|---|---|---|
| `vertical` | 200 × 200 | 460 × 280 |
| `horizontal` | 200 × 150 | 460 × 220 |

## Verified patterns (live in `splunk-knowledge-testing`)

20 panels in test bench. Inspect for live JSON. Patterns include:

- **1–3.** Default vertical at low / mid / high — proves marker moves.
- **4.** `orientation: "horizontal"` — dense KPI rows.
- **5.** `gaugeRanges` with 3 RAG bands.
- **6.** 5-band gradient (extra granularity).
- **7.** `labelDisplay: "off"` + `valueDisplay: "number"` — number-only.
- **8.** `valueDisplay: "off"` — band position only.
- **9.** Custom `valueColor` for emphasis.
- **10.** `transparent` background — KPI bank packing.
- **11.** `numberPrecision: 1` for percent metrics.
- **12.** `unit` + `unitPosition` (rare on gauge — most use sibling singlevalue).
- **13–16.** 4-up vertical CPU/MEM/DISK/NET bank — `transparent`, no labels.
- **17–20.** Stacked horizontal latency profile (p50 / p95 / p99 / p999).

## Options summary

`orientation` (`"vertical"` \| `"horizontal"`), `gaugeRanges` (array of
`{from, to, value}`), `value` (DOS, default `> primary |
seriesByType("number") | lastPoint()`), `labelDisplay`
(`"off"` \| `"number"`), `valueDisplay` (`"off"` \| `"number"`),
`valueColor`, `numberPrecision`, `unit`, `unitPosition`,
`backgroundColor`.

For full table see [OPTIONS.md](OPTIONS.md).

## Gotchas

- `gaugeRanges` thresholds: `from` inclusive, `to` exclusive,
  top-down. Same as `singlevalue` thresholds.
- Marker silently disappears when value falls outside all bands —
  always include a catch-all `from: <max>` band.
- Editor minimum panel sizes are real — drag smaller and the marker
  artwork clips even though `transparent` chrome looks fine.
- KPI bank consistency: same colour scale across all tiles, or the
  pattern breaks.

## See also

- `ds-viz-fillergauge` — when the band itself fills.
- `ds-viz-singlevalueradial` — for ring-fill / percentage of whole.
- `ds-viz-singlevalue` — sibling for the number in a KPI bank.
- `ds-design-principles` — RAG colour conventions.
