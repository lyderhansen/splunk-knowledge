---
name: vp-viz
description: "Build a single custom Splunk visualization within a themed viz pack. Generates visualization_source.js (Canvas 2D), formatter.html (settings UI), visualization.css, harness.json, and preview.png specification. MUST load vp-ref-gotchas before writing any code. Every viz imports shared/theme.js for design tokens. Use when vp-couture has planned the viz suite and vp-create has scaffolded the app — this skill writes the per-viz source files."
---

# vp-viz — build one visualization

> **Cross-plugin rules apply:** Viz files go in `appserver/static/
> visualizations/` (F9). Dashboard JSON follows `ds-create` hard
> defaults. Load `vp-ref-gotchas` before writing ANY code.

## Critical: unique rendering per brand

**Do NOT copy viz source code between brands and swap colors.** Each
brand gets unique `_render()` code. A Red Bull speed gauge draws
segmented arcs with red zone markings and shift lights. A Disney+
subscriber gauge draws a smooth gradient ring with soft glow. They
share `theme.js` for color tokens but nothing else in the render path.

The blueprints below are STARTING POINTS for inspiration — not
templates to copy verbatim. Study the brand's real-world design
language, then write Canvas code that matches THAT, using theme tokens
for colors only.

**`drawPanel()` is optional.** Some brands want panel chrome (rounded
rects with borders). Others want panels flush with the background
(no chrome, no border). Define this in the design brief.

## CRITICAL: File paths — WRONG vs RIGHT

Viz files MUST be in `appserver/static/visualizations/`, NOT in
`default/visualizations/`. The wrong path causes REQUIREJS_ERROR_MESSAGE
for every viz with zero explanation in the console.

```
WRONG — viz won't load, REQUIREJS Script error:
  {pack}/default/visualizations/{viz_name}/visualization.js

RIGHT — Splunk finds and loads the viz:
  {pack}/appserver/static/visualizations/{viz_name}/visualization.js
```

Complete correct path for each file:
```
{pack}/appserver/static/visualizations/{viz_name}/
  src/visualization_source.js    ← source (excluded from tarball)
  visualization.js               ← webpack output (AMD bundle)
  formatter.html                 ← settings UI
  visualization.css              ← styles + optional base64 fonts
```

The `shared/theme.js` lives at `{pack}/shared/theme.js` (dev only —
webpack bundles it into each visualization.js via resolve alias).

## When to use

After `vp-create` has scaffolded the app directory and `shared/theme.js`
exists. This skill writes the files that make one viz work:

1. `appserver/static/visualizations/{viz}/src/visualization_source.js`
2. `appserver/static/visualizations/{viz}/formatter.html`
3. `appserver/static/visualizations/{viz}/visualization.css`

## Prerequisites

- **MUST load `vp-ref-gotchas`** before writing any code
- App directory exists at `examples/{pack_name}/`
- `shared/theme.js` exists with design tokens
- `_build/webpack.config.js` has this viz as an entry point

## Source file skeleton

Every `visualization_source.js` follows this exact structure. Do not
deviate from the lifecycle method signatures.

**CRITICAL:** Use `require()`/`module.exports`. NEVER use `define()` —
webpack's `libraryTarget:'amd'` adds the AMD wrapper automatically.
Using `define()` in source creates a double-wrapper that breaks
RequireJS (see vp-ref-gotchas F6).

**CRITICAL:** Use `SplunkVisualizationBase.extend({...})` object
literal. NEVER use prototypal constructor pattern — it silently
fails to register methods (see vp-ref-gotchas F7).

**CRITICAL:** NEVER hardcode font names in viz source code. All fonts
come from `theme.FONTS.data` (numbers, KPIs) and `theme.FONTS.ui`
(labels, headers). The font choice is a DESIGN decision driven by
brand mood — not a coding default. Use `theme.FONTS.*` everywhere:
`ctx.font`, tooltip styling, CSS strings.

