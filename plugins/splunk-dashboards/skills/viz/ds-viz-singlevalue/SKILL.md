---
name: ds-viz-singlevalue
description: Splunk Dashboard Studio splunk.singlevalue visualization — the default KPI tile with one big number, optional unit, under-label, trend delta, and inline sparkline. Provides patterns for currency, percentage, thresholded health metrics with RAG colouring, sparkline placement, whole-tile flips for alerts. Use when the user asks about KPI tiles, big number, sparkline, majorValue, underLabel, trendDisplay, or thresholded metrics in Splunk Dashboard Studio.
---

# splunk.singlevalue — KPI tile

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_singlevalue_dark` / `ds_viz_singlevalue_light`.

`splunk.singlevalue` is the default KPI tile: one big number with
optional unit, under-label, trend delta, and inline sparkline. The
single most-used visualization in any operational, executive, or SOC
dashboard.

## When to use

- The message is *one number* (revenue, latency, error count,
  conversion %).
- Sparkline (`sparklineDisplay: "below"` is default) when the headline
  is the value but recent trend matters.
- Dynamic colour (`majorColor` via `rangeValue`) for thresholded health
  metrics — green/amber/red is the universal SOC/ops vocabulary.

## When NOT to use

- **Categorical breakdown** → `splunk.pie` (donut) or `splunk.bar`.
- **Number against a target/range** → `splunk.markergauge` or
  `splunk.fillergauge`.
- **Percentage of a known whole** → `splunk.singlevalueradial` reads
  better as a filled ring.
- **Number with leading icon** → `splunk.singlevalueicon`.

## Quick start

```json
{
  "type": "splunk.singlevalue",
  "title": "Conversion rate",
  "dataSources": { "primary": "ds_conversion_trend" },
  "options": {
    "unit": "%",
    "unitPosition": "after",
    "underLabel": "Conversion rate",
    "numberPrecision": 2,
    "trendDisplay": "percent"
  }
}
```

```spl
| timechart span=1h avg(conversion_pct) as conversion
```

## Required data shape

`splunk.singlevalue` is happy with **either**:

1. **One row, one column** — pure KPI. `majorValue` defaults to first
   numeric cell.
2. **Time series** (`_time` + numeric column) — `majorValue` becomes
   `lastPoint()`, `trendValue` becomes `delta(-2)` (last vs.
   second-to-last point), `sparklineValues` is the whole series. Most
   common shape.

For dynamic colour via `rangeValue`, the value must reduce to a single
number.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Always set `underLabel`** — without it, the panel title is the only context. | Skip `underLabel` for production dashboards. |
| **Currency:** `unitPosition: "before"`, `unit: "$"`, `shouldUseThousandSeparators: true`. | `unitPosition: "after"` for currency — `1247$` reads wrong. |
| **Percentages / SI units:** `unitPosition: "after"`, `unit: "%"` / `"ms"` / `"req/s"`. | `unitPosition: "before"` for percentages — `%98.7` reads wrong. |
| **RAG thresholds:** disjoint, gap-free `[{to:60}, {from:60, to:80}, {from:80}]`. | Overlapping `[{to:70}, {from:70, to:90}, {from:90}]` — top-down + `to` exclusive means 70 lands in amber, not red. See [GOTCHAS.md](GOTCHAS.md) #3. |
| **Whole-tile flips:** lock `majorColor: "#FFFFFF"` (dark theme) when driving `backgroundColor` dynamically. | Drive `backgroundColor` without locking `majorColor` — dark-on-dark unreadable. |
| **Static KPI** (single row, no time): `trendDisplay: "off"` AND `sparklineDisplay: "off"`. | Leave defaults on — engine tries `delta(-2)` from one point, renders `--`. |
| **Trend abbreviation:** `shouldAbbreviateTrendValue: true` for currency / large magnitudes (`+1.2K`). | Mix unabbreviated headline with abbreviated trend confusingly — abbreviate both or neither. |
| **Verify thresholds:** at least one demo value per bucket. | Skip QA — if your demo data is 65 you'll never see amber render. |

## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: minimal,
  percentage, currency, static KPI, dynamic `majorColor` (RAG),
  whole-tile flip, sparkline area, sparkline-before/after,
  highlight-dots, precision tuning, chrome-stripped.
- [OPTIONS.md](OPTIONS.md) — all 22 documented options grouped by
  purpose.
- [GOTCHAS.md](GOTCHAS.md) — `trendColor` doesn't auto-flip,
  `numberPrecision` semantics, threshold top-down trap.
- `ds-viz-singlevalueicon` — KPI with leading icon.
- `ds-viz-singlevalueradial` — percentage of known whole.
- `ds-viz-markergauge` / `ds-viz-fillergauge` — value-on-axis.
- `ds-viz-pie` — pair with chrome-stripped donut for "big number with
  breakdown ring".
