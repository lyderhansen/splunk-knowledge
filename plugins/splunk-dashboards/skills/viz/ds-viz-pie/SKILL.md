---
name: ds-viz-pie
description: Reference skill for the `splunk.pie` visualization in Dashboard Studio (v2). Read when plotting **part-of-whole** with a small number of slices. Triggers on 'splunk.pie', 'pie chart', 'donut', 'donut chart', 'showDonutHole', 'collapseThreshold', 'labelDisplay'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-pie — `splunk.pie`

`splunk.pie` is the dedicated chart for **part-of-whole** with a small number of categories. The same visualization renders both pies and donuts (toggle with `showDonutHole`).

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) — the
>    *Pie chart options* section (line ~9117) is the verbatim option list,
>    types, and defaults.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every
>    pattern below was rendered and visually QA'd on Splunk Enterprise 10.2.1.
>    Both files are deployed to the `splunk-knowledge-testing` app as
>    `ds_viz_pie_dark` and `ds_viz_pie_light`.

---

## When to use

- **Use** when the message is *share of total* and there are at most 3–5 meaningful categories.
- **Use** the donut variant (`showDonutHole: true`) for KPI-style breakdown panels — easier to read because the eye compares **arcs** instead of slice areas.
- **Use** `collapseThreshold` to bucket the long tail into a single `Other` slice — converts a 12-slice pie into a 4-slice pie without losing the total.
- **Don't use** for trend over time → `splunk.area` (`stackMode: "stacked100"`) or `splunk.column` (`stackMode: "stacked100"`).
- **Don't use** for ranking — humans read **bars** much faster than pie slices. Reach for `splunk.bar` with a top-N sort.
- **Don't use** with more than ~7 raw slices — by then nothing is readable. Either `collapseThreshold` it down or switch chart family.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

A two-column table: one categorical label, one numeric value. **Always sort descending in SPL** — pie has no built-in sort and slice order is preserved from the underlying search.

```spl
| stats sum(revenue) as revenue by region | sort - revenue
| stats count by browser | sort - count
| stats dc(host) as hosts by status | sort - hosts
| makeresults count=5 | streamstats count as i
| eval region = case(i=1,"US-East", i=2,"US-West", i=3,"EU-West", i=4,"APAC", i=5,"LATAM"),
       revenue = case(i=1,420000, i=2,310000, i=3,265000, i=4,180000, i=5,95000)
| sort - revenue | table region revenue
```

By default Splunk uses the first column as `label` and the second as `value`. Override explicitly with `labelField` / `valueField` if your SPL emits the columns in another order.

---

## Option list (10.4 reference)

The 10.4 *Pie chart options* table lists exactly these properties — anything else from the line/area family does **not** apply to pie.

| Option                | Type                                                    | Default                            | What it does                                                                                       |
| --------------------- | ------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `label`               | `string` / `string[]`                                   | `> primary \| seriesByIndex(0)`    | DOS expression that supplies slice labels. Default reads column 0 of the primary search.           |
| `labelField`          | `string`                                                | `> label \| getField()`            | Column name used for slice labels when not using `label` directly.                                 |
| `value`               | `number[]`                                              | `> primary \| seriesByIndex(1)`    | DOS expression that supplies slice numeric values. Default reads column 1.                         |
| `valueField`          | `string`                                                | `> value \| getField()`            | Column name used for slice values.                                                                 |
| `labelDisplay`        | `"values"` / `"valuesAndPercentage"` / `"off"`          | `"values"`                         | Controls the on-slice label. `off` keeps only the legend.                                          |
| `showDonutHole`       | `boolean`                                               | `false`                            | `true` cuts a centre hole — turns the chart into a donut.                                          |
| `collapseLabel`       | `string`                                                | `"other"`                          | Label used for the bucket slice produced by `collapseThreshold`.                                   |
| `collapseThreshold`   | `number` (0–1)                                          | `0.01`                             | Any slice strictly below this share of the total is folded into a single `collapseLabel` slice.    |
| `seriesColors`        | `string[]`                                              | Splunk default palette             | Ordered list of slice colours. Index *i* paints slice *i*.                                         |
| `seriesColorsByField` | `object` `{label: hex}`                                 | `n/a`                              | Pin colour to slice **label** instead of position. Survives SPL sort/filter changes.               |
| `backgroundColor`     | `string`                                                | `> themes.defaultBackgroundColor`  | Panel background. Use `"transparent"` for chrome-stripped KPI tiles.                               |
| `resultLimit`         | `number`                                                | `50000`                            | Max rows pulled from the primary search before slicing.                                            |

