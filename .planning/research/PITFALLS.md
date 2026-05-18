# Domain Pitfalls: v5.2.0 Smart Vizs & Domain Identity

**Domain:** Splunk custom visualizations (Canvas 2D, AMD, ES5) — adding auto-field discovery, domain-specific creative viz types, accent-as-highlight architecture, and mandatory dashboard generation to an existing system
**Researched:** 2026-05-18
**Confidence:** HIGH — drawn from existing rule corpus (broken-rules.md, fatal-rules.md, edge-cases.md ECR-01 through ECR-07), test session HANDOVERs (test21-28), vp-viz SKILL.md template analysis, vp-design principles, and v5.2.0 milestone goal list in PROJECT.md

---

## Critical Pitfalls

Mistakes that cause rewrites, silent renders, or complete feature failure.

---

### CP-01: Auto-field discovery — hardcoded colIdx fallback still present after discovery refactor

**What goes wrong:** A viz appears to work with dynamic field discovery, but when run against a different SPL search that returns different column order, the wrong field is plotted. The bug is invisible during development because test data always has the same column order.

**Why it happens:** The existing `formatData` pattern builds `colIdx` dynamically from `data.fields`:
```javascript
var colIdx = {};
for (var i = 0; i < fields.length; i++) {
    colIdx[fields[i].name] = i;
}
```
But then the `updateView` code reads a specific field by hardcoded string: `row[colIdx['value']]`. When refactoring to auto-discovery, the developer changes the colIdx build loop to be dynamic but leaves the specific field reads unchanged — or vice versa. The two halves become inconsistent.

**Consequence:** Numeric fields plot with wrong values. String fields show `undefined` or `"null"`. The viz renders without errors (no crash), making the bug invisible in automated tests.

**Prevention:** Auto-field discovery must be fully consistent across three points:
1. `formatData` — builds `colIdx` from `data.fields` (already dynamic in the template)
2. `updateView` / formatter — `valueField` option reads the configured field name from formatter
3. Row read — `row[colIdx[valueField]]` uses the dynamic name, never a hardcoded string

The correct pattern:
```javascript
// In updateView — formatter-driven, never hardcoded
var valueField = opt('valueField', data.fields[1] ? data.fields[1].name : 'value');
var labelField = opt('labelField', data.fields[0] ? data.fields[0].name : '_time');

// Row read — dynamic key, not hardcoded 'value' or 'label'
var val = safeNum(row[data.colIdx[valueField]], 0);
var lbl = safeStr(row[data.colIdx[labelField]]);
```

**Phase:** Auto-field discovery phase — applies to every viz refactored for dynamic field names.

---

### CP-02: Auto-field discovery — default field name falls back to wrong column when formatter is empty

**What goes wrong:** When no formatter configuration has been set (fresh viz install, `config` is empty), `opt('valueField', '')` returns `''`. Then `row[colIdx['']]` is `undefined`, `safeNum(undefined, 0)` returns `0`. Every row plots as zero. The viz renders a zero-bar chart or flat gauge with no error.

**Why it happens:** The formatter default value in `opt()` is an empty string, not a real field name. An empty colIdx key always returns `undefined` in JavaScript.

**Prevention:** Use a data-driven fallback that picks the first numeric column when no formatter value is set:

```javascript
// Pick the first numeric field as default (scan first row)
function firstNumericField(data) {
    if (!data || !data.fields || !data.rows || !data.rows[0]) return null;
    for (var i = 0; i < data.fields.length; i++) {
        if (!isNaN(parseFloat(data.rows[0][i]))) return data.fields[i].name;
    }
    return data.fields[data.fields.length > 1 ? 1 : 0].name; // last fallback
}

var valueField = opt('valueField', '') || firstNumericField(data) || 'value';
```

The `|| firstNumericField(data)` chain only runs if the formatter value is empty. This ensures the viz renders meaningful data by default even before the user has configured it.

**Detection:** Open a fresh viz with no formatter settings configured. Plot any multi-column SPL search. Bars/gauges must show the actual first numeric column — not all zeros.

**Phase:** Auto-field discovery phase.

---

