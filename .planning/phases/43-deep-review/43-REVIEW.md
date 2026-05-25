# Phase 43 Deep Review — Canonical Consolidated REVIEW.md

**Phase:** 43 — Deep Review (v5.8.0 / Quality & Template Corrections)
**Synthesized:** 2026-05-25
**Synthesized by:** Plan 43-06 (inline orchestrator)
**Sources:** Per-wave reviews from Plans 43-01 through 43-05 + Wave 6 tests/ flag-only sweep
**Method:** Append-and-cross-link consolidation per CONTEXT.md D-04 (fix everything found inline)

---

## Executive Summary

This phase audited **~141 files** across two plugins (`splunk-viz-packs`, `splunk-dashboard-studio`) for consistency with the v5.5-v5.8 milestone changes (Phases 22-42). Discovery work split into six waves:

| Wave | Scope | Files reviewed | BLOCKER | WARNING | NIT |
|------|-------|----------------|---------|---------|-----|
| 1 | `vp-viz/references/` + `animation-recipes.md` | 13 | 6 | 11 | 7 |
| 2 | `vp-*/SKILL.md` | 6 | 5 | 5 | 1 |
| 3 | `vp-viz/scripts/` (tooling) | 17 | 6 | 6 | 5 |
| 4 | `vp-create/scripts/` (build pipeline) | 5 | 0 | 3 | 7 |
| 5 | `splunk-dashboard-studio` (bounded set of 8) | 8 | 2 | 5 | 4 |
| 6 | `tests/test*` (flag-only sweep) | 46 dirs | 0 | 0 | 0 (sweep produces flags only) |
| **Total** | | **95** | **19** | **30** | **24** |

**Headline counts: 19 BLOCKERs · 30 WARNINGs · 24 NITs.**

### Top-3 cross-cutting failure modes

1. **Doc/validator code-symmetry drift (highest-value gap per CONTEXT D-05).** Wave 3 found **24 enforcement codes with no doc home** (D01-D08 design checks, E01-E05 Extension API checks, A01-A04 asset checks, DS1-DS5 dashboard validator codes, CONTRAST, XFILE). When Claude sees `FAIL D03`/`FAIL E01`/`FAIL DS2`/`FAIL CONTRAST` in validator output, there is no skill or reference doc to look up. This is the largest single class of finding and the main driver behind the BLOCKER count.

2. **Phase 41 (PP-01/PP-02) "preview owner split" still incomplete.** vp-viz/SKILL.md Quick rule 13 (line 413) and vp-init/SKILL.md STAGE 3 summary (line 81) still attribute preview.png generation to `generate_assets.js` at 300x200 — both stale. `generate_assets.js` also still generates preview.png unconditionally despite vp-create/SKILL.md referencing a `--legacy-previews` flag that doesn't exist in code. These are real BLOCKERs for anyone scaffolding a new viz pack — Claude will be sent to the wrong tool with the wrong dimensions.

3. **Phase 42 (THM-05) absent from vp-debug.** The most recently landed fix has zero footprint in the debugging skill. Developers looking up "background color wrong in light mode" have no breadcrumb.

### What's clean

- **THM-05 / LM-01 / LM-02:** fully consistent across all 4 template/checklist files (Wave 1 confirmed).
- **AF-01 / AF-02 / animation scope rule:** correctly documented in `animation-recipes.md` with the WRONG/RIGHT contract intact.
- **EF-02, PP-02:** Extension API IIFE + Pillow fallback templates are correct.
- **JR-01 / JR-02 (Phase 38):** ds-ref-jsonata is complete; ds-int-tokens MUST-LOAD directive is condensed and prominent.
- **Cross-plugin ds-* references:** all 5 distinct `ds-*` skill references from `vp-*` SKILL.md files resolve to existing files (no broken links).
- **SKILL.md line budget (Phase 29):** all 6 vp-* SKILL.md files pass the 500-line cap; `vp-viz` is tightest at 487/500.

---

## BLOCKER (19)

### B-1. THM-01 / THM-02 are undefined code IDs (Wave 1)

- **Origin:** Wave 1, Cluster 1, BLOCKER #1
- **Files:** all reference files + `pre-code-checklist.md`
- **Issue:** CONTEXT `<review_checklist>` lists THM-01 through THM-05 as "five theme rules" but THM-01 and THM-02 are absent from every plugin file. Coverage Summary would mark them "unverified" forever.
- **Recommendation:** Determine whether they encode "light theme is NOT an inversion of dark" (THM-01) and "LIGHT object WCAG contrast values / CP-02" (THM-02). Either formalize as headings in `theme-template.md` and `pre-code-checklist.md`, or retire them from the checklist.

