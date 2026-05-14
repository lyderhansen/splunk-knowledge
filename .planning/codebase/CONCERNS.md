# Codebase Concerns

**Analysis Date:** 2026-05-14

---

## Tech Debt

**Duplicate build scripts between vp-create and vp-viz:**
- Issue: `build_flat.js` and `validate_viz.sh` are manually copied between two skill directories. The canonical version is in `vp-viz/scripts/` with a comment instructing manual copy to `vp-create/scripts/`. The `build_flat.js` copies have already drifted (one line differs).
- Files: `plugins/splunk-viz-packs/skills/vp-create/scripts/build_flat.js`, `plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js`, `plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh`, `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh`
- Impact: Script drift causes silent inconsistency between the two skills. If someone edits one copy and forgets to update the other, the behaviors diverge without any error.
- Fix approach: Extract scripts to a shared `plugins/splunk-viz-packs/shared/scripts/` directory and reference via symlinks or a single canonical path in both SKILL.md files. Alternatively, delete vp-create scripts and have `vp-create` SKILL.md point to `vp-viz` scripts.

**Missing `extract-viz-schemas.py` script (referenced but not committed):**
- Issue: `plugins/splunk-dashboard-studio/skills/_schemas/README.md` references `.planning/scripts/extract-viz-schemas.py` as the tool for regenerating `_schemas/` when bumping `@splunk/visualization-schemas`. The file does not exist in the repo.
- Files: `plugins/splunk-dashboard-studio/skills/_schemas/README.md` (line 40 — `TODO: factor out from the inline Python used during v2.7.4 work`)
- Impact: Refreshing the authoritative viz option schemas requires recreating a Python script from memory. Any version bump of the npm package will be painful and error-prone.
- Fix approach: Recover or recreate the extractor script and commit it to `.planning/scripts/extract-viz-schemas.py`.

**Version mismatch between `pyproject.toml` and `plugin.json`:**
- Issue: `pyproject.toml` declares version `2.0.0` but `plugin.json` declares `3.3.1`. These are different versioning tracks (Python package vs plugin manifest) but the gap is confusing and the Python package version appears stale.
- Files: `plugins/splunk-dashboard-studio/pyproject.toml`, `plugins/splunk-dashboard-studio/.claude-plugin/plugin.json`
- Impact: Tooling that reads `pyproject.toml` will report the package as v2.0.0 while users installing via the plugin system see v3.3.1. Confusing for maintenance.
- Fix approach: Decide on a single version source-of-truth. Either keep `pyproject.toml` in sync with `plugin.json`, or document explicitly that they track independently.

**`ds-spl` skill is a deprecated stub with no content:**
- Issue: `plugins/splunk-dashboard-studio/skills/ds-spl/SKILL.md` is 28 lines — a deprecation notice redirecting to `splunk-spl`. It remains in the skill directory and is listed alongside functional skills.
- Files: `plugins/splunk-dashboard-studio/skills/ds-spl/SKILL.md`
- Impact: Any agent loading `ds-spl` expecting SPL rules gets only a redirect and 10 quick tips, not the full gotchas. The skill directory could mislead orchestrators about what skills are available.
- Fix approach: Remove the `ds-spl` directory entirely, or rename it to `_ds-spl-deprecated/` so it is not auto-discovered. Update any skills that reference it.

**`splunk-spl` reference has 79 commands missing gotchas:**
- Issue: `ENRICHMENT-TODO.md` tracks 149 SPL command reference files. 62 are missing gotchas sections; 19 are missing examples. 20 commands are flagged CRITICAL (< 20 lines of content).
- Files: `plugins/splunk-spl/ENRICHMENT-TODO.md`, `plugins/splunk-spl/reference/*.md`
- Impact: Commands like `ctable`, `msearch`, `datamodelsimple`, `typelearner` have almost no content. Agents asked about these commands will generate incorrect SPL.
- Fix approach: Work through ENRICHMENT-TODO.md top-to-bottom. CRITICAL priority commands (rows 1-20) need immediate attention — they have fewer than 20 lines.

---

## Known Bugs