### CP-03: Auto-field discovery — _time field treated as a numeric series

**What goes wrong:** A viz configured to auto-discover numeric fields picks `_time` as a data series and plots epoch timestamps (e.g., `1716000000`) as bar heights or gauge values. The viz renders enormous values that overflow the chart or produce a full gauge on every row.

**Why it happens:** `_time` in Splunk result sets is returned as a Unix epoch integer. `parseFloat("1716000000")` succeeds, so the `firstNumericField` scan includes it as a valid numeric field. Epoch timestamps are valid numbers but not meaningful data values.

**Prevention:** Exclude `_time` and any field beginning with `_` (Splunk internal fields) from the auto-discovery scan:

```javascript
function firstNumericField(data) {
    if (!data || !data.fields || !data.rows || !data.rows[0]) return null;
    for (var i = 0; i < data.fields.length; i++) {
        var fname = data.fields[i].name;
        if (fname.charAt(0) === '_') continue; // skip _time, _raw, _key, etc.
        if (!isNaN(parseFloat(data.rows[0][i]))) return fname;
    }
    return null;
}
```

**Detection:** Run a viz against a SPL search that returns `_time` + numeric fields. The auto-selected field must NOT be `_time`. Epoch values in the range 1.7e9 are the symptom — any gauge that immediately pegs at 100% after fresh install is likely plotting `_time`.

**Phase:** Auto-field discovery phase. Also applies to multi-series discovery.

---

### CP-04: Auto-field discovery — mixed string/numeric fields make series-color assignment non-deterministic

**What goes wrong:** A multi-series viz (spark strip, line chart) auto-discovers numeric columns and assigns series colors by column index. On one data shape it renders with blue/orange/green. On a slightly different SPL result (one fewer column, or columns in different order), it renders with orange/green — the color mapping shifts and the legend becomes wrong.

**Why it happens:** When numeric columns are discovered dynamically by scanning `data.fields`, the column order changes if SPL results change. Series color assignment by loop index `seriesColors[i % seriesColors.length]` produces a stable visual only when field order is stable. Ad-hoc search results have non-deterministic column order.

**Prevention:** For multi-series vizs, assign colors by field name hash, not loop index:

```javascript
function colorForField(fieldName, palette) {
    var hash = 0;
    for (var i = 0; i < fieldName.length; i++) {
        hash = (hash * 31 + fieldName.charCodeAt(i)) & 0x7fffffff;
    }
    return palette[hash % palette.length];
}
```

This ensures the same field always maps to the same color regardless of column discovery order. Update the legend to use field-name-to-color lookup, not positional lookup.

**Detection:** Run the viz. Note color assignments. Change the SPL search to return the same fields in different order (swap two columns). Colors must remain consistent.

**Phase:** Auto-field discovery phase — multi-series vizs only.

---

### CP-05: Accent-as-highlight migration — DPR-03 gradient fills broken when accent removed from data elements

**What goes wrong:** Changing from "accent everywhere" to "series colors for data, accent only for highlights" leaves DPR-03 (gradient fills on all data elements) broken. DPR-03 uses `t.accent` as the gradient start color. After the migration, data elements are supposed to use series colors — but if the gradient code still uses `t.accent`, bars/arcs look branded instead of data-colored, undermining the whole change.

**Why it happens:** DPR-03's minimum implementation in design-principles.md says:
```javascript
var grad = ctx.createLinearGradient(x, y, x, y + barH);
grad.addColorStop(0, t.accent);
grad.addColorStop(1, withAlpha(t.accent, 0.5));
```
This uses accent as both gradient stops. Migrating to accent-as-highlight requires updating gradient generation to use series colors as the primary color, with accent reserved for hover/selected state only. The DPR-03 template is the wrong starting point after this migration.

**Prevention:** After the accent-architecture change, DPR-03 gradient code for data elements must use the series color, not `t.accent`:
```javascript
var seriesColor = getSeriesColor(seriesIndex, t);  // NOT t.accent
var grad = ctx.createLinearGradient(x, y, x, y + barH);
grad.addColorStop(0, seriesColor);
grad.addColorStop(1, withAlpha(seriesColor, 0.5));
ctx.fillStyle = grad;
```
Accent is then used only for: hover highlight overlay, selected row/segment, threshold breach indicator, UI control fills.

