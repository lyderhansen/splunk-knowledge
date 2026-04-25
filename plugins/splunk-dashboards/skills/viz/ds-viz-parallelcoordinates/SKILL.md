---
name: ds-viz-parallelcoordinates
description: |
  splunk.parallelcoordinates - plot many numeric variables on parallel
  vertical axes; each row of data becomes a line that threads every axis.
  Reveals correlations, clusters, and outliers across high-dimensional
  data. Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_parallelcoordinates_dark
  - ds_viz_parallelcoordinates_light
related:
  - ds-viz-bubble
  - ds-viz-scatter
  - ds-viz-line
  - ds-viz-table
---

# splunk.parallelcoordinates

A **parallel coordinates** chart draws one vertical axis per field and one
line per row. The line crosses every axis, hitting each axis at the row's
value for that field. It's the workhorse for **high-dimensional data
exploration** - 4-8 numeric variables at once.

> "Each axis is a magnifying glass; each line is a fingerprint."

## When to use it

| You want to show...                                  | Parallel coords? |
| ---------------------------------------------------- | ---------------- |
| Correlations / clusters across 4-8 numeric fields    | Yes |
| Anomalous rows in a multi-feature dataset            | Yes |
| Workload signatures across services (cpu, mem, lat, errors) | Yes |
| 1-2 dimensions only                                  | No -> scatter / line |
| Time series                                          | No -> line / area |
| Ranked categories                                    | No -> bar / column |
| You need exact row inspection                        | No -> table |

## Data shape

The most important rule: **field order in your SPL output is the axis order.**

```
... | <stats / table / chart> field1 field2 field3 field4 ...
```

The visualization renders one axis per field, in the order they appear. The
first column is allowed to be a string label (renders as a categorical
axis). Numeric fields get continuous vertical scales.

| Column | Role                |
| ------ | ------------------- |
| 1      | First axis (commonly a categorical label) |
| 2..N   | Numeric axes (one per field)              |

The PDF's canonical example uses:
```
| inputlookup examples.csv
| fields nutrients*
| search "nutrients_protein (g)" != null
| stats count by nutrients_group nutrients_calories "nutrients_protein (g)" "nutrients_water (g)"
| fields - count
```
producing axes: `nutrients_group | nutrients_calories | protein | water`.

## Options

The full option surface is **only 4 properties** (per the 10.4 PDF):

| Option            | Type                          | Default                 |
| ----------------- | ----------------------------- | ----------------------- |
| `backgroundColor` | string (hex)                  | theme default (`#FFFFFF` light, `#000000` dark, `#0b0c0e` Prisma dark) |
| `lineColor`       | string (hex)                  | `#7B56DB`               |
| `lineOpacity`     | number (0-1) \| percent string| `0.5`                   |
| `showNullAxis`    | boolean                       | `true`                  |

Notes:
- `lineOpacity` accepts both numeric (`0.5`) and string-percent (`"50%"`) forms.
- `lineColor` is **a single color** for all lines. Parallel coordinates does
  not support per-row coloring out of the box - if you need cohort coloring,
  consider rendering multiple paneled instances filtered to one cohort each.
- `showNullAxis: false` hides the dedicated null tick so axes look cleaner,
  but rows with nulls will visually disappear on the affected axis.

## Verified patterns

12 panels are deployed in `ds_viz_parallelcoordinates_dark` /
`ds_viz_parallelcoordinates_light`:

1. **Default** - 5 axes, brand purple at 0.5 opacity.
2. **Canonical PDF example** - 4 axes with categorical first column.
3. **lineOpacity=0.15** - density-as-signal for many overlapping lines.
4. **lineOpacity=0.95** - editorial; only works for <20 rows.
5. **Custom lineColor** - brand teal.
6. **Alert variant** - red on dark for SOC.
7. **showNullAxis=true** - default, exposes null-tick on axes with gaps.
8. **showNullAxis=false** - cleaner; null-rows disappear visually.
9. **Correlation** - axes go x, correlated, inverse, noise. Visually
   parallel between x/correlated; X-shaped between x/inverse.
10. **Custom backgroundColor** - tinted panel for editorial dashboards.
11. **lineOpacity as %** - validates `"50%"` string form.
12. **Dense** - many rows + low opacity reveals modal paths.

## Drilldown

Parallel coordinates supports the standard drilldown surface. Tokens:

- `$click.value$` - clicked row's primary value (often the categorical label).
- `$row.<field>$` - any field from the underlying row.

Pattern - drill into a service signature:

```json
"eventActions": {
  "actions": [
    {
      "type": "openSearch",
      "search": "index=app sourcetype=metrics service=$row.service$"
    }
  ]
}
```

## Common gotchas

- **Axis order is column order.** Re-order via `| table fieldA fieldB fieldC`.
  This is the single biggest source of "why does my chart look wrong?"
- **Mixing categorical and numeric axes** works, but only one categorical
  axis (typically the first column) renders cleanly.
- **More than ~8 axes** crushes labels and lines - prefer two stacked
  panels with overlapping axes instead.
- **Many rows + high opacity** = unreadable. Drop opacity to 0.1-0.2 when
  rows >50.
- **Strong correlation looks like parallel/horizontal lines**; perfect
  inverse correlation looks like an X. Use this property to read the chart.
- **`lineColor` is global.** No per-row tinting from data. If you need
  per-cohort coloring, split into faceted panels filtered by cohort.
- **Nulls.** With `showNullAxis: true`, rows with nulls visually drop to a
  separate tick; with `false`, lines simply don't render for the affected
  axis - which can mislead consumers if they don't notice.

## Reference

Verified against `SplunkCloud-10.4.2604-DashStudio` PDF.
