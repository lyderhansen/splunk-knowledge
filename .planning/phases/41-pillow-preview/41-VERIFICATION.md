---
phase: 41-pillow-preview
verified: 2026-05-24T11:34:14Z
status: passed
score: 16/16 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 41: Pillow Preview Verification Report

**Phase Goal:** vp-create generates Pillow-based preview.png files with per-viz custom miniature renderings instead of raw-buffer silhouettes

**Verified:** 2026-05-24T11:34:14Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                | Status     | Evidence                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | generate_previews.py exists and is invocable as `python3 generate_previews.py <app_dir>`                                              | VERIFIED   | File exists (540 lines, 22081 bytes); smoke test exit code 0; argparse positional arg implemented                                                       |
| 2   | Inter-Regular.ttf bundled at scripts/fonts/Inter-Regular.ttf and read at script start via ImageFont.truetype()                        | VERIFIED   | File present (407056 bytes, TrueType v4.000 from rsms/inter); FONT_PATH constant points to it; `_load_font` uses ImageFont.truetype                     |
| 3   | OFL.txt SIL OFL 1.1 license sits alongside the TTF                                                                                   | VERIFIED   | File exists (92 lines, 4380 bytes); `grep "SIL OPEN FONT LICENSE\|SIL Open Font License"` returns 2 matches                                              |
| 4   | All 7 draw functions defined (drawGauge, drawBars, drawLine, drawTable, drawKpi, drawRing, drawGeneric)                              | VERIFIED   | `grep -cE "^def drawX\b"` returns 1 for each of the 7 functions                                                                                          |
| 5   | 3-tier detection cascade resolves every viz to tier 1, 2, or 3 — no viz returns a generic solid rectangle                            | VERIFIED   | `detect_viz_type()` implements all 3 tiers (`@viz-type`, Canvas API counts, generic); smoke test logged "tier 1 (grid/timeline/bars/kpi/gauge)" per viz |
| 6   | Each produced preview.png is exactly 116x76 RGB (no alpha)                                                                            | VERIFIED   | Smoke test: PIL.Image.open() reports (116, 76) RGB for all 5 outputs                                                                                     |
| 7   | Pillow auto-installs via subprocess.check_call if not already present (D-02 fallback)                                                | VERIFIED   | grep matches subprocess.check_call pip install pattern at script top                                                                                     |
| 8   | theme.js parser extracts DARK.bg/text/textDim/accent/series via regex                                                                 | VERIFIED   | `_BLOCK_RE` + `_FIELD_RE` + `_SERIES_RE` regex extractors present; smoke test parsed Red Bull `#060E1F` bg + `#F5C518` accent correctly                  |
| 9   | Three+ preview.png files for test42_redbull are byte-different (visual diversity)                                                    | VERIFIED   | 4/4 pairwise `cmp -s` comparisons return non-zero (kpi != ring, kpi != athlete, ring != athlete, bar != timeline)                                       |
| 10  | vp-create/SKILL.md Step 3b runs BOTH generate_assets.js (icons + bg) AND generate_previews.py (previews)                              | VERIFIED   | Step 3b bash block (lines 72-78) contains both `node ... generate_assets.js` and `python3 ... generate_previews.py` invocations                          |
| 11  | SKILL.md Step 3b acceptance checklist references generate_previews.py and notes 'uses Pillow'                                        | VERIFIED   | Checklist row: "Preview.png generated per viz (step 3b — run generate_previews.py; ... uses Pillow + Inter font, >100 bytes)"                            |
| 12  | generate_assets.js no longer calls generatePreviews() by default — gated behind `--legacy-previews` CLI flag                          | VERIFIED   | Default invocation logs "previews handled by generate_previews.py (skipping; pass --legacy-previews to override)" and writes 0 preview.png files          |
| 13  | When --legacy-previews is absent, generate_assets.js skips preview generation cleanly                                                | VERIFIED   | `if (legacyPreviews)` gate present; functional test confirmed 0 preview.png written, INFO message present                                                |
| 14  | package-mjs-template.md Extension API preview generation invokes generate_previews.py via subprocess; buildSolidPng remains as fallback | VERIFIED   | `execSync(\`python3 "${previewScript}" "${previewStageDir}"\`, ...)` at line 223; try/catch with buildSolidPng fallback at lines 226-239                |
| 15  | plugin.json version bumped from 5.8.0 to 5.9.0                                                                                       | VERIFIED   | `"version": "5.9.0"` confirmed; JSON valid via Node JSON.parse                                                                                          |
| 16  | No file modified in Plan 1 (generate_previews.py, Inter-Regular.ttf, OFL.txt) is re-modified by Plan 2 — wave isolation               | VERIFIED   | `git log a43f3bd5..HEAD -- <plan-1 paths>` returns empty                                                                                                  |

