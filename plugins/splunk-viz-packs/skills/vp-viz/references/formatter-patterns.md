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

### Color picker (MUST have type="custom")

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.{FILL}" type="custom" value="{FILL}">
        <splunk-color>{FILL}</splunk-color>
        <splunk-color>{FILL}</splunk-color>
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

## WRONG patterns — broken if you see these

```
WRONG: name="myapp.myviz.field"       → MUST be name="{{VIZ_NAMESPACE}}.field"
WRONG: default="value"                 → MUST be value="value"
WRONG: <splunk-color-picker value=     → MUST add type="custom"
WRONG: <form>                          → MUST add class="splunk-formatter-section" section-label="..."
WRONG: themeMode value="dark"          → MUST be value="auto"
WRONG: fontColor or bgColor controls  → Dashboard Studio owns panel-level colors (D-03).
                                         Only accentColor is a viz formatter color control.
                                         CFG-07 is satisfied by accentColor alone.
WRONG: hardcoded if (status === 'ok') → MUST read comma-separated statusOkValues from formatter
                                         and match case-insensitively. Hardcoded status strings
                                         break when SPL returns 'active', 'healthy', or numeric
                                         severity levels.
```

## Section structure

Every viz gets a minimum of 4 sections with these EXACT `section-label` values (casing matters):

1. `Data configurations` — field name mappings (text inputs)
2. `Data display` — labels, units, toggles, decimals
3. `Color and style` — themeMode, accentColor, accentIntensity, series colors
4. `Effects` — individual mood effect toggles (showAmbientLight, showVignette, showGlow, showGlassPanel). Default all to "true"; user can disable per effect.

Add `help=` text only on non-obvious controls (accentIntensity, effect toggles). Self-explanatory controls (Theme, Accent color) do not need help text. (D-13)

| Wrong | Right |
|---|---|
| `"Data Configuration"` (singular, capital C) | `"Data configurations"` |
| `"Data Display"` (capital D) | `"Data display"` |
| `"Color and Style"` (capital S) | `"Color and style"` |
| `"Visual effects"` or `"Mood effects"` | `"Effects"` |

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
    <!-- themeMode, accentColor, accentIntensity, series colors -->
</form>
<form class="splunk-formatter-section" section-label="Effects">
    <!-- individual mood effect toggles: showAmbientLight, showVignette, showGlow, showGlassPanel -->
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

A complete formatter.html for a KPI viz (4 sections, 12 controls). This shows the
target pattern — add or remove controls per viz type using viz-blueprints.md Settings:
list as your guide (D-01, D-04).

Note: This example shows 12 controls (4 sections). Add or remove controls per viz type
using viz-blueprints.md Settings: list as your guide (D-01, D-04).

```html
<form class="splunk-formatter-section" section-label="Data configurations">
    <splunk-control-group label="Value field" help="SPL column with the KPI value">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.valueField" value="value">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Delta field" help="SPL column with the comparison value">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.deltaField" value="delta">
        </splunk-text-input>
    </splunk-control-group>
</form>

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
    <splunk-control-group label="Accent color" help="Primary brand color">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.accentColor" type="custom" value="#0077B6">
            <splunk-color>#0077B6</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
    <splunk-control-group label="Accent intensity" help="Highlight glow multiplier (0=off, 50=default, 100+=extreme). Values above 100 amplify glow beyond the standard range.">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.accentIntensity" value="50">
        </splunk-text-input>
    </splunk-control-group>
</form>

<form class="splunk-formatter-section" section-label="Effects">
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

Add after the Effects section. All animation controls are independently toggleable per D-03/D-05/D-06.

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
