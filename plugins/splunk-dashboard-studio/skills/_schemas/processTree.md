# splunk.processtree — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.processtree.js`.

**21 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color for the background. |
| `source` | array | `'> primary | frameBySeriesTypes("string") | ser...` |  | Specify the source node id for each link row. |
| `target` | array | `'> primary | frameBySeriesTypes("string") | ser...` |  | Specify the target node id for each link row. |
| `nodeId` | array | `'> nodeSource | seriesByName("node_id")'` |  | Specify node ids for node metadata lookup when using a secondary node datasource. |
| `nodeColors` | array \|  string | `[]` |  | Specify optional node colors aligned with nodeSource rows. Currently applied only to network chip text color. Provide an array, or use a string DSL expression that resolves to an array. |
| `nodeIcons` | array \|  string | `[]` |  | Specify optional node icons aligned with nodeSource rows. Supported built-in values are fire, rectangleDashed, cube, servers, and container. Provide an array, or use a string DSL expression that resolves to an array. |
| `linkValues` | array | `[]` |  | Specify link values for each link row. |
| `highlightedNodeId` | string | `` |  | Specify a node id to highlight in the process tree. |
| `highlightColor` | string | `rgba(129, 51, 74, 0.82)` |  | Specify the background color used for the highlighted node row. |
| `highlightIcon` | string | `` |  | Specify an optional built-in icon to render for the highlighted node. Supported values are fire, rectangleDashed, cube, servers, and container. |
| `highlightIconColor` | string | `` | _color or token_ | Specify an optional color override for the highlighted node icon. |
| `treeNodeLabelFields` | array \|  string | `[]` |  | Specify nodeSource field names to render in each tree node label, joined by spaces. Empty or null values are skipped. Provide an array, or use a string DSL expression that resolves to an array. |
| `fieldsToShowAsChip` | array \|  string | `[]` |  | Specify treeNodeLabelFields names whose values should be rendered as chips. Provide an array, or use a string DSL expression that resolves to an array. |
| `showFieldName` | boolean | `false` |  | Specify whether tree node labels render as field=value. When false, only the field value is shown. |
| `disableExpansionPerNode` | array \|  string | `[]` |  | Specify per-node expansion behavior aligned with nodeSource rows. Use 'disable' to prevent collapsing/expanding that node; 'enable' or null allows expansion. Provide an array, or use a string DSL expression that resol... |
| `filteredNodeField` | string | `—` |  | Specify node field name used to classify which nodes render in the right panel and are excluded from the left tree. |
| `filteredNodeValues` | array \|  string | `—` |  | Specify field value(s) used with filteredNodeField to classify which nodes render in the right panel. Provide an array, or use a string DSL expression that resolves to an array. |
| `filterButtonFields` | array \|  string | `[]` |  | Specify nodeSource field names used by connection filter buttons. Provide an array, or use a string DSL expression that resolves to an array. |
| `filterButtonMatchValues` | array \|  string | `[]` |  | Specify match values used by connection filter buttons. Provide an array, or use a string DSL expression that resolves to an array. |
| `filterButtonNames` | array \|  string | `[]` |  | Specify display names for connection filter buttons. Provide an array, or use a string DSL expression that resolves to an array. Falls back to filterButtonMatchValues when omitted. |
| `filterButtonColors` | array \|  string | `[]` |  | Specify optional colors for connection filter buttons (for example #FF0000). Provide an array, or use a string DSL expression that resolves to an array. |