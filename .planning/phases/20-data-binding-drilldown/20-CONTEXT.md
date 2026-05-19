# Phase 20: Data Binding & Drilldown — Context

## Domain Boundary

Make generated vizs work with any SPL output — field discovery from data, not formatter inputs — and wire drilldown on all panels. The DataDrivers F1 app and network-diagram-viz are the reference implementations.

## Requirements

- DB-01: formatData() field indexing, no hardcoded field names
- DB-02: No "Data configurations" formatter section for most vizs
- DB-03: search_fragment in visualizations.conf as data contract
- DB-04: Generic {{VIZ_NAMESPACE}} section labels
- DR-01: _onClick on every viz
- DR-02: Dashboard JSON drilldown wiring on every panel
- DR-03: seriesColors for built-in viz panels

## Decisions

### D-01: Remove "Data configurations" formatter section (DB-01, DB-02, DB-03, DB-04)

**The DataDrivers pattern:** Vizs do NOT have formatter text inputs for field names. Instead:

1. `formatData()` builds a `colIdx` map from `data.fields` — already in vp-viz SKILL.md template (line 266-276)
2. `search_fragment` in `visualizations.conf` is the data contract — tells users what columns to provide
3. Formatter "Data configurations" section is **removed** for all viz types EXCEPT single-value and generic table (which get one optional `field` input with empty default)

**Files to change:**
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — remove the "Data configurations" section template (lines 121, 141-215). Replace with a note: "Data binding is via formatData() field indexing. No field-name text inputs. Only single-value/generic table vizs get an optional field input."
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — update the formatter structure ordered list (item 1 currently says "Data configurations — field name mappings") to say "No Data configurations section for most vizs. search_fragment is the data contract."
- `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md` — expand the `search_fragment = {{FRAGMENT_80}}` to include guidance: "search_fragment must contain a realistic SPL shape showing the expected columns by name. This is the user-facing data contract."
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — remove any "Data fields:" lists that reference formatter controls. Add "Expected columns:" to each viz type showing what search_fragment should produce.

**Reference:** DataDrivers `f1_race_map` formatter has zero data-field controls. `f1_single_value` has exactly one: `field` with default `"value"`. `f1_leaderboard` has zero — it reads columns by known names from `formatData()`.

### D-02: All vizs get mandatory drilldown (DR-01, DR-02)

Every generated viz gets:
1. **JS side:** `_onClick` method with hit-test logic, `this._clickField` stored in `updateView`, `this.drilldown()` call with `FIELD_VALUE_DRILLDOWN`
2. **Dashboard JSON side:** `"drilldown": "all"` in viz options + `eventHandlers` with `drilldown.setToken`
3. **Click listener:** registered in `initialize()` via `this._canvas.addEventListener('click', ...)`

Even for vizs without discrete clickable elements (gauges, KPIs, sparklines), clicking passes the viz's primary displayed value. The hit-test can be simple (entire canvas = one click target for single-value vizs).

**Files to change:**
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — add drilldown notes to ALL viz types (not just the 5 already noted). Include "simple" hit-test patterns for gauges/KPIs.
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — add a pre-code checklist item: "Every viz has _onClick with hit-test + this.drilldown()"
- `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` — enforce in Step 3c dashboard generation: iterate ALL vizs and wire both `"drilldown": "all"` + `eventHandlers`. Add to packaging checklist.
- `plugins/splunk-viz-packs/skills/vp-create/references/dashboard-interactivity.md` — update Section 1 to show the pattern for EVERY panel, not just one example panel

### D-03: seriesColors in dashboard-interactivity.md Section 8 (DR-03)

Add a new Section 8 to `dashboard-interactivity.md`: "Built-in viz panel colors"

Content:
- `"seriesColors": ["#hex1", "#hex2", ...]` — positional array, maps to series in alphabetical category order
- `"seriesColorsByField": { "fieldValue": "#hex" }` — locks color to specific category value (recommended, refactor-safe)
- Both go in the viz panel's `options` block alongside other viz-type-specific options
- Show example for `splunk.area` and `splunk.column` (most common built-in vizs in mixed dashboards)
- Note: custom vizs use formatter color pickers (series1Color-5), built-in vizs use JSON options

**File:** `plugins/splunk-viz-packs/skills/vp-create/references/dashboard-interactivity.md`

## Canonical References

- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — formatData template, pre-code checklist
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — Data configurations section to remove
- `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md` — search_fragment template
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — per-viz drilldown notes + expected columns
- `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` — Step 3c dashboard generation
- `plugins/splunk-viz-packs/skills/vp-create/references/dashboard-interactivity.md` — drilldown + seriesColors
- DataDrivers F1 app at `/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/02_Splunk_Material/F1/App New/datadrivers-app-main/` — reference implementation
- network-diagram-viz in FAKE-TSHRT docker — search_fragment + supports_drilldown pattern

## Deferred Ideas

- Token-based drilldown configuration in formatter (like network-diagram-viz Tokens section) — future requirement
