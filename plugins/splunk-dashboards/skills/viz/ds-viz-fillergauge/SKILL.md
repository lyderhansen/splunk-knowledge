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

| Orientation | Editor minimum (w × h) | Sweet spot |
| ----------- | ---------------------- | ---------- |
| `vertical`  | **200 × 200**           | 280 × 300  |
| `horizontal`| **200 × 150**           | 460 × 220  |

(Verified on Splunk Enterprise 10.2.1. Below these the bar artwork clips and the value/label readouts collide.)

In KPI rows of 4-6 tiles, prefer `horizontal` so labels don't crop.

### Packing tighter than the editor allows

The Studio editor refuses to drag a fillergauge below the minimums above. To get a denser KPI bank — the kind where four bars side-by-side read as one host-status indicator — use **transparent panel chrome**:

```json
"options": {
  "gaugeColor": "#33FF99",
  "labelDisplay": "off",
  "valueDisplay": "off",
  "backgroundColor": "transparent"
}
```

Why it works: the surface card around each panel disappears, so adjacent tiles stop looking like separate panels. With `labelDisplay: "off"` and `valueDisplay: "off"` the bar artwork itself is the panel content — at 200 × 200 vertical or 220 × 150 horizontal it's plenty.

**Rules of thumb:**

- Don't drop below the editor minimum — the bar artwork breaks below that even with transparent chrome.
- 4–8 px gap between tiles. Edge-to-edge looks glued; >8 px loses the "one unit" reading.
- Use `gaugeColor` consistently across the bank, OR vary it deliberately to encode severity (green/amber/red ramp). Random colours destroy the at-a-glance grouping.
- For dynamic colour inside a compact tile, the same DOS `rangeValue` pattern from the *Threshold colouring with DOS* section works — the threshold lookup is colour-only, no chrome change needed.

See patterns 13–20 for live examples (4-up vertical CPU/MEM/DISK/NET bank; stacked horizontal queue depth panel).

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

The test dashboard has 20 panels covering every option:

**Option matrix (panels 1–12):**

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

**Compact tile bank (panels 13–20):**

13–16. **4-up vertical bank** at 200 × 200 each, transparent chrome, severity-coloured fills (`#33FF99` / `#FFB627` / `#FF2D95` / `#7AA2FF` for CPU/MEM/DISK/NET). Layout: blocks at `y: 1380, h: 200, w: 200`, `x` stepping `16 → 216 → 416 → 616`. The panel `title` carries each metric label since `labelDisplay` is off.

17–20. **Stacked horizontal queue panel** at 220 × 150 each, transparent chrome, severity-coloured fills representing ingest / search / indexer / forwarder queues. Layout: blocks at `x: 856, w: 220, h: 150`, `y` stepping `1380 → 1538 → 1696 → 1854` (158 px row height = 150 px tile + 8 px gap).

The `options` block for every compact tile is the same shape — only `gaugeColor`, `dataSources.primary`, and (for horizontal) `orientation` change:

```json
"options": {
  "gaugeColor": "#33FF99",
  "labelDisplay": "off",
  "valueDisplay": "off",
  "backgroundColor": "transparent"
}
```

The light-theme companion `ds_viz_fillergauge_light` uses the same 20 patterns with the light palette (blue / amber / rose).

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

### Threshold semantics (the trap that bit us in v1)

`rangeValue` evaluates the bucket array **top-down** and uses **half-open** intervals:

- `to: X` is **exclusive** — matches values strictly **less than** X.
- `from: X` is **inclusive** — matches values **>= X**.

If you write `[{"to": 70}, {"from": 50, "to": 80}, {"from": 70}]` (overlapping) the second bucket is unreachable for any value < 70 because the first bucket already matched, and you get red where you intended amber. **Always write disjoint, gap-free buckets**, with each bucket's lower bound equal to the previous bucket's upper bound:

```json
[
  { "to": 50,             "value": "#FF2D95" },
  { "from": 50, "to": 80, "value": "#FFB627" },
  { "from": 80,           "value": "#33FF99" }
]
```

Read this as: "red below 50, amber 50 to 80, green at or above 80." The first bucket has no `from` (means -infinity); the last has no `to` (means +infinity).

If you also leave a gap (e.g. `to:50` then `from:60`) the missing range (50-60) doesn't pick up *any* bucket and `gaugeColor` falls back to the theme primary, which on most dark themes is purple-ish — not what you want.

## Gotchas

- **No `gaugeRanges`.** That option only exists on `markergauge`. If you need banded zones, switch viz type.
- **No `maxValue`.** Default scale is 0-100. Re-scale upstream for non-percentage values.
- **`gaugeColor` is a single colour.** Static hex or DOS expression - both produce one fill colour at any given moment. Side-by-side panels 5 and 6 in the test dashboard demonstrate this.
- **`majorTickInterval` is in pixels, not values.** `25` means "tick every 25px along the gauge axis", not "tick every 25 units of value".
- **`labelDisplay` and `valueDisplay` accept `percentage` only when the source value range matches.** With a 0-100 scale, `percentage` and `number` render identically. The mode becomes meaningful only when the source units differ from the gauge scale.
- **`backgroundColor` must contrast with `gaugeColor`.** Dark fill on dark bg disappears. Pick from the theme palette or use a tinted near-black for alarm tiles.
- **Editor minimum is 200 × 200 vertical / 200 × 150 horizontal** (verified on Splunk Enterprise 10.2.1). Below that the bar artwork breaks. To pack tiles tighter than the editor's chrome implies, set `backgroundColor: "transparent"` on each tile so adjacent panels stop reading as separate cards — see patterns 13–20 and the *Packing tighter* section above.
- **No annotations, no overlay, no trend line.** Use a sibling `splunk.singlevalue` with a sparkline if you need history alongside the fill.

## Cross-references

- `splunk.markergauge` - banded zones via `gaugeRanges` (use when message is "which zone are we in").
- `splunk.singlevalueradial` - radial fill with `maxValue` support and a separate `radialBackgroundColor`.
- `splunk.singlevalue` - the number is the hero; supports sparklines and trend.
- `splunk-dashboard-couture` - palette and panel-tint guidance.
