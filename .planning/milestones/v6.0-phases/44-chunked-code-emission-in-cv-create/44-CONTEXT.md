# Phase 44: Chunked Code Emission in cv-create - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure `plugins/splunk-custom-viz/skills/cv-create/` so each viz is emitted as a sequence of small, sentinel-anchored tool calls instead of one large Write. Eliminates the mid-file hangs observed on 600-800 line viz files (test48 polestar), makes per-viz progress durable across interrupted runs, and gives the user a visible progress trail.

**In scope:** cv-create SKILL.md workflow rewrite, `boilerplate_emit.js` sentinel-anchor changes, resume-detection logic, per-viz checkpoint, per-viz progress output. Applies to all three modes (full-pipeline, single-viz iteration, standalone).

**Out of scope (this phase):** cv-build validator changes, cv-sketch / cv-scope changes, dashboard-transcription fixes, Canvas render-rule changes, any of the test49 v6 handover findings (Findings 1-4) beyond what overlaps with chunked emission.

</domain>

<decisions>
## Implementation Decisions

### Emission boundary granularity (CHUNK-02)
- **D-01:** Per-viz emission sequence = four discrete tool calls: (1) `boilerplate_emit.js` scaffolds the source file; (2) `Edit` fills the `_renderDark` body between sentinels; (3) `Edit` fills the `_renderLight` body between sentinels; (4) `Write` writes `formatter.html`. `visualization.css` is a fifth trivial Write (one CSS line). Each tool call is bounded — the previous "compose 700-line source file in memory then Write once" pattern is the failure mode being replaced.
- **D-02:** `_renderDark` and `_renderLight` are anchored by sentinel comments emitted by `boilerplate_emit.js`. Exact strings: `/* CV-RENDER-DARK-BEGIN */` … `/* CV-RENDER-DARK-END */` and `/* CV-RENDER-LIGHT-BEGIN */` … `/* CV-RENDER-LIGHT-END */`. Each Edit's `old_string` is the begin/end pair with the empty body between them; `new_string` keeps the sentinels and inserts the Canvas body. Sentinels are deterministic, grep-able, and double as the resume-detection signal (D-03).

### Resume detection (CHUNK-03)
- **D-03:** Resume detection is sentinel-based content inspection. On a resumed full-pipeline run, for each viz in `DESIGN-LOCK.md.vizs[]`, cv-create checks: (a) `visualization_source.js` exists; (b) `formatter.html` exists; (c) `visualization.css` exists; (d) the source file contains `CV-RENDER-DARK-BEGIN` … `CV-RENDER-DARK-END` with non-whitespace content between them; (e) same for `CV-RENDER-LIGHT-*`. All five true → skip the viz silently. First viz failing any check is the resume point.
- **D-04:** "Filled" threshold = any non-whitespace content between the begin/end sentinels. No minimum line count, no completion marker. Cheapest grep-shaped check. The per-viz checkpoint (D-05) and cv-build's validator are the deeper safety nets if a partial Edit ever leaves a plausible-but-broken body.
- **D-05:** No external EMIT-LOG.md manifest. The files on disk are the single source of truth — a separate manifest would introduce a drift failure mode that overlaps exactly with what CHUNK-01 is fixing (partial write where bookkeeping says "done").

### Per-viz checkpoint (Success Criterion #4)
- **D-06:** After all four tool calls for a viz complete, cv-create runs the symmetric checkpoint predicate — same logic as resume detection (D-03 a–e). Implementation: `test -f` on each of the three artifact paths, plus `grep -q` for each `*-END` sentinel and a non-empty grep between them. Checkpoint and resume use the same predicate so a viz that resume considers "complete" is exactly a viz that the checkpoint would have passed.
- **D-07:** Checkpoint failure mode = stop and report; user re-runs cv-create to resume. Print: `✗ [N/M] <viz_name> — checkpoint failed: <which predicate failed>` and exit. Resume detection (D-03) picks up cleanly on the next invocation. No retries, no skip-and-continue — those add complexity without strengthening the per-viz-isolation contract.

### Scope across modes (CHUNK-02 generality)
- **D-08:** All three cv-create modes — full-pipeline, single-viz iteration, standalone — use the same per-viz sequence (D-01) and checkpoint (D-06). Iteration and standalone are inherently one-shot, so resume detection (D-03) is full-pipeline-only, but the sentinel/Edit/checkpoint mechanics are uniform. Iteration mode's natural-language deltas target the same sentinel-bounded blocks, which actually makes deltas cleaner because the Edit anchors are explicit.

### User-visible progress (Success Criterion #2)
- **D-09:** One short line per viz at each checkpoint event. Formats:
  - Pass: `✓ [N/M] <viz_name> — boilerplate + renderDark + renderLight + formatter + css`
  - Resume skip: `↻ [N/M] <viz_name> — already complete, skipping`
  - Fail: `✗ [N/M] <viz_name> — checkpoint failed: <reason>`
  Visible during long full-pipeline runs and makes the resume-skip behavior observable, which directly satisfies SC#2 ("User watching cv-create execute sees each viz emitted as one discrete write unit").

