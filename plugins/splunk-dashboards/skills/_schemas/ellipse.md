# splunk.ellipse — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.ellipse.js`.

**6 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `fillColor` | string | `> themes.defaultFillColor` |  | 'Specify the fill color. You may use a dataSource to apply the color. The hex value format should be "#FFFFFF". The default for enterprise light is "#C3CBD4". The default for enterprise dark is "#31373E". The default ... |
| `fillOpacity` | number | `1` |  | 'Specify the opacity of the fill. Choose a number in the range of 0 - 1 (inclusive). You can also express the value as a percentage. For example, "0.80" in source or "80%" in UI.' |
| `strokeColor` | string | `> themes.defaultStrokeColor` |  | 'Specify the stroke color. You may use a dataSource to apply the color. The hex value format should be "#FFFFFF". The default for enterprise light is "#3C444D". The default for enterprise dark is "#C3CBD4". The defaul... |
| `strokeDashStyle` | number | `0` |  | Specify the size, in pixels, of dashes and spaces used to create a custom stitched outline. The value you specify applies to both the dashes and the spaces between them. |
| `strokeOpacity` | number | `1` |  | 'Specify the opacity of the stroke. Choose a number in the range of 0 - 1 (inclusive). You can also express the value as a percentage. For example, "0.80" in source or "80%" in UI.' |
| `strokeWidth` | number | `1` |  | Specify the width of the stroke, in pixels. The minimum value is 0. |