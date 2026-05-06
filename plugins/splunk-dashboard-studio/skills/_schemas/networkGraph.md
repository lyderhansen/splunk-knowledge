# splunk.networkgraph — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.networkgraph.js`.

**40 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. You may use a dataSource to apply the color. The default for enterprise light is "#ffffff". The default for enterprise dark is "#000000". The default for prisma dark is "#0b0c0e".' |
| `source` | array | `'> primary | frameBySeriesTypes("string") | ser...` |  | Specify the array of node Ids that links start from. |
| `target` | array | `'> primary | frameBySeriesTypes("string") | ser...` |  | Specify the array of node Ids that links go to. |
| `nodeIds` | array | `> source` |  | Specify the array of node Ids to use for node styling. By default this is the same as the from array. |
| `nodeTypes` | array | `—` |  | 'Specify the node type for each node in the nodeIds array. Needed for clustering when layout is "force".' |
| `nodeValues` | array | `'> primary | frameBySeriesTypes("number") | ser...` |  | Specify the node value for each node in the nodeIds array. |
| `nodeTexts` | array | `'> primary | frameBySeriesTypes("string") | ser...` |  | Specify the text to display under each node in the nodeIds array. |
| `nodeColors` | string \|  array | `> themes.defaultNodeColor` |  | Specify the color used for nodes. You may use a dataSource to apply color dynamically. |
| `nodeSize` | number \|  array | `48` |  | Specify a number to set the same diameter for all nodes or an array of numbers to set a custom diameter for each node. (8px - 200px) |
| `nodeColorValues` | array | `'> primary | seriesByType("number")'` |  | Specify the array of values used for dynamic node coloring. |
| `nodeIcons` | array | `—` |  | Specify the icon used for each node (cylinder, portrait, magnifier, etc.). |
| `nodeIconColors` | array \|  string | `> themes.defaultNodeIconColor` |  | Specify the color used for each node icon. You may use a dataSource to apply color dynamically. |
| `nodeIconColorValues` | array | `'> primary | seriesByType("number")'` |  | Specify the array of values used for dynamic node icon coloring. |
| `linkStyle` | string | `straight` | s \|  z \|  c \|  straight | Specify the link shape (s, z, c, straight). |
| `linkColors` | array \|  string | `> themes.defaultLinkColor` |  | Specify the color used for links. You may use a dataSource to apply color dynamically. |
| `linkWidth` | number \|  array | `2` |  | Specify a number to set the same width of all links or an array of numbers to set a custom width for each link. Width is in pixels. |
| `linkColorValues` | array | `'> primary | seriesByType("number")'` |  | Specify the array of values used for dynamic link coloring. |
| `showDirection` | string | `bidirection` | bidirection \|  oneWay \|  none | Specify the directionality of the links. Choose between bidirection, oneWay, none. z and s linkStyles look better with bidirection instead of oneWay. |
| `layout` | string | `grid` | preset \|  grid \|  hierarchical \|  force | Specify the layout used for the graph. Choose between preset, grid, hierarchical |
| `nodeHorizontalPadding` | number | `0` |  | Specify the additional horizontal padding between nodes in pixels (0 - 500). |
| `nodeVerticalPadding` | number | `0` |  | Specify the additional vertical padding between nodes in pixels (0 - 500). |
| `gridColumns` | number | `—` |  | 'When layout is "grid", specify the number of nodes to display per row. By default it uses the ceiling of the square root of the total number of nodes' |
| `hierarchyDirection` | — | `leftRight` | topBottom \|  bottomTop \|  leftRight \|  rightLeft | 'When layout is "hierarchical", specify the direction (topBottom, bottomTop, leftRight, rightLeft) of the hierarchy.' |
| `chargeStrength` | number | `-30` |  | 'When layout is "force", specify the strength of the charge between nodes. Positive value is attraction and negative value is replusion.' |
| `chargeTheta` | number | `0.9` |  | 'When layout is "force", specify the Barnes-Hut approximation parameter. Higher value means faster performance but less predictable node positioning.' |
| `chargeDistanceMax` | number | `—` |  | 'When layout is "force", specify the maximum distance over which to apply the charge force.' |
| `chargeDistanceMin` | number | `1` |  | 'When layout is "force", specify the minimum distance over which to apply the charge force.' |
| `collidePadding` | number | `10` |  | 'When layout is "force", specify the additional distance around each node which the collider uses for node repulsion. When clustering is on, this value is used to increase collision distance for clusters.' |
| `collideStrength` | number | `1` |  | 'When layout is "force", specify the strength of the collider used for node repulsion. A higher value results in stronger repulsion, causing nodes to spread out more. Ideally value should be between 0 - 1 but there is... |
| `clusterStrength` | number | `0.05` | (0–1) | 'When layout is "force", specify the strength of the clustering force between nodes of the same type. A higher value results in stronger clustering, causing nodes of the same type to be positioned closer together. Val... |
| `linkDistance` | number | `30` |  | 'When layout is "force", specify the ideal distance between linked nodes. A higher value results in more space between linked nodes.' |
| `linkStrength` | — | `—` | (0–1) | 'When layout is "force", specify the strength of the spring force between linked nodes. Higher value makes link lengths closer to the linkDistance value.' |
| `tooltipNodeFields` | array | `—` |  | Specify the fields to add to the tooltips. Tooltips appear when you hover over nodes. These fields and their corresponding values display for each node in its tooltip. |
| `tooltipHeaderField` | string | `—` |  | Specify the field to add to the tooltip header. Tooltips appear when you hover over nodes. Only the value of this field for the node displays as the header. |
| `xPositions` | array | `'> primary | frameBySeriesTypes("number") | ser...` |  | 'When layout is "preset", specify the x position for each node.' |
| `yPositions` | array | `'> primary | frameBySeriesTypes("number") | ser...` |  | 'When layout is "preset", specify the y position for each node.' |
| `nodeDragPositions` | object | `—` |  | Stores the positions for nodes by id when the user drags nodes to new positions using the UI. |
| `preferPorts` | string | `—` | horizontal \|  vertical \|  none | Specify the preferred port alignment for s and z links (horizontal, vertical, none). |
| `showZoomControls` | boolean | `true` |  | Specify whether to show the zoom controls on the graph. |
| `resultLimit` | number | `1e3` |  | Specify the maximum number of link data points rendered (hard limit 10,000). |