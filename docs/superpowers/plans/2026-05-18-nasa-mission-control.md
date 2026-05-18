# NASA Mission Control Viz Pack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an 8-viz Splunk custom visualization pack + 3-tab Dashboard Studio dashboard with cinematic sci-fi aesthetic for NASA mission control telemetry.

**Architecture:** All 8 vizs render via Canvas 2D, share a common `theme.js` design token file that gets inlined at build time by `build_flat.js`. Each viz lives in `appserver/static/visualizations/{name}/` with `src/visualization_source.js` (pre-build) and `formatter.html`. Demo data via CSV lookups. Dashboard uses Dashboard Studio v2 JSON with tabbed layout.

**Tech Stack:** ES5 JavaScript (Canvas 2D), Splunk Dashboard Studio v2, CSV lookups, `build_flat.js` (flat AMD bundler), `validate_viz.sh` (linter)

**Design Spec:** `docs/superpowers/specs/2026-05-18-nasa-mission-control-design.md`

**Critical Rules:**
- ALL viz JS must be ES5 — no const, let, arrow functions, template literals
- ALL formatter inputs use `{{VIZ_NAMESPACE}}.key` — never hardcoded namespace
- ALL viz code written INLINE in main context — never subagent dispatched
- Color pickers use `type="custom"` with `splunk-color-picker`
- Theme detection via `detectTheme()` in every viz
- Null guards via `safeStr()`/`safeNum()` on all data access
- `COPYFILE_DISABLE=1` on final tar

---

## File Structure

```
tests/test33_nasa/nasa_mission_control/
├── shared/
│   └── theme.js                          # Design tokens + Canvas helpers
├── appserver/static/visualizations/
│   ├── signal_waveform/
│   │   ├── src/visualization_source.js   # Pre-build source
│   │   ├── formatter.html
│   │   └── preview.png                   # 300x200
│   ├── radial_orbit/
│   │   ├── src/visualization_source.js
│   │   ├── formatter.html
│   │   └── preview.png
│   ├── hex_health/
│   │   ├── src/visualization_source.js
│   │   ├── formatter.html
│   │   └── preview.png
│   ├── kpi_orb/
│   │   ├── src/visualization_source.js
│   │   ├── formatter.html
│   │   └── preview.png
│   ├── particle_timeline/
│   │   ├── src/visualization_source.js
│   │   ├── formatter.html
│   │   └── preview.png
│   ├── radar_sweep/
│   │   ├── src/visualization_source.js
│   │   ├── formatter.html
│   │   └── preview.png
│   ├── arc_fuel/
│   │   ├── src/visualization_source.js
│   │   ├── formatter.html
│   │   └── preview.png
│   └── alert_waterfall/
│       ├── src/visualization_source.js
│       ├── formatter.html
│       └── preview.png
├── default/
│   ├── app.conf
│   ├── visualizations.conf
│   ├── savedsearches.conf
│   ├── transforms.conf
│   └── data/ui/
│       ├── nav/default.xml
│       └── views/nasa_mission_control_dashboard.xml
├── lookups/
│   ├── telemetry_signal.csv
│   ├── ground_stations.csv
│   ├── comm_events.csv
│   ├── orbital_params.csv
│   ├── fuel_budget.csv
│   ├── maneuver_events.csv
│   ├── subsystem_health.csv
│   ├── alerts.csv
│   └── power_telemetry.csv
├── metadata/
│   └── default.meta
├── static/
│   └── appIcon.png                       # 36x36
├── README
└── savedsearches.conf.spec

50+ files total
```

---

## Task 1: Scaffold App Directory + Write theme.js

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/shared/theme.js`
- Create: all directories in the file structure above
- Create: `tests/test33_nasa/nasa_mission_control/metadata/default.meta`
- Create: `tests/test33_nasa/nasa_mission_control/README`
- Create: `tests/test33_nasa/nasa_mission_control/savedsearches.conf.spec`

**MUST LOAD** skill `splunk-viz-packs:vp-viz` before writing theme.js — it documents the exact export signature `build_flat.js` expects.

- [ ] **Step 1: Create directory structure**

```bash
APP="tests/test33_nasa/nasa_mission_control"
mkdir -p "$APP"/{shared,static,metadata,lookups}
mkdir -p "$APP"/default/data/ui/{nav,views}
for viz in signal_waveform radial_orbit hex_health kpi_orb particle_timeline radar_sweep arc_fuel alert_waterfall; do
  mkdir -p "$APP/appserver/static/visualizations/$viz/src"
done
```

- [ ] **Step 2: Write shared/theme.js**

Full theme.js with NASA palette from design spec. Must export via `module.exports = { ... }`:

**DARK palette:** bg `#05080F`, panel `#0A1628`, panelHi `#0F1F35`, text `#E8ECF4`, textDim `#7B8BA4`, textFaint `#3D4C63`, s1 `#00B4FF` (cyan), s2 `#00E5A0` (green), s3 `#FF6B35` (orange), s4 `#C084FC` (purple), s5 `#FACC15` (amber), accent `#00B4FF`, success `#00E5A0`, warn `#FACC15`, danger `#FF3B5C`, edge `rgba(0,180,255,0.08)`, edgeStrong `rgba(0,180,255,0.20)`, grid `rgba(0,180,255,0.04)`, invert `#05080F`

