# Domain Templates + Layout Archetypes

## Contents
- Domain viz inventories (F1, SOC, Retail, Healthcare, NOC, Energy) — includes multi-channel archetypes
- Layout archetypes (5 types)
- Canvas complexity gate
- Anti-patterns (design-level)

## Domain viz inventories

Starting points — analyze the actual data before choosing.

### F1 Racing

**Domain visual language:** F1 engineers recognize lap-time deltas as color-coded delta arrows, tyre compounds as colored circles, and ERS charge as a vertical fill gauge styled like a capacitor. Sector highlights on a circuit outline are expected — they encode time-loss by track position. Generic bar charts feel wrong here: time is spatial, not ranked.

| Viz | Purpose |
|---|---|
| single_value_tile | Lap time, gap to leader, pit window |
| ers_gauge | Energy recovery system charge level |
| tyre_compound | Compound indicator with deg gradient |
| position_board | Grid/race position with delta arrows |
| lap_ticker | Live scrolling lap-by-lap feed |
| track_info | Circuit outline with sector highlights |
| telemetry_channels | Stacked throttle/brake/speed/gear/ERS synchronized time view (Multi-Channel Composite) |

Data for domain-unique F1 Racing entries:
- `telemetry_channels`: `_time + throttle + brake + speed + gear + ers`
  - Channel config: `channels=throttle,brake,speed,gear,ers`, `channelLabels=Throttle %,Brake %,Speed km/h,Gear,ERS %`, `channelTypes=area,area,line,step,area`
  - Y-scale ranges: Throttle 0–100, Brake 0–100, Speed 0–350, Gear 1–8 (discrete step), ERS 0–100
  - (no generic equivalent) — synchronized multi-channel stacked view is specific to telemetry analysis

### SOC / Security

**Domain visual language:** Security analysts recognize MITRE ATT&CK stage flow as a horizontal band chart, severity heatmaps as tactic-by-severity grids, and kill-chain progression as a left-to-right pipeline. Departure from these conventions signals unfamiliarity with the domain. Dwell time (detection gap in days) is a domain-specific KPI with no consumer analogue.

| Viz | Purpose |
|---|---|
| single_value_tile | Alert count, MTTD, MTTR |
| threat_gauge | Risk score against threshold bands |
| attack_flow | Kill chain / MITRE stage progression |
| severity_board | Stacked severity lanes with counts |
| alert_ticker | Scrolling real-time alert feed |
| risk_radar | Polar plot of risk dimensions |
| kill_chain_stage_flow | Stage band chart with fixed MITRE ordering (Recon through Act), band width = alert volume (no generic equivalent) |
| threat_tactic_heatmap | MITRE ATT&CK tactic (x) by severity (y) cell grid, tactic ordering fixed to ATT&CK spec (no generic equivalent) |
| dwell_time_histogram | Detection gap distribution in days, log-scale x-axis (no generic equivalent) |

Data for domain-unique SOC entries:
- `kill_chain_stage_flow`: `stage + count`
- `threat_tactic_heatmap`: `tactic + severity + count`
- `dwell_time_histogram`: `dwell_days + count`

### Retail / E-commerce

**Domain visual language:** Retail analysts expect conversion funnels with labeled drop-off percentages, basket composition as a ring chart, and store/region performance as a heatmap grid. Revenue-vs-target fill gauges are standard operating procedure. Generic time-series charts without reference lines are considered incomplete.

| Viz | Purpose |
|---|---|
| single_value_tile | Revenue, AOV, conversion rate |
| revenue_gauge | Revenue vs target fill |
| conversion_funnel | Step-by-step drop-off |
| basket_donut | Category composition ring |
| store_heatmap | Floor/region performance grid |
| live_ticker | Real-time transaction feed |

### Healthcare

**Domain visual language:** Clinical staff recognize bed-occupancy as horizontal fill bars per ward, patient flow as a directional pipeline (ED to ward to ICU to discharge), and vital signs as a sparkline matrix (rows=patients, columns=vitals). Monitors and departure-board patterns are familiar from bedside equipment. Triage category colors (green/yellow/orange/red) are a clinical standard — deviation from them causes confusion.

| Viz | Purpose |
|---|---|
| single_value_tile | Wait time, bed count, patient volume |
| triage_gauge | Capacity vs threshold |
| bed_occupancy | Ward-level fill bars |
| patient_flow | Admission/discharge/transfer pipeline |
| wait_ticker | Live queue progression |
| department_board | Multi-department status lanes |
| ward_occupancy_bars | Bar per ward, fill=occupancy%, reference line=target capacity, zone colors (no generic equivalent) |
| vital_sparkline_matrix | Grid: patient rows x vital columns (HR, SpO2, BP, Temp), each cell a sparkline (no generic equivalent) |
| triage_horizon | Horizon chart of wait time by triage category over the day (no generic equivalent) |
| vital_signs_monitor | Stacked HR/SpO2/RR/BP synchronized patient monitoring (Multi-Channel Composite) |

Data for domain-unique Healthcare entries:
- `ward_occupancy_bars`: `ward + occupied + capacity`
- `vital_sparkline_matrix`: `patient_id + hr + spo2 + bp + temp + _time`
- `triage_horizon`: `hour + triage_cat + avg_wait_min`
- `vital_signs_monitor`: `_time + heart_rate + spo2 + resp_rate + bp_systolic + bp_diastolic`
  - Channel config: `channels=heart_rate,spo2,resp_rate,bp_systolic`, `channelLabels=Heart Rate (bpm),SpO2 (%),Resp Rate (/min),Blood Pressure (mmHg)`, `channelTypes=line,line,line,line`
  - Y-scale ranges: HR 40–200, SpO2 85–100 (narrow band with alarm threshold at 92%), RR 5–40, BP 60–200
  - BP renders as dual line (systolic + diastolic) within a single channel strip — `bp_diastolic` drawn as a second line in the same strip using a lighter shade of the channel color
  - (no generic equivalent) — synchronized patient vital waveforms are specific to clinical monitoring

