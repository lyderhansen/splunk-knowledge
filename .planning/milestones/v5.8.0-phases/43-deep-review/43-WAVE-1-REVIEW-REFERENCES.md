# Wave 1 Review — Reference Files (13 files)

**Reviewer:** Executor agent (43-01)
**Date:** 2026-05-24
**Scope:** All 13 reference files that own v5.5-5.8 patterns:
- 12 files in `plugins/splunk-viz-packs/skills/vp-viz/references/`
- 1 misfiled file: `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` (Phase 40 epicenter, owns AF-01/AF-02)

**Method:** Every file read end-to-end per CONTEXT D-02. Findings classified per CONTEXT D-03 rubric.

---

## Cluster 1: Theme + Checklist Foundation

Files reviewed:
- `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md`

---

### BLOCKER

**1. [THM-01 / THM-02 — absent everywhere in plugin files]**

- **File:** All three files + all other Wave 1 files
- **Issue:** The change-checklist in CONTEXT.md `<review_checklist>` lists THM-01 through THM-05 as "five theme rules." THM-03 (glow scaling), THM-04 (inner shadow), and THM-05 (backgroundColor unconditional read) are all documented in theme-template.md. But THM-01 and THM-02 are completely absent — no heading, no code comment, no citation in ANY plugin file reviewed in this wave. They exist only in CONTEXT.md's `<review_checklist>` and `<prior_decisions>` lists.
- **Impact:** Actively misleads the Coverage Summary: if THM-01 and THM-02 are enforcement targets, they have zero documentation home in the plugin and cannot be verified. If they are not enforcement targets (legacy change-IDs that were never formalized into docs), the Coverage Summary will incorrectly mark them as "unverified" when they were never meant to be documented codes.
- **Recommendation:** Determine what THM-01 and THM-02 encode. Based on context, the most likely interpretation is:
  - THM-01 = Light theme is NOT an inversion of dark (documented as a prose note in theme-template.md:219 and visualization-js-template.md:53 but not tagged)
  - THM-02 = LIGHT object WCAG contrast values (CP-02: textFaint '#6B7080' WCAG AA — mentioned in theme-template.md:74 inline comment but not tagged THM-02)
  Add explicit `## THM-01:` and `## THM-02:` sections or inline `// THM-01` / `// THM-02` code comments to formalize these tags where they belong (theme-template.md and pre-code-checklist.md).

**2. [D10 — @viz-type first-line annotation absent from visualization-js-template.md]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md`
- **Lines checked:** Line 1 of the `## visualization.js Template` code block and lines 22-312 (the entire JS template section)
- **Issue:** The template code block starts with `import { VisualizationAPI } from '@splunk/dashboard-studio-extension';` — no `// @viz-type:` comment on line 1 of the template. pre-code-checklist.md line 18 states this is ENFORCED by check_design.js D10, but the Extension API template itself omits the annotation. Any Extension API viz generated from this template will fail D10.
- **Impact:** Every Extension API viz generated from this template will FAIL check_design.js D10 validation. BLOCKER because it contradicts a locked decision (D10 is an enforcement rule) and would actively mislead Claude into producing code that fails the validator.
- **Recommendation:** Add `// @viz-type: {{VIZ_TYPE_PLACEHOLDER}}` as the very first line of the `visualization.js Template` code block (before the `import` statement), with a note that it must be populated from the list `(kpi, gauge, bars, grid, line, timeline, radar, progress, scatter, network)`.