**LIGHT palette:** bg `#F0F2F7`, panel `#FFFFFF`, panelHi `#E8ECF4`, text `#0A1628`, textDim `#5A6A82`, textFaint `#94A3B8`, s1 `#0066CC`, s2 `#059669`, s3 `#C2410C`, s4 `#7C3AED`, s5 `#B45309`, accent `#0066CC`, success `#059669`, warn `#B45309`, danger `#CC2244`, edge `rgba(0,60,140,0.10)`, edgeStrong `rgba(0,60,140,0.20)`, grid `rgba(0,60,140,0.06)`, invert `#F0F2F7`

**FONTS:** `{ data: '"SF Mono", "Menlo", monospace', ui: '"Helvetica Neue", "Arial", sans-serif' }`

**Required exports:** `getTheme`, `withAlpha`, `lerpColor`, `severityColor`, `fmtNum`, `roundRect`, `drawPanel`, `drawHGrid`, `parseColors`, `parseInts`, `getSpacing`, `getHoverAlpha`, `getTypoScale`, `FONTS`

- [ ] **Step 3: Write metadata/default.meta**

```ini
[]
export = system
```

- [ ] **Step 4: Write README**

```
NASA Mission Control Viz Pack
8 custom visualizations for spacecraft telemetry monitoring.
```

- [ ] **Step 5: Write savedsearches.conf.spec (empty file)**

Create empty file — required by validator.

- [ ] **Step 6: Commit**

```bash
git add tests/test33_nasa/
git commit -m "feat(nasa): scaffold app directory + write theme.js"
```

---

## Task 2: Write signal_waveform viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/signal_waveform/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/signal_waveform/src/visualization_source.js`

**MUST LOAD** skill `splunk-viz-packs:vp-viz` before writing viz code.

- [ ] **Step 1: Write formatter.html**

4 sections, 14 controls:
- **Data Configuration**: `amplitudeField` (text), `frequencyField` (text), `noiseFloor` (text, default `-100`), `drilldownField` (text)
- **Display**: `traceWidth` (radio: 1/2/3, default 2), `showGrid` (radio: true/false, default true), `gridOpacity` (radio: 20/40/60, default 20), `scrollSpeed` (radio: slow/normal/fast, default normal)
- **Color and Style**: `themeMode` (radio: auto/dark/light, default auto), `traceColor` (color picker, default `#00E5A0`)
- **Animation**: `showEntrance` (true), `flashCritical` (true), `showHoverEffect` (true), `animationSpeed` (slow/normal/fast, default normal)

All inputs namespaced `{{VIZ_NAMESPACE}}.key`. Color picker `type="custom"`.

- [ ] **Step 2: Write visualization_source.js**

Oscilloscope viz with continuous scrolling waveform.

Key rendering logic:
- Maintain a circular buffer of amplitude samples (max 800 = canvas width)
- On each `updateView`: push new data points into buffer
- Continuous `requestAnimationFrame` loop scrolls the waveform left
- Draw using `ctx.beginPath()` + `ctx.quadraticCurveTo()` for smooth curves
- Trace color = `s2` (phosphor green) with `shadowBlur: 12` for CRT glow
- Noise floor = dashed horizontal line at configurable dBm level
- Grid = faint 5x5 lines at `t.grid` color
- Flash critical = pulse glow when amplitude drops below noise floor
- Downsample safety: if data.rows.length > canvas.width, sample every Nth point

Data: `getInitialDataParams()` with `ROW_MAJOR_OUTPUT_MODE`, count 10000.
Fields: auto-discover from `amplitudeField`/`frequencyField` config or fall back to columns[0]/columns[1].
Store field names in `this._amplitudeField`, `this._drilldownField` for event handlers.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/signal_waveform/
git commit -m "feat(nasa): add signal_waveform oscilloscope viz"
```

---

## Task 3: Write radial_orbit viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/radial_orbit/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/radial_orbit/src/visualization_source.js`

- [ ] **Step 1: Write formatter.html**

4 sections, 16 controls:
- **Data Configuration**: `phaseField`, `altitudeField`, `velocityField`, `periapsisField`, `apoapsisField`, `drilldownField`
- **Display**: `trailLength` (radio: 15/30/45, default 30), `bodyLabel` (text, default "Earth"), `showReadouts` (radio: true/false, default true)
- **Color and Style**: `themeMode` (auto/dark/light), `orbitColor` (color picker, default `#00B4FF`), `bodyColor` (color picker, default `#1E40AF`)
- **Animation**: `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

- [ ] **Step 2: Write visualization_source.js**

Orbital ring with position dot and afterglow trail.

Key rendering logic:
- Calculate ellipse center at (w/2, h/2), semi-major/minor from periapsis+apoapsis
- `ctx.ellipse()` for orbital path stroke (faint cyan)
- Position dot at current `phase` angle on the ellipse — filled circle with `shadowBlur: 16`
- Trail arc: draw 30° arc behind position using gradient stroke (accent → transparent)
- Center body: `ctx.createRadialGradient()` from bodyColor center to dark edge
- Periapsis/apoapsis markers: small diamond shapes at 0° and 180° on ellipse
- Readouts below orbit: altitude + velocity in monospace font
- Entrance: orbit path draws itself (strokeDashoffset animation via progress)
- Flash critical: pulse if altitude < some threshold

Data: single row with phase/alt/vel/peri/apo fields.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/radial_orbit/
git commit -m "feat(nasa): add radial_orbit orbital path viz"
```

