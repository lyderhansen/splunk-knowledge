# Formatter Patterns

These templates have the exact syntax Splunk requires. Copy them and fill in
only the `{FILL}` parts. Getting ANY attribute wrong causes silent failures.

## Templates — copy these exactly

### Text input

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.{FILL}" value="{FILL}">
    </splunk-text-input>
</splunk-control-group>
```

### Radio toggle

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.{FILL}" value="{FILL}">
        <option value="true">{FILL}</option>
        <option value="false">{FILL}</option>
    </splunk-radio-input>
</splunk-control-group>
```

### Series color picker (type=splunkCategorical)

Use for **series1Color through series5Color** — data series pickers where the user benefits
from Splunk's full 20+ categorical palette in addition to brand swatches.

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.{FILL}" type="splunkCategorical" value="{FILL}">
        <!-- Populate 6-8 brand colors from theme.js DARK: accent, series[0-4], bg, panel. Min 6 per picker. -->
        <!-- Users also get Splunk's full 20+ categorical palette via splunkCategorical. -->
        <splunk-color>#FILL_ACCENT</splunk-color>
        <splunk-color>#FILL_S1</splunk-color>
        <splunk-color>#FILL_S2</splunk-color>
        <splunk-color>#FILL_S3</splunk-color>
        <splunk-color>#FILL_S4</splunk-color>
        <splunk-color>#FILL_S5</splunk-color>
        <splunk-color>#FILL_BG</splunk-color>
        <splunk-color>#FILL_PANEL</splunk-color>
    </splunk-color-picker>
</splunk-control-group>
```
```html
<!-- Example: theme.js DARK hex values filled in (Spotify-inspired) -->
<splunk-color-picker name="{{VIZ_NAMESPACE}}.series1Color" type="splunkCategorical" value="#1DB954">
    <splunk-color>#1DB954</splunk-color><!-- accent -->
    <splunk-color>#2D46B9</splunk-color><!-- series[0] -->
    <splunk-color>#E91E8C</splunk-color><!-- series[1] -->
    <splunk-color>#FF6437</splunk-color><!-- series[2] -->
    <splunk-color>#FAE62D</splunk-color><!-- series[3] -->
    <splunk-color>#27856A</splunk-color><!-- series[4] -->
    <splunk-color>#121212</splunk-color><!-- bg -->
    <splunk-color>#282828</splunk-color><!-- panel -->
</splunk-color-picker>
```

Migration note: Existing generated vizs with `type="custom"` on series pickers still work but
only show the brand swatches. Regenerating the formatter updates the type to splunkCategorical.

### Brand/accent color picker (type=custom)

Use for **accentColor, backgroundColor, fontColor**, and any single-brand-value picker where
the full Splunk categorical palette would be confusing (these need specific brand defaults,
not a data-series palette).

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.{FILL}" type="custom" value="{FILL}">
        <!-- Populate 6-8 brand colors from theme.js DARK: accent, series[0-4], bg, panel. Min 6 per picker. -->
        <splunk-color>#FILL_ACCENT</splunk-color>
        <splunk-color>#FILL_S1</splunk-color>
        <splunk-color>#FILL_S2</splunk-color>
        <splunk-color>#FILL_S3</splunk-color>
        <splunk-color>#FILL_S4</splunk-color>
        <splunk-color>#FILL_S5</splunk-color>
        <splunk-color>#FILL_BG</splunk-color>
        <splunk-color>#FILL_PANEL</splunk-color>
    </splunk-color-picker>
</splunk-control-group>
```
### Theme selector (MUST default to "auto")

```html
<splunk-control-group label="Theme" help="Auto detects dashboard theme">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto">
        <option value="auto">Auto</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
    </splunk-radio-input>
</splunk-control-group>
```

### Accent intensity (D-07: controls glow and shadow strength only)

```html
<splunk-control-group label="Accent intensity" help="Highlight glow multiplier (0=off, 50=default, 100+=extreme). Values above 100 amplify glow beyond the standard range.">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.accentIntensity" value="50">
    </splunk-text-input>
</splunk-control-group>
```

### Section wrapper

```html
<form class="splunk-formatter-section" section-label="{FILL}">
    <!-- controls here -->
</form>
```

### Drilldown field