**`wireframe.html` path in `design.py` is wrong:**
- Symptoms: Starting the `ds-design` wireframe editor with `python -m splunk_dashboards.design launch <project>` fails with HTTP 500 ("wireframe.html not found") because the resolved path is `skills/pipeline/ds-design/wireframe.html` but the actual file lives at `skills/ds-design/wireframe.html`.
- Files: `plugins/splunk-dashboard-studio/src/splunk_dashboards/design.py` (line 59-64)
- Trigger: Running `python -m splunk_dashboards.design launch <project>` and opening the URL.
- Workaround: None — GET `/` always returns 500 until the path is corrected.
- Fix: In `design.py`, change `/ "pipeline"` to remove that path component so the resolved path becomes `<root>/skills/ds-design/wireframe.html`.

**`rangeValue` null-in-ranges DOS crashes singlevalue renderer:**
- Symptoms: Renderer crashes with `.split is not a function` when `rangeValue(ranges=[null, A, B])` is used in a majorColor DOS expression.
- Files: `plugins/splunk-dashboard-studio/skills/ds-viz-singlevalue/GOTCHAS.md` (line 32), `plugins/splunk-dashboard-studio/src/splunk_dashboards/validate.py` (check `check_rangevalue_dos_signatures`)
- Trigger: Generating DOS that puts `null` inside a ranges array instead of using the context-variable form.
- Workaround: The validator (`validate.py`) flags this pattern if run. The viz-skill GOTCHAS.md documents it.

**RAG threshold offset in singlevalue color:**
- Symptoms: The "looks like RAG" color pattern misfires — value 65 hits red when it should hit amber, value 70 hits amber instead of red. The thresholds are off by one range boundary.
- Files: `plugins/splunk-dashboard-studio/skills/ds-viz-singlevalue/GOTCHAS.md` (line 32 — marked `// BUG`)
- Trigger: Using rangeValue with RAG (red-amber-green) thresholds where boundary values are ambiguous.
- Workaround: Document in GOTCHAS.md (already present). Use strict range boundaries.

---

## Security Considerations

**`doc_authentication.txt`, `_doc_authorize.txt`, `_doc_web.txt` at root:**
- Risk: These three files live at the repo root outside any plugin structure. Their naming with underscore-doc prefix and their content (authentication, web, authorization) may contain credentials, session tokens, or sensitive configuration examples if not carefully curated.
- Files: `_doc_authentication.txt`, `_doc_authorize.txt`, `_doc_web.txt`
- Current mitigation: They are not listed in `.gitignore` and appear to be committed to the repo.
- Recommendations: Review contents for any credentials or sensitive values. Add to `.gitignore` if they are local working copies of Splunk documentation. Confirm they contain no auth tokens or passwords.

**HTTP server in `design.py` binds only to `127.0.0.1` (acceptable) but has no auth:**
- Risk: The `ds-design` wireframe server (launched via `python -m splunk_dashboards.design launch`) is a single-threaded HTTP server with no authentication. Any local process or browser tab can POST to `/save` and overwrite the layout file for any project.
- Files: `plugins/splunk-dashboard-studio/src/splunk_dashboards/design.py`
- Current mitigation: Binds to `127.0.0.1` only. Intent is local developer tooling, not production.
- Recommendations: This is acceptable for local dev tooling. Document clearly that it is not for network-exposed environments.

---

## Performance Bottlenecks

**Oversized reference files that will exceed context windows when loaded eagerly:**
- Problem: Several reference files are well over 500 lines, which means loading them into an agent context window can crowd out working memory.
  - `plugins/splunk-viz-packs/skills/vp-recipes/references/all-patterns.md`: 911 lines
  - `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md`: 751 lines
  - `plugins/splunk-dashboard-studio/skills/ds-svg/ICON-PATTERNS.md`: 798 lines
  - `plugins/splunk-admin/reference/conf/server.md`: 1,324 lines
  - `plugins/splunk-admin/reference/conf/limits.md`: 1,177 lines
  - `plugins/splunk-admin/reference/rest/search-saved-searches.md`: 1,107 lines
- Files: Listed above.
- Cause: Reference files were built as comprehensive flat tables rather than indexed + lazy-loaded chunks.
- Improvement path: Split oversized reference files into sub-sections (e.g., `server-networking.md`, `server-clustering.md`). Provide an index file that directs lazy loading to the relevant sub-file.

