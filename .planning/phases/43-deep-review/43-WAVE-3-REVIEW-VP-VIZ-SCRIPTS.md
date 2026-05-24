# Wave 3 Review: vp-viz/scripts/ Tooling

**Reviewed:** 2026-05-24
**Scope:** All 17 files in `plugins/splunk-viz-packs/skills/vp-viz/scripts/` (excluding `vendor/`)
**Purpose:** Identify "docs say X but linter enforces Y" drift (CONTEXT D-05) — the highest-value inconsistency class. Map B/D/E/F/R/A codes across enforcing scripts and their doc homes.

---

## Cluster 1: Primary Validators

Scripts reviewed: `validate_viz.sh`, `validate_ast.js`, `validate_dash.js`, `check_contrast.js`, `check_design.js`, `score_design.js`

### BLOCKER

**1. [validate_viz.sh:249] WARN B17 emitted but B17 has no doc home**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:249`
- Issue: The script emits `WARN B17: getBoundingClientRect usage` but B17 is documented in `broken-rules.md` (summary table row "Canvas dimensions wrong") as a rule about canvas being sized from a wrapper div or `getBoundingClientRect`. However, the validate_viz.sh check is labelled `WARN` (not `FAIL`) and the broken-rules.md row describes a different root cause than the check. The pre-code-checklist.md mentions `clientWidth/clientHeight — NEVER getBoundingClientRect for sizing` but does NOT tag it `B17`. A developer seeing `WARN B17` in validator output cannot grep their way to a definition.
- Recommendation: Add a `### B17` heading to `broken-rules.md` matching the `WARN B17` text, or tag the pre-code-checklist.md line with `(B17)`. Either approach closes the symmetry gap.

**2. [validate_ast.js] XFILE code has no doc home anywhere**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js:372-399`
- Issue: `validate_ast.js --cross` emits `FAIL XFILE` and `WARN XFILE` for formatter-vs-JS option key mismatches. These codes (`XFILE`) do not appear in `pre-code-checklist.md`, `broken-rules.md`, `formatter-patterns.md`, or any other reference. A user seeing `FAIL XFILE` in output has no doc to look up.
- Recommendation: Either add `XFILE` to `broken-rules.md` as a dedicated entry, or rename the code to a tagged variant (e.g., `B10x`) that cross-references D08 (which covers the same bidirectional wiring concern in check_design.js). The check is valuable but invisible.

**3. [validate_dash.js] DS1-DS5 codes have no doc home**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js:29`
- Issue: validate_dash.js defines and emits five new codes: `DS1` (undeclared data source), `DS2` (tab schema error), `DS3` (missing bg_gradient), `DS4` (missing markdown title panel), `DS5` (drilldown token no default). None of these appear in `pre-code-checklist.md`, `broken-rules.md`, or any reference file in `vp-viz/references/` or `vp-debug/references/`. A user seeing `FAIL DS2` has no doc to look up.
- Recommendation: Add DS1-DS5 to `broken-rules.md` or a new `vp-debug/references/dashboard-rules.md`. This is the exact "ENFORCED-ONLY" drift class per RESEARCH §Drift Findings.

