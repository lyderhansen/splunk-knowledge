---
phase: 40-animation-scope-fix
reviewed: 2026-05-24T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
findings:
  critical: 0
  warning: 3
  warning_resolved: 3
  info: 3
  total: 6
status: fixed
---

# Phase 40: Code Review Report

**Reviewed:** 2026-05-24
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Phase 40 refactored a single SKILL reference file
(`animation-recipes.md`) to (a) add a top-of-file `## Animation Helper
Scope Rule` H2 with a WRONG/RIGHT table, (b) change 5 helper signatures
from `(config, ns)` to primitives (`speedMult`, `accentColor`,
`rowCount`), (c) update all caller blocks to compute `speedMult`
in `updateView` and pass it through, and (d) scale LED pulse cadence
by `speedMult` in AB-02 and ANI-02.

**The core scope rule is correctly implemented.** All five targeted
helpers (`_startEntrance` x2, `_startPulse` x2, `_startStaggeredEntrance`)
use the new signature, no executable `opt()` calls survive inside a
helper body, no callers still pass `(config, ns)` to a refactored helper,
and the cadence math is consistent between AB-02 line 122 and ANI-02
line 337 (`var cadenceMs = 700 * speedMult;`). All JS samples remain
ES5-compliant (no `const`/`let`, no arrow functions, no template
literals). Line count is 538 — within the 535-590 plan envelope.

**However, the refactor introduced a real correctness defect in the
boilerplates themselves.** `accentColor` is now declared as a
parameter on both `_startPulse` definitions (AB-02 line 118, ANI-02
line 335) but is never read inside either function body. The
parameter is documentation-only — the actual consumer of the color
is `_render` (see notes at lines 144 and 387-388), but `_render` has
no access to the `updateView`-scope `accentColor` local. A reader
copying AB-02 verbatim and following the line 144 instruction
literally (`ctx.shadowColor = accentColor;`) will get a
`ReferenceError` inside `_render`. The fix the boilerplate is
trying to teach (move config reads to updateView, pass primitives
to helpers) is being silently undermined by the new dead parameter.

In addition, `_startHoverTransition` (ANI-03, line 420) was left on
the old `(config, ns)` pattern and now openly contradicts the new
top-of-file scope rule. This was deliberate per CONTEXT.md D-01
(out of scope for Phase 40), but it must be flagged as a Phase 40
follow-up because the file now teaches two contradictory patterns
in the same document.

Plan acceptance criteria all pass (verified by grep):
- `_startEntrance: function(speedMult)` -> 2 hits
- `_startStaggeredEntrance: function(rowCount, speedMult)` -> 1 hit
- `_startPulse: function(speedMult, accentColor)` -> 2 hits
- `cadenceMs.*speedMult` -> 2 hits
- Old signatures (`function\(config|function\(rowCount, config|function\(cadenceMs`) -> 0 hits

## Warnings

### WR-01: `_startPulse(speedMult, accentColor)` accepts a parameter that is never used inside the function body — accent color is unreachable from `_render`

**File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md:118-131` (AB-02) and `:335-348` (ANI-02)

**Issue:**
Both `_startPulse` definitions now declare `accentColor` as the
second parameter:

```javascript
_startPulse: function(speedMult, accentColor) {
    if (this._pulseInterval) { return; }
    var base = 4;
    var amp = 8;
    var cadenceMs = 700 * speedMult;
    // ... setInterval body only writes self._pulseBlur ...
}
```

`accentColor` is never read anywhere in the function body — only
`self._pulseBlur` is updated in the setInterval callback. Meanwhile,
the prose note at line 144 instructs the reader to apply
`ctx.shadowColor = accentColor;` inside `_render`, and the example
at line 388 calls `drawPulsingIndicator(ctx, x, y, r, accentColor,
this._pulseBlur, innerAlpha)` — both of which assume `accentColor`
is in scope at render time.

This is a contradiction of the very scope rule the file now teaches
at the top (line 10): a value computed in `updateView` is not
accessible inside another method on `this` unless it is either
passed as a parameter to that method, or stashed on the instance.
The new parameter on `_startPulse` is decorative — it satisfies the
"pass primitives to helpers" letter of D-02 but does not actually
deliver the color to the consumer. Anyone copy-pasting AB-02 verbatim
and following line 144 literally will get
`ReferenceError: accentColor is not defined` at `_render` time.

**Fix:**
Either (a) stash the color on the instance inside the caller block
and reference it via `this._pulseColor` in `_render` (recommended,
mirrors `this._fieldName` pattern from `feedback_viz_store_config_fields`):

```javascript
// In updateView caller block (AB-02 line 107-113 and ANI-02 line 400-405):
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    var speedMult = getSpeedMult(config, ns);
    var accentColor = opt('accentColor', t.accent);
    this._pulseColor = accentColor;          // <-- stash for _render
    this._startPulse(speedMult);
} else {
    this._stopPulse();
}

