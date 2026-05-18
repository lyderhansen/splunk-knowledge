# NASA Mission Control Viz Pack — Design Spec

**App ID:** `nasa_mission_control`
**Pack size:** 8 vizs + 3-tab Dashboard Studio dashboard
**Aesthetic:** Cinematic sci-fi realism
**Tone words:** Cinematic, Dramatic, Vigilant
**Test directory:** `tests/test33_nasa/`

## 1. Brand Identity & Palette

### Dark Theme (primary)

| Token | Hex | Role |
|-------|-----|------|
| `bg` | `#05080F` | Deep space black |
| `panel` | `#0A1628` | Midnight blue glass panels |
| `panelHi` | `#0F1F35` | Elevated/hover panel state |
| `edge` | `rgba(0,180,255,0.08)` | Faint cyan border glow |
| `edgeStrong` | `rgba(0,180,255,0.20)` | Emphasized border glow |
| `grid` | `rgba(0,180,255,0.04)` | Subtle grid lines |
| `text` | `#E8ECF4` | Primary text — slightly blue-white |
| `textDim` | `#7B8BA4` | Secondary labels |
| `textFaint` | `#3D4C63` | Tertiary/whisper text |
| `s1` | `#00B4FF` | Electric cyan — primary telemetry |
| `s2` | `#00E5A0` | Signal green — acquisition lock |
| `s3` | `#FF6B35` | Reentry orange — thrust/fuel |
| `s4` | `#C084FC` | Purple — orbital mechanics |
| `s5` | `#FACC15` | Warning amber |
| `accent` | `#00B4FF` | Glow, hover, sweep line |
| `success` | `#00E5A0` | Nominal |
| `warn` | `#FACC15` | Caution, degraded |
| `danger` | `#FF3B5C` | Critical, loss of signal |

### Light Theme (independently designed)

| Token | Hex | Role |
|-------|-----|------|
| `bg` | `#F0F2F7` | Cool grey-white |
| `panel` | `#FFFFFF` | Clean white cards |
| `panelHi` | `#E8ECF4` | Hover state |
| `text` | `#0A1628` | Full contrast dark |
| `textDim` | `#5A6A82` | Secondary |
| `accent` | `#0066CC` | Deeper blue for WCAG on white |
| `danger` | `#CC2244` | Darkened for contrast |

## 2. Typography & Visual Language

### Fonts

| Role | Font | Rationale |
|------|------|-----------|
| Data/numbers | `"SF Mono", "Menlo", monospace` | Monospaced digits align in telemetry readouts |
| Labels/UI | `"Helvetica Neue", "Arial", sans-serif` | Clean, technical, NASA-grade |

### Visual Language Schema

| Property | Value |
|----------|-------|
| `cornerRadius` | 2-4px |
| `fillTechnique` | Gradient glass + glow bleed |
| `strokeStyle` | 1px solid with shadowBlur 6-12 |
| `spacing` | 8px grid, 16px gutters |
| `shadowDepth` | Medium-heavy on active, none on static |
| `dataPresentation` | Animated continuous |

### Glow System

- Active data: `shadowBlur: 8-16`, series color at 40% alpha
- Critical alert: `shadowBlur: 8-24` pulsing, danger color
- Hover: `shadowBlur` +4, element brightens 10%
- Static/background: no glow

### Continuous Animation Safety

| Viz | Loop type | Safety mechanism |
|-----|-----------|-----------------|
| Signal Waveform | Continuous redraw | Downsample to canvas width (max 800 points) |
| Polar Radar Sweep | Continuous rotation | IntersectionObserver pause when off-screen |
| Particle Timeline | Continuous flow | Ring buffer, 200 particles max |
| KPI Orb | Pulse on critical only | Stops when value exits danger zone |
| Others | Render-on-data-change | No continuous loop |

## 3. Viz Inventory

### 3.1 `signal_waveform` — Oscilloscope

Scrolling sine wave trace. Amplitude = signal strength (dBm), frequency = data rate. Noise floor threshold line. CRT phosphor glow.

**Data:** `| timechart span=1s avg(signal_dbm) as amplitude, avg(data_rate_kbps) as frequency`

**Rendering:** `ctx.quadraticCurveTo` for smooth curves. Phosphor-green trace (s2) with shadowBlur 12. Faint 5x5 grid. Continuous scroll animation with interpolation between data updates.

**Controls (14):** `amplitudeField`, `frequencyField`, `noiseFloor`, `traceColor`, `traceWidth`, `showGrid`, `gridOpacity`, `scrollSpeed`, `drilldownField`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

### 3.2 `radial_orbit` — Orbital Path Ring

Elliptical orbit with position dot + trailing afterglow arc. Periapsis/apoapsis markers. Center body as gradient sphere.

