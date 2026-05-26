---
phase: 44-chunked-code-emission-in-cv-create
plan: 02
subsystem: splunk-custom-viz
tags: [splunk-custom-viz, cv-create, chunked-emission, resume, checkpoint, skill-md]
dependency_graph:
  requires:
    - "44-01 (boilerplate_emit.js sentinel emission)"
  provides:
    - "cv-create per-viz chunked emission contract expressed once in SKILL.md and consistently delegated to in standalone-mode.md + iteration-mode.md"
    - "Resume + checkpoint + ✓/↻/✗ progress contract for cv-create full-pipeline runs"
  affects:
    - "plugins/splunk-custom-viz/skills/cv-create/SKILL.md"
    - "plugins/splunk-custom-viz/skills/cv-create/references/standalone-mode.md"
    - "plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md"
tech_stack:
  added: []
  patterns:
    - "Sentinel-anchored Edit as the per-viz delta primitive (replaces overwrite-from-scratch)"
    - "Symmetric resume + checkpoint 5-predicate composition (file existence + sentinel-pair grep + non-whitespace body)"
    - "Three-glyph (✓ ↻ ✗) per-checkpoint-event progress trail"
key_files:
  created:
    - .planning/phases/44-chunked-code-emission-in-cv-create/44-02-SUMMARY.md
  modified:
    - plugins/splunk-custom-viz/skills/cv-create/SKILL.md
    - plugins/splunk-custom-viz/skills/cv-create/references/standalone-mode.md
    - plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md
decisions:
  - "Path-traversal guard expressed inline in SKILL.md via the existing plugin regex ^[a-zA-Z0-9_-]+$ — same regex enforced by boilerplate_emit.js line 32 so emitter and resume/checkpoint observers share one validation surface (T-44-02-02 mitigation)"
  - "Sentinel-anchored Edit promoted to default re-emit shape in iteration-mode.md; full boilerplate re-emit demoted to the exception case (visual_spec structure changed) — protects user's prior render work across iterations"
  - "Standalone + iteration print [1/1] (one-shot) while full-pipeline prints [N/M] (multi-viz). D-08 mode-generality contract: same mechanics, different progress index"
metrics:
  duration: "~10 minutes"
  completed: 2026-05-26
requirements: [CHUNK-01, CHUNK-02, CHUNK-03]
---

# Phase 44 Plan 02: cv-create Chunked-Emission Workflow Rewrite Summary

Rewrote `cv-create/SKILL.md` Step 3 and the two reference files (`standalone-mode.md`, `iteration-mode.md`) so each viz is emitted as a discrete four-tool-call sequence (boilerplate Bash + Edit `_renderDark` + Edit `_renderLight` + Write `formatter.html`) plus a trivial CSS Write, bounded by a per-viz checkpoint and one-line progress glyph. Closes CHUNK-01 / CHUNK-02 / CHUNK-03.

## D-01..D-09 mapping (chunked per-viz contract expressed in all three files)

| Decision | Where it lives in SKILL.md | Reference-file echo |
|---|---|---|
| D-01 (four-tool-call sequence) | Step 3 intro + sections 3.1–3.5 | standalone Step 4 (1–6); iteration Step 7 (Edit default + Write formatter) |
| D-02 (sentinel anchors) | 3.2 / 3.3 `old_string` / `new_string` blocks | both reference files cite the four CV-RENDER-* strings |
| D-03 (resume detection a–e) | 3.0 Resume detection | scoped out in both reference files ("does NOT apply") |
| D-04 (filled threshold = any non-whitespace) | 3.0 narrative + `awk … sed '1d;$d' | grep -q '[^[:space:]]'` |
| D-05 (no EMIT-LOG.md, on-disk = source of truth) | 3.0 narrative |
| D-06 (symmetric checkpoint) | 3.6 cross-refs to 3.0 predicate | both reference files cite 3.6 for predicate |
| D-07 (fail-stop, no retry) | 3.6 prose + failure-reason table |
| D-08 (mode generality) | 3.0 "full-pipeline only" call-out | standalone + iteration explicitly inherit 3.1–3.6, opt out of 3.0 |
| D-09 (✓ ↻ ✗ glyph trio) | 3.7 verbatim code-fenced format strings | both reference files print the ✓/✗ [1/1] form |

## File line counts