```javascript
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ── Viz-specific helpers ────────────────────────────────────
// (import from theme.js or define here as top-level functions)

module.exports = SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(
            this, arguments
        );
        this.el.style.overflow = 'hidden';
        this.el.style.position = 'relative';

        var canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        this.el.appendChild(canvas);
        this.canvas = canvas;

        this._lastData = null;
        this._lastConfig = null;
        this._lastGoodData = null;

        // Tooltip (mandatory for data vizs — see vp-ref-gotchas I1)
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;';
        // NO hardcoded font-family or font-size here — set in _render()
        // from theme tokens so the tooltip matches the pack's brand
        this.el.appendChild(this._tooltip);

        this._hoverIdx = -1;
        this._hitRegions = [];

        var self = this;
        this.canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this.canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self.canvas.style.cursor = 'default';
            if (self._hoverIdx !== -1) {
                self._hoverIdx = -1;
                self._render(self._lastData, self._lastConfig);
            }
        });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) return this._lastGoodData;
            return data;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data) return;
        this._lastData = data;
        this._lastConfig = config;

        var self = this;
        theme.loadFonts(function() {
            self._render(data, config);
        });
    },

    // CRITICAL: Theme detection for ad-hoc search compatibility
    // In Dashboard Studio, theme comes from config (set by formatter).
    // In ad-hoc search (Classic UI), config has NO theme setting —
    // the viz must detect Splunk's page theme via getCurrentTheme().
    // Without this, dark-themed vizs render invisible on light backgrounds.
    _render: function(data, config) {
        var el = this.el;
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        if (w <= 0 || h <= 0) return;

        var dpr = window.devicePixelRatio || 1;
        var canvas = this.canvas;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);  // NEVER fillRect with t.bg (B13)

        var ns = theme.getNS(this);
        var themeName = theme.getOption(config, ns, 'theme', '');
        if (!themeName) {
            try { themeName = SplunkVisualizationUtils.getCurrentTheme(); } catch(e) {}
        }
        if (!themeName) themeName = 'dark';
        var t = theme.getTheme(themeName);
        var accentColor = theme.getOption(config, ns, 'accentColor', '#0088CC');
        var gi = theme.parseNum(
            theme.getOption(config, ns, 'accentIntensity', '50'), 50
        ) / 50;
        this._gi = gi; // accessible from sub-methods (B14)

        // Style tooltip from theme tokens (not hardcoded)
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edgeStrong;
        this._tooltip.style.fontFamily = theme.FONTS.data;
        this._tooltip.style.fontSize = '11px';

        // ── DRAW HERE ───────────────────────────────────────
        // All coordinates use w, h (CSS pixels)
        // All colors from t (theme tokens)
        // All fonts from theme.FONTS.data / theme.FONTS.ui
        // All settings via theme.getOption(config, ns, 'key', 'default')
        // All glow/accent effects multiplied by gi
    },

    _onMouseMove: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);
        if (hit !== null) {
            var region = this._hitRegions[hit];
            this._tooltip.innerHTML = region.tip;
            this._tooltip.style.display = 'block';
            var tx = mx + 14;
            var ty = my - 10;
            if (tx + 180 > this.el.offsetWidth) tx = mx - 180;
            if (ty < 0) ty = my + 20;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this.canvas.style.cursor = 'pointer';
            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
            this.canvas.style.cursor = 'default';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w &&
                my >= r.y && my <= r.y + r.h) {
                return i;
            }
        }
        return null;
    },

    reflow: function() {
        if (this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(
            this, arguments
        );
    }
});
```

## Viz type blueprints — inspiration, not templates

> 🔒 = Non-negotiable technical rule (breaks if violated)
> 🎨 = Creative starting point (adapt, reimagine, surprise)

These blueprints show WHAT each viz type expresses and what settings
to expose. They are NOT templates to copy verbatim. Study the brand's
real-world design language, then write Canvas code that matches THAT.

**The agent's job:** take the data contract + expression intent below,
then design a rendering that looks like a graphic designer made it for
THIS specific brand. Two KPI tiles for different brands should look
completely different — same data, different soul.

### Single Value Tile (KPI)

**Expresses:** the single most important number. Hero metric. At-a-glance status.

**Accessibility:** AAA — single number, inherently accessible. Add aria-label on canvas with the value.

**When NOT to use:** Don't use for values that need comparison context
(use bar/column), for time-series trends (use area/line), or when you
have more than 1 value to show per panel (use table or multi-KPI layout).
If the number alone doesn't tell the story, a KPI tile is hiding information.

**🔒 Technical rules:**
- String passthrough for non-numeric values like `"1:21.584"`, `"+3.2s"`, `"DNS"` (B11)
- Use additive Y positioning for label→value→trend stack, not percentage-of-height
- All sizes scale from container: `Math.max(floor, h * ratio)` (B8)

**🎨 Creative decisions YOU make:**
- Value font weight and whether it's condensed, expanded, or standard
- Whether the label sits above, below, or beside the value
- Trend indicator style: arrow, colored dot, sparkline, percentage badge, or nothing
- Background treatment: flat, subtle gradient, accent glow behind value, carbon texture
- Whether there's a thin accent line, border, or divider element
- How the unit is styled relative to the value (smaller? dimmer? superscript?)
- Whether hero mode blows up the number to fill 80% of the panel or keeps it centered

**Visual references beyond Splunk:** Bloomberg terminal tiles, Tesla dashboard readouts,
F1 timing tower cells, Apple Health cards, Stripe dashboard KPIs.

**Settings:** `field`, `label`, `unit`, `unitPosition`, `decimals`,
`showDelta`, `deltaField`, `accentColor`, `theme`

**Data contract:** configurable field (default: `value`). Reads last
row. Optional: `delta` field for trend arrow.

### Ring Gauge

**Expresses:** progress toward a target, fill level, health percentage.

**Accessibility:** AA — arc encoding needs numeric readout in center. Colorblind-safe if value text is always visible.

**When NOT to use:** Don't use for values without a known max (use KPI
tile). Don't use for multi-category comparison (use bar). Don't use 5
identical gauges in a row — that's AI-lazy. Mix gauge types or combine
with other vizs for rhythm.

**🔒 Technical rules:**
- Arc angles are radians: full circle = 0→2π, 270° sweep = 0.75π→2.25π
- Brand-colored segments, NOT default green→yellow→red (B12)
- All sizes relative to `Math.min(w, h)` (B8)

