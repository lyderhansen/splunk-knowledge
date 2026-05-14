# Porsche Motorsport Viz Pack — Fix Recipe

Hand this to the agent doing the plugin update. All work is in:
`/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge/test15_340/porsche_motorsport_viz/`

---

## Bug 1: Formatter settings completely broken on 4 of 5 vizs

**Symptom:** energy_bar, kpi_tile, tire_timeline, and sector_table show NO settings
in Dashboard Studio panel editor or in ad-hoc search Format tab. needle_gauge works.

**Root cause:** These 4 vizs use raw HTML (`<input>`, `<select>`, `<div>`) instead of
Splunk's custom formatter components. Splunk's visualization framework ignores raw HTML —
it only reads `<splunk-control-group>`, `<splunk-text-input>`, `<splunk-radio-input>`,
`<splunk-color-picker>`, and `<splunk-range-input>` inside `<form class="splunk-formatter-section">` wrappers.

**Evidence:** needle_gauge (the ONLY working viz) uses the correct pattern:
```html
<form class="splunk-formatter-section" section-label="Data Fields">
    <splunk-control-group label="Value field" help="...">
        <splunk-text-input name="porsche_motorsport_viz.needle_gauge.valueField" default="value">
        </splunk-text-input>
    </splunk-control-group>
</form>
```

The broken vizs use this (which Splunk ignores):
```html
<div class="section">
    <h3>Data Fields</h3>
    <div class="form-row">
        <label>Label field</label>
        <input type="text" name="display.visualizations.custom.porsche_motorsport_viz.energy_bar.labelField" />
    </div>
</div>
```

**Two problems at once:**
1. Raw HTML instead of Splunk components → Splunk never reads the settings
2. Wrong namespace in `name=""` — raw HTML used the full `display.visualizations.custom.` prefix,
   but formatter.html must use the SHORT namespace: `porsche_motorsport_viz.energy_bar.labelField`

**Fix:** Rewrite formatter.html for ALL FOUR broken vizs. Follow these rules from vp-ref-gotchas:

### Formatter rules (B5, B7, B10, B16)

**Structure:**
- Bare `<form class="splunk-formatter-section">` elements — NO wrapping `<html>`, `<body>`, `<div>`, or `<head>`
- NO CSS, NO JavaScript, NO custom styling
- Section labels are case-sensitive and must be exactly: `"Data configurations"`, `"Data display"`, `"Color and style"`
- Every `<splunk-control-group>` MUST have a `help="..."` attribute

**Namespace (B10):**
- formatter.html uses SHORT format: `{app_id}.{viz_name}.settingName`
- Example: `porsche_motorsport_viz.energy_bar.attackColor`
- NOT `display.visualizations.custom.porsche_motorsport_viz.energy_bar.attackColor`

**Defaults (B7):**
- The `default="..."` attribute in formatter MUST match the fallback value in `getOption()` in JS
- Splunk does NOT send defaults on first load — the JS fallback IS the effective default

**Component types:**
- Text fields → `<splunk-text-input name="..." default="...">`
- Dropdowns → `<splunk-radio-input name="..." default="..."><option value="...">Label</option></splunk-radio-input>`
- Color pickers → `<splunk-color-picker name="..." default="#hex"><preset-colors><color>#hex</color>...</preset-colors></splunk-color-picker>`
- Range/slider → There is no built-in range component. Use `<splunk-text-input>` with help text saying "0-100"
- Checkbox → `<splunk-radio-input name="..." default="false"><option value="true">Yes</option><option value="false">No</option></splunk-radio-input>`

### Files to rewrite

| Viz | File | Settings needed |
|-----|------|-----------------|
| energy_bar | `appserver/static/visualizations/energy_bar/formatter.html` | labelField, attackField, defendField, neutralField, theme, attackColor, defendColor, neutralColor, accentIntensity |
| kpi_tile | `appserver/static/visualizations/kpi_tile/formatter.html` | valueField, labelField, deltaField, deltaDirectionField, unitField, heroMode, theme, accentColor, accentIntensity |
| tire_timeline | `appserver/static/visualizations/tire_timeline/formatter.html` | driverField, stintField, compoundField, startLapField, endLapField, totalLapsField, theme, softColor, mediumColor, hardColor, interColor, wetColor, accentIntensity |
| sector_table | `appserver/static/visualizations/sector_table/formatter.html` | driverField, s1Field, s2Field, s3Field, totalField, s1DeltaField, s2DeltaField, s3DeltaField, totalDeltaField, positionField, theme, referenceLabel, bestColor, improvedColor, slowerColor, accentIntensity |

### Reference: use needle_gauge as the template

needle_gauge already works. Copy its structure exactly. The pattern is:
```html
<form class="splunk-formatter-section" section-label="Data configurations">
    <splunk-control-group label="Human Label" help="Explanation text.">
        <splunk-text-input name="porsche_motorsport_viz.{viz_name}.settingKey" default="defaultValue">
        </splunk-text-input>
    </splunk-control-group>
</form>
```

### Verification after fix