**Detection:** A multi-series bar chart in the migrated system must show different colors for different series. If all bars are the same accent color, the migration has a gap. grep for `t.accent` inside gradient `addColorStop` calls on data rendering paths — any found are candidates for review.

**Phase:** Accent separation phase — any viz being migrated from accent-as-data to series-colors-for-data.

---

### CP-06: Accent-as-highlight — accentIntensity now controls highlight opacity, not data fill intensity, but formula not updated

**What goes wrong:** After the accent migration, hover highlights and selected-row fills appear at fixed full intensity regardless of the `accentIntensity` formatter setting. Or worse, the intensity control was controlling data fill depth before the migration and now controls nothing (dead formatter key — see v5.1.0 CP-05).

**Why it happens:** The v5.0.0 `accentIntensity` formula (`gi = parseFloat(opt('accentIntensity', '50')) / 100`) was designed to control glow and shadowBlur on data fills. After migrating accent to "highlights only," the meaning shifts: `gi` should now control the overlay alpha of hover highlights and selected states, not the data fill depth. The formula still computes correctly, but the call sites must be updated to use `gi` in the right context.

**Prevention:** After migration, audit every use of `gi` in the viz:
- Old use: `withAlpha(t.accent, gi)` applied to bar fills, arc fills, panel backgrounds — REMOVE these
- New use: `withAlpha(t.accent, gi)` applied to hover overlays, selected-row fills, threshold breach indicators — KEEP these
- The `accentIntensity` formatter label should also be updated to communicate its new meaning: "Highlight intensity" not "Accent intensity"

**Phase:** Accent separation phase.

---

### CP-07: Domain-first ideation produces viz types with Canvas 2D rendering that is unboundedly complex

**What goes wrong:** vp-design proposes a creative domain-specific viz (e.g., "topology map with force-directed node layout" for NOC, "track map with animated position markers" for F1, "MITRE ATT&CK heat matrix with drill-in" for SOC). Claude attempts to implement it in Canvas 2D ES5. The resulting code is 600+ lines with recursive layout algorithms, collision detection, or physics simulation — it cannot fit in one context, breaks the 500-line SKILL.md rule, and fails 3+ validate_viz.sh checks on the first build.

**Why it happens:** The novelty scoring system (viz-novelty-scores.md) rewards high-novelty types like "Sankey/flow diagram," "topology map," and "geospatial grid" with scores of 4-5. These scores encourage Claude to propose and attempt them. But Canvas 2D ES5 rendering complexity is not capped by the scoring system. The jump from "propose it" to "implement it" reveals that some score-5 types require algorithmic complexity that exceeds what can be reliably generated in one pass.

**Consequences:** First-build failure, multi-session repair loops, code that passes linting but produces wrong visual output.

**Prevention:** Domain-specific creative types must pass a Canvas 2D complexity gate before being added to the inventory:

| Complexity tier | Characteristics | Decision |
|---|---|---|
| Renderable | Iterates rows, draws primitives (rect, arc, line, text) | Proceed |
| Stretched | Requires coordinate transform math or state machine | Proceed with caution — keep under 200 lines of draw code |
| Overambitious | Requires graph layout, physics, or recursive algorithms | Reject or simplify to a proxy viz |

Proxy patterns for over-ambitious types:
- Topology map → Status health grid with "hop count" encoded as cell size
- Force-directed graph → Node list with connection count as a bar, not spatial layout
- Sankey flow → Horizontal bar list with flow amounts as widths (no crossing logic)
- Geospatial grid → Regional heatmap with fixed rows/columns (no actual geo projection)

The proxy pattern produces a viz that communicates the same insight with Canvas 2D primitives that fit within one generation pass.

**Detection warning sign:** If the viz design brief includes words like "layout algorithm," "force-directed," "physics simulation," "recursive," or "projection" — treat as overambitious and apply a proxy pattern immediately.

