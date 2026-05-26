---
phase: 42-light-mode-backgroundcolor
created: 2026-05-24
status: ready-for-research
requirements:
  - LM-01
  - LM-02
---

# Phase 42: Light Mode backgroundColor — CONTEXT.md

<domain>
## What This Phase Delivers

A documentation-only fix to four references files in `plugins/splunk-viz-packs/skills/vp-viz/references/`
so future Claude-generated viz code respects the user's `backgroundColor` formatter control
in **both** dark and light themes — not just dark.

**Out of scope:** retrofitting existing test packs, validator (`check_design.js`) enforcement,
fixing the `backgroundColor` pattern in the Classic JS path AND the Extension API path
(both are in scope as templates, but no existing pack is modified).

The bug pattern that this phase prevents is documented in memory
`feedback_light_mode_bgcolor_ignored.md` — Tesla FSD Crash Investigation dashboard
(2026-05-22) rendered with white panels in light mode despite the user setting
`backgroundColor` to brand red `#dc4e41`.

This is a **1-plan phase** per ROADMAP.md — keep scope tight.
</domain>

<canonical_refs>
## Canonical References

Every downstream agent (researcher, planner, executor) MUST read these before acting.

- `.planning/REQUIREMENTS.md` — LM-01, LM-02 requirement traceability
- `.planning/ROADMAP.md` — Phase 42 goal statement
- `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md` — primary
  target for the WRONG/RIGHT example block (Classic JS theme module structure;
  currently 234 lines, light-theme guidance starts around line 219)
- `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md` —
  target for the one-line checklist rule (currently 95 lines, "JS light theme"
  cluster at lines 14-16 is the logical insertion point)
- `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md` —
  target for the literal pattern in the Classic `render()` template
- `plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md` —
  target for the Extension API equivalent (read once during research to confirm
  the corresponding pattern shape, since Extension API uses
  `addThemeListener(callback)` instead of `if (isDark)` branching)
- Reference (live bug evidence, do NOT modify):
  `tests/test42_redbull/redbull_sports_viz/appserver/static/visualizations/kpi_tile/visualization_source.js`
  — line 186 reads `bgColor = hexFromSplunk(opt('backgroundColor', ''), t.panel)` AFTER
  `var t = theme.getTheme(...)`. This pattern is **functionally correct** for kpi_tile
  (line 274 uses `bgColor` in both light and dark paths). The bug must live in a different
  viz pack (Tesla FSD) where the rendering path uses `t.bg`/`t.panel` directly inside
  an `if (isDark)` branch.
- Memory: `feedback_light_mode_bgcolor_ignored.md` — root-cause description
- Memory: `feedback_light_theme_structural_fix.md` — related (Phase 24 light-mode
  structural decisions, locked: no carbon-fiber or ambient-glow on light)
</canonical_refs>

<prior_decisions>
## Carrying Forward from Earlier Phases

These are already-locked and must NOT be re-litigated:

- **ES5-only** for viz JS (`var`, no `const`/`let`/arrows/template-literals) — Phase 22+,
  reaffirmed Phase 40. Applies to the example code blocks in theme-template.md and
  visualization-js-template.md.
- **`hexFromSplunk()` wraps every color picker `opt()` read** — Phase 22+ (B22).
  The new pattern MUST keep `hexFromSplunk()`.
- **`themeMode` defaults to `"auto"`** in formatter (FAIL B20) — Phase 24+. Light
  theme path is reachable by default.
- **Light theme is NOT an inversion of dark** — theme-template.md line 219+ guidance
  remains intact; this phase only ADDS the backgroundColor pre-branch pattern,
  doesn't restructure the light-theme block.
- **`t.bg` vs `t.panel` distinction** — `t.bg` is canvas backdrop (gradient origin),
  `t.panel` is card surface. Phase 42 affects both as fallbacks for the
  user-supplied `backgroundColor` opt() value.
- **Reference files load on-demand** — Phase 39 progressive disclosure pattern.
  pre-code-checklist.md is eagerly loaded; theme-template.md is loaded per-viz.
  Putting the rule in BOTH ensures Claude sees it regardless of load path.
</prior_decisions>

<decisions>
## Implementation Decisions

### D-01: Update all four references files (not just one)

LM-02 reads "theme-template.md or pre-code-checklist.md" but the user explicitly
chose all four — `theme-template.md`, `pre-code-checklist.md`, `visualization-js-template.md`,
AND `config-json-template.md`. Rationale:

- **theme-template.md** — primary teaching file with WRONG/RIGHT block (Claude
  reads this when designing the theme module)
- **pre-code-checklist.md** — one-line gate so the rule appears in the eagerly-loaded
  checklist Claude consults before writing any viz code
