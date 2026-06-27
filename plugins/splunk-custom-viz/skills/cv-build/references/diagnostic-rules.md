# Diagnostic rules — 54 rules indexed by failure mode

Load this file when cv-build's validator fails OR when a viz fails to render in Splunk. Match the symptom or FAIL code to a rule. Each rule explains WHY the pattern fails and gives concrete fix steps.

This is the consolidated diagnostic reference. It is intentionally large because errors are rare but expensive when they happen — having all 54 rules in one place means the user gets actionable help on the first try.

## Symptom → rule lookup

| Symptom | Most likely rules |
|---|---|
| Script error on viz load | F9, F6, F11 |
| Blank panel, no console errors | B17, B15, B13 |
| Settings don't save in formatter | B10, B7 |
| Wrong colors / theme inversion | B20, B18, B23 |
| Color picker ignored in ad-hoc | B22 |
| Text invisible in light theme | B23 |
| "null" or "undefined" rendered as text | B21 |
| Gauge overflows panel | B8 |
| Timestamps wrong / "Invalid Date" | B19 |
| AppInspect failure | R1-R8 |
| Hover effect doesn't work | I1, I2 |
| Changes not taking effect after edit | C8 |

## FATAL — viz won't load (F1-F12)

### F1: Webpack must target ES5

Splunk's AMD environment cannot load ES2015+ syntax (const/let/arrow/template literals/destructuring/class).

**Fix:** in `webpack.config.js`:
```javascript
target: ['web', 'es5'],
output: {
  environment: {
    arrowFunction: false,
    bigIntLiteral: false,
    const: false,
    destructuring: false,
    forOf: false,
    dynamicImport: false,
    module: false
  }
}
```

### F2: Fonts must be base64 data URIs

External font URLs are blocked by Splunk's CSP. Embed fonts as base64 in `visualization.css`.

**Fix:**
```css
@font-face {
  font-family: 'Barlow Condensed';
  src: url(data:font/woff2;base64,<base64-blob>) format('woff2');
}
```

### F3: Source must be pure ES5

No `const`, `let`, `=>`, template literals, destructuring, `class`, or any ES2015+ syntax in `visualization_source.js`.

**Fix:** convert. The boilerplate emitter produces pure ES5; the agent must maintain that in `_renderDark` / `_renderLight`.

### F4: `getInitialDataParams` must use `ROW_MAJOR_OUTPUT_MODE`

Must be a METHOD that returns `{ outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE, count: 10000 }`. Not a property.

### F5: Only externalize what you import

Webpack `externals` list must match the `require()` calls in source. Mismatches cause "module not found" errors at runtime.

### F6: Source MUST use `require()`, NEVER `define()`

`build_flat.js` adds the AMD `define([...], function() { ... });` wrapper. If your source already uses `define()`, you get a double wrapper and the viz silently fails to load.

### F7: MUST use `extend({...})` object literal

`SplunkVisualizationBase.extend({ ... })` — not prototypal constructors, not ES6 classes.

### F8: Images must be bundled, never external URLs

Splunk CSP blocks external images. Embed images as base64 in CSS or include them in `appserver/static/`.

### F9: Vizs in `appserver/static/visualizations/`, NOT `default/`

The directory matters. `default/visualizations/` is for `visualizations.conf` only; the actual code goes in `appserver/static/visualizations/<viz>/`.

### F10: No jQuery — use standard DOM APIs

Dashboard Studio v2 does not expose `this.$el`. Use `this.el` directly with native DOM methods.

### F11: Webpack 5 IIFE may fail — flat AMD alternative

If using webpack, the IIFE-wrapped output can fail to load in Splunk's AMD environment. Use the `build_flat.js` flat AMD builder instead.

### F12: Formatter must use Splunk components, NEVER raw HTML

`<input>`, `<select>`, `<textarea>` raw HTML elements don't render in Splunk's formatter. Use `<splunk-text-input>`, `<splunk-select>`, `<splunk-radio-input>`, `<splunk-color-picker>`.

## BROKEN — renders but wrong (B1-B23)

### B1: Canvas font rendering requires explicit wait

If you draw text before the embedded font has loaded, you get fallback rendering. Use `document.fonts.ready.then(...)` or a `setTimeout(initialRender, 100)` after first load.

### B2: HiDPI canvas scaling is mandatory

Without `ctx.scale(dpr, dpr)` after setting `canvas.width = w * dpr`, Retina displays render blurry. The boilerplate handles this.

### B3: `getOption` helper is mandatory

Dashboard Studio v2 may pass formatter values as short keys (without namespace prefix) while initial dashboard JSON values may use full-namespace keys. Use `getOption(config, ns, key, defaultValue)`. The boilerplate emitter includes this helper.