**Phase:** Domain viz ideation phase (vp-design). Also vp-viz step 2 (formatData) — abort if generating layout algorithm code.

---

### CP-08: Mandatory dashboard — dashboard JSON references vizs that failed to build

**What goes wrong:** vp-create generates the dashboard JSON as part of the mandatory dashboard step. One of the vizs failed validation and was not packaged. The dashboard references that viz by `{app_id}.{failed_viz_name}`. The dashboard installs but shows an empty panel or a "visualization not found" error for that panel.

**Why it happens:** The mandatory dashboard generation step runs after packaging. If vp-create's validation step is skipped or a failure was suppressed (e.g., "close enough, move on"), the viz is absent from the packaged tarball but the dashboard JSON still references it.

**Consequences:** The dashboard cannot be fully demonstrated. The missing panel looks like a broken build even if the other vizs are perfect.

**Prevention:** The mandatory dashboard generation step MUST be gated on a clean `validate_viz.sh` exit. The checklist in vp-create must include:

```
- [ ] ALL vizs passed validate_viz.sh (zero FAIL) before dashboard JSON is written
- [ ] Dashboard viz type references match the exact viz names in appserver/static/visualizations/
- [ ] verify: tar tzf app.tar.gz | grep "visualization.js" — count must match viz count in dashboard
```

The dashboard JSON must only reference vizs that are confirmed present in the tarball. If a viz failed and was excluded, that panel must be removed from the dashboard before shipping.

**Detection:** After packaging, run: `tar tzf app.tar.gz | grep visualization.js | wc -l` and compare the count to the number of panels in the dashboard JSON that use `{app_id}.*` viz types. A mismatch means a referenced viz is missing.

**Phase:** Mandatory dashboard phase.

---

## Moderate Pitfalls

---

### MP-01: Auto-field discovery — formatter `valueField` default doesn't match the demo CSV column name

**What goes wrong:** The viz auto-discovers fields from live SPL data and works correctly. But when the user opens it in ad-hoc search mode using the bundled demo CSV (`| inputlookup pack_demo.csv`), the chart shows all zeros because the demo CSV column is named `count` and the formatter default is `value`.

**Why it happens:** Auto-field discovery falls back to the formatter `valueField` default. The demo CSV was written with column names that made sense for the original hardcoded field design. After migrating to auto-discovery, the demo CSV column names and the formatter defaults become misaligned.

**Prevention:** When updating a viz for auto-discovery, also update the demo CSV column names to match the formatter defaults, or update the formatter defaults to match the demo CSV. These two must be consistent. Rule: the formatter `valueField` default string must be a column name that exists in the demo CSV.

**Phase:** Auto-field discovery phase. Also demo data update phase.

---

### MP-02: Accent-as-highlight — hover overlay alpha too low against series colors with high saturation

**What goes wrong:** After migrating to series colors for data fills, the hover highlight (now using `withAlpha(t.accent, gi)` as an overlay) is barely visible when the series color under it is highly saturated. A hover over a bright-orange bar with a bright-blue accent at 0.2 alpha looks like nothing changed.

**Why it happens:** The hover overlay was designed to sit on top of a neutral-tinted panel background (dark grey). When the underlying element is a fully saturated series color, the contrast between the series color and the accent overlay is reduced — the accent "washes out" against the saturated base.

**Prevention:** Increase the baseline hover alpha for the series-colors context. The previous hover alpha range (0.08-0.15, from CON-04) was designed for neutral backgrounds. For series-colored elements, use a higher range:
```javascript
// Over neutral panels: gi * 0.15
// Over series-colored elements: gi * 0.30 minimum
var hoverAlpha = Math.max(0.18, theme.getHoverAlpha() * gi);
```
Alternatively, use a blend-mode trick: draw the hover overlay in white (not accent) at lower alpha for maximum contrast against any underlying color.

**Phase:** Accent separation phase — any viz with hover-on-series-color elements.

---

### MP-03: Domain creative viz — domain template name used directly as the Splunk viz name