For each viz, in Splunk:
1. Open ad-hoc search, run `| inputlookup demo_energy.csv`
2. Switch to Visualization tab, pick "Porsche Energy Bar"
3. Click "Format" — settings MUST appear with correct defaults
4. Change a setting (e.g. attackColor) — viz MUST re-render immediately
5. Open the demo dashboard in Dashboard Studio editor
6. Click on the energy_bar panel → Format sidebar MUST show settings

---

## Bug 2: Vizs don't scale to panel size — hardcoded pixel values

**Symptom:** Vizs render at fixed sizes, don't fill their panel. Especially visible when
resizing panels in Dashboard Studio.

**Root cause:** Some vizs use hardcoded pixel constants like `ROW_H = 24`, `LABEL_W = 100`,
`PAD_LEFT = 12` that don't adapt to available space.

**Fix for each viz type:**

### Gauges (needle_gauge)
Already uses `radius = Math.min(w, h) * 0.38` — verify it's truly relative.
Tick label font size should scale: `Math.max(8, Math.round(radius * 0.06))` px.

### Bar charts (energy_bar, tire_timeline)
- `ROW_H` should be calculated: `Math.max(16, Math.floor((availableHeight - legendH) / rowCount) - gap)`
- `LABEL_W` should be calculated: measure the longest label string + 16px padding
- Font sizes should have a floor: `Math.max(8, Math.round(rowH * 0.45))` px
- If more rows than fit: implement vertical scrolling or pagination

### Tables (sector_table)
- Column widths should be proportional to panel width, not fixed px
- Row height should scale with panel height
- See Bug 3 for additional table requirements

### KPI tiles (kpi_tile)
- Value font size should scale: `Math.max(18, Math.round(h * 0.35))` for normal,
  `Math.max(28, Math.round(h * 0.45))` for heroMode
- Label font: `Math.max(7, Math.round(h * 0.08))` px
- Padding: percentage-based `w * 0.06`

### Verification
1. Place viz in Dashboard Studio at 300×200 — should be readable
2. Place viz at 800×600 — should use the space, not have empty areas
3. Resize panel in editor — viz should smoothly adapt

---

## Bug 3: sector_table lacks table interactivity

**Symptom:** Table is a static Canvas drawing. No sort, no pagination, no column resize.
The user expects tables that feel like real tables.

**Required features:**

### 3a. Column header sort (MUST)
- Click on any header cell → sort rows by that column (toggle asc/desc)
- Draw sort indicator (small triangle ▲/▼) next to active sort column
- Store sort state: `this._sortCol`, `this._sortDir`
- Re-sort `this._rows` and re-render on click
- Implementation: add `_onMouseDown` handler, hit-test against header row rects

### 3b. Pagination (MUST)
- Calculate `rowsPerPage = Math.floor((panelHeight - headerHeight - paginationHeight) / rowHeight)`
- Draw pagination bar at bottom: "Page 1 of 3  ‹ ›" in 9px FONT_UI
- Store `this._currentPage`
- Click handlers on ‹ › buttons
- Setting: `rowsPerPage` in formatter (default: "auto" = calculate from panel height)

### 3c. Column resize (NICE TO HAVE)
- On mousedown near column border (±4px of vertical gridline) → enter resize mode
- On mousemove → update column width, re-render
- On mouseup → exit resize mode
- Store custom widths in `this._colWidths` array
- Change cursor to `col-resize` on hover near borders

### 3d. Fill panel (MUST)
- Table MUST fill 100% of the available panel width
- Column widths should be proportional: total = panelWidth
- Last column gets remaining space (or distribute evenly)

### Formatter settings to add for sector_table
- `rowsPerPage` — text input, default "auto"
- `defaultSortColumn` — text input, default "position"
- `defaultSortDirection` — radio, default "asc"

### Verification
1. Click "S1" header → rows sort by S1 ascending
2. Click "S1" again → rows sort descending
3. Sort indicator visible on active column
4. With 20+ rows: pagination bar appears, ‹ › buttons work
5. Table fills the full panel width at any size

---

## Bug 4 (LOW PRIORITY): Hero dashboard layout is monotonous

This is a skill gap in `vp-couture`, not a code bug. Note for plugin skill update:

The hero composition pattern (image → overlay → vignette → floating panels) is the ONLY
layout recipe in the skill. Every viz pack dashboard looks the same. The skill needs
additional layout archetypes:
- **Strip banner:** narrow 80px brand strip at top, no full-bleed hero
- **Side hero:** 40% left column image, 60% right data
- **No hero:** brand identity through typography and viz chrome only
- **Split screen:** top half image, bottom half full-width data grid

This is a documentation/skill improvement, not a code fix for this pack.

---

## Rebuild after fixes

```bash
cd porsche_motorsport_viz/_build
npm run build
cd ..
COPYFILE_DISABLE=1 tar czf ../porsche_motorsport_viz.tar.gz \
  --exclude='_build' --exclude='node_modules' --exclude='src' \
  --exclude='{src}' --exclude='.DS_Store' .
```

Verify webpack compiles with 0 errors before packaging.
