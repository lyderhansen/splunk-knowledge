# splunk.richtext — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.richtext.js`.

**18 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `transparent` | _color or token_ | 'Specify the background color using a Hex code such as "#FF0000" or "transparent".' |
| `fontColor` | string | `> themes.defaultFontColor` | _color or token_ | 'Specify the text color using Hex codes or RGBA values, such as "#FF0000" or "rgba(25,12,13,0.1)". The default for enterprise light is "#3c444d". The default for enterprise dark is "#FFFFFF". The default for prisma da... |
| `highlightColor` | string | `transparent` | _color or token_ | Specify the highlight/background color for selected text using Hex codes or RGBA values. |
| `fontFamily` | string | `Splunk Data Sans` |  | 'Specify the font family for rich text content, such as "Arial" or "Times New Roman". Note: the font needs to be available to your end user.' |
| `fontSize` | string | `default` | extraSmall \|  small \|  default \|  large \|  extraLarge \|  custom | Specify the base font size preset. Font sizes range from extra small (10px) to extra large (20px) with the default being 14px. |
| `customFontSize` | number | `14` | (1–200) | 'Specify the custom font size in pixels when fontSize is set to "custom". Valid range is 1-200.' |
| `bold` | boolean | `false` |  | Apply bold font weight to all text by default. |
| `italic` | boolean | `false` |  | Apply italic font style to all text by default. |
| `underline` | boolean | `false` |  | Apply underline text decoration to all text by default. |
| `strikethrough` | boolean | `false` |  | Apply strikethrough text decoration to all text by default. |
| `listType` | string | `` | \|  unordered \|  ordered | Specify the default list type for the content. |
| `horizontalAlignment` | string | `left` | left \|  center \|  right \|  justify | Specify the horizontal text alignment. |
| `verticalAlign` | string | `top` | top \|  middle \|  bottom | Specify the vertical alignment of content within the container. |
| `lineHeight` | number \|  string | `1.5` |  | Specify the line height as a number (e.g., 1.5 means 150% of font size) or string value. |
| `link` | string | `` |  | Specify a URL to make the entire rich text content a clickable link. |
| `border` | object | `—` |  | Border configuration for the rich text container. |
| `padding` | number \|  array | `8` |  | Padding in pixels. Can be a single number (all sides), array of 2 (vertical, horizontal), or array of 4 (top, right, bottom, left). |
| `richTextContent` | string | `<p></p>` |  | HTML content for the rich text editor. Inline styles should only include differences from default text styles. |