**What goes wrong:** domain-templates.md lists viz names like `topology_map`, `attack_flow`, `tyre_compound`, `patient_flow`. A new viz pack uses one of these names verbatim as the viz directory name (e.g., `appserver/static/visualizations/attack_flow/`). A second pack for a different brand also uses `attack_flow`. They conflict in Splunk because the app_id is different but the viz name collides in the user's Splunk picker.

**Why it happens:** Domain template names are conceptual labels, not unique Splunk viz identifiers. The correct Splunk viz type is `{app_id}.{viz_name}` where `app_id` is unique per pack. But if two packs both have a viz named `attack_flow`, the Splunk formatter picker lists them with potentially confusing entries like `my_soc_pack.attack_flow` and `cloudflare_soc.attack_flow`. Users mistake them.

**Prevention:** All domain creative viz names must be prefixed or uniquified within the app namespace. The domain template provides the semantic concept; the actual directory name should include the brand or pack identity. Example: `cf_attack_flow` not `attack_flow`.

This is cosmetic in Splunk (the `app_id.` prefix disambiguates), but it matters for support and for the Splunk picker usability.

**Phase:** Domain viz ideation phase.

---

### MP-04: Mandatory dashboard — search SPL uses `| makeresults` with fake data instead of the demo CSV

**What goes wrong:** The mandatory dashboard is generated with searches like `| makeresults count=5 | eval value=random() % 100`. The dashboard installs and vizs populate. But the demo searches produce non-deterministic data and the viz formatting settings were tuned against the CSV lookup data. The dashboard looks visually inconsistent.

**Why it happens:** When writing the mandatory dashboard quickly at the end of vp-create, the easiest SPL to write for demo data is `makeresults`. But vp-viz SKILL.md quick rule 6 (demo data section) explicitly requires `| inputlookup {pack_id}_demo_*.csv`, not `makeresults`.

**Prevention:** The mandatory dashboard searches MUST use `| inputlookup {pack_id}_demo_{viz}.csv` to match the demo data the viz was designed for. The formatter settings in the dashboard JSON must also use `valueField` matching the CSV column names.

If a demo CSV does not exist for a new domain viz, create it before writing the dashboard — not after.

**Phase:** Mandatory dashboard phase.

---

### MP-05: Domain creative viz — over-constrained Canvas draw budget causes frame drops on multi-viz dashboard

**What goes wrong:** A creative domain viz (e.g., a status health grid with 150 cells, or a flow diagram with 10 stages and animated connectors) performs well in isolation but causes visible frame drops on a dashboard with 6 vizs. The drag is from per-frame work in the viz's animation loop.

**Why it happens:** Canvas 2D rendering of 150 cells is cheap when the viz is the only one painting. On a dashboard with 6 animated vizs, each viz runs its own rAF loop. If the creative viz does expensive per-frame work (node traversal, per-cell gradient creation, text measurement on every frame), the cumulative CPU cost causes jank.

**Prevention:**
- Create gradients ONCE outside the animation loop and cache them: `this._barGrad = ctx.createLinearGradient(...)`
- Text measurement for layout must run in `updateView`, not in the rAF draw tick
- For high-cell-count vizs (status grid, heatmap), cap cells at 200 and skip cells smaller than 4px rather than drawing invisible elements
- Any `getImageData`/`putImageData` (DPR-07 noise texture) MUST be cached to an offscreen canvas — regenerating per frame kills performance

**Phase:** Domain viz generation phase. Especially for score-4/5 novelty vizs that are iterative.

---

## Minor Pitfalls

---

### MIN-01: Auto-field discovery — field name contains dot notation, colIdx lookup fails silently

**What goes wrong:** Splunk returns a field named `host.status` or `src.ip`. The viz builds `colIdx['host.status'] = 3`. Then in `updateView`, `opt('valueField', 'host.status')` returns `'host.status'`. `row[colIdx['host.status']]` returns `undefined` because the key with a dot is not found in the object — it was stored but looked up with the wrong key structure.

**Why it happens:** JavaScript object keys with dots are valid as string keys but can be created inconsistently. In `colIdx`, the key `'host.status'` IS stored correctly as a string. The lookup `colIdx['host.status']` should work. The actual failure is that `colIdx[fieldName]` returns `undefined` when `fieldName` has been trimmed or has extra whitespace from formatter input. Splunk field names returned from `data.fields` are exact, but formatter text inputs may include trailing spaces.

