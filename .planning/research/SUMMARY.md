# Project Research Summary

**Project:** splunk-viz-packs v5.1.0 Viz Hardening and Dashboard Wow-Factor
**Domain:** Splunk Canvas 2D custom visualization plugins — bug fixes, settings hardening, and professional dashboard composition
**Researched:** 2026-05-18
**Confidence:** HIGH

## Executive Summary

v5.1.0 is a hardening and polish release on top of the v5.0.0 design principles foundation. Three confirmed bugs from test29 must be fixed before any new feature work: the entrance-animation-off path leaves `_entranceProgress` at 0 causing gauges to render stuck at zero; the `opt()` helper in the viz source template only checks one of two config delivery paths causing formatter controls to silently do nothing when changed; and the flashCritical LED pulse is visually too subtle to function as a critical alert. These three bugs make the formatter feel broken and erode user trust before any design quality improvements are visible.

On top of bug fixes, the research identifies four concrete improvement layers. Settings completeness gaps (pagination, flexible status values, text placement, sparkline controls) close the "formatter options that do nothing" experience. Blueprint loosening on KPI vizs breaks the "identical centered number on every brand" pattern that makes AI-generated packs recognizable. Unique preview.png silhouettes per viz type complete the pack's professional appearance in the Splunk app browser. A new `dashboard-composition.md` reference file gives Claude the art direction needed to generate dashboards with visual hierarchy, depth, and story structure instead of equal-weight panel grids.

The primary architectural risk is the `opt()` vs `getOption()` drift: `formatter-patterns.md` already has the correct two-path helper, but the `vp-viz/SKILL.md` source template still uses the single-path shorthand. Every formatter control added or fixed in v5.1.0 must use `getOption` or the fixes will work in one delivery path and silently fail in the other. The fix is a single function replacement in one file and must come first — before any new controls are added.

## Key Findings

### Recommended Stack

No new runtime dependencies are introduced in v5.1.0. The zero-user-deps constraint is absolute — Splunk's RequireJS environment cannot load npm packages at runtime. All improvements are either ES5 algorithm upgrades in generated viz source code, build-time Node.js script extensions, or skill reference file additions.

The most relevant stack upgrade for v5.1.0 is promoting the two-path `getOption` helper (already in formatter-patterns.md) to the SKILL.md source template. Secondary additions include HSL lightness manipulation (~25 lines ES5) for smarter color token derivation, WCAG relative luminance promoted to theme.js for runtime auto-contrast selection, requestAnimationFrame delta-time loop replacing setInterval for continuous animations, and offscreen canvas glow caching for animated vizs.

**Core techniques:**
- `getOption(config, ns, key, default)` — already in formatter-patterns.md, needs promotion to SKILL.md source template to fix all settings wiring bugs
- HSL lightness manipulation (`hexToHsl`, `hslToHex`, `adjustLightness`) — derive panelHi, edgeStrong, hover states from base tokens without hardcoding hex pairs
- `contrastRatio(hex1, hex2)` at runtime — enables auto white/black text selection over user-configurable accent backgrounds
- `requestAnimationFrame` delta-time loop — pauses in background tabs (battery saving), syncs with monitor refresh rate (no 144Hz jank)
- Offscreen canvas glow cache — pre-render shadowBlur once, composite via drawImage each frame; GPU-accelerated vs CPU shadowBlur per frame
- `hexFromSplunk(val, fallback)` — already in theme.js; must wrap every `<splunk-color-picker>` read or color values render as black

### Expected Features

**Must have (table stakes):**
- Entrance animation off does not break gauge rendering — `_entranceProgress = 1` AND `_entranceDone = true` on the off-path
- Formatter controls respond from both dashboard JSON "options" and Format panel changes — getOption two-path pattern
- flashCritical LED pulse visibly prominent at small indicator sizes — expanded blur range (8-24px) + inner-fill secondary technique
- Flexible status values — `criticalValues`/`warningValues`/`okValues` comma-separated formatter inputs replacing hardcoded strings
- Dashboard backgroundColor always explicitly set — default Splunk grey is slop tell #3 per ds-ref-anti-patterns
- Asymmetric column layout (60/40 or 70/30) — symmetric 50/50 is absolute ban in ds-ref-anti-patterns
- One hero KPI at 1.5x the others — flat equal-size KPI row has no focal point
- Unique preview.png silhouette per viz type — shapes distinguishable (arc, columns, rows, text block, dot matrix), not just hue-shifted