**4. [check_contrast.js] CONTRAST code has no doc home**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js:125-128`
- Issue: The script emits `FAIL CONTRAST` and `WARN CONTRAST`. These codes do not appear in `pre-code-checklist.md`, `broken-rules.md`, or any reference. `pre-code-checklist.md` has a line for `D-08 light theme contrast` but uses "D-08" not "CONTRAST". The `check_contrast.js` header comment says "Pair definitions (D-11)" (line 73) which is an outdated reference — in `check_design.js`, D11 is the `_onMouseMove` showHoverEffect guard, not contrast. The `PAIRS` array on line 75-83 is labelled `(D-11)` in the comment but this is a stale comment from an earlier phase.
- Recommendation: (a) Remove the `(D-11)` comment from line 73 of `check_contrast.js` — it is misleading. (b) Add `CONTRAST` code to the pre-code-checklist.md or broken-rules.md with WCAG AA thresholds documented.

### WARNING

**5. [validate_viz.sh] B22 enforced in docs but NOT in validate_viz.sh**

- File: Pre-code-checklist.md:31, broken-rules.md:32
- Issue: `B22` (hexFromSplunk wraps all color picker opt() reads) is cited in `pre-code-checklist.md` line 31 and in `broken-rules.md` summary row. It is also cited in `edge-cases.md`. However, `validate_viz.sh` emits no `FAIL B22` check. The rule is documented but not enforced. This is a pure "DOCUMENTED-ONLY" case.
- Recommendation: Add a grep-based check to validate_viz.sh for the pattern `opt('.*Color.*'` without a `hexFromSplunk` wrapper on the same line (heuristic), or accept this as a known gap and add a NIT note to broken-rules.md acknowledging it.

**6. [validate_viz.sh] B23 documented in broken-rules.md but NOT enforced**

- File: broken-rules.md:32
- Issue: `B23` ("Text invisible on light theme background") is in broken-rules.md but has no corresponding `FAIL B23` in validate_viz.sh. The check would require running the viz and comparing rendered output — not practical for a static linter. However, the symmetry gap should be acknowledged.
- Recommendation: Add `(no static check; verify visually)` note to broken-rules.md B23 row, matching the pattern used for B2, B3, B6, B8, etc.

**7. [validate_ast.js] B20 check strategy diverges between validate_viz.sh (grep) and validate_ast.js (DOM)**

- File: `validate_viz.sh:118`, `validate_ast.js:276-299`
- Issue: `validate_viz.sh` grep fallback checks `themeMode.*value="dark"` (presence of "dark" default), while `validate_ast.js --html` checks that the `auto` option exists in the themeMode radio. These are subtly different — a formatter with no themeMode radio at all would pass the `validate_ast.js` check (no radio to fail) but the grep fallback would not flag it either. The checks are consistent in the common case but diverge for missing themeMode entirely.
- Recommendation: Document the divergence in a comment in validate_viz.sh. Low priority since both code paths fire B20 for the actually harmful case (default="dark").

**8. [check_design.js:73] Stale comment "(D-11)" on PAIRS array**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js:73`
- Issue: The comment `// ---- Pair definitions (D-11) ----` on line 73 of `check_contrast.js` is stale. `D-11` in the current `check_design.js` codebase is the `_onMouseMove showHoverEffect guard` check (CQ-03 alias). This comment was written when the D-code numbering was different, or was incorrectly copied from a design check template. Reading the file cold, the "(D-11)" tag is confusing.
- Recommendation: Replace with `// ---- Pair definitions (WCAG AA — check_contrast.js) ----`

**9. [validate_viz.sh] preview.png check uses 100-byte threshold but generate_assets.js uses different minimum**

- File: `validate_viz.sh:267`
- Issue: validate_viz.sh flags `FAIL A01` when `preview.png` is `< 100 bytes`. The `test_validate_viz_integration.sh` T_ANEW_1 test uses a 400-byte zero-filled placeholder (< 500 bytes) to trigger A01 but the check is `< 100`. The threshold comment says "solid-color placeholder ($SIZE bytes, need >100)". The test fixture uses 400 bytes which is above the 100-byte threshold — the integration test would NOT trigger A01 with a 400-byte file unless it triggers A02 (wrong dimensions). This is a test logic bug in T_ANEW_1.
- Recommendation: Update the T_ANEW_1 test fixture to use a `< 100` byte file (e.g., 50 bytes) to correctly exercise the A01 check. Alternatively, raise the validate_viz.sh threshold to 500 bytes if the intent is to catch any placeholder.

**10. [score_design.js] No themeContent parameter — reads theme but does not use it for scoring**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/score_design.js:54-55`
- Issue: `score_design.js` reads both `jsSrc` and `themeContent` (line 55) but none of the 5 scoring functions (`scoreGradient`, `scoreTypography`, `scoreSpacing`, `scoreColor`, `scoreAnimation`) use `themeContent`. The theme argument is loaded but ignored. This is harmless but wasteful — worse, it means the score cannot distinguish between a pack with a gradient `fillTechnique` commitment that is not honored vs one without gradient commitment.
- Recommendation: Either (a) remove the `themeContent` load and update the Usage comment/header to not list it as a required argument, or (b) use `themeContent` in `scoreGradient` to emit a higher-weight penalty when `fillTechnique:gradient` is declared but no gradient calls are found (align with check_design.js D01 logic). Option (b) is more useful.

### NIT

**11. [validate_viz.sh:287] Unlabeled FAIL for missing visualizations.conf**

- File: `validate_viz.sh:287-288`
- Issue: Line 287 emits `FAIL: missing visualizations.conf` (no code tag). All other failures use `FAIL B9`, `FAIL A01` etc. An untagged FAIL cannot be mapped to a doc entry or parsed by repair_findings.js.
- Recommendation: Tag it `FAIL R2: missing visualizations.conf` or similar, and add R2 to broken-rules.md/rejected-rules.md.

**12. [validate_viz.sh:288] Unlabeled FAIL for missing allow_user_selection**

- File: `validate_viz.sh:288`
- Issue: Same as above — `FAIL: missing allow_user_selection` lacks a code. Should be `FAIL R3` or similar.

**13. [validate_viz.sh:294] WARN for missing nav bar not tagged**

- File: `validate_viz.sh:294`
- Issue: `WARN: missing nav bar` — no code. Should be `WARN N1` or similar, or this is intentionally lightweight.

**14. [check_design.js:17] Header comment lists DQG-07 as skipping but internal comment says DQG-07**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js:17`
- Issue: The header comment says "skipping DQG-07" and the D-codes listed are "D01-D06, D08-D11". This is consistent — DQG-07 is skipped. But there is no comment inside the code explaining WHY DQG-07 is skipped (per RESEARCH the code has "skipping DQG-07" comment). This is acceptable documentation-internally, confirmed consistent.
- Note: ACCEPTED — D07 skip is correct per CONTEXT §prior_decisions.

**15. [check_design.js] check_design.js operates only on formatter.html, not config.json**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js:39-60`
- Issue: `check_design.js` requires formatter.html as its first argument. For Extension API vizs that use `config.json`, the design quality gate is never run. `validate_viz.sh` only calls `check_design.js` for vizs that have `formatter.html` (line 391: iterates over `formatter.html` files). Extension API vizs bypass the design gate entirely. D05, D06, D08, D11 are not checked for Extension API vizs.
- Recommendation: Document this scope gap in `pre-code-checklist.md` under the Extension API checklist section, noting that design quality checks (D01-D11) do not apply to Extension API path. This is not necessarily wrong by design — formatter-specific checks do not make sense for config.json — but the gap should be explicit.

---

## Cluster 2: Tests + Repair + Build

Scripts reviewed: `test_check_contrast.js`, `test_check_design.js`, `test_generate_assets.js`, `test_repair_findings.js`, `test_score_design.js`, `test_validate_ast.js`, `test_validate_dash.js`, `test_validate_viz_integration.sh`, `repair_findings.js`, `build_flat.js`, `generate_assets.js`

### BLOCKER

**16. [generate_assets.js] Still owns preview.png generation — Phase 41 D-01/D-02 split not fully landed**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js:16, 968-1027`
- Issue: Per Phase 41 D-01/D-02 split: `generate_previews.py` (Pillow) owns `preview.png` production; `generate_assets.js` is supposed to be the fallback only (via `--legacy-previews` flag). However, `generate_assets.js` in `vp-viz/scripts/` still generates `preview.png` unconditionally with no `--legacy-previews` flag. The file header (line 16) lists `<app_dir>/appserver/static/visualizations/<viz>/preview.png (116x76 per viz)` as one of its outputs with no indication that this is legacy fallback behavior. The `vp-create/SKILL.md:80` references `--legacy-previews` as a flag on `generate_assets.js`, but this flag does not exist in the `vp-viz/scripts/generate_assets.js` code.
- **Impact:** vp-create SKILL.md tells Claude to call `node generate_assets.js /path/to/app --legacy-previews` for fallback preview generation, but this flag is silently ignored — `generate_assets.js` always generates previews regardless of whether `--legacy-previews` is passed or not. The Pillow path and the JS path will both generate preview.png, and the last one to run wins. This may be benign in practice but the `--legacy-previews` gate is a fiction.
- Recommendation: Either (a) add a `--legacy-previews` flag to `generate_assets.js` that gates whether it generates `preview.png` (default: skip), or (b) remove the `--legacy-previews` reference from `vp-create/SKILL.md:80` and clarify that `generate_assets.js` always generates JS-silhouette previews, and `generate_previews.py` overwrites them with Pillow previews when available.

**17. [test_validate_viz_integration.sh] T_ANEW_1 test uses 400-byte placeholder but A01 threshold is 100 bytes**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh:386`
- Issue: T_ANEW_1 writes a 400-byte zero-filled file as `preview.png` to trigger `FAIL A01`. But `validate_viz.sh` only emits `FAIL A01` for files `< 100 bytes`. A 400-byte file passes the A01 size check and instead triggers `FAIL A02` (wrong dimensions, since a 400-byte zero blob has no valid PNG header). The test "passes" only because `validate_viz.sh` does emit some `FAIL A` code (A02 or both), but the assertion `grep -q 'FAIL A01'` would fail if zero-bytes is read as a 0-byte file.
- **Impact:** This is a latent test bug. If the fixture behavior changes (e.g., `dd` is slower or writes fewer bytes), T_ANEW_1 could silently pass for the wrong reason.
- Recommendation: Replace the 400-byte fixture with a 50-byte file (e.g., `dd if=/dev/zero bs=50 count=1`) to reliably trigger `FAIL A01` for the `< 100` threshold.

### WARNING

**18. [test_validate_viz_integration.sh] Integration tests target test21, test25, test28 — all pre-THM-05**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh:10-12`
- Issue: The integration test targets `test28_drilldown_tabs`, `test21_patagonia`, and `test25_v4`. All three are pre-2026-05-22 packs. Per RESEARCH §Pack Age Survey, these packs predate THM-05 and AF-01. The integration tests were built against these fixtures and implicitly encode their violation profiles (e.g., T22 says "test25 theme.js has a real FAIL CONTRAST (light.textDim/panelHi 4.32:1 < 4.5:1)"). This means the tests will always run against stale fixtures — a clean post-THM-05 pack may behave differently.
- **Impact:** Low for now (integration tests still validate tooling behavior), but test assumptions are baked against old violation patterns.
- Recommendation: Add `test45_lego` or `test38_strava` as an optional clean-pack target (guarded with `if [ -d "$TEST45" ]`). This would provide a "known-good modern pack" smoke test that is not riddled with pre-THM-05 violations.

**19. [test_check_contrast.js] Integration test targets test28 and test25 — stale fixtures**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_contrast.js:36-39`
- Issue: Same as above — integration tests use test28 and test25 which are pre-THM-05. The comment on line 216 says "The real test28 theme has known light.textDim contrast issues". This is correct documentation of known fixture behavior, but a more recent pack (test45_lego) would provide a cleaner baseline.
- Recommendation: Add test45 as an optional third integration target.

**20. [repair_findings.js] CONTRAST code findings silently dropped**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/repair_findings.js:48`
- Issue: `FIXABLE_CODES = ['B10', 'B9', 'B7', 'B5', 'B20']`. The `CONTRAST` code from `check_contrast.js` is not in `FIXABLE_CODES`, so contrast failures are silently dropped from the repair loop (not logged, not attempted, not reported). This is intentional (contrast requires human design decisions), but the comment at line 48 does not explain why CONTRAST and DS1-DS5 and XFILE are excluded.
- Recommendation: Add a comment: `// CONTRAST, DS1-DS5, XFILE, D-codes are intentionally excluded — require human design decisions`

**21. [repair_findings.js] DS1-DS5 findings silently dropped**

- File: `repair_findings.js:48`
- Issue: As above — DS1, DS2, DS3, DS4, DS5 all produce FINDING: NDJSON lines but are silently discarded by repair_findings.js. No repair logic exists for dashboard JSON structural issues.
- Recommendation: Same as #20 — add a comment explaining the scope boundary.

**22. [build_flat.js] AMD output verification is shallow — only checks first line**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js:97-101`
- Issue: Build validation (lines 97-101) only checks that the first line starts with `define([`. This is the minimal AMD wrapper check. However, the IIFE comment on line 13 suggests the author is aware of edge cases with the module.exports regex (`without m flag — $ matches end-of-line...`). The quick validation does not check whether the inlined theme code causes syntax errors in the output, nor whether the `return` conversion was successful.
- Recommendation: After writing the output file, consider a `node --check <output>` pass to catch syntax errors. This is a NIT in normal operation but would catch corrupted builds immediately.

**23. [build_flat.js] build_flat.js in vp-viz/scripts/ and vp-create/scripts/ may have diverged**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js`
- Issue: Per RESEARCH §vp-create/scripts/, both `vp-viz/scripts/build_flat.js` and `vp-create/scripts/build_flat.js` exist. These should be identical copies (per architecture: "Canonical source at `vp-viz/scripts/build_flat.js`, copied to `vp-create/scripts/build_flat.js`"). Wave 3 only read the `vp-viz/` copy. If the files have diverged, builds would produce different output depending on which path is used.
- Recommendation: Verify file identity with `diff plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js plugins/splunk-viz-packs/skills/vp-create/scripts/build_flat.js`. If they diverge, reconcile and add a comment in both files noting they must stay in sync.

### NIT

**24. [test_validate_ast.js] TESTS_ROOT set twice (dead assignment)**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_ast.js:18,23`
- Issue: `TESTS_ROOT` is assigned on line 18 then immediately overwritten on line 23 with `REPO_ROOT + '/tests'`. The first assignment (line 18) is dead code. Minor but confusing.
- Recommendation: Remove line 18's assignment.

**25. [test_repair_findings.js] Path comment says "5 levels up" but actual path resolution is correct**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_repair_findings.js:19-21`
- Issue: Comment says "scripts/ -> vp-viz/ -> skills/ -> splunk-viz-packs/ -> plugins/ -> repo root" which is 5 levels (`..` 5 times). This correctly resolves the repo root. Verified correct.
- Recommendation: No action needed.

**26. [test_validate_viz_integration.sh] T_ANEW_3 and T_ANEW_4 create 300x200 preview.png (wrong size)**

- File: `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh:479-493, 517-534`
- Issue: T_ANEW_3 and T_ANEW_4 create preview.png with dimensions `300x200` using Python. But `validate_viz.sh` checks for `116x76` (FAIL A02). Both T_ANEW_3 and T_ANEW_4 will emit `FAIL A02` (wrong dimensions) in addition to the A03/A04 they intend to test. The tests still pass because they grep for `FAIL A03` or `FAIL A04` specifically, but the fixture generates multiple FAILs.
- Recommendation: Create the preview fixture at `116x76` to isolate A03/A04. Or document that the 300x200 preview is intentionally "wrong" in the T_ANEW_3/T_ANEW_4 comments.

**27. [generate_assets.js] generate_assets.js in vp-viz/scripts/ vs vp-create/scripts/**

- Issue: The `vp-viz/scripts/generate_assets.js` is the canonical 1498-line version. Per RESEARCH, `vp-create/scripts/generate_assets.js` also exists at 66KB. These should be the same file. Wave 3 reads vp-viz's copy only.
- Recommendation: Same verification as #23 — `diff` the two copies.

---

## Coverage Summary

Code-symmetry table: each code mapped to its enforcing script(s) and doc home(s).

| Code | Enforced by | Doc home (pre-code-checklist.md) | Doc home (vp-debug/references) | Symmetry status |
|------|-------------|----------------------------------|-------------------------------|-----------------|
| B1 | (none) | No B1 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B2 | (none) | No B2 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B3 | (none) | No B3 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B4 | (none) | No B4 tag | broken-rules.md:56 + summary | DOCUMENTED-ONLY |
| B5 | validate_viz.sh + validate_ast.js | Line 9 (section-label + type="custom") | broken-rules.md summary row | SYMMETRIC |
| B6 | (none) | No B6 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B7 | validate_viz.sh + validate_ast.js | Line 8 (value= not default=) | broken-rules.md summary row | SYMMETRIC |
| B8 | (none) | Line 29 (Math.max/ratio — not tagged B8) | broken-rules.md summary row | DOCUMENTED-ONLY |
| B9 | validate_viz.sh + validate_ast.js + validate_dash.js | Line 36 (dashboard JSON type) | broken-rules.md summary row | SYMMETRIC |
| B10 | validate_viz.sh + validate_ast.js + validate_dash.js | Line 7 ({{VIZ_NAMESPACE}}) | broken-rules.md summary row | SYMMETRIC |
| B11 | (none) | No B11 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B12 | (none) | No B12 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B13 | (none) | No B13 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B14 | (none) | No B14 tag | broken-rules.md:79 + summary | DOCUMENTED-ONLY |
| B15 | (none) | No B15 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B16 | (none) | No B16 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B17 | validate_viz.sh (WARN) | Line 25 (clientWidth/clientHeight — no B17 tag) | broken-rules.md summary row (description mismatch) | ENFORCED-ONLY (WARN) |
| B18 | (none) | No B18 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| B19 | (none) | No B19 tag | broken-rules.md:107 + summary | DOCUMENTED-ONLY |
| B20 | validate_viz.sh + validate_ast.js | Line 11 (themeMode="auto") | broken-rules.md summary row | SYMMETRIC |
| B21 | validate_viz.sh | Line 22 (safeStr/safeNum) | broken-rules.md summary row | SYMMETRIC |
| B22 | (none) | Line 31 (hexFromSplunk) + edge-cases.md | broken-rules.md summary row | DOCUMENTED-ONLY |
| B23 | (none) | No B23 tag | broken-rules.md summary row | DOCUMENTED-ONLY |
| D01 | check_design.js (WARN or FAIL) | No D01 tag | (none) | ENFORCED-ONLY |
| D02 | check_design.js (WARN) | No D02 tag | (none) | ENFORCED-ONLY |
| D03 | check_design.js (FAIL) | No D03 tag | (none) | ENFORCED-ONLY |
| D04 | check_design.js (WARN) | No D04 tag | (none) | ENFORCED-ONLY |
| D05 | check_design.js (FAIL) | No D05 tag | (none) | ENFORCED-ONLY |
| D06 | check_design.js (WARN) | No D06 tag | (none) | ENFORCED-ONLY |
| D08 | check_design.js (FAIL fwd / WARN rev) | No D08 tag | (none) | ENFORCED-ONLY |
| D09 | check_design.js (FAIL) | Line 67 (accentIntensity not capped — tagged CQ-02/D09) | (none) | SYMMETRIC |
| D10 | check_design.js (FAIL) | Line 18 (first-line @viz-type — ENFORCED notice, tagged D10) | (none) | SYMMETRIC |
| D11 | check_design.js (FAIL) | Line 32 (showHoverEffect guard — tagged CQ-03/D11) | (none) | SYMMETRIC |
| E01 | validate_viz.sh | Pre-code-checklist Extension section (no E01 tag) | (none) | ENFORCED-ONLY |
| E02 | validate_viz.sh | Pre-code-checklist Extension section (no E02 tag) | (none) | ENFORCED-ONLY |
| E03 | validate_viz.sh | Pre-code-checklist Extension section (no E03 tag) | (none) | ENFORCED-ONLY |
| E04 | validate_viz.sh | Pre-code-checklist Extension section (no E04 tag) | (none) | ENFORCED-ONLY |
| E05 | validate_viz.sh | Pre-code-checklist Extension section (no E05 tag) | (none) | ENFORCED-ONLY |
| F3 | validate_viz.sh + validate_ast.js | Line 35 (ES5 — no F3 tag) | fatal-rules.md (F3 entry?) | PARTIALLY SYMMETRIC |
| A01 | validate_viz.sh | Pre-code-checklist line: "run generate_assets.js" (no A01 tag) | (none) | ENFORCED-ONLY |
| A02 | validate_viz.sh | No A02 tag | (none) | ENFORCED-ONLY |
| A03 | validate_viz.sh | Pre-code-checklist line: "run generate_assets.js" (no A03 tag) | (none) | ENFORCED-ONLY |
| A04 | validate_viz.sh | No A04 tag | (none) | ENFORCED-ONLY |
| R1 | validate_viz.sh | No R1 tag | rejected-rules.md (R1 entry) | PARTIALLY SYMMETRIC |
| R6 | validate_viz.sh | No R6 tag | rejected-rules.md (R6 entry) | PARTIALLY SYMMETRIC |
| DS1 | validate_dash.js | (none) | (none) | ENFORCED-ONLY |
| DS2 | validate_dash.js | (none) | (none) | ENFORCED-ONLY |
| DS3 | validate_dash.js | (none) | (none) | ENFORCED-ONLY |
| DS4 | validate_dash.js | (none) | (none) | ENFORCED-ONLY |
| DS5 | validate_dash.js | (none) | (none) | ENFORCED-ONLY |
| CONTRAST | check_contrast.js | No CONTRAST tag (D-08 approach in pre-code-checklist) | (none) | ENFORCED-ONLY |
| XFILE | validate_ast.js (--cross) | No XFILE tag | (none) | ENFORCED-ONLY |

**Summary counts:**

- SYMMETRIC: B5, B7, B9, B10, B20, B21, D09, D10, D11 = **9 codes**
- PARTIALLY SYMMETRIC (enforced AND in a related doc, but code tag not matched): F3, R1, R6 = **3 codes**
- ENFORCED-ONLY (script emits FAIL/WARN, no matching code tag in any doc): B17, D01, D02, D03, D04, D05, D06, D08, E01, E02, E03, E04, E05, A01, A02, A03, A04, DS1, DS2, DS3, DS4, DS5, CONTRAST, XFILE = **24 codes**
- DOCUMENTED-ONLY (doc cites rule, no script enforces it): B1, B2, B3, B4, B6, B8, B11, B12, B13, B14, B15, B16, B18, B19, B22, B23 = **16 codes**

**ENFORCED-ONLY codes are the candidate BLOCKERs per CONTEXT D-05.** When Claude sees `FAIL D03` in validator output, there is no doc entry to look up. 24 codes fall into this category — the single largest gap class.

---

### plugin.json description audit

**File:** `plugins/splunk-viz-packs/.claude-plugin/plugin.json`
**Field:** `description`
**Claim:** "50+ validation checks (B1-B23, D1-D11, E1-E5, F1-F12)"

**Analysis:**

| Code range | Claimed | Actually enforced in scripts | Actually documented in vp-debug/ |
|------------|---------|------------------------------|----------------------------------|
| B1-B23 (23 B-codes) | 23 | B5, B7, B9, B10, B17(WARN), B20, B21 = 7 enforced | B1-B23 all in broken-rules.md summary table (23 documented) |
| D1-D11 | 11 | D01-D06, D08-D11 = 10 enforced (D07 skipped) | No D-code doc home found |
| E1-E5 | 5 | E01-E05 = 5 enforced | No E-code doc home found |
| F1-F12 | 12 | F3 only (validate_viz.sh grep-fallback + validate_ast.js) | fatal-rules.md has F1-F12 all documented |

**Issues:**

1. **"B1-B23" implies 23 enforced codes.** Only 7 B-codes (`B5`, `B7`, `B9`, `B10`, `B17`, `B20`, `B21`) are enforced by any script. B1-B4, B6, B8, B11-B16, B18, B19, B22, B23 are documented in `broken-rules.md` but NOT enforced by any validator. The description over-promises by implying all 23 codes have validator enforcement.

2. **"F1-F12" implies 12 F-codes enforced.** Only `F3` (ES6 violations) is enforced by `validate_ast.js`. F1, F2, F4-F12 are in `fatal-rules.md` but not in any script.

3. **"50+ validation checks" count.** Actual count: 7 (B) + 10 (D) + 5 (E) + 1 (F3) + 4 (A) + 2 (R) + 2 (misc untagged) + 5 (DS) + 1 (CONTRAST) + 1 (XFILE) + B17(WARN) = approximately 37 distinct codes across all scripts. This is below 50.

**Severity: WARNING**

**Recommendation:** Trim the plugin.json description to match reality. Proposed replacement:

```
"Includes aesthetic scoring (score_design.js), validation checks (7 B-codes auto-enforced with repair loop, D01-D11 design quality gate, E01-E05 Extension API checks, A01-A04 asset checks, F3 ES5 compliance), animation boilerplates, multi-channel archetype, and threshold RAG template."
```

This is cheaper than backfilling 16 B-codes and 11 F-codes with validator checks — and the repair loop coverage (B5, B7, B9, B10, B20) is the actual selling point.
