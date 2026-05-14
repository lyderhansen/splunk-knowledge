# Test 26 — Riot Games Live Ops: Release Issues

## Issues Found

### 1. macOS tar resource forks break Splunk upload
**Symptom:** "Invalid app contents: archive contains more than one immediate subdirectory"
**Cause:** macOS `tar` silently injects `._` resource fork files as separate top-level entries. Splunk's app validator sees these as extra subdirectories and rejects the archive.
**Fix:** `COPYFILE_DISABLE=1 tar -czf ...` suppresses resource forks.
**Impact:** Blocking — app cannot be installed.

### 2. Dashboard Studio v2 custom viz type format is `app.viz`, not `"type": "custom"`
**Symptom:** Schema validation error: `must be equal to one of the allowed values` for every custom viz panel.
**Cause:** Used `"type": "custom"` with a separate `"customVizId"` option key. Also tried `"type": "splunk.custom.app.viz"` — also wrong.
**Correct format:** `"type": "riot_liveops_viz.riot_kpi_tile"` — direct `<app_id>.<viz_name>`, no prefix, no separate customVizId key.
**Impact:** Blocking — dashboard fails schema validation and won't render.

### 3. Native splunk.line used for match quality trend panel
**Symptom:** The match quality trend panel uses `splunk.line` (built-in Splunk viz) instead of a custom Canvas viz.
**Cause:** User spec listed 4 custom vizs; trend was listed as a dashboard panel but not as a custom viz. Should have flagged the gap or built a 5th viz.
**Rule violated:** "Every data panel must be custom Canvas viz — built-in Splunk vizs break brand identity."
**Fix needed:** Build `riot_trend_line` as 5th custom viz with hextech glow, Riot palette, Beaufort typography. Replace `splunk.line` reference in dashboard JSON.
**Impact:** Non-blocking but breaks visual consistency. The native line chart uses Splunk default styling (grid, axes, colors) that clashes with the hextech theme.

## What Shipped (v1.0.0)
- 4 custom vizs: riot_kpi_tile, riot_latency_bars, riot_load_gauge, riot_incident_feed
- All pass `validate_viz.sh` (preview.png warnings only)
- Dashboard Studio v2 dashboard with absolute layout (1920x1200)
- 5 CSV demo lookups, saved searches, nav bar, README spec
- Tarball: `riot_liveops_viz.tar.gz` (18KB)

## Still TODO
- [ ] Build `riot_trend_line` custom viz to replace native `splunk.line`
- [ ] Add preview.png screenshots for all 4 vizs
- [ ] Embed Beaufort + Spiegel font base64 in theme.js (currently falls back to Georgia/Segoe UI)
- [ ] Light theme testing — all vizs support it but untested in Splunk
