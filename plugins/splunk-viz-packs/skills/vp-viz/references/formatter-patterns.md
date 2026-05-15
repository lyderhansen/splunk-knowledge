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

### Section wrapper

```html
<form class="splunk-formatter-section" section-label="{FILL}">
    <!-- controls here -->
</form>
```

## WRONG patterns — broken if you see these

```
WRONG: name="myapp.myviz.field"       → MUST be name="{{VIZ_NAMESPACE}}.field"
WRONG: default="value"                 → MUST be value="value"
WRONG: <splunk-color-picker value=     → MUST add type="custom"
WRONG: <form>                          → MUST add class="splunk-formatter-section" section-label="..."
WRONG: themeMode value="dark"          → MUST be value="auto"
```

## Section structure

Every viz gets 3 sections with these EXACT `section-label` values (casing matters):

1. `Data configurations` — field name mappings (text inputs)
2. `Data display` — labels, units, toggles, decimals
3. `Color and style` — themeMode, accentColor, series colors, accentIntensity

| Wrong | Right |
|---|---|
| `"Data Configuration"` (singular, capital C) | `"Data configurations"` |
| `"Data Display"` (capital D) | `"Data display"` |
| `"Color and Style"` (capital S) | `"Color and style"` |

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
    <!-- themeMode, accentColor, series colors -->
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

A complete minimal formatter.html for a KPI viz (3 sections, 7 controls):

```html
<form class="splunk-formatter-section" section-label="Data configurations">
    <splunk-control-group label="Value field" help="SPL column with the KPI value">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.valueField" value="value">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Label field" help="SPL column with the KPI label">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.labelField" value="label">
        </splunk-text-input>
    </splunk-control-group>
</form>

<form class="splunk-formatter-section" section-label="Data display">
    <splunk-control-group label="Unit suffix" help="Unit shown after value (e.g. ms, %)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.unit" value="">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Decimals" help="Number of decimal places (-1 = auto)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.decimals" value="-1">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Show trend" help="Show delta arrow below value">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.showTrend" value="true">
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
            <splunk-color>#00B4D8</splunk-color>
            <splunk-color>#90E0EF</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
</form>
```