// In _startPulse — drop the unused parameter:
_startPulse: function(speedMult) { ... }

// In _render — read the stashed color:
ctx.shadowColor = this._pulseColor || t.accent;
drawPulsingIndicator(ctx, x, y, r, this._pulseColor, this._pulseBlur, innerAlpha);
```

Or (b) keep the parameter but actually consume it: have `_startPulse`
stash `this._pulseColor = accentColor;` on its first line, then have
the line 144 note and line 388 example read `this._pulseColor`. The
key requirement is that `_render` must reach a value, not a
free-floating `updateView` local.

Update the line 144 and line 387-388 prose to reference the
instance field (`this._pulseColor`), not the bare `accentColor`
identifier, so the boilerplate teaches the reachable value pattern.

---

### WR-02: `_startHoverTransition` (ANI-03) still uses the legacy `(config, ns)` pattern and contradicts the new top-of-file scope rule

**File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md:420-440` and call site at `:448`

**Issue:**
The new `## Animation Helper Scope Rule` at line 8-17 states
unambiguously that `opt()`, `config`, and `ns` are `updateView`-only
bindings. But the ANI-03 section retains the exact pattern the rule
forbids:

```javascript
_startHoverTransition: function(config, ns) {
    if (this._hoverAnimating) { return; }
    var showHover = opt('showHoverEffect', 'true') === 'true';   // <-- opt() inside helper
    if (!showHover) { return; }
    // ...
}

// Trigger in _onMouseMove:
_onMouseMove: function(e) {
    // ...
    this._startHoverTransition(this._lastConfig, '{{VIZ_NAMESPACE}}');  // <-- passes config + ns string
    // ...
}
```