### Infrastructure / NOC

**Domain visual language:** NOC operators read service health as color-coded status grids (green/amber/red), latency as sparklines with threshold bands, and incident queues as scrolling tickers. Topology maps are expected but Canvas 2D force-directed layout is overambitious — use a status grid proxy instead. Time-series charts without threshold lines feel unfinished to an on-call engineer.

| Viz | Purpose |
|---|---|
| single_value_tile | Uptime, latency, error rate |
| resource_gauge | CPU/memory/disk ring gauge |
| pipeline_flow | CI/CD or data pipeline stages |
| service_board | Service health status grid |
| incident_ticker | Scrolling incident feed |
| topology_map | Node-edge service topology |
| network_channels | Stacked throughput/latency/errors/CPU synchronized NOC view (Multi-Channel Composite) |

Data for domain-unique Infrastructure / NOC entries:
- `network_channels`: `_time + throughput_mbps + latency_ms + error_rate_pct + cpu_pct`
  - Channel config: `channels=throughput_mbps,latency_ms,error_rate_pct,cpu_pct`, `channelLabels=Throughput (Mbps),Latency (ms),Error Rate (%),CPU (%)`, `channelTypes=area,line,line,area`
  - Y-scale ranges: Throughput 0–auto (auto-scale from data max), Latency 0–auto (with threshold band at SLA value), Error Rate 0–10, CPU 0–100
  - Latency channel shows a threshold band (horizontal shaded region) at the SLA threshold value — configurable via formatter setting
  - (no generic equivalent) — synchronized network metrics stack is specific to NOC analysis

### Energy / Utilities

**Domain visual language:** Energy operators recognize generation-mix as directional flows from source to load, grid frequency as a band chart with tolerance zones, and state-of-charge as battery-shaped fill indicators. Arrow directionality is critical — energy flows have direction. The ±0.2Hz amber and ±0.5Hz red frequency bands are operational standards; a line chart without those bands fails the domain expectation.

| Viz | Purpose |
|---|---|
| single_value_tile | Generation output MW, grid frequency Hz, load factor % |
| soc_thermometer | Battery state-of-charge vertical fill bar with segmented fill (no generic equivalent) |
| grid_frequency_band | Frequency deviation chart with colored tolerance bands at +/-0.2Hz and +/-0.5Hz (no generic equivalent) |
| generation_mix_bars | Source-to-load generation breakdown as horizontal bars with directional arrow indicators (no generic equivalent) |
| asset_health_grid | Spatial grid with assets in fixed positions, color-coded by health status |
| power_horizon | Time-series power output with area fill |

Data for domain-unique Energy entries:
- `soc_thermometer`: `soc_pct`
- `grid_frequency_band`: `_time + freq_hz`
- `generation_mix_bars`: `source + destination + mwh`

Note: `generation_mix_bars` is a proxy for Sankey flow diagrams. Sankey requires crossing-line layout algorithms and is classified Overambitious — use horizontal bars with directional arrow indicators instead.

## Layout archetypes

### Full-bleed hero
Large background image (60-70% of viewport), KPIs overlaid with
semi-transparent panels (85-92% opacity). Brand impact is immediate.
Works for executive summaries and showcase dashboards.

### Strip banner
Thin brand bar at top (64-80px): logo + title + accent line.
Maximum space for data. Most versatile — works for any dashboard.
Use infographic_shapes (gradient) or splunk.image for the strip.
NEVER a solid splunk.rectangle banner (anti-pattern).

### Side hero
Vertical brand column on left (20-30% width) with logo and nav.
Data panels fill the right 70-80%. Works for master-detail layouts.

### No hero
Data starts at the top. Brand expressed through color tokens and
typography only. Maximizes data density. Best for NOC walls and
analyst consoles.

### Split screen
50/50 or 60/40 horizontal split. One side is a hero visual (map,
diagram, large gauge), other side is detail data. Works when one
viz IS the story and everything else is context.

## Canvas complexity gate

Before adding a domain-specific viz type to the inventory, classify its rendering complexity:

| Tier | Characteristics | Decision |
|---|---|---|
| **Renderable** | Iterates rows, draws primitives (rect, arc, line, text) | Proceed |
| **Stretched** | Coordinate transform math or state machine | Proceed with caution — keep draw code under 200 lines |
| **Overambitious** | Graph layout, physics simulation, recursive algorithms | Reject — use proxy pattern |

**Proxy patterns for overambitious types:**
- Topology map -> Status health grid with hop-count encoded as cell size
- Force-directed graph -> Node list with connection count as a bar
- Sankey flow -> Horizontal bar list with flow amounts as widths (no crossing logic)
- Geospatial grid -> Regional heatmap with fixed rows/columns (no geo projection)
- Candlestick -> Stacked horizontal bar (high-low range) with open-close marker

**Warning signs in the design brief:** If the viz description includes "layout algorithm," "force-directed," "physics simulation," "recursive," or "projection" — treat as overambitious and apply a proxy pattern immediately.

## Design anti-patterns

- Don't copy vizs between brands and swap colors — each brand gets unique _render() code
- Don't use built-in Splunk vizs for data panels — custom Canvas vizs are the point
- Don't embed 5 fonts — 2 maximum (data + ui)
- Don't hardcode field names — make configurable via formatter
- Don't use solid-color rectangle banners — use gradient (infographic_shapes) or image
- Don't ship without hover tooltips on every data viz
- Don't skip brand research — generic = forgettable
- Download real logos — don't draw SVG approximations