### B-2. D10 `@viz-type` first-line annotation missing from `visualization-js-template.md` (Wave 1)

- **Origin:** Wave 1, Cluster 1, BLOCKER #2
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md`
- **Issue:** Template code block begins with `import ...` — no `// @viz-type:` first line. `pre-code-checklist.md:18` says D10 is ENFORCED by `check_design.js`. Every Extension API viz scaffolded from this template will FAIL D10.
- **Recommendation:** Add `// @viz-type: {{VIZ_TYPE_PLACEHOLDER}}` as the very first line of the template code block, with a populator note listing the 10 valid types (`kpi, gauge, bars, grid, line, timeline, radar, progress, scatter, network`).

### B-3. B5/B7/B9/B10/B20/B21 described but not tagged with B-code identifiers (Wave 1)

- **Origin:** Wave 1, Cluster 1, BLOCKER #3
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md`
- **Issue:** validate_viz.sh emits `FAIL B5/B7/B9/B10/B20/B21` but the checklist describes the rules in prose without the `(Bxx)` anchor tag. A developer can't grep their way from a validator failure to the doc.
- **Recommendation:** Append the tag to each line: `(B5)`, `(B7)`, `(B9)`, `(B10)`, `(B20)`, `(B21)` at the corresponding checklist items.

### B-4. `conf-templates.md` savedsearches.conf Classic-only; Extension API path undocumented (Wave 1)

- **Origin:** Wave 1, Cluster 2, BLOCKER #1
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md:87-96`
- **Issue:** Shows only `display.visualizations.custom.type = {{PACK_ID}}.{{VIZ_NAME}}` — no guidance on whether/how Extension API uses the same key, or how `framework_type = studio_visualization` interacts.
- **Recommendation:** Add an Extension API note clarifying that `display.visualizations.custom.type` IS still the canonical search-panel field for both formats; the Extension distinction is in `visualizations.conf` registration via `framework_type = studio_visualization`.

### B-5. `showGlassPanel` in `formatter-patterns.md` Effects prose contradicts the locked no-drawGlassPanel rule (Wave 1)

- **Origin:** Wave 1, Cluster 2, BLOCKER #2
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md:173`
- **Issue:** Section structure prose lists `showGlassPanel` as one of the Effects toggles. Memory `feedback_viz_no_glass_panel` and CLAUDE.md both lock this: vizs MUST NOT draw panel chrome — Dashboard Studio rectangles handle it.
- **Recommendation:** Remove `showGlassPanel` from line 173 prose. The actual template `<form section-label="Effects">` (lines 347-379) already excludes it; only the prose description leaks the banned toggle.

### B-6. `animation-recipes.md` AB-02 generic LED Pulse Boilerplate references `t.accent` without showing `var t` declaration (Wave 1)

- **Origin:** Wave 1, Cluster 3, BLOCKER #1
- **File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md:100-115`
- **Issue:** Boilerplate uses `opt('accentColor', t.accent)` but does not show `var t = theme.getTheme(detectTheme());` declared above. Developer copying only the AB-02 block will hit `ReferenceError: t is not defined`.
- **Recommendation:** Add a one-line precondition comment: `// Required above this block: var t = theme.getTheme(detectTheme()); var ns = getNS(this);`

### B-7. vp-viz/SKILL.md Quick rule 13 — stale PP-01 attribution (Wave 2)

