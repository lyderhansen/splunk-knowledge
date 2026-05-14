# Handover — Stripe Payment Operations Viz Pack

**Date:** 2026-05-14
**Status:** Built, validated, packaged — ready for Splunk install and visual testing

## What was built

A Splunk custom visualization pack (`stripe_payment_ops_viz`) with 4 Canvas 2D vizs and a Dashboard Studio dashboard, branded for Stripe's payment operations team.

### Visualizations

| Viz | Type | Key features |
|-----|------|-------------|
| `stripe_kpi` | Single value tile | Large value + label + unit + trend arrow, indigo accent underline, dynamic text sizing |
| `stripe_table` | Data table | Sort all columns (click header), pagination (configurable rows/page), column hide (gear menu), per-column widths (cw1–cw8 slots as `field:px`), status color dots, row hover, money formatting, row numbers |
| `stripe_trend` | Time-series line | Area fill, dashed threshold line with label, hover crosshair + tooltip, responsive axes |
| `stripe_gauge` | Ring gauge | 270° arc with gradient fill (indigo→purple), warning/critical color zones, center value + % badge, glow on dark theme |

### Dashboard

`stripe_payment_ops.xml` — absolute layout 1920×1200:
- Top: 4 KPI tiles (volume, success rate, settlement time, disputes)
- Center: Full-width transaction table
- Bottom: Failure trend line (left 65%) + Dispute gauge (right 35%)

4 additional demo views (one per viz) with nav bar.

### Design tokens

- **Light:** bg=#F6F9FC, panel=#FFFFFF, text=#0A2540, accent=#635BFF
- **Dark:** bg=#0A2540, panel=#132F4C, text=#E8ECF0, accent=#635BFF
- **Flavor:** Refined. Mood: Precision × Minimal.
- **Font:** System sans-serif stack (no custom font embed)

## Files

```
stripe_payment_ops_viz/
  default/
    app.conf                    — app identity, v1.0.0
    visualizations.conf         — 4 vizs, all allow_user_selection=true
    transforms.conf             — 4 lookup stanza mappings
    savedsearches.conf          — 4 demo saved searches
    data/ui/nav/default.xml     — nav bar with 5 views
    data/ui/views/              — 5 Dashboard Studio XMLs
  lookups/
    *_demo_kpis.csv             — 4 KPI rows
    *_demo_transactions.csv     — 40 transaction rows
    *_demo_trend.csv            — 24 hourly data points
    *_demo_gauge.csv            — 1 gauge row
  metadata/default.meta         — system export for all vizs + lookups
  README/savedsearches.conf.spec
  shared/theme.js               — design tokens + utility functions
  appserver/static/visualizations/
    stripe_kpi/                 — formatter.html, visualization_source.js, visualization.js (built), visualization.css
    stripe_table/               — same structure
    stripe_trend/               — same structure
    stripe_gauge/               — same structure

stripe_payment_ops_viz.tar.gz   — 33KB, ready to install
```

## Bugs fixed during session

1. **`hexFromSplunk` — accentColor broken in ad-hoc search.** Splunk color pickers can return integers (e.g. `6511615`) instead of `"0x635BFF"` strings. The original function only handled the string format. Fixed in all 4 vizs to handle `0xRRGGBB`, `#RRGGBB`, and integer formats.

2. **Column widths — was a single JSON blob, now per-column.** Replaced `columnWidths` (JSON string) with 8 individual formatter slots `cw1`–`cw8`, each taking `fieldname:width` format (e.g. `_time:180`). Much better UX in the Format panel.

3. **Dashboard options — were hardcoded copies of formatter defaults.** Every viz options block duplicated the formatter `value=` defaults verbatim (`valueField`, `labelField`, `themeMode`, etc.). This means:
   - If you change a formatter default, the dashboard ignores it (hardcoded value wins)
   - Clutters the JSON with noise
   - **Fix:** Stripped all options that match formatter defaults. Dashboard options now ONLY contain non-default overrides:
     - `viz_kpi_volume`, `viz_trend`, `viz_gauge`: `"options": {}` (all defaults)
     - `viz_kpi_success`: `unitPosition`, `decimals`, `accentColor` (3 overrides)
     - `viz_kpi_settlement`: `unitPosition`, `accentColor` (2 overrides)
     - `viz_kpi_disputes`: `unitPosition`, `decimals`, `accentColor` (3 overrides)
     - `viz_transactions`: `cw1`–`cw8` (8 column width overrides, formatter defaults are empty)

## Key design rule

**Dashboard options = only overrides.** The formatter `value=` attribute is the single source of truth for defaults. The JS `opt()` function falls back to these defaults when a key is missing from config. Dashboard JSON should never repeat them.

## What to test next

1. **Install and verify in Splunk** — `stripe_payment_ops_viz.tar.gz` via Manage Apps > Install from File
2. **Ad-hoc search** — run `| inputlookup stripe_payment_ops_viz_demo_transactions.csv`, select Stripe Transaction Table viz, verify:
   - Accent color applies (indigo header underline)
   - Sort works on all column headers
   - Pagination shows at bottom
   - Gear menu opens and hides/shows columns
   - Column widths respond to cw1–cw8 settings in Format panel
3. **Dark theme** — switch dashboard or browser to dark, verify all 4 vizs adapt
4. **Dashboard Studio** — open `stripe_payment_ops` view, verify all panels render with correct data
5. **Options parity** — open any panel in Dashboard Studio editor, confirm options block only shows overrides

## Open bugs

- **accentColor does not apply on stripe_table in ad-hoc search.** `hexFromSplunk` was fixed to handle integer/string/0x formats, but the accent color (indigo header underline, sort arrows, pagination links) still does not render in ad-hoc mode. Works in Dashboard Studio. Root cause unknown — needs debugging in browser console with `console.log(config)` to inspect what value Splunk actually passes for the color picker. The other 3 vizs (kpi, trend, gauge) have NOT been confirmed to have the same issue.

## Known gaps

- **No preview.png** — all 4 vizs missing preview thumbnails for the viz picker in ad-hoc search. Need 250×150px PNGs at `appserver/static/visualizations/{viz}/preview.png`.
- **No custom font** — using system sans-serif; could embed Söhne if licensed
- **Table column resize by drag** — not implemented (Canvas limitation); widths are via formatter settings only
- **No drilldown wiring** — table row click fires drilldown event but dashboard doesn't have setToken handlers yet
- **Tooltip on table** — hover highlights row but doesn't show a tooltip (by design — data is already visible in cells)

## Build commands

```bash
# Rebuild after source edits
node ~/.claude/plugins/cache/splunk-knowledge/splunk-viz-packs/4.0.0/skills/vp-viz/scripts/build_flat.js stripe_payment_ops_viz

# Validate
bash ~/.claude/plugins/cache/splunk-knowledge/splunk-viz-packs/4.0.0/skills/vp-viz/scripts/validate_viz.sh stripe_payment_ops_viz

# Package
COPYFILE_DISABLE=1 tar czf stripe_payment_ops_viz.tar.gz stripe_payment_ops_viz/
```
