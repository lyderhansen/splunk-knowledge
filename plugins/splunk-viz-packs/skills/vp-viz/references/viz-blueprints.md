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
- Line Chart
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

### Animation settings

Every viz type includes these animation controls. Add them to the formatter Animation section (see formatter-patterns.md):

- **showEntrance** (ON by default, D-02): Entrance animation style varies by viz type — arc fill for gauges, bar growth for bars, count-up for KPIs, fade-in/stagger for tables and leaderboards.
- **flashCritical** (OFF by default, D-06): LED pulse (shadowBlur 4-12px, 700ms cadence) on critical values. Opt-in only to prevent alarm fatigue. Recommended for status-bearing vizs; Claude may add to any type based on brand personality.
- **showHoverEffect** (ON by default, D-10): Eased row/segment highlight with accent-tinted fill. Functional feedback, stays on even with prefers-reduced-motion.
- **animationSpeed** (normal by default, D-13): Three-tier multiplier — slow=1.5x, normal=1.0x, fast=0.6x applied to all durations.

Note: `flashCritical` CAN be added to any viz type based on brand personality — the status-bearing types below mark it as the default recommendation, but Claude has discretion.

### Single Value Tile (KPI)

**Expresses:** the single most important number. Hero metric.

**Accessibility:** AAA — single number, inherently accessible. Add aria-label on canvas with the value.

**When NOT to use:** Don't use for values that need comparison context (use bar/column), for time-series trends (use area/line), or when you have more than 1 value per panel.

**Technical rules:**
- String passthrough for non-numeric values like "1:21.584", "+3.2s", "DNS"
- Use additive Y positioning for label-value-trend stack
- All sizes scale from container: `Math.max(floor, h * ratio)`

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
- DPR-09 (gradient mesh) — Futuristic/Luxury mood background
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Creative decisions YOU make:**
- Value font weight (condensed, expanded, standard)
- Label placement (above, below, beside)
- Trend indicator (arrow, dot, sparkline, percentage badge)
- Background treatment (flat, gradient, accent glow, texture)
- Unit styling relative to value (smaller? dimmer? superscript?)

**Settings:** `valueField`, `labelField`, `unit`, `unitPosition`, `textPlacement`, `sparkPlacement`, `sparkHeight`, `decimals`, `showDelta`, `deltaField`, `showGlow`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

`textPlacement` controls the label-value-trend stack position within the panel. center=vertically and horizontally centered (default). top=anchored to top with breathing room below. left=left-aligned with value. right=right-aligned. Claude should choose the default that best fits the brand personality.

`sparkPlacement` controls where the trend sparkline renders relative to the hero value: bottom (default, horizontal strip below value), right (vertical strip beside value), background (full-panel-width subtle area fill behind the value). `sparkHeight` is a percentage of panel height (10-50, default 25).

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

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
- DPR-09 (gradient mesh) — Futuristic mood gauge backgrounds
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Creative decisions YOU make:**
- Sweep angle (180, 270, 360, asymmetric)
- Track style (hairline, thick band, dashed, invisible)
- Fill style (solid, gradient along arc, segmented, neon glow)
- Center content (big number, label + number, icon, empty)
- Cap style (round, butt, arrow tip)
- Whether arc has drop shadow, glow, or bevel

**Settings:** `field`, `maxValue`, `unit`, `label`, `showTicks`, `showGlow`, `displayMode`, `themeMode`, `accentColor`, `accentIntensity`, `zoneLow` (threshold where red→amber), `zoneHigh` (threshold where amber→green), `detractorColor`, `passiveColor`, `promoterColor`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

Zone thresholds and zone colors MUST be independently configurable — never hardcode boundaries like 0-30/31-60/61-100 or use only theme severity colors.

**Data contract:** configurable numeric field (default: `value`). Reads last row.

### Status Chip / Badge

**Expresses:** categorical status — OK/warning/critical, active/inactive.

**Accessibility:** AA — text label provides meaning beyond color.

**When NOT to use:** Don't use for continuous values (use gauge). Don't use for more than 6-8 statuses.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `statusField`, `labelField`, `criticalLabel`, `warningLabel`, `okLabel`, `statusOkValues`, `statusWarnValues`, `statusCritValues`, `showGlow`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

Status matching: compare the statusField value against each comma-separated list (case-insensitive). This allows any SPL output (e.g. 'degraded', 'maintenance', '1', '2', '3') to map to the three status tiers. Unmatched values render as neutral/informational.

**Data contract:** requires severity field and label field. Reads last row.

### Live Ticker