This is one of the exact patterns the scope rule was created to
eliminate, and `_onMouseMove` is a particularly bad context for it
because `opt()` does not exist at `_onMouseMove` call time —
`_onMouseMove` is a DOM event handler outside the `updateView`
closure entirely. The current ANI-03 code would silently fail at
runtime (per the rule's own description on line 10: "`opt` is
simply undefined in that scope").

CONTEXT.md D-01 deliberately excluded `_startHoverTransition` from
Phase 40's scope on the grounds that it was not named in AF-01 /
AF-02. That decision is defensible — but it leaves the file in a
state where it teaches two opposing patterns in the same document,
and a reader landing on ANI-03 first (e.g., implementing a hover
transition for the first time) will copy a known-broken pattern
directly contradicted by the top-of-file rule.

**Fix:**
Open a Phase 41 follow-up to refactor `_startHoverTransition` to
match the new scope rule. The signature should drop `config, ns`
entirely and read `showHoverEffect` in `updateView` (caching it on
`this._showHoverEffect`), then have the event handler gate the call:

```javascript
// In updateView:
this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

// Helper:
_startHoverTransition: function() {
    if (this._hoverAnimating || !this._showHoverEffect) { return; }
    var startAlpha = this._hoverAlpha;
    // ... rest unchanged ...
}

// In _onMouseMove:
if (newIndex !== this._hoveredIndex) {
    this._hoveredIndex = newIndex;
    this._hoverTarget = (newIndex >= 0) ? 0.12 : 0;
    this._startHoverTransition();
}
```

Until that follow-up lands, consider adding a one-line note above
the ANI-03 fence (e.g., "_Note: this section predates AF-01/AF-02
and will be refactored in a follow-up — for new code, apply the
scope rule pattern from the top of this file._") so readers are not
misled.

---

### WR-03: Variable shadowing risk — if AB-01 and AB-02 caller blocks are pasted into the same `updateView`, `var speedMult` is declared twice

**File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md:44` (AB-01) and `:108` (AB-02); also `:283` (ANI-01) and `:401` (ANI-02)

**Issue:**
AB-01's caller block at line 44 introduces `var speedMult =
getSpeedMult(config, ns);` and AB-02's caller block at line 108
introduces it again. Same for ANI-01 line 283 and ANI-02 line 401.
The boilerplate prose at line 23 and 90 both say "copy-paste
verbatim into any viz." A viz that has both an entrance animation
(AB-01) AND a status pulse (AB-02) will end up with two `var
speedMult = ...;` declarations in the same `updateView` function
scope.

In ES5 with `var`, this is technically legal — the second
declaration is hoisted, the assignment re-runs, no syntax error.
But it is a code smell that (a) implies the two `speedMult`
variables are independent when they are not, and (b) trips any
modern linter (`no-redeclare`) the reader's IDE might be running,
and (c) sets a bad example given the top-of-file rule is
specifically about being explicit about scope.

This is a documentation problem, not a runtime bug, but the
boilerplates are explicitly designed to be pasted side by side
(AB-01 + AB-02 are the two named copy-paste-verbatim units in the
file).

**Fix:**
Add a one-line note to AB-02's caller block clarifying that
`speedMult` may already be declared by an earlier boilerplate:

```javascript
// In updateView (severity check before render):
var flashCritical = opt('flashCritical', 'false') === 'true';
if (prefersReducedMotion()) { this._stopPulse(); }
// ... severity scan ...
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    // speedMult is already declared by AB-01's caller block if both are present;
    // safe to re-declare under ES5 var hoisting but prefer assignment-only here.
    var speedMult = getSpeedMult(config, ns);
    var accentColor = opt('accentColor', t.accent);
    this._startPulse(speedMult, accentColor);
} else {
    this._stopPulse();
}
```

Same comment for the ANI-01 / ANI-02 pair at lines 283 / 401. The
cleanest alternative is to lift the `var speedMult = ...;`
declaration to a single "shared preamble" snippet at the top of
the file and have each boilerplate reference it instead of
re-declaring — but that breaks the "copy-paste verbatim" promise
and is a bigger refactor.

## Info

### IN-01: ANI-02 updateView snippet references `accentColor` without declaring it in the snippet

**File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md:391-406`

**Issue:**
The ANI-02 "In updateView — severity check before starting pulse"
snippet at lines 391-406 ends with:

```javascript
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    var speedMult = getSpeedMult(config, ns);
    this._startPulse(speedMult, accentColor);   // <-- accentColor not declared in this snippet
} else {
    this._stopPulse();
}
```

`accentColor` is not declared anywhere inside this fenced block.
AB-02's equivalent block (lines 107-113) does declare it
(`var accentColor = opt('accentColor', t.accent);`). ANI-02 is
the more rigorous pattern section and the inconsistency makes
ANI-02's snippet copy-paste-incomplete.

This is Info rather than Warning because (a) a reader who has read
AB-02 first will infer the missing declaration, (b) the
`drawPulsingIndicator` example at line 388 implies `accentColor`
is project-wide convention, and (c) the entire `_startPulse`
accentColor parameter is unused anyway per WR-01, so fixing WR-01
will likely rework this snippet too.

**Fix:**
Add the declaration to the ANI-02 snippet to match AB-02:

```javascript
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    var speedMult = getSpeedMult(config, ns);
    var accentColor = opt('accentColor', t.accent);   // <-- add this
    this._startPulse(speedMult, accentColor);
} else {
    this._stopPulse();
}
```

Or fold into the WR-01 fix (stash `this._pulseColor` in updateView,
drop the `_startPulse(accentColor)` parameter).

---

### IN-02: WRONG/RIGHT table row 2 (AF-02) shows `function(config, ns)` as the WRONG signature — same string appears as live code at line 420

**File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md:15` (WRONG cell) and `:420` (live code)

**Issue:**
The WRONG cell of the AF-02 table row at line 15 contains the
exact string `function(config, ns)` as an example of the forbidden
signature. The same exact string appears as live, unflagged code
inside the ANI-03 `_startHoverTransition` definition at line 420.
A reader doing a global grep for `function(config, ns)` to verify
the file's compliance will see two hits: one intentional (the
WRONG table cell) and one accidental (the ANI-03 helper).

CONTEXT.md `<specifics>` paragraph 5 explicitly says: "the WRONG
cell in the new rule table is the only intentional exception in a
fenced markdown cell, not executable code." The current file
violates that explicit acceptance condition because line 420 is
also a non-WRONG-cell occurrence.

**Fix:**
Either (a) take the WR-02 follow-up and refactor `_startHoverTransition`
(removes line 420 occurrence, leaves only the WRONG cell), or
(b) until that follow-up lands, add a `<!-- AF-01 exception: legacy
helper, see Phase 41 -->` HTML comment on line 419 so a future
reviewer's grep for `function(config, ns)` will skip past it as
acknowledged debt.

---

### IN-03: `mood-recipes.md` has a sibling `_startPulse` (line 285, 289) using the legacy zero-arg pattern — sibling-skill drift

**File:** `plugins/splunk-viz-packs/skills/vp-recipes/references/mood-recipes.md:285` and `:289`

**Issue:**
Phase 40 left `mood-recipes.md` untouched (CONTEXT.md D-05 said
"may need a parallel update if a no-op rename is required" and
the grep at planning time apparently was only checking for the
new signature). But `mood-recipes.md` line 289 defines
`_startPulse: function() { ... }` (zero-arg, attention-grabber
pulse ring — different implementation from animation-recipes.md
but the same method name) and the caller at line 285 invokes
`this._startPulse();` with no arguments.

This is a different implementation pattern (uses
`requestAnimationFrame` recursion rather than `setInterval`, and
draws directly via `ctx.arc` rather than setting `shadowBlur` for
`_render`) so there is no signature collision per se. But because
both files contribute helpers named `_startPulse` to the same
viz, a viz that loads both skills will end up with whichever
`_startPulse` definition Claude wrote last — silently dropping the
other behavior.

**Fix:**
Outside Phase 40 scope. File a follow-up to either (a) rename the
mood-recipes.md helper to `_startPulseRing` to avoid the name
collision, or (b) consolidate the two `_startPulse` patterns into
animation-recipes.md and have mood-recipes.md cross-reference it,
or (c) add a clarifying note to both files warning that the
`_startPulse` name is shared and only one definition wins per
viz. This is the kind of cross-file naming drift that the new
top-of-file scope rule cannot catch — worth bringing to the
deferred-ideas list.

---

_Reviewed: 2026-05-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---

## Fixes Applied

| Finding | Commit | Description |
|---------|--------|-------------|
| WR-01 | f91d824f | Already fixed inline during execute-phase — `_startPulse` now stashes `this._pulseColor = accentColor` so `_render` can reach the value. |
| WR-02 | ed83c6c3 | Refactored `_startHoverTransition` (ANI-03) to zero-arg signature; `opt('showHoverEffect')` moved to `updateView` and cached as `this._showHoverEffect`; `_onMouseMove` caller drops config/ns arguments. |
| WR-03 | 53437112 | Added guidance note in scope rule section about combining entrance+pulse boilerplates and the duplicate `var speedMult` declaration; added inline comment on the re-declaration line in both AB-02 and ANI-02 caller blocks. |

_Fixed: 2026-05-24_
_Fixer: Claude (gsd-code-fixer)_