**🎨 Creative decisions YOU make:**
- Sweep angle: 180° (half), 270° (classic), 360° (full donut), or asymmetric
- Track style: thin hairline, thick band, dashed, dotted, or invisible
- Fill style: solid color, gradient along arc, segmented blocks, or neon glow
- Center content: big number, label + number, icon, mini chart, or empty
- Tick marks: none, every 10%, major+minor, or just endpoints
- Cap style: round, butt, or arrow tip
- Whether the arc has a drop shadow, outer glow, or inner bevel
- Whether zones pulse, animate, or stay static
- Needle vs fill: some gauges work better with a physical needle than a filled arc

**Visual references:** car speedometer, aircraft altimeter, Nest thermostat,
Apple Watch activity rings, industrial pressure gauge, gaming health bar.

**Settings:** `field`, `maxValue`, `unit`, `label`, `colorScheme`,
`showTicks`, `showGlow`, `displayMode` (arc/donut/bar), `theme`

**Data contract:** configurable numeric field (default: `value`). Reads last row.

### Status Chip / Badge

**Expresses:** categorical status at a glance — OK/warning/critical, active/inactive.

**Accessibility:** AA — text label provides meaning beyond color. Ensure 4.5:1 contrast on chip fill.

**When NOT to use:** Don't use for continuous values (use gauge). Don't
use when there are more than 6-8 statuses — the colors become meaningless.
If the status needs explanation, pair with a tooltip or legend.

**🎨 Creative decisions YOU make:**
- Shape: pill (full radius), rounded rect, circle, diamond, hexagon
- Fill: solid, gradient, semi-transparent with border, or outline-only
- Text: centered label, icon + label, icon only, or abbreviated code
- Size: fixed or proportional to label length
- Animation: subtle pulse on critical, breathing glow, or static
- Whether the chip has a shadow, border, or sits flush

**Settings:** `field`, `labelField`, `theme`

**Data contract:** requires severity-like field (critical/warning/ok)
and label field. Reads last row.

### Live Ticker

**Expresses:** real-time event feed, breaking news feel, continuous activity stream.

**Accessibility:** B — scrolling content is hard for screen readers. Provide pause button and aria-live region.

**When NOT to use:** Don't use for historical analysis (use table or
timeline). Don't use when the user needs to click/interact with entries
(scrolling defeats interaction). Don't use on print/PDF dashboards.

**🔒 Technical rules:**
- Animation timers MUST be cleaned up in `destroy()` (C5)
- Edge fade gradients prevent text from clipping at panel edges

**🎨 Creative decisions YOU make:**
- Scroll direction: left-to-right, right-to-left, or vertical upward
- Entry style: cards, pills, inline text with separators, or LED-board characters
- Speed: configurable via formatter, adaptive to entry count
- Edge treatment: gradient fade, hard clip, or parallax depth blur
- LIVE badge: pulsing dot, blinking text, animated ring, or none
- Time display: relative ("2m ago"), absolute, or countdown
- Whether entries have category icons, severity colors, or priority markers

**Visual references:** stock ticker, CNN breaking news crawl, airport
departure board, Twitch chat overlay, F1 live timing feed.

**Settings:** `title`, `scrollSpeed`, `field1`–`field4`, `label1`–`label4`,
`bgColor`, `textColor`, `accentColor`, `theme`

**Data contract:** requires `_time` + 1-4 configurable fields. Multi-row.

### Leaderboard

**Expresses:** ranked competition, top-N, performance standings, gamification.

**Accessibility:** AA — text-based, inherently readable. Use position numbers, not color-only ranking.

**When NOT to use:** Don't use for unranked data (use table). Don't use
for time-series (use chart). If there are only 2-3 entries, a KPI strip
is more impactful than a short leaderboard.

**🎨 Creative decisions YOU make:**
- Position badges: gold/silver/bronze medals, numbered circles, flag icons, or plain text
- Row treatment: alternating opacity, hover highlight, selected glow
- Score display: leading zeros (007), decimal precision, bar fill, or sparkline
- Whether top 3 have special treatment (larger, glowing, different background)
- Table chrome: gridlines, row separators, none, or just header underline
- Visual effects: CRT scanlines, neon glow, holographic sheen, or clean flat
- Whether there's a "you are here" marker for the user's own entry

**Visual references:** F1 timing tower, gaming leaderboards, Strava segments,
GitHub contributor graphs, arcade high-score screens.

**Settings:** `title`, `maxRows`, `scoreDigits`, `rankField`, `nameField`,
`scoreField`, `titleColor`, `showScanlines`, `showGlow`, `theme`

**Data contract:** requires rank, name, score fields (configurable). Multi-row.

### Process Flow / Pipeline

**Expresses:** sequential workflow, pipeline stages, connected process steps.

**Accessibility:** B — spatial layout hard to linearize. Provide text summary of flow state.

**When NOT to use:** Don't use for non-sequential data (use heat grid
or radar). Don't use for more than 8-10 steps — it becomes unreadable.
If steps don't have a clear order, use a status matrix instead.