---

## Task 4: Write hex_health viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/hex_health/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/hex_health/src/visualization_source.js`

- [ ] **Step 1: Write formatter.html**

4 sections, 14 controls:
- **Data Configuration**: `subsystemField`, `statusField`, `sparklineField`, `drilldownField`
- **Display**: `hexSize` (radio: small/medium/large, default medium), `showLabels` (true), `showSparkline` (true)
- **Color and Style**: `themeMode`, `nominalColor` (default `#00E5A0`), `warnColor` (default `#FACC15`), `criticalColor` (default `#FF3B5C`)
- **Animation**: `showEntrance`, `flashCritical`, `animationSpeed`

- [ ] **Step 2: Write visualization_source.js**

Hexagonal honeycomb subsystem grid.

Key rendering logic:
- Calculate hex geometry: `hexW = size * 2`, `hexH = size * sqrt(3)`, offset rows
- Auto-layout: compute grid columns/rows to fit data count within canvas
- Each hex: `ctx.beginPath()` → 6-point polygon → `fill` (severity at 20% alpha) + `stroke` (80% alpha)
- Center label: subsystem name in bold small caps (use `ctx.textAlign = 'center'`)
- Sparkline: parse sparkline string from Splunk (format: `0.8,0.7,0.9,...`), draw 24-point polyline in bottom half of hex
- Severity mapping: use `severityColor(t, status)` from theme.js
- Critical hex: pulsing `shadowBlur` on stroke
- Hover: detect which hex contains mouse via point-in-polygon, brighten fill
- Click: drilldown with subsystem field value

Data: multiple rows, one per subsystem. `formatData` parses sparkline strings.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/hex_health/
git commit -m "feat(nasa): add hex_health subsystem honeycomb viz"
```

---

## Task 5: Write kpi_orb viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/kpi_orb/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/kpi_orb/src/visualization_source.js`

- [ ] **Step 1: Write formatter.html**

4 sections, 16 controls:
- **Data Configuration**: `valueField`, `unitField`, `labelField`, `drilldownField`
- **Display**: `warnThreshold` (text, default 70), `criticalThreshold` (text, default 30), `decimals` (radio: 0/1/2, default 1), `orbSize` (radio: small/medium/large, default medium), `showUnit` (true), `showLabel` (true), `showHalo` (true)
- **Color and Style**: `themeMode`, `orbColor` (color picker, default `#00B4FF`)
- **Animation**: `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

- [ ] **Step 2: Write visualization_source.js**

Glowing orb KPI tile.

Key rendering logic:
- Outer ring: thin `ctx.arc()` stroke at 1px
- Inner orb: `ctx.createRadialGradient()` from orbColor (center, alpha 0.6) to transparent (edge)
- Value text: large monospaced number centered (`getTypoScale(w,h).hero` size)
- Unit + label: smaller text below value
- Threshold logic: if value < criticalThreshold → danger color + halo pulse; if < warnThreshold → warn color
- Halo: additional outer arc with `shadowBlur: 8-24` pulsing via `requestAnimationFrame`
- Entrance: `easeOutBack` scale from 0 → 1 (overshoot gives subtle bounce)
- Hover: orb brightens, shadowBlur increases +4
- `fmtNum()` from theme.js for value formatting

Data: single row with value/unit/label fields.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/kpi_orb/
git commit -m "feat(nasa): add kpi_orb glowing KPI sphere viz"
```

---

## Task 6: Write particle_timeline viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/particle_timeline/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/particle_timeline/src/visualization_source.js`

- [ ] **Step 1: Write formatter.html**

4 sections, 16 controls:
- **Data Configuration**: `timeField`, `eventField`, `severityField`, `impactField`, `drilldownField`
- **Display**: `maxParticles` (radio: 100/200/500, default 200), `particleSize` (radio: small/medium/large, default medium), `flowSpeed` (radio: slow/normal/fast, default normal), `showAxis` (true), `showLabels` (true), `laneMode` (radio: scatter/lanes, default scatter)
- **Color and Style**: `themeMode`
- **Animation**: `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

- [ ] **Step 2: Write visualization_source.js**

Event particle flow along time axis.

Key rendering logic:
- Ring buffer: fixed-size array of particle objects `{ x, y, age, color, size, eventData }`
- On `updateView`: spawn particles from new data rows at their time-mapped x position
- Continuous `requestAnimationFrame` loop: increment each particle's x (drift right) and age; remove particles that exceed maxAge
- Draw: `ctx.arc()` per particle with `shadowBlur` glow, color from `severityColor(t, severity)`
- Size: map `impact_score` to radius (3-12px range)
- Lane mode: if "lanes", assign y position by event_type; if "scatter", random jitter
- Time axis: horizontal line at bottom with tick marks and time labels
- Hover: find nearest particle within 15px radius, enlarge + show tooltip text
- Ring buffer cap: when particles.length > maxParticles, shift oldest out
- Flash critical: particles with severity "critical" pulse their glow

Data: multiple rows, each row spawns one particle. `_time` parsed for x positioning.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/particle_timeline/
git commit -m "feat(nasa): add particle_timeline event flow viz"
```

