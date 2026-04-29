# splunk.bar — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`,
*Bar chart options* section starting at line ~5784, and visually
verified on Splunk Enterprise 10.2.1.

## Axis convention

`splunk.bar` swaps the axes vs `splunk.column`:

- `xAxis*` controls the **value** axis (numbers, the data).
- `yAxis*` controls the **category** axis (labels, the rows).

Apply this template to every bar panel:

```json
{
  "yAxisTitleVisibility": "hide",
  "yAxisLabelVisibility": "auto",
  "yAxisMajorTickVisibility": "hide",
  "xAxisTitleText": "<value description>",
  "xAxisTitleVisibility": "show",
  "xAxisLabelVisibility": "auto"
}
```

| Option | Value | Why |
|---|---|---|
| `yAxisTitleVisibility` | `"hide"` | Category names already in labels; title duplicates noise. |
| `yAxisLabelVisibility` | `"auto"` | Keep category labels visible; Splunk thins by panel height. |
| `yAxisMajorTickVisibility` | `"hide"` | Bar centres mark category positions; ticks add visual clutter. |

## Bar-specific options

| Option | Values | Default | Notes |
|---|---|---|---|
| `xField` | string | `> x \| getField()` | The category column. |
| `yFields` | string | `> y \| getField()` | The value column(s). |
| `barSpacing` | number (px) | n/a | Gap **between categories** (vertical gap, since bars are horizontal). |
| `seriesSpacing` | number (px) | n/a | Gap **between series within a category**. Only meaningful with grouped (non-stacked) bars. |
| `stackMode` | `"auto"` \| `"stacked"` \| `"stacked100"` | `"auto"` | `auto` = grouped (one bar per series, side-by-side per category). |
| `dataValuesDisplay` | `"off"` \| `"all"` \| `"minmax"` | `"off"` | `all` writes value at end of each bar; clean for ≤ 8 rows. |

## Removed from bar (vs column)

| Option | Notes |
|---|---|
| `columnGrouping` | Bar can't draw overlapping bars; `stackMode` is the only multi-series layout choice. |
| `xAxisLabelRotation` | Numbers fit horizontally; categories already horizontal. |
| `showTooltip` | Tooltips appear by default and can't be disabled on bar. |
| `annotation*` | NOT in the bar options table. Don't rely on annotations for bar charts; switch to `splunk.column` if needed. |

## Shared with column / line / area / scatter

| Option | Notes |
|---|---|
| `seriesColors` | Array of hex strings: `["#00D9FF", "#FF2D95"]`. **Positional** — `\| eval` reordering swaps colours silently. |
| `seriesColorsByField` | Object: `{ "field_name": "#hex" }`. Refactor-safe; recommended over `seriesColors`. |
| `legendDisplay` | `"off"` \| `"top"` \| `"right"` \| `"bottom"` \| `"left"`. |
| `legendMode` | `"split"` \| `"standard"`. |
| `legendLabels` | Array of strings to relabel series. |
| `legendTruncation` | `"ellipsisMiddle"` \| `"ellipsisOff"` \| `"ellipsisStart"` \| `"ellipsisEnd"`. |
| `overlayFields` | Comma-separated field names for dual axis. |
| `showOverlayY2Axis` | Boolean. Y2 stacks below Y1 on bar. |
| `y2AxisTitleText` | String. |
| `showSplitSeries` | Boolean. Small multiples per series. **Always pair with `showIndependentYRanges: true`** when ranges differ. |
| `showIndependentYRanges` | Boolean. |
| `showXAxisWithZero` | Boolean. **Critical for ± deltas** — keeps zero in value range so positive/negative bars share baseline. |
| `xAxisScale` | `"linear"` \| `"log"`. Use `log` when ranking spans orders of magnitude. **Set `xAxisMin: "1"`** — log rejects ≤ 0. |
| `xAxisMin` / `xAxisMax` | String. Pin value range across panels. |
| `xAxisMajorTickInterval` | Number. |
| `xAxisAbbreviation` | `"on"` \| `"off"`. Set `"off"` for stacked100 so `100` doesn't print as `100`. |
| `showXMajorGridLines` | Boolean. |
| `showYMajorGridLines` | Boolean. **Defaults to `true` on bar** even though y-axis is category axis — set `false` for clean sparkbars. |
| `backgroundColor` | Hex or `"transparent"`. |
| `resultLimit` | Number, max `50000`. Hard cap; drops bars without warning. |

## Trellis (10.0.2503+, untested)

10.0.2503 changelog enables trellis for bar; 10.4 *Trellis layout*
contradicts and says single-value only. Until verified, prefer
`showSplitSeries: true` (PATTERNS.md pattern 12).

If you experiment, options are: `splitByLayout`, `trellisSplitBy`,
`trellisColumns`, `trellisMinColumnWidth`, `trellisRowHeight`,
`trellisPageCount`, `trellisBackgroundColor` (see `ds-viz-line` for the
shared option table).

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`).
Grep the `.txt` for `^Bar chart options` (line ~5784) — the options
table there is authoritative.
