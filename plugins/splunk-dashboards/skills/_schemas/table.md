# splunk.table — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.table.js`.

**15 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify the color for the background. You might use a data source to apply the color. The default for enterprise light is "#FFFFFF". The default for enterprise dark is "#000000". The default for prisma dark is "#0B0C... |
| `columnFormat` | object | `—` |  | Lets you format an individual column in a table. Specify a column in a table as a field, followed by a property. For more information, see the Column Format Align - Left example on the Examples page. |
| `count` | number | `10` |  | Specify the maximum number of rows to display. |
| `font` | string | `proportional` | proportional \|  monospace | Specify the font style to use for table content. |
| `fontSize` | string | `default` |  | Specify the font size to use for table content. Font sizes range from extra small (10px) to large (16px) with the default being 14px. |
| `headers` | array | `> table | getField()` |  | Specify an array of headers to display on the table. Though these can be statically listed, it's best to use the dynamic default, as it will return the fields of your search. |
| `headerVisibility` | string | `inline` |  | Specify how to display the table header row. |
| `paginateDataSourceKey` | string | `primary` |  | Specify the data source key for pagination and sorting. |
| `showFooterPercentages` | boolean | `false` |  | Specify whether to show a row at the bottom of the table that displays percentage values for applicable columns. |
| `showFooterTotals` | boolean | `false` |  | Specify whether to show a row at the bottom of the table that displays total values for applicable columns. |
| `showColumnAsExpandedJson` | string \|  array | `—` |  | Specify row expansion content as stringified JSON. Provide either a DSL expression that resolves to an array of stringified JSON values, or a static array of stringified JSON values. Each item is rendered in the match... |
| `showInternalFields` | boolean | `true` |  | Specify whether to show internal fields that start with an underscore. The _time field will still be shown if false. |
| `showRowNumbers` | boolean | `false` |  | Show row numbers in the first column. |
| `table` | array | `> primary` |  | Two dimensional array of data to be displayed in the table. |
| `tableFormat` | object | `—` |  | Lets you set global options for a table. |