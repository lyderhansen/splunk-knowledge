# splunk.choropleth.svg — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.choropleth.svg.js`.

**5 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `areaColors` | array | `> areaValues|rangeValue(areaColorsRangeConfig)` |  | Specify the dataSource field that should be used to set the svg fill attribute of identified areas. |
| `areaIds` | array | `'> primary|seriesByType("string")'` |  | Specify the dataSource field that should be used to identify each area in the Choropleth svg, where the area has been tagged with an id field. |
| `areaValues` | array | `'> primary|seriesByType("number")'` |  | Specify the dataSource field that indicates the values for the areas. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | the background color behind the SVG, title, and description. |
| `svg` | string | `—` |  | Literal svg, or svg data URI. |