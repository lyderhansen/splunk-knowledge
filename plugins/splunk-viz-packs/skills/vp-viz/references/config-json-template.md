# config.json Template (Extension API)

Extension API equivalent of formatter.html — declarative JSON replaces raw HTML. Copy the
template and fill only the `{{PLACEHOLDER}}` parts. The `{{VIZ_NAMESPACE}}` footgun is
eliminated: bare option names are used everywhere.

**Confirmed editor types (Splunk 10.4.2604):** editor.color, editor.text, editor.number,
editor.checkbox. `editor.select` and `editor.radio` are NOT confirmed — use `editor.text`
as a fallback for dropdowns.

---

## Complete config.json Template

```json
{
    "showTitleAndDescription": true,
    "includeInToolbar": true,
    "includeInVizSwitcher": true,
    "showDrilldown": false,
    "hasEventHandlers": false,
    "canSetTokens": [],
    "config": {
        "name": "{{VIZ_LABEL}}",
        "description": "{{VIZ_DESCRIPTION}}",
        "category": "Custom",
        "dataContract": { "requiredDataSources": ["primary"] },
        "size": { "initialWidth": {{INITIAL_WIDTH}}, "initialHeight": {{INITIAL_HEIGHT}} },
        "optionsSchema": {
            "themeMode": { "type": "string", "default": "auto" }
            {{OPTIONS_SCHEMA_ENTRIES}}
        },
        "editorConfig": [ {{EDITOR_CONFIG_SECTIONS}} ]
    }
}
```

| Placeholder | Fill with |
|---|---|
| `{{VIZ_LABEL}}` | Human-readable viz name |
| `{{VIZ_DESCRIPTION}}` | One-sentence description |
| `{{INITIAL_WIDTH}}` / `{{INITIAL_HEIGHT}}` | Default panel size in pixels (e.g. 500 / 300) |
| `{{OPTIONS_SCHEMA_ENTRIES}}` | Comma-separated schema entries (see below) |
| `{{EDITOR_CONFIG_SECTIONS}}` | Section objects array (see below) |

---

## optionsSchema Type Reference

| JSON type | Schema shape | Maps to editor |
|---|---|---|
| `string` | `{ "type": "string", "default": "#4e9cf5" }` | editor.color or editor.text |
| `number` | `{ "type": "number", "default": 42 }` | editor.number (or editor.text) |
| `boolean` | `{ "type": "boolean", "default": true }` | editor.checkbox |

Every editorConfig `"option": "key"` must have a matching `"key": { type, default }` in
optionsSchema — otherwise the value is never stored.

---

## Editor Type Templates (matched pairs)

Each block shows the optionsSchema entry + the editorConfig layout item that binds to it.

### editor.color
```json
"accentColor": { "type": "string", "default": "#4e9cf5" }
{ "editor": "editor.color", "label": "Accent color", "option": "accentColor" }
```

### editor.text
```json
"label": { "type": "string", "default": "Value" }
{ "editor": "editor.text", "label": "Display label", "option": "label" }
```

### editor.number
```json
"accentIntensity": { "type": "number", "default": 50 }
{ "editor": "editor.number", "label": "Accent intensity (0-100+)", "option": "accentIntensity" }
```

### editor.checkbox
```json
"showDelta": { "type": "boolean", "default": false }
{ "editor": "editor.checkbox", "label": "Show delta arrow", "option": "showDelta" }
```

---

## Section Grouping

Each editorConfig element is a labeled section. `layout` is array-of-arrays; each inner array
is one row. Match the 3-section structure from Classic formatter.html. Add an `Animation` section with `showEntrance`/`flashCritical`/`showHoverEffect`/`animationSpeed` controls when the viz includes animation (see formatter-patterns.md Animation section).

```json
"editorConfig": [
    {
        "label": "Data display",
        "layout": [
            [ { "editor": "editor.text",     "label": "Display label",        "option": "label" } ],
            [ { "editor": "editor.number",   "label": "Decimals (-1 = auto)", "option": "decimals" } ],
            [ { "editor": "editor.checkbox", "label": "Show delta arrow",     "option": "showDelta" } ]
        ]
    },
    {
        "label": "Color and style",
        "layout": [
            [ { "editor": "editor.text",   "label": "Theme (auto/dark/light)",  "option": "themeMode" } ],
            [ { "editor": "editor.color",  "label": "Series 1 color",           "option": "series1Color" } ],
            [ { "editor": "editor.color",  "label": "Series 2 color",           "option": "series2Color" } ],
            [ { "editor": "editor.number", "label": "Accent intensity (0-100+)","option": "accentIntensity" } ]
        ]
    },
    {
        "label": "Effects",
        "layout": [
            [ { "editor": "editor.color",    "label": "Accent color",    "option": "accentColor" } ],
            [ { "editor": "editor.checkbox", "label": "Ambient glow",    "option": "showAmbientLight" } ],
            [ { "editor": "editor.checkbox", "label": "Glow effect",     "option": "showGlow" } ]
        ]
    }
]
```