**Should have (differentiators):**
- Gradient background wash on dashboard canvas — 2-3 layer radial/linear at low opacity; distinguishes from Splunk-generic
- KPI creative variants — label position, trend indicator shape, background treatment; removes the "identical centered number" tell
- Zone dividers (splunk.rectangle + splunk.markdown header pairs) — operators read zone headers, not individual panel titles
- Brand-specific gauge arc sweep angle — F1 expects 270°, healthcare expects 180°; follows brand personality from mood
- 3-section formatter structure (Data / Appearance / Interaction) — flat 10+ control lists feel machine-generated
- Faux glow on panel groups (stacked rects at decreasing opacity) — simulates soft shadow for Vercel/Linear lifted-card feel
- Text placement formatter control on KPI — label position above/below/beside; unit position after/superscript/suppressed

**Defer to v5.2.0:**
- Glass panel effect (Luxury/Futuristic mood) — recipe exists, medium complexity, can be applied manually
- Domain viz inventory auto-selection — high value but requires vp-init prompt restructuring with uncertain scope
- Story-first zone layout — high complexity; requires new vp-init question and layout generation restructuring
- Sparkline fill opacity granularity — low impact relative to bug priority

### Architecture Approach

v5.1.0 touches 7 existing files and creates 1 new file. The changes concentrate in the skill reference layer and build-time scripts. No new validation pipeline phases are added — the existing 4-phase structure absorbs all changes. The one new file (dashboard-composition.md) is purely additive creative direction with no corresponding validator checks, since composition is context-dependent and would produce false positives on valid compact packs.

**Component boundary map:**
1. `vp-viz/SKILL.md` — MODIFY: replace `opt()` with `getOption()` in source template; add entrance-off guard; KPI layout latitude note
2. `vp-viz/references/viz-blueprints.md` — MODIFY: KPI creative decisions section; Settings additions for Table, StatusChip, KPI, SparkStrip
3. `vp-viz/scripts/check_design.js` — MODIFY: update D08 regex to recognize `getOption` call signature
4. `vp-viz/scripts/generate_assets.js` — MODIFY: viz-name-based preview.png silhouette variation
5. `vp-recipes/references/animation-recipes.md` — MODIFY: entrance-off `_entranceProgress=1`; flashCritical blur 4-12 → 8-24 + inner fill
6. `vp-design/SKILL.md` — MODIFY: add dashboard-composition.md to hand-off protocol
7. `vp-design/references/dashboard-composition.md` — NEW: hero panel hierarchy, background treatment, story arc, whitespace, safe zone
8. `formatter-patterns.md` — NO CHANGE (already has correct getOption; it is the authoritative source, not the broken one)

**SKILL.md line budget constraint:** vp-viz/SKILL.md is near the 500-line limit. The opt → getOption change is net-neutral. Any additions must move content to references/ rather than expanding inline.

### Critical Pitfalls

1. **opt() single-path read causes silent formatter failures (CP-01)** — Every new or fixed formatter control must use `getOption(config, ns, key, default)` which checks both `config[ns+key]` and `config[key]`. The inline `opt()` shorthand only checks the namespaced path. Fix this in SKILL.md before adding any new controls, or every Phase B control ships with the same bug.

2. **Entrance animation off-path leaves `_entranceProgress = 0` — gauge stuck at zero (CP-02)** — When `showEntrance=false`, code must explicitly set both `_entranceDone = true` AND `_entranceProgress = 1`. Missing `_entranceProgress = 1` causes the arc endpoint to be `startAngle + (endAngle - startAngle) * 0 = startAngle` — a zero-length arc that looks like a render failure.

3. **Color picker values are Splunk integers, not hex strings (CP-03)** — Every `<splunk-color-picker>` control read must be wrapped in `hexFromSplunk(val, fallback)`. Raw reads return decimals like `30646`; using directly as `ctx.fillStyle` renders black. Confirmed by broken-rules.md B22.

4. **Blueprint loosening creates dead formatter variables (CP-05)** — When KPI creative freedom is added, Claude may write `opt()` reads but not connect the variable to any `ctx.*` call. D08 cannot detect dead variables — it only detects missing key strings. Every new control requires a mandatory comment tracing `opt() → variable → if/switch → ctx.*`.

5. **flashCritical pulse never stops when severity clears (CP-04)** — The severity check and `_stopPulse()` call must run unconditionally on every `updateView`, never inside a conditional guard. `_startPulse()` has a `if (this._pulsing) return` guard against double-start; but if `_stopPulse()` is inside a conditional, it is never called when data changes to non-critical.

