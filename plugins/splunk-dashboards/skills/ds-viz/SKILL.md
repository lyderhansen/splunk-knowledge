---
name: ds-viz
description: Reference skill documenting every Splunk Dashboard Studio (v2) visualization type and the options each one accepts. Covers splunk.singlevalue, splunk.line, splunk.column, splunk.bar, splunk.pie, splunk.area, splunk.table, splunk.timeline, splunk.choropleth, splunk.markergauge, splunk.bubble, splunk.scatter, splunk.punchcard, splunk.events, splunk.fillergauge, splunk.map, splunk.choropleth.map, splunk.choropleth.svg, splunk.linkgraph, splunk.sankey, splunk.parallelcoordinates, splunk.singlevalueicon, splunk.singlevalueradial, splunk.markdown, splunk.image, splunk.rectangle, splunk.ellipse. Use this skill when picking or configuring a visualization for a panel, when ds-create needs per-type option detail, or when answering standalone questions about viz options.
---

# ds-viz — Visualization reference

Each section covers one Dashboard Studio visualization type: required fields, common options, and a minimal example. All examples show only the contents of the `visualizations.<key>` object.

---

## Shared options library

These option groups are shared across multiple visualization types. Each per-type section lists which groups apply using tags like **[AXES]**, **[LEGEND]**, etc. Full details stay in the Vista reference; only the most useful ~10 properties per group are shown here.

### [AXES] — Axis configuration

Used by: `splunk.line`, `splunk.area`, `splunk.bar`, `splunk.column`, `splunk.scatter`

| Property | Type | Default | Description |
|---|---|---|---|
| xAxisTitleText | string | — | X-axis title text |
| yAxisTitleText | string | — | Y-axis title text |
| xAxisTitleVisibility | "show" \| "hide" | "show" | Show/hide x-axis title |
| yAxisTitleVisibility | "show" \| "hide" | "show" | Show/hide y-axis title |
| xAxisLabelVisibility | "auto" \| "show" \| "hide" | "auto" | X-axis label visibility |
| yAxisLabelVisibility | "auto" \| "show" \| "hide" | "auto" | Y-axis label visibility |
| xAxisLabelRotation | -90 \| -45 \| 0 \| 45 \| 90 | 0 | X-axis label rotation (not supported by bar) |
| yAxisScale | "linear" \| "log" | "linear" | Y-axis scale type |
| yAxisMin | string \| number | "auto" | Y-axis minimum value |
| yAxisMax | string \| number | "auto" | Y-axis maximum value |

### [TICKS] — Tick mark configuration

Used by: `splunk.line`, `splunk.area`, `splunk.bar`, `splunk.column`

| Property | Type | Default | Description |
|---|---|---|---|
| xAxisMajorTickSize | number | 6 | X major tick size (px) |
| yAxisMajorTickSize | number | 6 | Y major tick size (px) |
| xAxisMajorTickVisibility | "auto" \| "show" \| "hide" | "auto" | X major tick visibility |
| yAxisMajorTickVisibility | "auto" \| "show" \| "hide" | "auto" | Y major tick visibility |
| yAxisMinorTickVisibility | "auto" \| "show" \| "hide" | "auto" | Y minor tick visibility |

### [GRIDLINES] — Grid line configuration

Used by: `splunk.line`, `splunk.area`, `splunk.bar`, `splunk.column`

| Property | Type | Default | Description |
|---|---|---|---|
| showXMajorGridLines | boolean | false | X-axis major grid lines |
| showYMajorGridLines | boolean | true | Y-axis major grid lines |
| showY2MajorGridLines | boolean | false | Y2-axis major grid lines |
| showYMinorGridLines | boolean | false | Y-axis minor grid lines |

### [LEGEND] — Legend configuration

Used by: `splunk.line`, `splunk.area`, `splunk.bar`, `splunk.column`, `splunk.bubble`, `splunk.scatter`, `splunk.pie`

| Property | Type | Default | Description |
|---|---|---|---|
| legendDisplay | "right" \| "left" \| "top" \| "bottom" \| "off" | "right" | Legend position |
| legendLabels | string[] | — | Pre-populate legend labels |
| legendTruncation | "ellipsisEnd" \| "ellipsisMiddle" \| "ellipsisStart" \| "ellipsisOff" | "ellipsisEnd" | Label overflow handling |

### [SERIES] — Series color configuration

Used by: All chart types

