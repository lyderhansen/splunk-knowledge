# Architecture Patterns — v5.1.0 Viz Hardening & Dashboard Wow-Factor

**Domain:** Splunk custom viz plugin skill architecture
**Researched:** 2026-05-18
**Milestone scope:** Integration of v5.1.0 fixes and features into the existing vp-* skill layer
**Confidence:** HIGH — all findings drawn from the repo's own authoritative source files

---

## Current Architecture (as-built for v5.0.0)

The splunk-viz-packs plugin follows a two-tier progressive disclosure pattern:

```
plugins/splunk-viz-packs/
  skills/
    vp-init/SKILL.md              → Entry gate: brand brief collection
    vp-design/SKILL.md            → Art direction: palette, mood, viz inventory
      references/
        design-principles.md      → DPR-01..10 rules + Canvas API mappings
        consistency-grid.md       → CON-01..05 spacing/typo formulas
        mood-and-design.md        → 9 moods → effects lookup
        domain-templates.md       → Domain viz inventories (F1, SOC, etc.)
        viz-novelty-scores.md     → Anti-donut scoring
    vp-viz/SKILL.md               → Code generation (formatter + JS + config)
      references/
        viz-blueprints.md         → 16 viz type data contracts + settings lists
        formatter-patterns.md     → Exact Splunk HTML syntax, 4-section structure
        canvas-recipes.md         → Functional patterns (hit test, drilldown, etc.)
        edge-cases.md             → ECR-01..05 correctness patterns
        conf-templates.md         → app.conf, visualizations.conf templates
        theme-template.md         → Complete theme.js with getSpacing/getTypoScale
      scripts/
        build_flat.js             → AMD bundler (inlines theme.js)
        validate_viz.sh           → 4-phase gatekeeper
        validate_ast.js           → Phase 1: ES5 AST + HTML DOM checks
        validate_dash.js          → Phase 2: Dashboard XML + cross-file checks
        check_contrast.js         → Phase 3: WCAG AA token checks
        repair_findings.js        → Phase 3: Auto-fix B10/B9/B5/B7/B20
        check_design.js           → Phase 4: DQG design quality checks (D01-D08)
        generate_assets.js        → preview.png + appIcon.png generator
    vp-recipes/SKILL.md           → On-demand effect recipes
      references/
        animation-recipes.md      → ANI-01..06 rAF patterns
        depth-recipes.md          → Gradients, ambient light, vignette
        texture-recipes.md        → Noise grain, glass panels
        typography-recipes.md     → 3-tier hierarchy, spaced text
        mood-recipes.md           → Atmosphere recipes (ambient, glass, etc.)
        all-patterns.md           → 185-line index pointing to all recipe files
    vp-create/SKILL.md            → Build + package pipeline
    vp-debug/SKILL.md             → Debug guidance
      references/
        fatal-rules.md            → Hard FAIL codes with fix recipes
        broken-rules.md           → Soft FAIL codes
        edge-cases.md             → Runtime pitfalls
```

### Validation pipeline (validate_viz.sh)

```
Phase 1  validate_ast.js  --html formatter.html    → B5/B7/B10/B20 formatter checks
         validate_ast.js  --js   visualization_source.js → F1-F12 ES5 + null guard checks
         validate_ast.js  --cross formatter.html JS → Phase 2 cross-file checks
Phase 2  validate_dash.js --xml  dashboard.xml     → B9 type format + options namespace
         [cross-file: formatter control names vs JS opt() calls]
Phase 3  check_contrast.js theme.js               → WCAG AA token verification
         repair_findings.js [--repair]             → Auto-fix B10/B9/B5/B7/B20
Phase 4  check_design.js formatter.html JS theme.js → D01-D08 design quality gate
Structure checks                                   → A01-A04 assets + R1-R8 conf files
```

---

## v5.1.0 Fix Categories and Where They Live

Seven distinct fix/feature categories surface from test29 and the v5.1.0 target list. Each maps to a specific layer.

### Category 1: Settings wiring bugs (zone colors, hover toggle, accentIntensity)

**Root cause:** The `opt()` helper in the vp-viz SKILL.md source template reads only `config[ns + key]`. Dashboard Studio may also deliver settings as short keys (without namespace prefix) when a user changes a value in the formatter panel. The current template misses the short-key path for formatter-triggered changes.