## Implications for Roadmap

Research establishes four phases with explicit dependency ordering.

### Phase A: Foundation Fixes — Settings Wiring + Animation Toggles

**Rationale:** These are confirmed bugs that make the formatter feel broken. They are prerequisites for Phase B — adding new formatter controls before fixing the delivery mechanism means every new control ships with the same silent-failure bug. Three independent file targets; can be executed in parallel within the phase.
**Delivers:** Working formatter controls across both config delivery paths; gauge rendering when animation is off; prominent critical alert pulse; correct D08 pattern matching for the new getOption signature
**Addresses:** CP-01 (opt single-path), CP-02 (entrance progress=1), CP-03 (hexFromSplunk on color pickers), CP-04 (unconditional pulse stop); test29 named bugs: zone color, hover toggle, accentIntensity wiring
**Files:** `vp-viz/SKILL.md`, `animation-recipes.md`, `check_design.js`
**Avoids:** Risk that all Phase B controls ship non-functional

### Phase B: Blueprint Expansion + New Formatter Controls

**Rationale:** Depends on Phase A infrastructure being correct. Once getOption is in place, new controls work on first generation. Settings list additions to viz-blueprints.md are additive spec changes. KPI creative decisions section follows the existing Ring Gauge "Creative decisions YOU make" pattern.
**Delivers:** Flexible status value matching (comma-separated formatter inputs); pagination control on tables; KPI layout variants (label position, trend indicator, background treatment); sparkline mode; text placement on KPI
**Addresses:** Settings completeness gaps (table stakes category 2 from FEATURES.md); KPI differentiation differentiator; persona pain: "settings that produce no visible change"
**Files:** `vp-viz/references/viz-blueprints.md`, `vp-viz/SKILL.md` (KPI latitude note only)
**Avoids:** CP-05 (dead formatter variables) by enforcing mandatory trace comment on every new control

### Phase C: Dashboard Composition Reference

**Rationale:** Fully independent of Phases A and B. Zero regression risk — purely additive content in a new reference file. Addresses the most visible pain points for executive and brand designer personas: default grey canvas, equal-weight panel grids, no visual hierarchy. No validator coupling needed; composition is context-dependent creative direction.
**Delivers:** `dashboard-composition.md` covering hero panel sizing (40-60% canvas width), F-pattern reading flow, background treatment (dark backdrop + accent radial glow), whitespace strategy (24px gutter, 16px internal padding), 1820x980 safe zone for interactive panels, anti-patterns (symmetric grid, no focal point, flat single-color banner)
**Addresses:** Dashboard composition table stakes (backgroundColor, shadow rects, asymmetric layout); gradient background wash differentiator; zone dividers; story-first focal hierarchy
**Files:** `vp-design/references/dashboard-composition.md` (NEW), `vp-design/SKILL.md`
**Avoids:** MP-02 (absolute positioning breaks at non-1920 widths) via safe zone documentation in the new file

### Phase D: Unique Preview.png Generation

**Rationale:** Self-contained script change with no skill layer dependency. Addresses the final named v5.1.0 milestone goal. The brand designer persona's first touchpoint with a generated pack is the preview thumbnails in the Splunk app browser — identical silhouettes signal an unfinished pack before any viz is even rendered.
**Delivers:** Shape-distinct Canvas 2D silhouettes per viz type (arc = gauge, columns = bar, rows = table, large text = KPI, dot matrix = status grid); viz-name-based hue/layout variation so packs with multiple same-type vizs still produce distinct images; explicit dark background fill
**Addresses:** Table stakes: unique preview.png per viz; MP-01 (identical previews make viz picker useless); MIN-01 (transparent background wrong in Splunk dark UI)
**Files:** `vp-viz/scripts/generate_assets.js`
**Avoids:** MP-01, MIN-01

### Phase Ordering Rationale

- Phase A must be first: prerequisite for Phase B and highest-value/lowest-risk change in the release
- Phase B follows Phase A: new controls require the fixed getOption infrastructure to function correctly
- Phase C is independent and can run in parallel with B or after; zero regression risk
- Phase D is independent of all others; can be done last or parallel; self-contained script change

### Research Flags

