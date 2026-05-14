DESIGN BRIEF — jwst_viz_pack
=============================

Domain:       Space telescope mission operations — JWST
Tone:         Infinite · Precise · Awe-inspiring
Flavor:       Deep space observatory — dark vacuum with infrared spectrum accents,
              gold instrument highlights, hexagonal geometry as compositional motif
Fonts:        Oxanium (display — geometric, technical, space-age) + JetBrains Mono (data)
Dark palette:
  bg       = #06080F (void black — near-true-black with blue undertone)
  card     = #0D1117 (instrument panel)
  text     = #E8ECF1 (starlight white)
  dim      = rgba(232,236,241,0.45) (distant star)
  accent1  = #D4A537 (JWST mirror gold)
  accent2  = #00B4D8 (infrared cyan — short wavelength)
  accent3  = #E040A0 (infrared magenta — mid wavelength)
  danger   = #FF4D4D (alert red)
  success  = #34D399 (nominal green)
  muted    = rgba(232,236,241,0.08) (panel edge)
Light palette:
  bg       = #F0F2F5
  card     = #FFFFFF
  text     = #0D1117
  dim      = rgba(13,17,23,0.55)
  accent1  = #B8860B (darker gold for contrast on white)
  accent2  = #0077B6 (deeper cyan)
  accent3  = #C0307A (deeper magenta)
  danger   = #DC2626
  success  = #059669
  muted    = rgba(13,17,23,0.06)

INFRARED SPECTRUM RAMP (for heat grids, continuous data):
  cold     = #1B1464 (deep indigo — coldest)
  cool     = #00B4D8 (infrared cyan)
  warm     = #E040A0 (infrared magenta)
  hot      = #D4A537 (JWST gold)
  critical = #FF4D4D (alert red — overtemp)

VIZ INVENTORY (6 vizs)
-----------------------

1. jwst_heat_grid
   Category: Matrix
   Purpose: Sensor temperature monitoring across 6 instrument sensors over time
   Data contract:
     - sensor (string, required) — sensor name
     - _time (string, required) — time bucket
     - temperature (number, required) — Kelvin reading
     - threshold_low (number, optional) — nominal low bound
     - threshold_high (number, optional) — nominal high bound
   Settings:
     - valueField = "temperature"
     - categoryField = "sensor"
     - timeField = "_time"
     - colorRampLow = "#1B1464" (cold indigo)
     - colorRampMid = "#00B4D8" (cyan)
     - colorRampHigh = "#D4A537" (gold)
     - colorRampCritical = "#FF4D4D" (alert red)
     - minValue = "auto"
     - maxValue = "auto"
     - cellShape = "hexagon" (signature: hexagonal cells, not squares)
     - showValues = "true"
     - showTooltip = "true"
     - accentIntensity = 50
     - theme = "dark"
   Visual: Grid of hexagonal cells (JWST mirror motif) where rows = sensors,
   columns = time buckets. Cells filled with infrared spectrum ramp from cold
   indigo through cyan and magenta to gold. Critical temperatures glow red
   with subtle pulse. Hover highlights row + column crosshair with tooltip
   showing exact Kelvin reading and threshold proximity. Cell borders at 2%
   white opacity create a honeycomb lattice effect.

2. jwst_instrument_matrix
   Category: Status
   Purpose: NIRCam / NIRSpec / MIRI / FGS status with mode and health
   Data contract:
     - instrument (string, required) — instrument name
     - status (string, required) — "active" | "idle" | "calibration" | "error"
     - mode (string, optional) — current operating mode
     - uptime_pct (number, optional) — uptime percentage
   Settings:
     - instrumentField = "instrument"
     - statusField = "status"
     - modeField = "mode"
     - uptimeField = "uptime_pct"
     - activeColor = "#34D399"
     - idleColor = "#00B4D8"
     - calibrationColor = "#D4A537"
     - errorColor = "#FF4D4D"
     - showUptime = "true"
     - enableDrilldown = "true"
     - drilldownTokenName = "selected_instrument"
     - accentIntensity = 50
     - theme = "dark"
   Visual: 4 instrument cards in a 2×2 grid (NOT a flat table). Each card shows:
   instrument name (Oxanium, 16px bold), status indicator (pulsing dot for active,
   static for idle, oscillating for calibration, flashing for error), current mode
   in mono text, and a thin uptime bar at the bottom. Cards have hexagonal corner
   accents (top-left, bottom-right) to echo the mirror motif. Active instrument
   has subtle gold border glow. Click fires drilldown token. Selected card gets
   brighter gold accent border.