**Data:** `| stats latest(altitude_km) as alt, latest(velocity_kms) as vel, latest(orbit_phase_deg) as phase, latest(periapsis_km) as peri, latest(apoapsis_km) as apo`

**Rendering:** `ctx.ellipse()` stroke. Position dot at current phase angle with shadowBlur 16. 30-degree trail arc with gradient-to-transparent. Center body as radial gradient. Altitude/velocity readouts in monospace below.

**Controls (16):** `phaseField`, `altitudeField`, `velocityField`, `periapsisField`, `apoapsisField`, `orbitColor`, `trailLength`, `bodyColor`, `bodyLabel`, `showReadouts`, `drilldownField`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

### 3.3 `hex_health` — Hexagonal Subsystem Grid

Honeycomb grid of subsystem cells. Fill color = severity. Interior micro-sparkline shows recent trend.

**Data:** `| stats latest(status) as status, sparkline(avg(health_pct), 1h) as trend by subsystem`

**Rendering:** Hexagons in honeycomb auto-layout. Severity color at 20% alpha fill, 80% alpha stroke. Center label (bold, small caps). Bottom-half 24-point sparkline polyline. Critical hex gets pulsing border glow.

**Controls (14):** `subsystemField`, `statusField`, `sparklineField`, `nominalColor`, `warnColor`, `criticalColor`, `hexSize`, `showLabels`, `showSparkline`, `drilldownField`, `themeMode`, `showEntrance`, `flashCritical`, `animationSpeed`

### 3.4 `kpi_orb` — Glowing KPI Sphere

Luminous orb for hero metrics. Inner glow shifts with value. Pulsing halo ring on threshold breach.

**Data:** `| stats latest(value) as value, latest(unit) as unit, latest(label) as label`

**Rendering:** Outer ring thin stroke. Inner radial gradient from accent to transparent. Large monospaced value centered. Threshold breach triggers halo ring with pulsing shadowBlur 8-24. Entrance: easeOutBack scale for subtle bounce.

**Controls (16):** `valueField`, `unitField`, `labelField`, `warnThreshold`, `criticalThreshold`, `orbColor`, `orbSize`, `showUnit`, `showLabel`, `showHalo`, `decimals`, `drilldownField`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

### 3.5 `particle_timeline` — Event Particle Flow

Events as luminous particles flowing along horizontal time axis. Color = severity. Size = impact.

**Data:** `| table _time, event_type, severity, impact_score`

**Rendering:** Horizontal time axis with tick marks. Each event spawns a particle. Particles drift rightward, fade at trailing edge. Ring buffer max 200 particles. Optional lane mode by event_type. Hover enlarges nearest particle with tooltip.

**Controls (16):** `timeField`, `eventField`, `severityField`, `impactField`, `maxParticles`, `particleSize`, `flowSpeed`, `showAxis`, `showLabels`, `laneMode`, `drilldownField`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

### 3.6 `radar_sweep` — Polar Radar Display

Rotating sweep line on polar grid revealing data points. Classic radar aesthetic.

**Data:** `| table object_name, azimuth_deg, range_km, object_type`

**Rendering:** Concentric range circles + radial angle lines in faint cyan. Bright cyan sweep line rotating clockwise. Data points appear as bright dots when sweep passes, fade over ~5 seconds. Semi-transparent wedge trail behind sweep. Center label configurable. IntersectionObserver pauses rotation off-screen.

**Controls (16):** `nameField`, `azimuthField`, `rangeField`, `typeField`, `sweepSpeed`, `sweepColor`, `fadeTime`, `showGrid`, `showRangeLabels`, `centerLabel`, `maxRange`, `drilldownField`, `themeMode`, `showEntrance`, `showHoverEffect`, `animationSpeed`

### 3.7 `arc_fuel` — Multi-Segment Fuel Budget Arc

270-degree arc gauge showing fuel/delta-V budget with sequential burn segments.

**Data:** `| stats latest(fuel_remaining_pct) as remaining, latest(burn1_pct) as burn1, latest(burn2_pct) as burn2, latest(burn3_pct) as burn3`

**Rendering:** 270-degree arc (135 to 405 degrees). Consumed burns as sequential orange-toned segments from left. Remaining fuel as bright cyan/green segment. Below reserve threshold: danger red with pulse. Burn labels along outside of each segment. Center numeric readout. Entrance: segments grow sequentially with staggered timing.

**Controls (16):** `remainingField`, `burn1Field`, `burn2Field`, `burn3Field`, `maxBurns`, `burnLabels`, `reserveThreshold`, `arcWidth`, `remainingColor`, `burnColor`, `reserveColor`, `showLabels`, `drilldownField`, `themeMode`, `showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`