**🎨 Creative decisions YOU make:**
- Node shape: circles, rounded rects, hexagons, chevrons, or custom icons
- Connection style: straight lines, curved bezier, arrows, animated dashes, or gradient flow
- Layout: horizontal left-to-right, vertical top-to-bottom, or circular
- Status encoding: fill color, border color, icon overlay, or pulsing animation
- Whether nodes have embedded sparklines, progress bars, or mini values
- Spacing: uniform, proportional to duration, or clustered by phase
- Whether failed/blocked nodes have a distinct visual treatment (crossed out, red border, dimmed)

**Visual references:** CI/CD pipeline views (GitHub Actions, GitLab),
JIRA workflow boards, subway maps, network topology diagrams.

**Settings:** `labelField`, `valueField`, `statusField`, `sparklineField`,
`palette`, `showArrows`, `nodeRadius`, `theme`

**Data contract:** requires label + value fields, optional status and sparkline. Multi-row.

### Donut / Ring

**Draws:** part-to-whole donut with right-side legend. Center label
shows total. Segments colored from theme palette.

**Accessibility:** C — color-only segment differentiation. MUST show legend with values + percentage labels on segments.

**When NOT to use:** Don't use for more than 6 segments (use bar chart).
Don't use for time-series (use area). Don't use for comparison across
groups (use grouped bars). Don't default to donut when unsure — it's the
most overused AI viz choice. Ask: "does part-of-whole actually matter here?"

**Settings:** `categoryField`, `valueField`, `innerRadius`,
`showLegend`, `showTotal`, `colors` (comma-separated), `theme`

**Data contract:** requires category + value fields. Multi-row input.

### Heat Grid / Matrix

**Draws:** rows × columns grid where each cell is colored by value
intensity. Time × category, host × metric, hour × day-of-week.
Like a GitHub contribution graph or a security incident heatmap.

**Key elements:** cell rectangles with lerpColor from low→high,
row/column labels, hover tooltip per cell, optional cell value text.

**Accessibility:** B — color intensity encoding. Show cell values on hover AND optionally as text overlay. Use sequential (not diverging) palette for colorblind safety.

**When NOT to use:** Don't use for single-dimension data (use bar). Don't
use when exact values matter more than patterns (use table). Works best
with 5+ rows AND 5+ columns — below that, use individual KPI tiles.

**Settings:** `rowField`, `colField`, `valueField`, `lowColor`,
`highColor`, `showValues`, `cellRadius`, `theme`

**Data contract:** row label, column label, numeric value. Multi-row.

### Spark Strip

**Draws:** horizontal row of mini sparkline areas, one per metric.
Each spark has a label, current value, and micro trend line. Compact
way to show 4-8 metrics with trend in a small vertical space.

**Key elements:** per-metric: label (whisper), value (body), tiny
area fill below a polyline. All sparks same height, stacked vertically
or in a row.

**Accessibility:** B — tiny trend lines are decorative for screen readers. Pair with numeric current value.

**When NOT to use:** Don't use when the user needs to read exact values
(use table with sparkline columns). Don't use for more than 8 metrics
— it becomes a wall of squiggles. If trends don't matter, use KPI tiles.

**Settings:** `metrics` (CSV field names), `labels` (CSV), `sparkHeight`,
`showValue`, `colors`, `theme`

**Data contract:** time series with multiple value columns. Multi-row.

### Radar / Spider Chart

**Draws:** multi-axis polygon on a radial grid. Each axis represents
a dimension (performance, security, reliability, etc). The filled
polygon shows how the entity scores on each. Great for comparing
profiles (e.g., server health across 5 dimensions).

**Key elements:** radial grid lines, axis labels at each point,
filled polygon with semi-transparent fill, optional second polygon
for comparison, center origin at 0.

**Accessibility:** C — complex spatial encoding. Provide tabular fallback or summary text. Low priority for accessibility.

**When NOT to use:** Don't use for more than 8 axes (becomes unreadable).
Don't use for time-series data. Don't use when one dimension dominates
— the polygon collapses to a spike. Best for comparing profiles across
3-7 balanced dimensions.

**Settings:** `fields` (CSV of dimension fields), `labels` (CSV),
`maxValue`, `fillOpacity`, `showGrid`, `showComparison`, `colors`, `theme`

**Data contract:** one row per entity, one column per dimension.

### Needle Gauge (Speedometer)

**Draws:** semicircular dial with a physical needle pointing to the
current value. Tick marks around the arc, colored zones (blue→gold→red).
More dramatic than ring gauge — feels like a real instrument.

**Key elements:** arc background with zone coloring, tick marks with
numbers, needle drawn as a triangle from center, center cap circle,
value text below.

**Accessibility:** AA — physical metaphor is intuitive. Numeric value in center provides text fallback.

**When NOT to use:** Don't use for values without physical-instrument
metaphor (use ring gauge or KPI). Don't use 3+ needle gauges in a row
— one dramatic gauge is impactful, three is a car dashboard cliché.

**Settings:** `field`, `maxValue`, `zones` (CSV of zone boundaries),
`zoneColors` (CSV), `label`, `unit`, `theme`

**Data contract:** single numeric value.

### Status Matrix / Health Grid

**Draws:** grid of colored squares/dots, each representing a service
or host. Color = status (green/amber/red/grey). Compact way to show
50-200 entities at a glance. Like a datacenter floor LED board.

**Key elements:** grid of rounded squares with status color, label
below each (truncated), hover tooltip with details, optional grouping
headers.