3. jwst_data_cascade
   Category: Flow (creative — NOT a progress bar)
   Purpose: Data download progression — GB transferred vs planned
   Data contract:
     - band (string, required) — frequency band or data channel name
     - transferred_gb (number, required) — GB already downloaded
     - planned_gb (number, required) — total GB planned
     - rate_mbps (number, optional) — current transfer rate
   Settings:
     - bandField = "band"
     - transferredField = "transferred_gb"
     - plannedField = "planned_gb"
     - rateField = "rate_mbps"
     - streamColor = "#00B4D8"
     - completedColor = "#D4A537"
     - pendingColor = "rgba(232,236,241,0.08)"
     - showRate = "true"
     - animateStreams = "true"
     - accentIntensity = 50
     - theme = "dark"
   Visual: Vertical cascade waterfall — each data band rendered as a horizontal
   stream flowing from left (satellite) to right (ground station). Transferred
   portion is a luminous cyan-to-gold gradient stream with particle effects
   (tiny dots flowing along the stream like data packets). Remaining portion
   is a dim dotted trail. Stream width = proportional to planned_gb. Current
   rate shown as particle speed (faster = higher rate). Think of data "raining
   down" from space — each band is a parallel stream in the cascade.
   Total progress shown as aggregated gold text at bottom.

4. jwst_observation_queue
   Category: Ranking / Time
   Purpose: Next 5 observation targets with priority and estimated time
   Data contract:
     - target_name (string, required) — celestial object name
     - priority (number, required) — 1-5 priority level
     - estimated_hours (number, required) — observation duration
     - ra (string, optional) — right ascension
     - dec (string, optional) — declination
     - instrument (string, optional) — assigned instrument
     - status (string, optional) — "queued" | "in_progress" | "completed"
   Settings:
     - targetField = "target_name"
     - priorityField = "priority"
     - durationField = "estimated_hours"
     - instrumentField = "instrument"
     - statusField = "status"
     - priorityHighColor = "#D4A537"
     - priorityMedColor = "#00B4D8"
     - priorityLowColor = "rgba(232,236,241,0.30)"
     - inProgressColor = "#E040A0"
     - maxItems = 5
     - showInstrument = "true"
     - accentIntensity = 50
     - theme = "dark"
   Visual: Vertical stack of observation slots — NOT a plain table. Each slot
   is a horizontal card with: priority diamond indicator on the left (gold=high,
   cyan=medium, dim=low), target name in Oxanium display font, duration as
   a thin timeline bar, and assigned instrument badge on the right. The current
   "in_progress" observation has a glowing magenta left border and animated
   scan line effect. Completed observations are dimmed. Cards are staggered
   slightly (2px indent per row) to create a queue depth illusion.

