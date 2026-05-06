# splunk.singlevalueicon — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.singlevalueicon.js`.

**33 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `align` | string | `center` | left \|  center \|  right | Specify how to align the center content. |
| `backgroundColor` | string | `transparent` | _color or token_ | Specify the color for the background. You may use a dataSource to apply the color. The hex value format should be "#FFFFFF". |
| `icon` | string | `default` |  | Specify an icon. |
| `iconColor` | string | `null` | _color or token_ | 'Specify the color for the icon. You may use a dataSource to apply the color. The hex value format should be \u201C#FFFFFF\u201D. The default for enterprise light is "#000000". The default for enterprise dark is "#fff... |
| `iconOpacity` | number | `1` |  | Specify the opacity for the icon using a number between 0 and 1 (inclusive). |
| `iconPosition` | string | `before` |  | Specify where to display the icon in relation to the major value. |
| `majorColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the color for the major value.  You may use a dataSource to apply the color. The hex value format should be \u201C#FFFFFF\u201D. The default for enterprise light is "#000000". The default for enterprise dark ... |
| `majorFontSize` | number | `—` |  | Specify the font size (px) for the major value. By default the major value font size is calculated dynamically based on the available space. |
| `majorValue` | string \|  number | `'> primary|seriesByPrioritizedTypes("number", "...` |  | The raw value to display and used to calculate trendValue. It is not displayed if majorValueDisplay is specified. |
| `majorValueDisplay` | string \|  number | `> majorValue` |  | The formatted version of majorValue displayed in the visualization. |
| `majorValueField` | string | `> majorValue | getField()` |  | The field name of major value. |
| `numberPrecision` | number | `0` | (0–20) | Specify the number of decimal places to display. For example, to display 3 decimal places, use a value of 3. Values can range from 0 to 20. |
| `shouldAbbreviateTrendValue` | boolean | `false` |  | Specify whether to abbreviate the trend value to 2 decimal points. A magnitude unit will be displayed. |
| `shouldAbbreviateMajorValue` | boolean | `false` |  | Specify whether to abbreviate the major value to 2 decimal points. A magnitude unit will be displayed. |
| `shouldUseThousandSeparators` | boolean | `true` |  | Specify whether numeric values use commas as thousandths separators. |
| `showValue` | boolean | `true` |  | Specify whether to enable or disable the value and trend indicator displays. |
| `splitByLayout` | string | `off` | off /* Off */ \|  trellis /* Trellis */ | Specify the layout method by which to display the visualization, which splits the data into individual visualizations based on a certain category. |
| `trendColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the color for the trend value. You may use a dataSource to apply the color. The hex value format should be \u201C#FFFFFF\u201D. The default for enterprise light is "#000000". The default for enterprise dark i... |
| `trendDisplay` | string | `absolute` | off \|  percent \|  absolute | Specify whether the trend value is displayed as a percentage or an absolute count. |
| `trendFontSize` | number | `—` |  | Specify the font size (px) for the trend value. By default the trend value font size is calculated dynamically based on the available space. |
| `trendValue` | number | `'> primary|seriesByPrioritizedTypes("number", "...` |  | The trend value to display in the visualization. |
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
| `unit` | string | `—` |  | Specify text to show next to the major value. |
| `unitPosition` | string | `after` | before \|  after | Specify whether the unit text should appear before or after the major value. |