### Claude's Discretion
- Exact `boilerplate_emit.js` template edit shape — where the sentinels sit inside the existing `_renderDark` / `_renderLight` stubs and how the existing TODO comments are reconciled with them. Planner / executor decides during implementation, subject to the constraint that `boilerplate_emit.js` test coverage is preserved.
- SKILL.md prose wording for the "Emit one viz at a time" instruction in `cv-create/SKILL.md` Step 3 — content is fixed (D-01..D-09), style is open.
- Whether the per-viz progress lines (D-09) are printed by cv-create text-output or via a `console.log` in a tiny helper script. Either satisfies SC#2.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plugin source (the code that changes)
- `plugins/splunk-custom-viz/skills/cv-create/SKILL.md` — the SKILL.md to rewrite. Step 3 currently says "For each viz: emit boilerplate + write _renderDark/_renderLight + formatter.html" — that's the section that becomes the explicit per-viz checkpoint sequence per D-01, D-06, D-09.
- `plugins/splunk-custom-viz/skills/cv-create/references/standalone-mode.md` — standalone workflow; needs the same per-viz sequence per D-08.
- `plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md` — iteration workflow; sentinel anchors enable cleaner delta Edits per D-08.
- `plugins/splunk-custom-viz/scripts/boilerplate_emit.js` — emits the source file scaffold. Add `CV-RENDER-DARK-BEGIN/END` and `CV-RENDER-LIGHT-BEGIN/END` sentinels per D-02.

### Plugin canon (rules to keep intact during the rewrite)
- `plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md` — 12 production-discovered bugs. cv-create reads this in "Before you start". Any change to the SKILL.md must keep the MANDATORY read intact.
- `plugins/splunk-custom-viz/references/splunk-viz-canon.md` — 26 rules, source of truth for Canvas code. No rule changes in this phase.

### Phase requirements
- `.planning/REQUIREMENTS.md` §CHUNK-01/02/03 — the three locked requirements.
- `.planning/ROADMAP.md` §"Phase 44: Chunked Code Emission in cv-create" — 4 success criteria, including the explicit "write → verify file exists → move to next viz" pattern (SC#4) and the test48 polestar re-run target (SC#1).

### Evidence for the failure mode
- `tests/test48_v510/HANDOVER.md` — the polestar pack used as the canonical re-run target for CHUNK-01. Viz file sizes (motor telemetry 816 lines, charging timeline 720 lines, fleet health 691 lines) document why a single 800-line Write is the failure surface.
- `tests/test49_v6_in_git/HANDOVER-skill-improvements.md` — adjacent v6 findings (color pickers not read, drilldown payload shape, boilerplate data guard). NOT in scope for Phase 44 but referenced so the planner avoids accidentally landing those fixes here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `boilerplate_emit.js` (232 lines) already emits ES5 boilerplate with `_renderDark` / `_renderLight` empty stubs and TODO comments. Sentinel insertion is a local change to the template string.
- The existing 4-section emission order in SKILL.md Step 3 (boilerplate → renderDark/renderLight → formatter → CSS) already maps almost 1:1 to the new chunked sequence (D-01) — the change is making each section a deliberate, checkpoint-bounded tool call rather than implicit narrative steps.
- `scripts/validate.sh` exists and runs structural + code-rule checks across all vizs at the end of cv-build. Phase 44 does NOT add a validator invocation per viz — checkpoints stay lightweight (D-06), the existing post-build validator is the last line of defense.

### Established Patterns
- Three-mode cv-create skill structure (full-pipeline in SKILL.md, iteration + standalone in references/). The chunked-emission contract must be expressed once and referenced consistently across all three.
- Sentinel comments are not a new pattern in the plugin — `validate.sh` already greps for things like `_resolveTheme` presence, so grep-based predicates are an accepted toolkit.
- "Stop on first failure, user resumes" is the same model as cv-build's repair loop early-break — consistent with how the plugin already handles broken state.

### Integration Points
- `boilerplate_emit.js` is invoked from cv-create's SKILL.md Step 3a as a bash call. Sentinel emission is a pure template change — no API change to the script, only to the output content.
- cv-build is unaffected. It reads the same files cv-create produces; sentinel comments inside `_renderDark` / `_renderLight` bodies are inert at runtime.

</code_context>

<specifics>
## Specific Ideas

- test48 polestar pack is the named re-run target for SC#1. Whoever executes Phase 44 should expect to re-run that brief through cv-create after the changes land, confirming no hang and that resume works after a deliberate interruption.
- Visible progress prefix characters: `✓` `↻` `✗` (Unicode, three glyphs). Match the existing cv-build summary style.

</specifics>

<deferred>
## Deferred Ideas

- Per-viz validator subset on checkpoint — considered (Area 3, option D) and rejected for this phase to keep checkpoints lightweight. Could be revisited in a later phase if a class of failures slips past the sentinel check.
- External EMIT-LOG.md manifest with status display — considered (Area 2, hybrid option) and rejected to avoid drift between filesystem and manifest. If users want a richer status view in future, a read-only summary computed from sentinel state at run end is the cheaper path.
- The four cv-create runtime-correctness findings from `tests/test49_v6_in_git/HANDOVER-skill-improvements.md` (Finding 1 dashboard token defaults, Finding 2 color pickers not read, Finding 3 drilldown payload shape, Finding 6 boilerplate data guard) — adjacent to the cv-create surface this phase touches, but each is a different fix. Belongs in its own follow-up phase.
- A future phase could extend the sentinel pattern to formatter.html (`<!-- CV-FORMATTER-CONTROLS-BEGIN -->` etc.) so iteration mode can target formatter changes as cleanly as render-body changes. Not needed for Phase 44.

</deferred>

---

*Phase: 44-Chunked Code Emission in cv-create*
*Context gathered: 2026-05-25*
