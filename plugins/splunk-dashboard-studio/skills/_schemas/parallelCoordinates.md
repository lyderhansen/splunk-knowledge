# splunk.parallelcoordinates — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.parallelcoordinates.js`.

**4 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color used for the background. The default for enterprise light is "#FFFFFF". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `lineColor` | string | `visualization_color_palettes_exports.VIZ_CATEGO...` | _color or token_ | Specify the dataSource color for the lines. The hex value format should be #FFFFFF. |
| `lineOpacity` | number | `0.5` |  | 'Specify the opacity of the lines. Choose a number in the range of 0 - 1 (inclusive). You can also express the value as a percentage. For example, "0.50" in source or "50%" in UI.' |
| `showNullAxis` | boolean | `true` |  | Select whether you would like to show or hide the null value axis. |