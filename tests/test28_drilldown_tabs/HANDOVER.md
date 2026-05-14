# test28_drilldown_tabs — Cloudflare NOC

## What was built

Splunk app `cloudflare_noc` (v1.0.0) — Dashboard Studio dashboard with 3 tabs + 5 custom Canvas 2D visualizations. Packaged as `cloudflare_noc.tar.gz` (31KB).

## Design decisions

- **Aesthetic:** Industrial flavor, Speed mood — Cloudflare orange `#F6821F` on dark navy `#0D0D1F`
- **Font:** JetBrains Mono everywhere (data + ui) — monospace-only for developer/NOC identity
- **Theme:** Dark primary, light works via auto-detect. Hero values use full `t.text`, never dimmed.
- **Layout:** 3 tabs (Edge Health / Security / Cache Performance), absolute positioning at 1920x1000

## 5 Custom vizs

| Viz | Type | Drilldown | Key feature |
|---|---|---|---|
| `cf_kpi_tile` | Single value | — | Orange accent glow, delta arrows, unit positioning |
| `cf_edge_grid` | Health matrix | `setToken` → `$selected_edge$` | 24 cells, green/amber/red, latency overlay |
| `cf_trend_line` | Time series | — | Area fill, threshold line (dashed), crosshair tooltip |
| `cf_attack_timeline` | Event feed | `linkToSearch` with attack_id | Severity badges, scroll wheel, vertical timeline dots |
| `cf_cache_bars` | Horizontal bars | — | Gradient fill, hover glow, ranked by value |

## Drilldown token flow

```
Edge grid click → setToken("selected_edge", click.value)
                → latency trend search filters: where location="$selected_edge$"
                → default token value: "*" (shows all locations)

Attack timeline click → linkToSearch(index=* attack_id="$click.value$")
                      → opens new Splunk search tab
```

## Demo data (8 CSV lookups)

All prefixed `cloudflare_noc_`. Latency trend has per-location data for 5 edges (SFO, IAD, JNB, LHR, FRA) to demonstrate drilldown filtering.

## Bugs found and fixed during review

### 1. Hardcoded field names in event handlers
`_onClick` and `_onMouseMove` used string literals (`'location'`, `'attack_id'`) instead of the configurable field from formatter settings. Fix: store field names as instance properties in `updateView`, reference in handlers.

### 2. Preview PNGs were 1x1 white pixels
Generated proper 300x200 dark navy PNGs with per-viz accent stripes.

### 3. Drilldown token set but never consumed
`$selected_edge$` was written by `setToken` but the latency trend search didn't reference it. Three-part fix: (a) added `defaults.tokens.default.selected_edge = "*"`, (b) updated search to filter by token, (c) expanded CSV with per-location data.

## What's NOT done

- No real Splunk testing (no instance available in this session)
- Preview PNGs are solid-color rectangles, not actual viz screenshots
- No `appIcon.png` / `appIcon_2x.png` (static/ directory empty)
- Latency trend only has data for 5 of 24 edge locations
- No edge-specific search filtering on the grid itself (only the trend responds to `$selected_edge$`)
- Security tab mitigation gauge is just a KPI tile showing a ratio, not a true gauge viz

## Files

```
cloudflare_noc/
  default/          app.conf, visualizations.conf, transforms.conf, savedsearches.conf, nav, views
  lookups/          8 CSV files
  metadata/         default.meta (system export)
  shared/           theme.js (design tokens)
  appserver/static/visualizations/
    cf_kpi_tile/    formatter.html, src/, visualization.js, visualization.css, preview.png
    cf_edge_grid/   "
    cf_trend_line/  "
    cf_attack_timeline/ "
    cf_cache_bars/  "
  README/           savedsearches.conf.spec
```
