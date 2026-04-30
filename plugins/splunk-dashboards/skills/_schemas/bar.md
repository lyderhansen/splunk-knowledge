# splunk.bar — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.bar.js`.

**79 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `x` | array | `> primary | seriesByIndex(0)` |  | Specify the data source to apply to the x-axis. |
| `y` | array | `> primary | frameBySeriesIndexRange(1)` |  | Specify the data source to apply to the y-axis. |
| `y2` | array | `—` |  | Specify the data source to apply to the second y-axis |
| `xField` | string | `> x | getField()` |  | Specify the field to map to the x-axis. |
| `yFields` | string | `> y | getField()` |  | Specify the field to map to the y-axis. |
| `y2Fields` | array \|  string | `> y2 | getField()` |  | Specify one or more fields to map to a second y-axis. |
| `additionalTooltipFields` | array | `[]` |  | Specify the fields to add to the default set of tooltips. Tooltips appear when you hover over events. These fields and their corresponding values are shown in addition to the ones displayed by default. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the background. You can use a data source or hexadecimal code to apply the color. |
| `barSpacing` | number | `—` |  | Specify the spacing (px) between columns in a bar chart. |
| `dataValuesDisplay` | string | `off` | off \|  all \|  minmax | 'Specify the labels to display. Enter "all" to show labels for all data points, "off" to show no labels, or "minmax" to show high and low values.' |
| `legendDisplay` | string | `—` | right \|  left \|  top \|  bottom \|  off | Specify the location of the legend on the panel. By default, legendDisplay is off when splitByLayout is trellis, and right otherwise.  |
| `legendLabels` | array | `—` |  | 'Specify a list of labels to populate the legend in advance. For example, ["percent", "count"].' |
| `legendMode` | string | `standard` | standard \|  seriesCompare | 'Specify visual and behavioral settings for the tooltip and legend. "seriesCompare" is useful when comparing series.' |
| `legendReversed` | boolean | `false` |  | Specify whether to reverse the order of the legend items. |
| `legendTruncation` | string | `ellipsisEnd` | ellipsisEnd \|  ellipsisMiddle \|  ellipsisStart \|  ellipsisOff | Specify how to display legend labels when they overflow the layout boundaries by replacing overflow text with an ellipsis. |
| `lineDashStyle` | string | `solid` |  | Specify a dash style for all overlay field lines. |
| `lineDashStylesByField` | object | `—` |  | `Specify a dash style to use for overlay lines for each field. For example |
| `lineWidth` | number | `2` |  | Specify the line width (px) for overlay field lines. |
| `resultLimit` | number | `5e4` |  | Specify the number of data points to render in a chart. |
| `seriesColors` | array | `visualization_color_palettes_exports.VIZ_CATEGO...` |  | 'Specify the colors to use in a series. For example, ["#FF0000", "#0000FF", "#008000"].' |
| `seriesColorsByField` | object | `—` |  | Specify the colors to use for specific fields in a series. For example, {"count": "#008000", "percent": "#FFA500"}. |
| `seriesSpacing` | number | `—` |  | Specify the spacing (px) between clustered series in column and bar charts. |
| `splitByLayout` | string | `off` | off /* Off */ \|  trellis /* Trellis */ | Specify the layout method by which to display the visualization, which splits the data into individual visualizations based on a certain category. |
| `stackMode` | string | `auto` | auto \|  stacked \|  stacked100 | Specify stack mode. |
| `showIndependentYRanges` | boolean | `false` |  | Specify whether split series charts have independent y-ranges. |
| `showSplitSeries` | boolean | `false` |  | Specify whether to split a multi-series chart into separate charts that are stacked from top to bottom, one for each series. |
| `showXMajorGridLines` | boolean | `false` |  | Specify whether to show major grid lines on the x-axis. |
| `showYMajorGridLines` | boolean | `true` |  | Specify whether to show major grid lines on the y-axis. |
| `showY2MajorGridLines` | boolean | `false` |  | Specify whether to show major grid lines on the second y-axis. |
| `showYMinorGridLines` | boolean | `false` |  | Specify whether to show minor grid lines on the y-axis. |
| `showY2MinorGridLines` | boolean | `false` |  | Specify whether to show minor grid lines on the second y-axis. |
| `showYAxisExtendedRange` | boolean | `true` |  | Specify whether to extend the y-axis to include whole major tick marks. |
| `showYAxisWithZero` | boolean | `false` |  | Specify whether to include zero in the y-axis range. |
| `showY2AxisWithZero` | boolean | `false` |  | Specify whether to include zero the second y-axis range . |
| `xAxisLabelVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show labels on the x-axis. |
| `trellisBackgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the trellis container background by using a hexadecimal code. For example, #0000FF. |
| `trellisColumns` | number | `3` |  | Specify the number of visualizations to display in a given row of the trellis container. The remaining visualizations will wrap accordingly. If nothing is specified, it will be auto-set based on the trellisMinColumnWi... |
| `trellisMinColumnWidth` | number | `250` |  | Specify the minimum width, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisPageCount` | number | `20` |  | Specify the maximum number of visualizations to display in a single page in the trellis container. The remaining visualizations will paginate accordingly. The minimum value is 1. |
| `trellisRowHeight` | number | `180` |  | Specify the height, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisSharedScale` | boolean | `true` |  | Specify whether all visualizations will share the same scale in the trellis container. |
| `trellisSortBy` | string | `result` | result \|  name | Specify the sort method for the individual visualizations in the trellis container. Use result to sort by search result order, or name to sort alphabetically by visualization label. |
| `trellisSortOrder` | string | `ascending` | ascending \|  descending | Specify the sort order for the individual visualizations in the trellis container. This setting applies to the sort method specified in trellisSortBy. |
| `trellisSplitBy` | string | `—` |  | Specify the field name of the column with categories used, or "aggregations", to split the data into individual visualizations for trellis display, if applicable. If a SPL `timechart` command is used, this may default... |
| `yAxisLabelVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show labels on the y-axis. |
| `y2AxisLabelVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show labels on the second y-axis. |
| `xAxisLineVisibility` | string | `hide` | show \|  hide | Specify whether to show the x-axis line. |
| `yAxisLineVisibility` | string | `hide` | show \|  hide | Specify whether to show the y-axis line. |
| `y2AxisLineVisibility` | string | `hide` | show \|  hide | Specify whether to show the second y-axis line. |
| `xAxisMajorTickSize` | number | `6` |  | Specify the size (px) of major tick marks on the x-axis. |
| `yAxisMajorTickSize` | number | `6` |  | Specify the size (px) of major tick marks on the y-axis. |
| `y2AxisMajorTickSize` | number | `6` |  | Specify the size (px) of major tick marks on the second y-axis. |
| `yAxisMinorTickSize` | number | `6` |  | Specify the size (px) of minor tick marks on the y-axis. |
| `y2AxisMinorTickSize` | number | `6` |  | Specify the size (px) of minor tick marks on the second y-axis. |
| `xAxisMajorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show major tick marks on the x-axis. |
| `yAxisMajorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show major tick marks on the y-axis. |
| `y2AxisMajorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show major tick marks on the second y-axis. |
| `yAxisMinorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show  minor tick marks on the y-axis. |
| `y2AxisMinorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show minor tick marks on the second y-axis. |
| `xAxisMaxLabelParts` | number | `3` | (1–3) | Specify the maximum number of time-parts for a tick label. The 3 possible parts are year, month, and time. Values can range from 1 to 3. |
| `yAxisScale` | string | `linear` | linear \|  log | Specify the type of scale that applies to a numerical y-axis. |
| `y2AxisScale` | string | `linear` | linear \|  log | Specify the type of scale that applies to a numerical second y-axis. |
| `xAxisTitleText` | string | `—` |  | Specify the title of the x-axis. |
| `yAxisTitleText` | string | `—` |  | Specify the title of the y-axis. |
| `y2AxisTitleText` | string | `—` |  | Specify the title of the second y-axis. |
| `xAxisTitleVisibility` | string | `show` | show \|  hide | Specify whether to show the title of the x-axis. |
| `yAxisTitleVisibility` | string | `show` | show \|  hide | Specify whether to show the title of the y-axis. |
| `y2AxisTitleVisibility` | string | `show` | show \|  hide | Specify whether to show the title of the second y-axis. |
| `yAxisAbbreviation` | string | `auto` | off \|  auto | Specify whether to abbreviate large y-axis values with the closest International System of Units (SI) prefix. |
| `y2AxisAbbreviation` | string | `auto` | off \|  auto | Specify whether to abbreviate large y2-axis values with the closest International System of Units (SI) prefix. |
| `yAxisMajorTickInterval` | string \|  number | `auto` |  | Specify the spacing unit between major tick marks along the numeric y-axis. |
| `y2AxisMajorTickInterval` | string \|  number | `auto` |  | Specify the spacing unit between major tick marks along the numeric second y-axis. |
| `yAxisMax` | string \|  number | `auto` |  | Specify the largest value to display in the visible y-axis range. |
| `y2AxisMax` | string \|  number | `auto` |  | Specify the largest value to display in the visible second y-axis range. |
| `yAxisMin` | string \|  number | `auto` |  | Specify the smallest value for the visible y-axis range. |
| `y2AxisMin` | string \|  number | `auto` |  | Specify the smallest value for the visible second y-axis range. |
| `overlayFields` | array \|  string | `—` |  | Specify one or more fields to differentiate on the chart and display as chart overlays. |
| `showOverlayY2Axis` | boolean | `false` |  | Enable a second y-axis for chart overlays. All overlay fields map to a second y-axis. |
| `showRoundedY2AxisLabels` | boolean | `true` |  | Specify whether to round second y-axis values to the nearest integer. |