The drilldown field tells the viz which SPL column value to pass when the user clicks a row, bar,
or segment. Clicking a viz element sends this field's value to downstream panels via token
substitution or to a drilldown URL. Without it, clicks do nothing.

```html
<splunk-control-group label="Drilldown field" help="SPL field name passed on click -- e.g. 'host' sends the clicked row's host value to downstream panels">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.drilldownField" value="">
    </splunk-text-input>
</splunk-control-group>
```

Add to the `Interaction` or `Data configurations` section. Every viz with clickable elements
(tables, leaderboards, bars, donuts, status chips) should include this control. The JS
`_hitTest` function reads the `drilldownField` value to build `drilldownData`.

### Comma-separated text input (status value mapping)

Use for settings where the user provides a list of matching strings, such as status tier mapping.
The JS side splits on comma and trims whitespace:
`val.split(',').map(function(s){return s.trim().toLowerCase();})`.

```html
<splunk-control-group label="{FILL} values" help="Comma-separated list of field values that map to this status (e.g. ok,healthy,active,up)">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.{FILL}Values" value="{FILL}">
    </splunk-text-input>
</splunk-control-group>
```

Matching is case-insensitive. Order does not matter. Unmatched values render as neutral/informational.
See viz-blueprints.md Status Chip and Status Matrix sections for the three-tier status pattern.

## Accent Architecture (Phase 23 — CP-01/CP-02/CP-03)

Four rules govern how color pickers and accent color are used across all vizs:

- **(CP-01)** Every `<splunk-color-picker>` ships with 6-8 `<splunk-color>` brand swatches from `theme.js` DARK: `accent`, `series[0-4]`, `bg`, `panel`. This is the minimum preset count per picker.
- **(CP-02)** WCAG AA contrast baseline — `LIGHT.textFaint` (`#6B7080`) is the minimum-contrast label token; see theme-template.md THM-02 for the full contrast table.
- **(CP-03)** `accentColor` is for hover/glow/selection ONLY — never as a solid `ctx.fillStyle` for data bars, arcs, or area fills. Place the `accentColor` picker in the `Effects` section, not `Color and style`.
- **Series colors:** data series fills use `getSeriesColor(i, t)` from `theme.js`, NOT `t.accent`. Single-value KPI hero arcs may use `t.accent` as the primary fill.

## WRONG patterns — broken if you see these

```
WRONG: name="myapp.myviz.field"       → MUST be name="{{VIZ_NAMESPACE}}.field"
WRONG: default="value"                 → MUST be value="value"
WRONG: series picker without type=     → series1-5 pickers MUST use type="splunkCategorical"
WRONG: accentColor/bgColor without type → brand/accent pickers MUST use type="custom"
WRONG: <form>                          → MUST add class="splunk-formatter-section" section-label="..."
WRONG: themeMode value="dark"          → MUST be value="auto"
NOTE:  accentColor picker belongs in the "Color and style" section. Controls glow/highlight overlay only — never solid fill; used ONLY inside withAlpha(). (Phase 23 CP-03)
NOTE:  fontColor/bgColor controls ARE correct here (Phase 18 D-11 overrides the older D-03 guidance in this file)
WRONG: hardcoded if (status === 'ok') → MUST read comma-separated statusOkValues from formatter
                                         and match case-insensitively. Hardcoded status strings
                                         break when SPL returns 'active', 'healthy', or numeric
                                         severity levels.
```

## Section structure

Every viz uses ONLY these EXACT `section-label` values (casing and plural matter): `Data configurations` · `Data display` · `Color and style`. Dashboard Studio merges Classic formatter sections into its own config panel keyed by `section-label` and renders ONLY these three groups — any other label (Effects, Columns, Coloring, Appearance, ...) is dropped or duplicated, so the controls look "missing" in Studio. Simple XML renders any label as a tab, so the same formatter looks complete in SXML and broken in DS. **This applies to ANY Classic custom viz embedded in DS, including hand-authored vizs not produced by this skill.** Never create a 4th section — fold effect/animation toggles into "Color and style".