---

## Task 7: Write radar_sweep viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/radar_sweep/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/radar_sweep/src/visualization_source.js`

- [ ] **Step 1: Write formatter.html**

4 sections, 16 controls:
- **Data Configuration**: `nameField`, `azimuthField`, `rangeField`, `typeField`, `drilldownField`
- **Display**: `sweepSpeed` (radio: slow/normal/fast, default normal), `fadeTime` (radio: 3/5/8, default 5), `showGrid` (true), `showRangeLabels` (true), `centerLabel` (text, default "TDRSS"), `maxRange` (text, default 50000)
- **Color and Style**: `themeMode`, `sweepColor` (color picker, default `#00B4FF`)
- **Animation**: `showEntrance`, `showHoverEffect`, `animationSpeed`

- [ ] **Step 2: Write visualization_source.js**

Rotating polar radar display.

Key rendering logic:
- Polar grid: concentric circles at 25/50/75/100% of maxRange, 12 radial lines (30° apart), all at `t.grid` color
- Sweep line: `ctx.moveTo(center)` → `ctx.lineTo(edge at sweepAngle)`, bright cyan with `shadowBlur: 12`
- Sweep trail: semi-transparent filled wedge (arc) covering 30° behind sweep line, gradient from sweepColor at 0.15 alpha to 0 alpha
- Data points: each has azimuth (degrees) and range (km). Convert to polar → canvas coords. Draw as bright dot with glow.
- Fade logic: each data point has a `revealedAt` timestamp (set when sweep passes within ±5°). Alpha = 1.0 - (now - revealedAt) / fadeTime. Remove when alpha ≤ 0.
- Continuous rotation: `requestAnimationFrame` increments sweepAngle by speed per frame
- **IntersectionObserver**: create in `initialize()`, observe `this.el`. Set `this._visible` flag. Skip `requestAnimationFrame` when not visible.
- Center label: text at center of polar grid
- Range labels: small text at each concentric circle
- Hover: detect nearest data point, show name + range tooltip

Data: multiple rows with name/azimuth/range/type. Store in `this._dataPoints` array.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/radar_sweep/
git commit -m "feat(nasa): add radar_sweep polar radar viz"
```

---

## Task 8: Write arc_fuel viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/arc_fuel/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/arc_fuel/src/visualization_source.js`

- [ ] **Step 1: Write formatter.html**

4 sections, 16 controls:
- **Data Configuration**: `remainingField`, `burn1Field`, `burn2Field`, `burn3Field`, `drilldownField`
- **Display**: `maxBurns` (radio: 1/2/3, default 3), `burnLabels` (text, default "TLI,LOI,TEI"), `reserveThreshold` (text, default 15), `arcWidth` (radio: thin/medium/thick, default medium), `showLabels` (true)
- **Color and Style**: `themeMode`, `remainingColor` (default `#00E5A0`), `burnColor` (default `#FF6B35`), `reserveColor` (default `#FF3B5C`)
- **Animation**: `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

- [ ] **Step 2: Write visualization_source.js**

Multi-segment arc gauge for fuel/delta-V budget.

Key rendering logic:
- Arc geometry: 270° arc from `startAngle = 0.75 * Math.PI` (135°) to `endAngle = 2.25 * Math.PI` (405°)
- Segment calculation: total = burn1 + burn2 + burn3 + remaining (should sum to 100). Each segment occupies proportional arc length.
- Draw segments sequentially: `ctx.arc(cx, cy, radius, segStart, segEnd)` with `lineWidth` from arcWidth setting (thin=12, medium=20, thick=28)
- Burn segments: stroke in burnColor (orange tones), each slightly different shade via `lerpColor`
- Remaining segment: stroke in remainingColor (green/cyan)
- Reserve check: if remaining < reserveThreshold, switch remaining color to reserveColor (danger red) and pulse `shadowBlur`
- Burn labels: text positioned along outside of each segment arc at midpoint angle
- Center readout: large number showing remaining % in monospace font
- Entrance: segments grow sequentially with staggered easeOutQuart (burn1 grows, then burn2, then burn3, then remaining)

Data: single row with remaining/burn1/burn2/burn3 fields.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/arc_fuel/
git commit -m "feat(nasa): add arc_fuel delta-V budget gauge viz"
```

---

## Task 9: Write alert_waterfall viz

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/alert_waterfall/formatter.html`
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/alert_waterfall/src/visualization_source.js`

