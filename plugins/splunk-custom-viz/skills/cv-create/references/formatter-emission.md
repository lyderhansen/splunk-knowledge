# formatter.html emission templates

The `formatter.html` per viz lets users tweak settings inside Splunk. cv-create generates it from `DESIGN-LOCK.md.vizs[].visual_spec`.

## Required structure

Every formatter has exactly three standard sections (Dashboard Studio merges these with built-in groups — non-standard labels like "Effects" create duplicate prefixed groups):

```html
<form class="splunk-formatter-section" section-label="Data configurations">
    <!-- field name overrides; only if the viz has data field config -->
</form>

<form class="splunk-formatter-section" section-label="Data display">
    <!-- title, alignment, units, decimals, show/hide toggles -->
</form>

<form class="splunk-formatter-section" section-label="Color and style">
    <!-- themeMode, color pickers, accent intensity, threshold colors -->
    <!-- effect/animation toggles, glow toggles, hover effect toggle (NOT a separate "Effects" section) -->
</form>
```

Minimum 10 controls per viz, target 14-18 for domain-specific vizs.

## Per-control templates

### Text input

```html
<splunk-control-group label="<Label>" help="<help text>">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.<key>" value="<default>">
    </splunk-text-input>
</splunk-control-group>
```

### Radio toggle (2-3 options)

```html
<splunk-control-group label="<Label>" help="<help text>">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.<key>" value="<default value>">
        <option value="<opt1>"><Opt1 Label></option>
        <option value="<opt2>"><Opt2 Label></option>
    </splunk-radio-input>
</splunk-control-group>
```

### Select (4+ options)

```html
<splunk-control-group label="<Label>" help="<help text>">
    <splunk-select name="{{VIZ_NAMESPACE}}.<key>" value="<default>">
        <option value="<opt1>"><Opt1 Label></option>
        <option value="<opt2>"><Opt2 Label></option>
        <option value="<opt3>"><Opt3 Label></option>
        <option value="<opt4>"><Opt4 Label></option>
    </splunk-select>
</splunk-control-group>
```

### Color picker (REQUIRED `type="custom"`)

```html
<splunk-control-group label="<Label>" help="<help text>">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.<key>" type="custom" value="<#hex>">
        <splunk-color><#hex1></splunk-color>
        <splunk-color><#hex2></splunk-color>
        <splunk-color><#hex3></splunk-color>
        <splunk-color><#hex4></splunk-color>
        <splunk-color><#hex5></splunk-color>
        <splunk-color><#hex6></splunk-color>
    </splunk-color-picker>
</splunk-control-group>
```

Palette source: use `global.brand` + `global.palette_dark.series` from DESIGN-LOCK.md.

### Theme selector (REQUIRED default "auto")

```html
<splunk-control-group label="Theme" help="Auto detects dashboard theme">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto">
        <option value="auto">Auto</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
    </splunk-radio-input>
</splunk-control-group>
```

## Generation rules

For each viz, generate controls from `visual_spec`:

| visual_spec source | Generated formatter controls |
|---|---|
| `geometry.hero_text_ratio` | Text input "Hero text size (% of panel)" with default = ratio × 100 |
| `geometry.<other numeric values>` | Text input with sensible label and default |
| `fills.background.base` color | Color picker "Background color" |
| `fills.<element>.from/to` colors | Color picker per element |
| `effects.<animation>` | Radio toggle "Show <animation name>" on/off (default ON) |
| `hover.effect` | Radio toggle "Show hover effect" on/off (default ON) |
| `data_contract.required[].field` | Text input "<field> field name" with default = field name |

ALWAYS include in every formatter:
- `themeMode` (auto)
- `accentIntensity` (default `"50"` — text input, NOT capped)
- `showHoverEffect` (default `"true"`)
- A "Title" text input

## Forbidden patterns (cv-build will flag these)

```
WRONG: name="myapp.myviz.field"           → MUST be name="{{VIZ_NAMESPACE}}.field"
WRONG: default="value"                     → MUST be value="value"
WRONG: <splunk-color-picker value="...">   → MUST add type="custom"
WRONG: <form>                              → MUST add class="splunk-formatter-section" section-label="..."
WRONG: themeMode value="dark"              → MUST be value="auto"
```

cv-build's grep validation will catch these. cv-create should never emit them.

## Help text quality

Every `<splunk-control-group>` MUST have a non-empty `help` attribute. Help text should explain what the control DOES, not what it IS. Examples:

- BAD: `help="title"` (just restates the label)
- GOOD: `help="Text shown above the viz. Leave blank to hide."`

- BAD: `help="hover effect"`
- GOOD: `help="Highlight rows when mouse hovers over them. Turn off if the viz is on a wall display."`

## Section order

Section order in the formatter file MUST be:

1. Data configurations (field mappings, least-tweaked)
2. Data display (title, alignment, units — most-tweaked)
3. Color and style (colors, themeMode, and all effect/animation toggles)

Splunk merges these into Dashboard Studio's standard groups. Using the EXACT labels above (case-sensitive, plural where shown) is mandatory — otherwise Dashboard Studio creates duplicate groups prefixed with the viz name. Do NOT add an "Effects" section; fold animation and glow toggles into Color and style.
