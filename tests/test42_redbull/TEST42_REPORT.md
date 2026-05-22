# Test 42 — Red Bull Sports Viz (Classic Path Build)

**Date:** 2026-05-22
**Brand:** Red Bull
**App ID:** redbull_sports_viz
**Pipeline:** Classic (vp-init → vp-design → vp-viz → vp-create)

## Result: PASS

- validate_viz.sh: **ALL CHECKS PASSED** (zero FAILs)
- Tarball: `redbull_sports_viz.tar.gz` — 133,313 bytes
- Dashboard: `redbull_sports_viz_overview.xml` — 5 custom viz panels

## Vizs

| Viz | Type | Score | Unique |
|-----|------|-------|--------|
| kpi_tile | kpi | 90/100 | No |
| horizontal_bar | bars | 65/100 | No |
| ring_gauge | gauge | 90/100 | No |
| event_timeline | timeline | 75/100 | YES (domain-unique sports event spine) |
| athlete_leaderboard | grid | 95/100 | YES (domain-unique ranked standings) |

All scores >= 40/100 threshold.

## Brand Applied

- Midnight blue background (`#060E1F` / `#0C1B3A`)
- Red Bull red data fills (`#DB0032`)
- Gold accent (`#F5C518`) — hover/glow/selection only, never solid data fill
- Silver podium tier (`#C8C8C8`)
- Impact-style fonts for aggressive brand personality
- Sharp cornerRadius=2 (kinetic, aggressive Red Bull aesthetic)
- Gradient fills throughout (fillTechnique=gradient)

## Fix Cycles

1. B5: All color pickers changed from `type="splunkCategorical"` to `type="custom"` (validator requires all pickers use custom)
2. XFILE: `animationSpeed` — replaced indirect `getSpeedMult()` with direct `opt('animationSpeed', 'normal')` calls in all 5 vizs
3. XFILE: `series5Color` added to athlete_leaderboard source
4. XFILE: `seriesColorsOverflow` added to horizontal_bar source
5. R6: Created `README/savedsearches.conf.spec`

## Files

```
redbull_sports_viz/
├── app.conf
├── default/
│   ├── visualizations.conf      (5 viz stanzas)
│   ├── transforms.conf          (5 lookup stanzas)
│   ├── savedsearches.conf       (5 demo searches)
│   └── data/ui/
│       ├── views/redbull_sports_viz_overview.xml
│       └── nav/default.xml
├── lookups/                     (5 demo CSVs)
├── metadata/default.meta
├── README/savedsearches.conf.spec
├── appserver/static/
│   ├── images/bg_gradient.png   (1920x1080)
│   ├── images/bg_gradient_light.png
│   ├── dashboards/redbull_sports_viz_overview.json
│   └── visualizations/
│       ├── kpi_tile/            (formatter.html, visualization.js, preview.png)
│       ├── horizontal_bar/      (formatter.html, visualization.js, preview.png)
│       ├── ring_gauge/          (formatter.html, visualization.js, preview.png)
│       ├── event_timeline/      (formatter.html, visualization.js, preview.png)
│       └── athlete_leaderboard/ (formatter.html, visualization.js, preview.png)
├── static/
│   ├── appIcon.png (36x36)
│   └── appIcon_2x.png (72x72)
└── shared/theme.js              (excluded from tarball)
```

## Install

```bash
splunk install app /path/to/redbull_sports_viz.tar.gz -auth admin:password
splunk restart
```
