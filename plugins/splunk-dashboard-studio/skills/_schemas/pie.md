# splunk.pie — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.pie.js`.

**24 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. You may use a dataSource to apply the color. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `collapseExcludeZero` | boolean | `false` |  | Specify whether to exclude zeros and non-numeric values in the consolidated slice. |
| `collapseLabel` | string | `other` |  | Specify the label for the consolidated slice. |
| `legendDisplay` | string | `off` | right \|  left \|  top \|  bottom \|  off | Specify the location of the legend on the panel. |
| `collapseThreshold` | number | `0.01` |  | Specify the size threshold as a number between 0 and 1 (inclusive), of the whole pie at which slices collapse into one consolidated slice. |
| `label` | array | `> primary | seriesByIndex(0)` |  | List of string values to display the pie chart labels. |
| `labelField` | string | `> label | getField()` |  | Specify the field that corresponds to the labels. |
| `labelDisplay` | string | `values` | values \|  valuesAndPercentage \|  off | Specify whether to display the labels and/or slice percentages. |
| `percentagePrecision` | number | `0` | (0–16) | Specify the number of decimal places to display for percentages. The minimum value is 0. The maximum value is 16. |
| `resultLimit` | number | `5e4` |  | Specify the number of data points rendered in a chart. |
| `seriesColors` | array | `visualization_color_palettes_exports.VIZ_CATEGO...` |  | 'Specify the colors used for a series. For example, ["#FF0000", "#0000FF", "#008000"].' |
| `seriesColorsByField` | object | `—` |  | 'Specify the colors used for specific pie slice labels. For example: {"April": "#008000", "May": "#FFA500"}.' |
| `showDonutHole` | boolean | `false` |  | Specify whether the pie should be a donut. |
| `splitByLayout` | string | `off` | off /* Off */ \|  trellis /* Trellis */ | Specify the layout method by which to display the visualization, which splits the data into individual visualizations based on a certain category. |
| `trellisBackgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the trellis container background by using a hexadecimal code. For example, #0000FF. |
| `trellisColumns` | number | `3` |  | Specify the number of visualizations to display in a given row of the trellis container. The remaining visualizations will wrap accordingly. If nothing is specified, it will be auto-set based on the trellisMinColumnWi... |
| `trellisMinColumnWidth` | number | `250` |  | Specify the minimum width, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisPageCount` | number | `20` |  | Specify the maximum number of visualizations to display in a single page in the trellis container. The remaining visualizations will paginate accordingly. The minimum value is 1. |
| `trellisRowHeight` | number | `180` |  | Specify the height, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisSortBy` | string | `result` | result \|  name | Specify the sort method for the individual visualizations in the trellis container. Use result to sort by search result order, or name to sort alphabetically by visualization label. |
| `trellisSortOrder` | string | `ascending` | ascending \|  descending | Specify the sort order for the individual visualizations in the trellis container. This setting applies to the sort method specified in trellisSortBy. |
| `trellisSplitBy` | string | `—` |  | Specify the field name of the column with categories used, or "aggregations", to split the data into individual visualizations for trellis display, if applicable. If a SPL `timechart` command is used, this may default... |
| `value` | array | `> primary | seriesByIndex(1)` |  | List of numerical values to power the pie chart. |
| `valueField` | string | `> value | getField()` |  | Specify the field that corresponds to the data powering values. |