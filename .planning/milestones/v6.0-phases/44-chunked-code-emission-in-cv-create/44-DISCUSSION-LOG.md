# Phase 44: Chunked Code Emission in cv-create - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 44-Chunked Code Emission in cv-create
**Areas discussed:** Emission boundary granularity, Resume detection mechanism, Per-viz checkpoint shape, Scope across the three modes

---

## Emission boundary granularity

| Option | Description | Selected |
|--------|-------------|----------|
| One Write per viz (literal CHUNK-02) | Generate the complete visualization_source.js content in memory, then one Write call. Bets that the hang was about per-viz context buildup, not raw output length. | |
| Boilerplate → Edit renderDark → Edit renderLight → Write formatter | Run boilerplate_emit.js to scaffold, then Edits to fill renderDark/renderLight, then formatter.html. Each viz = 4 discrete tool calls. | ✓ |
| Boilerplate scaffold → one Edit per render path → formatter → css | 5 tool calls per viz, each ≤ ~250 lines, explicit per-artifact. | |
| Hybrid — scaffold + single in-memory render compose, write whole source file once | Boilerplate scaffold via script, assemble full render content in memory, single Edit. Per-viz = 2 tool calls. | |

**User's choice:** Boilerplate → Edit renderDark → Edit renderLight → Write formatter
**Notes:** Captured as D-01. Picked the option that explicitly bounds each tool call rather than betting on the hang being context-related. Edit anchors needed (next sub-question).

### Sub-question: Edit anchor strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Sentinel comment anchors inside the stubs | `/* CV-RENDER-DARK-BEGIN */ ... /* CV-RENDER-DARK-END */` pair around the empty body. Grep-able, deterministic, doubles as resume-detection signal. | ✓ |
| Replace the TODO comment line | Boilerplate emits a unique TODO line; Edit replaces it. Simpler but less robust against paraphrasing. | |
| Replace the entire empty function body | Replace `function(ctx,t,w,h){\n}`. Brittle to whitespace drift. | |

**User's choice:** Sentinel comment anchors inside the stubs
**Notes:** Captured as D-02. Sentinels are reused for resume detection (Area 2) and the checkpoint predicate (Area 3) — symmetric design.

---

## Resume detection mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Sentinel-based content check per viz | Read source.js, confirm sentinels with non-trivial body between, plus formatter.html + visualization.css exist. No external manifest. | ✓ (Claude's discretion) |
| External EMIT-LOG.md manifest | Track which artifacts completed per viz in a separate manifest. Explicit but introduces drift risk. | |
| Hybrid — sentinel check + cheap manifest line | Sentinels for correctness, manifest for human-readable progress trail. | |
| Bare file-existence per artifact | If three artifact files exist, assume done. Simplest, but a half-written source.js would be falsely treated as complete — the exact failure mode CHUNK-01 fixes. | |

**User's choice:** "what is fastest and most secure, you decide?" → Sentinel-based content check
**Notes:** Captured as D-03 and D-05. Reasoning recorded in chat: fastest because no per-viz manifest write during happy path; most secure because the file IS source of truth and cannot drift from itself.

### Sub-question: "filled" threshold between sentinels

| Option | Description | Selected |
|--------|-------------|----------|
| Any non-whitespace content = filled | Cheapest grep-shaped check. cv-build validator catches non-functional code downstream. | ✓ |
| Minimum N lines (e.g. ≥ 8 lines) | Floors against truncated Edits. Most render bodies are 60-300 lines. | |
| Sentinel + completion marker | Edit stamps `/* CV-RENDER-DARK-FILLED */` near END sentinel. Most explicit, requires Edit to remember to stamp. | |

**User's choice:** Any non-whitespace content between sentinels = filled
**Notes:** Captured as D-04.

---

## Per-viz checkpoint shape

| Option | Description | Selected |
|--------|-------------|----------|
| Bash test -f on each artifact + grep sentinels closed | Symmetric with resume detection. Fast and deterministic. | ✓ |
| Read source head + tail, confirm sentinels | Catches partial-Edit corruption grep would miss. Heavier. | |
| Trust Write/Edit tool errors only | A successful Edit with empty new_string would falsely pass. Hang failure may not surface as a tool error. | |
| Run validator subset (structural checks) | Heaviest checkpoint, but turns each viz into its own pass/fail unit. | |

**User's choice:** Bash test -f on each artifact + grep sentinels closed
**Notes:** Captured as D-06. Symmetric with D-03 — checkpoint and resume use the same predicate.

### Sub-question: Behavior on checkpoint failure

| Option | Description | Selected |
|--------|-------------|----------|
| Stop and report — user re-runs cv-create to resume | Resume detection picks up cleanly. Aligns with CHUNK-03. | ✓ |
| Retry the failed artifact once, then stop | Keeps recoverable hiccups from forcing a re-run. | |
| Skip the broken viz, continue, summarize at end | Lets corruption accumulate silently. Contradicts per-viz isolation. | |

**User's choice:** Stop and report — user re-runs cv-create to resume
**Notes:** Captured as D-07.

---

## Scope across the three modes

| Option | Description | Selected |
|--------|-------------|----------|
| All three modes use the same per-viz sequence + sentinels + checkpoint | Resume detection is full-pipeline-only (the only mode with a loop). Same code path everywhere. | ✓ |
| Full-pipeline only — iteration + standalone keep current pattern | Keeps two code paths. Standalone still emits the same 700-line file with hang risk. | |
| Full-pipeline + standalone, skip iteration | Iteration deltas are smaller already; apply only to fresh-write modes. | |

**User's choice:** All three modes use the same per-viz sequence + sentinels + checkpoint
**Notes:** Captured as D-08. Iteration's natural-language deltas benefit from explicit sentinel anchors.

### Sub-question: User-visible progress output

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — one short line per viz at checkpoint | `✓ [N/M] <name> — artifacts` on pass, `↻` on resume-skip, `✗` on fail. Visible during long runs. | ✓ |
| Minimal — only on resume + on errors | Silent on happy path. | |
| No status output — just write files | Trust cv-build's summary. | |

**User's choice:** One short line per viz at checkpoint
**Notes:** Captured as D-09. Directly satisfies Success Criterion #2.

---

## Claude's Discretion

- Resume detection mechanism selection (user said "what is fastest and most secure, you decide?") — picked sentinel-based content check (D-03/D-05) with reasoning recorded inline.
- Exact `boilerplate_emit.js` template edit shape for sentinel placement — left to planner/executor.
- SKILL.md prose wording for the "Emit one viz at a time" instruction — content fixed, style open.

## Deferred Ideas

- Per-viz validator subset on checkpoint — rejected to keep checkpoints lightweight. Could revisit if a class of failures slips past sentinel check.
- External EMIT-LOG.md manifest with status display — rejected to avoid drift; if richer status wanted later, compute read-only summary from sentinel state at run end.
- The four cv-create runtime-correctness findings from `tests/test49_v6_in_git/HANDOVER-skill-improvements.md` (Findings 1/2/3/6) — adjacent surface but distinct fixes; follow-up phase.
- Extend sentinel pattern to formatter.html (`<!-- CV-FORMATTER-CONTROLS-BEGIN -->` etc.) — possible future phase to make iteration-mode formatter deltas as clean as render-body deltas.
