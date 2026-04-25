---
name: ds-viz-markergauge
description: Reference skill for the `splunk.markergauge` visualization in Dashboard Studio (v2). A single value plotted as a marker against a banded scale — `gaugeRanges` defines colour zones, the marker shows where the value sits within them. Triggers on 'splunk.markergauge', 'marker gauge', 'banded gauge', 'gaugeRanges', 'KPI bands', 'NPS gauge', 'CSAT gauge'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-markergauge — `splunk.markergauge`

`splunk.markergauge` is a single value plotted as a marker against a banded scale. The bands come from `gaugeRanges` (a list of `{from, to, value}` entries where `value` is a hex colour); the marker's position shows where the live value sits *within* those bands.

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) — *Marker gauge options* (lines 7810 and 20898). The reference is identical at both locations.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every pattern below was rendered and visually QA'd on Splunk Enterprise 10.2.1. Both files are deployed to the `splunk-knowledge-testing` app as `ds_viz_markergauge_dark` and `ds_viz_markergauge_light`.

---

## When to use

- **Use** when the metric has a **target zone or band** — NPS bands (Detractor / Passive / Promoter), CSAT (poor / acceptable / great), latency budget (under SLO / warning / breach), capacity bands.
- **Use** when the *position within bands* is part of the message — "we're well into the warning band" reads better than "318 ms".
- **Use** for executive scorecards that pair a number with a banded context.
- **Don't use** for *fill ratio* (X% of a fixed total) — that's `splunk.singlevalueradial` (`maxValue` + arc).
- **Don't use** for *banded fill* (the band itself fills, not just a marker on the band) — that's `splunk.fillergauge`.
- **Don't use** for plain trend metrics with no zones (revenue, errors, MAU). That's `splunk.singlevalue` with a sparkline.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

A single numeric value. The marker reads `> primary | seriesByType("number") | lastPoint()` by default — pick the first numeric column.

```spl
| makeresults | eval value = 64 | table value
```

Multiple rows over time are fine — only the last numeric point is used.

---

## Layout requirement

Works in both Absolute and Grid layouts. Best results in roughly square panels (`460×280` vertical) or wide rows (`460×220` horizontal).

---

## 12 verified patterns (all live in `splunk-knowledge-testing`)

### 1–3. Default vertical at low / mid / high

Pure default — no `options` block at all. `orientation` falls back to `vertical`, `labelDisplay` and `valueDisplay` to `number`, `gaugeRanges` to a 3-band theme palette. Pattern 1 sits low, pattern 2 mid, pattern 3 high — proves the marker actually moves.

```json
"viz_default_mid": {
  "type": "splunk.markergauge",
  "dataSources": { "primary": "ds_kpi_mid" }
}
```

### 4. `orientation: horizontal`

```json
"options": { "orientation": "horizontal" }
```

Use horizontal in dense KPI rows; vertical reads better with breathing room (executive boards).

### 5. `gaugeRanges` — traffic light (low good, high bad)

The user-confirmed syntax:

```json
"options": {
  "gaugeRanges": [
    { "from": 0,  "to": 50,  "value": "#33FF99" },
    { "from": 50, "to": 80,  "value": "#FFB627" },
    { "from": 80, "to": 100, "value": "#FF2D95" }
  ]
}
```

**Bands MUST be contiguous.** Leave a gap (`from:0,to:40` then `from:60,to:100`) and the missing range renders grey.

### 6. `gaugeRanges` — inverse (high good, low bad)

Same bands flipped — green on the right, red on the left. Use when high IS good (uptime, completion, NPS).

### 7. NPS bands (0–100 mapped to Detractor / Passive / Promoter)

```json
"gaugeRanges": [
  { "from": 0,  "to": 30,  "value": "#FF2D95" },
  { "from": 30, "to": 70,  "value": "#FFB627" },
  { "from": 70, "to": 100, "value": "#33FF99" }
]
```

Real NPS is `-100..100`; map your data to `0..100` upstream in SPL or pick non-zero `from` values for the first band.

### 8. Latency budget (0–1000ms, custom band widths)

```json
"gaugeRanges": [
  { "from": 0,   "to": 200,  "value": "#33FF99" },
  { "from": 200, "to": 500,  "value": "#FFB627" },
  { "from": 500, "to": 1000, "value": "#FF2D95" }
]
```

Bands don't need to be equal width — wider warning band, narrower critical band, all fine.

### 9. CSAT 0–5 (small range)

```json
"gaugeRanges": [
  { "from": 0,   "to": 2.5, "value": "#FF2D95" },
  { "from": 2.5, "to": 4,   "value": "#FFB627" },
  { "from": 4,   "to": 5,   "value": "#33FF99" }
]
```

Small ranges (0–5, 0–10) are fine. Decimals work in `from`/`to`.

### 10. `labelDisplay: "off"` + `valueDisplay: "off"`