**Three large SKILL.md files exceed the 500-line target:**
- Problem: The project convention (confirmed by v4.0.0 restructure memory note) is all skills under 500 lines. Three skills exceed this:
  - `ds-ref-color/SKILL.md`: 591 lines
  - `ds-ref-layout-grid/SKILL.md`: 567 lines
  - `ds-couture/SKILL.md`: 537 lines
  - `vp-viz/SKILL.md`: 437 lines (close but under)
  - `spl-gotchas/SKILL.md`: 529 lines
- Files: Listed above.
- Cause: Content was added incrementally without splitting into sub-reference files.
- Improvement path: Extract body sections into companion reference files (e.g., `ds-ref-color/COLOR-TABLES.md`) and replace with a summary + `MUST-LOAD` pointer in the SKILL.md.

---

## Fragile Areas

**`ds-ref-anti-patterns`, `ds-ref-archetypes`, `ds-ref-color`, `ds-ref-layout-grid`, `ds-ref-personas`, `ds-ref-references`, `ds-ref-themes`, `ds-ref-typography`, `ds-ref-visual-encoding` are all marked "skeleton only":**
- Files: `plugins/splunk-dashboard-studio/skills/ds-ref-anti-patterns/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-color/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-personas/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-references/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-themes/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-typography/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-ref-visual-encoding/SKILL.md`
- Why fragile: Each has a `> **Status:** skeleton only` banner indicating the content was not yet fully authored when created. While these files do have lines of content (ranging 195–591), the skeleton status means important sections may be missing or incomplete. Agents relying on these for design guidance may receive partial information.
- Safe modification: Verify which sections are present vs placeholder before extending. Remove the "skeleton only" banner only after a full review confirms all documented sections are populated.
- Test coverage: No automated tests cover skill content completeness.

**Nine viz skills lack `OPTIONS.md` (option reference files):**
- Files:
  - `plugins/splunk-dashboard-studio/skills/ds-viz-choropleth-svg/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-events/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-fillergauge/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-icon-library/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-image/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-infographic-shapes/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-markdown/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-parallelcoordinates/`
  - `plugins/splunk-dashboard-studio/skills/ds-viz-sankey/`
- Why fragile: Authoritative schema files exist in `_schemas/` for most of these, but no OPTIONS.md bridges them to practical skill guidance. Agents generating JSON for these viz types must rely solely on the SKILL.md, which may not enumerate all valid option keys.
- Safe modification: Create OPTIONS.md for each by referencing the corresponding `_schemas/<type>.md` and adding gotchas/examples on top.

**Thirteen viz skills lack `GOTCHAS.md`:**
- Files: `ds-viz-bubble`, `ds-viz-choropleth-svg`, `ds-viz-events`, `ds-viz-fillergauge`, `ds-viz-icon-library`, `ds-viz-infographic-shapes`, `ds-viz-markdown`, `ds-viz-markergauge`, `ds-viz-parallelcoordinates`, `ds-viz-sankey`, `ds-viz-scatter`, `ds-viz-singlevalueicon`, `ds-viz-singlevalueradial` under `plugins/splunk-dashboard-studio/skills/`
- Why fragile: Gotchas files encode field-tested failure patterns. Without them, agents generating dashboards with these viz types reproduce the same renderer crashes and schema errors discovered during testing.
- Safe modification: Create GOTCHAS.md files by reviewing test outputs for these viz types. Prioritize `singlevalueicon` and `singlevalueradial` since the parent `singlevalue` GOTCHAS.md includes a confirmed RAG boundary bug and similar issues likely affect the icon/radial variants.

**Three viz types have schemas in `_schemas/` but no skill directory:**
- Files: `plugins/splunk-dashboard-studio/skills/_schemas/networkGraph.md`, `plugins/splunk-dashboard-studio/skills/_schemas/processTree.md`, `plugins/splunk-dashboard-studio/skills/_schemas/pureRichText.md`
- Why fragile: The schema extractor captured these viz types from the npm package, meaning Splunk supports them. But there is no `ds-viz-networkgraph/`, `ds-viz-processtree/`, or `ds-viz-richtext/` skill. Agents asked to use these viz types have no guidance and may generate invalid JSON.
- Safe modification: Either create minimal skill stubs for these three types, or add an explicit note in `ds-pick-viz/SKILL.md` that these types are unsupported by this plugin.