| Property | Type | Default | Description |
|---|---|---|---|
| seriesColors | string[] | (20-color palette) | Ordered color array for series |
| seriesColorsByField | object | — | Named field-to-color map, e.g. `{"allowed":"#00ff00","blocked":"#ff0000"}` |

### [DATASOURCE] — Standard data source binding

Used by: `splunk.line`, `splunk.area`, `splunk.bar`, `splunk.column`

| Property | Type | Default | Description |
|---|---|---|---|
| x | string \| number | `"> primary \| seriesByIndex(0)"` | DataSource for x-axis |
| y | string \| number | `"> primary \| frameBySeriesIndexRange(1)"` | DataSource for y-axis |
| y2 | string \| number | — | DataSource for y2-axis |
| xField | string | `"> x \| getField()"` | Field mapped to x-axis |
| yFields | string | `"> y \| getField()"` | Field(s) mapped to y-axis |

### [OVERLAY] — Chart overlay configuration

Used by: `splunk.line`, `splunk.area`, `splunk.bar`, `splunk.column`

| Property | Type | Default | Description |
|---|---|---|---|
| overlayFields | array \| string | — | Field(s) displayed as chart overlays |
| showOverlayY2Axis | boolean | false | Map overlay fields to y2-axis |
| y2AxisTitleText | string | — | Y2-axis title |

### [ANNOTATIONS] — Event annotations

Used by: `splunk.line`, `splunk.area`, `splunk.column` (NOT `splunk.bar`)

| Property | Type | Default | Description |
|---|---|---|---|
| annotationX | string \| number | — | DataSource field for annotation x position |
| annotationLabel | string[] | — | Annotation labels |
| annotationColor | string[] | — | Annotation colors |

### [SPLIT] — Split series configuration

Used by: `splunk.line`, `splunk.area`, `splunk.bar`, `splunk.column`

| Property | Type | Default | Description |
|---|---|---|---|
| showSplitSeries | boolean | false | Split multi-series into stacked sub-charts |
| showIndependentYRanges | boolean | false | Independent y-ranges for split series |

---

## splunk.singlevalue

Displays a single number. Best for KPIs.

**Data shape:** one row, one column (use `| stats count` or similar).