- **Origin:** Wave 2, vp-viz, BLOCKER #1
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md:413`
- **Issue:** "preview.png — generated by `node generate_assets.js <app_dir>` ... 300x200" — Phase 41 split moved primary ownership to `generate_previews.py` at 116x76. Stale rule sends Claude to wrong tool with wrong dimensions.
- **Recommendation:** "preview.png — generated by `python3 generate_previews.py <app_dir>` (116x76 RGB, Pillow path); fallback to `node generate_assets.js <app_dir> --legacy-previews` if Pillow unavailable. Runs post-build, pre-validate."

### B-8. vp-init/SKILL.md STAGE 3 — stale PP-01 attribution (Wave 2)

- **Origin:** Wave 2, vp-init, BLOCKER #1
- **File:** `plugins/splunk-viz-packs/skills/vp-init/SKILL.md:81`
- **Issue:** Pipeline summary "Step 3b: generate_assets.js (icons + previews + gradient bg)" — `generate_previews.py` is invisible at the first place a developer encounters the pipeline.
- **Recommendation:** "Step 3b: generate_assets.js (icons + gradient bg) + generate_previews.py (per-viz preview.png, Pillow)."

### B-9. vp-design/SKILL.md — CP-01 brand swatch extraction step missing (Wave 2)

- **Origin:** Wave 2, vp-design, BLOCKER #1
- **File:** `plugins/splunk-viz-packs/skills/vp-design/SKILL.md:53-58`
- **Issue:** Phase 23 CP-01 expects 6-8 `<splunk-color>` brand swatches enumerated for formatter color-picker presets. Current Brand Research step only captures `primary, secondary, accent` — no instruction to derive the preset list. Result: generated formatters get empty or placeholder preset rails.
- **Recommendation:** Add Brand Research step 5: "Extract 6-8 brand color swatches for formatter color pickers — these appear as `<splunk-color>{hex}</splunk-color>` presets inside every `<splunk-color-picker>`. Include primary, secondary, accent, light/dark variants, and one neutral."

### B-10. vp-debug/SKILL.md — BROKEN heading says "B1-B21" but table has B1-B23 (Wave 2)

- **Origin:** Wave 2, vp-debug, BLOCKER #1
- **File:** `plugins/splunk-viz-packs/skills/vp-debug/SKILL.md:77`
- **Issue:** Heading range stale by 2 rules.
- **Recommendation:** Update heading to "### BROKEN — renders but wrong (B1-B23)".

### B-11. vp-debug/SKILL.md — THM-05 absent from debug entries (Wave 2)

- **Origin:** Wave 2, vp-debug, BLOCKER #2
- **File:** `plugins/splunk-viz-packs/skills/vp-debug/SKILL.md`
- **Issue:** Phase 42's most recently landed fix has no debug breadcrumb — no quick-fix row, no error-flowchart entry. Developers debugging "wrong background color in light mode" find nothing here.
- **Recommendation:** Add quick-fix table row "Background color wrong in light mode | THM-05/B23 | check `opt('backgroundColor')` is read unconditionally, not inside the dark branch (see theme-template.md THM-05)." Add an entry to the error flowchart pointing at THM-05.

### B-12. validate_viz.sh `WARN B17` has no doc home (Wave 3)

- **Origin:** Wave 3, Cluster 1, BLOCKER #1
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:249`
- **Issue:** `WARN B17: getBoundingClientRect usage` — `pre-code-checklist.md` mentions the rule (line 25, "clientWidth/clientHeight — NEVER getBoundingClientRect for sizing") but does not tag it `(B17)`. broken-rules.md row description does not match the check.
- **Recommendation:** Tag `pre-code-checklist.md:25` with `(B17)` and ensure `broken-rules.md` B17 row text matches the `WARN B17` description.

### B-13. validate_ast.js `XFILE` code has no doc home (Wave 3)

- **Origin:** Wave 3, Cluster 1, BLOCKER #2
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js:372-399`
- **Issue:** `FAIL XFILE` / `WARN XFILE` for formatter-vs-JS option key mismatches. Code does not appear in `pre-code-checklist.md`, `broken-rules.md`, `formatter-patterns.md`, or any reference.
- **Recommendation:** Add an `XFILE` row to `broken-rules.md` describing the formatter↔JS cross-file wiring check, or rename the code to a tagged variant (e.g., `B10x`) that cross-references the existing D08 bidirectional-wiring concern.

### B-14. validate_dash.js DS1-DS5 codes have no doc home (Wave 3)

- **Origin:** Wave 3, Cluster 1, BLOCKER #3
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js:29`
- **Issue:** 5 dashboard-JSON enforcement codes (DS1 undeclared data source, DS2 tab schema error, DS3 missing bg_gradient, DS4 missing markdown title panel, DS5 drilldown token no default) — none documented anywhere.
- **Recommendation:** Add DS1-DS5 to `broken-rules.md`, or create `vp-debug/references/dashboard-rules.md` to host them. This is the canonical example of CONTEXT D-05's "ENFORCED-ONLY" drift class.

### B-15. check_contrast.js `CONTRAST` code has no doc home; comment cites stale `(D-11)` (Wave 3)

- **Origin:** Wave 3, Cluster 1, BLOCKER #4
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js:73,125-128`
- **Issue:** Script emits `FAIL CONTRAST`/`WARN CONTRAST` but neither code is documented. Header comment on line 73 says `// ---- Pair definitions (D-11) ----` — D-11 in `check_design.js` is the `_onMouseMove showHoverEffect` guard, not contrast. The `(D-11)` tag is stale from an earlier numbering.
- **Recommendation:** (a) Replace line 73 comment with `// ---- Pair definitions (WCAG AA — check_contrast.js) ----`. (b) Add `CONTRAST` code to `pre-code-checklist.md` (or broken-rules.md) with the WCAG AA threshold (4.5:1 normal, 3:1 large).

