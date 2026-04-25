---
name: ds-viz-singlevalueradial
description: Reference skill for the `splunk.singlevalueradial` visualization in Dashboard Studio (v2). A single value rendered as a radial fill (a ring) — `maxValue` sets the ceiling, the arc shows progress against it. Triggers on 'splunk.singlevalueradial', 'radial', 'progress ring', 'percent of whole', 'maxValue', 'radialStrokeColor'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-singlevalueradial — `splunk.singlevalueradial`

`splunk.singlevalueradial` is a single value drawn inside a partial ring. The arc fills from 0 to `maxValue` (default `100`) — read it as *"percentage of a known whole"*. Use it for quotas, capacity, completion, SLA progress.

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) — the
>    *Single value radial options* section (line ~11463) is the verbatim option
>    list, types, and defaults.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every pattern
>    below was rendered and visually QA'd on Splunk Enterprise 10.2.1. Both
>    files are deployed to the `splunk-knowledge-testing` app as
>    `ds_viz_singlevalueradial_dark` and `ds_viz_singlevalueradial_light`.

---

## When to use

- **Use** for *progress against a known whole*: SLA uptime (% of 100), backup completion (% of 100), disk used (GB of capacity), orders towards a daily quota.
- **Use** when the visual *fill ratio* is part of the message — a half-empty ring reads "halfway there" without parsing the number.
- **Use** dynamic `radialStrokeColor` for traffic-light arcs (red below 50, amber 50–80, green above 80).
- **Don't use** when there is no meaningful ceiling. A revenue figure, an error count, or a latency value is not a percentage of anything fixed → use `splunk.singlevalue`.
- **Don't use** for a number against a target *range* (low / high zones). `splunk.markergauge` or `splunk.fillergauge` carry that more cleanly with banded colours.
- **Don't use** when you need a sparkline. `splunk.singlevalueradial` does **not** support sparkline options — use `splunk.singlevalue`.
- **Don't use** for a categorical breakdown. That is `splunk.pie` (single ring of category slices) — different visualization, similar shape, very different semantics.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

Same as `splunk.singlevalue`:

1. **One row, one column** — `majorValue` defaults to the first numeric cell; the radial fills `value / maxValue`.
2. **Multiple rows, one numeric column over `_time`** — radial uses the most recent value; `trendValue` is the delta vs. the first point.

```spl
| makeresults count=24
| streamstats count as i
| eval _time = relative_time(now(), "-24h") + (i*3600)
| eval pct = round(58 + sin(i/4)*5 + random()%4)
| table _time pct
```

`maxValue: 100` means `pct=78` fills 78% of the arc. Set `maxValue: 1000` and the same `78` fills 7.8% — useful when the value is an absolute quantity (orders, GB, requests) rather than a percent.

---

## Layout requirement

`splunk.singlevalueradial` **only renders inside Absolute layout**. In a Grid layout the arc collapses and the panel falls back to a plain singlevalue.

```json
"layout": { "type": "absolute", "options": { "width": 1440, "height": 900 } }
```

---

## 12 verified patterns (all live in `splunk-knowledge-testing`)

Each pattern below is a single `splunk.singlevalueradial` panel from the test dashboard. Copy the `options` block.

### 1. Default — high pct (`maxValue` = 100)

```json
"options": {
  "underLabel": "Uptime SLA",
  "unit": "%",
  "unitPosition": "after",
  "trendDisplay": "percent"
}
```

`majorValue` is the last point. `maxValue` defaults to `100`. `radialStrokeColor` falls back to `majorColor` (theme primary). Reads as *"almost full"* when the value is high.

### 2. Mid pct — visible track + arc contrast

Same options, mid value (~62). The contrast between `radialBackgroundColor` (the unfilled track) and `radialStrokeColor` (the filled arc) is most visible at mid-range. The track is theme-default low-alpha; only the arc is the message.

### 3. Low pct — inverse-readable

Low value (~32). The eye reads the *unfilled* portion as "how much is left" — wrong for metrics where high is bad (capacity used). Pair with dynamic `majorColor` (pattern 6) when low is bad and high is bad mean different things.

### 4. `maxValue: 1000` — non-percentage radial

```json
"options": {
  "maxValue": 1000,
  "underLabel": "Orders / 1000 quota",
  "trendDisplay": "absolute",
  "shouldAbbreviateTrendValue": true
}
```

