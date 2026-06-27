# Phase 53: Formatter Section-Label Consistency (Dashboard Studio) — Context

**Gathered:** 2026-06-24
**Status:** Ready for planning
**Source:** Live Dashboard Studio formatter-label debugging (2026-06-23 audit) — NOT test51/test52. Pure skill-doc consistency fix.

<domain>
## Phase Boundary

Dashboard Studio merges a Classic custom viz's `formatter.html` `<form class="splunk-formatter-section">` sections into its OWN config panel, keyed by `section-label`. It only renders sections whose label is EXACTLY one of three standard groups (case- and plural-sensitive):
- `Data configurations`
- `Data display`
- `Color and style`

Any other label (e.g. "Effects", "Columns", "Coloring", "Pagination") is dropped from the DS panel or shown as a duplicate viz-name-prefixed group, so those controls look "missing in the UI" in Studio. Classic Simple XML renders ANY label as tabs — which is the misleading part: the same formatter looks complete in SXML and broken in DS.

cv-create already documents this authoritatively (`cv-create/references/formatter-emission.md`). But **vp-viz contradicts it** by instructing a 4th "Effects" Classic section, and the rule is invisible when DEBUGGING because it only lives in cv-create's emission reference.

**In scope:**
- Fix the vp-viz Classic-formatter contradiction (SKILL.md + formatter-patterns.md + pre-code-checklist.md)
- Add a symptom-first debugging rule to cv-build/references/diagnostic-rules.md
- State applicability to ANY Classic custom viz (incl. hand-authored)
- Investigate (not blindly change) the Extension API editorConfig "Effects" label
- Verify/strengthen two companion gotchas (namespace 3-way probe, preview.png auto-discovery)
- Version bumps: splunk-viz-packs 5.10.1 → 5.10.2, splunk-custom-viz 6.0.10 → 6.0.11