- [ ] **Step 1: Write formatter.html**

4 sections, 14 controls:
- **Data Configuration**: `timeField`, `alertField`, `severityField`, `subsystemField`, `statusField`, `drilldownField`
- **Display**: `maxRows` (radio: 10/20/50, default 20), `sortOrder` (radio: newest/oldest, default newest), `showTimestamp` (true), `activeGlow` (true)
- **Color and Style**: `themeMode`
- **Animation**: `showEntrance`, `flashCritical`, `animationSpeed`

- [ ] **Step 2: Write visualization_source.js**

Cascading alert feed with severity-tinted rows.

Key rendering logic:
- Row layout: each row height = 40px, full canvas width. Left border 4px in severity color.
- Row background: severity color at 0.05 alpha fill
- Text columns: timestamp (mono, textDim) | alert name (bold, text) | subsystem (textDim) | severity badge (small rounded rect with severity bg + white text)
- Active alerts (status="active"): background alpha oscillates 0.05 → 0.15 via `Math.sin()` in animation frame
- Scroll: track `this._scrollOffset`, handle `wheel` event. Clamp to [0, totalHeight - canvasHeight]. Draw scroll indicator bar on right edge when content overflows.
- Entrance: rows cascade in from y=-40 with staggered 50ms delay per row, easeOutQuart
- Sort: newest-first or oldest-first based on `sortOrder` setting
- Hover: brighten row background, add glow border
- Click: drilldown with alert name + severity + subsystem

Data: multiple rows with _time/alert/severity/subsystem/status fields.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/alert_waterfall/
git commit -m "feat(nasa): add alert_waterfall cascading alert feed viz"
```

---

## Task 10: Write Demo CSV Lookups

**Files:**
- Create: all 9 CSV files in `tests/test33_nasa/nasa_mission_control/lookups/`

- [ ] **Step 1: Write telemetry_signal.csv (500 rows)**

Fields: `_time,signal_dbm,data_rate_kbps,noise_floor,mission_id`

Generate 500 rows spanning 24 hours. Signal dBm range: -40 (strong lock) to -120 (loss of signal). Include 2-3 signal dropout events (dBm drops below -100 noise floor). Data rate correlates with signal: 150000 kbps at -40dBm, dropping to 0 at -120dBm. Noise floor constant at -100. Mix across 4 missions: ARTEMIS-II (60%), ISS-EXP70 (20%), JWST (10%), OSIRIS-APEX (10%).

- [ ] **Step 2: Write ground_stations.csv (12 rows)**

Fields: `station_name,azimuth_deg,range_km,station_type,status`

```csv
station_name,azimuth_deg,range_km,station_type,status
Goldstone DSS-14,243,0,DSN,active
Goldstone DSS-25,245,0,DSN,active
Canberra DSS-43,128,16500,DSN,active
Canberra DSS-35,130,16500,DSN,standby
Madrid DSS-63,32,9500,DSN,active
Madrid DSS-55,34,9500,DSN,active
White Sands,265,2200,TDRS,active
Guam,290,13200,SGLS,active
Wallops Island,280,400,SGLS,maintenance
Merritt Island,270,200,SGLS,active
McMurdo,178,15300,TDRS,active
Svalbard,10,8800,KSAT,active
```

- [ ] **Step 3: Write comm_events.csv (200 rows)**

Fields: `_time,event_type,severity,station,duration_min,mission_id`

Event types: AOS (acquisition of signal, severity=low), LOS (loss of signal, severity=high), HANDOVER (medium), DROPOUT (critical). Each event tied to a ground station. Duration 5-90 minutes. Span 48 hours.

- [ ] **Step 4: Write orbital_params.csv (100 rows)**

Fields: `_time,altitude_km,velocity_kms,orbit_phase_deg,periapsis_km,apoapsis_km,inclination_deg,period_min,mission_id`

ISS-EXP70: alt 408-420km, vel 7.66km/s, inc 51.6°, period 92min.
ARTEMIS-II: alt 200-384400km (translunar), vel 1.0-10.8km/s, inc 28.5°.
JWST: alt 1500000km (L2), vel 0.3km/s, inc 0°, period 8766h.
Phase: 0-360° cycling. 100 rows spanning 24 hours.

- [ ] **Step 5: Write fuel_budget.csv (10 rows)**

Fields: `mission_id,fuel_remaining_pct,burn1_pct,burn2_pct,burn3_pct,burn1_label,burn2_label,burn3_label`

```csv
mission_id,fuel_remaining_pct,burn1_pct,burn2_pct,burn3_pct,burn1_label,burn2_label,burn3_label
ARTEMIS-II,42.5,18.0,22.5,17.0,TLI,LOI,TEI
ISS-EXP70,71.2,12.3,8.5,8.0,Reboost-1,Reboost-2,DAM
JWST,89.4,6.2,2.8,1.6,MCC-1,MCC-2,SK-1
OSIRIS-APEX,55.8,21.0,14.2,9.0,TCM-1,OIM,Departure
```

Plus 6 more historical snapshot rows for each mission at different dates.

- [ ] **Step 6: Write maneuver_events.csv (150 rows)**

Fields: `_time,event_type,severity,impact_score,burn_name,mission_id`

Event types: BURN_START (high/8), BURN_COMPLETE (low/3), TRAJECTORY_CORRECTION (medium/5), ATTITUDE_ADJUST (low/2), MOMENTUM_DUMP (low/1). Span 7 days. Mix across missions.

- [ ] **Step 7: Write subsystem_health.csv (80 rows)**

Fields: `_time,subsystem,status,health_pct,mission_id`

8 subsystems: COMM, PROP, ECLSS, GNC, PWR, THERMAL, NAV, DATA.
Status: nominal/degraded/critical. Health: 0-100%.
10 rows per subsystem across 24 hours. Most nominal (85-100%), 2-3 degraded (50-84%), 1 critical event (below 50%).

- [ ] **Step 8: Write alerts.csv (100 rows)**

Fields: `_time,alert_name,severity,subsystem,status,mission_id`

Realistic alert names: "COMM-S-Band Dropout", "PWR-Solar Array Alpha Gimbal Lock", "ECLSS-CO2 Scrubber Pressure High", "GNC-Star Tracker Alignment Drift", "THERMAL-Radiator Panel 3 Overtemp", "NAV-GPS Constellation Gap", "PROP-Helium Pressurant Low", "DATA-Telemetry Buffer Overflow". Mix active/resolved status. Severity: info/warning/critical. Span 48 hours.

- [ ] **Step 9: Write power_telemetry.csv (300 rows)**

Fields: `_time,voltage,current_amps,bus_id,mission_id`

Bus IDs: BUS-A, BUS-B, BUS-C. Voltage: 28-32V nominal, dips to 24V during eclipse. Current: 10-80A depending on load. 300 rows spanning 24 hours.

- [ ] **Step 10: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/lookups/
git commit -m "feat(nasa): add 9 demo CSV lookups with realistic telemetry data"
```