Strips the band labels and the value readout — pure visual band. Useful when a separate `splunk.singlevalue` carries the number and the gauge is just contextual band colour.

### 11. `labelDisplay: "percentage"` + `valueDisplay: "percentage"`

Both render as percentages of the total range. With `from:0,to:100` they're identical to the numbers; with `from:0,to:1000` (latency) the value `320` displays as `32%`. Use when *position* matters more than the absolute number.

### 12. `majorTickInterval` + custom `backgroundColor`

```json
"options": {
  "majorTickInterval": 20,
  "backgroundColor": "#1B0E1F"
}
```

`majorTickInterval` is **in pixels** — pin it when auto layout produces too few or too many ticks. `backgroundColor` is theme-driven by default but accepts any hex; useful for highlighting alarm tiles without losing the bands.

---

## Options reference (7 total — verified against 10.4.2604)

`splunk.markergauge` is one of the leanest visualizations in Dashboard Studio. **Only seven options exist.**

| Option | Type | Default | Purpose |
|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | Tile background. Hex (`#FFFFFF`), DOS expression, or theme token. |
| `gaugeRanges` | `object[]` | 3-band theme palette | The banded scale. Array of `{from, to, value}` objects where `value` is a hex colour. **Bands must be contiguous.** |
| `labelDisplay` | `"number"` \| `"percentage"` \| `"off"` | `"number"` | How band thresholds render along the axis. |
| `majorTickInterval` | string \| number | (auto) | Pixel spacing between major ticks. Pin when auto-layout misjudges. |
| `orientation` | `"horizontal"` \| `"vertical"` | `"vertical"` | Axis orientation. |
| `value` | string | `> primary \| seriesByType("number") \| lastPoint()` | DOS expression for the marker value. Override only when the data source has multiple numeric columns and you need a specific one. |
| `valueDisplay` | `"number"` \| `"percentage"` \| `"off"` | `"number"` | How the marker's value readout renders. |

---

## What `splunk.markergauge` does **not** support

- **No DOS-driven band colours.** `gaugeRanges` values are static hex strings — you can't compute them from data. (The marker's *position* moves with the data; the band colours don't.)
- **No `unit`, no `underLabel`, no `numberPrecision`.** That's `splunk.singlevalue` and friends. The marker's value readout uses raw numbers.
- **No `trendValue` / `trendDisplay`.** No trend delta. Pair the gauge with a separate singlevalue tile if you need both.
- **No legend, no axes (beyond the band axis), no `dataValuesDisplay`.** It's deliberately minimal.

---

## Gotchas

1. **Bands must be contiguous.** Gaps render grey. Always make `band[i].to == band[i+1].from`.
2. **Band colours are static.** You cannot use Dynamic Options Syntax inside `gaugeRanges[*].value`. The bands describe the *scale*, not the *current state*. The marker's position carries the state.
3. **Marker direction.** In vertical orientation, low values sit at the bottom. In horizontal, low values sit on the left. Pick the orientation that matches the audience's reading direction (most western audiences read horizontal left-to-right as low-to-high).
4. **Default `gaugeRanges` is theme-driven.** If you don't specify, Splunk picks 3 bands from the active theme palette. Don't rely on this for production — set explicit `gaugeRanges` so the dashboard reads the same way after a theme upgrade.
5. **`majorTickInterval` is in pixels, not values.** `"majorTickInterval": 20` means "draw a major tick every 20 pixels", not "every 20 units". For value-based intervals, calculate `pixels = panelWidth / numTicks` upstream.
6. **`valueDisplay: "percentage"` is relative to the gauge total range, not 100.** With `gaugeRanges` summing to `1000`, a value of `320` displays as `32%`. Confused designers expect `32` to display as `32%` — set the total span to 100 if you need that mapping.
7. **No `splunk.markergauge` inside Trellis.** The viz does not implement `splitByLayout` — keep it out of trellis layouts.
8. **Layout aspect ratio.** Vertical wants ~1.5:1 height:width or taller. Horizontal wants ~2:1 width:height or wider. Square panels squash the marker.

---

## Test dashboard

- **Dark:** `splunk-knowledge-testing` → `ds_viz_markergauge_dark`
- **Light:** `splunk-knowledge-testing` → `ds_viz_markergauge_light`

Both dashboards live at `plugins/splunk-dashboards/skills/viz/ds-viz-markergauge/test-dashboard/` and are validated by `splunk_dashboards.validate.check_all`.

---

## Cross-references

- `ds-viz-fillergauge` — the band itself fills (not just a marker on the band). Use when "this much of the budget is consumed" reads better than "this is where we sit on the budget axis".
- `ds-viz-singlevalueradial` — single value as a radial fill (`value/maxValue`). Use when there is a fixed ceiling, not banded zones.
- `ds-viz-singlevalue` — number + sparkline + trend, no bands.
- `ds-pick-viz` — full decision matrix.
- `ds-design-principles` — KPI tile sizing, contrast, hierarchy, banded-gauge readability.