**Accessibility:** B — dense color grid. Provide summary counts (X critical, Y warning, Z ok) and per-entity tooltip.

**When NOT to use:** Don't use for less than 10 entities (use status
chips). Don't use when individual entity details matter (use table).
Best for bird's-eye-view of 20-200 entities where pattern matters more
than individual values.

**Settings:** `nameField`, `statusField`, `columns`, `cellSize`,
`showLabels`, `statusColors` (CSV), `theme`

**Data contract:** name + status field. Multi-row (one per entity).

### Waterfall Chart

**Draws:** bars that show how an initial value is increased or
decreased by successive categories — visualizes the "bridge" between
start and end. Positive deltas go up (green), negative go down (red),
totals are neutral.

**Key elements:** floating bars connected by thin lines, positive
bars above the running total, negative bars below, total bar at end,
value labels on each bar.

**Accessibility:** AA — bar-based, value labels on each bar provide text fallback. Use distinct patterns for positive/negative.

**When NOT to use:** Don't use when there's no additive/subtractive
relationship between values (use bar). Don't use for time-series (use
area). Best for budget/P&L walkthroughs where you need to see how each
category contributes to the total change.

**Settings:** `categoryField`, `valueField`, `positiveColor`,
`negativeColor`, `totalColor`, `showConnectors`, `showValues`, `theme`

**Data contract:** category + value. Multi-row. First and last row
can be totals.

### Horizontal Bar List

**Draws:** simple ranked horizontal bars with labels left, values
right, bar fill proportional to value. Clean alternative to
splunk.bar when you want minimal chrome and brand-specific styling.

**Key elements:** label (left-aligned), bar fill (proportional width),
value text (right-aligned), optional delta indicator, hover highlight.

**Accessibility:** AAA — linear, text-heavy, inherently accessible. Value labels always visible.

**When NOT to use:** Don't use for time-series (use line/area). Don't use
when exact ranking position matters (use leaderboard). Best for top-N with
long category labels that would clip in a column chart.

**Settings:** `labelField`, `valueField`, `maxBars`, `barColor`,
`showValues`, `unit`, `theme`

**Data contract:** label + value. Multi-row sorted by value.

### Data Table (Canvas)

**Draws:** sortable, paginated rows with configurable columns, header
row with sort indicators, colored deltas, position badges. Unlike
splunk.table, this is fully branded via Canvas 2D.

**Accessibility:** AA — tabular data with headers. Ensure keyboard navigation for sort. Consider aria-label on canvas summarizing row count.

**MUST-HAVE features (not optional):**

**When NOT to use:** Don't use when only 1-2 fields are needed (use KPI
tile or leaderboard). Don't use for aggregated single-value data. Tables
are for detail data — if you're showing `| stats count by src`, a bar
chart tells the story faster.

**Sort:** Click column header → sort rows by that column (toggle asc/desc).
Draw sort indicator (▲/▼) next to active column. Store `this._sortCol`
and `this._sortDir`. Hit-test header row in `_onMouseDown`.
```javascript
// In initialize():
this._sortCol = null;
this._sortDir = 'asc';
this.canvas.addEventListener('mousedown', function(e) { self._onMouseDown(e); });

// In _onMouseDown: hit-test header cells
_onMouseDown: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    if (my < this._headerH) {
        var col = this._hitTestHeader(mx);
        if (col !== null) {
            if (this._sortCol === col) {
                this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                this._sortCol = col;
                this._sortDir = 'asc';
            }
            this._render(this._lastData, this._lastConfig);
        }
    }
},
```

**Pagination:** Calculate visible rows from panel height. Draw page
navigation at bottom: "Page 1 of N  ‹ ›". Store `this._currentPage`.
```javascript
var headerH = Math.round(h * 0.08);
var footerH = 28;
var rowH = Math.max(20, Math.round((h - headerH - footerH) / 12));
var rowsPerPage = Math.floor((h - headerH - footerH) / rowH);
var totalPages = Math.ceil(rows.length / rowsPerPage);
var pageRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
```

**Fill panel width:** columns distribute proportionally across the full
panel width. Last column gets remaining space. Never fixed-pixel widths.

**Settings:** `columns` (CSV field names), `defaultSortColumn`,
`defaultSortDirection`, `rowsPerPage` (auto or number), `showPosition`,
`bestColor`, `improvedColor`, `slowerColor`, `theme`

**Data contract:** multi-column, multi-row. Field names from formatter
settings.

---

**Viz variety rule:** a dashboard with 5 vizs of the same type (all
donuts, all gauges) lacks visual rhythm. Aim for 3+ distinct viz
types per dashboard. The taxonomy above gives you options beyond the
usual KPI/gauge/donut/table set.

## Formatter HTML template

**CRITICAL: Splunk components ONLY — no raw HTML (F12)**

Splunk's viz framework ignores raw HTML. NEVER use `<div>`, `<input>`,
`<select>`, `<label>`, `<h3>`, or `<style>`. ONLY use:
- `<form class="splunk-formatter-section">` as wrapper
- `<splunk-control-group>` for each setting
- `<splunk-text-input>`, `<splunk-radio-input>`, `<splunk-color-picker>` as controls