1. **NO `Data configurations` section for most vizs.** Field binding is via `formatData()` column-index map. Only single-value and generic table vizs get a single optional field input with empty default.
2. `Data display` — labels, units, toggles, decimals
3. `Color and style` — themeMode, series color pickers (1-5), seriesColorsOverflow, fieldColorMap, accentIntensity, the accentColor picker, AND all mood effect toggles (showAmbientLight, showVignette, showGlow). accentColor is ONLY used inside withAlpha() — never ctx.fillStyle = accentColor directly. Default toggles to "true"; user can disable per effect. **Note: showGlassPanel is BANNED — Dashboard Studio rectangles handle panel chrome. Do NOT add it.**

> **Data binding rule (D-01):** Most vizs do NOT have a "Data configurations" formatter section.
> The `formatData()` method builds a `colIdx` map from `data.fields` — vizs access columns by
> name, not position. The data contract is `search_fragment` in visualizations.conf (see conf-templates.md).
> EXCEPTION: single-value and generic table vizs may include ONE optional `field` text input
> with an empty `value=""` default.

Add `help=` text only on non-obvious controls (accentIntensity, effect toggles). Self-explanatory controls (Theme, Accent color) do not need help text. (D-13)

| Wrong | Right |
|---|---|
| `"Data Configuration"` (singular, capital C) | `"Data configurations"` |
| `"Data Display"` (capital D) | `"Data display"` |
| `"Color and Style"` (capital S) | `"Color and style"` |
| `"Effects"`, `"Visual effects"`, or `"Mood effects"` | `"Color and style"` (no separate effects section — DS drops it) |

Structure rules:
- No wrapper `<div>` around forms — bare `<form>` elements only
- No nested `<form>` inside `<form>`
- Every `<splunk-control-group>` MUST have `help="..."` attribute

```html
<form class="splunk-formatter-section" section-label="Data configurations">
    <!-- text inputs for field name mappings -->
</form>
<form class="splunk-formatter-section" section-label="Data display">
    <!-- labels, units, toggles, decimals -->
</form>
<form class="splunk-formatter-section" section-label="Color and style">
    <!-- themeMode, series color pickers (1-5), seriesColorsOverflow, fieldColorMap, accentIntensity,
         accentColor picker, and mood effect toggles: showAmbientLight, showVignette, showGlow -->
</form>
```

## Field defaults — match demo CSV columns

Every text input MUST have a non-empty `value=` that matches a real column name
from the demo lookup CSV. Empty defaults cause the viz to appear broken immediately.

Splunk does NOT send formatter defaults on first load. The `value=` attribute is
the only source of truth until the user opens the Format panel.

```html
<!-- WRONG — viz renders blank in ad-hoc search, fields show empty -->
<splunk-text-input name="{{VIZ_NAMESPACE}}.trackField" value="">
<splunk-text-input name="{{VIZ_NAMESPACE}}.artistField" value="">

<!-- RIGHT — defaults match demo CSV columns, viz works immediately -->
<splunk-text-input name="{{VIZ_NAMESPACE}}.trackField" value="track_name">
<splunk-text-input name="{{VIZ_NAMESPACE}}.artistField" value="artist">
```

**Rule:** EVERY formatter setting must have a `value="..."` that matches the JS
`getOption()` fallback. Field name settings must default to the demo CSV column names.
Color settings must default to the theme accent. No empty `value=""` on any setting
except free-text labels.

## Reading formatter values in JS — getOption helper

Dashboard Studio may pass formatter-changed values as short keys (without namespace)
while initial JSON values use the full namespace. Direct `config[ns + 'key']` misses
the short-key path. Use `getOption` for EVERY config read. No exceptions.

```javascript
function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}
```

## Full formatter example

A complete formatter.html for a KPI viz (3 sections, 10 controls). This shows the
target pattern — add or remove controls per viz type using viz-blueprints.md Settings:
list as your guide (D-01, D-04).

Note: This example shows 10 controls (3 sections). Add or remove controls per viz type
using viz-blueprints.md Settings: list as your guide (D-01, D-04).

