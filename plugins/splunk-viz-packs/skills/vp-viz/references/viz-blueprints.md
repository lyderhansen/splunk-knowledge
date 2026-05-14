# Viz Type Blueprints — Inspiration, Not Templates

## Contents
- Single Value Tile (KPI)
- Ring Gauge
- Status Chip / Badge
- Live Ticker
- Leaderboard
- Process Flow / Pipeline
- Donut / Ring
- Heat Grid / Matrix
- Spark Strip
- Radar / Spider Chart
- Needle Gauge (Speedometer)
- Status Matrix / Health Grid
- Waterfall Chart
- Horizontal Bar List
- Data Table (Canvas)

> These blueprints show WHAT each viz type expresses and what settings
> to expose. They are NOT templates to copy verbatim. Study the brand's
> design language, then write Canvas code that matches THAT.

> The agent's job: take the data contract + expression intent, then
> design a rendering that looks like a graphic designer made it for
> THIS specific brand.

### Single Value Tile (KPI)

**Expresses:** the single most important number. Hero metric.

**Accessibility:** AAA — single number, inherently accessible. Add aria-label on canvas with the value.

**When NOT to use:** Don't use for values that need comparison context (use bar/column), for time-series trends (use area/line), or when you have more than 1 value per panel.

**Technical rules:**
- String passthrough for non-numeric values like "1:21.584", "+3.2s", "DNS"
- Use additive Y positioning for label-value-trend stack
- All sizes scale from container: `Math.max(floor, h * ratio)`

**Creative decisions YOU make:**
- Value font weight (condensed, expanded, standard)
- Label placement (above, below, beside)
- Trend indicator (arrow, dot, sparkline, percentage badge)
- Background treatment (flat, gradient, accent glow, texture)
- Unit styling relative to value (smaller? dimmer? superscript?)

**Settings:** `field`, `label`, `unit`, `unitPosition`, `decimals`, `showDelta`, `deltaField`, `accentColor`, `themeMode`

**Data contract:** configurable field (default: `value`). Reads last row. Optional: `delta` field.

### Ring Gauge

**Expresses:** progress toward a target, fill level, health percentage.

**Accessibility:** AA — arc encoding needs numeric readout in center.

**When NOT to use:** Don't use for values without a known max (use KPI). Don't use for multi-category comparison (use bar). Don't use 5 identical gauges in a row.

**Technical rules:**
- Arc angles in radians: full circle = 0-2pi, 270 degree sweep = 0.75pi-2.25pi
- Brand-colored segments, NOT default green-yellow-red
- All sizes relative to `Math.min(w, h)`
- Gauge arc constraint: `cy - radius >= pad` (coupled — never calculate independently)

**Creative decisions YOU make:**
- Sweep angle (180, 270, 360, asymmetric)
- Track style (hairline, thick band, dashed, invisible)
- Fill style (solid, gradient along arc, segmented, neon glow)
- Center content (big number, label + number, icon, empty)
- Cap style (round, butt, arrow tip)
- Whether arc has drop shadow, glow, or bevel

**Settings:** `field`, `maxValue`, `unit`, `label`, `colorScheme`, `showTicks`, `showGlow`, `displayMode`, `themeMode`

**Data contract:** configurable numeric field (default: `value`). Reads last row.

### Status Chip / Badge

**Expresses:** categorical status — OK/warning/critical, active/inactive.

**Accessibility:** AA — text label provides meaning beyond color.

**When NOT to use:** Don't use for continuous values (use gauge). Don't use for more than 6-8 statuses.

**Settings:** `field`, `labelField`, `themeMode`

**Data contract:** requires severity field and label field. Reads last row.

### Live Ticker

**Expresses:** real-time event feed, breaking news feel, continuous activity.

**Accessibility:** B — scrolling content hard for screen readers.

**When NOT to use:** Don't use for historical analysis (use table). Don't use on print/PDF dashboards.

**Technical rules:**
- Animation timers MUST be cleaned up in `destroy()`
- Edge fade gradients prevent text clipping

**Settings:** `title`, `scrollSpeed`, `field1`-`field4`, `label1`-`label4`, `bgColor`, `textColor`, `accentColor`, `themeMode`

**Data contract:** requires `_time` + 1-4 configurable fields. Multi-row.

### Leaderboard

**Expresses:** ranked competition, top-N, performance standings.

**Accessibility:** AA — text-based, inherently readable.

**When NOT to use:** Don't use for unranked data (use table). If only 2-3 entries, use KPI strip.

**Settings:** `title`, `maxRows`, `scoreDigits`, `rankField`, `nameField`, `scoreField`, `showGlow`, `themeMode`

