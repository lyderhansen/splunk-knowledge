# splunk.area — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.area.js`.

**8 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `acceleratedRender` | boolean | `false` |  | Specify whether to enable canvas rendering to render large datasets more efficiently. This mode improves initial render time and interaction responsiveness for large time-series datasets. |
| `x` | array | `> primary | seriesByIndex(0)` |  | Specify the data source to apply to the x-axis. |
| `y` | array | `> primary | frameBySeriesIndexRange(1)` |  | Specify the data source to apply to the y-axis. |
| `y2` | array | `—` |  | Specify the data source to apply to the second y-axis |
| `xField` | string | `> x | getField()` |  | Specify the field to map to the x-axis. |
| `yFields` | string | `> y | getField()` |  | Specify the field to map to the y-axis. |
| `additionalTooltipFields` | array | `[]` |  | Specify the fields to add to the default set of tooltips. Tooltips appear when you hover over events. These fields and their corresponding values are shown in addition to the ones displayed by default. |
| `annotationColor` | array | `"off"
  },
  stepPositionsByField: {
    descri...` | gaps \|  zero \|  connect | `Specify the colors to use in a series. For example |