**Things pie does NOT have** (do not invent options that are not in this table):

- No axes, ticks, grid lines, log scale, or `yAxis*` of any kind.
- No `legendDisplay` — the legend renders automatically and cannot be moved or hidden through dashboard options.
- No annotations, no overlays, no dual-axis, no stacking.
- No `dataValuesDisplay` — the on-slice value display is controlled by `labelDisplay`.

If you reach for any of those, you are in the wrong viz family — see `ds-pick-viz`.

---

## Verified patterns

Each pattern below was rendered as a panel in the test bench and visually QA'd. The numbers refer to the matching panel in `ds_viz_pie_dark` / `ds_viz_pie_light`.

### 1. Minimal — default `labelDisplay: "values"`

```json
{
  "type": "splunk.pie",
  "dataSources": { "primary": "ds_basic" },
  "options": {}
}
```

Splunk reads column 0 as label, column 1 as value, and prints the raw value next to each slice. Colours come from the default Splunk palette.

### 2. `labelDisplay: "valuesAndPercentage"` — the executive default

```json
{
  "options": {
    "labelDisplay": "valuesAndPercentage"
  }
}
```

Adds the `% of total` to each on-slice label. The most informative default for executive dashboards. Reach for this 90% of the time.

### 3. `labelDisplay: "off"` — legend-only

```json
{
  "options": {
    "labelDisplay": "off"
  }
}
```

On-slice labels disappear; the legend (always rendered) carries the meaning. Use only when the panel is too narrow for slice labels — otherwise the user has to map colour to label twice (eye → legend → back to slice).

### 4. Donut — `showDonutHole: true`

```json
{
  "options": {
    "showDonutHole": true,
    "labelDisplay": "valuesAndPercentage"
  }
}
```

Cuts a hole in the middle. Donuts are easier to read than full pies because **arc length** (which the eye reads accurately) carries the message, instead of **slice area** (which the eye reads badly).

### 5. `seriesColorsByField` — semantic colour

```json
{
  "options": {
    "labelDisplay": "valuesAndPercentage",
    "seriesColorsByField": {
      "healthy":   "#33FF99",
      "degraded":  "#FFB627",
      "unhealthy": "#FF2D95",
      "unknown":   "#7AA2FF"
    }
  }
}
```

Pins colour to the **label**, not the slice index. Survives SPL field reorders, filter changes, and `collapseThreshold`. Use whenever colour means something (traffic-light, severity, allow/block).

### 6. `collapseThreshold` + `collapseLabel`

```json
{
  "options": {
    "collapseThreshold": 0.02,
    "collapseLabel": "Other",
    "labelDisplay": "valuesAndPercentage"
  }
}
```

Long-tail dataset with 12 categories. Anything below 2% is folded into a single `Other` slice. Reduces the chart to ~5 readable slices without losing the total. Default threshold (`0.01`) is too low for executive dashboards — bump it to `0.02` or `0.05`.

### 7. Donut + `collapseThreshold` — the executive overview pattern

```json
{
  "options": {
    "showDonutHole": true,
    "collapseThreshold": 0.05,
    "collapseLabel": "Other",
    "labelDisplay": "valuesAndPercentage"
  }
}
```

The combination that works for almost any executive overview: donut shape + 5% threshold + percentage labels. Reduces 12 slices to ~5 readable arcs.

### 8. Two-slice donut — allow / block

