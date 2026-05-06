# splunk.sankey — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.sankey.js`.

**9 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. You may use a dataSource to apply the color. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `colorMode` | string | `categorical` | categorical \|  dynamic | 'Specify the coloring method used for the links. When set to "categorical" the nodes and links will be colored based on the "seriesColors". When set to "dynamic" the links will be colored based on the dynamic string a... |
| `labelDisplay` | string | `off` | values \|  valuesAndPercentage \|  percentage \|  off | Specify whether to display the values and/or percentages of the nodes. Values are abbreviated to two decimal points, and a magnitude unit will be displayed. Percentages are calculated using the maximum node value as 1... |
| `linkColors` | array | ``> linkValues | rangeValue(linkColorRangeConfig)`` |  | Specify the coloring method used for the links when the colorMode "dynamic" is specified. |
| `linkOpacity` | number | `0.5` |  | Specify the opacity of the links. Choose a number in the range of 0 - 1 (inclusive). |
| `linkValues` | string | ``> primary | seriesByType('number')`` |  | Specify the dataSource to apply link width. |
| `resultLimit` | number | `1e3` |  | Specify the maximum length of link data points rendered. |
| `seriesColors` | array | `visualization_color_palettes_exports.VIZ_CATEGO...` |  | 'Specify the colors used for a series. For example, ["#FF0000", "#0000FF", "#008000"].' |
| `unit` | string | `—` |  | 'Specify text to show on the left of the value in the node label when "labelDisplay" is set to either "values" or "valuesAndPercentage"' |