**`QA-PLAN.md` is in Norwegian:**
- Files: `plugins/splunk-dashboard-studio/skills/QA-PLAN.md`
- Why fragile: The project CLAUDE.md mandate requires all plugin artifacts to be in English. QA-PLAN.md is committed to the plugin and is written entirely in Norwegian. Agents loading this file will receive Norwegian-language instructions.
- Safe modification: Translate QA-PLAN.md to English. This is a committed plugin file, not a planning/brainstorm artifact.

---

## Scaling Limits

**`splunk-admin` and `splunk-spl` plugins cover Splunk Enterprise 10.2 only:**
- Current capacity: All conf file, REST API, and CLI reference is sourced from Splunk Enterprise Admin Manual 10.2 and SPL Search Manual 10.2.
- Limit: Splunk Cloud is at 10.4.2604 (the `docs/SplunkCloud-10.4.2604-DashStudio.pdf` exists). Any 10.3+ features (new conf keys, new SPL commands, changed REST endpoints) are not covered.
- Scaling path: Diff the 10.2 references against 10.4 documentation to identify new/changed items. The `docs/SplunkCloud-10.4.2604-DashStudio.pdf` is already in the repo for dashboard-studio; a similar approach is needed for admin and SPL.

---

## Dependencies at Risk

**`@splunk/visualization-schemas@28.6.0` is pinned but has no automated refresh:**
- Risk: The authoritative `_schemas/` files were extracted from npm version 28.6.0. Splunk ships new Dashboard Studio releases with updated schema packages. If the `_schemas/` files fall behind, the OPTIONS.md guidance will contain stale or incorrect option keys.
- Impact: Agents generate JSON with wrong option names, causing silent schema errors in the renderer.
- Migration plan: Once the `extract-viz-schemas.py` script is recovered and committed (see Tech Debt above), add a documented refresh procedure triggered when bumping the Splunk Cloud target version.

---

## Missing Critical Features

**No automated skill content validation:**
- Problem: There is no CI or script that checks whether skills marked "skeleton only" still carry that status, whether GOTCHAS.md/OPTIONS.md files are present for all viz skills, or whether SKILL.md files exceed the 500-line limit. The v4.0.0 restructure added size enforcement as a project goal, but it is enforced only by convention, not tooling.
- Blocks: Regressions in skill completeness go undetected until a test dashboard fails.

**No test coverage for `design.py` server routes or the wireframe HTML path:**
- Problem: The wireframe `design.py` HTTP server is exercised by `test_design.py` but the `WIREFRAME_HTML` path resolution is not tested. The wrong path produces a runtime 500, not a startup error.
- Files: `plugins/splunk-dashboard-studio/tests/test_design.py`, `plugins/splunk-dashboard-studio/src/splunk_dashboards/design.py`

---

## Test Coverage Gaps

**`validate.py` has no test for `rangeValue` without `values=` clause:**
- What's not tested: The `check_rangevalue_dos_signatures` function documents that inline `rangeValue(ranges=[...])` without a matching `values=[...]` is broken. No test in `test_validate.py` exercises this case.
- Files: `plugins/splunk-dashboard-studio/src/splunk_dashboards/validate.py`, `plugins/splunk-dashboard-studio/tests/test_validate.py`
- Risk: The check can be silently broken by refactor without failing tests.
- Priority: Medium

**No tests for the `ds-design` CLI `launch` command path:**
- What's not tested: The `_cli` function in `design.py` that starts the HTTP server (`serve_forever`) is not tested — only the handlers are unit-tested via `test_design.py`.
- Files: `plugins/splunk-dashboard-studio/src/splunk_dashboards/design.py`, `plugins/splunk-dashboard-studio/tests/test_design.py`
- Risk: The wireframe path bug above would be caught if the server startup path were exercised in tests.
- Priority: Low (developer tooling, not production path)

**SPL enrichment is entirely untested:**
- What's not tested: All 149 command reference files in `plugins/splunk-spl/reference/` are markdown documents. There are no tests that verify their structure, check for required sections (Syntax, Examples, Gotchas), or flag files below a minimum size threshold.
- Files: `plugins/splunk-spl/reference/`, `plugins/splunk-spl/ENRICHMENT-TODO.md`
- Risk: Stub commands (< 20 lines) are used by agents without any quality gate.
- Priority: High

---

*Concerns audit: 2026-05-14*