**Expresses:** real-time event feed, breaking news feel, continuous activity.

**Accessibility:** B — scrolling content hard for screen readers.

**When NOT to use:** Don't use for historical analysis (use table). Don't use on print/PDF dashboards.

**Technical rules:**
- Animation timers MUST be cleaned up in `destroy()`
- Edge fade gradients prevent text clipping

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `title`, `scrollSpeed`, `field1`, `field2`, `field3`, `field4`, `label1`, `label2`, `label3`, `label4`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

**Data contract:** requires `_time` + 1-4 configurable fields. Multi-row.

### Leaderboard

**Expresses:** ranked competition, top-N, performance standings.

**Accessibility:** AA — text-based, inherently readable.

**When NOT to use:** Don't use for unranked data (use table). If only 2-3 entries, use KPI strip.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
- DPR-06 (glass panel) — Luxury mood row highlight
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `title`, `maxRows`, `showPagination`, `showHeaders`, `scoreDigits`, `rankField`, `nameField`, `scoreField`, `showGlow`, `showMedals`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

Pagination: when showPagination is ON and row count exceeds maxRows, draw prev/next page controls at the bottom. Store _currentPage on this. Calculate totalPages as Math.ceil(rows.length / maxRows). Draw 'Page N of M' with clickable arrows.

`showHeaders` controls whether the column header row (rank/name/score labels) is visible. Useful for compact dashboard panels where the leaderboard meaning is obvious from context.

**Data contract:** requires rank, name, score fields. Multi-row.

### Process Flow / Pipeline

**Expresses:** sequential workflow, pipeline stages.

**Accessibility:** B — spatial layout hard to linearize.

**When NOT to use:** Don't use for non-sequential data. Don't use for more than 8-10 steps.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `labelField`, `valueField`, `statusField`, `palette`, `showArrows`, `showValues`, `showGlow`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

**Data contract:** requires label + value, optional status. Multi-row.

### Donut / Ring

**Expresses:** part-to-whole composition.

**Accessibility:** C — color-only segments. MUST show legend with values.

**When NOT to use:** Don't use for more than 6 segments. Don't default to donut when unsure — it's the most overused AI viz choice.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `categoryField`, `valueField`, `innerRadius`, `showLegend`, `showTotal`, `showGlow`, `colors`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

**Data contract:** category + value. Multi-row.

### Heat Grid / Matrix

**Expresses:** two-dimensional patterns. Time x category, host x metric.

**Accessibility:** B — color intensity encoding. Show values on hover AND optionally as text.

**When NOT to use:** Don't use for single-dimension data (use bar). Works best with 5+ rows AND 5+ columns.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `rowField`, `colField`, `valueField`, `lowColor`, `highColor`, `showValues`, `cellRadius`, `showGlow`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

**Data contract:** row label, column label, numeric value. Multi-row.

### Spark Strip

**Expresses:** compact multi-metric overview with trends.

**Accessibility:** B — tiny trend lines decorative for screen readers.

**When NOT to use:** Don't use for more than 8 metrics. If trends don't matter, use KPI tiles.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `metrics`, `labels`, `sparkHeight`, `sparkMode`, `showValue`, `showArea`, `showGlow`, `colors`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

`sparkMode`: line draws a simple polyline trend; area fills below the line with a gradient. Default is line.

**Data contract:** time series with multiple value columns. Multi-row.

### Line Chart

**Expresses:** time-series trend, single or multi-metric over time.

**Accessibility:** AA — line encoding with value labels.

**When NOT to use:** Don't use for single data points (use KPI). Don't use for non-temporal categorical comparison (use bar).

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — fill area under line uses createLinearGradient
- DPR-10 (accent lines) — Precision mood decorative elements
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `lineField`, `xField`, `lineColor`, `showFill`, `showDots`, `lineWidth`, `unit`, `thresholdValue`, `thresholdColor`, `themeMode`, `accentColor`, `accentIntensity`, `showEntrance`, `showHoverEffect`, `animationSpeed`

**Data contract:** time-series rows. `xField` (default `_time`), `lineField` (configurable value). Multi-row.

### Radar / Spider Chart

**Expresses:** multi-dimensional profile comparison.

**Accessibility:** C — complex spatial encoding.

**When NOT to use:** Don't use for more than 8 axes. Don't use for time-series.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `fields`, `labels`, `maxValue`, `fillOpacity`, `showGrid`, `showGlow`, `colors`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

**Data contract:** one row per entity, one column per dimension.

### Needle Gauge (Speedometer)

**Expresses:** physical instrument reading. More dramatic than ring gauge.

