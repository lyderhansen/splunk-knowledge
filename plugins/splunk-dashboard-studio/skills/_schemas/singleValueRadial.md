# splunk.singlevalueradial — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.singlevalueradial.js`.

**31 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. The hex value format should be \u201C#ffffff\u201D. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#... |
| `gaugeRanges` | array | `> majorColorEditorConfig` |  | 'Specify the overall range of the gauge as a series of continuous, color-coded subranges. For example, [{"to": 20, "value": "#4BEBA8"}, {"from": 20, "to": 50, "value": "#D41F1F"}, {"from": 50, "value": "#F4DF7A"}]. Mu... |
| `isGaugeOn` | boolean | `false` |  | Specify if gauge is on. |
| `majorColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the color for the major value. You may use a dataSource to apply the color. The hex value format should be \u201C#ffffff\u201D. The default for enterprise light is "#000000". The default for enterprise dark i... |
| `majorValue` | string \|  number | `'> primary | seriesByPrioritizedTypes("number",...` |  | The raw value to display and used to calculate trendValue. It is not displayed if majorValueDisplay is specified. |
| `majorValueDisplay` | string \|  number | `> majorValue` |  | The formatted version of majorValue displayed in the visualization. |
| `majorValueField` | string | `> majorValue | getField()` |  | Specify the field that should be mapped to the major value. |
| `minValue` | number | `0` |  | Specify the min value of the radial. |
| `maxValue` | number | `100` |  | Specify the value the radial fills up to. |
| `numberPrecision` | number | `0` | (0–20) | Specify the number of decimal places to display. For example, to display 3 decimal places, use a value of 3. Values can range from 0 to 20. |
| `radialBackgroundColor` | string | `> themes.defaultRadialBackgroundColor` | _color or token_ | 'Specify the color for the radial background. The hex value format should be \u201C#ffffff\u201D. The default for enterprise light is "rgba(0, 0, 0, 0.1)". The default for enterprise dark is "rgba(255, 255, 255, 0.15)... |
| `radialStrokeColor` | string | `> majorColor` | _color or token_ | 'Specify the color for the radial. You may use a dataSource to apply the color. The hex value format should be \u201C#ffffff\u201D. The default for enterprise light is "#000000". The default for enterprise dark is "#f... |
| `shouldAbbreviateTrendValue` | boolean | `false` |  | Specify whether to abbreviate the trend value to 2 decimal points. A magnitude unit will be displayed. |
| `shouldAbbreviateMajorValue` | boolean | `false` |  | Specify whether to abbreviate the major value to 2 decimal points. A magnitude unit will be displayed. |
| `shouldUseThousandSeparators` | boolean | `true` |  | Specify whether numeric values use commas as thousandths separators. |
| `splitByLayout` | string | `off` | off /* Off */ \|  trellis /* Trellis */ | Specify the layout method by which to display the visualization, which splits the data into individual visualizations based on a certain category. |
| `trendColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the color for the trend value. You may use a dataSource to apply the color. The hex value format should be \u201C#FFFFFF\u201D. The default for enterprise light is "#000000". The default for enterprise dark i... |
| `trendDisplay` | string | `absolute` | percent \|  absolute \|  off | Specify how to display the trend value. |
| `trendValue` | number | `'> primary | seriesByPrioritizedTypes("number",...` |  | Specify the dataSource applied to the trend value. |
| `trellisBackgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the trellis container background by using a hexadecimal code. For example, #0000FF. |
| `trellisColumns` | number | `—` |  | Specify the number of visualizations to display in a given row of the trellis container. The remaining visualizations will wrap accordingly. If nothing is specified, it will be auto-set based on the trellisMinColumnWi... |
| `trellisMinColumnWidth` | number | `120` |  | Specify the minimum width, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisPageCount` | number | `20` |  | Specify the maximum number of visualizations to display in a single page in the trellis container. The remaining visualizations will paginate accordingly. The minimum value is 1. |
| `trellisRowHeight` | number | `100` |  | Specify the height, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisSortBy` | string | `result` | result \|  name \|  value \|  trend | Specify the sort method for the individual visualizations in the trellis container. Use result to sort by search result order, name to sort alphabetically by visualization label, value to sort by the major value, or t... |
| `trellisSortOrder` | string | `ascending` | ascending \|  descending | Specify the sort order for the individual visualizations in the trellis container. This setting applies to the sort method specified in trellisSortBy. |
| `trellisSplitBy` | string | `—` |  | Specify the field name of the column with categories used, or "aggregations", to split the data into individual visualizations for trellis display, if applicable. If a SPL `timechart` command is used, this may default... |
| `underLabel` | string | `—` |  | Specify the text that appears below the major value. |
| `underLabelColor` | string | `> majorColor` | _color or token_ | Specify the color for the under label text. You may use a dataSource to apply the color. The hex value format should be "#FFFFFF". By default it follows the major value color. |
| `unit` | string | `—` |  | Specify text to show next to the major value. |
| `unitPosition` | string | `after` | before \|  after | Specify whether the unit text should appear before or after the major value. |