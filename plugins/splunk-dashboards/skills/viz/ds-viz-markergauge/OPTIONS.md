# splunk.markergauge — full options reference

7 options total. One of the leanest viz in Dashboard Studio.
Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`,
*Marker gauge options* (lines 7810 and 20898 — identical at both).

| Option | Type | Default | Purpose |
|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | Tile background. Hex, DOS expression, or theme token. |
| `gaugeRanges` | `object[]` | 3-band theme palette | The banded scale. Array of `{from, to, value}` where `value` is a hex colour. **Bands must be contiguous.** |
| `labelDisplay` | `"number"` \| `"percentage"` \| `"off"` | `"number"` | How band thresholds render along the axis. |
| `majorTickInterval` | string \| number | auto | **Pixel spacing**, not value spacing. Pin when auto-layout misjudges. |
| `orientation` | `"horizontal"` \| `"vertical"` | `"vertical"` | Axis orientation. |
| `value` | string (DOS) | `> primary \| seriesByType("number") \| lastPoint()` | Marker value. Override when SPL has multiple numerics. |
| `valueDisplay` | `"number"` \| `"percentage"` \| `"off"` | `"number"` | How marker's value readout renders. |

## Common `gaugeRanges` patterns

### Traffic-light (low good, high bad)

```json
"gaugeRanges": [
  { "from": 0,  "to": 50,  "value": "#33FF99" },
  { "from": 50, "to": 80,  "value": "#FFB627" },
  { "from": 80, "to": 100, "value": "#FF2D95" }
]
```

### Inverse (high good, low bad)

Same bands, flipped. Use for uptime, completion, NPS.

### NPS bands (0–100)

```json
"gaugeRanges": [
  { "from": 0,  "to": 30,  "value": "#FF2D95" },
  { "from": 30, "to": 70,  "value": "#FFB627" },
  { "from": 70, "to": 100, "value": "#33FF99" }
]
```

Real NPS is `-100..100`; map your data to `0..100` upstream or pick
non-zero `from` values.

### Latency budget (custom widths)

```json
"gaugeRanges": [
  { "from": 0,   "to": 200,  "value": "#33FF99" },
  { "from": 200, "to": 500,  "value": "#FFB627" },
  { "from": 500, "to": 1000, "value": "#FF2D95" }
]
```

Bands don't need equal width.

### CSAT 0–5 (decimals OK)

```json
"gaugeRanges": [
  { "from": 0,   "to": 2.5, "value": "#FF2D95" },
  { "from": 2.5, "to": 4,   "value": "#FFB627" },
  { "from": 4,   "to": 5,   "value": "#33FF99" }
]
```

## What markergauge does NOT support

- **No DOS-driven band colours.** `gaugeRanges` values are static hex.
  Bands describe scale, not state. Marker position carries state.
- **No `unit`, no `underLabel`, no `numberPrecision`.** Pair with
  `splunk.singlevalue` for that.
- **No `trendValue` / `trendDisplay`.** Pair with sibling singlevalue.
- **No legend, no axes** (beyond the band axis), **no
  `dataValuesDisplay`.**
- **No trellis support** — viz does not implement `splitByLayout`.

## KPI bank packing

For 4-up vertical bank (CPU/MEM/DISK/NET):

- 200 × 200 tiles, `backgroundColor: "transparent"`,
  `labelDisplay: "off"`, `valueDisplay: "off"`.
- Layout `x` stepping `16 → 216 → 416 → 616`, 16 px gap absorbs panel
  chrome margin.

For stacked horizontal latency profile (p50/p95/p99/max):

- 220 × 150 tiles, same chrome stripping.
- Title attribute becomes row label (since `labelDisplay: "off"`).
- 8 px gap (158 px row height = 150 tile + 8 gap).

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Marker gauge options.
