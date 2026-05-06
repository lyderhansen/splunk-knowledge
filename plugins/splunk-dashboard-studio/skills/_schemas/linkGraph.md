# splunk.linkgraph — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.linkgraph.js`.

**16 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. You may use a dataSource to apply the color. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `fieldOrder` | array | `> primary | getField()` |  | Specify the order of fields to be displayed in the link graph from left to right when loaded. Unspecified fields will be excluded from the graph. |
| `linkColor` | string | `#6d6f76` | _color or token_ | Specify the color used for highlighted links. Non-highlighted links will be displayed at 20% opacity. |
| `linkWidth` | number | `1` |  | Specify, in pixels, the stroke width of each link. |
| `nodeColor` | string | `> themes.defaultNodeColor` | _color or token_ | Specify the color used for unhighlighted nodes. |
| `nodeTextColor` | string | `> nodeColor | maxContrast(nodeTextColorMaxContr...` | _color or token_ | Specify the color used for unhighlighted nodes text. |
| `nodeLabelOverflow` | string | `ellipsis` |  | 'Specify the text overflow for node labels. Valid types include "break-word", "anywhere", and "ellipsis".' |
| `nodeHeight` | number | `21` |  | Specify, in pixels, the height of each node. |
| `nodeHighlightColor` | string | `visualization_color_palettes_exports.VIZ_CATEGO...` | _color or token_ | Specify the color used for highlighted nodes. |
| `nodeTextHighlightColor` | string | `> nodeHighlightColor | maxContrast(nodeHighligh...` | _color or token_ | Specify the color used for highlighted nodes text. |
| `nodeSpacingX` | number | `32` |  | Specify, in pixels, the horizontal spacing between each node. |
| `nodeSpacingY` | number | `18` |  | Specify, in pixels, the vertical spacing between each node. |
| `nodeWidth` | number | `180` |  | Specify, in pixels, the width of each node. |
| `resultLimit` | number | `50` |  | Specify the number of nodes rendered in each column. |
| `showNodeCounts` | boolean | `true` |  | Specify whether a count is shown for the number of nodes displayed in each column. The number of total nodes is also shown if there are hidden nodes. |
| `showValueCounts` | boolean | `true` |  | Specify whether a count is shown for the frequency of occurrence for each distinct node value. |