**Where the bug lives:** `vp-viz/SKILL.md` — the `updateView` template's inline `opt()` function definition.

**Where the fix already exists:** `formatter-patterns.md` has the correct `getOption()` two-path helper that checks `config[ns + key]` first, then falls back to `config[key]`. The SKILL.md source template still uses the single-path `opt()`. They need to be reconciled.

**Files that change:**
- `vp-viz/SKILL.md` — MODIFY: replace the inline `opt()` definition in the `visualization_source.js` template with the `getOption()` + `getNS()` pattern from formatter-patterns.md.
- `vp-viz/scripts/check_design.js` — MODIFY: D08 bidirectional check uses regex to match formatter control names against JS opt() calls. After the fix, the JS pattern changes from `opt(key)` to `getOption(config, ns, key)`. Update the D08 regex to recognise the `getOption` call signature.

**Constraint:** The fix must remain ES5. The existing `getOption` in formatter-patterns.md is already ES5-compatible.

**No new files. formatter-patterns.md needs no structural change** — it is already the correct authoritative source.

---

### Category 2: Entrance animation breaking gauge rendering (stuck at 0)

**Root cause:** The rAF entrance pattern in `animation-recipes.md` initialises `_entranceProgress = 0` in `initialize()`. When `showEntrance = 'false'` is set in the formatter, the `_startEntrance()` call is skipped — but `_entranceProgress` stays at 0. When `_render()` uses `_entranceProgress` to calculate the arc endpoint, the gauge draws from `startAngle + (endAngle - startAngle) * 0 = startAngle`, producing a zero-length arc. The gauge appears stuck at 0.

The animation-off path must explicitly set `_entranceDone = true` AND `_entranceProgress = 1.0` so `_render` draws the final state immediately.

**Where the bug lives:** `animation-recipes.md` — the `// In updateView:` section of the rAF entrance pattern. The `prefersReducedMotion()` branch correctly sets `_entranceDone = true` but the `showEntrance === false` formatter toggle path does not also set `_entranceProgress = 1`.

**Files that change:**
- `vp-recipes/references/animation-recipes.md` — MODIFY: add `_entranceProgress = 1` assignment in the `showEntrance === false` branch alongside `_entranceDone = true`.
- `vp-viz/SKILL.md` — MODIFY: add a note to the pre-code checklist item for animation opt() reads: "when showEntrance=false, set both `_entranceDone = true` AND `_entranceProgress = 1` before calling _render."

---

### Category 3: flashCritical LED pulse not visually prominent

**Root cause:** The LED pulse `drawPulsingIndicator` in `animation-recipes.md` oscillates `shadowBlur` in the range `4 + 8 * sin(...)` (4-12px). At typical small status cell sizes (indicator circle radius 4-6px), shadowBlur=12 disperses across the surrounding background and is nearly invisible. The effect requires either a wider blur range or a secondary visual cue that does not rely solely on blur.

**Where the fix lives:** `animation-recipes.md` — the `_startPulse` function and `drawPulsingIndicator` helper. The `_pulseBlur` range needs to be `8 + 16 * sin(...)` (8-24px) for visibility at small sizes. A secondary technique — bright inner fill at 100% alpha alongside the shadow — ensures visibility even when hardware limits shadowBlur effectiveness.

**Files that change:**
- `vp-recipes/references/animation-recipes.md` — MODIFY: update `_startPulse` blur range and `drawPulsingIndicator` to add the inner-fill technique alongside shadow.

---

### Category 4: Missing formatter controls (pagination, text placement, sparkline controls, flexible status values)

**Root cause:** `viz-blueprints.md` Settings lists define what controls each viz type should expose. The current lists are incomplete for four types:
- **Data Table:** `rowsPerPage` is in the MUST-HAVE code block but not in the Settings: line used by CFG-08 derivation logic — Claude may omit it from the formatter
- **Status Chip / Badge:** `criticalValues`, `warningValues`, `okValues` are hardcoded strings in `severityColor()` — user cannot configure which SPL field values map to which status
- **KPI:** `textPlacement` (above/below/overlay) is a common differentiator but absent from the Settings list, causing all KPI tiles to default to the same stack layout
- **Spark Strip:** `sparkMode` (line vs area) affects both visual weight and readability but is not exposed as a formatter control

