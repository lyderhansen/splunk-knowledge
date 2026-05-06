# splunk.markergauge — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.markergauge.js`.

**16 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color used for the background. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `gaugeRanges` | array | `[
      { from: 0, to: 50, value: "#118832" },
...` |  | 'Specify the overall range of the gauge as a series of continuous, color-coded subranges. For example, [{"from": 0, "to": 20, "value": "#4BEBA8"}, {"from": 20, "to": 50, "value": "#F4DF7A"}].' |
| `labelDisplay` | string | `number` | number \|  percentage \|  off | Specify whether to display the labels as numbers, percentages, or off. The label center aligns to the value. |
| `majorTickInterval` | string \|  number | `auto` |  | Specify the interval between major tick marks. |
| `orientation` | string | `vertical` | horizontal \|  vertical | Specify the axis orientation of the gauge. |
| `value` | string | `'> primary | seriesByType("number") | lastPoint()'` |  | Specify the dataSource applied to the value of the marker gauge. |
| `valueDisplay` | string | `number` | number \|  percentage \|  off | Specify whether to display the value as a number, percentage, or off. |
| `splitByLayout` | string | `off` | off /* Off */ \|  trellis /* Trellis */ | Specify the layout method by which to display the visualization, which splits the data into individual visualizations based on a certain category. |
| `trellisBackgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the trellis container background by using a hexadecimal code. For example, #0000FF. |
| `trellisColumns` | number | `3` |  | Specify the number of visualizations to display in a given row of the trellis container. The remaining visualizations will wrap accordingly. If nothing is specified, it will be auto-set based on the trellisMinColumnWi... |
| `trellisMinColumnWidth` | number | `200` |  | Specify the minimum width, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisPageCount` | number | `20` |  | Specify the maximum number of visualizations to display in a single page in the trellis container. The remaining visualizations will paginate accordingly. The minimum value is 1. |
| `trellisRowHeight` | number | `200` |  | Specify the height, in pixels, of each visualization in the trellis container. If the window or panel is resized, the remaining visualizations may be viewed by scrolling. The minimum value is 1. |
| `trellisSortBy` | string | `result` | result \|  name \|  value | Specify the sort method for the individual visualizations in the trellis container. Use result to sort by search result order, name to sort alphabetically by visualization label, or value to sort by the major value. |
| `trellisSortOrder` | string | `ascending` | ascending \|  descending | Specify the sort order for the individual visualizations in the trellis container. This setting applies to the sort method specified in trellisSortBy. |
| `trellisSplitBy` | string | `—` |  | 'Specify the field name of the column with categories used, or "aggregations", to split the data into individual visualizations for trellis display, if applicable. If a SPL `timechart` command is used, this may defaul... |