| File | Before | After | Budget |
|---|---|---|---|
| `plugins/splunk-custom-viz/skills/cv-create/SKILL.md` | 195 | **322** | < 500 (CLAUDE.md skill rule) — target ≤ 350 ✓ |
| `plugins/splunk-custom-viz/skills/cv-create/references/standalone-mode.md` | 207 | 239 | no hard cap |
| `plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md` | 146 | 186 | no hard cap |

SKILL.md sits 178 lines under the 500-line cap with the full chunked contract expressed inline (no new MUST-LOAD reference needed; D-09's "either satisfies SC#2" branch).

## New Step 3 workflow ASCII block (excerpt from SKILL.md)

```
Step 1: Load DESIGN-LOCK.md
Step 2: Generate shared/theme.js (mechanical transcription)
Step 3: Emit one viz at a time — for each viz: boilerplate (bash) → Edit _renderDark body → Edit _renderLight body → Write formatter.html → Write visualization.css → per-viz checkpoint → log progress
Step 4: If format=extension or both: also emit config.json + ESM visualization.js (same chunked sequence)
Step 5: Copy demo CSVs from .cv/<app_id>/lookups/ into <app_id>/lookups/
Step 6: Hand off to cv-build
```

The verbatim "Emit one viz at a time" phrase satisfies SC#4.

## D-09 glyph format strings (verbatim in SKILL.md §3.7)

```
✓ [N/M] <viz_name> — boilerplate + renderDark + renderLight + formatter + css
↻ [N/M] <viz_name> — already complete, skipping
✗ [N/M] <viz_name> — checkpoint failed: <reason>
```

Em-dash `—`, not hyphen; `[N/M]` in SKILL.md, `[1/1]` in standalone-mode.md and iteration-mode.md (D-08 one-shot context).

## Resume detection is full-pipeline-only — explicit in reference files

`standalone-mode.md` Step 4 (added):

> **Resume detection does NOT apply in standalone** — it is one-shot mode with exactly one viz, and the mini-lock is held in memory rather than on disk, so the resume predicate has nothing to read. The four-tool-call sequence always runs.

`iteration-mode.md` Step 7 (added):

> **Resume detection does NOT apply in iteration mode** — it is one-shot (exactly one viz, the one the user named). The Edit and checkpoint mechanics from cv-create/SKILL.md Step 3.2 / 3.3 / 3.6 still apply.

## MANDATORY reading prelude — preserved verbatim

`cv-create/SKILL.md` lines 10-17 are unchanged. References to `../../KNOWN-CORRECTIONS.md` (line 14) and `../../references/splunk-viz-canon.md` (line 15) are grep-findable.

```
$ grep -nF 'Before you start — MANDATORY reading' plugins/splunk-custom-viz/skills/cv-create/SKILL.md
10:## Before you start — MANDATORY reading
$ grep -nF 'KNOWN-CORRECTIONS.md' plugins/splunk-custom-viz/skills/cv-create/SKILL.md | head -1
14:1. **`../../KNOWN-CORRECTIONS.md`** (12 corrections, plugin root) — production-discovered bugs that override anything in reference docs. Every correction lists the symptom, the fix, and the validator check (when applicable).
$ grep -nF 'splunk-viz-canon.md' plugins/splunk-custom-viz/skills/cv-create/SKILL.md | head -1
15:2. **`../../references/splunk-viz-canon.md`** (1047 lines, 26 rules, plugin root) — the canonical Splunk Canvas 2D viz knowledge base. Independently battle-tested. KNOWN-CORRECTIONS references these rules by number (e.g. "Correction #7 enforces Rule 19").
```

Sections preserved verbatim alongside the prelude: front-matter, Prerequisite, Three modes table, Steps 1 / 2 / 4 / 5 / 6, "What cv-create does NOT do", References.

## Verification

Task 1 verification (cv-create/SKILL.md):

```
LINES_OK (322)
OK : Emit one viz at a time
OK : CV-RENDER-DARK-BEGIN
OK : CV-RENDER-DARK-END
OK : CV-RENDER-LIGHT-BEGIN
OK : CV-RENDER-LIGHT-END
OK : ✓ [N/M] <viz_name> — boilerplate + renderDark + renderLight + formatter + css
OK : ↻ [N/M] <viz_name> — already complete, skipping
OK : ✗ [N/M] <viz_name> — checkpoint failed
OK : KNOWN-CORRECTIONS.md
OK : splunk-viz-canon.md
OK : Before you start — MANDATORY reading
```

The plan's `<verify>` shell command also includes a BRE-escape `\^\[a-zA-Z0-9_-\]\+\$` probe for the path-traversal regex. On macOS this resolves to `ugrep`/BSD `grep`, where `\+` is a literal `+` rather than the GNU repetition extension — the probe returns no-match in that environment even though the literal regex string `^[a-zA-Z0-9_-]+$` is present in SKILL.md twice (Step 3.0 path-traversal guard paragraph; Step 3.6 checkpoint paragraph). Verified with `grep -F '^[a-zA-Z0-9_-]+$' SKILL.md` returning a match in both locations. The acceptance criterion ("regex appears in resume detection and/or checkpoint sub-sections") is met; the plan's shell-side regex probe is a portability footnote, not a content gap.

Task 2 verification (`standalone-mode.md` + `iteration-mode.md`):

```
$ <plan automated command>
ALL_PASS
```

Spot checks pass for: fail-glyph `✗ [1/1] <viz_name> — checkpoint failed` in both files, "resume detection does NOT apply" callouts in both files, `Edit` reference adjacent to `CV-RENDER-DARK-BEGIN` in iteration-mode.md, existing structural anchors preserved (standalone Step 1 "Inline mini-Stage-A", standalone "Classic format ONLY in standalone", standalone "Inline mockup discipline", iteration Step 4 state-back, iteration `PRESERVE:` list, iteration `--no-confirm`, iteration multi-delta, iteration "When to recommend a full re-sketch").

## Sentinel-anchored Edit example (verbatim from SKILL.md §3.2)

```
old_string:
    /* CV-RENDER-DARK-BEGIN */
    // TODO: implement per visual_reference_html [data-theme="dark"]
    /* CV-RENDER-DARK-END */

new_string:
    /* CV-RENDER-DARK-BEGIN */
    <Canvas calls translated from visual_reference_html [data-theme="dark"] CSS>
    /* CV-RENDER-DARK-END */
```

Plan 01 emitted exactly that `old_string` shape in `boilerplate_emit.js`, so the Edit anchor is byte-identical at hand-off (44-01-SUMMARY confirmed).

## Deviations from Plan

None — plan executed as written. The path-traversal regex guard, the failure-reason mapping table, and the inline predicate code-fence in §3.0 / §3.6 follow the plan's `<action>` literally. Both reference files keep all pre-existing structural anchors per the acceptance criteria.

## Threat-model coverage delivered

- **T-44-02-01** (sentinel injection): SKILL.md §3.0 explicitly scopes the resume/checkpoint predicate to the canonical `<src>` path; §3.2 / §3.3 Edits scope `old_string` to the literal sentinel-pair + empty TODO body. Cross-viz contamination is structurally impossible.
- **T-44-02-02** (path traversal via viz_name): `^[a-zA-Z0-9_-]+$` guard cited in §3.0 and §3.6 references `boilerplate_emit.js` line 32 as the shared validation surface — emitter and observers agree on the path space.
- **T-44-02-03** (partial-write race): D-04 symmetric "BOTH sentinels AND non-whitespace between" predicate catches partial Edits.
- **T-44-02-04** (DoS via infinite-retry checkpoint): §3.6 prose explicitly forbids retry and skip-and-continue; user re-runs cv-create to resume.

## Self-Check: PASSED

Files modified (verified on disk):

- `plugins/splunk-custom-viz/skills/cv-create/SKILL.md` — FOUND (322 lines)
- `plugins/splunk-custom-viz/skills/cv-create/references/standalone-mode.md` — FOUND (239 lines)
- `plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md` — FOUND (186 lines)

Commits (verified via `git log --oneline`):

- `f432d149` — `feat(splunk-custom-viz): chunked per-viz emission in cv-create/SKILL.md (44-02)` — FOUND
- `20298354` — `feat(splunk-custom-viz): align standalone+iteration with chunked per-viz contract (44-02)` — FOUND

## Next manual step (SC#1 verification)

Phase 44 ships when the test48 polestar brief is re-run through cv-create with these three files in place and Plan 01's sentinels live. The expected observable change is: no mid-file hang on any of motor telemetry (816 lines), charging timeline (720 lines), fleet health (691 lines), plus a deliberate Ctrl-C mid-run followed by a fresh `cv-create` invocation should produce a `↻ [N/M]` resume-skip line for every viz that finished cleanly on the first attempt and pick up the four-tool-call sequence at the first incomplete viz. This is the manual smoke test recorded in `44-CONTEXT.md` `<specifics>`.