**Prevention:** Trim all formatter field name reads:
```javascript
var valueField = (opt('valueField', '') || '').trim() || firstNumericField(data) || 'value';
```
Also handle the case where `colIdx[valueField]` is `undefined` — guard before row access:
```javascript
var valIdx = data.colIdx[valueField];
var val = (valIdx !== undefined) ? safeNum(row[valIdx], 0) : 0;
```

**Phase:** Auto-field discovery phase.

---

### MIN-02: Domain creative viz — data contract in design brief specifies fields that don't exist in demo CSV

**What goes wrong:** vp-design writes a design brief with data contract "requires `kill_chain_stage`, `severity`, `count`." The demo CSV is created with columns `stage`, `sev`, `n`. The viz code references `kill_chain_stage` but the CSV has `stage` — every row shows empty or zero.

**Why it happens:** The design brief writes semantically meaningful field names. The demo CSV author uses abbreviated column names. These are written in different steps (vp-design vs vp-create) with no cross-check.

**Prevention:** The vp-create demo CSV creation step must verify CSV column names against the design brief data contract. A naming mismatch is a build blocker, not a post-install fix. When vp-design writes the data contract, it must also specify the exact CSV column names that will be used in the demo data.

**Phase:** Domain viz brief phase and demo CSV creation phase.

---

### MIN-03: Mandatory dashboard — dashboard JSON written before all vizs are validated, then never regenerated

**What goes wrong:** Claude writes the dashboard JSON midway through the vp-create workflow (after 3 of 5 vizs are built). The remaining vizs fail validation and are fixed. The dashboard JSON was written before the fixes and still contains the old (now wrong) formatter option names or viz type strings.

**Why it happens:** Dashboard JSON is treated as "write once at end" but the vp-create workflow allows validation and fixing to interleave. If the dashboard is written early for convenience, later fixes to viz option names or app_id do not propagate back to the dashboard JSON.

**Prevention:** The mandatory dashboard generation step must be the LAST step after ALL vizs have passed validation. The vp-create checklist must enforce this ordering explicitly:

```
- [ ] ALL vizs pass validate_viz.sh (zero FAIL)
- [ ] Step 3b: generate_assets.js run (previews exist)
- [ ] Package tarball
- [ ] THEN: Write dashboard JSON (not before)
```

**Phase:** Mandatory dashboard phase — ordering enforcement.

---

### MIN-04: Multi-series auto-discovery — discovered series count varies between Splunk searches, causing legend overflow

**What goes wrong:** A multi-series spark strip auto-discovers 3 numeric columns in development and renders a clean 3-series legend. In production, the SPL search returns 8 numeric columns. The legend overflows the panel and overlaps the data.

**Why it happens:** Auto-discovery without a cap will include every numeric column. The viz layout calculates legend positions assuming a fixed number of series. 8 series at the same layout formula overflows.

**Prevention:** Cap auto-discovered series at a formatter-configurable maximum with a sensible default:
```javascript
var maxSeries = Math.max(1, safeNum(opt('maxSeries', '6'), 6));
var numericFields = getAllNumericFields(data); // returns array of field names
numericFields = numericFields.slice(0, maxSeries); // enforce cap
```
Always cap at the maximum the layout algorithm was designed for. Show a "N more fields hidden" whisper-text indicator when series are truncated.

**Phase:** Auto-field discovery phase — multi-series vizs only.

---

