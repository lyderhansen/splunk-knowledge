# splunk.timeline — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.timeline.js`.

**17 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `x` | array | `'> primary | seriesByType("time")'` |  | Specify the data source applied to the x-axis. |
| `y` | array | `'> primary | seriesByPrioritizedTypes("string",...` |  | Specify the data source applied to the y-axis. |
| `duration` | array | `'> primary | seriesByPrioritizedTypes("number",...` |  | Specify the data source to apply duration to events. This will display events over a length of time as a bar rather than a circle. |
| `category` | array | `'> primary| seriesByName("category")'` |  | Specify the data source to apply series categories. This will color events in distinct categories. |
| `xField` | string | `> x | getField()` |  | Specify the field that should be mapped to the x-axis. |
| `yField` | string | `> y | getField()` |  | Specify the field that should be mapped to the y-axis. |
| `durationField` | string | `> duration | getField()` |  | Specify the field that should be mapped to the x-axis. |
| `durationUnit` | string | `milliseconds` | milliseconds \|  seconds \|  minutes \|  hours | Specify the unit of the values in the duration data source used to apply duration to events. |
| `categoryField` | string | `> category | getField()` |  | Specify the field that should be mapped to the y-axis. |
| `additionalTooltipFields` | array | `[]` |  | Specify the fields to add to the default set of tooltips. Tooltips appear when you hover over events. These fields and their corresponding values are shown in addition to the ones displayed by default. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. You may use a data source to apply the color. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `dataColors` | string \|  array | `—` |  | 'Specify the colors to use for events. You can use an array of colors to be picked from, or you can use a data source to apply dynamic coloring. For example, \u201C> primary | seriesByName("count") | rangeValue(lowToH... |
| `legendDisplay` | string | `off` | right \|  bottom \|  off | Specify the location of the legend on the panel. |
| `legendTruncation` | string | `ellipsisEnd` | ellipsisEnd \|  ellipsisMiddle \|  ellipsisStart \|  ellipsisOff | Specify how to display legend labels when they overflow the layout boundaries by replacing overflow text with an ellipsis. |
| `resultLimit` | number | `1e4` |  | Specify the maximum number of events to render on the timeline. Adjust the value to improve performance. |
| `seriesColors` | array | `visualization_color_palettes_exports.VIZ_CATEGO...` |  | 'Specify the colors used for a series. For example, ["#FF0000", "#0000FF", "#008000"].' |
| `yAxisLabelWidth` | number | `100` |  | Specify the width, in pixels, for y-axis labels. |