### 3.8 `alert_waterfall` — Cascading Alert Feed

Alert events cascading from top. Severity-tinted rows. Active alerts pulse. Scrollable.

**Data:** `| table _time, alert_name, severity, subsystem, status`

**Rendering:** Full-width rows with 4px severity-tinted left border. Timestamp (mono, dim) | alert name (bold) | subsystem (dim) | severity badge. Active alerts: background alpha oscillation 0.05-0.15. Entrance: rows cascade in with staggered 50ms delay. Mousewheel scroll when rows exceed canvas height.

**Controls (14):** `timeField`, `alertField`, `severityField`, `subsystemField`, `statusField`, `maxRows`, `sortOrder`, `showTimestamp`, `activeGlow`, `drilldownField`, `themeMode`, `showEntrance`, `flashCritical`, `animationSpeed`

## 4. Dashboard Layout

Three tabs. Canvas minimum 1920x1080.

### Tab 1: Telemetry

| Row | Left | Right |
|-----|------|-------|
| KPI strip | 4x KPI Orb: Signal Lock, Data Rate, Latency, Bit Error Rate | |
| Hero | Signal Waveform (full width) — live signal trace | |
| Bottom | Radar Sweep — ground station tracking | Particle Timeline — AOS/LOS comm events |

### Tab 2: Orbital Mechanics

| Row | Left | Right |
|-----|------|-------|
| KPI strip | 4x KPI Orb: Altitude, Velocity, Inclination, Orbit Period | |
| Main | Radial Orbit Ring — current orbital path | Arc Fuel Meter — delta-V budget |
| Bottom | Particle Timeline (full width) — maneuver event history | |

### Tab 3: Systems Health

| Row | Left | Right |
|-----|------|-------|
| KPI strip | 4x KPI Orb: Power Draw, Thermal Avg, O2 Level, Crew Status | |
| Main | Hex Health Grid — subsystem honeycomb | Alert Waterfall — cascading alerts |
| Bottom | Signal Waveform (full width) — power bus voltage telemetry | |

### Drilldowns

| Source | Action | Token/Target |
|--------|--------|-------------|
| KPI Orb click | setToken | `$selected_metric$` filters waveform/timeline |
| Hex cell click | setToken | `$selected_subsystem$` filters alert waterfall |
| Radar dot click | linkToSearch | Ground station comm log |
| Alert row click | linkToSearch | Full alert event detail |
| Orbit ring click | setToken | `$selected_orbit$` updates fuel meter |

### Global Inputs

- Time picker wired via `defaults`
- Mission dropdown: `ARTEMIS-II`, `ISS-EXP70`, `JWST`, `OSIRIS-APEX`

## 5. Demo Data

CSV lookups with realistic NASA telemetry values.

| CSV | Rows | Key fields |
|-----|------|-----------|
| `telemetry_signal.csv` | 500 | `_time, signal_dbm, data_rate_kbps, noise_floor, mission_id` |
| `ground_stations.csv` | 12 | `station_name, azimuth_deg, range_km, station_type, status` |
| `comm_events.csv` | 200 | `_time, event_type, severity, station, duration_min, mission_id` |
| `orbital_params.csv` | 100 | `_time, altitude_km, velocity_kms, orbit_phase_deg, periapsis_km, apoapsis_km, inclination_deg, period_min, mission_id` |
| `fuel_budget.csv` | 10 | `mission_id, fuel_remaining_pct, burn1_pct, burn2_pct, burn3_pct, burn1_label, burn2_label, burn3_label` |
| `maneuver_events.csv` | 150 | `_time, event_type, severity, impact_score, burn_name, mission_id` |
| `subsystem_health.csv` | 80 | `_time, subsystem, status, health_pct, mission_id` |
| `alerts.csv` | 100 | `_time, alert_name, severity, subsystem, status, mission_id` |
| `power_telemetry.csv` | 300 | `_time, voltage, current_amps, bus_id, mission_id` |

Subsystems: COMM, PROP, ECLSS, GNC, PWR, THERMAL, NAV, DATA.
Missions: ARTEMIS-II, ISS-EXP70, JWST, OSIRIS-APEX.
Ground stations: Goldstone, Canberra, Madrid (DSN), White Sands, Guam, Wallops.
Signal dBm range: -40 (strong) to -120 (LOS), noise floor at -100.
Orbital altitude: 200-400km (LEO), 360,000km (lunar).

## 6. Build Pipeline

```
vp-init → vp-design (this spec) → vp-viz x8 (inline) → build_flat.js → vp-create → validate_viz.sh → tar.gz
```

All viz code inline in main context. No subagent dispatch.
Output directory: `tests/test33_nasa/nasa_mission_control/`
