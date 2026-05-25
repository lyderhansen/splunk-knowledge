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

## Correction 6 — preview.png is owned by Pillow, NOT pixel-grid JS

**Source:** WWF Field Ops 2026-05-25 (Splunk viz picker showed 14 identical letter-cards, then 3 duplicate KPI tiles after first JS rewrite)

**Two iterations of this correction:**

**Iteration 1 (2026-05-25 morning):** Restored per-type JS silhouettes in `generate_assets.js drawSilhouette()` with 10 helper functions (gauge → arc, bars → bars, line → sparkline, etc.). This fixed the 14-identical-letter problem but produced new duplicates: same-type vizs (two KPIs, two grids) rendered identically because helpers used hardcoded geometry.

**Iteration 2 (2026-05-25 afternoon, current):** Ported the Pillow-based `generate_previews.py` from `splunk-viz-packs/skills/vp-create/scripts/` (originally Phase 41 of vp-create). Brings:
- **Real TrueType fonts** (Inter-Regular.ttf bundled in `scripts/fonts/`) — readable text, not 5x7 bitmap glyphs
- **3-tier detection cascade**: `// @viz-type` annotation → Canvas API pattern scan (`ctx.arc` count, `fillRect` count, nested `for` loops, large-font `fillText`) → keyword fallback
- **Hash-seeded geometry per viz_name** in `drawBars`, `drawLine`, `drawTimeline`, `drawHeatmap` — same-type vizs render distinctly
- **drawGeneric fallback** uses viz name as auto-sized text + corner motif from keyword hint, so every viz is guaranteed visually unique
- **Pillow auto-install** with graceful fallback (`--legacy-previews` flag on `generate_assets.js`) when offline

**Where it lives:**
- `scripts/generate_previews.py` — Pillow-based, canonical (NEW 2026-05-25)
- `scripts/fonts/Inter-Regular.ttf` + `OFL.txt` — bundled font (NEW 2026-05-25)
- `scripts/generate_assets.js` — now skips previews by default; `--legacy-previews` flag re-enables JS rendering as fallback
- `skills/cv-build/SKILL.md` Step 3 — documents the two-script flow + the `@viz-type` annotation requirement

**Build order:** `python3 generate_previews.py` first → if exits 2 (Pillow install failed), then `node generate_assets.js --legacy-previews`. Always run `node generate_assets.js` (without flag) for appIcon + bg_gradient regardless.

**Agent contract:** `cv-create` MUST emit `// @viz-type: <type>` as line 1 of every `visualization_source.js`. Valid types: `gauge`, `bars`, `line`, `timeline`, `kpi`, `grid`, `heatmap`, `table`, `ring`, `donut`, `scatter`, `network`. Without the annotation, the script falls back to Canvas-API pattern detection (Tier 2) or filesystem keyword matching (Tier 3) and may misclassify.

---

## Process note (Finding 4 from HANDOVER-skill-improvements.md)

The user has been discovering corrections, writing them to personal memory, and the plugin docs have continued to teach the wrong thing. Going forward:

1. **This file is the source of truth** — referenced from every `cv-*/SKILL.md` "before you start" section.
2. **Validator enforces what this file says** — every correction here should have a corresponding grep check in `scripts/validate.sh`.
3. **Plugin release checklist:** before a version bump, walk through user memory entries tagged `feedback_*` and confirm each is reflected here AND in the relevant reference doc.
