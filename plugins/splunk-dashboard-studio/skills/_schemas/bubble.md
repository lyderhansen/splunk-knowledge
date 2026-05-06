# splunk.bubble — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.bubble.js`.

**53 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `x` | array | `> primary | seriesByIndex(0)` |  | Specify the dataSource applied to the x-axis. |
| `y` | array | `> primary | seriesByIndex(1)` |  | Specify the dataSource applied to the y-axis. |
| `category` | array | `—` |  | Specify a sequence of dataSource events to be plotted on the chart. |
| `size` | array | `> primary | seriesByIndex(2)` |  | Specify the dataSource events that are represented by the bubble size in the chart. |
| `xField` | string | `> x | getField()` |  | Specify the field that should be mapped to the x-axis. |
| `yField` | string | `> y | getField()` |  | Specify the field that should be mapped to the y-axis. |
| `categoryField` | string | `> category | getField()` |  | Specify the field that should be mapped to the series categories. |
| `sizeField` | string | `> size | getField()` |  | Specify the field that should be mapped to the bubble size in the chart. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the chart background by using a hexadecimal code. For example, #0000FF. |
| `bubbleSizeMax` | number | `50` |  | Specify, in pixels, the maximum size of each bubble. |
| `bubbleSizeMin` | number | `10` |  | Specify, in pixels, the minimum size of each bubble. |
| `bubbleSizeMethod` | string | `area` | area \|  diameter | Specify how bubble size is measured. |
| `legendDisplay` | string | `right` | right \|  left \|  top \|  bottom \|  off | Specify the location of the legend on the panel. |
| `legendTruncation` | string | `ellipsisEnd` | ellipsisEnd \|  ellipsisMiddle \|  ellipsisStart \|  ellipsisOff | Specify where to use ellipsis to replace legend labels that overflow the layout. |
| `resultLimit` | number | `5e4` |  | Specify the number of data points rendered in a chart. |
| `seriesColors` | array | `visualization_color_palettes_exports.VIZ_CATEGO...` |  | 'Specify the hexadecimal color codes for the bubble order from largest to smallest. For example, ["#FF0000", "#0000FF", "#008000"].' |
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
| `xAxisLabelRotation` | number | `0` |  | Specify the rotation of the x-axis labels in degrees. |
| `xAxisAbbreviation` | string | `off` | auto \|  off | Specify whether to abbreviate large x-axis values with the closest International System of Units (SI) prefix. |
| `yAxisAbbreviation` | string | `auto` | auto \|  off | Specify whether to abbreviate large y-axis values with the closest International System of Units (SI) prefix. |
| `xAxisLabelVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide labels on the x-axis. |
| `yAxisLabelVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide labels on the y-axis. |
| `xAxisLineVisibility` | string | `hide` | show \|  hide | Specify whether to show the x-axis line. |
| `yAxisLineVisibility` | string | `hide` | show \|  hide | Specify whether to show the y-axis line. |
| `xAxisMajorTickInterval` | string \|  number | `auto` |  | Specify the spacing interval between major tick marks along the x-axis. By default, the spacing value is automatically calculated based on the scale of the related axis. |
| `yAxisMajorTickInterval` | string \|  number | `auto` |  | Specify the spacing interval between major tick marks along the y-axis. By default, the spacing value is automatically calculated based on the scale of the related axis. |
| `xAxisMajorTickSize` | number | `6` |  | Specify the size, in pixels, of major tick marks on the x-axis. |
| `yAxisMajorTickSize` | number | `6` |  | Specify the size, in pixels, of major tick marks on the y-axis. |
| `xAxisMinorTickSize` | number | `6` |  | Specify the size, in pixels, of minor tick marks on the x-axis. |
| `yAxisMinorTickSize` | number | `6` |  | Specify the size, in pixels, of minor tick marks on the y-axis. |
| `xAxisMajorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide major tick marks on the x-axis. |
| `yAxisMajorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide major tick marks on the y-axis. |
| `xAxisMinorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide minor tick marks on the x-axis . |
| `yAxisMinorTickVisibility` | string | `auto` | auto \|  show \|  hide | Specify whether to show or hide minor tick marks on the y-axis. |
| `xAxisMax` | string \|  number | `auto` |  | Specify the maximum value for the visible x-axis range. |
| `yAxisMax` | string \|  number | `auto` |  | Specify the maximum value for the visible y-axis range. |
| `xAxisMin` | string \|  number | `auto` |  | Specify the minimum value for the visible x-axis range. |
| `yAxisMin` | string \|  number | `auto` |  | Specify the minimum value for the visible y-axis range. |
| `xAxisScale` | string | `linear` | linear \|  log | Specify the type of scale that applies to a numerical x-axis. |
| `yAxisScale` | string | `linear` | linear \|  log | Specify the type of scale that applies to a numerical y-axis. |
| `xAxisTitleText` | string | `—` |  | Specify the title of the x-axis. |
| `yAxisTitleText` | string | `—` |  | Specify the title of the y-axis. |
| `xAxisTitleVisibility` | string | `show` | show \|  hide | Specify whether to hide the title of the x-axis. |
| `yAxisTitleVisibility` | string | `show` | show \|  hide | Specify whether to hide the title of the y-axis. |