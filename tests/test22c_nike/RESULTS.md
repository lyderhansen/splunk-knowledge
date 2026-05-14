# test22c_nike — Nike Training Club Viz Pack + Dashboard

## Summary

Splunk custom visualization pack (4 vizs) + Dashboard Studio dashboard for Nike Training Club. Bold volt-on-black aesthetic. Desktop-oriented for regional training program managers tracking engagement, completion rates, trainer performance, and program growth.

## Design Brief

- **Brand:** Nike — bold, kinetic, empowering
- **Mood:** Speed + Power
- **Palette:** Black canvas (#0A0A0A), volt accent (#CDFF00), near-black panels (#111111/#151515)
- **Fonts:** System fonts only (0KB overhead) — Helvetica Neue (UI), SF Mono (data)
- **Layout:** Strip banner archetype — volt accent line at y=64, data-dense below
- **Dark theme primary**, light theme defined in tokens

## Custom Visualizations (4)

| Viz | Type | Description |
|---|---|---|
| `kpi_tile` | KPI / Single Value | Bold value + trend arrow + optional sparkline. 2px volt left bar panel chrome. |
| `engagement_gauge` | Ring Gauge (270-degree) | Arc gauge with target tick marker, volt glow, danger-red when below target. |
| `trainer_board` | Leaderboard | Ranked rows with position badges, score bars, session counts, trend arrows. Top 3 glowing. |
| `program_bars` | Horizontal Bar List | Ranked bars with opacity fade, hover highlight, program labels. |

## Dashboard Panels (11)

- 4x KPI tiles (Active Members, Workouts This Week, Avg Completion Rate, New Signups) — custom viz
- Program Bars (top 10 programs by engagement score) — custom viz
- Weekly Trend (12-week engagement vs target) — splunk.line
- Trainer Board (10 trainers ranked by score) — custom viz
- Engagement Gauge (completion rate vs 85% target) — custom viz
- City Engagement (12 cities ranked) — splunk.bar
- Activity Feed (recent workout events) — splunk.table

## Demo Data (6 CSV lookups)

| File | Records | Purpose |
|---|---|---|
| `nike_training_club_kpis.csv` | 4 | KPI metrics with sparkline data |
| `nike_training_club_programs.csv` | 10 | Programs with scores and categories |
| `nike_training_club_trends.csv` | 12 | Weekly engagement values + target |
| `nike_training_club_trainers.csv` | 10 | Trainers with rank, score, sessions, trend |
| `nike_training_club_cities.csv` | 12 | Cities with engagement metrics |
| `nike_training_club_activity.csv` | 16 | Recent workout activity events |

## Validation Results

```
23 PASS / 0 FAIL / 0 WARN
```

All checks passed:
- F1/F3: ES5 + AMD wrapper
- F4: getInitialDataParams method + ROW_MAJOR_OUTPUT_MODE
- F6: require/module.exports (no define())
- F7: SplunkVisualizationBase.extend({}) object literal
- F9: Vizs in appserver/static/visualizations/
- F10: No jQuery
- F12: Formatter uses Splunk components only
- B13: Canvas uses clearRect (no fillRect with bg)
- R1: app.conf 5 stanzas
- R2: default.meta sc_admin + lookups
- R7: No triggers stanza
- DS#0: Canvas width=1920
- C1: backgroundColor:transparent on all custom viz panels
- B9: Type = nike_training_club.{viz_name}
- DS-name: All dataSources have name
- DS#6: fontFamily in allow-list (Helvetica)
- DS#7: fontSize in enum (extraSmall, large)
- F8: Images bundled locally
- I1: Hover tooltips on all vizs
- I2: Hit regions + hover highlight on table vizs
- C9: rx values are numbers

## Build

- Build method: Flat AMD (build_flat.js)
- Bundle size: 17KB tarball
- Vizs: 4 built, all starting with `define([`
- No webpack required (flat AMD concatenation)

## Install

```
Upload: Splunk Web > Manage Apps > Install from File
File: nike_training_club.tar.gz
Restart: Required for static images (nike_swoosh.svg)
```

## Skills Loaded

1. `vp-couture` — design orchestrator (palette, fonts, viz inventory)
2. `vp-ref-gotchas` — hard rules (F1-F12, B1-B17, R1-R7, I1-I2, C1-C9)
3. `vp-viz` — per-viz build guide with templates
4. `vp-create` — scaffold + packaging
5. `ds-create` — dashboard JSON rules (hard defaults #0-#9)
