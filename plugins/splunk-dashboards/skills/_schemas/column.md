# splunk.column — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.column.js`.

**8 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `x` | array | `> primary | seriesByIndex(0)` |  | Specify a data source to apply to the x-axis. |
| `y` | array | `> primary | frameBySeriesIndexRange(1)` |  | Specify a data source to apply to the y-axis. |
| `y2` | array | `—` |  | Specify a data source to apply to the second y-axis |
| `xField` | string | `> x | getField()` |  | Specify a field to map to the x-axis. |
| `yFields` | string | `> y | getField()` |  | Specify a field to map to the y-axis. |
| `y2Fields` | array \|  string | `> y2 | getField()` |  | Specify one or more fields to map to a second y-axis. |
| `additionalTooltipFields` | array | `[]` |  | Specify the fields to add to the default set of tooltips. Tooltips appear when you hover over events. These fields and their corresponding values are shown in addition to the ones displayed by default. |
| `annotationColor` | "boolean"
  } | `auto"
  },
  overlayFields: {
    description: ...` | off \|  auto (1–3
  },
  yAxisScale: {
    type: "string") | Specify whether to round the second y-axis values to the nearest integer. |