# Pre-Code Checklist

Verify EVERY item before writing visualization code. This is the gate between "reading skills" and "writing code."

```
□ Viz files in appserver/static/visualizations/{viz}/ — NEVER default/visualizations/
□ Formatter: {{VIZ_NAMESPACE}}.key in ALL name= attributes
□ Formatter: value= on all inputs (NEVER default=)
□ Formatter: type="custom" on every <splunk-color-picker>
□ Formatter: class="splunk-formatter-section" section-label="..." on every <form>
□ Formatter: themeMode defaults to "auto" (NEVER "dark")
□ Formatter: minimum 10 controls (4 sections required when mood effects present)
□ JS light theme: hero text uses t.text, NEVER t.textDim (ghost-text on white — D-08)
□ JS light theme: glow scaled by isDark ? 1.0 : 0.4 (THM-03)
□ JS light theme: inner shadow replaced by 1px t.edge border on panels (THM-04)
□ JS: first line of visualization_source.js MUST be: // @viz-type: <type> (one of: kpi, gauge, bars, grid, line, timeline, radar, progress, scatter, network)
  **ENFORCED by check_design.js D10 -- will FAIL validation if missing**
□ JS: require()/module.exports — NEVER define()
□ JS: SplunkVisualizationBase.extend({...}) object literal
□ JS: safeStr()/safeNum() on all row field reads
□ JS: detectTheme() for auto theme detection
□ JS: clientWidth/clientHeight — NEVER getBoundingClientRect for sizing
□ JS: clearRect for background — NEVER fillRect
□ JS: ctx.globalAlpha = 1 before drawing text (reset after glow effects)
□ JS: measureText() before positioning text (prevent overflow)
□ JS: Math.max(floor, h * ratio) for font sizes — NO upper pixel cap
□ JS: ROW_MAJOR_OUTPUT_MODE in getInitialDataParams
□ JS: hexFromSplunk() wraps ALL color picker opt() reads — Splunk delivers color values as integers (B22)
□ JS: _onMouseMove MUST begin with: if (!this._showHoverEffect) return; -- guard prevents hover when user toggles showHoverEffect OFF (CQ-03, enforced by D11)
□ JS accent role: t.accent used ONLY for hover highlight, glow shadowColor, selection ring, threshold breach, focus indicator. Never as ctx.fillStyle for data bars, arcs, or area fills. See DPR-03b.
□ JS series data fills: multi-series fills use theme.getSeriesColor(i, t) from t.series[0]-[4]. Single-series vizs may use t.accent as the primary fill (KPI hero value, single gauge arc).
□ JS: pure ES5 — no const/let/arrow/template literals
□ Dashboard JSON type: {app_id}.{viz_name} — NEVER custom.* or splunk.custom.*
□ Dashboard JSON options: {app_id}.{viz_name}.key — NEVER bare key names
□ Dashboard data sources: every ds.search has "name" field
□ Tables: sort ALL columns, pagination with maxRows, hiddenColumns, columnWidths
□ Event handlers: field names from config properties, NEVER hardcoded strings
□ JS formatData: result object includes fields: data.fields (enables auto-field discovery)
□ JS auto-field: _ prefix fields excluded from auto-discovery (charAt(0) === '_' check)
□ JS field resolver: formatter config overrides auto-discovered fields (opt('valueField','') checked first)
□ Drilldown tokens: setToken → search consumes it → default value set
□ Formatter: settings are VIZ-APPROPRIATE — KPI exposes threshold ranges (green/yellow/red); bar exposes label toggle; table exposes sort column + maxRows
□ JS tables: column sort (click header → re-sort) + pagination (maxRows config, prev/next controls) — MANDATORY
□ JS bar/column charts: hover tooltip showing field value on mousemove — MANDATORY
□ JS KPI/single-value: threshold-based text/bg color change (green if >= high, yellow if >= med, red if below) — MANDATORY
□ JS all vizs: _onClick(e) emits this.drilldown({action:SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data:hit.drilldownData}, e) — MANDATORY
□ Formatter: drilldownField text input on every viz with clickable data rows
□ Visual Language: implement cornerRadius/fillTechnique/spacing from vp-design brief; different brands MUST use different Canvas APIs (gradient vs flat fill, rounded vs sharp rects)
□ Tarball: ONE top-level directory only — package from parent dir
```

## Settings Wiring Verification — AFTER writing each viz

For EVERY formatter control, trace the value through to the Canvas draw call:

```
1. Formatter HTML: name="{{VIZ_NAMESPACE}}.controlName" value="defaultValue"
2. JS opt() read:  var val = opt('controlName', 'defaultValue');
   → Key spelling matches? Defaults match?
   → Color pickers: wrapped in hexFromSplunk()?
3. JS application: val is used in a ctx.* call or conditional
   → Toggle controls: early-exit pattern? (if (!val) return;) -- showHoverEffect MUST guard _onMouseMove (D11)
   → Numeric controls: NOT clamped unless documented (gi > 1 ? 1 : gi ← WRONG for accentIntensity)
      accentIntensity (gi) MUST NOT be capped at 1.0 -- enforced by check_design.js D09
   → Color controls: actually changes a visible fillStyle/strokeStyle/shadowColor?
```

If ANY control exists in the formatter but has no Canvas effect: either wire it or remove it.
If ANY control has a Canvas effect but no formatter: add the formatter control.