> **NOTE (FMT-05, OPEN — do not change without verification):** This is the **Extension API** `editorConfig` path, rendered by the viz's own extension — it is NOT the Classic `formatter.html` `<form section-label>` path that Dashboard Studio merges into its three standard groups. The Classic 3-label constraint (`Data configurations` / `Data display` / `Color and style`) that forbids an "Effects" section is **NOT confirmed to apply** to Extension API `editorConfig`. Do **NOT** rename this `"Effects"` group to match the Classic rule without live verification on a Splunk 10.x Extension API instance — renaming could break a working path. The authoritative resolution is tracked in **Phase 54 / EXT-05** (runtime-verified DS-native findings indicate editorConfig labels are free; the 3-label constraint is Classic-only). Until EXT-05 lands, treat this as an open question.

---

## Drilldown Wiring

Set all three top-level flags together — `showDrilldown` alone shows UI but clicks do nothing.

```json
// Non-drilldown (default)
"showDrilldown": false, "hasEventHandlers": false, "canSetTokens": []

// Drilldown enabled
"showDrilldown": true, "hasEventHandlers": true, "canSetTokens": ["dynamic"]

// Token setting (both dynamic and static)
"showDrilldown": true, "hasEventHandlers": true, "canSetTokens": ["dynamic", "static"]
```

---

## Comparison Table: Classic formatter.html vs config.json

| Classic formatter.html | config.json equivalent | Notes |
|---|---|---|
| `<splunk-text-input>` | `editor.text` | Same purpose |
| `<splunk-color-picker type="custom">` | `editor.color` | No type attribute |
| `<splunk-color-picker type="splunkCategorical">` | `editor.color` | No categorical variant confirmed |
| `<splunk-radio-input>` | `editor.text` (fallback) | `editor.radio` not confirmed |
| `<splunk-select-input>` | `editor.text` (fallback) | `editor.select` not confirmed |
| `<form section-label="Label">` | `{ "label": "Label", "layout": [...] }` | editorConfig section |
| `name="{{VIZ_NAMESPACE}}.barColor"` | `"option": "barColor"` | **Namespace eliminated** |

**Critical improvement:** `{{VIZ_NAMESPACE}}` is fully eliminated. Bare names everywhere.
This removes the test20/test25/test26 class of silent namespace bugs.

---

## WRONG / RIGHT Patterns

```
WRONG: "option": "myapp.myviz.barColor"        (namespaced — wrong in config.json)
RIGHT: "option": "barColor"                    (bare name — namespace is eliminated)

WRONG: editorConfig control with no optionsSchema entry
RIGHT: every "option": "key" has "key": { type, default } in optionsSchema

WRONG: "showDrilldown": true, "hasEventHandlers": false
RIGHT: both showDrilldown and hasEventHandlers set true together

WRONG: "canSetTokens": [] when viz fires token-setting drilldown events
RIGHT: "canSetTokens": ["dynamic"] when viz sets tokens on click
```

---

## Reading Options in visualization.js

Options arrive as bare keys — no namespace prefix. Always provide fallbacks:

```javascript
// In render() — after addOptionsListener fires into state.options
var color     = state.options.accentColor    || '#4e9cf5';
var label     = state.options.label          || 'Value';
var decimals  = state.options.decimals       != null ? state.options.decimals : -1;
var showGlow  = state.options.showGlow       != null ? state.options.showGlow : true;
var themeMode = state.options.themeMode      || 'auto';
```

`state.options` may be empty on first render (before Format panel is opened) even if
optionsSchema defines defaults — always code defensively with `|| fallback`.

---

## Background Color Note (THM-05)

Read `state.options.backgroundColor` (or its `opts.backgroundColor` alias) exactly once at the top of `render()`, alongside the other option reads, wrapped in `hexFromSplunk()` per the B22 convention: `var bg = hexFromSplunk(opts.backgroundColor, t.bg);`. Use that single `bg` variable as the fill in every paint call that draws the canvas/panel background. Do NOT re-derive the background from `state.theme` inside the `addThemeListener` callback — both the dark and light render branches must paint with the same user-supplied value whenever the user has set one in the Format panel. Replacing `bg` with `t.bg` (or `t.panel`) inside a theme-conditional branch is the Tesla FSD 2026-05-22 failure mode and silently discards the user's brand color in the unhandled theme.

Classic equivalent: theme-template.md THM-05 (WRONG/RIGHT contrast block) + pre-code-checklist.md THM-05 line.

---

## Build Requirements (EF-01/EF-02)

`config.json` describes the Extension API viz's editor interface. The corresponding `src/visualization.js` must be bundled to IIFE format (EF-01) with `@splunk/dashboard-studio-extension` bundled into the output (EF-02, no `external` clause). See `build-mjs-template.md` for the canonical esbuild configuration that satisfies both requirements.
