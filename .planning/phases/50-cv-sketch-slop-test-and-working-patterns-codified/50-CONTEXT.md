# Phase 50: cv-sketch Slop Test & Working Patterns Codified — Context

**Gathered:** 2026-06-15
**Status:** Ready for planning
**Source:** Locked from v6.1 milestone scope + test51_cucm / test52_asus_rog HANDOFFs (pure markdown-reference work — no discuss-phase needed)

<domain>
## Phase Boundary

Harvest the markdown-reference findings from two real-brand v6.0.x builds into the splunk-custom-viz + splunk-dashboard-studio reference layer. Two concerns:

1. **cv-sketch Slop Test additions** (SKETCH-01..03) — extend the Stage D self-check so two failure modes are caught at sketch time instead of port time: broken SVG arc geometry (test52 #22) and small-markdown-on-shape badges (test51 G2).
2. **Working patterns codified** (PATTERN-01..04) — four production-proven patterns become named, reusable reference entries: bottom-up layout (Rule 9), shared `_render<X>(isLight)` helper (Rule 5 impl pattern), three-audience matrix (ds-couture), anti-references persisted into DESIGN-LOCK.

**In scope:**
- Editing `cv-sketch/references/slop-test.md`, `cv-sketch/references/quality-bar.md`, `cv-sketch/references/stage-a-commitment.md`
- Editing `cv-create/references/canvas-port-rules.md` (add Rule 9 + Rule 5 impl pattern)
- Editing `splunk-dashboard-studio/skills/ds-couture/SKILL.md` (add Multi-audience apps sub-section)
- Bumping splunk-custom-viz plugin version (and splunk-dashboard-studio if ds-couture changes warrant it)

**Out of scope:**
- Any code (validate.sh, boilerplate_emit.js) — this is documentation/reference only
- Font embedding (Phase 48), cross-app merge (Phase 49) — separate phases
- SPL reference debt (Phase 51) — separate phase
- Changing the existing 8 Slop Test questions — we ADD checks, not rewrite

</domain>

<decisions>
## Implementation Decisions

### File-to-requirement mapping (LOCKED)

| Req | Lands in | What |
|---|---|---|
| SKETCH-01 | `cv-sketch/references/slop-test.md` | New Slop Test question: concentric-arc viz arc-point coplanarity (within 0.1px on same circle) |
| SKETCH-02 | `cv-sketch/references/quality-bar.md` | New "SVG arc geometry" section with the trig-endpoint JS helper |
| SKETCH-03 | `cv-sketch/references/slop-test.md` | New Slop Test question: small (<32px) markdown-on-shape badge anti-pattern + working alternative |
| PATTERN-01 | `cv-create/references/canvas-port-rules.md` | New "Rule 9: Compute multi-row layouts bottom-up" |
| PATTERN-02 | `cv-create/references/canvas-port-rules.md` | New "Rule 5 implementation pattern" sub-section (shared `_render<X>(isLight)` helper) |
| PATTERN-03 | `splunk-dashboard-studio/skills/ds-couture/SKILL.md` | New "Multi-audience apps" sub-section with the three-flavor matrix |
| PATTERN-04 | `cv-sketch/references/stage-a-commitment.md` | Note that anti-references MUST persist into `DESIGN-LOCK.md.global.commitments.anti_references` |

### Slop Test additions style (LOCKED)

The existing slop-test.md has "## The 8 questions" — a numbered list, each "yes = fix it." The new checks become questions **9 and 10** following the identical format (bolded question + parenthetical clarification + fix guidance). Do NOT renumber or rewrite the existing 8. Update the section header from "The 8 questions" to "The 10 questions".

- **Q9 (SKETCH-01):** "For any concentric-arc viz, do all arc start/end points sit on the same circle within 0.1px?" — symptom: two disconnected colored segments, or a stub of color in the wrong place. The arc endpoints must be computed with sin/cos, not eyeballed. Cross-reference quality-bar.md SVG arc geometry section (SKETCH-02).
- **Q10 (SKETCH-03):** "Did I overlay small (<32px) markdown text on a background shape for a number badge?" — unreliable rendering at small sizes (test51 G2 glitchy partial-fill). Working alternative: a colored dot (12-14px) + the number embedded inline in the section-title text (`**01 · QUALITY EXPERIENCE**`).

### SVG arc geometry helper (SKETCH-02) — the canonical snippet

quality-bar.md gets a new "## SVG arc geometry" section containing the trig-endpoint helper. The test52 failure was: a 270° arc drawn with eyeballed endpoints `(-95, 32)` / `(95, 32)` that don't sit on the r=100 circle. The fix is computed endpoints:

```javascript
// For an arc on a circle of radius r centered at (cx, cy):
// angle in degrees, measured clockwise from 12 o'clock (SVG convention varies — document yours)
function arcPoint(cx, cy, r, angleDeg) {
  var a = (angleDeg - 90) * Math.PI / 180;  // -90 so 0deg = 12 o'clock
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
// 270deg arc opening at the bottom of an r=100 circle centered at origin:
//   start = arcPoint(0, 0, 100, 225)  -> lower-left
//   end   = arcPoint(0, 0, 100, 135)  -> lower-right (going clockwise 270deg)
//   value end at 93% sweep: arcPoint(0, 0, 100, 225 + 270*0.93)
```

The planner should refine the exact angle convention against the real test52 mockup arcs, but the rule is: **every concentric-arc mockup MUST compute endpoints from start_angle + sweep_angle + radius, never approximate.**

### Rule 9 (PATTERN-01) — bottom-up layout

canvas-port-rules.md currently has Rules 1-8 (note: file orders them 1-6, 6a, 8, 7 — append Rule 9 at the end regardless). Rule 9 = "Compute multi-row layouts bottom-up, not top-down." The test51 working snippet:

```javascript
var legendH     = 50;
var legendTopY  = h - legendH - 8;
var captionY    = legendTopY - 16;
var valueY      = captionY - 12;
var gaugeBottomY = valueY - 56;
var gaugeMaxR   = Math.min(w * 0.32, (gaugeBottomY - 60) * 1.0);
```

Symptom callout: "elements collide at small panel heights — invisible during dev at one test height, breaks in production at a different panel size." The top-down alternative (`gaugeBottomY = h - 76; valueY = gaugeBottomY + 38; ...`) is the anti-pattern.

### Rule 5 implementation pattern (PATTERN-02)

canvas-port-rules.md already has "Rule 5: Light theme is NEVER derived from dark." PATTERN-02 ADDS a sub-section under Rule 5 (or immediately after it) titled "Rule 5 implementation pattern" describing the shared helper that test52 proved:

```javascript
_renderDark:  function(ctx, data, t, w, h, opt) { t = this._resolveTheme(t, opt); this._renderShared(ctx, data, t, w, h, opt, false); },
_renderLight: function(ctx, data, t, w, h, opt) { t = this._resolveTheme(t, opt); this._renderShared(ctx, data, t, w, h, opt, true); },
_renderShared: function(ctx, data, t, w, h, opt, isLight) {
  // shared geometry both paths legitimately need
  if (!isLight) { /* dark-only ambient glow / carbon-fiber */ }
}
```

The nuance to preserve: this does NOT violate Rule 5 ("two separate code paths"). The shared helper IS the logic both paths legitimately share; theme-dependent EFFECTS are properly branched with `if (!isLight)`. Document this explicitly so a reader doesn't think the pattern contradicts Rule 5.

### Multi-audience matrix (PATTERN-03) — ds-couture

ds-couture/SKILL.md gets a "## Multi-audience apps" sub-section with the test51 Pattern D matrix:

```
Audience          → Flavor       → Theme   → Density   → Hero
─────────────────────────────────────────────────────────────────
C-suite           → Editorial    → Light   → Sparse    → 1 headline metric
Operations team   → Refined      → Dark    → Medium    → Multi-zone overview
Specialist deep   → Industrial   → Black   → Dense     → Diagnostic grid
```

Framing: when an app serves multiple audiences, each dashboard should explicitly BREAK from the others on theme + flavor + density. This is the recommended starting template, not a footnote.

### PATTERN-04 — anti-references persistence

stage-a-commitment.md gets an explicit note: the Stage A anti-references list MUST be written into `DESIGN-LOCK.md.global.commitments.anti_references` so cv-create can re-read it mid-port as a defense mechanism. The test52 evidence: the anti-reference list was "the single most valuable anti-slop anchor" but is only useful downstream if it survives into the lock. Confirm against lock-schema.md whether the field already exists; if it does, the note just emphasizes it's mandatory; if not, add the field to lock-schema.md too.

### Version bump (LOCKED)

- splunk-custom-viz: patch bump (6.0.9 → 6.0.10) — cv-sketch + cv-create reference changes (per memory `feedback_plugin_version_bump`, patch is fine, can go to 6.0.34+)
- splunk-dashboard-studio: patch bump only if ds-couture/SKILL.md is materially changed (it is — PATTERN-03). Current version is 3.5.0 → 3.5.1.

</decisions>

<canonical_refs>
## Canonical References

Downstream agents MUST read these before planning or implementing.

### Files being modified
- `plugins/splunk-custom-viz/skills/cv-sketch/references/slop-test.md` — current "8 questions" list; SKETCH-01/03 add Q9/Q10
- `plugins/splunk-custom-viz/skills/cv-sketch/references/quality-bar.md` — SKETCH-02 adds SVG arc geometry section
- `plugins/splunk-custom-viz/skills/cv-sketch/references/stage-a-commitment.md` — PATTERN-04 anti-references persistence note
- `plugins/splunk-custom-viz/skills/cv-sketch/references/lock-schema.md` — check whether `commitments.anti_references` field exists (PATTERN-04)
- `plugins/splunk-custom-viz/skills/cv-create/references/canvas-port-rules.md` — Rules 1-8 exist; add Rule 9 (PATTERN-01) + Rule 5 impl pattern (PATTERN-02)
- `plugins/splunk-dashboard-studio/skills/ds-couture/SKILL.md` — PATTERN-03 multi-audience sub-section
- `plugins/splunk-custom-viz/.claude-plugin/plugin.json` — version bump
- `plugins/splunk-dashboard-studio/.claude-plugin/plugin.json` — version bump (if ds-couture changed)

### Source HANDOFFs (failure-mode + pattern evidence)
- `tests/test51_cucm/HANDOFF.md` — Pattern A (bottom-up layout, §2.A), Pattern D (three-audience, §2.D), Gap G2 (small markdown badge, §3.G2)
- `tests/test52_asus_rog/HANDOFF.md` — Correction #22 (SVG arc geometry, §1), Section 3 working patterns (shared `_render<X>` helper, anti-references persistence)

### Project rules
- `CLAUDE.md` — plugin language English-only; SKILL.md < 500 lines (applies to ds-couture/SKILL.md — check line count after edit)

</canonical_refs>

<specifics>
## Specific Ideas

- The SKILL.md < 500-line rule applies to `ds-couture/SKILL.md`. Check its current line count before adding PATTERN-03 — if the addition would breach 500, push the matrix into a `ds-couture/references/` file and leave a pointer in SKILL.md.
- `canvas-port-rules.md` rule numbering is already non-sequential (1-6, 6a, 8, 7). Don't try to fix the ordering — just append Rule 9 and add the Rule 5 impl pattern where Rule 5 lives. Cosmetic reordering is out of scope.
- PATTERN-04 depends on what lock-schema.md already declares. The planner must read lock-schema.md first and branch: (a) field exists → emphasize mandatory in stage-a-commitment.md only; (b) field missing → add to lock-schema.md AND stage-a-commitment.md.

</specifics>

<deferred>
## Deferred Ideas

- Automating the Slop Test as a script (it's currently an agent self-check). Out of scope — the HANDOFF explicitly notes it's "an agent self-check, not a script."
- A validate.sh check that greps mockup.html for eyeballed arc coordinates. Tempting but mockup.html isn't in the packaged app, and validate.sh runs post-build. Defer.
- data_fidelity / cosmetic flags in DESIGN-LOCK (test51 G3, Pattern C) — deferred at milestone level, not this phase.

</deferred>

---

*Phase: 50-cv-sketch-slop-test-and-working-patterns-codified*
*Context gathered: 2026-06-15 via locked v6.1 milestone scope*