**Out of scope:**
- Any code changes (no .js, no validate.sh) — pure markdown-reference work
- Any other vp-* changes beyond the formatter contradiction (vp-viz is otherwise frozen legacy)
- Changing cv-create/formatter-emission.md (it's already correct — the authoritative source)
- A new validate.sh check for non-standard section-labels (tempting but: validate.sh is cv-only, vp-viz uses validate_viz.sh; cross-plugin validator work is a separate future item)

## CRITICAL DISTINCTION — two formatter mechanisms

There are TWO different formatter systems; the fix differs per path:

1. **Classic `formatter.html`** — `<form class="splunk-formatter-section" section-label="Effects">`. THIS is the bug. DS merges by section-label and drops non-standard labels. The symptom the user hit (SplunkVisualizationBase / AMD `define()`).
2. **Extension API `config.json`** — `editorConfig` array with `{ "label": "Effects", "layout": [...] }`. This is a SEPARATE rendering path (the viz's own extension renders editorConfig directly). Whether the 3-label constraint ALSO applies here is UNCONFIRMED. Do NOT blindly rename the editorConfig "Effects" — investigate first (FMT-05).

</domain>

<decisions>
## Implementation Decisions

### File-to-requirement mapping (LOCKED)

| Req | Lands in | What |
|---|---|---|
| FMT-01 | `vp-viz/SKILL.md` (Formatter structure block, ~L173-180) + `vp-viz/references/formatter-patterns.md` (L177-215, esp. 182/197/214-215) | Remove the Classic "Effects" 4th section; fold its toggles (showAmbientLight, showVignette, showGlow, accentColor picker) into "Color and style". Only the 3 standard labels remain. |
| FMT-02 | `vp-viz/references/pre-code-checklist.md` (L12) | Replace "minimum 3 section-label sections (4 sections when Animation section present)" with an EXACT-3-label enforcement check that names the only legal labels and forbids any other Classic section-label. |
| FMT-03 | `cv-build/references/diagnostic-rules.md` (near B5 at ~L120) | Add a SYMPTOM-FIRST rule: "Formatter controls missing in Dashboard Studio config panel" → non-standard `<form>` section-label → fix: use exactly the 3 labels. B5 today is FAIL-code-first ("missing class attr → duplicate groups"); the new rule is keyed on the user-visible symptom and lists the 3 labels. |
| FMT-04 | both vp-viz (FMT-01 spot) + cv-build diagnostic rule (FMT-03 spot) | One explicit sentence in each: this applies to ANY Classic custom viz embedded in DS, including hand-authored vizs not produced by cv-create. |
| FMT-05 | `vp-viz/references/config-json-template.md` (editorConfig "Effects" at ~L116) | Investigation + documentation. The planner/executor cannot test a live Splunk Extension API viz. So: add a documented NOTE next to the editorConfig "Effects" label flagging the open question (does DS constrain Extension API editorConfig labels to the same 3?) with a TODO to verify on a live viz. Do NOT rename it — if it's actually fine, renaming breaks a working path. Record the uncertainty honestly. |
| FMT-06 | namespace: `cv-build/references/dashboard-transcription.md` + `diagnostic-rules.md` B3 + `splunk-viz-canon.md`; preview: `cv-build/references/generate-assets.md` | (a) Document the namespace probe as 3-way (getPropertyNamespaceInfo ns+key → short `<app>.<viz>.<key>` → bare key) and state the SXML long-key form `display.visualizations.custom.<app>.<viz>.<key>` alongside the short-key dashboard form. (b) Add preview.png auto-discovery semantics: ships at `appserver/static/visualizations/<viz>/preview.png`, Splunk auto-discovers it (no `visualizations.conf` reference needed), picker tile is blank if missing. |

### The exact-3-label rule wording (canonical, reuse verbatim across files)

> Dashboard Studio merges a Classic custom viz's `<form class="splunk-formatter-section">` sections into its own config panel keyed by `section-label`, and renders ONLY these three labels (case- and plural-sensitive):
> `Data configurations` · `Data display` · `Color and style`
> Any other label is dropped or shown as a duplicate viz-name-prefixed group, so the controls look "missing" in Studio. Simple XML renders any label as a tab — the same formatter looks complete in SXML and broken in DS. This applies to ANY Classic custom viz in DS, including hand-authored ones. Fold effect/animation toggles into "Color and style".

### Effects-fold mechanics (FMT-01)

The current vp-viz "Effects" section holds: showAmbientLight, showVignette, showGlow, showGlassPanel (already BANNED separately), and the accentColor picker. After the fold:
- These checkboxes move under `Color and style`
- accentColor picker moves under `Color and style` (it was previously told to live in "Effects" — formatter-patterns.md:167/182)
- Preserve the existing CP-03 contract: accentColor is hover/glow/selection only, used ONLY inside `withAlpha()`, never as a solid `ctx.fillStyle`. The fold changes its SECTION, not its usage contract.
- showGlassPanel stays BANNED (memory `feedback_viz_no_glass_panel`) — do not resurrect it during the fold.

### Version bumps (LOCKED)

- splunk-viz-packs: 5.10.1 → 5.10.2 (patch — vp-viz doc fix)
- splunk-custom-viz: 6.0.10 → 6.0.11 (patch — cv-build diagnostic + companion gotcha docs)

</decisions>

<canonical_refs>
## Canonical References

### Files being modified
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — Formatter structure block (~L173-180): remove item 4 "Effects"
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — L177-215: the "Effects" section example (L214-215), accentColor-in-Effects notes (L167, L182, L197), the label-mapping table (L194-197)
- `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md` — L12: section-count check
- `plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md` — L116 editorConfig "Effects" (FMT-05 investigate-only)
- `plugins/splunk-custom-viz/skills/cv-build/references/diagnostic-rules.md` — B5 area (~L120): add symptom-first rule
- `plugins/splunk-custom-viz/skills/cv-build/references/dashboard-transcription.md` — namespace short-key (L118)
- `plugins/splunk-custom-viz/skills/cv-build/references/generate-assets.md` — preview.png (L12)
- `plugins/splunk-custom-viz/references/splunk-viz-canon.md` — SXML long-key form (L172-181)
- `plugins/splunk-viz-packs/.claude-plugin/plugin.json` + `plugins/splunk-custom-viz/.claude-plugin/plugin.json` — version bumps

### The authoritative source (do NOT change — align TO it)
- `plugins/splunk-custom-viz/skills/cv-create/references/formatter-emission.md` (L7-18, 154-158) — already correct; the rule vp-viz must match

### Project rules
- `CLAUDE.md` — English only; SKILL.md < 500 lines (check vp-viz/SKILL.md line count after edit)

</canonical_refs>

<specifics>
## Specific Ideas

- FMT-05 is genuinely an INVESTIGATION, not a code change. I (the orchestrator) confirmed the editorConfig "Effects" is the Extension API path, which renders differently. Without a live Splunk Extension API instance, no one in this session can confirm whether DS constrains editorConfig labels. The honest deliverable is a documented TODO/NOTE, not a guess. The planner must NOT write a task that renames the editorConfig "Effects" — only one that adds the flagged note. If it's later confirmed safe, the note is removed; if confirmed broken, a follow-up fixes it.
- vp-viz/SKILL.md line count: check before/after. Removing the "Effects" item is net-negative lines, so the < 500 rule is not at risk here.
- formatter-patterns.md has a label-mapping table (L194-197) that currently maps "Visual effects"/"Mood effects" → "Effects". After FMT-01 that row is wrong — it should map those to "Color and style" (since Effects is gone). Update the table too.
- The accentColor picker move is the most error-prone edit — it's referenced in 3 places (L167 NOTE, L182 section content, formatter example L214). All three must move it to Color and style consistently, or the docs will half-contradict again.

</specifics>

<deferred>
## Deferred Ideas

- A validate.sh / validate_viz.sh check that greps formatter.html for non-standard section-labels (would mechanically enforce FMT-01/03). Tempting but cross-plugin (cv uses validate.sh, vp uses validate_viz.sh) and is code, not docs. Defer to a future validator phase.
- Resolving the Extension API editorConfig question definitively (needs a live Splunk 10.x Extension API instance). FMT-05 only documents the open question this phase.

</deferred>

---

*Phase: 53-formatter-section-label-consistency-dashboard-studio*
*Context gathered: 2026-06-24 via live DS formatter-label audit*