**Files that change:**
- `vp-viz/references/viz-blueprints.md` — MODIFY: add missing controls to Settings: lines for each affected viz type. Additions only, no removals:
  - Data Table: add `rowsPerPage`
  - Status Chip: add `criticalValues`, `warningValues`, `okValues`
  - KPI: add `textPlacement`
  - Spark Strip: add `sparkMode`

**D08 impact:** None at the reference level — these are new settings additions. D08 will correctly require them to appear in JS opt() calls once a viz implements the new settings.

---

### Category 5: Viz blueprints too rigid — KPI creative freedom

**Root cause:** The Ring Gauge blueprint entry has an explicit "Creative decisions YOU make:" section listing layout variables Claude controls (sweep angle, track style, fill style, center content, cap style). The KPI / Single Value Tile entry has no equivalent section. Claude interprets the Settings list as a complete prescription and produces structurally identical KPI tiles across brands, differing only in colors.

**Where the fix lives:** `viz-blueprints.md` — the Single Value Tile (KPI) section.

**Files that change:**
- `vp-viz/references/viz-blueprints.md` — MODIFY: add "Creative decisions YOU make:" list to KPI section (label placement above/below/beside, trend indicator shape — arrow/dot/sparkline/badge, background treatment, unit styling relative to value, font weight/condensed/expanded).
- `vp-viz/SKILL.md` — MODIFY: add a note to the CFG-08 derivation paragraph that KPI layouts must differ between brands — different value font weights, label positions, and trend indicator shapes are expected brand differentiators.

---

### Category 6: Unique preview.png per viz (no duplicates)

**Root cause:** `generate_assets.js` generates a silhouette-style preview.png based on viz type detected from the viz directory name. When two vizs in the same pack share the same type keyword (e.g., two vizs both containing "kpi" in their directory name), the script generates identical PNG silhouettes. There is no per-viz variation mechanism.

**Where the fix lives:** `generate_assets.js` — the script reads `shared/theme.js` for brand colors. It needs a deterministic per-viz variation: using the viz directory name to derive a hue rotation or layout variant for the silhouette so no two directories produce an identical PNG.

**Files that change:**
- `vp-viz/scripts/generate_assets.js` — MODIFY: add viz-name-based variation (e.g., derive a hue offset from a simple hash of the viz name, or vary the silhouette layout based on name length modulo a set of alternatives).

No SKILL.md or recipe file changes needed — vp-create already directs "run generate_assets.js step 3b."

---

### Category 7: Dashboard composition — story, depth, background, professional layout

**Root cause:** Dashboard JSON is generated inline during vp-viz execution per the "no subagent" constraint. The vp-design SKILL.md hand-off directs Claude to "load ds-create from splunk-dashboard-studio" for dashboard JSON syntax. But there is no guidance on how to structure the dashboard canvas itself for professional composition: panel sizing hierarchy, background treatment, the "hero panel" concept, whitespace strategy, or the five-second story test applied to layout.

Without this guidance, Claude produces equal-grid layouts (all panels same size, no focal hierarchy) which are the visual equivalent of a slide deck with all bullet points in the same font size.

This is a **new reference file** — dashboard composition is art direction (belongs in vp-design references) not syntax rules (which belong in vp-viz).

**Files that change:**
- `vp-design/references/dashboard-composition.md` — NEW file providing: panel hierarchy (hero at 40-60% canvas width + supporting panels), background treatment (dark backdrop, accent color radial glow behind hero), whitespace strategy (minimum 24px gutter, 16px internal panel padding), story arc (what the eye reads in sequence), and anti-patterns (all-same-size panels, table-as-hero, no focal point).
- `vp-design/SKILL.md` — MODIFY: add dashboard-composition.md to the hand-off protocol: "Load [dashboard-composition.md](references/dashboard-composition.md) before writing dashboard JSON."

No validation script changes — composition is creative direction, not mechanically checkable.

---

## Component Boundary Map for v5.1.0