**Score:** 16/16 truths verified

### Required Artifacts

| Artifact                                                                                            | Expected                                                                                                | Status     | Details                                                                       |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py`                            | Pillow-based per-viz preview.png generator; min 350 lines; contains `def drawGauge`                     | VERIFIED   | 540 lines (within 300-600 budget), all 7 draw fns + 3-tier cascade present    |
| `plugins/splunk-viz-packs/skills/vp-create/scripts/fonts/Inter-Regular.ttf`                         | Bundled font; min 50000 bytes                                                                           | VERIFIED   | 407056 bytes, TrueType v4.000 (Inter Project Authors)                          |
| `plugins/splunk-viz-packs/skills/vp-create/scripts/fonts/OFL.txt`                                    | SIL OFL 1.1 license; min 50 lines                                                                       | VERIFIED   | 92 lines, 4380 bytes, "SIL Open Font License" present                          |
| `plugins/splunk-viz-packs/skills/vp-create/SKILL.md`                                                | Step 3b dual invocation + updated checklist; contains "generate_previews.py"                            | VERIFIED   | 268 lines; dual invocation in fenced bash block at L72-78; checklist updated   |
| `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js`                              | Preview generation gated behind --legacy-previews; contains "--legacy-previews"                          | VERIFIED   | 1520 lines; argv parser, `if (legacyPreviews)` gate, INFO log all present     |
| `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md`                          | Extension API preview path upgraded; contains "generate_previews.py"; under 500 lines                    | VERIFIED   | 288 lines (< 500); 7 references to generate_previews.py; execSync invocation   |
| `plugins/splunk-viz-packs/.claude-plugin/plugin.json`                                                | Version bumped to 5.9.0                                                                                  | VERIFIED   | `"version": "5.9.0"` confirmed; JSON valid                                     |

### Key Link Verification

| From                                         | To                                                  | Via                                                                | Status | Details                                                                                                  |
| -------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------- |
| generate_previews.py main loop               | appserver/static/visualizations/*/preview.png       | os.walk + PIL.Image.save                                            | WIRED  | Smoke test wrote 5 preview.png files at correct paths                                                    |
| Tier 1 detection                              | @viz-type annotation in visualization_source.js     | regex match on first 10 lines                                       | WIRED  | `VIZ_TYPE_RE` regex present; smoke test resolved all 5 vizs to tier 1                                    |
| Tier 2 detection                              | Canvas API pattern detection                        | regex counts of ctx.arc / ctx.fillRect / ctx.lineTo / ctx.fillText  | WIRED  | All 4 ctx pattern counts implemented in `detect_viz_type()`                                              |
| Tier 3 fallback                               | drawGeneric with brand bg + viz name in Inter font  | ImageFont.truetype('Inter-Regular.ttf', auto-sized to fit)         | WIRED  | drawGeneric function present, uses _load_font helper                                                      |
| theme.js parser                               | DARK = { bg, text, textDim, accent, series }        | regex extract on var DARK block                                     | WIRED  | `_BLOCK_RE`, `_FIELD_RE`, `_SERIES_RE` all present; smoke test extracted Red Bull palette correctly      |
| vp-create/SKILL.md Step 3b                    | scripts/generate_previews.py                        | python3 ${CLAUDE_SKILL_DIR}/scripts/generate_previews.py invocation | WIRED  | Line 77 of SKILL.md: `python3 ${CLAUDE_SKILL_DIR}/scripts/generate_previews.py /path/to/app`              |
| vp-create/SKILL.md Step 3b                    | scripts/generate_assets.js --legacy-previews        | If python3/Pillow unavailable, re-invoke generate_assets.js w/ flag | WIRED  | Line 80: documents fallback to `node ... generate_assets.js /path/to/app --legacy-previews`              |
| generate_assets.js argv parser                | generatePreviews() main loop                        | --legacy-previews CLI flag gate                                     | WIRED  | argv parsed into `legacyPreviews`; `if (legacyPreviews)` wraps generatePreviews call                     |
| package-mjs-template.md Section 5             | generate_previews.py subprocess call                | execSync('python3 ... generate_previews.py {stage_dir}')           | WIRED  | Line 223: `execSync(\`python3 "${previewScript}" "${previewStageDir}"\`, { stdio: 'inherit' })`           |

### Data-Flow Trace (Level 4)

| Artifact                  | Data Variable                       | Source                                              | Produces Real Data | Status   |
| ------------------------- | ----------------------------------- | --------------------------------------------------- | ------------------ | -------- |
| generate_previews.py      | theme dict (bg, accent, series...)  | parse_theme_js() reads shared/theme.js via regex   | Yes                | FLOWING  |
| generate_previews.py      | viz tier + type_name                | detect_viz_type() reads visualization_source.js     | Yes                | FLOWING  |
| generate_previews.py      | preview.png pixels                  | Pillow draw* functions with theme colors            | Yes                | FLOWING  |
| package-mjs-template.md   | preview.png per viz                 | execSync python3 generate_previews.py + fallback     | Yes (template)     | FLOWING  |

**Smoke test evidence:**
- Red Bull pack theme parsed: bg=#060E1F (Red Bull midnight blue), accent=#F5C518 (Red Bull gold)
- Top-left pixel of kpi_tile/preview.png = (6, 14, 31) — matches DARK.bg exactly
- Hero region contains 137+ pixels of (245, 197, 24) — matches DARK.accent (gold) exactly
- 5 preview.png files produced, all 116x76 RGB, 4/4 pairwise byte-different

### Behavioral Spot-Checks

| Behavior                                                | Command                                                                                          | Result                                                   | Status |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------ |
| generate_previews.py runs against Red Bull pack         | `python3 generate_previews.py tests/test42_redbull/redbull_sports_viz`                            | Exit 0; "wrote 5 preview.png files, 0 errors"             | PASS   |
| 5 preview.png files written at exactly 116x76 RGB       | `python3 -c "from PIL import Image; ..."`                                                         | All 5 reported `(116, 76) RGB`                            | PASS   |
| Visual diversity confirmed (≥3/3 pairwise byte-different) | `cmp -s` between kpi/ring/athlete + bar/timeline                                                 | 4/4 pairs differ                                          | PASS   |
| generate_assets.js default skips preview generation     | `node generate_assets.js tests/test42_redbull/redbull_sports_viz`                                 | "INFO: previews handled by generate_previews.py (skipping)" + 0 preview.png written | PASS |
| generate_assets.js --legacy-previews enables JS path    | `node generate_assets.js tests/test42_redbull/redbull_sports_viz --legacy-previews`              | "INFO: --legacy-previews flag set; generating JS silhouette previews"                | PASS |
| plugin.json is valid JSON                                | `node -e "JSON.parse(...)"`                                                                       | JSON_VALID                                                | PASS   |
| tests/ working tree clean after smoke tests             | `git status --short tests/`                                                                       | empty                                                     | PASS   |

### Probe Execution

No `scripts/*/tests/probe-*.sh` or PLAN-declared probes are part of this phase. SKIPPED — phase uses inline smoke tests instead of formal probe scripts.

### Requirements Coverage

| Requirement | Source Plan        | Description                                                                                                                                                       | Status    | Evidence                                                                                                          |
| ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| PP-01       | 41-01-PLAN, 41-02-PLAN | vp-create generates a `generate_previews.py` script with per-viz drawing functions using Pillow — each viz type gets a custom miniature rendering with brand colors, real fonts, representative layout | SATISFIED | generate_previews.py exists with 7 bespoke draw functions, 3-tier cascade, theme.js parser, Inter font; wired into vp-create Step 3b and package-mjs-template.md |
| PP-02       | 41-01-PLAN, 41-02-PLAN | Generated preview.png files are 116x76 pixels and visually represent the viz type                                                                                | SATISFIED | All 5 smoke-test outputs are exactly (116, 76) RGB; tier-1 routes vizs to bespoke draw functions (gauge→arc, table→rows, etc.); 4/4 pairwise diversity |

REQUIREMENTS.md "Traceability" table currently shows PP-01/PP-02 as `pending` — this appears to be a stale tracking-column artifact (the implementation is verified satisfied via code evidence). No requirements are orphaned: REQUIREMENTS.md maps only PP-01 and PP-02 to Phase 41 and both are claimed by both PLANs' `requirements` frontmatter.

### Anti-Patterns Found

| File                                                                  | Line       | Pattern                                  | Severity  | Impact                                                                                                       |
| --------------------------------------------------------------------- | ---------- | ---------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py | 333, 374   | `abs(hash(viz_name or "..."))`           | Warning   | CPython hash() is randomized per-process (PEP 456). Breaks the "previews look identical on every build" claim. Sparkline shape and KPI hero number will differ between runs. Cosmetic only — outputs still pass size/format checks. Documented as REVIEW.md CR-01 (advisory). |

No debt markers (TODO/FIXME/TBD/XXX/HACK) were found in any of the 4 modified files. No placeholder strings, no empty implementations, no console-log-only handlers.

### Human Verification Required

None — phase deliverables are mechanical (file existence, regex matches, smoke-test outputs) and all were programmatically verified.

### Gaps Summary

No gaps blocking goal achievement. All 16 must-haves verified, all 9 key links wired, all 4 data-flow checks confirm real data flowing from theme.js through Pillow to preview.png. The smoke test against `tests/test42_redbull/redbull_sports_viz` produced 5 distinct 116x76 RGB preview.png files with verified Red Bull brand colors (midnight blue bg + gold accent).

The phase goal — "vp-create generates Pillow-based preview.png files with per-viz custom miniature renderings instead of raw-buffer silhouettes" — is achieved:
- generate_previews.py is the new canonical preview owner (Pillow-based, per-viz draw functions, 3-tier cascade)
- generate_assets.js silhouette path is gated behind `--legacy-previews` as the D-02 fallback only
- Both Classic (vp-create/SKILL.md Step 3b) and Extension API (package-mjs-template.md) entry points invoke the new script
- plugin.json bumped to v5.9.0 per the version-bump memory contract

### Review Findings (Advisory)

The phase's separate REVIEW.md (`41-REVIEW.md`) raised 1 critical + 6 warnings + 5 info findings. Per the user's verification request, these are advisory and do NOT block phase completion. Most-notable item:

- **CR-01 (Critical/advisory):** `hash()` non-determinism breaks reproducibility claim. Affects `drawLine` (sparkline shape) and `drawKpi` (hero number selection). Fix is mechanical (~10 lines, replace `hash()` with `hashlib.md5`). Recommend addressing in a follow-up commit before pushing to main, since the memory note `feedback_preview_png_priority.md` emphasizes preview.png quality and reproducibility.

Other REVIEW.md findings (WR-01..WR-06, IN-01..IN-05) describe hardening opportunities (template path quoting, theme.js fallback messaging, regex tightening, fallback-path waste) — all are non-blocking and should be triaged into a follow-up phase or accepted as known limitations.

---

_Verified: 2026-05-24T11:34:14Z_
_Verifier: Claude (gsd-verifier)_
