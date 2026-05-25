# Auto-Field Discovery Patterns

Vizs auto-discover fields from `data.fields` at runtime, so they render correctly against any
SPL result set without requiring the user to pre-configure field names. Formatter overrides
always take precedence over auto-discovered fields. Internal Splunk fields (prefixed with `_`)
are always excluded.

---

## RESERVED Field Exclusion List

Splunk injects these internal meta-fields into every ROW_MAJOR result. They must never be
treated as user data fields in auto-discovery.

```javascript
var RESERVED = {
    '_time': 1, '_raw': 1, '_indextime': 1, '_sourcetype': 1,
    '_source': 1, '_host': 1, '_bkt': 1, '_cd': 1, '_si': 1,
    '_serial': 1, '_subsecond': 1, '_eventtype_color': 1, '_kv': 1
};
```

**Runtime gate:** `fieldName.charAt(0) === '_'` — any field starting with `_` is excluded.
The `RESERVED` object above is a documentation superset; the `charAt(0)` check handles
undocumented internal fields that Splunk may add in future versions.

---

## isNumericCol Helper

Samples up to 3 rows to determine whether a column contains numeric data. Skips null/empty
values rather than failing on them (sparse SPL results are common). Returns `false` for
any RESERVED field before sampling.

```javascript
function isNumericCol(rows, colIdx, fieldName) {
    if (fieldName.charAt(0) === '_') return false;
    if (rows.length === 0) return false;
    var idx = colIdx[fieldName];
    var checked = 0;
    for (var ri = 0; ri < Math.min(3, rows.length); ri++) {
        var v = rows[ri][idx];
        if (v == null || v === '') continue;
        var n = parseFloat(v);
        if (!isNaN(n)) { checked++; }
        else return false;
    }
    return checked > 0;
}
```

---

## Three-Tier Field Resolver Pattern

> **Classic API note:** `data.colIdx` is built in `formatData()` by `SplunkVisualizationBase`. For Extension API vizs, replace `data.colIdx[fieldName]` with `data.fields.findIndex(function(f) { return f.name === fieldName; })` — see viz-blueprints.md Extension API Data Access section. The three-tier pattern below applies to Classic vizs; adapt the column-index lookup for Extension API.

Apply this in `updateView` after `opt()` and `data.fields` are available.

**Tier 1 — Formatter override:** User explicitly set a field name in the formatter. Use it.

**Tier 2 — Auto-discovery:** Formatter was left blank. Scan `data.fields` for numeric and label
columns using `isNumericCol`. Single-value vizs take the first numeric; multi-series vizs take
all numeric columns. First non-numeric non-reserved field becomes the label.

**Tier 3 — Position fallback:** No numeric columns found via discovery. Fall back to positional
indexing: `data.fields[0]` as label, `data.fields[1]` as value.

```javascript
var valueFieldCfg = opt('valueField', '').trim();
var labelFieldCfg = opt('labelField', '').trim();

// Auto-discover if formatter left blank
var numericFields = [];
var labelFields = [];
for (var fi = 0; fi < data.fields.length; fi++) {
    var fname = data.fields[fi].name;
    if (fname.charAt(0) === '_') continue;
    if (isNumericCol(data.rows, data.colIdx, fname)) {
        numericFields.push(fname);
    } else {
        labelFields.push(fname);
    }
}

// Resolve: Tier 1 config-first, Tier 2 auto-discover, Tier 3 position fallback
var resolvedValue = valueFieldCfg
    || (numericFields[0] || '')
    || (data.fields.length > 1 ? data.fields[1].name : '');
var resolvedLabel = labelFieldCfg
    || (labelFields[0] || '')
    || (data.fields.length > 0 ? data.fields[0].name : '');
```

After resolving field names:

```javascript
var labelIdx = data.colIdx[resolvedLabel]; // undefined if field missing — guard with safeStr/safeNum
var valueIdx = data.colIdx[resolvedValue];
```

---

## Per-Viz-Type Application Table

| Viz Type         | Label Resolution                          | Value Resolution                        | Multi-Series? |
|------------------|-------------------------------------------|-----------------------------------------|---------------|
| KPI / Single Value | Tier 1+2+3: labelField or first string  | Tier 1+2+3: valueField or first numeric | No — single value |
| Ring Gauge       | Tier 1+2+3: label or first string         | Tier 1+2+3: field or first numeric      | No — single value |
| Needle Gauge     | Same as Ring Gauge                        | Same as Ring Gauge                      | No |
| Status Chip      | Tier 1+2: labelField                      | Tier 1+2: statusField                   | No |
| Live Ticker      | Tier 1: field1–field4 (all explicit)      | N/A — display only                      | No |
| Leaderboard      | Tier 1+2+3: nameField                     | Tier 1+2+3: scoreField or first numeric | No — single score |
| Horizontal Bar   | Tier 1+2+3: labelField                    | Tier 1+2+3: valueField or first numeric | No — single value |
| Waterfall        | Tier 1+2+3: categoryField                 | Tier 1+2+3: valueField or first numeric | No |
| Line Chart       | Tier 1: xField (default `_time`)          | Tier 1+2: lineField or ALL numeric      | YES — plot all numeric as series |
| Spark Strip      | Tier 1: explicit metrics                  | Tier 1+2: ALL numeric columns           | YES — one sparkline per numeric |
| Heat Grid        | Tier 1+2: rowField, colField              | Tier 1+2: valueField or first numeric   | No — single value per cell |
| Data Table       | Auto-all: ALL non-reserved fields         | N/A — renders all columns               | YES — all columns rendered |
| Process Flow     | Tier 1+2: labelField, statusField         | Tier 1+2: valueField or first numeric   | No |
| Donut / Ring     | Tier 1+2: categoryField                   | Tier 1+2: valueField or first numeric   | No |
| Radar            | Tier 1: explicit fields list              | N/A — each column is an axis            | YES — columns are axes |
| Status Matrix    | Tier 1+2: nameField, statusField          | N/A — status is categorical             | No |

---

## Multi-Series Color Assignment

When a viz auto-discovers N numeric columns, assign colors using `theme.getSeriesColor(i, t)`
(established in Phase 13). This wraps `t.series[i % len]` with an alpha fade on overflow.

```javascript
var maxSeries = parseInt(opt('maxSeries', '6'), 10);
var activeSeries = numericFields.slice(0, maxSeries); // cap to prevent legend overflow

for (var si = 0; si < activeSeries.length; si++) {
    var seriesColor = theme.getSeriesColor(si, t);
    // draw series si using seriesColor
}
```

`opt('maxSeries', '6')` — expose in the formatter so users can reduce series count if needed.
Truncating at `maxSeries` prevents legend overflow (MIN-04 pitfall).

---

## Pitfall Reminders

- **CP-01:** Never mix hardcoded `colIdx['value']` reads with a dynamic field resolver in the
  same viz. The two halves must be consistent: formatter-driven name → `colIdx[name]` → row read.

- **CP-02:** Empty formatter + no auto-detect = all zeros. Always chain:
  `opt('valueField', '') || autoDetected || positionFallback`. Never leave the resolved name empty.

- **CP-03:** `_time` passes `parseFloat`. The `charAt(0) === '_'` check is mandatory, not
  optional. Without it, epoch timestamps (~1.7e9) register as numeric and peg every gauge.

- **CP-04:** Multi-series color by field-name hash gives stable colors across SPL results that
  return columns in different order. Index assignment is acceptable for v1 but may shift colors
  when column order changes between searches.
