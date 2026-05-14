# Handover — NordShield Viz Pack Build

## What was built
A complete Splunk custom visualization app (`nordshield_viz_pack`) for NordShield Cyber Defense's SOC threat operations center. 6 custom Canvas 2D visualizations with an arctic/aurora dark theme, designed for 4K SOC wall monitors at 3m viewing distance.

## Current state: BUILT, DASHBOARD SCHEMA FIXED, READY TO TEST IN SPLUNK

**Tarball:** `test16_porche/nordshield_viz_pack.tar.gz` (86KB) — needs regeneration after the dashboard XML fixes (run `tar` again excluding node_modules/shared/src/.DS_Store).

**Webpack:** All 6 vizs compile clean, 0 errors. Bundles at `appserver/static/visualizations/*/visualization.js`.

## What's in the pack

| Viz | File | Purpose |
|---|---|---|
| `threat_beacon` | 9.4KB bundle | Hero threat score 0-100, segmented severity bar, pulsing amber glow on critical |
| `attack_heatmap` | 8.9KB bundle | 7x24 day/hour grid, 3-stop color interpolation, current-hour highlight |
| `host_shield_grid` | 9.8KB bundle | Dense mosaic of 150+ host squares, severity-sorted, summary strip |
| `threat_feed` | 9.9KB bundle | Auto-scrolling rAF alert ticker, pause on hover, relative timestamps |
| `ops_table` | 15.3KB bundle | Click-to-sort columns, pagination (10/25/50), status chips, string-safe |
| `defense_ranking` | 10.2KB bundle | Horizontal dual-tone bars (blocked/passed), success rate badges |

**Demo data:** 6 CSV lookups in `lookups/` — 150 endpoints, 200 alerts, 100 incidents, 168 attack pattern rows, 15 services, 1 threat score. Real MITRE ATT&CK IDs, realistic hostnames.

**Dashboard:** `default/data/ui/views/nordshield_overview.xml` — 1920x1080 absolute layout, strip banner with aurora line, 25/45/30 asymmetric grid, card rectangles as panel chrome.

**Font:** IBM Plex Mono (5 weights, woff2) in `appserver/static/fonts/`. Each viz's `visualization.css` references them via `../../fonts/` relative path.

## Design decisions

- **Mood:** Arctic Power — cold fortress, not Hollywood hacker neon
- **Palette:** NordShield Cyan (#00E5CC), Aurora Violet (#8B5CF6), severity = amber/magenta/ice-blue/slate (no traffic lights)
- **Typography:** Single font — IBM Plex Mono all weights. 12px floor for 3m readability.
- **Layout:** No hero archetype. Strip banner + aurora gradient line for brand. Full canvas for data.
- **Chrome:** Dashboard Studio rectangles (#0F1628, 1px cyan-tinted border) — vizs use `clearRect()` only.

## Schema errors found and fixed (feed back to skills)

### 1. fontFamily enum
`"fontFamily": "monospace"` rejected on `splunk.markdown`. Must use `"Splunk Platform Mono"`.

Allowed values: `Splunk Platform Sans`, `Splunk Data Sans`, `Splunk Platform Mono`, `Arial`, `Helvetica`, `Times New Roman`, `Comic Sans MS`, plus token/dynamic expressions.

**Skill to update:** `ds-ref-syntax`, `ds-ref-typography`, any skill generating markdown viz options.

### 2. layout.options only allows width and height
`"backgroundColor"` and `"display"` in `layout.options` rejected. Only `{ "width": N, "height": N }` is valid.

For custom canvas background, use a full-canvas `splunk.rectangle` as the first structure element.

**Skill to update:** `ds-ref-syntax`.

### 3. Absolute layout requires tabs+layoutDefinitions wrapper
Flat `layout.type = "absolute"` rejected. Schema requires `tabs` + `layoutDefinitions` even for single-page dashboards:

```json
"layout": {
    "globalInputs": [],
    "tabs": {
        "items": [
            { "layoutId": "layout_main", "label": "Overview" }
        ],
        "options": { "barPosition": "top", "showTabBar": false }
    },
    "layoutDefinitions": {
        "layout_main": {
            "type": "absolute",
            "options": { "width": 1920, "height": 1080 },
            "structure": [...]
        }
    }
}
```

**Skill to update:** `ds-ref-syntax` (absolute layout example), `ds-int-tabs` (note that wrapper is mandatory for all layouts).

## What's NOT done yet

- **Tarball not regenerated** after the 3 dashboard XML fixes — re-run the tar command
- **Font CORS in iframes** — multiple agents flagged that viz iframes have `null` origin, so `../../fonts/` relative paths may fail. Fallback is system monospace. Production fix: base64-embed fonts in each visualization.css
- **No Splunk testing** — vizs haven't been installed and viewed in Splunk yet. Need to verify: custom viz type references (`nordshield_viz_pack.threat_beacon`), formatter settings namespace, data binding
- **Design critique (step 8)** not run — the vp-couture workflow has a post-build design review step that was skipped
- **No appIcon.png** — the app has no icon in Splunk's app manager

## Files to know

```
test16_porche/nordshield_viz_pack/
├── shared/theme.js              <- design tokens, shared via webpack resolve
├── webpack.config.js            <- 6-entry build, AMD output
├── appserver/static/visualizations/*/src/visualization_source.js  <- source (ES5)
├── appserver/static/visualizations/*/visualization.js             <- built bundles
├── appserver/static/visualizations/*/formatter.html               <- settings UI
├── appserver/static/visualizations/*/visualization.css            <- font @font-face
├── default/data/ui/views/nordshield_overview.xml                  <- dashboard
├── lookups/*.csv                                                  <- demo data
```

## How to rebuild

```bash
cd nordshield_viz_pack
npm install
npx webpack --config webpack.config.js
cd ..
tar czf nordshield_viz_pack.tar.gz \
  --exclude='node_modules' --exclude='package.json' \
  --exclude='package-lock.json' --exclude='webpack.config.js' \
  --exclude='shared' --exclude='*/src' --exclude='.DS_Store' \
  nordshield_viz_pack/{appserver,default,lookups,metadata}
```