### B-16. generate_assets.js still owns preview.png unconditionally; `--legacy-previews` flag is fiction (Wave 3)

- **Origin:** Wave 3, Cluster 2, BLOCKER #16
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js:16, 968-1027`
- **Issue:** `vp-create/SKILL.md:80` directs Claude to call `node generate_assets.js /path/to/app --legacy-previews` for fallback, but the flag is silently ignored — `generate_assets.js` always generates preview.png regardless. The Pillow path and JS path both write preview.png; the last to run wins.
- **Recommendation:** Either (a) add a real `--legacy-previews` argv flag to `generate_assets.js` that gates the `generatePreviews()` block (default: skip), or (b) remove the `--legacy-previews` reference from `vp-create/SKILL.md:80` and document that `generate_assets.js` always generates JS-silhouette previews which `generate_previews.py` overwrites when Pillow is available. Option (a) makes the gate real; option (b) makes the docs honest.

### B-17. test_validate_viz_integration.sh T_ANEW_1 uses 400-byte fixture but A01 threshold is 100 bytes (Wave 3)

- **Origin:** Wave 3, Cluster 2, BLOCKER #17
- **File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh:386`
- **Issue:** Test writes 400-byte zero-filled file expecting `FAIL A01` (`<100 bytes`). Actual emission is `FAIL A02` (wrong PNG dimensions, since 400 bytes of zero has no valid PNG header). Test passes for the wrong reason.
- **Recommendation:** Replace fixture with a 50-byte file (`dd if=/dev/zero bs=50 count=1`) to reliably exercise the A01 < 100 byte threshold.

### B-18. ds-create generates deprecated drilldown format (`options.drilldown` + `options.drilldownAction`) (Wave 5)

- **Origin:** Wave 5, ds-create, BLOCKER #1
- **File:** `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md:87`
- **Issue:** "ds-create translates this into `options.drilldown = "all"` and `options.drilldownAction = <value>`" — but `ds-ref-syntax:349` explicitly marks both as deprecated in favor of `eventHandlers` array. Generated dashboards use legacy format.
- **Recommendation:** Update the "Panel drilldowns" section in ds-create to use `eventHandlers` array format as documented in `ds-int-drilldowns`. This is a cross-skill format disagreement where ds-int-drilldowns is the verified-correct source.

### B-19. ds-ref-layout-grid "Required wrapper structure" example uses wrong tabs schema (Wave 5)

- **Origin:** Wave 5, ds-ref-layout-grid, BLOCKER #1
- **File:** `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md:83-104`
- **Issue:** Example shows `tabs: [...]` (array) with `id`/`layoutDefinitionId` keys and `layoutDefinitions: [...]` (array). Correct schema (per ds-int-tabs + ds-ref-syntax) is `tabs: { items: [...], options: {...} }` (object) with `layoutId` key, and `layoutDefinitions: { layout_main: {...} }` (object keyed by layoutId). An agent following this example generates schema-invalid JSON.
- **Recommendation:** Replace the "Required wrapper structure" block with the correct format from `ds-int-tabs` / `ds-ref-syntax`. Memory `feedback_must_load_tab_skill` flags this exact schema as "unintuitive — always load ds-int-tabs."

---

## WARNING (30)

### Wave 1 (11 warnings)

