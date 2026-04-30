# splunk.line — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.line.js`.

**8 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `acceleratedRender` | boolean | `false` |  | Specify whether to enable canvas rendering to render large datasets more efficiently. This mode improves initial render time and interaction responsiveness for large time-series datasets. |
| `x` | array | `> primary | seriesByIndex(0)` |  | Specify the dataSource applied to the x-axis. |
| `y` | array | `> primary | frameBySeriesIndexRange(1)` |  | Specify the dataSource applied to the y-axis. |
| `y2` | array | `—` |  | Specify the dataSource applied to the y2-axis |
| `xField` | string | `> x | getField()` |  | Specify the field that should be mapped to the x-axis. |
| `yFields` | string | `> y | getField()` |  | Specify the field that should be mapped to the y-axis. |
| `additionalTooltipFields` | array | `[]` |  | Specify the fields to add to the default set of tooltips. Tooltips appear when you hover over events. These fields and their corresponding values are shown in addition to the ones displayed by default. |
| `annotationColor` | "string"
  },
  // as UDF won't allow users to proceed if a string value is entered due to schema validation
  overlayFields: {
    description: "Specify field(s) that should be differentiated on the chart and displayed as chart overlays.",
    type: ["array", "string"],
    items: {
      type: "string"
    }
  },
  showOverlayY2Axis: {
    default: false,
    description: "Enable a y2-axis for chart overlays. All overlay fields will be mapped to a second y-axis.",
    type: "boolean"
  },
  showRoundedY2AxisLabels: {
    default: true,
    description: "Specify whether to round y2-axis values to the nearest integer.",
    type: "boolean"
  },
  y2Fields: {
    default: "> y2 | getField()",
    description: "Specify field(s) that should be mapped to a second y-axis.",
    type: ["array", "string"],
    items: {
      type: "string"
    }
  } | `3
  },
  trellisMinColumnWidth: {
    default: 250` | linear \|  log (1–3) | Specify the type of scale that applies to a numerical y2-axis. |