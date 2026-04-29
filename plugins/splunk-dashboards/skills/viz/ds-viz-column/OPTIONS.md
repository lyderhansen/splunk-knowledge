# splunk.column — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`,
*Column chart options* (line ~6188).

## Axis convention

- `xAxis`* controls the **category** axis.
- `yAxis`* controls the **value** axis.

Apply this template:

```json
{
  "xAxisTitleVisibility": "hide",
  "xAxisLabelVisibility": "auto",
  "xAxisMajorTickVisibility": "hide",
  "yAxisTitleText": "<value description>"
}
```

## Column-specific options


| Option               | Values      | Default     | Notes                                     |
| -------------------- | ----------- | ----------- | ----------------------------------------- |
| `xField`             | string      | `> x        | getField()`                               |
| `yFields`            | string      | `> y        | getField()`                               |
| `y2Fields`           | array       | string      | `> y2                                     |
| `stackMode`          | `"auto"`    | `"stacked"` | `"stacked100"`                            |
| `columnGrouping`     | `"auto"`    | `"overlay"` | `"auto"`                                  |
| `columnSpacing`      | number (px) | n/a         | Gap **between categories**.               |
| `seriesSpacing`      | number (px) | n/a         | Gap **between series within a category**. |
| `xAxisLabelRotation` | `-90        | -45         | 0                                         |
| `dataValuesDisplay`  | `"off"`     | `"all"`     | `"minmax"`                                |
| `showTooltip`        | boolean     | `true`      | Hover tooltip.                            |


## Annotations (column-only)


| Option            | Notes                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `annotationX`     | DOS expression bound to second `dataSources.annotation` keyed `_time`. |
| `annotationLabel` | DOS expression bound to `annotationLabel`.                             |
| `annotationColor` | DOS expression bound to `annotationColor`.                             |


These ARE in the column options table. They are NOT in the bar options
table — see `ds-viz-bar`.

## Shared with line / area / scatter


| Option                   | Notes                                                                            |
| ------------------------ | -------------------------------------------------------------------------------- |
| `seriesColors`           | Array of hex strings: `["#00D9FF"]`. **Positional** — `                          |
| `seriesColorsByField`    | Object: `{ "field": "#hex" }`. Refactor-safe; recommended.                       |
| `legendDisplay`          | `"off"`                                                                          |
| `legendMode`             | `"split"`                                                                        |
| `legendLabels`           | Array of strings to relabel series.                                              |
| `legendTruncation`       | `"ellipsisMiddle"`                                                               |
| `overlayFields`          | Comma-separated field names → right axis.                                        |
| `showOverlayY2Axis`      | Boolean.                                                                         |
| `y2AxisTitleText`        | String.                                                                          |
| `showSplitSeries`        | Boolean. **Always pair with `showIndependentYRanges: true`** when ranges differ. |
| `showIndependentYRanges` | Boolean.                                                                         |
| `showYAxisWithZero`      | Boolean. **Always `true` for delta/error bars.**                                 |
| `showYAxisExtendedRange` | Boolean. Extend to whole tick.                                                   |
| `yAxisScale`             | `"linear"`                                                                       |
| `yAxisMin` / `yAxisMax`  | String. Pin range across panels.                                                 |
| `yAxisMajorTickInterval` | Number.                                                                          |
| `yAxisAbbreviation`      | `"on"`                                                                           |
| `yAxisLineVisibility`    | `"show"`                                                                         |
| `xAxisLineVisibility`    | `"show"`                                                                         |
| `xAxisMaxLabelParts`     | Number. Max date-format parts.                                                   |
| `showXMajorGridLines`    | Boolean.                                                                         |
| `showYMajorGridLines`    | Boolean.                                                                         |
| `backgroundColor`        | Hex or `"transparent"`.                                                          |
| `resultLimit`            | Number, max `50000`. Hard cap.                                                   |


For shared-option behaviour detail, see `ds-viz-line` (axis tuning,
dual axis, annotations, splits).

## Trellis (10.0.2503+, untested)

10.0.2503 changelog enables trellis for column; 10.4 *Trellis layout*
contradicts and says single-value only. Until verified, prefer
`showSplitSeries: true` (PATTERNS.md pattern 12). Options if you
experiment: `splitByLayout`, `trellisSplitBy`, `trellisColumns`,
`trellisMinColumnWidth`, `trellisRowHeight`, `trellisPageCount`,
`trellisBackgroundColor`.

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`).
Grep for `^Column chart options` (line ~6188).