5. jwst_power_horizon
   Category: Chart (horizon chart variant)
   Purpose: Solar panel generation vs instrument consumption over time
   Data contract:
     - _time (string, required) — timestamp
     - solar_watts (number, required) — power generated
     - consumption_watts (number, required) — power consumed
     - battery_pct (number, optional) — battery charge percentage
   Settings:
     - timeField = "_time"
     - generationField = "solar_watts"
     - consumptionField = "consumption_watts"
     - batteryField = "battery_pct"
     - generationColor = "#D4A537" (gold — solar)
     - consumptionColor = "#E040A0" (magenta — draw)
     - surplusColor = "#34D399" (green — positive balance)
     - deficitColor = "#FF4D4D" (red — negative balance)
     - showBattery = "true"
     - showBalance = "true"
     - smoothing = "true"
     - accentIntensity = 50
     - theme = "dark"
   Visual: Dual-layer area chart with the balance zone between them. Gold
   area (solar generation) flows from above, magenta area (consumption)
   rises from below. Where gold > magenta, the gap is tinted green (surplus).
   Where magenta > gold, gap tints red (deficit). A thin gold line traces
   battery percentage as a secondary axis on the right. The areas have
   subtle gradient fills (solid at base, fading to transparent at extremes)
   creating a "heat signature" look. Hover shows crosshair with exact
   wattage values and balance delta.

6. jwst_kpi_tile
   Category: KPI
   Purpose: Single value display for key metrics (temperatures, data rates, etc.)
   Data contract:
     - value (number, required) — the metric value
     - label (string, optional) — metric name
     - unit (string, optional) — unit of measurement
     - trend (number, optional) — delta from previous period
     - sparkline (string, optional) — comma-separated historical values
     - threshold_warning (number, optional) — warning threshold
     - threshold_critical (number, optional) — critical threshold
   Settings:
     - valueField = "value"
     - labelField = "label"
     - unitField = "unit"
     - trendField = "trend"
     - sparklineField = "sparkline"
     - warningThreshold = ""
     - criticalThreshold = ""
     - valueDecimals = "1"
     - valueSize = "hero" (hero=48px / large=36px / medium=24px / small=18px)
     - showSparkline = "true"
     - showTrend = "true"
     - sparklineColor = "#00B4D8"
     - normalColor = "#E8ECF1"
     - warningColor = "#D4A537"
     - criticalColor = "#FF4D4D"
     - hexAccent = "true" (draws a small hexagonal accent in top-right corner)
     - accentIntensity = 50
     - theme = "dark"
   Visual: Clean KPI tile with the value in Oxanium at configurable size.
   Unit in JetBrains Mono at 40% opacity beside the value. Label below in
   mono at 30% opacity uppercase. Optional sparkline rendered as a thin
   cyan line at the bottom third of the tile. Trend delta shown as small
   arrow + percentage. When thresholds are breached: warning turns value
   gold, critical turns value red with subtle glow. Hexagonal accent in
   top-right corner (4px side, 15% opacity gold) ties it to JWST identity.


THEME TOKENS (theme.js)
------------------------
// Brand
brandName: "JWST Mission Operations"
brandAccent: "#D4A537"

// Dark
dark.bg: "#06080F"
dark.card: "#0D1117"
dark.text: "#E8ECF1"
dark.dim: "rgba(232,236,241,0.45)"
dark.muted: "rgba(232,236,241,0.08)"
dark.gold: "#D4A537"
dark.cyan: "#00B4D8"
dark.magenta: "#E040A0"
dark.green: "#34D399"
dark.red: "#FF4D4D"
dark.indigo: "#1B1464"

// Light
light.bg: "#F0F2F5"
light.card: "#FFFFFF"
light.text: "#0D1117"
light.dim: "rgba(13,17,23,0.55)"
light.muted: "rgba(13,17,23,0.06)"
light.gold: "#B8860B"
light.cyan: "#0077B6"
light.magenta: "#C0307A"
light.green: "#059669"
light.red: "#DC2626"
light.indigo: "#1B1464"

// Infrared ramp
ramp: ["#1B1464", "#00B4D8", "#E040A0", "#D4A537", "#FF4D4D"]

// Chrome
panelChrome: "hexAccent" — thin 1px border at 4% white opacity,
  hexagonal corner notches (4px) at top-left and bottom-right corners,
  NO rounded corners (rx:0), NO shadow. Panels feel flush with the void.
panelHighlight: gold glow at 15% opacity when selected/hovered

// Typography
fontDisplay: "Oxanium"
fontMono: "JetBrains Mono"