Lets the radial display absolute progress against a target. The number stays as-is; only the fill ratio changes. `maxValue` accepts any positive number — disk capacity in GB, daily order quota, ticket count target.

### 5. Dynamic `radialStrokeColor` via `rangeValue`

The arc colour traffic-lights based on the data. Pattern: `> primary | seriesByName(field) | lastPoint() | rangeValue(thresholds)`.

```json
"options": {
  "underLabel": "Backup completion",
  "unit": "%",
  "unitPosition": "after",
  "trendDisplay": "absolute",
  "radialStrokeColor": "> primary | seriesByName('pct') | lastPoint() | rangeValue(thresholds)"
},
"context": {
  "thresholds": [
    { "to": 50,             "value": "#FF2D95" },
    { "from": 50, "to": 80, "value": "#FFB627" },
    { "from": 80,           "value": "#33FF99" }
  ]
}
```

Arc colour follows the value; `majorColor` stays neutral so the number doesn't compete with the arc.

### 6. Dynamic `majorColor` (number flips, fixed arc)

Inverse pattern to #5: arc stays a calm hue, the number flips on threshold. Reads as *"this value is in trouble"* without redrawing the arc geometry.

```json
"options": {
  "radialStrokeColor": "#7AA2FF",
  "majorColor": "> primary | seriesByName('pct') | lastPoint() | rangeValue(majorThresholds)"
},
"context": {
  "majorThresholds": [
    { "to": 40,             "value": "#33FF99" },
    { "from": 40, "to": 70, "value": "#FFB627" },
    { "from": 70,           "value": "#FF2D95" }
  ]
}
```

### 7. Custom `radialBackgroundColor` (track)

```json
"options": {
  "radialBackgroundColor": "rgba(122, 162, 255, 0.15)",
  "radialStrokeColor": "#33FF99"
}
```