No `<html>`, `<body>`, or `<head>` wrappers. No CSS. No JavaScript.

```html
<form class="splunk-formatter-section" section-label="Data configurations">
    <splunk-control-group label="Value field" help="SPL field for the primary value">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.field" value="value">
        </splunk-text-input>
    </splunk-control-group>
</form>

<form class="splunk-formatter-section" section-label="Data display">
    <splunk-control-group label="Label" help="Text shown below the value">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.label" value="">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Unit" help="Unit suffix (%, ms, $)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.unit" value="">
        </splunk-text-input>
    </splunk-control-group>
</form>

<form class="splunk-formatter-section" section-label="Color and style">
    <splunk-control-group label="Theme" help="Auto detects page theme. Override for Dashboard Studio.">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.theme" value="">
            <option value="">Auto</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Accent color" help="Primary highlight color">
        <!-- Replace swatches with colors from the pack's theme palette. -->
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.accentColor"
            type="custom" value="#0088CC">
            <splunk-color>#0088CC</splunk-color>
            <splunk-color>#2bbfb8</splunk-color>
            <splunk-color>#ff6600</splunk-color>
            <splunk-color>#f73873</splunk-color>
            <splunk-color>#a78bfa</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
</form>
```

**Rules:**
- Section labels MUST be exact (see vp-ref-gotchas B5)
- Every control-group MUST have `help="..."` attribute
- JS defaults MUST match `value="..."` attributes (B7)
- Color picker swatches should come from the pack's theme palette

**Every visual property must be configurable (B15).** If `_render()`
uses a color, size, toggle, or position, it MUST have a formatter
setting. The complete minimum settings list:

```html
<!-- SECTION 1: Data configurations -->
<form class="splunk-formatter-section" section-label="Data configurations">
    <!-- field: which SPL field to read -->
    <!-- deltaField: trend delta field (if applicable) -->
    <!-- categoryField / valueField: for composition vizs -->
    <!-- maxRows: for table/list vizs -->
</form>

<!-- SECTION 2: Data display -->
<form class="splunk-formatter-section" section-label="Data display">
    <!-- label: text label -->
    <!-- labelPlacement: top / bottom / left / none -->
    <!-- unit: suffix or prefix -->
    <!-- unitPosition: before / after -->
    <!-- decimals: fixed decimal places (-1 = auto) -->
    <!-- showDelta: show trend arrow (true/false) -->
    <!-- showLegend / showReadout: for composition vizs -->
    <!-- showPosition: for ranked tables -->
    <!-- alignment: left / center / right -->
</form>

<!-- SECTION 3: Color and style -->
<form class="splunk-formatter-section" section-label="Color and style">
    <!-- theme: dark / light -->
    <!-- accentColor: primary highlight (color picker) -->
    <!-- colors: CSV hex for multi-series (text input) -->
    <!-- accentIntensity: glow/effect strength 0-100 -->
</form>

<!-- SECTION 4: Gauge settings (only for gauge vizs) -->
<form class="splunk-formatter-section" section-label="Gauge settings">
    <!-- maxValue: scale maximum -->
    <!-- redZoneStart: threshold for danger zone -->
    <!-- segments: number of arc segments -->
</form>
```

Add sections only when the viz genuinely needs them. A simple KPI
tile needs sections 1-3. A gauge adds section 4. Don't create
empty sections.

## visualization.css template

```css
.splunk-viz-container,
.splunk-viz-container > div {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
}
```

If the viz needs its own font (beyond what theme.js provides), add
base64 `@font-face` in this file. See vp-ref-gotchas F2.

## harness.json template

```json
{
    "fields": [
        {"name": "field1", "type": "string"},
        {"name": "field2", "type": "number"}
    ],
    "rows": [
        ["label", 42],
        ["label2", 78]
    ],
    "formatter": {
        "field": "field2",
        "label": "Demo",
        "theme": "dark"
    }
}
```

## Data flow

```
SPL → formatData (data only) → updateView (data + config)
                                    ↓
                               _render(data, config)
                                    ↓
                            Canvas 2D drawing
```

1. `formatData`: build column index, cache last good data, throw
   VisualizationError if no data
2. `updateView`: cache data+config, call `_render`
3. `_render`: measure container, setup HiDPI canvas, read config via
   getOption, get theme tokens, draw

## Writing a new viz — step by step

1. **Define the data contract** — which SPL fields, required vs optional
2. **Sketch the Canvas layout** — what goes where at different sizes
3. **Write `_render` body** — use theme tokens for all colors, auto-scale
   all sizes, read all settings via getOption
4. **Write `formatter.html`** — 3 sections, all defaults matching JS
5. **Write `harness.json`** — sample data that renders a representative
   state
6. **Test in browser** — open test-harness.html, verify resize, dark/light
7. **Build** — webpack, verify ES5, check bundle format
8. **Test in Splunk** — install app, verify in Studio + ad-hoc search

## Hover tooltip — mandatory on every data-displaying viz

See `vp-ref-gotchas` I1 and I2. Every viz that displays data MUST implement:

1. **DOM tooltip element** — created in `initialize`, positioned on
   `mousemove`, hidden on `mouseleave`
2. **Hit-test function** — `_hitTest(mx, my)` returns `{label, value}`
   or null