- **visualization-js-template.md** — the literal `render()` skeleton Claude copies;
  showing the pattern in the template is the highest-leverage prevention
- **config-json-template.md** — Extension API equivalent so the same rule applies
  to v6.0 dual-format builds

Without all four, Claude can read the checklist but copy a stale template, or read the
template but miss the checklist gate. Belt-and-braces is justified for a bug that
silently degrades light-mode output.

### D-02: Functional interpretation of "BEFORE the theme branch"

LM-02's pattern literally requires `t.bg` to exist as the fallback, so `var t = theme.getTheme(...)`
MUST be computed first. The strict "before var t" reading is therefore contradictory.

The functional rule is:

**The `opt('backgroundColor')` read happens unconditionally (not inside `if (isDark)`),
AND every rendering call site that paints the background MUST use the read `bg` variable —
NEVER `t.bg`, `t.panel`, or a theme-fallback directly — in both light and dark code paths.**

The bug pattern this prevents:
```javascript
// WRONG — typical Tesla FSD failure mode
var t = theme.getTheme(isDark ? 'dark' : 'light');
if (isDark) {
    var bg = hexFromSplunk(opt('backgroundColor', ''), t.panel);
    ctx.fillStyle = bg;
} else {
    ctx.fillStyle = t.panel;   // <-- BUG: ignores opt('backgroundColor') entirely
}
ctx.fillRect(0, 0, w, h);
```

The required pattern:
```javascript
// RIGHT — theme-independent bg read, used in both paths
var t = theme.getTheme(isDark ? 'dark' : 'light');
var bg = hexFromSplunk(opt('backgroundColor', t.bg), t.bg);  // unconditional read
// ... later in render:
ctx.fillStyle = bg;   // <-- both light and dark use the same variable
ctx.fillRect(0, 0, w, h);
```

The WRONG/RIGHT block in theme-template.md and visualization-js-template.md must show
this exact contrast.

### D-03: Doc-only enforcement; defer validator rule to backlog