## Phase-Specific Warning Table

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Auto-field discovery (all vizs) | CP-01 (inconsistent colIdx use), CP-02 (empty default = zero render) | Consistent three-point pattern: formatter → dynamic colIdx → row read |
| Auto-field discovery — default field selection | CP-03 (_time treated as numeric), MIN-01 (dot fields, whitespace trim) | Exclude `_` prefix fields; trim formatter inputs; guard `colIdx[field] !== undefined` |
| Multi-series auto-discovery | CP-04 (color assignment non-deterministic), MIN-04 (series overflow) | Hash-based color assignment; maxSeries cap with truncation indicator |
| Accent-as-highlight migration | CP-05 (DPR-03 still using t.accent), CP-06 (gi formula misapplied post-migration) | Audit all `t.accent` in data-element gradient calls; update accentIntensity semantics |
| Hover on series-colored elements | MP-02 (hover overlay invisible against saturated series color) | Increase hover alpha baseline to 0.18+ for series-color contexts |
| Domain viz ideation (vp-design) | CP-07 (overambitious Canvas rendering), MP-03 (non-unique viz names) | Complexity gate table; proxy patterns for graph/physics types; brand-prefix viz names |
| Domain viz generation (vp-viz) | CP-07 (layout algorithm code generation), MP-05 (per-frame expense) | Abort if generating recursive layout; cache gradients; cap cell count at 200 |
| Demo data alignment | MIN-02 (CSV column names don't match data contract) | vp-create CSV creation cross-checks against design brief field names |
| Mandatory dashboard — ordering | MIN-03 (dashboard JSON written before validation complete) | Dashboard JSON is LAST step after all vizs pass validate_viz.sh |
| Mandatory dashboard — search data | MP-04 (makeresults instead of CSV lookup) | Only `\| inputlookup {pack_id}_demo_*.csv` in dashboard searches |
| Mandatory dashboard — missing vizs | CP-08 (dashboard references failed/excluded viz) | Count visualization.js in tarball must equal panel count using `{app_id}.*` types |

---

## "Looks Done But Isn't" Checklist (v5.2.0 specific)

- [ ] **Auto-field consistency:** Formatter `valueField` default, demo CSV column name, and formatter `value=` attribute are the same string. Not three different names.
- [ ] **_time excluded:** Auto-discovery scan skips all fields beginning with `_`. No viz is plotting epoch timestamps as bar heights.
- [ ] **Empty formatter guard:** With no formatter settings configured, the viz renders meaningful data (first numeric column), not all zeros.
- [ ] **Series color stability:** For multi-series vizs, reordering the SPL result columns does not change which series gets which color.
- [ ] **Accent-only highlights:** After migration, `t.accent` appears in hover overlays and threshold indicators — NOT in data-element gradient addColorStop calls. grep confirms this.
- [ ] **gi formula sites updated:** `accentIntensity` / 100 is applied to highlight opacity, not to data fill depth. Any `gi` applied to data fill depth is a migration gap.
- [ ] **Domain viz complexity gate:** Every new domain-specific viz type in the inventory was assessed against the complexity tier table. Overambitious types have a proxy pattern assigned.
- [ ] **Mandatory dashboard last:** Dashboard JSON written after all vizs pass validate_viz.sh. Tarball viz count matches dashboard panel count.
- [ ] **Dashboard uses CSV lookups:** All dashboard panel searches use `| inputlookup`, not `makeresults`.
- [ ] **Preview distinctness:** All preview.png files show shape silhouettes distinct to their viz type. (Carried from v5.1.0 — applies to any new domain viz type added.)

---

## Sources

- `plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md` — ECR-01 through ECR-07 (field indexing, safeStr/safeNum, pagination, canvas state)
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — visualization_source.js template, formatData pattern, pre-code checklist
- `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md` — B3, B22 root causes
- `plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md` — DPR-03 gradient fills, accent architecture
- `plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md` — domain viz inventories, concept names vs. Splunk identifiers
- `plugins/splunk-viz-packs/skills/vp-design/references/viz-novelty-scores.md` — score-5 overambitious types list, scoring examples
- `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` — packaging workflow, validate-first ordering, demo CSV lookup rule
- `plugins/splunk-viz-packs/skills/vp-design/SKILL.md` — accent architecture, 60-30-10 rule, color principles
- `.planning/PROJECT.md` — v5.2.0 milestone goals (auto-field discovery, creative viz types, accent-as-highlights, mandatory dashboard)
- `tests/test28_drilldown_tabs/HANDOVER.md` — real evidence: hardcoded field names in event handlers

---

*v5.2.0 pitfalls research*
*Researched: 2026-05-18*