```json
{
  "options": {
    "showDonutHole": true,
    "labelDisplay": "valuesAndPercentage",
    "seriesColorsByField": {
      "allowed": "#33FF99",
      "blocked": "#FF2D95"
    }
  }
}
```

Two-slice donut is the simplest possible breakdown. Use only when there are exactly two categories and the headline number is the percentage of one of them (block rate, error rate, conversion).

### 9. Single-colour emphasis

```json
{
  "options": {
    "labelDisplay": "valuesAndPercentage",
    "seriesColors": [
      "#00D9FF",
      "#33B3D8",
      "#5A8DB7",
      "#7A6E97",
      "#8C5079"
    ]
  }
}
```

All slices share a single hue, varying lightness. Removes the rainbow effect when the message is the **shape** (one dominant slice + tail), not category identity.

### 10. Chrome-stripped donut — KPI tile

```json
{
  "options": {
    "showDonutHole": true,
    "labelDisplay": "off",
    "backgroundColor": "transparent"
  }
}
```

Strips chrome and labels — turns the donut into a pure shape suitable for embedding inside a custom KPI card. Pair with a `splunk.singlevalue` overlay positioned over the donut hole for the classic "big number with breakdown ring" pattern.

### 11. Aggressive `collapseThreshold: 0.10`

```json
{
  "options": {
    "collapseThreshold": 0.1,
    "collapseLabel": "Rest of world",
    "labelDisplay": "valuesAndPercentage"
  }
}
```

10% threshold. Only the top three categories survive as their own slices, everything else folds into `Rest of world`. Use when the **top-N is the message**, not the long tail.

### 12. `labelDisplay: "values"` — counts only

```json
{
  "options": {
    "labelDisplay": "values"
  }
}
```

Same data as panel 1, default behaviour. Use when raw counts (revenue numbers, host counts) are more meaningful than the proportions.

---

## Gotchas

- **Pie has no `sort` option.** Slice order comes from the SPL result. **Always** end your search with `| sort - <value_field>` so the largest slice is first.
- **`collapseThreshold` is a fraction (0–1), not a percent.** `0.05` means 5%, not 0.05%.
- **`collapseThreshold` operates on the share of the total, not raw value.** Two slices can both be huge and still trigger collapse if their combined share is small relative to a dominant slice.
- **`seriesColorsByField` keys must match the slice label exactly** — case-sensitive, whitespace-sensitive. If the SPL emits `"Healthy"` (capital H), the key must also be `"Healthy"`.
- **The legend always renders and cannot be moved or hidden via options.** If the legend is in the way, switch to `splunk.bar` with `legendDisplay: "off"`.
- **Pie does not respect `defaults.visualizations.global.backgroundColor`** — set `backgroundColor` per panel if you need a transparent or themed background.
- **Donut hole + small panel = no readable label space.** When `showDonutHole: true` and the panel is below ~280 px wide, set `labelDisplay: "off"` and let the legend do the work.

---

## Cross-references

- `ds-pick-viz` — when *not* to use pie (most of the time).
- `ds-viz-bar` — better for ranking, top-N, and >5 categories.
- `ds-viz-column` (with `stackMode: "stacked100"`) — better for "share of total" **over time**.
- `ds-viz-area` (with `stackMode: "stacked100"`) — same use case as `stacked100` column, but for continuous metrics.
- `ds-viz-singlevalue` — pair with a chrome-stripped donut (panel 10) for the "big number with breakdown ring" KPI pattern.
- `ds-design-principles` — colour discipline, when bars beat pies.

---

## Test bench

- `test-dashboard/dashboard.json` (dark) — deployed as `ds_viz_pie_dark` in the `splunk-knowledge-testing` app.
- `test-dashboard/dashboard-light.json` (light) — deployed as `ds_viz_pie_light` in the `splunk-knowledge-testing` app.

Every pattern in this skill corresponds 1:1 to a numbered panel in the test bench. When in doubt, open the dashboards and inspect the live JSON via the source editor.
