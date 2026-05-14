# Domain Templates + Layout Archetypes

## Contents
- Domain viz inventories (F1, SOC, Retail, Healthcare, NOC)
- Layout archetypes (5 types)
- Anti-patterns (design-level)

## Domain viz inventories

Starting points — analyze the actual data before choosing.

### F1 Racing
| Viz | Purpose |
|---|---|
| single_value_tile | Lap time, gap to leader, pit window |
| ers_gauge | Energy recovery system charge level |
| tyre_compound | Compound indicator with deg gradient |
| position_board | Grid/race position with delta arrows |
| lap_ticker | Live scrolling lap-by-lap feed |
| track_info | Circuit outline with sector highlights |

### SOC / Security
| Viz | Purpose |
|---|---|
| single_value_tile | Alert count, MTTD, MTTR |
| threat_gauge | Risk score against threshold bands |
| attack_flow | Kill chain / MITRE stage progression |
| severity_board | Stacked severity lanes with counts |
| alert_ticker | Scrolling real-time alert feed |
| risk_radar | Polar plot of risk dimensions |

### Retail / E-commerce
| Viz | Purpose |
|---|---|
| single_value_tile | Revenue, AOV, conversion rate |
| revenue_gauge | Revenue vs target fill |
| conversion_funnel | Step-by-step drop-off |
| basket_donut | Category composition ring |
| store_heatmap | Floor/region performance grid |
| live_ticker | Real-time transaction feed |

### Healthcare
| Viz | Purpose |
|---|---|
| single_value_tile | Wait time, bed count, patient volume |
| triage_gauge | Capacity vs threshold |
| bed_occupancy | Ward-level fill bars |
| patient_flow | Admission/discharge/transfer pipeline |
| wait_ticker | Live queue progression |
| department_board | Multi-department status lanes |

### Infrastructure / NOC
| Viz | Purpose |
|---|---|
| single_value_tile | Uptime, latency, error rate |
| resource_gauge | CPU/memory/disk ring gauge |
| pipeline_flow | CI/CD or data pipeline stages |
| service_board | Service health status grid |
| incident_ticker | Scrolling incident feed |
| topology_map | Node-edge service topology |

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

## Design anti-patterns

- Don't copy vizs between brands and swap colors — each brand gets unique _render() code
- Don't use built-in Splunk vizs for data panels — custom Canvas vizs are the point
- Don't embed 5 fonts — 2 maximum (data + ui)
- Don't hardcode field names — make configurable via formatter
- Don't use solid-color rectangle banners — use gradient (infographic_shapes) or image
- Don't ship without hover tooltips on every data viz
- Don't skip brand research — generic = forgettable
- Download real logos — don't draw SVG approximations