**Shared groups:** [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| majorValue | string \| number | `"> primary \| seriesByType(\"number\") \| lastPoint()"` | Primary value to display |
| majorColor | string | — | Value color; supports dynamic rangeValue thresholds |
| majorFontSize | number | — | Value font size (px) |
| trendValue | string \| number | — | Trend delta value |
| trendColor | string | — | Trend indicator color |
| trendDisplay | "percent" \| "absolute" \| "off" | "percent" | Trend display mode |
| sparklineValues | number | — | Sparkline data series |
| sparklineDisplay | "off" \| "before" \| "after" | "off" | Sparkline position |
| showSparklineAreaGraph | boolean | true | Fill area under sparkline |
| unit | string | — | Unit label (e.g., `"ms"`, `"%"`) |
| unitPosition | "before" \| "after" | "after" | Unit label position |
| underLabel | string | — | Label text below the value |
| backgroundColor | string | theme default | Background color |

Example:

```json
{ "type": "splunk.singlevalue", "title": "Failed Logins", "dataSources": {"primary": "ds_1"}, "options": { "majorColor": "#d13d3d", "unit": "", "sparklineDisplay": "after" } }
```

## splunk.line

Line chart. Best for trends over time.

**Data shape:** `_time` + one or more numeric series (usually produced by `| timechart`).

**Shared groups:** [DATASOURCE] [AXES] [TICKS] [GRIDLINES] [LEGEND] [SERIES] [OVERLAY] [ANNOTATIONS] [SPLIT]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| lineDashStyle | "solid" \| "dash" \| "dot" \| "shortDash" \| "longDash" \| "dashDot" | "solid" | Global line dash style |
| lineDashStylesByField | object | — | Per-field dash styles |
| lineWidth | number | 2 | Line width (px) |
| markerDisplay | "off" \| "filled" \| "outlined" | "off" | Data point marker style |
| nullValueDisplay | "gaps" \| "zero" \| "connect" | "gaps" | Null value handling |
| dataValuesDisplay | "off" \| "all" \| "minmax" | "off" | Data value label display |
| legendMode | "standard" \| "seriesCompare" | "standard" | seriesCompare shows all series on hover |
| resultLimit | number | 50000 | Max data points rendered |

Example:

```json
{ "type": "splunk.line", "title": "Latency Trend", "dataSources": {"primary": "ds_2"}, "options": { "legendDisplay": "right", "yAxisTitleText": "ms", "nullValueDisplay": "connect" } }
```

## splunk.column

Vertical bar chart (categorical x-axis).

**Data shape:** one categorical field + one or more numeric series (e.g., `| stats count by category`).

**Shared groups:** [DATASOURCE] [AXES] [TICKS] [GRIDLINES] [LEGEND] [SERIES] [OVERLAY] [ANNOTATIONS] [SPLIT]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| stackMode | "auto" \| "stacked" \| "stacked100" | "auto" | Stack mode |
| columnSpacing | number | — | Spacing between columns (px) |
| columnGrouping | "auto" \| "overlay" | "auto" | Column grouping mode |
| dataValuesDisplay | "off" \| "all" \| "minmax" | "off" | Data value label display |
| resultLimit | number | 50000 | Max data points |

Example:

```json
{ "type": "splunk.column", "title": "Counts by Service", "dataSources": {"primary": "ds_3"}, "options": { "stackMode": "stacked" } }
```

## splunk.bar

Horizontal bar chart (categorical y-axis). Same data shape and most options as `splunk.column`, rotated 90 degrees. Does NOT support `xAxisLabelRotation` or annotations.

**Shared groups:** [DATASOURCE] [AXES] (except xAxisLabelRotation) [TICKS] [GRIDLINES] [LEGEND] [SERIES] [OVERLAY] [SPLIT]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| stackMode | "auto" \| "stacked" \| "stacked100" | "auto" | Stack mode |
| barSpacing | number | — | Spacing between bars (px) |
| dataValuesDisplay | "off" \| "all" \| "minmax" | "off" | Data value label display |
| resultLimit | number | 50000 | Max data points |

Example:

```json
{ "type": "splunk.bar", "title": "Top Source IPs", "dataSources": {"primary": "ds_4"}, "options": { "stackMode": "default" } }
```

## splunk.pie

Pie chart. Use sparingly — only for a small number of categories (≤ 6).

**Data shape:** one categorical field + one numeric (e.g., `| top limit=5 severity`).

**Shared groups:** [LEGEND] [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| showDonutHole | boolean | false | Render as a donut with a hole |
| labelDisplay | "values" \| "valuesAndPercentage" \| "off" | "values" | Slice label display |
| label | string[] | `"> primary \| seriesByIndex(0)"` | Label values |
| value | number[] | `"> primary \| seriesByIndex(1)"` | Slice values |
| collapseThreshold | number | 0.01 | Threshold (0–1) below which slices collapse into "other" |
| collapseLabel | string | "other" | Label for collapsed slices |
| resultLimit | number | 50000 | Max data points |

Example:

```json
{ "type": "splunk.pie", "title": "Severity Breakdown", "dataSources": {"primary": "ds_5"}, "options": { "showDonutHole": true, "labelDisplay": "valuesAndPercentage" } }
```

## splunk.area

Filled-area time series. Same data shape as `splunk.line`; use for cumulative or stacked visuals.

**Shared groups:** [DATASOURCE] [AXES] [TICKS] [GRIDLINES] [LEGEND] [SERIES] [OVERLAY] [ANNOTATIONS] [SPLIT]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| stackMode | "auto" \| "stacked" \| "stacked100" | "auto" | Stack mode |
| areaOpacity | number | 0.75 | Area fill opacity (0–1) |
| showLines | boolean | true | Show lines on top of areas |
| nullValueDisplay | "gaps" \| "zero" \| "connect" | "gaps" | Null value handling |
| resultLimit | number | 50000 | Max data points |

Example:

```json
{ "type": "splunk.area", "title": "Throughput by Service", "dataSources": {"primary": "ds_6"}, "options": { "stackMode": "stacked", "areaOpacity": 0.6 } }
```

## splunk.table

Tabular display of all returned columns.

**Data shape:** any tabular result.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| count | number | 20 | Rows per page |
| showRowNumbers | boolean | false | Show row number column |
| showInternalFields | boolean | false | Show internal fields (_time, _raw) |
| drilldown | "row" \| "cell" \| "none" | "row" | Drilldown mode |
| dataOverlayMode | "none" \| "heatmap" \| "highlow" | "none" | Data overlay visualization |
| columnFormat | object | — | Per-column formatting keyed by column name |
| tableFormat | object | — | Table-level row background formatting |
| headerRemapping | object | — | Rename column headers, e.g. `{"src_ip":"Source IP"}` |

Example:

```json
{ "type": "splunk.table", "title": "Slowest Endpoints", "dataSources": {"primary": "ds_7"}, "options": { "showRowNumbers": true, "drilldown": "row", "count": 25 } }
```

## splunk.timeline

Shows discrete events on a timeline. Useful for incident overlays.

**Data shape:** `_time` + `label` field (or equivalent resource/category field).

**Shared groups:** [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| category | string | — | DOS expression for category field |
| legendDisplay | "right" \| "left" \| "top" \| "bottom" \| "off" | "right" | Legend position |
| backgroundColor | string | "transparent" | Background color |
| dataColors | string | — | Data-driven event colors (use with context.dataColorConfig) |

Example:

```json
{ "type": "splunk.timeline", "title": "Deploy Markers", "dataSources": {"primary": "ds_8"}, "options": { "category": "> primary | seriesByName('env')", "legendDisplay": "right" } }
```

## splunk.choropleth

Geographic heatmap (legacy type). Prefer `splunk.choropleth.map` for new dashboards.

**Data shape:** a geographic key (e.g., `country`, `featureIdField` value) + a numeric.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| map | string | — | Base map (e.g., `"world"`, `"us"`) |
| featureIdField | string | — | Field matching the map's feature id |

Example:

```json
{ "type": "splunk.choropleth", "title": "Attacks by Country", "dataSources": {"primary": "ds_9"}, "options": { "map": "world", "featureIdField": "country" } }
```

## splunk.markergauge

Gauge with a needle/marker. Good for SLA indicators.

**Data shape:** one row, one numeric.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| value | string | `"> primary \| seriesByType(\"number\") \| lastPoint()"` | Value data source |
| gaugeRanges | object[] | (3 default ranges) | Color-coded subranges; each needs `from`, `to`, `value` (color) |
| orientation | "horizontal" \| "vertical" | "vertical" | Gauge orientation |
| labelDisplay | "number" \| "percentage" \| "off" | "number" | Scale label display |
| valueDisplay | "number" \| "percentage" \| "off" | "number" | Value display format |
| majorTickInterval | string \| number | "auto" | Major tick spacing |

Example:

```json
{ "type": "splunk.markergauge", "title": "p95 Latency", "dataSources": {"primary": "ds_10"}, "options": { "gaugeRanges": [ {"from": 0, "to": 500, "value": "#53A051"}, {"from": 500, "to": 1000, "value": "#DC4E41"} ] } }
```

---

## splunk.bubble

Bubble chart showing three-variable correlation (x, y, size).

**Data shape:** `| stats` producing at least 3 numeric fields (x, y, and size).

**Shared groups:** [LEGEND] [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| x | string \| number | `"> primary \| seriesByIndex(0)"` | X-axis data |
| y | string \| number | `"> primary \| seriesByIndex(1)"` | Y-axis data |
| size | number | `"> primary \| seriesByIndex(2)"` | Bubble size data |
| category | string \| number | — | Category data for coloring |
| xField | string | `"> x \| getField()"` | X-axis field name |
| yField | string | `"> y \| getField()"` | Y-axis field name (singular, NOT yFields) |
| sizeField | string | `"> size \| getField()"` | Size field name |
| categoryField | string | `"> category \| getField()"` | Category field name |
| bubbleSizeMax | number | 50 | Max bubble size (px) |
| bubbleSizeMin | number | 10 | Min bubble size (px) |
| bubbleSizeMethod | "area" \| "diameter" | "area" | Size calculation method |
| xAxisTitleText | string | — | X-axis title |
| yAxisTitleText | string | — | Y-axis title |
| resultLimit | number | 50000 | Max data points |

Example:

```json
{ "type": "splunk.bubble", "title": "CPU vs Memory vs Requests", "dataSources": {"primary": "ds_bubble"}, "options": { "xField": "cpu_pct", "yField": "mem_pct", "sizeField": "req_count", "bubbleSizeMax": 60 } }
```

## splunk.scatter

Scatter plot showing two-variable correlation.

**Data shape:** `| stats` producing 2+ numeric fields.

**Shared groups:** [LEGEND] [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| x | string \| number | `"> primary \| seriesByIndex(0)"` | X-axis data |
| y | string \| number | `"> primary \| seriesByIndex(1)"` | Y-axis data |
| category | string \| number | — | Category data for coloring |
| xField | string | `"> x \| getField()"` | X-axis field name |
| yField | string | `"> y \| getField()"` | Y-axis field name (singular) |
| categoryField | string | `"> category \| getField()"` | Category field name |
| markerSize | number | 4 | Marker size (px) |
| xAxisTitleText | string | — | X-axis title |
| yAxisTitleText | string | — | Y-axis title |
| resultLimit | number | 50000 | Max data points |

Example:

```json
{ "type": "splunk.scatter", "title": "Latency vs Error Rate", "dataSources": {"primary": "ds_scatter"}, "options": { "xField": "avg_latency", "yField": "error_rate", "markerSize": 5 } }
```

## splunk.parallelcoordinates

Visualizes multidimensional patterns across vertical axes. Lines connect events across dimensions.

**Data shape:** `| stats count by dim1, dim2, dimN | fields - count`. Keep under 15 dimensions.

**Shared groups:** [LEGEND] [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| lineColor | string | "#7B56DB" | Line color |
| lineOpacity | number | 0.5 | Line opacity (0–1) |
| showNullAxis | boolean | true | Show null value axis |
| backgroundColor | string | theme default | Background color |

Example:

```json
{ "type": "splunk.parallelcoordinates", "title": "Network Connection Patterns", "dataSources": {"primary": "ds_pcoord"}, "options": { "lineOpacity": 0.4, "legendDisplay": "right" } }
```

## splunk.punchcard

Matrix chart showing frequency/magnitude at intersections of two categorical dimensions.

**Data shape:** `| chart count over field1 by field2` (produces a matrix).

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| seriesColors | string[] | (default palette) | Bubble colors |
| bubbleSizeMax | number | 30 | Max bubble size (px) |
| bubbleSizeMin | number | 6 | Min bubble size (px) |
| xAxisTitleText | string | — | X-axis title |
| yAxisTitleText | string | — | Y-axis title |
| backgroundColor | string | theme default | Background color |
| resultLimit | number | 50000 | Max data points |

Example:

```json
{ "type": "splunk.punchcard", "title": "Alerts by Hour and Day", "dataSources": {"primary": "ds_punch"}, "options": { "bubbleSizeMax": 40, "xAxisTitleText": "Hour of Day", "yAxisTitleText": "Day of Week" } }
```

## splunk.singlevalueicon

Single value display with an icon badge.

**Data shape:** one row, one numeric (same as `splunk.singlevalue`).

**Shared groups:** [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| majorValue | string \| number | `"> primary \| seriesByType(\"number\") \| lastPoint()"` | Primary value |
| majorColor | string | — | Value color |
| icon | string | — | Icon name (e.g., `"alert"`, `"check"`, `"warning"`) |
| iconColor | string | — | Icon color (hex) |
| iconPosition | "before" \| "after" | "before" | Icon position relative to value |
| unit | string | — | Unit label |
| underLabel | string | — | Label below the value |
| backgroundColor | string | theme default | Background color |
| sparklineDisplay | "off" \| "before" \| "after" | "off" | Sparkline position |
| trendDisplay | "percent" \| "absolute" \| "off" | "percent" | Trend display mode |

Example:

```json
{ "type": "splunk.singlevalueicon", "title": "Critical Alerts", "dataSources": {"primary": "ds_crit"}, "options": { "icon": "alert", "iconColor": "#DC4E41", "majorColor": "#DC4E41", "underLabel": "Critical" } }
```

## splunk.singlevalueradial

Single value with a radial arc gauge background.

**Data shape:** one row, one numeric.

**Shared groups:** [SERIES]

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| majorValue | string \| number | `"> primary \| seriesByType(\"number\") \| lastPoint()"` | Primary value |
| majorColor | string | — | Value color |
| radialStrokeColor | string | — | Arc stroke color |
| radialBackgroundColor | string | — | Arc track background color |
| gaugeRanges | object[] | — | Color-coded arc ranges (from/to/value) |
| unit | string | — | Unit label |
| underLabel | string | — | Label below the value |
| backgroundColor | string | theme default | Background color |
| trendDisplay | "percent" \| "absolute" \| "off" | "percent" | Trend display mode |

Example:

```json
{ "type": "splunk.singlevalueradial", "title": "Uptime", "dataSources": {"primary": "ds_uptime"}, "options": { "unit": "%", "radialStrokeColor": "#53A051", "gaugeRanges": [ {"from": 0, "to": 90, "value": "#DC4E41"}, {"from": 90, "to": 100, "value": "#53A051"} ] } }
```

## splunk.fillergauge

Filler/progress gauge. Good for showing progress toward a goal (0–100 style).

**Data shape:** one row, one numeric.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| value | number | `"> primary \| seriesByType(\"number\") \| lastPoint()"` | Value data source |
| gaugeColor | string | "#7B56DB" | Gauge fill color |
| orientation | "vertical" \| "horizontal" | "vertical" | Gauge orientation |
| labelDisplay | "number" \| "percentage" \| "off" | "number" | Scale label display |
| valueDisplay | "number" \| "percentage" \| "off" | "number" | Value display format |
| majorTickInterval | string \| number | "auto" | Major tick spacing |
| backgroundColor | string | theme default | Background color |

Example:

```json
{ "type": "splunk.fillergauge", "title": "Disk Usage", "dataSources": {"primary": "ds_disk"}, "options": { "gaugeColor": "#F8BE34", "orientation": "horizontal", "valueDisplay": "percentage" } }
```

## splunk.events

Raw event viewer. Displays events in list, table, or raw format.

**Data shape:** any search result (no aggregation needed).

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| type | "list" \| "table" \| "raw" | "list" | Event display type |
| count | number | 20 | Events per page |
| fields | string[] | — | Fields to display (default: all) |
| showPagination | boolean | true | Show pagination controls |
| list.drilldown | "full" \| "inner" \| "outer" \| "none" | "full" | List view drilldown mode |
| list.labelVisibility | "show" \| "hide" | "show" | Field label visibility |
| raw.drilldown | "full" \| "inner" \| "outer" \| "none" | "full" | Raw view drilldown mode |
| backgroundColor | string | theme default | Background color |

Example:

```json
{ "type": "splunk.events", "title": "Recent Events", "dataSources": {"primary": "ds_raw"}, "options": { "type": "list", "count": 50, "fields": ["_time", "host", "sourcetype", "_raw"] } }
```

## splunk.map

Geographic marker/bubble map. Requires lat/lon fields.

**Data shape:** search with `lat` and `lon` fields (use `| iplocation` or `| geostats`).

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| center | number[] | — | Map center `[lat, lon]` |
| zoom | number | — | Initial zoom level |
| layers | object[] | — | Array of layer objects (see below) |
| scaleUnit | "metric" \| "imperial" | "metric" | Scale indicator unit |
| showScale | boolean | true | Show scale indicator |
| baseLayerTileServer | string | — | Custom tile server URL |
| backgroundColor | string | theme default | Background color |

**Layer options** (nested in `layers` array):

| Property | Type | Default | Description |
|---|---|---|---|
| type | "marker" \| "bubble" | "bubble" | Layer display type |
| latitude | string \| array | — | Latitude field DOS expression |
| longitude | string \| array | — | Longitude field DOS expression |
| dataColors | string \| array | — | Data-driven point colors |
| seriesColors | string[] | default palette | Point colors |
| resultLimit | number | 1000 | Max points on map |

Example:

```json
{ "type": "splunk.map", "title": "Attack Origins", "dataSources": {"primary": "ds_geo"}, "options": { "center": [20, 0], "zoom": 2, "layers": [ { "type": "marker", "latitude": "> primary | seriesByName(\"lat\")", "longitude": "> primary | seriesByName(\"lon\")" } ] } }
```

## splunk.choropleth.map

Geographic choropleth map coloring regions by value.

**Data shape:** search with region identifier field (country, state, etc.) + numeric value.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| source | "geo://default/world" \| "geo://default/us" | "geo://default/world" | Geographic data source |
| projection | "mercator" \| "equirectangular" | "mercator" | Map projection |
| fillColor | string | "#EAEFF2" | Fill color for regions with no data |
| strokeColor | string | "#689C8D" | Border color for regions |

Example:

```json
{ "type": "splunk.choropleth.map", "title": "Events by Country", "dataSources": {"primary": "ds_country"}, "options": { "source": "geo://default/world", "projection": "mercator", "fillColor": "#EAEFF2" } }
```

## splunk.choropleth.svg

SVG-based choropleth for custom floor plans, network diagrams, or non-geographic maps.

**Data shape:** search with area identifier field + numeric value matching SVG element IDs.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| svg | string | — | Literal SVG string or data URI (**required**) |
| areaIds | string | `"> primary \| seriesByType(\"string\")"` | Field identifying SVG area IDs |
| areaValues | number | `"> primary \| seriesByType(\"number\")"` | Values for each area |
| areaColors | string | `"> areaValues \| rangeValue(areaColorsRangeConfig)"` | Fill colors for areas |
| backgroundColor | string | theme default | Background color |

Example:

```json
{ "type": "splunk.choropleth.svg", "title": "Floor Plan Activity", "dataSources": {"primary": "ds_floor"}, "options": { "svg": "<svg>...</svg>", "areaIds": "> primary | seriesByType('string')", "areaValues": "> primary | seriesByType('number')" } }
```

## splunk.linkgraph

Multi-field relationship graph. Shows connections between entity columns (e.g., source IP → dest IP → port).

**Data shape:** `| stats count by field1, field2, field3` (2–5 fields recommended).

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| fieldOrder | string | `"> primary \| getField()"` | Field display order (left to right) |
| nodeColor | string | theme default | Unhighlighted node color |
| nodeHighlightColor | string | "#7B56DB" | Highlighted node color |
| nodeWidth | number | 180 | Node width (px) |
| nodeHeight | number | 21 | Node height (px) |
| nodeSpacingX | number | 32 | Horizontal node spacing (px) |
| nodeSpacingY | number | 18 | Vertical node spacing (px) |
| linkColor | string | "#6d6f76" | Link color |
| linkWidth | number | 1 | Link stroke width (px) |
| showNodeCounts | boolean | true | Show count per column header |
| showValueCounts | boolean | true | Show frequency per node value |
| resultLimit | number | 50 | Max nodes per column |

Example:

```json
{ "type": "splunk.linkgraph", "title": "Connection Graph", "dataSources": {"primary": "ds_links"}, "options": { "nodeHighlightColor": "#009CEB", "showNodeCounts": true, "resultLimit": 20 } }
```

## splunk.sankey

Sankey diagram showing flow and volume between categorical stages.

**Data shape:** exactly 3 columns: `source`, `target`, `value` (use `| rename` to match).

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| linkColorMode | "source" \| "target" \| "gradient" | — | How links are colored |
| linkColor | string | — | Static link color |
| seriesColors | string[] | default palette | Node/link colors |
| resultLimit | number | 50000 | Max data points |
| backgroundColor | string | theme default | Background color |

Example:

```json
{ "type": "splunk.sankey", "title": "Network Traffic Flow", "dataSources": {"primary": "ds_flow"}, "options": { "linkColorMode": "source" } }
```

## splunk.markdown

Markdown text block for rich text, headers, and links in a dashboard.

**Data shape:** no data source required.

**Note:** Does NOT support pipe-based markdown tables (`| col1 | col2 |`). Use `splunk.table` for tabular content.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| markdown | string | — | Markdown content (**required**) |
| fontColor | string | theme default | Text color (hex or rgba) |
| fontSize | "extraSmall" \| "small" \| "default" \| "large" \| "extraLarge" | "default" | Font size preset |
| backgroundColor | string | "transparent" | Background color |

Example:

```json
{ "type": "splunk.markdown", "title": "", "options": { "markdown": "## Section Header\n\nThis panel shows **critical** events.", "fontSize": "default" } }
```

## splunk.image

Static image display panel.

**Data shape:** no data source required.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| src | string | — | Image URL (**required**) |
| preserveAspectRatio | boolean | false | Maintain aspect ratio on resize |

Example:

```json
{ "type": "splunk.image", "title": "", "options": { "src": "https://example.com/logo.png", "preserveAspectRatio": true } }
```

## splunk.rectangle

Rectangle shape for backgrounds, borders, and layout decoration. Primarily used in absolute layout.

**Data shape:** no data source required.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| fillColor | string | theme default | Fill color |
| fillOpacity | number | 1 | Fill opacity (0–1) |
| strokeColor | string | theme default | Border color |
| strokeWidth | number | 1 | Border width (1–25 px) |
| strokeDashStyle | number | 0 | Dash size (px); 0 = solid |
| strokeOpacity | number | 1 | Border opacity (0–1) |
| cornerRoundness | number | 0 | Border radius (px) |

Example:

```json
{ "type": "splunk.rectangle", "title": "", "options": { "fillColor": "#171D29", "fillOpacity": 0.9, "strokeColor": "#2D3A4A", "strokeWidth": 1, "cornerRoundness": 4 } }
```

## splunk.ellipse

Ellipse/circle shape for decorative layout elements. Primarily used in absolute layout.

**Data shape:** no data source required.

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| fillColor | string | theme default | Fill color |
| fillOpacity | number | 1 | Fill opacity (0–1) |
| strokeColor | string | theme default | Border color |
| strokeWidth | number | 1 | Border width (1–25 px) |
| strokeDashStyle | number | 0 | Dash size (px); 0 = solid |
| strokeOpacity | number | 1 | Border opacity (0–1) |

Example:

```json
{ "type": "splunk.ellipse", "title": "", "options": { "fillColor": "#7B56DB", "fillOpacity": 0.3, "strokeColor": "#7B56DB", "strokeWidth": 2 } }
```

---

## Common mistakes

1. **`yField` vs `yFields`**: Bubble and scatter use singular `yField`. Line, area, bar, and column use plural `yFields`. Mixing them up produces empty charts.

2. **Quoting booleans**: `"showDonutHole": "true"` is WRONG. Must be `"showDonutHole": true` (no quotes). Numbers are also unquoted.

3. **Missing dataSources**: Every visualization except `markdown`, `image`, `rectangle`, and `ellipse` requires `"dataSources": {"primary": "ds_xxx"}`.

4. **stackMode on wrong type**: `stackMode` is available on `splunk.area`, `splunk.bar`, `splunk.column` — NOT on `splunk.line`.

5. **Annotations on bar charts**: `splunk.bar` does NOT support annotations. Use `splunk.column` or `splunk.line` instead.

6. **xAxisLabelRotation on bar charts**: Not supported by `splunk.bar` (horizontal orientation means labels are on the y-axis).

7. **Map resultLimit is 1000**: The default inside a map layer is 1000, not 50000 like charts. Increase explicitly for dense geospatial data.

8. **Gauge ranges must be continuous**: `gaugeRanges` for marker gauge requires `from`, `to`, and `value` (the color) in each object. Ranges must cover the full scale without gaps.

9. **SVG choropleth requires `svg`**: The `svg` property is required in `splunk.choropleth.svg`. Without it the panel renders blank.

10. **Sankey needs exactly 3 columns**: `splunk.sankey` requires `source`, `target`, and `value` columns. Rename fields in SPL if needed: `| rename src_zone AS source, dest_zone AS target`.

---

## Picking a viz type

| Question / data shape | Recommended viz |
|---|---|
| "What is the current value of metric X?" | `splunk.singlevalue` |
| "How has metric X changed over time?" | `splunk.line` or `splunk.area` |
| "Top N things by metric" | `splunk.bar` (horizontal) or `splunk.column` |
| "Breakdown of categorical field" | `splunk.pie` (≤ 6 slices) or `splunk.bar` |
| "List of raw events or rows" | `splunk.table` or `splunk.events` |
| "When did events happen? (timeline lanes)" | `splunk.timeline` |
| "Geographic region heatmap" | `splunk.choropleth.map` |
| "Geographic marker/cluster points" | `splunk.map` |
| "Custom floor plan / SVG region coloring" | `splunk.choropleth.svg` |
| "Is metric above threshold? (gauge)" | `splunk.markergauge` |
| "Progress toward a goal (0–100)" | `splunk.fillergauge` |
| "Three-variable correlation (x, y, size)" | `splunk.bubble` |
| "Two-variable correlation" | `splunk.scatter` |
| "Frequency matrix (hour × day)" | `splunk.punchcard` |
| "Multi-dimensional pattern comparison" | `splunk.parallelcoordinates` |
| "Flow between sources and targets" | `splunk.sankey` |
| "Entity relationship exploration" | `splunk.linkgraph` |
| "KPI with icon badge" | `splunk.singlevalueicon` |
| "KPI with arc gauge" | `splunk.singlevalueradial` |
| "Text annotation / section header in dashboard" | `splunk.markdown` |
| "Static image / logo" | `splunk.image` |
| "Background panel / decorative border" | `splunk.rectangle` |
| "Circular decorative element" | `splunk.ellipse` |