```html
<!-- No Data configurations section — KPI uses formatData() column indexing. search_fragment is the data contract. -->

<form class="splunk-formatter-section" section-label="Data display">
    <splunk-control-group label="Label" help="Display label for this KPI">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.label" value="Value">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Unit suffix" help="Unit shown after value (e.g. ms, %)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.unit" value="">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Decimals" help="Number of decimal places (-1 = auto)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.decimals" value="-1">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Show delta" help="Show trend arrow below value">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.showDelta" value="false">
            <option value="true">Yes</option>
            <option value="false">No</option>
        </splunk-radio-input>
    </splunk-control-group>
</form>

<form class="splunk-formatter-section" section-label="Color and style">
    <splunk-control-group label="Theme" help="Auto detects dashboard theme">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto">
            <option value="auto">Auto</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Background color" help="Panel background color">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.backgroundColor" type="custom" value="#1A1D24">
            <splunk-color>#1A1D24</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Text color" help="Primary text color for labels and values">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.fontColor" type="custom" value="#FFFFFF">
            <splunk-color>#FFFFFF</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Series 1" help="Color for first data series">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.series1Color" type="splunkCategorical" value="#0077B6">
            <splunk-color>#0077B6</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Series 2" help="Color for second data series">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.series2Color" type="splunkCategorical" value="#00B4D8">
            <splunk-color>#00B4D8</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Series 3" help="Color for third data series">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.series3Color" type="splunkCategorical" value="#90E0EF">
            <splunk-color>#90E0EF</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Series 4" help="Color for fourth data series">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.series4Color" type="splunkCategorical" value="#CAF0F8">
            <splunk-color>#CAF0F8</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Series 5" help="Color for fifth data series">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.series5Color" type="splunkCategorical" value="#ADE8F4">
            <splunk-color>#ADE8F4</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Additional series colors" help="Comma-separated hex colors for series 6+ (e.g. #FF6600,#33AA00)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.seriesColorsOverflow" value="">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Field color map" help="field=color pairs (e.g. critical=#FF4444,warning=#FFB800)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.fieldColorMap" value="">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Accent intensity" help="Highlight glow multiplier (0=off, 50=default, 100+=extreme). Values above 100 amplify glow beyond the standard range.">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.accentIntensity" value="50">
        </splunk-text-input>
    </splunk-control-group>
    <!-- accentColor + mood effect toggles live HERE, inside "Color and style" — NOT a separate "Effects" section (DS drops non-standard section-labels) -->
    <splunk-control-group label="Accent color" help="Glow and highlight overlay color — used only in withAlpha() for hover, glow halo, and selection ring. Never a solid fill.">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.accentColor" type="custom" value="#FILL_ACCENT">
            <!-- Populate 6-8 brand colors from theme.js DARK palette -->
            <splunk-color>#FILL_ACCENT</splunk-color>
            <splunk-color>#FILL_S1</splunk-color>
            <splunk-color>#FILL_S2</splunk-color>
            <splunk-color>#FILL_S3</splunk-color>
            <splunk-color>#FILL_S4</splunk-color>
            <splunk-color>#FILL_S5</splunk-color>
            <splunk-color>#FILL_BG</splunk-color>
            <splunk-color>#FILL_PANEL</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Ambient glow" help="Background light source effect">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.showAmbientLight" value="true">
            <option value="true">On</option>
            <option value="false">Off</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Vignette" help="Edge darkening to focus eye on data">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.showVignette" value="false">
            <option value="true">On</option>
            <option value="false">Off</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Glow" help="Accent glow on hero value and highlights">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.showGlow" value="true">
            <option value="true">On</option>
            <option value="false">Off</option>
        </splunk-radio-input>
    </splunk-control-group>
</form>
```

### Animation section

Add these controls inside the "Color and style" section (never a separate section — DS drops non-standard `section-label`s). All animation controls are independently toggleable per D-03/D-05/D-06.

```html
<form class="splunk-formatter-section" section-label="Animation">
    <splunk-control-group label="Entrance animation" help="Animate on first render">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.showEntrance" value="true">
            <option value="true">On</option>
            <option value="false">Off</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Critical pulse" help="LED pulse on critical/error states">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.flashCritical" value="false">
            <option value="true">On</option>
            <option value="false">Off</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Hover highlight" help="Highlight row/segment on mouse hover">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.showHoverEffect" value="true">
            <option value="true">On</option>
            <option value="false">Off</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Animation speed" help="Controls entrance and transition speed">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.animationSpeed" value="normal">
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
        </splunk-radio-input>
    </splunk-control-group>
</form>
```