**3. [B5 / B7 / B9 / B10 / B20 / B21 — enforced codes without findable tagged definitions]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md`
- **Lines:** 7-8, 11, 12, 13, 14, 31
- **Issue:** validate_viz.sh emits `FAIL B5`, `FAIL B7`, `FAIL B9`, `FAIL B10`, `FAIL B20`, `FAIL B21`. When a developer receives these failure codes and searches for their definition, they find only B22 is explicitly tagged in pre-code-checklist.md (line 31: `(B22)`). B5, B7, B9, B10, B20, B21 describe the rules in prose but are NOT tagged with their B-code identifiers anywhere in pre-code-checklist.md. The vp-debug/references/broken-rules.md defines only B1, B4, B14, B19 — these six codes are completely undocumented with explicit B-code anchors.
- **Impact:** Directly breaks the cross-reference chain: `validate_viz.sh FAIL B5` → developer searches docs → no `B5` anchor found. Contradicts the intent of pre-code-checklist as "the canonical list of THM/B/D/E/F/R rule tags."
- **Recommendation:** Add the B-code tag to each corresponding checklist item:
  - Line 7 (type="custom" on color pickers): append `(B5)`
  - Line 8 (value= not default=): append `(B7)`
  - Line ~36: append `(B9)` to the Dashboard JSON type warning
  - Line 7/formatter namespace section: append `(B10)` to `{{VIZ_NAMESPACE}}` rule
  - Line 14 (themeMode auto): append `(B20)`
  - Line 22 (safeStr/safeNum null guards): append `(B21)`

---

### WARNING

**1. [THM-03/THM-04 — documented as code comments only, not as findable anchors]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md`
- **Lines:** 226-233
- **Issue:** THM-03 (glow scaling by isDark ? 1.0 : 0.4) and THM-04 (inner shadow vs 1px border) are documented as JavaScript comment blocks in a fenced code example. They are NOT headings, NOT bold labels. `grep -n "THM-03" theme-template.md` returns line 226 (comment in code block). The pre-code-checklist.md references them as items in the checklist (lines 15-16) with the tags inline. This is functional but the comment-only presentation in theme-template.md makes them easy to miss in a line-by-line read.
- **Impact:** Degrades document findability — THM-03 and THM-04 are not in the file's heading hierarchy. No cross-link footer like THM-05 has.
- **Recommendation:** Promote THM-03 and THM-04 to `##` headings in theme-template.md with WRONG/RIGHT framing (matching THM-05's pattern). The current code-comment approach is functional but inconsistent with THM-05's explicit heading treatment.

**2. [config-json-template.md — EF-01/EF-02 not mentioned; readers of config.json file won't find IIFE/bundled package guidance]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md`
- **Lines:** Full file reviewed — no mention of EF-01 or EF-02
- **Issue:** config-json-template.md is the Extension API formatter reference. A developer reading ONLY this file gets no indication that the corresponding `visualization.js` must be bundled as IIFE (not ESM) and that `@splunk/dashboard-studio-extension` must be bundled (not external). These rules are in build-mjs-template.md, but there's no cross-reference.
- **Impact:** Stale phrasing / missing cross-reference. A developer scaffolding an Extension API viz from config.json template alone would not know the IIFE bundling requirement.
- **Recommendation:** Add a brief "## Build Requirements (EF-01/EF-02)" note or cross-link footer to config-json-template.md pointing to build-mjs-template.md. Pattern mirrors THM-05's cross-link footers in that file.

**3. [conf-templates.md — no mention of EF-03 or Extension API bare stanza alignment]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md`
- **Lines:** Lines 30-51 (visualizations.conf section)
- **Issue:** conf-templates.md shows `[{{VIZ_NAME}}]` as the stanza pattern (correct bare format). However, it does not cite EF-03, does not cross-reference package-mjs-template.md, and does not explain WHY bare stanza names are required (i.e., the "Splunk resolves app context automatically" rationale from package-mjs-template.md EF-03 section). Developers reading conf-templates.md independently won't know they must use bare `[kpi_tile]` rather than `[app_id.kpi_tile]`, and won't understand the failure mode if they deviate.
- **Recommendation:** Add a brief note under the visualizations.conf section: "Bare stanza names (`[${vizName}]`) only — see package-mjs-template.md EF-03 for the reasoning. Prefixing with `app_id.` causes Splunk to return 'unknown visualization type' at render time."

**4. [formatter-patterns.md — accent architecture (Phase 23) lacks a dedicated documentation section; CP-01/CP-02/CP-03 tags are sparse]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md`
- **Lines:** Line 158 (NOTE: accentColor picker → Effects section), line 173 (section structure rule), line 602 (brand swatches 6-8 rule note)
- **Issue:** The accent architecture from Phase 23 (accent for hover/glow/selection only; series colors for data; intensity uncapped; position configurable) is scattered: CP-03 appears as a NOTE at line 158; CP-01 (6-8 brand swatches) is documented in template comments and a trailing note at line 602; CP-02 (WCAG contrast for textFaint) is in theme-template.md only. There is no consolidated "## Accent Architecture" section that summarizes the Phase 23 design decision. A developer reading formatter-patterns.md gets the correct rules but cannot easily reconstruct the architectural intent.
- **Impact:** Missing cross-reference degrades the doc but doesn't break generation — the individual rules ARE present.
- **Recommendation:** Add a `## Accent Architecture (Phase 23 — CP-01/CP-02/CP-03)` section near the top of formatter-patterns.md with the four rules explicitly labeled: (CP-01) brand swatch minimum 6-8; (CP-02) WCAG contrast baseline (pointer to theme-template.md); (CP-03) accentColor for hover/glow/selection only, never solid fill, position in Effects section.

**5. [package-mjs-template.md — uses "D-09" code in generate_previews comment, not "D-02" (the correct Phase 41 decision ID)]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md`
- **Line:** 216
- **Issue:** The comment reads `// 5. Generate preview.png per viz (D-09: delegate to generate_previews.py for Pillow rendering)`. Phase 41 CONTEXT.md records this as decision D-02 (the generate_previews.py/silhouette split). D-09 is a check_design.js code, not a Phase 41 decision ID. The STATE.md also records it as `[Phase 41 D-02]`. Using D-09 in the comment incorrectly implies this is a check_design.js quality rule rather than the Phase 41 architectural split decision.
- **Recommendation:** Change `(D-09:` to `(Phase 41 D-02:` at line 216.

**6. [visualization-js-template.md — WRONG/RIGHT table uses ESM syntax in "WRONG" column but the template body IS ESM; inconsistency for Extension API path]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md`
- **Lines:** 304-312 (WRONG/RIGHT table)
- **Issue:** The WRONG/RIGHT table at the bottom correctly marks AMD `define(...)` as WRONG and ESM `import` as RIGHT. However, this is the Extension API template file — ESM `import` syntax IS correct here for the source file. The WRONG/RIGHT table is accurate for the template's purpose, but may confuse Classic viz developers who land on this page (since Classic strictly requires AMD `define` or `require`). The file title makes it clear this is Extension API only, but there's no explicit "Extension API ONLY — Classic vizs must NOT use ESM" warning at the top.
- **Recommendation:** Add a one-line callout at the top of the file: `**Classic path:** This file is Extension API only. Classic viz source (`visualization_source.js`) uses `require()`/`module.exports`. See vp-viz SKILL.md for the format selector.`

---

### NIT

**1. [theme-template.md — cross-link footer at line 259 uses prose rather than exact file:line references]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md`
- **Line:** 259
- **Issue:** Cross-link says "See also: pre-code-checklist.md THM-05 line; visualization-js-template.md / config-json-template.md for the Extension API equivalent." No specific line numbers. Minor readability improvement: add `(line 17)` and `(line 165)` to the cross-link for faster navigation.
- **Recommendation:** `See also: pre-code-checklist.md (line 17 THM-05 gate); visualization-js-template.md (line 165 bg pattern); config-json-template.md ("Background Color Note" H2).`

**2. [pre-code-checklist.md line 11 "minimum 10 controls" conflicts with Section structure guidance elsewhere in the file]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md`
- **Line:** 11
- **Issue:** `□ Formatter: minimum 10 controls (4 sections required when mood effects present)` implies 10 is the general minimum and 4 sections is a sub-condition. But the Section structure guidance in formatter-patterns.md specifies "minimum of 3 sections" as the baseline. The KPI full example in formatter-patterns.md shows 3 sections with more than 10 controls. The number 10 originates from feedback_formatter_minimum_too_low.md (memory: "target 14-18 with domain-specific options"). The 10-control floor is reasonable but inconsistently expressed.
- **Recommendation:** Clarify the phrasing: `□ Formatter: minimum 10 controls (target 14-18 for domain vizs); minimum 3 `section-label` sections (4 sections when Animation section present).`

**3. [canvas-recipes.md top note "Phase 6 additions" is an internal planning reference with no user value]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md`
- **Lines:** 1-2
- **Issue:** `> **Restructured in v5.0.0 Phase 6.** Effect-category recipes have been split into focused files.` The "Phase 6" reference is internal project metadata and may confuse users wondering what "Phase 6" refers to.
- **Recommendation:** Remove the "Phase 6" reference. Keep the "v5.0.0" version reference if desired: `> **v5.0.0:** Effect-category recipes split into focused files.`

---

## Cluster 2: Extension API + Formatter Patterns

Files reviewed:
- `plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/build-mjs-template.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md`

---

### BLOCKER

**1. [conf-templates.md — savedsearches.conf uses Classic display.visualizations.custom.type format; Extension API path has no equivalent guidance]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md`
- **Lines:** 87-96 (savedsearches.conf section)
- **Issue:** The savedsearches.conf template only shows Classic path:
  ```
  display.visualizations.type = custom
  display.visualizations.custom.type = {{PACK_ID}}.{{VIZ_NAME}}
  ```
  Extension API vizs do NOT use `display.visualizations.custom.type` — they use `display.general.type = visualizations` and the `type` field in the dashboard JSON. There is no guidance for what savedsearches.conf looks like for an Extension API viz, potentially causing developers to write Classic-style savedsearches.conf entries for Extension API packs.
- **Impact:** Would actively mislead Claude into producing wrong configuration for Extension API viz packs — a BLOCKER for the Extension API path.
- **Recommendation:** Add a note at the end of the savedsearches.conf section: "**Extension API path:** savedsearches.conf uses the same basic structure. The `display.visualizations.custom.type = {{PACK_ID}}.{{VIZ_NAME}}` field IS the correct format for both Classic and Extension API when using the Dashboard Studio search panel. The Extension API distinction is in how the viz is registered (via `framework_type = studio_visualization` in visualizations.conf), not in the savedsearches.conf display key."

**2. [formatter-patterns.md — showGlassPanel in formatter Effects section "Default toggles to true" is stale guidance; drawGlassPanel is a banned pattern]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md`
- **Line:** 173
- **Issue:** The Section structure rule states: `"Effects" — accentColor picker (FIRST), then mood effect toggles (showAmbientLight, showVignette, showGlow, showGlassPanel). Default toggles to "true"; user can disable per effect.` The inclusion of `showGlassPanel` contradicts the locked decision "No drawGlassPanel in viz code — Dashboard Studio rectangles handle panel chrome." If `showGlassPanel` is in the formatter, Claude will implement `drawGlassPanel` in the JS. The control should not exist in the template.
- **Impact:** Contradicts a locked decision (no drawGlassPanel). Would actively mislead Claude into implementing a banned render pattern.
- **Recommendation:** Remove `showGlassPanel` from the Effects section template guidance. Replace with `showPanelBorder` or similar if a border toggle is needed, or leave the Effects section as: `showAmbientLight, showVignette, showGlow` only.

Note: The actual `<form section-label="Effects">` template code at line 347-379 does NOT include `showGlassPanel` — only the prose description at line 173 does. This means a careful reader following the code template would be fine, but a developer reading the prose description would add the wrong control.

---

### WARNING

**1. [formatter-patterns.md — Animation section opt() read pattern at line 430 shows opt() inside updateView (correct) but the preamble note says helpers receive primitives; the two patterns are in different files]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md`
- **Lines:** 428-450 (Animation opt() read pattern)
- **Issue:** The Animation opt() read pattern shows the correct AF-01-compliant pattern: reads `opt()` inside updateView, computes `speedMult`, then would pass it to helpers. However, the `var accentColor` variable needed for the pulse helper is NOT shown being declared in this section (it appears to assume `accentColor` is already in scope from an earlier opt read). A developer copying only the animation section might miss that `accentColor` must be read via `opt()` in updateView before calling `_startPulse(speedMult, accentColor)`.
- **Impact:** Potentially incomplete example — doesn't cause wrong code directly but could cause omission.
- **Recommendation:** Add `var accentColor = hexFromSplunk(opt('accentColor', ''), t.accent);` to the animation opt() read block in formatter-patterns.md, immediately before or after `speedMult`, to make the complete parameter threading visible in one place.

**2. [build-mjs-template.md — no mention of @viz-type first-line requirement for src/visualization.js; D10 gap in Extension API path]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/build-mjs-template.md`
- **Lines:** Full file reviewed — no mention of D10 or @viz-type
- **Issue:** build-mjs-template.md correctly documents EF-01 and EF-02. But there's no mention that `src/visualization.js` must have `// @viz-type:` as its first line (D10). Since build.mjs doesn't inspect source files, this is a documentation gap rather than a functional build issue, but a developer reading only build-mjs-template.md for the Extension API workflow won't be reminded of D10.
- **Recommendation:** Add a brief note in the file's "Notes" section: "Source files (`src/visualization.js`) must still comply with D10 (`// @viz-type:` first line) — the build script does not validate this; check_design.js validates the IIFE output."

**3. [package-mjs-template.md — `${PREVIEW_SCRIPT_PATH}` appears as a JS template literal string value rather than a placeholder comment; would produce syntax error if copied verbatim]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md`
- **Line:** 220
- **Issue:** Line 220 reads: `const previewScript = '${PREVIEW_SCRIPT_PATH}';` — this embeds a `${...}` ES6 template literal placeholder inside a SINGLE-quoted string (not a backtick template literal), so JavaScript will treat `${PREVIEW_SCRIPT_PATH}` as a literal string, not a template substitution. The comment explains it's a "Templated to absolute path" but the code itself would output the literal `${PREVIEW_SCRIPT_PATH}` as the script path, causing `execSync` to fail.
- **Impact:** A developer copying the template verbatim would get a runtime error: `python3 "${PREVIEW_SCRIPT_PATH}" ...` — python3 can't find a file literally named `${PREVIEW_SCRIPT_PATH}`.
- **Recommendation:** Change line 220 to a clear TODO comment pattern:
  ```javascript
  const previewScript = '/path/to/vp-create/scripts/generate_previews.py'; // FILL: absolute path at scaffolding time
  ```
  Or clarify in the Placeholders table that Claude must replace this at scaffolding time with the actual path — and the template shows the intended substitution syntax, not runnable JS.

---

### NIT

**1. [config-json-template.md — editor section grouping example shows 3 sections but pre-code-checklist suggests 4 sections minimum when Animation is present]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md`
- **Lines:** 96-123 (Section Grouping example)
- **Issue:** The example shows 3 sections (Data display, Color and style, Effects). When Animation controls are present, this should be 4 sections. The discrepancy is minor — the example is deliberately minimal.
- **Recommendation:** Add a comment in the Section Grouping example noting "Add an `Animation` section with showEntrance/flashCritical/showHoverEffect/animationSpeed controls when the viz includes animation."

**2. [conf-templates.md — static/ directory listing at lines 228-234 mentions appIcon.png (36x36) and appIcon_2x.png (72x72) but package-mjs-template.md only generates a single appIcon.png at 36x36; 2x is undocumented]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md`
- **Line:** 230 (`static/appIcon.png (36x36)`) and line 231 (`static/appIcon_2x.png (72x72)`)
- **Issue:** The directory structure template mentions `appIcon_2x.png` as a file that should exist, but package-mjs-template.md only generates `appIcon.png` at 36x36. There is no `appIcon_2x` generation anywhere. Developers relying on conf-templates.md to understand the app structure would look for a 2x icon that is never generated.
- **Recommendation:** Remove `appIcon_2x.png` from the directory structure template, or add a note: `(optional — not generated by package.mjs; add manually if Splunk AppInspect requires it)`.

---

## Cluster 3: Blueprints + Recipes + Edge Cases

Files reviewed:
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md`
- `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/auto-field-patterns.md`
- `plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md`

---

### BLOCKER

**1. [animation-recipes.md AB-02 at line 111 — opt('accentColor', t.accent) inside an updateView context block reads t.accent before theme is resolved in the GENERIC boilerplate caller block]**

- **File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md`
- **Lines:** 100-115 (Generic LED Pulse Boilerplate, updateView section)
- **Issue:** The AB-02 boilerplate shows:
  ```javascript
  var flashCritical = opt('flashCritical', 'false') === 'true';
  ...
  var accentColor = opt('accentColor', t.accent);
  this._startPulse(speedMult, accentColor);
  ```
  The variable `t` (the theme object) is used as a fallback in `opt('accentColor', t.accent)`. This is correct IF `t` has been declared earlier in updateView (e.g., `var t = theme.getTheme(detectTheme());`). However, the Generic boilerplate does NOT show the `var t` declaration — it assumes developers will have it in scope. A developer copying ONLY the AB-02 boilerplate block would get `ReferenceError: t is not defined` if they haven't declared `t` above the paste point.
- **Impact:** Silent runtime error (ReferenceError) for developers who copy the boilerplate without the theme declaration context. This actively misleads into producing broken code.
- **Recommendation:** Add `// Assumes var t = theme.getTheme(detectTheme()); is declared above — see updateView pattern in canvas-recipes.md` as a comment on the `var accentColor` line. Or show a minimal updateView preamble at the top of the AB-02 boilerplate: `// Required above this block: var t = theme.getTheme(detectTheme()); var ns = getNS(this);`

---

### WARNING

**1. [viz-blueprints.md — per-viz animation notes for most viz types beyond the shared block reference boilerplate section names, but 11 of 17 viz types have no dedicated "Animation notes" section]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md`
- **Lines:** 30-50 (shared animation block), line 587 (Multi-Channel Composite animation note)
- **Issue:** Only Multi-Channel Composite (line 587) has a dedicated "Animation notes:" subsection. The other 16 viz types rely entirely on the shared animation block at lines 30-50 which says "Default: use Generic Entrance Boilerplate" and per-viz overrides are described only for Gauge/Ring Gauge, Bar chart, and Table/Leaderboard. There's no per-viz animation note for: Donut, Heat Grid, Spark Strip, Line Chart, Radar, Needle Gauge, Status Matrix, Waterfall, Horizontal Bar List, Data Table, Process Flow, Status Chip, Live Ticker, Ring Gauge, Leaderboard.
- **Impact:** AB-03 (per-viz animation notes referencing specific boilerplate section names) is PARTIALLY implemented. Developers must infer the correct animation pattern from the shared block without confirmation for most viz types.
- **Recommendation:** Add a brief "Animation notes:" line to each remaining viz type subsection that confirms whether Generic Entrance Boilerplate, staggered entrance, or a custom arc/bar-growth variant applies. Even "Entrance: Generic Entrance Boilerplate (globalAlpha fade)" takes 1 line and closes the gap.

**2. [edge-cases.md — ECR-06 cross-reference to "broken-rules.md B22" is implicit; the path to broken-rules.md is in vp-debug/references/ (different skill directory)]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md`
- **Line:** 389
- **Issue:** Line 389 reads: `**Root cause:** broken-rules.md B22 — "Color picker value ignored (reads as integer)."` The file `broken-rules.md` is in `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md`, not in `vp-viz/references/`. The cross-reference is an implicit relative path that would confuse any developer trying to locate the canonical B22 definition, since broken-rules.md is in a different skill directory. A developer looking in `vp-viz/references/` will not find `broken-rules.md`.
- **Impact:** Missing/misleading cross-reference — broken link in spirit (path doesn't resolve relative to the current directory).
- **Recommendation:** Change line 389 to: `**Root cause:** `vp-debug/references/broken-rules.md` B22 — "Color picker value ignored (reads as integer)."` (use full relative path from plugin root). Or add the path as: `[broken-rules.md B22](../../vp-debug/references/broken-rules.md)`.

**3. [canvas-recipes.md — animation section directs to animation-recipes.md but the path in the recipe file table (line 13) says vp-recipes/references/ while the canvas-recipes.md crossref says vp-recipes/references/animation-recipes.md — correct but inconsistent capitalization in table description]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md`
- **Line:** 13
- **Issue:** The recipe table entry says "Phase 9 only — do not load in Phase 6/7." This is internal project planning terminology that external skill consumers won't understand. "Phase 9" refers to the animation-adding phase of the generation workflow, not a project phase number. This could confuse consumers who see "Phase 9" and wonder if it maps to a planning phase.
- **Impact:** Internal terminology leak — degrades the doc for non-project-insiders.
- **Recommendation:** Replace "Phase 9 only" with "Load when adding animation controls to a viz (entrance, LED pulse, hover, stagger)".

**4. [auto-field-patterns.md — uses `data.colIdx` in the Three-Tier Field Resolver Pattern but colIdx is not shown being built in this file; Classic-only pattern not flagged as such]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/auto-field-patterns.md`
- **Lines:** 72-92 (Three-Tier Field Resolver Pattern code block)
- **Issue:** The resolver code uses `data.colIdx` (e.g., `isNumericCol(data.rows, data.colIdx, fname)` and `data.colIdx[resolvedLabel]`). `data.colIdx` is a lookup map from field name to column index that Classic vizs build in `formatData()`. However, auto-field-patterns.md does NOT show how `colIdx` is built, nor does it clarify that this pattern is Classic-API-only (Extension API uses `data.columns[fieldIdx][rowIdx]` directly without `colIdx`). A developer following this pattern for Extension API without knowing about the colIdx construction step would have `data.colIdx` as `undefined`, causing silent failures.
- **Impact:** Missing context causes subtle bugs in Extension API vizs.
- **Recommendation:** Add a preamble note: "This pattern applies to Classic vizs. `data.colIdx` is built in `formatData()` by `SplunkVisualizationBase`. For Extension API vizs, replace `data.colIdx[fieldName]` with `data.fields.findIndex(function(f) { return f.name === fieldName; })` — see viz-blueprints.md Extension API Data Access section."

---

### NIT

**1. [animation-recipes.md — "## Cross-references" section at end points to canvas-recipes.md but uses a relative path `../../vp-viz/references/canvas-recipes.md` — correct but doesn't note this file's own misfiled location in vp-recipes/]**

- **File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md`
- **Lines:** 542-549
- **Issue:** The cross-references section correctly uses relative paths to reach vp-viz/references/ from vp-recipes/references/. No issue with correctness, but there's no header note explaining that animation-recipes.md intentionally lives in vp-recipes/ (not vp-viz/) due to its broader recipes scope. The RESEARCH.md and CONTEXT.md both flag this as a potential confusion point.
- **Recommendation:** Add a brief front-matter note (top of file, after the first H1): `> Location note: This file lives in \`vp-recipes/references/\` (not \`vp-viz/references/\`) and is the canonical Phase 40 Animation Helper Scope Rule owner. Load via \`MUST LOAD\` in vp-recipes/SKILL.md or directly from vp-viz/SKILL.md animation step.`

**2. [viz-blueprints.md — Blueprint table of contents at top shows 17 viz types but counts only 16 in the ToC list (Multi-Channel Composite is #17 in the list but the file's header ToC at line 3-19 is correct)]**

- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md`
- **Lines:** 3-21
- **Issue:** Table of Contents at line 3-21 correctly lists all 17 viz types including Multi-Channel Composite. No actual error — this is a double-check confirmation.
- **Recommendation:** (none — no issue found)

---

## Coverage Summary

| Change-ID | Phase | Expected location(s) | Verified present? | Notes |
|-----------|-------|----------------------|-------------------|-------|
| THM-01 | 22 (undocumented) | theme-template.md, pre-code-checklist.md | NO | Code ID never formally tagged in any plugin file. Likely = "light theme is NOT an inversion of dark" (prose present, tag absent). See BLOCKER #1 Cluster 1 |
| THM-02 | 22 (undocumented) | theme-template.md, pre-code-checklist.md | NO | Code ID never formally tagged. Likely = LIGHT object WCAG contrast baseline (CP-02; prose present at theme-template.md:74, tag absent). See BLOCKER #1 Cluster 1 |
| THM-03 | 22/24 | theme-template.md, pre-code-checklist.md | PARTIAL | Documented as code comment (theme-template.md:226), tagged in checklist item (pre-code-checklist.md:15). Not a heading — findability issue. See WARNING #1 Cluster 1 |
| THM-04 | 22/24 | theme-template.md, pre-code-checklist.md | PARTIAL | Same as THM-03 — code comment at theme-template.md:232, checklist item:16. See WARNING #1 Cluster 1 |
| THM-05 | 42 | theme-template.md, pre-code-checklist.md, visualization-js-template.md, config-json-template.md | YES | All 4 files: correct WRONG/RIGHT pattern, cross-link footers. CONSISTENT per RESEARCH spot-check |
| AF-01 | 40 | animation-recipes.md | YES | Lines 8-17. "Animation Helper Scope Rule" section present. AF-01 WRONG/RIGHT table correct |
| AF-02 | 40 | animation-recipes.md | YES | Line 15. Parameter threading WRONG/RIGHT documented. All boilerplates pass speedMult/accentColor as primitives |
| EF-01 | 39 | visualization-js-template.md (via build-mjs-template.md cross-ref), build-mjs-template.md | PARTIAL | build-mjs-template.md lines 6-14: WRONG/RIGHT table present. visualization-js-template.md:246 cross-links to build-mjs-template.md. config-json-template.md has NO mention. See WARNING #2 Cluster 1 |
| EF-02 | 39 | build-mjs-template.md | YES | Line 9 in WRONG/RIGHT table: no external clause documented correctly |
| EF-03 | 39 | package-mjs-template.md, conf-templates.md | PARTIAL | package-mjs-template.md lines 5-11: WRONG/RIGHT table present. conf-templates.md uses bare stanza (line 34) WITHOUT citing EF-03. See WARNING #3 Cluster 1 |
| PP-01 | 41 | package-mjs-template.md (generate_previews.py invocation) | YES | Line 220-226: try/catch with generate_previews.py first, buildSolidPng fallback. Correct per Phase 41 D-02 split |
| PP-02 | 41 | package-mjs-template.md (buildSolidPng fallback inline) | YES | Lines 227-242: complete fallback path with brand palette. PP-02 correctly implements the fallback-only role |
| LM-01 | 42 | pre-code-checklist.md (THM-05/LM-01 gate line) | YES | pre-code-checklist.md:17: `(THM-05/LM-01)` tag present |
| LM-02 | 42 | theme-template.md, visualization-js-template.md, config-json-template.md | YES | All three files show backgroundColor unconditional read pattern. Cross-link footers present |
| B5 | 22+ | pre-code-checklist.md, formatter-patterns.md | PARTIAL | Rule described in pre-code-checklist.md lines 7-8 but NOT tagged `(B5)`. formatter-patterns.md WRONG block mentions it implicitly. See BLOCKER #3 Cluster 1 |
| B7 | 22+ | pre-code-checklist.md, formatter-patterns.md | PARTIAL | Rule at pre-code-checklist.md:8 — NOT tagged `(B7)`. See BLOCKER #3 Cluster 1 |
| B9 | 22+ | pre-code-checklist.md, conf-templates.md | PARTIAL | Dashboard JSON type rule present in pre-code-checklist.md:36 and conf-templates.md:97-105 — NOT tagged `(B9)`. See BLOCKER #3 Cluster 1 |
| B10 | 22+ | pre-code-checklist.md, formatter-patterns.md | PARTIAL | {{VIZ_NAMESPACE}} rule present in both files — NOT tagged `(B10)`. See BLOCKER #3 Cluster 1 |
| B20 | 22+ | pre-code-checklist.md, formatter-patterns.md | PARTIAL | themeMode "auto" rule present in both — NOT tagged `(B20)`. See BLOCKER #3 Cluster 1 |
| B21 | 22+ | pre-code-checklist.md | PARTIAL | safeStr/safeNum rule present at pre-code-checklist.md:22 — NOT tagged `(B21)`. See BLOCKER #3 Cluster 1 |
| B22 | 22+ | pre-code-checklist.md, edge-cases.md | YES | pre-code-checklist.md:31 `(B22)` explicit tag. edge-cases.md ECR-06 section cites it. Broken-rules.md cross-ref path is implicit (WARNING #2 Cluster 3) |
| D09 | 22+ | pre-code-checklist.md (accentIntensity not capped) | YES | pre-code-checklist.md:67: `accentIntensity (gi) MUST NOT be capped at 1.0 -- enforced by check_design.js D09` |
| D10 | 22+ | pre-code-checklist.md (first-line annotation), visualization-js-template.md | PARTIAL | pre-code-checklist.md:18 explicit. visualization-js-template.md template code block missing @viz-type first line. See BLOCKER #2 Cluster 1 |
| D11 | 22+ | pre-code-checklist.md (_onMouseMove guard) | YES | pre-code-checklist.md:32: `(CQ-03, enforced by D11)` explicitly cited |
| CP-01 | 23 | formatter-patterns.md (brand swatch 6-8 rule) | YES | Lines 36-37, 75-76, 602: 6-8 brand swatches per picker documented |
| CP-02 | 23 | theme-template.md (textFaint WCAG AA) | YES | theme-template.md:74: `#6B7080 WCAG AA 3:1 on #F0F2F5 (Phase 23 CP-02)` |
| CP-03 | 23 | formatter-patterns.md (accentColor usage contract) | PARTIAL | Line 158 NOTE and line 173 Effects description mention it. No dedicated section with WRONG/RIGHT. See WARNING #4 Cluster 1 |
| AB-01 | 24 | animation-recipes.md (Generic Entrance Boilerplate) | YES | Section "## Generic Entrance Boilerplate (AB-01)" present at line 23. Correct speedMult parameter threading |
| AB-02 | 24 | animation-recipes.md (Generic LED Pulse Boilerplate) | YES | Section present at line 90. BLOCKER about t.accent context noted above (Cluster 3 BLOCKER #1) but the boilerplate structure is correct |
| AB-03 | 24 | viz-blueprints.md (per-viz animation notes) | PARTIAL | Only Multi-Channel Composite (line 587) has dedicated animation notes. Shared block (lines 34-39) provides partial guidance. See WARNING #1 Cluster 3 |
| MC-01 | 26 | viz-blueprints.md (Multi-Channel Composite archetype) | YES | Lines 554-602: full Multi-Channel Composite blueprint present with F1 telemetry worked example |
| Accent architecture | 23 | formatter-patterns.md (accent for hover/glow/selection; series for data; uncapped intensity) | PARTIAL | Rules are present but scattered. No consolidated "Accent Architecture" section. See WARNING #4 Cluster 1 |

---

## Wave 1 Summary

**BLOCKER count:** 6 (across all 3 clusters)
**WARNING count:** 11 (across all 3 clusters)
**NIT count:** 7 (across all 3 clusters)

**Critical gaps requiring remediation (BLOCKERs):**
1. THM-01 / THM-02 are undefined code IDs — either formalize them into the docs or retire them from the checklist
2. D10 (@viz-type) missing from visualization-js-template.md template code block
3. B5/B7/B9/B10/B20/B21 not tagged with B-code identifiers in pre-code-checklist.md
4. savedsearches.conf Extension API path undocumented (conf-templates.md)
5. showGlassPanel in formatter Effects prose (contradicts locked no-drawGlassPanel decision)
6. animation-recipes.md AB-02 assumes `t` is in scope without showing declaration

**Consistent / verified items (no remediation needed):**
- THM-05 / LM-01 / LM-02: fully consistent across all 4 files
- AF-01 / AF-02: Animation Helper Scope Rule correctly documented with WRONG/RIGHT table
- EF-02 / PP-01 / PP-02: correctly documented in their respective templates
- B22 / D09 / D11: explicitly tagged and cross-referenced
- MC-01: Multi-Channel Composite blueprint fully present
- All 5 cross-plugin ds-* skill references resolve (confirmed by RESEARCH)