---

## Task 11: Write Splunk Config Files

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/default/app.conf`
- Create: `tests/test33_nasa/nasa_mission_control/default/visualizations.conf`
- Create: `tests/test33_nasa/nasa_mission_control/default/transforms.conf`
- Create: `tests/test33_nasa/nasa_mission_control/default/savedsearches.conf`
- Create: `tests/test33_nasa/nasa_mission_control/default/data/ui/nav/default.xml`

- [ ] **Step 1: Write app.conf**

```ini
[install]
is_configured = 0
build = 1

[id]
name = nasa_mission_control

[package]
id = nasa_mission_control
check_for_updates = false

[ui]
is_visible = true
label = NASA Mission Control

[launcher]
author = splunk-knowledge
description = 8 custom visualizations for spacecraft telemetry, orbital mechanics, and system health monitoring. Cinematic sci-fi aesthetic.
version = 1.0.0
```

- [ ] **Step 2: Write visualizations.conf**

One stanza per viz (8 total):

```ini
[signal_waveform]
label = Signal Waveform
description = Oscilloscope-style scrolling waveform for signal strength telemetry
default_height = 300
allow_user_selection = true
disabled = 0
search_fragment = | timechart span=1s avg(signal_dbm) as amplitude, avg(data_rate_kbps) as frequency

[radial_orbit]
label = Radial Orbit
description = Elliptical orbital path with position dot and afterglow trail
default_height = 400
allow_user_selection = true
disabled = 0
search_fragment = | stats latest(altitude_km) as alt, latest(velocity_kms) as vel, latest(orbit_phase_deg) as phase

[hex_health]
label = Hex Health Grid
description = Hexagonal honeycomb grid showing subsystem health with micro-sparklines
default_height = 400
allow_user_selection = true
disabled = 0
search_fragment = | stats latest(status) as status, sparkline(avg(health_pct),1h) as trend by subsystem

[kpi_orb]
label = KPI Orb
description = Glowing orb KPI tile with threshold-driven halo pulse
default_height = 180
allow_user_selection = true
disabled = 0
search_fragment = | stats latest(value) as value, latest(unit) as unit, latest(label) as label

[particle_timeline]
label = Particle Timeline
description = Luminous particle flow along time axis showing event severity and impact
default_height = 250
allow_user_selection = true
disabled = 0
search_fragment = | table _time, event_type, severity, impact_score

[radar_sweep]
label = Radar Sweep
description = Rotating polar radar display revealing ground stations and satellites
default_height = 400
allow_user_selection = true
disabled = 0
search_fragment = | table object_name, azimuth_deg, range_km, object_type

[arc_fuel]
label = Arc Fuel Meter
description = Multi-segment arc gauge showing delta-V fuel budget with burn markers
default_height = 350
allow_user_selection = true
disabled = 0
search_fragment = | stats latest(fuel_remaining_pct) as remaining, latest(burn1_pct) as burn1, latest(burn2_pct) as burn2

[alert_waterfall]
label = Alert Waterfall
description = Cascading alert feed with severity-tinted rows and active alert pulse
default_height = 400
allow_user_selection = true
disabled = 0
search_fragment = | table _time, alert_name, severity, subsystem, status
```

- [ ] **Step 3: Write transforms.conf**

```ini
[nasa_telemetry_signal]
filename = telemetry_signal.csv