**The probe is 3-way, in order:** (1) `ns + key` where `ns` comes from `this.getPropertyNamespaceInfo().propertyNamespace`; (2) the short namespaced form `<app_id>.<viz_name>.<key>`; (3) the bare `key`. First match wins; fall back to the default if none resolve.

**Key-form by host (read all three at runtime):**
- Dashboard Studio JSON `options`: SHORT key — bare `"<key>"` (see dashboard-transcription.md). DS prefixes the namespace before calling `updateView`.
- Classic Simple XML `<option name>`: LONG key — `display.visualizations.custom.<app_id>.<viz_name>.<key>` (see splunk-viz-canon.md).
The 3-way probe makes one viz work under both hosts.

### B4: Never read config in `formatData`

`formatData` runs once per data update; `config` may not be current. Always read config in `updateView`.

### B5: Formatter section labels + `type="custom"` on color picker

Sections MUST use `class="splunk-formatter-section"` with `section-label="..."`. Color pickers MUST have `type="custom"`. Without these, Splunk creates duplicate / mis-rendered groups.

### Symptom: Formatter controls missing in the Dashboard Studio config panel

A Classic custom viz's controls render fine in Simple XML's Format menu but do NOT appear in the Dashboard Studio config panel (or appear under a duplicate viz-name-prefixed group). The same formatter looks complete in SXML and broken in DS — that contrast is the tell.

**Cause:** a `<form class="splunk-formatter-section">` uses a `section-label` that is not one of Dashboard Studio's three standard groups. DS merges Classic formatter sections into its own panel keyed by `section-label` and renders ONLY these (case- and plural-sensitive): `Data configurations` · `Data display` · `Color and style`. Any other label (Effects, Columns, Coloring, Pagination, Appearance, ...) is dropped or duplicated.

**Fix:** rename every formatter section to exactly one of the three; fold effect/animation toggles into `Color and style`. **This applies to ANY Classic custom viz embedded in DS, including hand-authored vizs not produced by cv-create.** (Authoritative emission rule: cv-create/references/formatter-emission.md.)

### B6: Canvas shadow state leaks

`ctx.shadowBlur` and `ctx.shadowColor` persist across subsequent draws. Always reset to `0` / `'transparent'` after the glow effect.

### B7: JS defaults must match formatter `value=` (NEVER `default=`)

Splunk recognizes `value=`, not `default=`. The JS `opt(key, fallback)` fallback must match the `value=` in the formatter HTML, otherwise settings appear to "not save".

### B8: Auto-scale by default + gauge arc constraint

Hard-coded pixel sizes for gauge arcs cause overflow on narrow panels. Use `Math.min(w, h) * 0.4` style sizing.

### B9: Dashboard Studio type format

`"type": "<app_id>.<viz_name>"` — never `"custom"`, never `"viz.custom.<app_id>.<viz_name>"`, never `"splunk.custom.<app_id>.<viz_name>"`. Splunk training data uses the old Classic XML `"type": "custom"` format which is WRONG for Dashboard Studio v2.

### B10: `{{VIZ_NAMESPACE}}` in formatter — NEVER hardcoded namespace

Splunk substitutes `{{VIZ_NAMESPACE}}` at load time. Hardcoding (e.g., `name="myapp.myviz.field"`) breaks when the app is renamed or embedded.

### B11: `parseFloat` truncates string values

`parseFloat("12abc")` returns 12, not NaN. Use `safeNum(val, fallback)` which checks `isNaN()` after parseFloat.

### B12: Gauge colors must match brand

Default Splunk gauge colors (red/yellow/green) ignore brand palette. Read from `t.series` or `t.accent`.

### B13: Canvas background must use `clearRect`

`ctx.fillRect` with background color leaves artifacts at the edges. Always `ctx.clearRect(0, 0, w, h)` first, then fill if needed.

### B14: Variables in `_draw()` not accessible from sub-methods

Hoist shared variables to `this._foo` if `_onMouseMove` / `_onClick` need them. Local variables in `updateView` go out of scope.

### B15: Always include `formatData` in `extend` object

Missing `formatData` causes data to arrive as `null` in `updateView`. Boilerplate emitter includes it.

### B16: Every visual property configurable via formatter

If you hard-code a color, font size, or padding, the user can't override it without editing source. Expose via `opt(key, fallback)`.

### B17: `setupCanvas` MUST use `this.el` with `clientWidth`

`getBoundingClientRect` returns 0 for detached DOM elements. `this.el.clientWidth` works reliably. Boilerplate handles this.

### B18: Theme auto-detect via `getCurrentTheme()`

`SplunkVisualizationUtils.getCurrentTheme()` is the authoritative source. Fall back to DOM scanning only if it's unavailable. Boilerplate's `detectTheme()` handles both paths.

