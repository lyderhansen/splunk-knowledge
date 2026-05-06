# splunk.scatter — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.scatter.js`.

**59 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `x` | array | `> primary | seriesByIndex(0)` |  | Specify the dataSource applied to the x-axis. |
| `y` | array | `> primary | seriesByIndex(1)` |  | Specify the dataSource applied to the y-axis. |
| `category` | array | `> primary | seriesByIndex(2)` |  | Specify a sequence of dataSource events to be plotted on the chart. |
| `xField` | string | `> x | getField()` |  | Specify the field that should be mapped to the x-axis. |
| `yField` | string | `> y | getField()` |  | Specify the field that should be mapped to the y-axis. |
| `categoryField` | string | `> category | getField()` |  | Specify the field that should be mapped to the series categories. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color used for the background. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `legendDisplay` | string | `—` | right \|  left \|  top \|  bottom \|  off | Specify the location of the legend on the panel. By default, legendDisplay is off when splitByLayout is trellis, and right otherwise.  |
| `legendTruncation` | string | `ellipsisEnd` | ellipsisEnd \|  ellipsisMiddle \|  ellipsisStart \|  ellipsisOff | Specify how to display legend labels when they overflow the layout boundaries by replacing overflow text with an ellipsis. |
| `markerSize` | number | `4` |  | Specify, in pixels, the size of each scatter marker. |
| `resultLimit` | number | `5e4` |  | Specify the number of data points rendered in a chart. |
| `seriesColors` | array | `visualization_color_palettes_exports.VIZ_CATEGO...` |  | 'Specify the colors used for a series. For example, ["#FF0000", "#0000FF", "#008000"].' |
| `seriesColorsByField` | object | `—` |  | 'Specify the colors to use for specific categories, or series names, derived from distinct values in the selected category field. For example, {"user1": "#008000", "user2": "#FFA500"}.' |
| `showXAxisExtendedRange` | boolean | `true` |  | Specify whether the x-axis should be extended to snap to whole major tick marks. |
| `showYAxisExtendedRange` | boolean | `true` |  | Specify whether the y-axis should be extended to snap to whole major tick marks. |
| `showXAxisWithZero` | boolean | `false` |  | Specify whether the x-axis range includes zero. |
| `showYAxisWithZero` | boolean | `false` |  | Specify whether the y-axis range includes zero. |
| `showRoundedXAxisLabels` | boolean | `false` |  | Specify whether to round x-axis values to the nearest integer. |
| `showXMajorGridLines` | 'boolean' | `false` |  | 'Specify whether major grid lines are visible on the x-axis.' |
| `showYMajorGridLines` | boolean | `true` |  | Specify whether major grid lines are visible on the y-axis. |
| `showXMinorGridLines` | boolean | `false` |  | Specify whether minor grid lines are visible on the x-axis. |
| `showYMinorGridLines` | boolean | `false` |  | Specify whether minor grid lines are visible on the y-axis. |
| `splitByLayout` | string | `off` | off /* Off */ \|  trellis /* Trellis */ | Specify the layout method by which to display the visualization, which splits the data into individual visualizations based on a certain category. |
| `trellisBackgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the trellis container background by using a hexadecimal code. For example, #0000FF. |
| `trellisColumns` | number | `3` |  | Specify the number of visualizations to display in a given row of the trellis container. The remaining visualizations will wrap accordingly. If nothing is specified, it will be auto-set based on the trellisMinColumnWi... |
| `trellisMinColumnWidth` | number | `250` |  | Specify the minimum width, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisPageCount` | number | `20` |  | Specify the maximum number of visualizations to display in a single page in the trellis container. The remaining visualizations will paginate accordingly. The minimum value is 1. |
| `trellisRowHeight` | number | `180` |  | Specify the height, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisSharedScale` | boolean | `true` |  | Specify whether all visualizations will share the same scale in the trellis container. |
| `trellisSortBy` | string | `result` | result \|  name | Specify the sort method for the individual visualizations in the trellis container. Use result to sort by search result order, or name to sort alphabetically by visualization label. |
| `trellisSortOrder` | string | `ascending` | ascending \|  descending | Specify the sort order for the individual visualizations in the trellis container. This setting applies to the sort method specified in trellisSortBy. |
| `trellisSplitBy` | string | `—` |  | Specify the field name of the column with categories used, or "aggregations", to split the data into individual visualizations for trellis display, if applicable. If a SPL `timechart` command is used, this may default... |
| `xAxisLabelRotation` | number | `0` |  | Specify the rotation of the x-axis labels in degrees. |
| `xAxisAbbreviation` | string | `off` | auto \|  off | Specify whether to abbreviate large x-axis values with the closest SI prefix. |
| `yAxisAbbreviation` | string | `auto` | auto \|  off | Specify whether to abbreviate large y-axis values with the closest SI prefix. |
| `xAxisLabelVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide labels on the x-axis. |
| `yAxisLabelVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide labels on the y-axis. |
| `xAxisLineVisibility` | string | `hide` | show \|  hide | Specify whether to show or hide the x-axis line. |
| `yAxisLineVisibility` | string | `hide` | show \|  hide | Specify whether to show or hide the y-axis line. |
| `xAxisMajorTickInterval` | string \|  number | `auto` |  | Specify the spacing interval at which to place major tick marks along the numeric x-axis. By default, this value is automatically calculated based on the scale of the related axis. |
| `yAxisMajorTickInterval` | string \|  number | `auto` |  | Specify the spacing interval at which to place major tick marks along the numeric y-axis. By default, this value is automatically calculated based on the scale of the related axis. |
| `xAxisMajorTickSize` | number | `6` |  | Specify the size, in pixels, of major tick marks on the x-axis. |
| `yAxisMajorTickSize` | number | `6` |  | Specify the size, in pixels, of major tick marks on the y-axis. |
| `xAxisMinorTickSize` | number | `6` |  | Specify the size, in pixels, of minor tick marks on the x-axis. |
| `yAxisMinorTickSize` | number | `6` |  | Specify the size, in pixels, of minor tick marks on the y-axis. |
| `xAxisMajorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide major tick marks on the x-axis. |
| `yAxisMajorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide major tick marks on the y-axis. |
| `xAxisMinorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide minor tick marks on the x-axis . |
| `yAxisMinorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide minor tick marks on the y-axis. |
| `xAxisMax` | string \|  number | `auto` |  | Specify the maximum number for the range of the visible x-axis. |
| `yAxisMax` | string \|  number | `auto` |  | Specify the maximum number for the range of the visible y-axis. |
| `xAxisMin` | string \|  number | `auto` |  | Specify the minimum number for the range of the visible x-axis. |
| `yAxisMin` | string \|  number | `auto` |  | Specify the minimum number for the range of the visible y-axis. |
| `xAxisScale` | string | `linear` | linear \|  log | Specify the type of scale that applies to a numerical x-axis. |
| `yAxisScale` | string | `linear` | linear \|  log | Specify the type of scale that applies to a numerical y-axis. |
| `xAxisTitleText` | string | `—` |  | Specify the title of the x-axis. |
| `yAxisTitleText` | string | `—` |  | Specify the title of the y-axis. |
| `xAxisTitleVisibility` | string | `show` | show \|  hide | Specify whether to show or hide the title of the x-axis. |
| `yAxisTitleVisibility` | string | `show` | show \|  hide | Specify whether to show or hide the title of the y-axis. |