LM-02 explicitly says "documents the correct pattern" — the requirement is doc-only.
Adding a `check_design.js` D-rule (e.g., "D12: opt('backgroundColor') must not appear
inside an isDark block") would expand the phase beyond its 1-plan ROADMAP allocation.

**Captured for later (not in scope here):**
A future phase can add a D12 validator rule that greps generated viz source for
`if\s*\(\s*isDark\s*\).*opt\(\s*['"]backgroundColor` and similar bad shapes. File as
roadmap backlog item after phase completes.

### D-04: Templates only — no test pack retrofit

Existing test packs (test42_redbull, test38_strava, Tesla FSD, etc.) are NOT
modified by this phase. The next `vp-create` invocation against a viz pack will
produce code that follows the new pattern. Rationale: ROADMAP allocates 1 plan;
test packs are throw-away artifacts; the Plan 41-02 wave-isolation discipline
explicitly forbade touching test packs in adjacent fixes.

If the user later wants to demonstrate the fix in a real pack, they can re-run
`vp-create` against any pack and the new templates will produce correct code.

### D-05: Extension API uses `addThemeListener`, not `if (isDark)`

The Classic-pattern WRONG/RIGHT block does NOT translate directly to Extension API,
because Extension API has no `isDark` boolean — it uses `addThemeListener(callback)`
to receive theme changes. The Extension API version of the rule is:

**The `options.backgroundColor` value MUST be read once at render-start and used as
the fill — never replaced by `theme.bg` inside the addThemeListener callback.**

config-json-template.md gets a one-paragraph note (not a full WRONG/RIGHT block,
since the v6.0 templates already use the right shape — research should confirm
this before planning).

### D-06: Plugin version bump on completion

Per memory `feedback_plugin_version_bump.md`: always bump `plugin.json` version
before pushing new features to main. This is a bugfix, so:
**5.9.0 → 5.9.1** (patch bump, not minor — the public API is unchanged).
</decisions>

<specifics>
## Specifics & Concrete References

- **Bug spotted on:** Tesla FSD Crash Investigation dashboard, 2026-05-22 — light mode
  panels render white instead of the `#dc4e41` brand red the user set in
  `opt('backgroundColor')`. Source: memory `feedback_light_mode_bgcolor_ignored.md`.
- **Correct example in repo:** `tests/test42_redbull/redbull_sports_viz/appserver/static/visualizations/kpi_tile/visualization_source.js`
  lines 178-186 and 272-277 — kpi_tile reads `bgColor` after `t`, then uses it in
  the gradient that paints the panel. Both light and dark paths use the same `bgColor`
  variable. This is the pattern to teach.
- **Insertion point in theme-template.md:** immediately after line 233 (the THM-04
  inner-shadow vs border block) and before the AMD `define(...)` close — add a
  new THM-05 section heading "Background Color (THM-05): user opt() overrides
  theme default in both modes" with the WRONG/RIGHT block.
- **Insertion point in pre-code-checklist.md:** add a new line after line 16
  (after THM-04) inside the "JS light theme" cluster:
  `□ JS: backgroundColor read unconditionally — var bg = hexFromSplunk(opt('backgroundColor', t.bg), t.bg); — rendering uses bg in BOTH isDark paths, never t.bg/t.panel directly (THM-05/LM-01)`
- **Insertion point in visualization-js-template.md:** in the `render()` skeleton
  where color reads happen (search for the existing `var accent = hexFromSplunk(...)`
  line in the template), add the `var bg = ...` read alongside accent. Update any
  fillRect/fillStyle sample to use `bg` instead of `t.bg`.
- **Insertion point in config-json-template.md:** add a Notes-section bullet:
  "backgroundColor option: read once via `options.backgroundColor` at render start;
  do NOT replace the value inside the addThemeListener callback. Both theme states
  must paint with the same user-supplied value."
- **Tag for the new rule:** `THM-05` — extends the THM-01..THM-04 family in
  theme-template.md so cross-referencing is consistent.
- **Plugin version after fix:** 5.9.0 → 5.9.1 (patch).
</specifics>

<code_context>
## Reusable Code & Patterns Found

From `tests/test42_redbull/redbull_sports_viz/appserver/static/visualizations/kpi_tile/visualization_source.js`:

```javascript
// Lines 177-179 — theme detection
var themeMode = opt('themeMode', 'auto');
var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
var t = theme.getTheme(isDark ? 'dark' : 'light');

// Line 185-189 — color reads (unconditional, AFTER t is set — correct pattern)
var accent = hexFromSplunk(opt('accentColor', ''), t.accent);
var bgColor = hexFromSplunk(opt('backgroundColor', ''), t.panel);
var fontColor = hexFromSplunk(opt('fontColor', ''), t.text);
var s1 = hexFromSplunk(opt('series1Color', ''), t.s1);

// Lines 272-277 — render uses bgColor in BOTH isDark paths (correct)
var grad = ctx.createLinearGradient(0, 0, w, h);
grad.addColorStop(0, bgColor);
grad.addColorStop(1, theme.withAlpha(threshColor, isDark ? 0.15 : 0.08));
ctx.fillStyle = grad;
ctx.fillRect(0, 0, w, h);
```

This pattern is the "RIGHT" example to lift into theme-template.md verbatim
(with the fillRect simplified to one line). The `isDark ? 0.15 : 0.08` alpha
on the gradient stop is acceptable — that's a theme-aware tuning of a
separate value, not a replacement of bgColor.

From `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md`
lines 14-16 — existing "JS light theme" cluster:
```
□ JS light theme: hero text uses t.text, NEVER t.textDim (ghost-text on white — D-08)
□ JS light theme: glow scaled by isDark ? 1.0 : 0.4 (THM-03)
□ JS light theme: inner shadow replaced by 1px t.edge border on panels (THM-04)
```

The new rule slots in as a fourth line in the same cluster (THM-05 tag).
</code_context>

<security_threat_model>
## Threat Model

This is a documentation-only phase. No new code paths, no new attack surface.

| Threat | Disposition | Reason |
|--------|-------------|--------|
| Stale doc misleading Claude into bad code | mitigate | This phase IS the mitigation — keeping doc and code pattern in sync |
| WRONG/RIGHT example accidentally executable | accept | Example blocks are inside fenced markdown; not loaded as code by any agent |

No new STRIDE entries required.
</security_threat_model>

<deferred>
## Noted for Later (Out of Scope)

- **D12 validator rule** in `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js`:
  grep generated `visualization_source.js` for `if\s*\(\s*isDark\s*\).*opt\(\s*['"]backgroundColor`
  and fail validation when found. Belongs in a follow-up backlog item — out of scope for
  Phase 42's 1-plan allocation.
- **Retrofit Tesla FSD / older test packs** to demonstrate the fix end-to-end.
- **Extension API live test** — once v6.0 packs are built, confirm `addThemeListener`
  callback doesn't replace `options.backgroundColor`. Should be a Phase 43
  (Deep Review) check item.
</deferred>

<next_steps>
## What's Next

`/clear` then:

`/gsd:plan-phase 42`

Plan should produce 1 plan with ~4-5 tasks (one edit per file + plugin.json version bump),
all in a single wave (no dependencies between the four references files).
</next_steps>