### B19: `new Date()` fails in sandboxed iframe

Use `Date.parse(timestamp_string)` or `parseInt(epoch_ms)` instead. The Splunk iframe sandbox blocks `new Date()` in some configurations.

### B20: Theme MUST default to `"auto"` with `detectTheme()`

Formatter `themeMode` default MUST be `"auto"`. Defaulting to `"dark"` breaks light-theme dashboards.

### B21: Always null-guard before `String()` conversion

`String(null)` returns the literal string `"null"`. Use `safeStr(val)` which returns `""` for null/empty. Boilerplate includes it.

### B22: `hexFromSplunk` — color picker returns integers not hex

Splunk's color picker delivers values as integers (e.g., `6511615`) instead of hex strings (`"#635BFF"`). Always wrap color reads: `var c = hexFromSplunk(opt('myColor', '#FFFFFF'), '#FFFFFF');`

### B23: Light theme needs independent design, not dark inversion

Light theme is NOT a dimmed dark. Effects that work on dark (carbon overlay at 0.04 opacity, ambient glow) destroy text on white. Use separate `_renderDark` / `_renderLight` paths with light-specific spec (`fills.background_light` in DESIGN-LOCK.md).

## REJECTED — fails AppInspect (R1-R8)

### R1: app.conf [package] stanza required

```ini
[package]
id = <exactly the app dir name>
check_for_updates = true
```

### R2: Version must be Major.Minor.Revision

`version = 1.0.0` — not `1.0` or `v1.0.0`.

### R3: No `local/` directory in package

`local/` is for user overrides. Apps must ship with `default/` only.

### R4: Splunk Cloud uses `sc_admin`, not `admin`

In `metadata/default.meta`, use `sc_admin` for Cloud-targeted apps.

### R5: No `outputs.conf` in apps

Outputs are configured at the Splunk instance level, not per-app.

### R6: inputs.conf — no `[tcp://]`, `[http://]`, `[udp://]` in Cloud

For Splunk Cloud, inputs are configured via the Data Manager. The app's `inputs.conf` should contain ONLY comments documenting expected inputs.

### R7: No duplicate stanzas in .conf files

Each `[stanza_name]` MUST appear exactly once per .conf file. When adding settings to an existing sourcetype in props.conf, MERGE into the existing stanza.

### R8: No macOS artifacts in archive

`.DS_Store`, `._*` files cause AppInspect failures. Always `find <app> -name '._*' -delete && find <app> -name '.DS_Store' -delete` before tar. Use `COPYFILE_DISABLE=1 tar` on macOS.

## INTERACTIVE (I1-I2)

### I1: Drilldown tokens must be consumed

If you `setToken`, a search MUST reference it. Otherwise the token is dead. Add `defaults.tokens.default.<token_name> = "*"` so the dashboard works before any click.

### I2: Event handler fields from config

`_onClick` and `_onMouseMove` MUST read field names from instance properties set in `updateView`, NEVER hardcode string literals like `'location'` or `'attack_id'`.

## COSMETIC (C1-C9)

### C1: Hover state should not jump

Use `transition: transform 0.1s` style smoothing on hover, not instant snap.

### C2: Tooltip must follow cursor

Position relative to `event.offsetX/Y`, update on every `mousemove`.

### C3: Loading state for slow data

Show a spinner or skeleton when data is loading > 300ms.

### C4: Animation must be cancellable

Always `cancelAnimationFrame(this._animationFrameId)` in `destroy()`. The boilerplate handles this.

### C5: Don't animate properties that trigger layout

`width`, `height`, `top`, `left`, `padding`, `margin` reflow the layout. Use `transform: translate()` and `opacity` only.

### C6: Reflow → invalidateUpdateView

`reflow()` (called by Splunk on resize) must call `this.invalidateUpdateView()`, not `_draw()` directly. Boilerplate handles this.

### C7: Bezier easing > linear

Linear animations feel mechanical. Use `ease-out` for entering states, `ease-in` for exits.

### C8: Build number + hard refresh after edit

Splunk caches viz JS aggressively. Increment `build = N` in app.conf and ask the user to hard-refresh (Cmd+Shift+R) after edits.

### C9: Same effects scaled by isDark, not different code

If both dark and light need a glow, define ONE glow draw function and call it with theme-appropriate parameters — don't duplicate the drawing code.

## How to use this file

When cv-build reports a FAIL or WARN, find the rule by code. Each entry has:
- One-sentence summary
- WHY it fails (so the user understands, not just memorizes)
- Concrete fix steps

If a rule references the boilerplate, the fix is "regenerate the source with `boilerplate_emit.js`". If a rule is content-specific, the fix is in the agent's `_renderDark`/`_renderLight` or in DESIGN-LOCK.md.