[nasa_ground_stations]
filename = ground_stations.csv

[nasa_comm_events]
filename = comm_events.csv

[nasa_orbital_params]
filename = orbital_params.csv

[nasa_fuel_budget]
filename = fuel_budget.csv

[nasa_maneuver_events]
filename = maneuver_events.csv

[nasa_subsystem_health]
filename = subsystem_health.csv

[nasa_alerts]
filename = alerts.csv

[nasa_power_telemetry]
filename = power_telemetry.csv
```

- [ ] **Step 4: Write savedsearches.conf**

One saved search per viz type with `display.visualizations.custom.type = nasa_mission_control.{viz}` and key options pre-configured. Each uses `| inputlookup {lookup}.csv | ...` as the search.

- [ ] **Step 5: Write default/data/ui/nav/default.xml**

```xml
<nav search_view="search" color="#0A1628">
  <view name="nasa_mission_control_dashboard" default="true" />
</nav>
```

- [ ] **Step 6: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/default/
git commit -m "feat(nasa): add Splunk config files (app, vizs, transforms, savedsearches, nav)"
```

---

## Task 12: Generate Preview PNGs + App Icon

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/*/preview.png` (8 files)
- Create: `tests/test33_nasa/nasa_mission_control/static/appIcon.png`

- [ ] **Step 1: Generate preview PNGs**

Run `generate_assets.js` from the vp-viz scripts or create 300x200 PNG files with brand colors for each viz. Each preview must be >500 bytes. Use the NASA palette — deep space black background with cyan accent elements suggesting the viz shape.

```bash
SCRIPTS="plugins/splunk-viz-packs/skills/vp-viz/scripts"
APP="tests/test33_nasa/nasa_mission_control"
node "$SCRIPTS/generate_assets.js" "$APP"
```

If `generate_assets.js` doesn't auto-detect vizs, create PNGs manually using a Node canvas script or Python PIL.

- [ ] **Step 2: Generate appIcon.png**

36x36 PNG with NASA blue background (#0A1628) and cyan accent. Must be >100 bytes. Same script or manual creation.

- [ ] **Step 3: Verify assets**

```bash
for f in tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/*/preview.png; do
  size=$(wc -c < "$f")
  echo "$f: $size bytes"
done
ls -la tests/test33_nasa/nasa_mission_control/static/appIcon.png
```

All preview.png >500 bytes, appIcon.png >100 bytes.

- [ ] **Step 4: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/*/preview.png
git add tests/test33_nasa/nasa_mission_control/static/appIcon.png
git commit -m "feat(nasa): add preview PNGs and app icon"
```

---

## Task 13: Build + Validate

**Files:**
- Creates: `tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/*/visualization.js` (8 built bundles)

- [ ] **Step 1: Run build_flat.js**

```bash
node plugins/splunk-viz-packs/skills/vp-create/scripts/build_flat.js tests/test33_nasa/nasa_mission_control
```

Verify output: 8 `visualization.js` files created, each starting with `define([`.

- [ ] **Step 2: Run validate_viz.sh**

```bash
bash plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh tests/test33_nasa/nasa_mission_control
```

**Expected:** 0 FAIL results. WARNs acceptable (D08, D06, D02 are common false positives).

- [ ] **Step 3: Fix any FAILs**

If validate reports FAILs:
- `B10` (hardcoded namespace) → replace with `{{VIZ_NAMESPACE}}`
- `F3` (ES6 syntax) → convert to ES5
- `B20` (missing theme detection) → add `detectTheme()` call
- `B21` (missing null guards) → add `safeStr()`/`safeNum()` wrappers
- `B5` (missing section-label) → add `section-label=` to formatter forms
- `B7` (default= instead of value=) → change to `value=`

After fixes, re-run build + validate.

- [ ] **Step 4: Run contrast check**

```bash
node plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js tests/test33_nasa/nasa_mission_control/shared/theme.js
```

Verify light theme has WCAG-compliant contrast ratios.

- [ ] **Step 5: Commit built bundles**

```bash
git add tests/test33_nasa/nasa_mission_control/appserver/static/visualizations/*/visualization.js
git commit -m "feat(nasa): build AMD bundles — 8 vizs pass validation"
```

---

## Task 14: Write Dashboard Studio JSON

**Files:**
- Create: `tests/test33_nasa/nasa_mission_control/default/data/ui/views/nasa_mission_control_dashboard.xml`

**MUST LOAD** skills before writing dashboard JSON:
- `splunk-dashboard-studio:ds-ref-syntax` — JSON schema reference
- `splunk-dashboard-studio:ds-int-tabs` — tab layout schema
- `splunk-dashboard-studio:ds-int-drilldowns` — drilldown/setToken patterns
- `splunk-dashboard-studio:ds-int-tokens` — token binding
- `splunk-dashboard-studio:ds-int-inputs` — time picker + dropdown inputs
- `splunk-dashboard-studio:ds-int-defaults` — global defaults block
- `splunk-dashboard-studio:ds-ref-pitfalls` — common gotchas