STANDARD SETTINGS (every viz gets these)
-----------------------------------------
accentIntensity: 0-100 (default 50) — glow/accent effect strength
theme: dark|light (default dark)
backgroundColor: transparent (set via Dashboard Studio panel option)

IMAGE ASSETS
-------------
hero_jwst.jpg: JWST deep field image (Pillars of Creation or similar)
  → download to appserver/static/images/hero_jwst.jpg
  Source: NASA public domain imagery (images.nasa.gov)
logo_jwst.svg: JWST mission logo
  → download to appserver/static/images/logo_jwst.svg
  Source: NASA public domain

FONT EMBEDDING
--------------
Oxanium Regular + Bold: Google Fonts → woff2 → base64
  Estimated: ~45KB per weight = ~90KB total
JetBrains Mono Regular: Google Fonts → woff2 → base64
  Estimated: ~55KB
Total CSS size: ~145KB (well under 800KB ceiling)

CSV LOOKUP FILES
-----------------
All demo data via CSV lookups in lookups/ directory:
  sensor_temperatures.csv — 6 sensors × 24 time buckets (144 rows)
  instrument_status.csv — 4 instruments with status, mode, uptime
  data_downloads.csv — 5 data bands with transferred/planned GB
  observation_queue.csv — 5 targets with priority, duration, instrument
  power_balance.csv — 48 time points with solar/consumption/battery
  kpi_summary.csv — 6 key metrics with sparkline history

DASHBOARD LAYOUT
-----------------
Asymmetric 70/30 — total canvas 1440×960

Zone 1 — HERO (full width, top 45%)
  Hero JWST image with #06080F overlay at 35% opacity
  JWST logo top-left, mission title top-right
  2 hero KPI tiles floating on the image (semi-transparent cards)

Zone 2 — PRIMARY (70% left, bottom 55%)
  Heat grid (sensor temperatures) — large, dominant
  Power horizon chart below the heat grid

Zone 3 — SECONDARY (30% right, bottom 55%)
  Instrument status matrix (2×2)
  Data cascade (download streams)
  Observation queue (stacked)

Layout creates F-reading pattern: hero image catches eye,
left column provides the operational data, right column
provides status-at-a-glance.

DRILLDOWN BEHAVIOR
-------------------
Instrument matrix: click sets $selected_instrument$ token
  → filters heat grid to show only that instrument's sensors
  → filters power horizon to show that instrument's consumption
  → updates KPI tiles to show instrument-specific metrics

DESIGN SCORING (pre-build)
---------------------------
Visual hierarchy:    8/10 — hero image + 48px KPI vs 11px labels = 4.4:1 ratio
Whitespace quality:  8/10 — dense within zones, 32px between, 48px between major
Brand distinctiveness: 9/10 — hexagonal cells, infrared ramp, gold accents, deep field
Emotional resonance: 9/10 — "that's a space dashboard" reaction from the hero image
Average: 8.5/10 ✓ (minimum 7.0)

ANTI-AI CHECKLIST (pre-build)
------------------------------
1. Uniform spacing    → NO: 8px within groups, 24px between panels, 48px between zones
2. Symmetric layout   → NO: 70/30 asymmetry
3. Same-size values   → NO: hero 48px, body 18px, whisper 11px (4.4:1 ratio)
4. Rainbow variety    → NO: gold + cyan + magenta only, rest neutral
5. Everything centered → NO: left-align data, right-align numbers
6. Flat depth         → NO: hero bg → mid panels → foreground data (3 layers)
7. Generic chrome     → NO: hexagonal corner notches, flush panels
8. No visual anchor   → NO: hero JWST deep field image
9. Overcomplete       → NO: 6 vizs, each with clear purpose
10. Solid-color banner → NO: hero image with gradient overlay
11. No tension        → NO: 48px hero vs 11px labels, dense matrix vs spacious hero
AI tells present: 0/11 ✓ PASS
