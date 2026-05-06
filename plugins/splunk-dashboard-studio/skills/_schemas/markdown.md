# splunk.markdown — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.markdown.js`.

**7 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `transparent` | _color or token_ | 'Specify the background color using a Hex code such as "#FF0000".' |
| `customFontSize` | number | `14` |  | Specify the font size (in pixels) you would like to use for unformatted text when `fontSize` is set to `custom`. Header elements are calculated with the following formula: h1 = 2 \xD7 `customFontSize`, h2 = 1.5 \xD7 `... |
| `fontColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the text color using Hex codes or RGBA values, such as "#FF0000" or "rgba(25,12,13,0.1)". The default for enterprise light is "#3c444d". The default for enterprise dark is "#FFFFFF". The default for prisma da... |
| `fontFamily` | string | `Splunk Platform Sans` |  | 'Specify the font family you would like to use for markdown content, such as "Comic Sans MS". Note: the font needs to be available to your end user.' |
| `fontSize` | string | `default` | extraSmall \|  small \|  default \|  large \|  extraLarge \|  custom | Specify the font size you would like to use for markdown content. Font sizes range from extra small (10px for unformatted text) to extra large (18px for unformatted text) with the default being 14px for unformatted text. |
| `markdown` | string | `—` |  | Add text using basic markdown syntax. |
| `rotation` | number | `0` |  | Specify the angle of rotation of the markdown content in degrees. |