- [ ] **Step 1: Write dashboard XML with embedded JSON**

Dashboard Studio v2 format:
```xml
<dashboard version="2" theme="dark">
  <label>NASA Mission Control</label>
  <definition><![CDATA[
    { ... full JSON definition ... }
  ]]></definition>
</dashboard>
```

JSON structure:
- **dataSources**: One `ds.search` per panel. Each queries `| inputlookup {lookup}.csv | ...`. Searches reference `$mission_filter$` and `$global_time.earliest$`/`$global_time.latest$` tokens.
- **inputs**: Global time picker + mission dropdown (ARTEMIS-II, ISS-EXP70, JWST, OSIRIS-APEX with "All" sentinel)
- **defaults**: Wire time picker to all searches via `defaults.dataSources.ds.search.options.queryParameters`
- **visualizations**: Each panel uses type `nasa_mission_control.{viz_name}` with options namespaced as `nasa_mission_control.{viz_name}.{option}`
- **layout**: Tabbed layout with 3 tabs (Telemetry, Orbital Mechanics, Systems Health)

Tab 1 — Telemetry (per spec section 4):
- 4x KPI Orb strip (Signal Lock dBm, Data Rate kbps, Latency ms, Bit Error Rate)
- Signal Waveform full-width hero
- Radar Sweep (left half) + Particle Timeline for comm events (right half)

Tab 2 — Orbital Mechanics:
- 4x KPI Orb strip (Altitude km, Velocity km/s, Inclination deg, Period min)
- Radial Orbit (left) + Arc Fuel Meter (right)
- Particle Timeline full-width for maneuver events

Tab 3 — Systems Health:
- 4x KPI Orb strip (Power Draw W, Thermal Avg °C, O2 Level %, Crew Status)
- Hex Health Grid (left) + Alert Waterfall (right)
- Signal Waveform full-width for power bus

**Drilldowns** (per spec):
- KPI Orb: `setToken` → `$selected_metric$`
- Hex cell: `setToken` → `$selected_subsystem$` → filters alert_waterfall search
- Radar dot: `linkToSearch` with station name
- Alert row: `linkToSearch` with alert details
- Orbit ring: `setToken` → `$selected_orbit$`

Each drilldown needs `defaults.tokens.default` with empty string fallback.

Canvas: `"width": 1920, "height": 1200` per tab minimum.

- [ ] **Step 2: Validate dashboard**

```bash
node plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js tests/test33_nasa/nasa_mission_control/default/data/ui/views/nasa_mission_control_dashboard.xml
```

Check: all viz types use `nasa_mission_control.{viz}` format, all data source refs resolve, all token refs resolve.

- [ ] **Step 3: Commit**

```bash
git add tests/test33_nasa/nasa_mission_control/default/data/ui/views/
git commit -m "feat(nasa): add 3-tab Dashboard Studio dashboard with drilldowns"
```

---

## Task 15: Package Tarball

**Files:**
- Creates: `tests/test33_nasa/nasa_mission_control.tar.gz`

- [ ] **Step 1: Final validation pass**

```bash
bash plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh tests/test33_nasa/nasa_mission_control
```

Confirm 0 FAILs.

- [ ] **Step 2: Create tarball**

```bash
cd tests/test33_nasa && COPYFILE_DISABLE=1 tar czf nasa_mission_control.tar.gz nasa_mission_control/
```

`COPYFILE_DISABLE=1` prevents macOS resource fork files from corrupting the Splunk install.

- [ ] **Step 3: Verify tarball contents**

```bash
tar tzf tests/test33_nasa/nasa_mission_control.tar.gz | head -30
tar tzf tests/test33_nasa/nasa_mission_control.tar.gz | wc -l
```

Expected: ~55+ files, no `._` resource fork files, all paths start with `nasa_mission_control/`.

- [ ] **Step 4: Final commit**

```bash
git add tests/test33_nasa/nasa_mission_control.tar.gz
git commit -m "feat(nasa): package nasa_mission_control.tar.gz — 8 vizs, 3-tab dashboard"
```

---

## Execution Order Summary

| Task | What | Depends on |
|------|------|-----------|
| 1 | Scaffold + theme.js | — |
| 2 | signal_waveform | 1 |
| 3 | radial_orbit | 1 |
| 4 | hex_health | 1 |
| 5 | kpi_orb | 1 |
| 6 | particle_timeline | 1 |
| 7 | radar_sweep | 1 |
| 8 | arc_fuel | 1 |
| 9 | alert_waterfall | 1 |
| 10 | Demo CSVs | — |
| 11 | Config files | — |
| 12 | Preview PNGs | 1 |
| 13 | Build + validate | 1-9 |
| 14 | Dashboard JSON | 10, 11, 13 |
| 15 | Package tarball | 13, 14 |

Tasks 2-9 can run in parallel after Task 1. Tasks 10-12 can run in parallel with 2-9. Task 13 gates on all viz code. Task 14 gates on config + data + build. Task 15 is the final gate.