**Accessibility:** AA — physical metaphor intuitive. Numeric value provides text fallback.

**When NOT to use:** Don't use 3+ needle gauges in a row.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `field`, `maxValue`, `minValue`, `zones`, `zoneColors`, `label`, `unit`, `showGlow`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

**Data contract:** single numeric value.

### Status Matrix / Health Grid

**Expresses:** bird's-eye status of 50-200 entities. Like a datacenter LED board.

**Accessibility:** B — dense color grid. Provide summary counts.

**When NOT to use:** Don't use for less than 10 entities (use status chips).

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
- DPR-05 (vignette) — dark theme status grids benefit from edge darkening
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `nameField`, `statusField`, `columns`, `cellSize`, `showLabels`, `showCellLabels`, `showCounts`, `statusColors`, `statusOkValues`, `statusWarnValues`, `statusCritValues`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

`showCellLabels` controls the value text rendered inside each grid cell. When OFF, cells show color-only status indicators (useful for dense 100+ entity grids).

Status matching: compare the statusField value against each comma-separated list (case-insensitive). This allows any SPL output (e.g. 'degraded', 'maintenance', '1', '2', '3') to map to the three status tiers. Unmatched values render as neutral/informational.

**Data contract:** name + status field. Multi-row.

### Waterfall Chart

**Expresses:** additive/subtractive bridge between start and end values.

**Accessibility:** AA — bar-based with value labels.

**When NOT to use:** Don't use when there's no additive relationship.

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `categoryField`, `valueField`, `positiveColor`, `negativeColor`, `totalColor`, `showConnectors`, `showValues`, `showGlow`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

**Data contract:** category + value. Multi-row.

### Horizontal Bar List

**Expresses:** simple ranked comparison with labels.

**Accessibility:** AAA — linear, text-heavy, inherently accessible.

**When NOT to use:** Don't use for time-series (use line/area).

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
- DPR-10 (accent lines) — Precision mood decorative elements
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**Settings:** `labelField`, `valueField`, `maxBars`, `showValues`, `unit`, `showGlow`, `barColor`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

**Data contract:** label + value. Multi-row sorted by value.

### Data Table (Canvas)

**Expresses:** sortable, paginated detail data with branding.

**Accessibility:** AA — tabular with headers.

**When NOT to use:** Don't use when only 1-2 fields needed (use KPI).

**Design rules:** See [design-principles.md](../../vp-design/references/design-principles.md)
- DPR-01 (typography hierarchy) — hero/body/whisper 3-tier sizing
- DPR-03 (gradient fills) — all data elements use createLinearGradient
- DPR-05 (vignette) — dark theme tables benefit from edge darkening
**Consistency:** `theme.getSpacing(w)` for padding/gaps; `theme.getTypoScale(w,h)` for font sizes.

**MUST-HAVE features (non-negotiable):**

1. **Sort ALL columns** — click any column header to sort asc/desc. Draw sort indicator (triangle) next to active column. Store `_sortCol` and `_sortDir` on `this`.

2. **Pagination** — calculate visible rows from panel height. Draw page nav at bottom: "Page 1 of N  < >" with click handlers. Store `_currentPage`. Formatter setting `maxRows` controls rows per page (default: auto-fit to panel height).

3. **Hide columns** — formatter setting `hiddenColumns` (CSV of column names to hide). Hidden columns are excluded from rendering but data is still available for sort/drilldown.

4. **Column widths** — formatter setting `columnWidths` (CSV of proportional widths, e.g. "2,1,1,3"). Default: distribute equally. Columns always fill full panel width — never fixed pixel widths.

5. **Header row** — always visible (sticky at top during scroll within page). Clickable for sort. Optional: `showHeader` toggle to hide entirely.

```javascript
// Pagination calculation
var headerH = Math.round(h * 0.08);
var footerH = 28;
var rowH = Math.max(20, Math.round((h - headerH - footerH) / 12));
var maxRows = parseInt(opt('maxRows', '0'), 10);
var rowsPerPage = maxRows > 0 ? maxRows : Math.floor((h - headerH - footerH) / rowH);
var totalPages = Math.ceil(rows.length / rowsPerPage);
var pageRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
```

**Settings:** `columns`, `hiddenColumns`, `columnWidths`, `defaultSortColumn`, `defaultSortDirection`, `maxRows`, `showHeader`, `showPosition`, `accentColor`, `accentIntensity`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

**Data contract:** multi-column, multi-row. Field names from formatter.

---

**Viz variety rule:** aim for 3+ distinct viz types per dashboard.
