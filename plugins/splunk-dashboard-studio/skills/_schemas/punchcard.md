# splunk.punchcard — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.punchcard.js`.

**23 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `x` | array | `> primary | seriesByIndex(0)` |  | Specify the dataSource applied to the x-axis. |
| `y` | array | `> primary | seriesByIndex(1)` |  | Specify the dataSource applied to the y-axis. |
| `category` | array | `> primary | seriesByIndex(3)` |  | Specify the dataSource to apply series categories. |
| `size` | array | `> primary | seriesByIndex(2)` |  | Specify the dataSource to apply bubble size in the chart. |
| `xField` | string | `> x | getField()` |  | Specify the field that should be mapped to the x-axis. |
| `yField` | string | `> y | getField()` |  | Specify the field that should be mapped to the y-axis. |
| `categoryField` | string | `> category | getField()` |  | Specify the field that should be mapped to the series categories. |
| `sizeField` | string | `> size | getField()` |  | Specify the field that should be mapped to the bubble size in the chart. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color used for the background. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `bubbleColor` | string \|  array | `> size | gradient(bubbleColorConfig)` |  | 'Specify the coloring method used for the bubbles when the colorMode \u201Cdynamic\u201D is specified. For example \u201C> size | gradient(bubbleColorConfig)".' |
| `bubbleLabelDisplay` | string | `all` | all \|  max \|  off | Specify whether all bubble labels, the max value bubble labels, or none of the bubble labels should be displayed. |
| `bubbleRadiusMax` | number | `15` |  | Specify the max radius (in pixels) of the bubbles when showDynamicBubbleSize option is false. Greater than 0. |
| `bubbleRadiusMin` | number | `1` |  | Specify the min radius (in pixels) of the bubbles when showDynamicBubbleSize option is false. Greater than 0. |
| `bubbleRowScale` | string | `global` | global \|  row | Specify how bubbles are scaled relative to other rows. |
| `bubbleSizeMax` | number | `1` |  | Specify the max percentage (in decimal format) of space a bubble should take up within a cell when showDynamicBubbleSize option is true. The number specified must be between 0 and 1. |
| `bubbleSizeMin` | number | `0.25` |  | Specify the min percentage (in decimal format) of space a bubble should take up within a cell when showDynamicBubbleSize option is true. The number specified must be between 0 and 1. |
| `bubbleSizeMethod` | string | `area` | radius \|  area | Specify whether bubble area or diameter corresponds to the size value. |
| `colorMode` | string | `dynamic` | categorical \|  dynamic | Specify the coloring method used for the bubbles. |
| `legendDisplay` | string | `right` | right \|  off | Specify the location of the legend on the panel. |
| `seriesColors` | array | `visualization_color_palettes_exports.VIZ_CATEGO...` |  | 'Specify the colors used for a series. For example, "#FF0000", "#0000FF", "#008000".' |
| `showDefaultSort` | boolean | `false` |  | Specify whether axes should be sorted based on order of time, digits and strings. |
| `showDynamicBubbleSize` | boolean | `true` |  | Specify whether the bubble size should be dynamic or fixed. |
| `showMaxValuePulsation` | boolean | `true` |  | Specify whether the max value bubble should pulsate. |