1. **THM-03/THM-04 code-comment-only documentation** — `theme-template.md:226-233`. Promote to `##` headings with WRONG/RIGHT framing matching THM-05.
2. **config-json-template.md — no EF-01/EF-02 cross-reference.** Add a "Build Requirements (EF-01/EF-02)" footer linking to `build-mjs-template.md`.
3. **conf-templates.md — no EF-03 citation for bare stanza names.** Add a sentence under the `visualizations.conf` section: "Bare stanza names only — see `package-mjs-template.md` EF-03."
4. **formatter-patterns.md — accent architecture (Phase 23) scattered, no consolidated section.** Add `## Accent Architecture (Phase 23 — CP-01/CP-02/CP-03)` near the top with the four rules explicitly labeled.
5. **package-mjs-template.md line 216 — uses `(D-09:` for the generate_previews delegate comment.** Phase 41 records this as `D-02`, not `D-09`. Change comment to `(Phase 41 D-02:`.
6. **visualization-js-template.md WRONG/RIGHT table accurate but Classic readers could be confused.** Add a one-line callout at the top: "Extension API ONLY — Classic vizs use `require()`/`module.exports`."
7. **formatter-patterns.md Animation `opt()` block — missing `var accentColor` declaration.** Add `var accentColor = hexFromSplunk(opt('accentColor', ''), t.accent);` to make complete parameter threading visible.
8. **build-mjs-template.md — no D10 mention.** Add a "Notes" line: "Source files must comply with D10 — `// @viz-type:` first line — check_design.js validates the IIFE output."
9. **package-mjs-template.md line 220 — `'${PREVIEW_SCRIPT_PATH}'` in single quotes won't substitute.** Replace with a clear TODO comment indicating Claude must substitute at scaffolding time.
10. **viz-blueprints.md — 11 of 17 viz types lack per-viz Animation notes (AB-03 partial).** Add one-line "Entrance: Generic Entrance Boilerplate" notes to the missing 11 subsections.
11. **edge-cases.md ECR-06 cross-reference to broken-rules.md is implicit.** Use full relative path: `../../vp-debug/references/broken-rules.md`.

### Wave 2 (5 warnings)

12. **vp-viz/SKILL.md — Animation Helper Scope Rule (AF-01) not eagerly cited.** Add a one-line warning to the animation bullet in the CRITICAL SUBSET checklist.
13. **vp-viz/SKILL.md — 487/500 lines, only 13 lines of headroom.** Defer non-critical additions to referenced files.
14. **vp-design/SKILL.md — accent role not stated in design brief output.** Add a one-line note under the palette output block.
15. **vp-design/SKILL.md — FC-02 hand-off message doesn't forward Format to vp-viz.** Include the Format field in the vp-design hand-off context block.
16. **vp-init/SKILL.md — ds-create cross-plugin ref lacks full path.** Update to `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md`.

### Wave 3 (6 warnings)

17. **B22 documented but not enforced.** Add a grep-based heuristic to validate_viz.sh (pattern: `opt\('.*[Cc]olor` without `hexFromSplunk` on the same line) or annotate `broken-rules.md` B22 row with `(no static check; live test).`
18. **B23 documented but unenforceable statically.** Add `(no static check; verify visually)` note to broken-rules.md B23 row.
19. **B20 check strategy diverges between validate_viz.sh (grep) and validate_ast.js (DOM).** Document the divergence in a comment in validate_viz.sh.
20. **check_design.js operates only on formatter.html; Extension API vizs bypass D01-D11.** Document this scope gap in `pre-code-checklist.md` under the Extension API section.
21. **score_design.js loads themeContent but never uses it.** Either remove the load OR use it to weight the gradient-commitment penalty in `scoreGradient`.
22. **repair_findings.js silently drops CONTRAST and DS1-DS5 findings.** Add a comment explaining the intentional exclusion: "CONTRAST, DS1-DS5, XFILE, D-codes require human design decisions — intentionally excluded from auto-repair."

### Wave 4 (3 warnings)

23. **PA-01 2x preview output at 600x400 was never implemented; STATE.md claim is stale.** Either implement `preview_2x.png` in `generate_previews.py` or update STATE.md to reflect that PA-01 was scoped down when Phase 41 took preview ownership.
24. **STATE.md [41-01] font path drift.** STATE records `extras/ttf/Inter-Regular.ttf`; actual path is `scripts/fonts/Inter-Regular.ttf`. Update STATE.md (script is correct).
25. **generate_previews.py uses bare `D-04` comments at lines 5/183/252/408.** Phase 43 CONTEXT also has a `D-04` (fix-everything rule). Disambiguate: `(Phase 41 D-04): 3-tier detection cascade`.

### Wave 5 (5 warnings)

26. **ds-ref-archetypes — stale `> **Status:** skeleton only` marker.** The body is fully populated (320 lines). Remove the stale skeleton notice + the "Source / migration" + "Estimated size" scaffold sections.
27. **ds-ref-archetypes vs ds-ref-layout-grid — exec canvas size conflict.** Archetypes says `1440×960` for Executive Summary; layout-grid says "1920px minimum, no exceptions." Update archetypes to `1920×1080`.
28. **ds-ref-layout-grid — same stale `skeleton only` marker.** Remove it (body is 560+ lines).
29. **ds-ref-layout-grid + ds-ref-archetypes — canvas conflict already counted in #27 above (same root cause; flag both ends).**
30. **ds-int-tokens `form.<name>` reference on URL parameters entry.** `form.` is Classic/Simple XML prefix; Dashboard Studio drops it. Update the "URL parameters" entry to clarify.

