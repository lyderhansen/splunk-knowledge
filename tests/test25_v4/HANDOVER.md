# test25_v4 Handover — vp-viz skill gaps

Test build: `hospital_nps_gauge` (NPS ring gauge, single viz app).
Date: 2026-05-14

## Bugs shipped (3)

### B9: Dashboard JSON viz type uses wrong prefix

- **WRONG:** `"type": "custom.hospital_nps_gauge.nps_ring_gauge"`
- **RIGHT:** `"type": "hospital_nps_gauge.nps_ring_gauge"`
- **Impact:** viz won't load ("is not defined")
- **Root cause:** skill has no rule for Dashboard Studio v2 JSON type format. Agent used Classic Simple XML convention (`custom.` prefix) from training data.
- **Fix:** add B9 to vp-viz checklist + WRONG/RIGHT examples. Add check to `validate_viz.sh`.

### B10: Dashboard JSON option keys missing namespace

Three different contexts, three different formats — skill only documented two:

| Context | Format |
|---|---|
| formatter.html | `{{VIZ_NAMESPACE}}.scoreField` |
| Dashboard JSON options | `hospital_nps_gauge.nps_ring_gauge.scoreField` |
| savedsearches.conf | `display.visualizations.custom.hospital_nps_gauge.nps_ring_gauge.scoreField` |

- **WRONG:** `"scoreField": "score"` (bare key in Dashboard JSON options)
- **RIGHT:** `"hospital_nps_gauge.nps_ring_gauge.scoreField": "score"`
- **Impact:** all settings silently ignored, viz renders with defaults only
- **Root cause:** skill covers formatter (`{{VIZ_NAMESPACE}}`) and savedsearches.conf (`display.visualizations.custom.*`) but never mentions Dashboard JSON options format.
- **Fix:** add B10 three-context table to vp-viz. Add dashboard XML template to conf-templates.md. Add check to `validate_viz.sh`.

### B11: Tarball packaging includes build-only dirs

- `shared/` and `src/` are build-time artifacts — must not be in the installable tarball.
- First tarball attempt was rejected by Splunk ("more than one immediate subdirectory").
- **Fix:** add packaging command to vp-viz with `--exclude='shared' --exclude='src'` and `COPYFILE_DISABLE=1` for macOS.

## Missing formatter controls

### Zone threshold customization

Gauge shipped with hardcoded zone boundaries (0-30, 31-60, 61-100) and theme-bound colors (danger/warn/success). No way for users to adjust where zones start/end or what colors they use.

- **Added:** `zoneLow`, `zoneHigh` (text inputs for threshold values)
- **Added:** `detractorColor`, `passiveColor`, `promoterColor` (color pickers)
- **Lesson for skill:** Ring Gauge blueprint in viz-blueprints.md says `colorScheme` setting but doesn't specify that individual zone colors and thresholds should be independently configurable. Update blueprint to be explicit.

### Unnamed searches

Dashboard JSON searches must have a `"name"` field for readability in the Splunk UI search picker.

- **WRONG:** `{ "type": "ds.search", "options": { "query": "..." } }`
- **RIGHT:** `{ "type": "ds.search", "options": { "query": "..." }, "name": "NPS Demo Data" }`
- **Fix:** add to dashboard XML template in conf-templates.md.

## Files to update in splunk-viz-packs plugin

1. **`skills/vp-viz/SKILL.md`** — add B9, B10 to pre-code checklist and WRONG patterns. Add three-context namespace table. Add packaging command.
2. **`skills/vp-viz/references/conf-templates.md`** — add Dashboard Studio v2 XML template with correct type + namespaced options + named search.
3. **`skills/vp-viz/scripts/validate_viz.sh`** — add checks for `custom.` prefix in dashboard XML/JSON, bare option keys, unnamed searches.
4. **`skills/vp-viz/references/viz-blueprints.md`** — Ring Gauge blueprint: specify zone threshold + zone color settings explicitly.
