# KNOWN-CORRECTIONS — splunk-custom-viz

Authoritative list of corrections discovered in production. **This file overrides any conflicting guidance in `skills/**/references/`.** Every cv-* skill should read this file before generating code or dashboard JSON.

When a discrepancy exists between this file and a reference doc, the reference doc is wrong and should be updated to match. Until then, this file wins.

---

## Correction 1 — Dashboard token defaults MUST be objects, not bare strings

**Source:** WWF Field Ops 2026-05-25 + prior memory `feedback_ds_token_defaults_must_be_objects.md`

Splunk Dashboard Studio v2 schema requires:

```json
"defaults": {
  "tokens": {
    "default": {
      "selected_team_id": { "value": "*" }
    }
  }
}
```

NOT:

```json
"defaults": {
  "tokens": {
    "default": {
      "selected_team_id": "*"          ← WRONG — fails schema, dashboard breaks silently
    }
  }
}
```

**Where it lives:** `skills/cv-build/references/dashboard-transcription.md` (corrected 2026-05-25).
**Validator:** `scripts/validate.sh` greps for `"selected_\w+":\s*"\*"` in dashboard XML → FAIL.

---

## Correction 2 — Every formatter color picker MUST be read in `_resolveTheme(t, opt)`

**Source:** WWF Field Ops 2026-05-25 + prior memory `feedback_canvas_must_read_color_pickers.md` + Cisco viz pack (earlier)

If `formatter.html` emits a `splunk-color-picker`, `visualization_source.js` MUST consume it via `hexFromSplunk(opt("<key>", t.<default>), t.<default>)` inside `_resolveTheme(t, opt)`, and `_renderDark` / `_renderLight` MUST start with `t = this._resolveTheme(t, opt);`.

A picker without consumer is dead UI — clicking it persists a value the viz never reads. Users report "the color setting doesn't work" with no error.

**Where it lives:**
- `skills/cv-create/references/canvas-port-rules.md` — Rule 7 (added 2026-05-25)
- `skills/cv-create/references/formatter-emission.md` — Color picker contract section (added 2026-05-25)
- `scripts/boilerplate_emit.js` — `_resolveTheme` stub now emitted in boilerplate (2026-05-25)

**Validator:** `scripts/validate.sh` greps every `<splunk-color-picker name="{{VIZ_NAMESPACE}}.<key>">` in `formatter.html` and confirms `opt("<key>"` exists in `visualization_source.js` → FAIL on mismatch.

---

## Correction 3 — Drillable elements MUST set `cursor = "pointer"` on hover

**Source:** WWF Field Ops 2026-05-25 + prior memory `feedback_canvas_pointer_cursor_on_hover.md`

If `_onClick` wires a drilldown, `_onMouseMove` MUST manage `this._canvas.style.cursor`:

```javascript
_onMouseMove: function(e) {
    // ... hit-test ...
    if (hit) {
        this._canvas.style.cursor = "pointer";
        return;
    }
    this._canvas.style.cursor = "default";
}
```

Without this, drilldowns are invisible — users don't discover them until they accidentally click. The cursor IS the affordance.

**Where it lives:** `skills/cv-create/references/canvas-port-rules.md` — Rule 6 sub-rule (added 2026-05-25).

---

## Correction 4 — NEVER call `invalidateUpdateView()` inside `requestAnimationFrame`

**Source:** WWF Field Ops 2026-05-25 (Patrol Coverage panel: "Maximum call stack size exceeded")

`SplunkVisualizationBase.invalidateUpdateView()` calls `updateView` **synchronously** in several Splunk versions. Combining it with `requestAnimationFrame` produces re-entrant render loops that blow the call stack on certain code paths (drilldown click during animation, reflow during pulse, theme switch during animation).

Use the cached-config pattern instead:

```javascript
// In updateView, cache:
this._lastConfig = config;

// In animation RAF callback, re-call directly:
this._animationFrameId = requestAnimationFrame(function() {
    self._animationFrameId = null;
    if (self._lastGoodData && self._lastConfig) {
        self.updateView(self._lastGoodData, self._lastConfig);
    }
});
```

**Where it lives:** `skills/cv-create/references/canvas-port-rules.md` — Rule 4 rewritten (2026-05-25).
**Validator:** `scripts/validate.sh` greps for `invalidateUpdateView` inside `requestAnimationFrame` callback → FAIL.

---

## Correction 5 — `updateView` MUST guard against empty data shapes

**Source:** WWF Field Ops 2026-05-25 (Active Collars panel: "Cannot read properties of undefined (reading 'collars_online')")

Splunk's framework may invoke `updateView(data, config)` with `{}` (empty object — truthy, no `rows`, no `colIdx`) during dashboard init, theme switches, or token-triggered re-renders. The old guard `if (!data)` doesn't catch this and the downstream `_layout` throws on `data.colIdx[fieldName]`.

Required guard:

```javascript
if (!data || !data.rows || data.rows.length === 0 || !data.colIdx) {
    if (this._lastGoodData) data = this._lastGoodData;
    else return;
}
```

Plus `_layout` should default `rows = data.rows || []` and `ci = data.colIdx || {}` for belt-and-suspenders.

**Where it lives:**
- `skills/cv-create/references/canvas-port-rules.md` — Rule 8 (added 2026-05-25)
- `scripts/boilerplate_emit.js` — updateView guard hardened (2026-05-25)

---

## Correction 6 — preview.png MUST be per-viz-type silhouette, not a single letter

**Source:** WWF Field Ops 2026-05-25 (Splunk viz picker showed 14 identical letter-cards)

The v6 "simplification" of `drawSilhouette()` to render `letter + accent bar` for every viz produced visually indistinguishable previews. Restored per-type rendering using existing `detectVizType()` / `@viz-type` annotation: gauge → arc, bars → bars, line → sparkline, timeline → lanes, grid → heatmap matrix, kpi → big number, progress → bar, scatter → dots, network → hub+spokes, radar → polygon.

**Where it lives:** `scripts/generate_assets.js` — `drawSilhouette()` + 10 per-type `_draw*` helpers (rewritten 2026-05-25).

---

## Process note (Finding 4 from HANDOVER-skill-improvements.md)

The user has been discovering corrections, writing them to personal memory, and the plugin docs have continued to teach the wrong thing. Going forward:

1. **This file is the source of truth** — referenced from every `cv-*/SKILL.md` "before you start" section.
2. **Validator enforces what this file says** — every correction here should have a corresponding grep check in `scripts/validate.sh`.
3. **Plugin release checklist:** before a version bump, walk through user memory entries tagged `feedback_*` and confirm each is reflected here AND in the relevant reference doc.