---

## NIT (24)

Trivial polish items, listed by wave for traceability. Plan 43-07 (`--gaps` remediation) decides per-NIT whether to fix or defer to `## Deferred NITs` below.

### Wave 1 (7 NITs)

- N-1. `theme-template.md:259` cross-link footer uses prose, not exact line numbers — add `(line N)` references.
- N-2. `pre-code-checklist.md:11` "minimum 10 controls" conflicts with Section structure guidance. Clarify "minimum 10 controls (target 14-18); minimum 3 sections (4 when Animation section)".
- N-3. `canvas-recipes.md` lines 1-2 — "Phase 6" internal terminology. Drop or replace with `> v5.0.0:`.
- N-4. `config-json-template.md` Section Grouping example shows 3 sections; note "+ Animation when present".
- N-5. `conf-templates.md` lines 230-231 — `appIcon_2x.png` listed but never generated. Remove or note as optional.
- N-6. `animation-recipes.md` lines 542-549 — add a "Location note" header explaining why file lives in `vp-recipes/` (memory `feedback_must_load_tab_skill` adjacent).
- N-7. `viz-blueprints.md` ToC double-check — confirmed correct, no action needed (logged for record).

### Wave 2 (1 NIT)

- N-8. `vp-viz/SKILL.md:92` — add `(FC-04)` tag for traceability.

### Wave 3 (5 NITs)

- N-9. `validate_viz.sh:287` — untagged `FAIL: missing visualizations.conf`. Tag `FAIL R2:` and add to rejected-rules.md.
- N-10. `validate_viz.sh:288` — untagged `FAIL: missing allow_user_selection`. Tag `FAIL R3:`.
- N-11. `validate_viz.sh:294` — untagged `WARN: missing nav bar`. Tag `WARN N1:`.
- N-12. `test_validate_ast.js` — `TESTS_ROOT` assigned twice (dead assignment on line 18).
- N-13. `test_validate_viz_integration.sh` T_ANEW_3/T_ANEW_4 — create 300x200 preview.png, triggering A02 alongside the intended A03/A04. Fix to 116x76 or document the multi-FAIL pattern.

### Wave 4 (7 NITs)

- N-14. `generate_assets.js:16` header — annotate preview.png output line with "—only with `--legacy-previews`".
- N-15. `generate_assets.js:27,1496` — expand `D-01/D-02` to `Phase 41 D-01/D-02`.
- N-16. `vp-create/scripts/build_flat.js` — no automated sync mechanism with `vp-viz/scripts/build_flat.js`. Consider a CI diff assertion.
- N-17. `vp-create/scripts/validate_viz.sh` — add a "Why" comment explaining why a delegating wrapper exists.
- N-18. `generate_previews.py:70` — add VIZ_TYPE_KEYWORDS divergence comment vs `generate_assets.js`.
- N-19. CONTEXT.md `<domain>:34` — says "4 build-pipeline scripts"; actual is 5. Update for future-phase context.
- N-20. RESEARCH.md §tests/test* — says 46 directories; live count was 45 at Wave 4 time, 46 now. Note the volatility.

### Wave 5 (4 NITs)

- N-21. ds-create MUST LOAD table styling inconsistency (no action needed; logged).
- N-22. ds-int-tabs — add "See also: ds-ref-jsonata + ds-int-tokens" for token-driven tab switching.
- N-23. ds-ref-jsonata — add confidence-tier note under Higher-order functions table: `$map`/`$filter`/`$reduce` are `[Standard JSONata]`, lambda syntax unconfirmed for DS.
- N-24. ds-ref-syntax — grid layout example omits tabs wrapper. Either remove the flat example or wrap inside `layoutDefinitions`.

---

## Coverage Summary — Milestone-wide Change-ID Map

Cross-cutting summary of every Phase 22-42 change-ID and whether it landed everywhere it was supposed to. Status: **YES** = verified consistent; **PARTIAL** = present but incomplete; **NO** = absent.