**Data contract:** requires rank, name, score fields. Multi-row.

### Process Flow / Pipeline

**Expresses:** sequential workflow, pipeline stages.

**Accessibility:** B — spatial layout hard to linearize.

**When NOT to use:** Don't use for non-sequential data. Don't use for more than 8-10 steps.

**Settings:** `labelField`, `valueField`, `statusField`, `palette`, `showArrows`, `themeMode`

**Data contract:** requires label + value, optional status. Multi-row.

### Donut / Ring

**Expresses:** part-to-whole composition.

**Accessibility:** C — color-only segments. MUST show legend with values.

**When NOT to use:** Don't use for more than 6 segments. Don't default to donut when unsure — it's the most overused AI viz choice.

**Settings:** `categoryField`, `valueField`, `innerRadius`, `showLegend`, `showTotal`, `colors`, `themeMode`

**Data contract:** category + value. Multi-row.

### Heat Grid / Matrix

**Expresses:** two-dimensional patterns. Time x category, host x metric.

**Accessibility:** B — color intensity encoding. Show values on hover AND optionally as text.

**When NOT to use:** Don't use for single-dimension data (use bar). Works best with 5+ rows AND 5+ columns.

**Settings:** `rowField`, `colField`, `valueField`, `lowColor`, `highColor`, `showValues`, `cellRadius`, `themeMode`

**Data contract:** row label, column label, numeric value. Multi-row.

### Spark Strip

**Expresses:** compact multi-metric overview with trends.

**Accessibility:** B — tiny trend lines decorative for screen readers.

**When NOT to use:** Don't use for more than 8 metrics. If trends don't matter, use KPI tiles.

**Settings:** `metrics` (CSV), `labels` (CSV), `sparkHeight`, `showValue`, `colors`, `themeMode`

**Data contract:** time series with multiple value columns. Multi-row.

### Radar / Spider Chart

**Expresses:** multi-dimensional profile comparison.

**Accessibility:** C — complex spatial encoding.

**When NOT to use:** Don't use for more than 8 axes. Don't use for time-series.

**Settings:** `fields` (CSV), `labels` (CSV), `maxValue`, `fillOpacity`, `showGrid`, `colors`, `themeMode`

**Data contract:** one row per entity, one column per dimension.

### Needle Gauge (Speedometer)

**Expresses:** physical instrument reading. More dramatic than ring gauge.

**Accessibility:** AA — physical metaphor intuitive. Numeric value provides text fallback.

**When NOT to use:** Don't use 3+ needle gauges in a row.

**Settings:** `field`, `maxValue`, `zones` (CSV), `zoneColors` (CSV), `label`, `unit`, `themeMode`

**Data contract:** single numeric value.

### Status Matrix / Health Grid

**Expresses:** bird's-eye status of 50-200 entities. Like a datacenter LED board.

**Accessibility:** B — dense color grid. Provide summary counts.

**When NOT to use:** Don't use for less than 10 entities (use status chips).

**Settings:** `nameField`, `statusField`, `columns`, `cellSize`, `showLabels`, `statusColors`, `themeMode`

**Data contract:** name + status field. Multi-row.

### Waterfall Chart

**Expresses:** additive/subtractive bridge between start and end values.

**Accessibility:** AA — bar-based with value labels.

**When NOT to use:** Don't use when there's no additive relationship.

**Settings:** `categoryField`, `valueField`, `positiveColor`, `negativeColor`, `totalColor`, `showConnectors`, `showValues`, `themeMode`

**Data contract:** category + value. Multi-row.

### Horizontal Bar List

**Expresses:** simple ranked comparison with labels.

**Accessibility:** AAA — linear, text-heavy, inherently accessible.

**When NOT to use:** Don't use for time-series (use line/area).

**Settings:** `labelField`, `valueField`, `maxBars`, `barColor`, `showValues`, `unit`, `themeMode`

**Data contract:** label + value. Multi-row sorted by value.

### Data Table (Canvas)

**Expresses:** sortable, paginated detail data with branding.

**Accessibility:** AA — tabular with headers.

**When NOT to use:** Don't use when only 1-2 fields needed (use KPI).

**MUST-HAVE features:** Sort (click header, toggle asc/desc), pagination (page N of M with nav), columns fill panel width proportionally.

**Settings:** `columns` (CSV), `defaultSortColumn`, `defaultSortDirection`, `rowsPerPage`, `showPosition`, `themeMode`

**Data contract:** multi-column, multi-row. Field names from formatter.

---

**Viz variety rule:** aim for 3+ distinct viz types per dashboard.