Optional 5th control (add when brand brief mentions real-time data):

```html
    <splunk-control-group label="Re-animate on refresh" help="Replay entrance animation when data updates">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.reanimateOnRefresh" value="false">
            <option value="true">On</option>
            <option value="false">Off</option>
        </splunk-radio-input>
    </splunk-control-group>
```

### Animation opt() read pattern

In `updateView`, alongside existing opt() calls — all 4 standard reads plus speed multiplier and prefers-reduced-motion override:

```javascript
var showEntrance = opt('showEntrance', 'true') === 'true';
var flashCritical = opt('flashCritical', 'false') === 'true';
var showHoverEffect = opt('showHoverEffect', 'true') === 'true';
var animSpeed = opt('animationSpeed', 'normal');
var speedMult = animSpeed === 'slow' ? 1.5 : animSpeed === 'fast' ? 0.6 : 1.0;
var accentColor = hexFromSplunk(opt('accentColor', ''), t.accent); // pass as primitive to animation helpers (AF-02)

// D-03: prefers-reduced-motion override — kills entrance + pulse, keeps hover (functional)
var reducedMotion = false;
try {
    reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch (e) {}

if (reducedMotion) {
    showEntrance = false;
    flashCritical = false;
    // showHoverEffect stays ON — functional feedback, not decorative
}
```

### Threshold colors (3-band RAG)

**Recommended for:** KPI, Ring Gauge, Needle Gauge, Status Matrix, Status Chip. Claude may add
to any viz type where value-to-color mapping is meaningful.

**Formatter HTML (add to `Color and style` or a dedicated `Thresholds` section):**

```html
<splunk-control-group label="Threshold field" help="SPL field to evaluate for status color (default: value)">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.thresholdField" value="value">
    </splunk-text-input>
</splunk-control-group>
<splunk-control-group label="Low boundary" help="Values below this are in the low band">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.thresholdLow" value="50">
    </splunk-text-input>
</splunk-control-group>
<splunk-control-group label="High boundary" help="Values above this are in the high band">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.thresholdHigh" value="90">
    </splunk-text-input>
</splunk-control-group>
<splunk-control-group label="Direction" help="Whether high values are good (green) or bad (red)">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.thresholdDirection" value="high_good">
        <option value="high_good">High = Good</option>
        <option value="high_bad">High = Bad</option>
    </splunk-radio-input>
</splunk-control-group>
<splunk-control-group label="Low color" help="Color for lowest band">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.thresholdColorLow" type="custom" value="#EF4444">
        <splunk-color>#EF4444</splunk-color>
        <splunk-color>#F59E0B</splunk-color>
        <splunk-color>#22C55E</splunk-color>
    </splunk-color-picker>
</splunk-control-group>
<splunk-control-group label="Mid color" help="Color for middle band">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.thresholdColorMid" type="custom" value="#F59E0B">
        <splunk-color>#EF4444</splunk-color>
        <splunk-color>#F59E0B</splunk-color>
        <splunk-color>#22C55E</splunk-color>
    </splunk-color-picker>
</splunk-control-group>
<splunk-control-group label="High color" help="Color for highest band">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.thresholdColorHigh" type="custom" value="#22C55E">
        <splunk-color>#EF4444</splunk-color>
        <splunk-color>#F59E0B</splunk-color>
        <splunk-color>#22C55E</splunk-color>
    </splunk-color-picker>
</splunk-control-group>
<splunk-control-group label="Color icon" help="Apply threshold color to icon element">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.colorIcon" value="true">
        <option value="true">Yes</option>
        <option value="false">No</option>
    </splunk-radio-input>
</splunk-control-group>
<splunk-control-group label="Color label" help="Apply threshold color to text label">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.colorLabel" value="false">
        <option value="true">Yes</option>
        <option value="false">No</option>
    </splunk-radio-input>
</splunk-control-group>
<splunk-control-group label="Color glow" help="Apply threshold color to glow effect">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.colorGlow" value="true">
        <option value="true">Yes</option>
        <option value="false">No</option>
    </splunk-radio-input>
</splunk-control-group>
<splunk-control-group label="Color background" help="Apply threshold color to panel background tint">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.colorBg" value="false">
        <option value="true">Yes</option>
        <option value="false">No</option>
    </splunk-radio-input>
</splunk-control-group>
```