Override when the theme background is unusual or you want the track to disappear (set to `"transparent"` or to the panel's `backgroundColor`).

### 8. `trendDisplay: "off"` — static radial

Single-row data source, no time. The radial alone carries the message — common pattern for quotas, completion bars, configuration health snapshots.

### 9. Both arc *and* number flip

Combines #5 and #6: both `radialStrokeColor` and `majorColor` are DOS-driven against the same thresholds. The whole tile shifts colour. Strong visual but use sparingly — multiple of these compete on the same dashboard.

```json
"options": {
  "maxValue": 1000,
  "underLabel": "Disk used (GB)",
  "shouldAbbreviateTrendValue": true,
  "radialStrokeColor": "> primary | seriesByName('used_gb') | lastPoint() | rangeValue(diskThresholds)",
  "majorColor": "> primary | seriesByName('used_gb') | lastPoint() | rangeValue(diskThresholds)"
}
```

### 10. Dynamic `backgroundColor` (whole tile)

`backgroundColor` flips the entire tile on threshold. **Lock `majorColor` and `radialStrokeColor` to a contrast colour** so the radial stays readable when the bg goes dark/light.

```json
"options": {
  "majorColor": "#FFFFFF",
  "radialStrokeColor": "#FFFFFF",
  "radialBackgroundColor": "rgba(255, 255, 255, 0.2)",
  "backgroundColor": "> primary | seriesByName('used_gb') | lastPoint() | rangeValue(bgThresholds)"
},
"context": {
  "bgThresholds": [
    { "to": 600,             "value": "#152034" },
    { "from": 600, "to": 800, "value": "#A85A1F" },
    { "from": 800,           "value": "#8B1F3A" }
  ]
}
```

One alarm tile per dashboard is plenty.

### 11. `shouldUseThousandSeparators: false`

Strips commas. Less common for radials than for plain singlevalue, but works the same way.

### 12. `numberPrecision: 2`

Two decimals on the centre value. Standard for currency / margin metrics rendered as a radial.

---

## Options reference (16 total — verified against 10.4.2604)

`splunk.singlevalueradial` exposes the singlevalue value+trend+chrome groups **MINUS** sparklines / icons / font-size locks, **PLUS** three radial-specific options.

### Radial-specific (3 — unique)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `maxValue` | number | `100` | The fill ceiling. The arc fills `majorValue / maxValue`. |
| `radialBackgroundColor` | hex / theme token / DOS | theme low-alpha | The unfilled track. Default is a low-alpha tone of theme primary (`rgba(0,0,0,0.1)` on light, `rgba(255,255,255,0.15)` on dark). |
| `radialStrokeColor` | hex / theme token / DOS | `majorColor` | The filled arc. Falls back to `majorColor` if not set. |

### Value group (5 — same as singlevalue)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `majorValue` | number / DOS expression | `> primary \| seriesByPrioritizedTypes(...) \| lastPoint()` | The centre number. |
| `majorValueField` | string | first numeric column | Pick a specific column. |
| `majorColor` | hex / theme token / DOS | theme default font colour | Number colour. Use DOS for thresholds. |
| `numberPrecision` | integer 0–20 | `0` | Decimal places. |
| `unit` | string | unset | Unit text (`$`, `%`, `ms`, `/100`). |
| `unitPosition` | `"before"` \| `"after"` | `"after"` | Which side of the number. |
| `underLabel` | string | unset | Label below the number. |

### Trend group (3 — same as singlevalue, minus font-size lock)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `trendValue` | number / DOS | `> primary \| ... \| delta(-2)` | The trend delta. |
| `trendDisplay` | `"absolute"` \| `"percent"` \| `"off"` | `"absolute"` | Hide or format the trend. |
| `trendColor` | hex / theme token / DOS | theme default font colour | Trend text colour. |
| `shouldAbbreviateTrendValue` | boolean | `false` | `+1.2K` vs `+1,245`. |

### Chrome group (2 — same as singlevalue)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `backgroundColor` | hex / theme token / DOS | theme default background | Tile background. **Inherits theme** (vs. `splunk.singlevalueicon` which defaults to `transparent`). |
| `shouldUseThousandSeparators` | boolean | `true` | Comma separators. |

---

## What `splunk.singlevalueradial` does **not** support

These options exist on `splunk.singlevalue` but are **silently ignored** here:

- All `sparkline*` options — **no sparkline**.
- `majorFontSize`, `underLabelFontSize`, `trendFontSize` — fonts are auto-sized to fit the arc.
- All `icon*` options — that is `splunk.singlevalueicon`.

It also does **not** support: legend, axes, `dataValuesDisplay` — same constraints as `splunk.singlevalue`.

---

## Gotchas

1. **`maxValue` defaults to 100, not "the highest value seen"**. If your data is in GB and your disk is 500GB, set `"maxValue": 500` — otherwise the arc is permanently `>100% full` and renders weirdly.
2. **`radialStrokeColor` defaults to `majorColor`**. Set them independently if you want the arc and number to be different colours.
3. **DOS expressions in `radialStrokeColor`/`majorColor`** must reference a field that is *in the data*. `seriesByName('pct')` fails silently if the column is `value` or `used_gb`. Match the SPL output column.
4. **Absolute layout only**. Inside Grid layout the arc collapses.
5. **No sparkline.** Don't try `sparklineDisplay`. Use `splunk.singlevalue` for tile + sparkline.
6. **Light theme readability.** When `backgroundColor` flips to a light tone via `rangeValue`, lock `majorColor` and `radialStrokeColor` to a dark hex (`#1A1A1A`). The default theme text colour will be light and disappear on the light bg.
7. **`trendDisplay: "off"`** is the right choice when the data source is a single static row — otherwise Splunk renders `+0` or NaN where the trend should be.
8. **Aspect ratio.** The radial wants roughly square panels. Long rectangular panels squash the arc. Recommended panel size: `460×220` (the test dashboard standard) up to `460×360`.

---

## Test dashboard

- **Dark:** `splunk-knowledge-testing` → `ds_viz_singlevalueradial_dark`
- **Light:** `splunk-knowledge-testing` → `ds_viz_singlevalueradial_light`

Both dashboards live at `plugins/splunk-dashboards/skills/viz/ds-viz-singlevalueradial/test-dashboard/` and are validated by `splunk_dashboards.validate.check_all`.

---

## Cross-references

- `ds-viz-singlevalue` — the icon-less, sparkline-supporting variant. Use when there's no fixed ceiling.
- `ds-viz-singlevalueicon` — singlevalue + leading icon.
- `ds-viz-markergauge` — single value as a point on a banded axis (target ranges, low/mid/high zones).
- `ds-viz-fillergauge` — single value as a filled bar against a range.
- `ds-pick-viz` — full decision matrix.
- `ds-design-principles` — KPI tile sizing, contrast, hierarchy.