| Change-ID | Phase | Expected location(s) | Status | Finding ref |
|-----------|-------|----------------------|--------|-------------|
| THM-01 | 22 | theme-template.md, pre-code-checklist.md | NO | B-1 |
| THM-02 | 22 | theme-template.md, pre-code-checklist.md | NO | B-1 |
| THM-03 | 22/24 | theme-template.md, pre-code-checklist.md | PARTIAL | W-1 |
| THM-04 | 22/24 | theme-template.md, pre-code-checklist.md | PARTIAL | W-1 |
| THM-05 | 42 | theme-template.md, pre-code-checklist.md, visualization-js-template.md, config-json-template.md | YES | — |
| AF-01 | 40 | animation-recipes.md | YES | — |
| AF-01 eager | 40 | vp-viz/SKILL.md | PARTIAL | W-12 |
| AF-02 | 40 | animation-recipes.md | YES | — |
| EF-01 | 39 | build-mjs-template.md (+ cross-refs) | PARTIAL | W-2 |
| EF-02 | 39 | build-mjs-template.md | YES | — |
| EF-03 | 39 | package-mjs-template.md, conf-templates.md | PARTIAL | W-3 |
| PP-01 | 41 | vp-create/SKILL.md, generate_previews.py | YES (in vp-create) / NO (in vp-viz, vp-init) | B-7, B-8 |
| PP-02 | 41 | generate_previews.py + generate_assets.js fallback | PARTIAL | B-16 |
| LM-01 | 42 | pre-code-checklist.md | YES | — |
| LM-02 | 42 | template files + vp-debug | PARTIAL | B-11 |
| B5, B7, B9, B10, B20, B21 | 22+ | pre-code-checklist.md (tagged) | PARTIAL | B-3 |
| B17 | 22+ | pre-code-checklist.md / broken-rules.md | NO | B-12 |
| B22 | 22+ | pre-code-checklist.md, edge-cases.md | YES | — |
| B23 | 22+ | broken-rules.md | YES (doc) / NO (enforcement) | W-18 |
| D01-D08 | 22+ | (no doc home) | NO | B-13, B-14, B-15 (drift class) |
| D09, D10, D11 | 22+ | pre-code-checklist.md | YES (D09, D11), PARTIAL (D10 template) | B-2 |
| E01-E05 | 28/31 | pre-code-checklist.md Extension section | NO | drift class |
| A01-A04 | 41 | pre-code-checklist.md / vp-debug | NO | drift class |
| DS1-DS5 | dash-validator | (no doc home) | NO | B-14 |
| CONTRAST | check_contrast.js | (no doc home) | NO | B-15 |
| XFILE | validate_ast.js | (no doc home) | NO | B-13 |
| CP-01 | 23 | vp-design/SKILL.md, formatter-patterns.md | PARTIAL (vp-design missing) | B-9, W-4 |
| CP-02 | 23 | theme-template.md | YES | — |
| CP-03 | 23 | formatter-patterns.md | PARTIAL | W-4 |
| AB-01 | 24 | animation-recipes.md | YES | — |
| AB-02 | 24 | animation-recipes.md | YES (boilerplate) / context gap (B-6) | B-6 |
| AB-03 | 24 | viz-blueprints.md | PARTIAL (11/17 missing) | W-10 |
| MC-01 | 26 | viz-blueprints.md, vp-design/SKILL.md | YES | — |
| MC-02 | 26 | vp-design/SKILL.md | YES | — |
| JR-01 | 38 | ds-ref-jsonata | YES | — |
| JR-02 | 38 | ds-int-tokens MUST LOAD | YES | — |
| SU-01 | drilldowns | ds-int-drilldowns | YES | — |
| SU-02 | tokens | ds-ref-jsonata | YES | — |
| SU-03 | drilldowns | ds-int-drilldowns | YES | — |
| FC-01, FC-02, FC-03, FC-04 | 29 | vp-init / vp-design / vp-viz | PARTIAL (FC-02 hand-off; FC-04 tag) | W-15, N-8 |
| Phase 29 SKILL.md line budget | 29 | all 6 vp-* SKILL.md | YES | — |
| Cross-plugin ds-* refs resolve | n/a | all 5 references | YES | — |
| Tabs schema (object + layoutId) | n/a | ds-int-tabs, ds-ref-syntax, ds-ref-layout-grid | PARTIAL (ds-ref-layout-grid wrong) | B-19 |
| Drilldown shape — eventHandlers preferred | drilldowns | ds-create | NO (still emits deprecated) | B-18 |

---

## Deferred NITs

Plan 43-07 (`--gaps` remediation) classifies each NIT as either trivial-fix-inline or deferred. NITs listed below are **candidates for deferral** because they require larger context (research, test-pack regeneration, or new tooling) than a remediation pass can absorb. Final disposition belongs to Plan 43-07.