| Component | v5.1.0 Action | What Changes |
|-----------|---------------|--------------|
| `vp-viz/SKILL.md` | MODIFY | Replace `opt()` with `getOption()` in source template; add entrance-off guard note; KPI layout latitude note |
| `vp-viz/references/viz-blueprints.md` | MODIFY | KPI creative latitude section; 4 viz type Settings expansions |
| `vp-viz/references/formatter-patterns.md` | NO CHANGE | Already has the correct `getOption` pattern |
| `vp-viz/scripts/check_design.js` | MODIFY | Update D08 regex to match `getOption` call pattern |
| `vp-viz/scripts/generate_assets.js` | MODIFY | Viz-name-based preview.png variation |
| `vp-recipes/references/animation-recipes.md` | MODIFY | Entrance-off `_entranceProgress=1` fix; flashCritical blur range + inner-fill |
| `vp-design/SKILL.md` | MODIFY | Add dashboard-composition.md to hand-off protocol |
| `vp-design/references/dashboard-composition.md` | NEW | Hero/supporting panel hierarchy, background, story arc |
| `vp-viz/references/edge-cases.md` | NO CHANGE | ECR patterns complete from Phase 8 |
| `vp-viz/references/canvas-recipes.md` | NO CHANGE | Functional patterns complete |
| `vp-viz/scripts/validate_viz.sh` | NO CHANGE | Phase 4 hook already wired for check_design.js |
| `vp-viz/scripts/check_contrast.js` | NO CHANGE | WCAG checks unaffected |
| `vp-create/SKILL.md` | NO CHANGE | Build pipeline unchanged |

---

## Data Flow: Settings Wiring (the fix)

Current broken path:
```
formatter.html  value="50" → Splunk stores as config["appid.vizname.accentIntensity"]
                              OR (on formatter change) config["accentIntensity"]
updateView opt(key)        → reads ONLY config[ns + key]
                              MISSES config[key] → returns fallback=50 always
Result: user changes setting in UI → viz ignores the change
```

Fixed path using `getOption` from formatter-patterns.md:
```
formatter.html  value="50" → stored as config["appid.vizname.accentIntensity"]
                              OR config["accentIntensity"]
getOption(config, ns, key) → checks config[ns + key] first
                              falls back to config[key]
Result: all formatter changes take effect immediately
```

The fix lives in one place — the `opt()` function definition in the vp-viz SKILL.md source template — and propagates to every newly generated viz through the template.

---

## Data Flow: Entrance Animation (the fix)

Current broken path:
```
showEntrance = opt('showEntrance','true') → 'false'
_entranceDone guard: if (showEntrance && !_entranceDone) → false, skip animation start
_render called with _entranceProgress = 0 (set in initialize())
Gauge arc draws: startAngle + (endAngle-startAngle) * 0 = zero-length arc
Result: gauge stuck at 0
```

Fixed path:
```
showEntrance = 'false'
→ _entranceDone = true AND _entranceProgress = 1.0 (both set explicitly)
_render called with _entranceProgress = 1.0
Gauge arc draws: startAngle + (endAngle-startAngle) * 1 = full target arc
Result: gauge shows correct value immediately
```

---

## Data Flow: Dashboard Composition (new)

```
vp-design SKILL.md
  → user provides brand brief
  → load dashboard-composition.md (NEW)
    → defines: hero panel position + size relative to canvas
    → defines: background treatment (dark backdrop + accent glow)
    → defines: five-second story sequence (what user reads first)
  → design brief includes panel layout map as part of output
  → hand-off to vp-viz
    → vp-viz generates dashboard JSON with composition-aware panel sizes
    → hero panel gets largest visualization region (not 1/N equal grid)
    → background rectangle uses brand dark + accent radial gradient
```

---

## Build Order for v5.1.0 Phases

The fixes fall into three dependency tiers:

**Tier 1 — Foundation fixes (no inter-dependencies, highest value, do first):**
- settings wiring: `vp-viz/SKILL.md` opt → getOption
- entrance animation fix: `animation-recipes.md`
- flashCritical visibility: `animation-recipes.md`
- D08 pattern update: `check_design.js`

These touch independent files and can be done in parallel within a single phase.

**Tier 2 — Blueprint and content updates (stable after Tier 1):**
- viz-blueprints.md: Settings additions for Table, StatusChip, KPI, SparkStrip
- viz-blueprints.md: KPI creative latitude section
- vp-viz/SKILL.md: KPI layout note

