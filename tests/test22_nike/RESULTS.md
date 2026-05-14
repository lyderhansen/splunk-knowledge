# Test 22 — Nike Training Club

## What was built

A complete Splunk custom visualization pack and Dashboard Studio dashboard for Nike Training Club.

### App details
- **App ID:** `nike_training_club`
- **Version:** 1.0.0
- **Tarball:** `nike_training_club.tar.gz` (22 KB)
- **Theme:** Dark primary (volt #CDFF00 on black #0A0A0A), light mode tokens included
- **Fonts:** System fonts only (0 KB overhead) — Helvetica Neue + SF Mono

### 7 Custom visualizations
1. **kpi_tile** — Bold single-value with trend delta and optional sparkline
2. **program_bars** — Ranked horizontal bars showing program engagement scores
3. **trend_chart** — Area chart with target line overlay for weekly trends
4. **trainer_board** — Ranked trainer leaderboard with scores and session counts
5. **city_grid** — Heat grid showing city engagement levels
6. **activity_feed** — Scrolling feed of recent workout events with type-coded badges
7. **engagement_gauge** — Circular arc gauge showing weekly active rate vs target

### Dashboard
- **File:** `default/data/ui/views/nike_training_dashboard.xml`
- **Layout:** Absolute, 1920x1340px, dark background
- **Architecture:** Strip banner (Nike swoosh + title) -> KPI strip (4 tiles) -> Programs + Trends (60/40 split) -> Trainers + Gauge + Cities + Activity Feed (asymmetric bottom zone)
- **Data sources:** 10 lookup-based searches, all using `| inputlookup`
- **Nav bar:** Included (`default/data/ui/nav/default.xml`)

### Demo data (CSV lookups)
- `nike_training_club_kpis.csv` — 4 KPIs with sparkline data
- `nike_training_club_programs.csv` — 10 training programs with scores
- `nike_training_club_trends.csv` — 12-week completion rate time series
- `nike_training_club_trainers.csv` — 10 trainers with ratings
- `nike_training_club_cities.csv` — 12 cities with engagement scores
- `nike_training_club_activity.csv` — 15 recent activity events

## Skills loaded and followed
1. `vp-couture` — Design orchestrator (Steps 1-6, 8)
2. `vp-ref-gotchas` — Hard rules for viz development
3. `vp-create` — Scaffold and packaging rules
4. `spl-gotchas` — SPL trap avoidance
5. `ds-create` — Dashboard Studio JSON rules
6. `ds-int-tabs` — Tabbed layout reference (loaded but tabs not needed for this layout)

## Technical compliance

### FATAL rules (F1-F12)
- [x] F1: ES5 target — flat AMD build, verified 0 arrow functions / const / let / template literals
- [x] F2: No custom fonts to embed (system fonts only)
- [x] F3: Pure ES5 source throughout
- [x] F4: `getInitialDataParams` returns `ROW_MAJOR_OUTPUT_MODE` in every viz
- [x] F5: Only externalize SplunkVisualizationBase
- [x] F6: Source uses `require()` / `module.exports`, built with flat AMD
- [x] F7: All vizs use `SplunkVisualizationBase.extend({...})` object literal
- [x] F8: Nike swoosh bundled in `appserver/static/images/`, no external URLs
- [x] F9: Vizs in `appserver/static/visualizations/`, NOT `default/visualizations/`
- [x] F10: No jQuery — all DOM APIs
- [x] F11: Flat AMD build (no webpack IIFE issues)
- [x] F12: Formatter uses Splunk components only, no raw HTML

### BROKEN rules (B1-B17)
- [x] B2: HiDPI scaling with devicePixelRatio
- [x] B3: `getOption()` + `getNS()` for ALL config reads
- [x] B4: No config reads in `formatData`
- [x] B5: Formatter section labels exact match
- [x] B7: JS defaults match formatter HTML defaults
- [x] B9: Dashboard type format `nike_training_club.viz_name`
- [x] B10: Short namespace format in formatter.html
- [x] B13: Canvas uses `clearRect()`, never `fillRect()` with bg color
- [x] B15: `formatData` included in every viz
- [x] B16: Every visual property configurable via formatter

### REJECTED rules (R1-R7)
- [x] R1: app.conf has all 5 stanzas
- [x] R2: default.meta includes sc_admin and [lookups]
- [x] R3: No macOS artifacts (COPYFILE_DISABLE=1)
- [x] R5: No real-time searches
- [x] R6: savedsearches.conf.spec documents all settings

### INTERACTIVE rules (I1-I2)
- [x] I1: Hover tooltip on every viz (DOM div + mousemove + hitTest)
- [x] I2: Hover highlight (row bg change, crosshair, point highlight, cell border)

### Dashboard Studio rules
- [x] Canvas minimum 1920px wide
- [x] `backgroundColor: "transparent"` on every custom viz panel
- [x] Every dataSource has a `name` property
- [x] `fontFamily` on markdown uses allowed values only (Helvetica)
- [x] `fontSize` uses enum values only (large, extraSmall)
- [x] `splunk.rectangle` cards behind panel groups for depth
- [x] Section labels at extraSmall with 30% opacity

## Design scoring

| Dimension | Score | Notes |
|---|---|---|
| Visual hierarchy | 8/10 | 4.8:1 size ratio, three-tier typography |
| Whitespace quality | 7/10 | Intentional variation across zones |
| Brand distinctiveness | 9/10 | Volt-on-black unmistakably Nike |
| Emotional resonance | 8/10 | Bold, athletic, screenshot-worthy |

**Anti-AI tells:** 0-1 present (PASS)

## Issues / notes
- No custom font embedding needed — Nike's aesthetic comes from weight + case + spacing, not a specific typeface, so system fonts keep the bundle at 0 KB overhead
- The dashboard scrolls vertically (1340px height) to accommodate all 6 panel zones without cramping the bottom section
- Light theme tokens are defined in theme.js but the bundled dashboard ships in dark mode only — light mode works via the `theme` formatter setting on each viz
- The flat AMD build was used instead of webpack to avoid potential Script errors in Dashboard Studio v2's sandboxed iframe (per F11)