Phases with standard, well-understood patterns (no additional research needed):
- **Phase A:** All bugs are root-caused. Exact fix code documented in ARCHITECTURE.md data flow diagrams. Files, functions, and line-level changes identified.
- **Phase B:** Additive spec changes to existing reference files. KPI creative section follows the existing Ring Gauge pattern — no new structure to invent.
- **Phase D:** Hashing a directory name to derive a visual variation is a standard technique; no external API dependencies.

Phases that benefit from brief review before execution:
- **Phase C (dashboard-composition.md content):** The specific numeric choices (40-60% hero width, 24px gutter) are best-practice estimates. Before locking as canonical, cross-check against the existing high-scoring test28 dashboards to ensure the numbers reflect what actually looks good in practice. Not a blocker — write and adjust.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All techniques are ES5 pure-algorithm implementations or extensions to existing Node.js scripts. No new runtime dependencies. Sourced from MDN official docs, WCAG 2.1, and direct codebase inspection. |
| Features | HIGH | Bug list sourced directly from PROJECT.md v5.1.0 milestone goals. Table stakes from ds-ref-anti-patterns (absolute bans) and ds-ref-layout-grid. Differentiators from domain-templates.md and mood-and-design.md. |
| Architecture | HIGH | All findings from direct inspection of the repo's authoritative source files. No external API dependencies or integration unknowns. Component boundary map is explicit with exact file paths and MODIFY/NEW/NO-CHANGE labels. |
| Pitfalls | HIGH | All critical pitfalls root-caused with exact code patterns. CP-01 confirmed by broken-rules.md B3. CP-03 confirmed by B22. CP-02 confirmed by animation-recipes.md cross-reference. CP-05 is reasoning inference supported by test22a/22b history. |

**Overall confidence:** HIGH

### Gaps to Address

- **score_design.js point weights and pass threshold:** The 25-points-per-dimension and 60-point pass threshold are heuristic estimates (MEDIUM confidence). Calibrate against test packs 25-28 before committing as blocking thresholds. Use WARN-only mode until calibrated. This is a v5.0.0 script — not a v5.1.0 blocker.
- **60-30-10 saturation bucketing thresholds:** The saturation values for palette balance scoring (< 0.08 neutral, > 0.40 accent) are heuristic. Validate against real packs before making blocking FAIL codes.
- **dashboard-composition.md numeric values:** Hero panel width ratio (40-60%), minimum gutter (24px), internal padding (16px) are design best practices, not Splunk-measured constants. Cross-check against test28 before treating as canonical.

## Sources

### Primary (HIGH confidence)
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — current opt() definition; SKILL.md line budget context
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — getOption authoritative two-path pattern; section-label casing table; hexFromSplunk
- `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` — rAF entrance pattern; LED pulse start/stop; delta-time loop
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — Settings lists per viz type; Ring Gauge creative latitude section
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` — 4-phase pipeline structure
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` — D01-D08 checks including D08 bidirectional regex
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js` — preview.png generation; silhouette logic
- `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md` — B3 (two-path config miss), B22 (color picker integer)
- `plugins/splunk-viz-packs/skills/vp-design/SKILL.md` — hand-off protocol; reference loading order
- `.planning/PROJECT.md` — v5.1.0 milestone goal list (named bugs and features)
- `.planning/REQUIREMENTS.md` — ANI-01..06, CFG-06, CFG-08, DQG-05, DQG-08
- `.planning/ROADMAP.md` — completed phases 6-9 context
- MDN Canvas API (Optimizing Canvas, TextMetrics, requestAnimationFrame) — shadowBlur cost, offscreen canvas, rAF recommendation
- WCAG 2.1: Relative Luminance — formula and dark/light luminance thresholds

### Secondary (MEDIUM confidence)
- `plugins/splunk-viz-packs/skills/vp-design/references/ds-ref-anti-patterns.md` — absolute bans list
- `plugins/splunk-viz-packs/skills/vp-design/references/ds-ref-layout-grid.md` — F-pattern, gradient background, faux glow recipes
- `plugins/splunk-viz-packs/skills/vp-design/references/ds-ref-archetypes.md` — SOC/executive/operational/analytical compositions
- `plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md` — F1, SOC, Retail, Healthcare, NOC viz inventories
- LogRocket: 60-30-10 Rule — color proportion scoring basis (industry consensus)

### Tertiary (LOW confidence)
- score_design.js point weights and 60-point pass threshold — heuristic, needs calibration against test packs 25-28
- Saturation bucketing thresholds for 60-30-10 palette check — heuristic, needs real-pack validation

---
*Research completed: 2026-05-18*
*Ready for roadmap: yes*