3. **Visual highlight** — hover state changes appearance (brighter row,
   crosshair line, segment stroke)
4. **Cleanup in destroy** — remove tooltip element, remove event
   listeners

The tooltip is a `<div>` appended to `this.el`, NOT drawn on Canvas
(Canvas can't do pointer-events:none or z-index above Studio chrome).

## Drilldown — click navigation from Canvas vizs

Custom vizs can fire drilldown events when the user clicks on a
data element (table row, gauge segment, chart point).

**In the viz source:**
```javascript
// In initialize():
this.canvas.addEventListener('click', function(e) {
    self._onClick(e);
});

// Click handler:
_onClick: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var hit = this._hitTest(mx, my);
    if (hit === null) return;
    var region = this._hitRegions[hit];
    try {
        this.drilldownToPayload({
            action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
            data: region.drilldownData
        });
    } catch (e) { /* parent frame may block */ }
},
```

**Hit region data format:**
```javascript
this._hitRegions.push({
    x: rx, y: ry, w: rw, h: rh,
    tip: 'Driver: Verstappen',
    drilldownData: { 'click.name': 'Driver', 'click.value': 'Verstappen' }
});
```

**In dashboard JSON — wire the event handler:**
```json
"viz_table": {
    "type": "mypack.data_table",
    "options": { ... },
    "eventHandlers": [
        {
            "type": "drilldown.setToken",
            "options": {
                "tokens": [
                    { "token": "selected", "value": "$click.value$" }
                ]
            }
        }
    ]
}
```

**Or navigate to another dashboard:**
```json
"eventHandlers": [
    {
        "type": "drilldown.linkToDashboard",
        "options": { "app": "search", "dashboard": "detail_view" }
    }
]
```

## Decimals setting — standard on all KPI/value vizs

Every viz that displays a formatted number MUST expose a `decimals`
formatter option:
- `-1` (default) = auto-compact via fmtNum
- `0` = integer
- `1`, `2`, `3` = fixed decimal places

```javascript
var decimals = parseInt(getOption(config, ns, 'decimals', '-1'), 10);
var displayValue;
if (isNaN(rawValue)) {
    displayValue = '—';
} else if (decimals >= 0) {
    displayValue = rawValue.toFixed(decimals);
} else {
    displayValue = theme.fmtNum(rawValue, { compact: true });
}
```

Without this, small values like 7.27 round to 7 and percentages like
3.8 round to 4.

## Common mistakes

| Mistake | Consequence | Fix |
|---|---|---|
| Hardcoded field names | Viz only works with exact SPL | Make configurable via formatter |
| Hardcoded pixel sizes | Breaks on resize | Auto-scale from container dimensions |
| Colors not from theme | Light mode broken | Use `t.text`, `t.bg`, etc. |
| Missing `count` in getInitialDataParams | Only 10 rows | Set `count: 50` (single) or `count: 10000` (multi) |
| `formatData` reads config | Stale cached values | Move to `updateView` |
| Font drawn before ready | Tofu glyphs forever | Poll with loadFont() |
| No `destroy()` cleanup | Memory leaks on nav | Clear timers, disconnect observers |

## Creative freedom — what the rules DON'T constrain

The rules in `vp-ref-gotchas` protect against TECHNICAL failure:
ES5 syntax, webpack config, outputMode, font CORS, AppInspect.
Those are NON-NEGOTIABLE.

**Everything else is yours.**

Inside `_render()`, you have a Canvas 2D context with zero
constraints. You can draw anything a browser can render. The
gotchas tell you HOW to ship code that works. They say NOTHING
about what that code should look like.

**You are not limited to the blueprints above.** The KPI tile,
ring gauge, area chart, donut, and table blueprints are STARTING
POINTS. If the brand calls for a viz that doesn't match any
blueprint — a radar chart, a particle field, a speedometer with
a physical needle, a heat map with cell animations — BUILD IT.

**Consult `vp-ref-patterns` mood recipes** for Canvas techniques
that create atmosphere: ambient light, glass panels, noise
texture, data glow, cinematic typography, gradient mesh, accent
lines, animated pulse rings. These are the tools that make the
difference between "a Splunk dashboard" and "something someone
screenshots and shares."

**The only creative constraint:** if a visual effect competes
with the DATA for attention, it's too much. The data is the
story. Effects are the stage lighting. A spotlight draws the
eye TO the actor — it doesn't become the show.

**Default stance:** be AMBITIOUS. A safe, generic viz that
nobody notices is worse than a bold viz that makes one person
say "wait, that's Splunk?" Ship something with a point of view.

## Subagent dispatch rules — MUST include in every viz build prompt

When dispatching subagents (one per viz), include ALL of these rules
in the subagent prompt. Missing any one causes a build that silently
fails.

**File paths:**
1. Runtime files go in `appserver/static/visualizations/{viz}/` — NEVER
   in `default/visualizations/` (F9)

**Data pipeline:**
2. MUST include `getInitialDataParams` as a METHOD with
   `ROW_MAJOR_OUTPUT_MODE` — never as a property on the extend object (F4)

**DOM rules:**
3. Use `this.el` (plain DOM element), NEVER `this.$el` (jQuery) — jQuery
   is not available in Dashboard Studio v2 sandboxed iframes (F10)

**Canvas setup:**
4. Pass `this.el` (container div) to `theme.setupCanvas()`, NEVER
   `this._canvas` — setupCanvas internally creates/finds the canvas (B17)

**Render method:**
5. The `reflow` method must call the SAME method used for rendering —
   verify the actual name (`_render`, `_draw`, `updateView`) before
   writing `reflow` (C6)

**Build format:**
6. If webpack builds cause Script errors, use flat AMD build instead (F11).
   Source files use `require()`/`module.exports`; `build_flat.js` converts
   to `define()` wrapper.

**Formatter (CRITICAL):**
7. Formatter.html uses ONLY Splunk components (`<splunk-control-group>`,
   `<splunk-text-input>`, etc.) — NEVER raw HTML (`<div>`, `<input>`,
   `<select>`) (F12). No `<html>`/`<body>` wrappers. No CSS/JS.

**Theme detection:**
8. Theme MUST auto-detect via `getCurrentTheme()` fallback — never
   hardcode `'dark'` as default. Vizs must work in both Dashboard
   Studio AND ad-hoc search light theme (B18)

**Checklist for subagent to verify before reporting DONE:**
- [ ] `getInitialDataParams` is a method (not a property)
- [ ] No `this.$el` or jQuery anywhere
- [ ] `reflow` calls the correct render method
- [ ] `theme.setupCanvas(this.el)` not `theme.setupCanvas(this._canvas)`
- [ ] Source uses `require()`/`module.exports`, NOT `define()`
- [ ] All code is ES5 (no const/let/arrow/template literals)
- [ ] Formatter uses Splunk components only, no raw HTML (F12)
- [ ] All sizes scale from container dimensions, no hardcoded pixels (B8)
- [ ] Tables have sort + pagination
- [ ] Theme defaults to '' (empty), falls back to getCurrentTheme() (B18)

## Splunk API reference — things agents forget

### SplunkVisualizationUtils helpers

Available via `require('api/SplunkVisualizationUtils')`:

```javascript
var Utils = require('api/SplunkVisualizationUtils');

Utils.escapeHtml(str)      // XSS prevention for DOM insertion
Utils.makeSafeUrl(url)     // strip javascript: and unsafe schemes
Utils.getCurrentTheme()    // returns 'dark' or 'light'
Utils.normalizeBoolean(v)  // coerce string/int to boolean
```

Only import Utils if you use it — add to webpack externals:
```javascript
externals: ['api/SplunkVisualizationBase', 'api/SplunkVisualizationUtils']
```

### Lifecycle methods beyond the basics

```javascript
module.exports = SplunkVisualizationBase.extend({
    initialize: function() { ... },         // one-time setup
    setupView: function() { ... },          // called once before first updateView
    getInitialDataParams: function() { ... },
    formatData: function(data) { ... },
    updateView: function(data, config) { ... },
    onConfigChange: function(changes, prev) { ... }, // formatter setting changed
    reflow: function() {                    // container resized
        this.invalidateUpdateView();
    },
    destroy: function() { ... }             // cleanup timers, listeners
});
```

### Invalidation methods (call, don't override)

```javascript
this.invalidateFormatData()   // re-run formatData next cycle
this.invalidateUpdateView()   // re-run updateView next cycle
this.invalidateReflow()       // re-run reflow next cycle
```

### Real-time search handling

Real-time searches (`rt-1m` to `rt`) accumulate rows over time.
`data.rows` is ordered oldest-first.

```javascript
// Single-value vizs: ALWAYS read last row (most recent)
var row = data.rows[data.rows.length - 1];

// Chart/table vizs: iterate all rows
for (var i = 0; i < data.rows.length; i++) { ... }
```

Size `count` in getInitialDataParams:
- Single-value / gauge: `count: 50` (small buffer, snappy updates)
- Chart / table: `count: 10000` (needs history)

### Cache in BOTH formatData AND updateView

Splunk can pass `data = false` to updateView even when formatData
returned cached data. Without both caches, the viz flashes blank:

```javascript
formatData: function(data) {
    if (!data || !data.rows || data.rows.length === 0) {
        if (this._lastGoodData) return this._lastGoodData;
        return data;
    }
    // ... build result ...
    this._lastGoodData = result;
    return result;
},

updateView: function(data, config) {
    if (!data) {
        if (this._lastGoodData) data = this._lastGoodData;
        else return;
    }
    // ... draw ...
}
```

### Reload viz without restarting Splunk

Navigate to `http://<splunk>:8000/en-US/_bump` and click "Bump
version", then hard-refresh browser (Cmd+Shift+R). This clears
Splunk's static file cache. Only conf file changes need a restart.

### Font quoting in ctx.font strings

```javascript
// WRONG — nested quotes break
ctx.font = '700 ' + size + 'px \'CustomFont\', sans-serif';

// RIGHT — escaped double quotes inside single-quoted string
ctx.font = '700 ' + size + 'px "CustomFont", sans-serif';

// SAFEST — variable avoids all quoting issues
var fontFamily = '"CustomFont", sans-serif';
ctx.font = '700 ' + size + 'px ' + fontFamily;
```
