# splunk.singlevalue — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.singlevalue.js`.

**39 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `align` | string | `center` | left \|  center \|  right | Specify how to align the center content. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. You may use a dataSource to apply the color. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `majorColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the color for the major value.  You may use a dataSource to apply the color. The hex value format should be \u201C#FFFFFF\u201D. The default for enterprise light is "#000000". The default for enterprise dark ... |
| `majorFontSize` | number | `—` |  | Specify the font size (px) for the major value. By default the major value font size is calculated dynamically based on the available space. |
| `majorValue` | string \|  number | `> sparklineValues|lastPoint()` |  | The raw value to display and used to calculate trendValue. It is not displayed if majorValueDisplay is specified. |
| `majorValueDisplay` | string \|  number | `> majorValue` |  | The formatted version of majorValue displayed in the visualization. |
| `majorValueField` | string | `> majorValue | getField()` |  | The field name of major value. |
| `numberPrecision` | number | `0` | (0–20) | Specify the number of decimal places to display. For example, to display 3 decimal places, use a value of 3. Values can range from 0 to 20. |
| `shouldAbbreviateTrendValue` | boolean | `false` |  | Specify whether to abbreviate the trend value to 2 decimal points. A magnitude unit will be displayed. |
| `shouldAbbreviateMajorValue` | boolean | `false` |  | Specify whether to abbreviate the major value to 2 decimal points. A magnitude unit will be displayed. |
| `shouldSparklineAcceptNullData` | boolean | `true` |  | Deprecated: Use sparklineNullValueDisplay instead. Specify whether to convert null and non-numeric values in the sparkline to 0. |
| `sparklineNullValueDisplay` | string | `gaps` | gaps \|  zero \|  connect | 'Specify the handling of null values for sparkline. "gaps" shows breaks in the line (default), "zero" treats null as 0, "connect" connects points across nulls.' |
| `shouldUseThousandSeparators` | boolean | `true` |  | Specify whether numeric values use commas as thousandths separators. |
| `showSparklineAreaGraph` | boolean | `false` |  | Specify whether to show the sparkline as an area graph rather than a line. |
| `showSparklineTooltip` | boolean | `false` |  | Show a tooltip to display values on the sparkline. |
| `splitByLayout` | string | `off` | off /* Off */ \|  trellis /* Trellis */ | Specify the layout method by which to display the visualization, which splits the data into individual visualizations based on a certain category. |
| `sparklineAreaColor` | string | `> sparklineStrokeColor` | _color or token_ | Specify the color for the sparkline area fill. You may use a dataSource to apply the color. The hex value format should be "#FFFFFF". The graph area will have an opacity of 20% and will blend with the background color. |
| `sparklineDisplay` | string | `below` | before \|  after \|  below \|  off | Specify how to display a sparkline. |
| `sparklineHighlightDots` | number | `0` |  | Specify the number of markers, or dots, to display at the top of a sparkline area graph. |
| `sparklineHighlightSegments` | number | `0` |  | Specify the number of segments to be highlighted at the top of a sparkline area graph. |
| `sparklineStrokeColor` | string | `> themes.defaultSparklineStrokeColor` | _color or token_ | 'Specify the color for the sparkline stroke. You may use a dataSource to apply the color. The hex value format should be \u201C#FFFFFF\u201D. The default for enterprise light is "#000000". The default for enterprise d... |
| `sparklineValues` | array | `'> primary|seriesByPrioritizedTypes("number", "...` |  | List of numerical values to display on a sparkline. If the values are string type, the sparkline will not be shown. |
| `trendColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the color for the trend value. You may use a dataSource to apply the color. The hex value format should be \u201C#FFFFFF\u201D. The default for enterprise light is "#000000". The default for enterprise dark i... |
| `trendDisplay` | string | `absolute` | percent \|  absolute \|  off | Specify how to display the trend value. |
| `trendFontSize` | number | `—` |  | Specify the font size (px) for the trend value. By default the trend value font size is calculated dynamically based on the available space. |
| `trendValue` | number | `> sparklineValues|delta(-2)` |  | The trend value to display in the visualization. |
| `trellisBackgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the trellis container background by using a hexadecimal code. For example, #0000FF. |
| `trellisColumns` | number | `—` |  | Specify the number of visualizations to display in a given row of the trellis container. The remaining visualizations will wrap accordingly. If nothing is specified, it will be auto-set based on the trellisMinColumnWi... |
| `trellisMinColumnWidth` | number | `100` |  | Specify the minimum width, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisPageCount` | number | `20` |  | Specify the maximum number of visualizations to display in a single page in the trellis container. The remaining visualizations will paginate accordingly. The minimum value is 1. |
| `trellisRowHeight` | number | `70` |  | Specify the height, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisSortBy` | string | `result` | result \|  name \|  value \|  trend | Specify the sort method for the individual visualizations in the trellis container. Use result to sort by search result order, name to sort alphabetically by visualization label, value to sort by the major value, or t... |
| `trellisSortOrder` | string | `ascending` | ascending \|  descending | Specify the sort order for the individual visualizations in the trellis container. This setting applies to the sort method specified in trellisSortBy. |
| `trellisSplitBy` | string | `—` |  | Specify the field name of the column with categories used, or "aggregations", to split the data into individual visualizations for trellis display, if applicable. If a SPL `timechart` command is used, this may default... |
| `underLabel` | string | `—` |  | Specify the text that appears below the major value. |
| `underLabelColor` | string | `> majorColor` | _color or token_ | Specify the color for the under label text. You may use a dataSource to apply the color. The hex value format should be "#FFFFFF". By default it follows the major value color. |
| `underLabelFontSize` | number | `12` |  | Specify the font size (px) for the under label text. |
| `unit` | string | `—` |  | Specify text to show next to the major value. |
| `unitPosition` | string | `after` | before \|  after | Specify whether the unit text should appear before or after the major value. |