Tier 2 logically follows Tier 1 because: once the settings wiring is fixed, newly added settings work correctly on first build. Adding settings before the wiring fix is not blocked but would produce silently non-functional controls until Tier 1 lands.

**Tier 3 — New features (independent of Tier 1/2):**
- `dashboard-composition.md`: new file, no dependencies
- `vp-design/SKILL.md`: hand-off update
- `generate_assets.js`: unique preview variation

Recommended phase structure for v5.1.0:
```
Phase A: Fix settings wiring + entrance bug + flashCritical + D08 update
          → vp-viz/SKILL.md, animation-recipes.md, check_design.js

Phase B: Expand blueprints + creative latitude
          → viz-blueprints.md, vp-viz/SKILL.md KPI note

Phase C: Dashboard composition
          → dashboard-composition.md (new), vp-design/SKILL.md

Phase D: Asset uniqueness
          → generate_assets.js
```

Phase A delivers the highest user-facing value (fixing bugs that make settings non-functional) with the lowest risk (three targeted file edits, zero new files). Phase C is pure additive value with zero regression risk.

---

## Key Architectural Constraints That Bound v5.1.0

1. **SKILL.md line budget < 500 lines.** vp-viz/SKILL.md is near the limit. The opt → getOption change is net-neutral (replaces one function body with one slightly larger function body). Any other addition to SKILL.md must verify the line count stays under 500. Move content to references/ if needed.

2. **ES5 only in all generated code and scripts.** The `getOption` function in formatter-patterns.md is already ES5. No v5.1.0 fix introduces const/let/arrow functions. `animation-recipes.md` is already ES5.

3. **Single source of truth for shared patterns.** The `getOption` function lives in formatter-patterns.md. The SKILL.md template must reference it ("see formatter-patterns.md Full formatter example") rather than copy it. Copying re-creates the drift problem.

4. **No validator rules for composition guidance.** Dashboard composition lives in vp-design as art direction. Do not add D09+ codes to check_design.js for panel sizing or layout — layout is context-dependent and would produce false positives on valid compact packs.

5. **No new FAIL codes for missing blueprint settings.** The four new Settings list additions in Category 4 are guidance, not validator requirements. D08 will naturally enforce them if a viz implements the new controls without corresponding JS opt() calls.

---

## Anti-Patterns to Avoid in v5.1.0

### Copy-pasting getOption into SKILL.md source template
Copy the full `getOption` + `getNS` function bodies into the SKILL.md template rather than referencing formatter-patterns.md. This re-creates the same drift problem as the original `opt()` divergence. Use a comment reference instead: `// Use getOption from formatter-patterns.md.`

### Changing D08 check scope to include the new settings additions
Updating check_design.js D08 to also flag the four new settings from Category 4 (rowsPerPage, criticalValues, etc.) as required. D08 checks bidirectional wiring for controls that ARE present in a formatter — it does not check that a formatter has a specific minimum set of controls (that is D05's job for section count). The new settings are opt-in guidance, not hard requirements.

### Adding composition validation to check_design.js
Creating D09+ validator checks for panel sizes or layout ratios. Dashboard composition is creative — a 3-viz pack may use equal panels intentionally. Validator checks would produce false positives and reduce creative freedom. Composition guidance belongs in vp-design/references/ only.

### Modifying formatter-patterns.md getOption to fix the SKILL.md template
Changing the getOption signature in formatter-patterns.md instead of updating the SKILL.md template that uses the wrong `opt()`. formatter-patterns.md is the correct version. SKILL.md is the one that needs updating.

---

## Sources

All findings are HIGH confidence — sourced directly from the repo's authoritative skill files:

- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — current source template with `opt()` definition
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — `getOption` already correctly defined here
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — current Settings lists per viz type
- `plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md` — ECR patterns
- `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md` — functional recipe patterns
- `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` — rAF entrance and pulse patterns
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` — 4-phase pipeline structure
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` — D01-D08 checks including D08 regex logic
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js` — asset generation
- `plugins/splunk-viz-packs/skills/vp-design/SKILL.md` — hand-off protocol
- `.planning/PROJECT.md` — v5.1.0 target features
- `.planning/ROADMAP.md` — completed phases 6-9 context