**JS opt() read pattern (in `updateView`, after theme/opt setup):**

```javascript
// Threshold 3-band RAG — direction-aware color lookup
var thresholdLow  = parseFloat(opt('thresholdLow',  '50'), 10);
var thresholdHigh = parseFloat(opt('thresholdHigh', '90'), 10);
var thresholdDir  = opt('thresholdDirection', 'high_good');
var tcLow  = hexFromSplunk(opt('thresholdColorLow',  ''), '#EF4444');
var tcMid  = hexFromSplunk(opt('thresholdColorMid',  ''), '#F59E0B');
var tcHigh = hexFromSplunk(opt('thresholdColorHigh', ''), '#22C55E');

// direction swap: when high_bad, high values are red and low values are green
var bandLow  = thresholdDir === 'high_bad' ? tcHigh : tcLow;
var bandMid  = tcMid;
var bandHigh = thresholdDir === 'high_bad' ? tcLow  : tcHigh;

function getThresholdColor(val) {
    var n = parseFloat(val);
    if (isNaN(n)) { return bandMid; }
    if (n < thresholdLow)  { return bandLow; }
    if (n > thresholdHigh) { return bandHigh; }
    return bandMid;
}

// Per-element toggles
var colorIcon  = opt('colorIcon',  'true')  === 'true';
var colorLabel = opt('colorLabel', 'false') === 'true';
var colorGlow  = opt('colorGlow',  'true')  === 'true';
var colorBg    = opt('colorBg',    'false') === 'true';

// Usage: var statusColor = getThresholdColor(numericValue);
// Then: if (colorIcon)  { /* draw icon with statusColor */ }
//       if (colorLabel) { ctx.fillStyle = statusColor; /* draw label */ }
//       if (colorGlow)  { ctx.shadowColor = withAlpha(statusColor, 0.6); }
//       if (colorBg)    { ctx.fillStyle = withAlpha(statusColor, 0.08); /* bg tint */ }
```

### Series color opt() read patterns (Phase 18 D-10/D-12/D-13)

In `updateView`, after the theme/opt setup, read series color controls:

```javascript
// Series colors — hexFromSplunk() required on ALL color picker reads
var s1 = hexFromSplunk(opt('series1Color', ''), t.series[0] || t.accent);
var s2 = hexFromSplunk(opt('series2Color', ''), t.series[1] || t.accent);
var s3 = hexFromSplunk(opt('series3Color', ''), t.series[2] || t.accent);
var s4 = hexFromSplunk(opt('series4Color', ''), t.series[3] || t.accent);
var s5 = hexFromSplunk(opt('series5Color', ''), t.series[4] || t.accent);

// Overflow colors (comma-separated, for series 6+)
var overflowRaw = opt('seriesColorsOverflow', '');
var overflowColors = overflowRaw
    ? overflowRaw.split(',').map(function(c) { return hexFromSplunk(c.trim(), ''); }).filter(Boolean)
    : [];

// Field color map (key=value pairs — e.g. critical=#FF4444,warning=#FFB800)
// T-18-05: hexFromSplunk() on the color half strips invalid chars
var fieldMapRaw = opt('fieldColorMap', '');
var fieldColorMap = {};
if (fieldMapRaw) {
    fieldMapRaw.split(',').forEach(function(pair) {
        var parts = pair.split('=');
        if (parts.length === 2) {
            fieldColorMap[parts[0].trim().toLowerCase()] = hexFromSplunk(parts[1].trim(), '');
        }
    });
}

// Helper: get color for series index i (uses series pickers then overflow)
function getSeriesColor(i, fallback) {
    var pickers = [s1, s2, s3, s4, s5];
    if (i < pickers.length) return pickers[i] || fallback;
    var oi = i - pickers.length;
    return (overflowColors[oi]) || fallback;
}
```

**Note on brand swatches (6-8 rule):** Every `<splunk-color-picker>` MUST ship with 6-8 `<splunk-color>` elements from `theme.js` DARK: `accent`, `series[0]-[4]`, `bg`, `panel`. The Series 1-5 pickers in the Full formatter example also need 6-8 swatches each at generation time. Replace placeholder hex values with real brand palette values.
