# Test 22b: Nike Training Club — Build Results

## Build Summary

| Item | Value |
|---|---|
| App ID | `nike_training_club` |
| Version | 1.0.0 |
| Build | 2 |
| Tarball | `nike_training_club.tar.gz` (24 KB) |
| Build method | Flat AMD (`build_flat.js`) |
| Vizs | 7 |
| Dashboard | 1 (absolute layout, 1920x1340) |
| Lookups | 6 CSV files |
| Custom fonts | 0 (system fonts only) |
| Theme | Dark primary (`#0A0A0A` bg, `#CDFF00` volt accent) + light |

## Design Brief

- **Brand:** Nike Training Club
- **Mood:** Speed + Power
- **Tone:** Bold, kinetic, empowering
- **Layout archetype:** Strip banner (narrow branding strip, maximize data)
- **Panel chrome:** 2px volt left bar, flush dark panels, rx:2
- **Fonts:** System mono + Helvetica Neue (0 KB overhead)
- **Accent:** `#CDFF00` (Nike Volt)

## Viz Inventory (7 vizs, 5 categories)

| # | Viz | Category | Type in JSON |
|---|---|---|---|
| 1 | `kpi_tile` | KPI | `nike_training_club.kpi_tile` |
| 2 | `engagement_gauge` | Gauge | `nike_training_club.engagement_gauge` |
| 3 | `program_bars` | Ranking | `nike_training_club.program_bars` |
| 4 | `trend_chart` | Chart | `nike_training_club.trend_chart` |
| 5 | `trainer_board` | Ranking | `nike_training_club.trainer_board` |
| 6 | `city_grid` | Matrix | `nike_training_club.city_grid` |
| 7 | `activity_feed` | Time | `nike_training_club.activity_feed` |

## Dashboard Layout

```
[============ STRIP BANNER (Nike logo + title + volt accent line) ============]
[ PERFORMANCE OVERVIEW section label                                          ]
[ KPI Card: Members | Workouts | Completion Rate | Signups (4 tiles)          ]
[ PROGRAMS AND TRENDS section label                                           ]
[ Program Bars (60%)              | Trend Chart (40%)                         ]
[ TRAINERS AND ENGAGEMENT section label                                       ]
[ Trainer Board (33%) | Gauge + Cities (18%) | Activity Feed (45%)            ]
```

## Validation Results

### FATAL rules (all PASS)
- F1: Webpack target ES5 (PASS)
- F4: ROW_MAJOR_OUTPUT_MODE on all 7 vizs (PASS)
- F6: No define() in source (PASS)
- F7: extend({}) object literal on all 7 vizs (PASS)
- F9: All vizs in appserver/static/visualizations/ (PASS)
- F10: No jQuery usage (PASS -- "jQuery" in comments is false positive)
- F12: All formatters use Splunk components only (PASS)

### BROKEN rules (all PASS)
- B2: HiDPI scaling via setupCanvas (PASS)
- B3: getOption helper on all vizs (PASS)
- B13: clearRect (no fillRect with bg) on all vizs (PASS)

### REJECTED rules (all PASS)
- R1: app.conf has all 5 stanzas (PASS)
- R2: default.meta has sc_admin + [lookups] (PASS)
- R3: COPYFILE_DISABLE=1 on macOS tar (PASS)
- R7: No [triggers] stanza (PASS)

### INTERACTIVE rules (all PASS)
- I1: All 7 vizs have hover tooltips (PASS)
- Destroy cleanup on all vizs (PASS)
- Reflow on all vizs (PASS)

### Data validation
- All 10 data sources have `name` property (PASS)
- All 10 custom viz panels have `backgroundColor: transparent` (PASS)
- Dashboard width is 1920 (PASS)
- Single top-level directory in tarball (PASS)
- No src/, node_modules/, or _build/ in tarball (PASS)

### Design quality
- accentIntensity (0-100) on all 7 vizs (PASS)
- Accent color default #CDFF00 on all formatters (PASS)
- Brand-specific panel chrome (2px volt left bar) (PASS)
- Nav bar with volt color (PASS)
- Nike swoosh logo bundled in appserver/static/images/ (PASS)
- Section labels (whisper text, UPPER, 30% opacity) (PASS)
- Shadow card rectangles behind all panel groups (PASS)

## Final Score

| Dimension | Score |
|---|---|
| Visual hierarchy | 8/10 |
| Whitespace quality | 7/10 |
| Brand distinctiveness | 8/10 |
| Emotional resonance | 8/10 |

**Total validation: 120 PASS, 0 real FAIL, 0 WARN**

(7 false-positive FAIL from "No jQuery" appearing in code comments -- not actual jQuery usage)

## Install Instructions

1. Upload `nike_training_club.tar.gz` via Splunk Web > Manage Apps > Install from File
2. Restart Splunk (required for static images to be served)
3. Navigate to the Nike Training Club app
4. The dashboard loads automatically as the default view

## Files

- Tarball: `test22b_nike/nike_training_club.tar.gz`
- App directory: `splunk-custom-visualizations/examples/nike_training_club/`