- **N-7** (viz-blueprints ToC double-check — already correct; no edit needed).
- **N-13** (T_ANEW_3/T_ANEW_4 multi-FAIL behavior — documenting the multi-fail pattern is a test refactor, not a doc fix).
- **N-16** (build_flat.js auto-sync mechanism — needs CI design discussion).
- **N-19, N-20** (CONTEXT.md / RESEARCH.md inventory drift — these are historical planning docs; live counts will keep moving).

All other NITs (N-1 through N-24 excluding the above) are candidates for inline fix in Plan 43-07.

---

## Future Improvements (Out of Scope This Phase)

Items surfaced during review that exceed Phase 43's "fix everything found" scope or were explicitly deferred by CONTEXT.md.

1. **D12 validator rule for backgroundColor pattern** — Phase 42 D-03 deferred this. Wave 1 confirmed THM-05 is currently consistent across templates, but a static check would prevent future regression. Separate phase.
2. **vp-debug expansion to cover modern failure modes** — E01-E05 (Extension API), A01-A04 (asset checks), AF-01 (animation scope), THM-05 (light-mode background) all absent from the debugging skill. Wave 2 B-11 fixes THM-05 inline; full vp-debug overhaul deferred.
3. **Test pack retrofit** — 28 pre-2026-05-22 packs predate THM-05/AF-01/PP-01. Per CONTEXT D-05 #4 + Phase 42 D-04 carry-forward, test packs are throwaway artifacts and not modified in this phase. A future phase could either retrofit clean packs or delete the misleading ones.
4. **`test45_lego` / `test_phase42_bgcolor` as canonical integration-test targets** — Wave 3 W-18/W-19 recommended adding these as optional clean-pack targets in `test_validate_viz_integration.sh` and `test_check_contrast.js`. Modest scope; may roll into 43-07 cluster.
5. **Lambdas + path expressions confidence tier in ds-ref-jsonata** — Wave 5 N-23 flagged that `$map`/`$filter`/`$reduce` are `[Standard JSONata]` without DS-specific live-test confirmation. A future phase could live-test these on a DS instance.
6. **score_design.js theme integration** — Wave 3 W-21 flagged that `themeContent` is loaded but unused. Could become a real penalty for unfulfilled `fillTechnique: gradient` commitments.

---

## Wave Index (per-wave reviews — preserved for full-text traceability)

- `43-WAVE-1-REVIEW-REFERENCES.md` — 13 reference files (6 BLOCKER, 11 WARNING, 7 NIT)
- `43-WAVE-2-REVIEW-SKILLS.md` — 6 vp-* SKILL.md files (5 BLOCKER, 5 WARNING, 1 NIT)
- `43-WAVE-3-REVIEW-VP-VIZ-SCRIPTS.md` — 17 vp-viz/scripts/ files + plugin.json audit (6 BLOCKER, 6 WARNING, 5 NIT)
- `43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md` — 5 vp-create/scripts/ files (0 BLOCKER, 3 WARNING, 7 NIT)
- `43-WAVE-5-REVIEW-DASHBOARD-STUDIO.md` — 8 bounded splunk-dashboard-studio skills (2 BLOCKER, 5 WARNING, 4 NIT)
- `43-WAVE-6-REVIEW-TESTS.md` — 46 tests/test* directories, flag-only sweep (no edits per CONTEXT D-05 #4)

---

## Next Step

Per CONTEXT.md D-04 and Plan 43-07 frontmatter:

```
/gsd:plan-phase 43 --gaps
```

The `--gaps` planner reads this REVIEW.md and generates remediation plans clustered by edit locus. Expected clusters (RESEARCH pre-flagged hints):

- **Cluster A:** `plugin.json` description trim (5.9.1 → 5.10.0 bump) — Wave 3 plugin.json audit.
- **Cluster B:** broken-rules.md B-code backfill OR validate_viz.sh code rename — B-12, B-13, B-14, B-15.
- **Cluster C:** CONTEXT inventory drift NITs — N-19, N-20.
- **Cluster D:** PP-01 stale-attribution sweep — B-7, B-8, B-16.
- **Cluster E:** ds-ref-layout-grid schema fix + ds-create drilldown migration — B-18, B-19.
- **Cluster F:** vp-design CP-01 brand swatch step + accent architecture consolidation — B-9, W-4, W-14.
- **Cluster G:** vp-debug expansion (THM-05, B-codes range fix) — B-10, B-11.

Until Plan 43-07 is regenerated and the BLOCKER+WARNING fixes ship, **do not bump `plugins/splunk-viz-packs/.claude-plugin/plugin.json` to 5.10.0**. The version bump is intentionally gated on the remediation plans' completion (per CONTEXT D-08).
