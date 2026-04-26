---
name: ds-viz-singlevalueicon
description: Reference skill for the `splunk.singlevalueicon` visualization in Dashboard Studio (v2). A `splunk.singlevalue` with a leading or trailing icon — the icon-prefixed KPI tile. Triggers on 'splunk.singlevalueicon', 'icon KPI', 'KPI with icon', 'icon tile', 'iconColor', 'iconPosition'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-singlevalueicon — `splunk.singlevalueicon`

`splunk.singlevalueicon` is `splunk.singlevalue` with an icon. Same KPI semantics — major value, under-label, optional trend — plus a leading or trailing glyph that gives the tile categorical identity at a glance. Use it when a row of KPI tiles needs visual discrimination beyond colour alone.

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) — the
>    *Single value icon options* section is the verbatim option list, types, and
>    defaults.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every pattern
>    below was rendered and visually QA'd on Splunk Enterprise 10.2.1. Both
>    files are deployed to the `splunk-knowledge-testing` app as
>    `ds_viz_singlevalueicon_dark` and `ds_viz_singlevalueicon_light`.

---

## When to use

- **Use** when a KPI strip needs categorical icons — a row of four tiles where each icon (revenue, users, errors, latency) gives the metric an identity before the eye reads the number.
- **Use** when the icon *is* the message (status lights, mode indicators) — combine with `showValue: false` for an icon-only tile.
- **Use** dynamic `iconColor` (DOS / `rangeValue`) for traffic-light status without losing the icon's shape.
- **Don't use** as the default KPI tile. Plain `splunk.singlevalue` is faster to read when the number is the only thing that matters; the icon is decoration when there's no risk of confusing tiles.
- **Don't use** for a sparkline-driven tile — `splunk.singlevalueicon` does **not** support `sparkline*` options. If you need a sparkline, use `splunk.singlevalue`.
- **Don't use** for a number against a target → that is `splunk.markergauge` / `splunk.fillergauge`.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

Same as `splunk.singlevalue`:

1. **One row, one column** — pure KPI. `majorValue` defaults to the first numeric cell.
2. **Multiple rows, one numeric column over `_time`** — KPI + trend; the major value is the most recent point, the trend is computed against the first point.

The minimum viable input is one number. Everything else (trend, dynamic colour) just needs more data.

---

## Layout requirement

`splunk.singlevalueicon` **only renders inside Absolute layout**. In a Grid layout it falls back to a plain singlevalue without the icon.

```json
"layout": { "type": "absolute", "options": { "width": 1440, "height": 900 } }
```

---

## The icon — two valid forms

The `icon` property accepts exactly two value shapes that render on Splunk Enterprise 10.2.1:

### 1. The literal string `"default"`

```json
"options": { "icon": "default" }
```

Renders the generic Splunk square. Works everywhere, no upload needed. The only form that's portable across Splunk instances without setup.

### 2. A `splunk-enterprise-kvstore://<icon-name>__<UUID>.svg` URL

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg"
}
```

The icon is an SVG already uploaded to the `splunk_dashboard_icons` KV-store collection on this Splunk instance. **The UUID is generated at upload time and cannot be invented** — there is no programmatic enumeration path; you obtain a real URL only by uploading or picking an icon through the **Dashboard Studio editor's icon picker** (in the panel's *Configuration* → *Icon* control). Once you've picked the icon there, switch to source view and copy the resulting `splunk-enterprise-kvstore://...` URL into your JSON.

`iconColor` still applies because Splunk-uploaded icons carry `currentColor` strokes.

> **Per-instance footgun.** Icon URLs are *not* portable. The UUID is unique per upload per instance. A dashboard authored on instance A and shipped to instance B will silently lose its icons unless the same SVGs are re-uploaded on B (which mints new UUIDs) and the URLs are rewritten. Plan for this when packaging a dashboard for distribution: ship a list of required icons + the source SVGs alongside the dashboard JSON, and re-pick on each target instance. For portable artefacts, prefer `"icon": "default"`.

### Forms that do **not** render on this build

Tested and confirmed broken on Splunk Enterprise 10.2.1 (the panel value renders without a glyph):

- `data:image/svg+xml;utf8,<svg ...>` data URIs — inline SVG. Documented in earlier reference material; does not render here.
- `splunk-enterprise-kvstore://abcd1234abcd1234abcd1234` — bare 24-hex MongoDB-style ObjectId without the filename prefix or `.svg` suffix.
- Bare named tokens (`thermometerFull`, `check`, etc.) — undocumented but seen in some forum examples; treated as a literal filename and 404s.

If you see a `splunk.singlevalueicon` panel rendering only the value without an icon, the `icon` URL is the suspect — copy a fresh one from the editor's icon picker.

---

## 12 verified patterns (all live in `splunk-knowledge-testing`)

Each pattern below is a single `splunk.singlevalueicon` panel from the test dashboard. Copy the `options` block. Every non-default snippet uses the same uploaded check icon — replace the `icon` URL with one you've copied from your own instance's icon picker to vary the glyph.

### 1. Default icon + value

```json
"options": {
  "icon": "default",
  "underLabel": "Revenue (24h)",
  "unit": "$",
  "unitPosition": "before",
  "shouldAbbreviateTrendValue": true,
  "trendDisplay": "percent"
}
```

### 2. Uploaded kvstore icon (check)

The `icon` URL is whatever the editor's icon picker generated when this SVG was uploaded — it is per-instance. The example below is the URL from the `splunk-knowledge-testing` instance; on yours it will be a different UUID.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#33FF99",
  "underLabel": "Conversion rate",
  "unit": "%",
  "unitPosition": "after",
  "numberPrecision": 2,
  "trendDisplay": "percent"
}
```

### 3. `iconPosition: "after"`

Move the icon to the right of the value. Default is `"before"`. Use `"after"` when the icon is a meaningful suffix — a units glyph, a state indicator.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#33FF99",
  "iconPosition": "after",
  "underLabel": "MRR",
  "unit": "$",
  "unitPosition": "before",
  "trendDisplay": "percent"
}
```

### 4. Icon-only — `showValue: false`

Hides **both** the major value and the trend. The panel is just the icon. Useful for status-light panels or visual breakers in a KPI strip.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#7AA2FF",
  "showValue": false
}
```

### 5. Dynamic `iconColor` via `rangeValue`

Icon colour traffic-lights based on the data. Pattern: `> primary | seriesByName(field) | lastPoint() | rangeValue(thresholds)`.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "underLabel": "System health",
  "unit": "/100",
  "unitPosition": "after",
  "trendDisplay": "absolute",
  "iconColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)"
},
"context": {
  "thresholds": [
    { "to": 60,             "value": "#FF2D95" },
    { "from": 60, "to": 80, "value": "#FFB627" },
    { "from": 80,           "value": "#33FF99" }
  ]
}
```

> **Threshold semantics — read once, then every time.** `from` is **inclusive** (`>=`), `to` is **exclusive** (`<`), and `rangeValue` evaluates buckets **top-down** (first match wins). That makes overlapping buckets a silent footgun:
>
> - **Bug:** `[{to:70}, {from:70, to:90}, {from:90}]` — looks like RAG but the boundary value 70 lands in amber, **not** red, because `to` is exclusive. If your demo data is 65 you also never see amber.
> - **Fix (canonical RAG):** `[{to:60}, {from:60, to:80}, {from:80}]` — disjoint, gap-free, top-down-safe. The value 60 lands in amber, 80 lands in green, anything below 60 is red.
>
> Verify with at least one demo value per bucket (e.g. health = 20 / 60 / 95 against thresholds 60 / 80) — otherwise you're not actually exercising the middle bucket on render.

### 6. Dynamic `majorColor` (icon stays calm, number flips)

A common SOC pattern: the icon stays a calm hue (it's identity), the number flips colour (it's the alert). Reads as *"something is wrong with this metric"* without losing the icon's identity.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#7AA2FF",
  "underLabel": "Errors / hour",
  "trendDisplay": "absolute",
  "majorColor": "> primary | seriesByName('errors') | lastPoint() | rangeValue(majorThresholds)"
},
"context": {
  "majorThresholds": [
    { "to": 10,             "value": "#33FF99" },
    { "from": 10, "to": 20, "value": "#FFB627" },
    { "from": 20,           "value": "#FF2D95" }
  ]
}
```

### 7. `iconOpacity: 0.3` — muted secondary icon

`iconOpacity` accepts `0.0`–`1.0`. Use a low value when the icon is decorative / categorisation rather than the message; the eye lands on the value first, the icon is context.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#7AA2FF",
  "iconOpacity": 0.3,
  "underLabel": "Conversion rate",
  "unit": "%",
  "unitPosition": "after",
  "trendDisplay": "percent"
}
```

### 8. `trendDisplay: "off"` — static KPI with icon

Single-row data source, no time dimension. The icon supplies meaning without needing recent history.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#33FF99",
  "underLabel": "Orders today",
  "trendDisplay": "off"
}
```

### 9. `majorFontSize: 56` — locked size for KPI strip

Locks the number font size so a row of tiles stays visually consistent regardless of underlying value magnitude (`1.2K` and `1,245,000` will look like the same metric instead of fighting for attention).

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#7AA2FF",
  "underLabel": "MRR",
  "unit": "$",
  "shouldAbbreviateTrendValue": true,
  "trendDisplay": "percent",
  "majorFontSize": 56
}
```

### 10. Dynamic `backgroundColor` + locked text colour

Whole-tile background flips on threshold. **Lock `iconColor` and `majorColor` to a contrast colour** so the tile stays readable when the bg goes dark/light.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#FFFFFF",
  "majorColor": "#FFFFFF",
  "underLabel": "Errors / hour",
  "trendDisplay": "absolute",
  "backgroundColor": "> primary | seriesByName('errors') | lastPoint() | rangeValue(bgThresholds)"
},
"context": {
  "bgThresholds": [
    { "to": 10,             "value": "#152034" },
    { "from": 10, "to": 20, "value": "#A85A1F" },
    { "from": 20,           "value": "#8B1F3A" }
  ]
}
```

Use sparingly — one or two of these is enough per dashboard. A wall of flashing tiles loses signal.

### 11. `shouldUseThousandSeparators: false`

Strips commas. Use for IDs, sequence numbers, version numbers — `1245000` reads as a build ID, not a quantity, when commas are absent.

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#7AA2FF",
  "underLabel": "Build ID",
  "shouldUseThousandSeparators": false,
  "trendDisplay": "off"
}
```

### 12. Compact KPI strip pattern

Transparent background + small `majorFontSize` + `iconPosition: "after"`. Used for rows of small KPI tiles in a dense dashboard header strip.

```json
"options": {
  "backgroundColor": "transparent",
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg",
  "iconColor": "#33FF99",
  "iconPosition": "after",
  "underLabel": "Conv. rate",
  "unit": "%",
  "unitPosition": "after",
  "numberPrecision": 1,
  "shouldAbbreviateTrendValue": true,
  "trendDisplay": "percent",
  "majorFontSize": 36
}
```

---

## Options reference (16 total — verified against 10.4.2604)

`splunk.singlevalueicon` exposes the **singlevalue option set MINUS** `sparkline*` (no sparkline) **PLUS** four icon options. `backgroundColor` defaults to `"transparent"` (vs. theme background for `splunk.singlevalue`).

### Icon group (4 — unique to singlevalueicon)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `icon` | `"default"` \| `splunk-enterprise-kvstore://<name>__<UUID>.svg` | `"default"` | The icon. Two valid forms — see *The icon* section above. The kvstore URL is per-instance and obtained via the editor's icon picker. |
| `iconColor` | hex / theme token / DOS expression | theme accent | Icon stroke / fill colour. Splunk-uploaded SVGs carry `currentColor` strokes so `iconColor` controls them. Custom-uploaded SVGs need `stroke="currentColor"` (or `fill="currentColor"`) to honour this option. |
| `iconOpacity` | number `0.0`–`1.0` | `1` | Icon transparency. Use `0.3`–`0.5` when the icon is decorative. |
| `iconPosition` | `"before"` \| `"after"` | `"before"` | Icon left or right of the value. |

### Value group (8 — same as singlevalue)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `majorValue` | number / DOS expression | first numeric cell | The big number. |
| `majorValueField` | string | first numeric column | Pick a specific column. |
| `majorColor` | hex / theme token / DOS expression | theme primary text | Number colour. Use DOS for thresholds. |
| `majorFontSize` | number (px) | auto | Lock the number size for tile consistency. |
| `numberPrecision` | integer ≥ 0 | `0` | Decimal places. |
| `unit` | string | unset | Unit prefix/suffix (`$`, `%`, `ms`). |
| `unitPosition` | `"before"` \| `"after"` | `"after"` | Which side of the number. |
| `underLabel` | string | unset | Label below the number. |

### Trend group (3 — same as singlevalue, minus a few sparkline-specific ones)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `trendDisplay` | `"absolute"` \| `"percent"` \| `"off"` | `"absolute"` | Delta vs. first point. `"off"` hides the trend row. |
| `trendColor` | hex / theme token | theme | Trend text colour. |
| `shouldAbbreviateTrendValue` | boolean | `false` | Compact deltas (`+1.2K` vs `+1,245`). |

### Chrome group (1 — same as singlevalue)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `backgroundColor` | hex / theme token / `"transparent"` / DOS | `"transparent"` | Tile background. **Default differs from `splunk.singlevalue`** (which inherits theme background). |
| `shouldUseThousandSeparators` | boolean | `true` | Comma separators. |

> The 10.4 reference also lists `numberPrecision` and a couple of formatting helpers under the Chrome group; they're listed under *Value* above for readability. Total **16 unique options** as advertised in the reference table.

---

## What `splunk.singlevalueicon` does **not** support

These options exist on `splunk.singlevalue` but are **silently ignored** here:

- `sparklineValues`, `sparklineDisplay`, `sparklineStrokeColor`, `sparklineAreaColor`, `showSparklineAreaGraph`, `showSparklineTooltip`, `sparklineHighlightDots`, `sparklineHighlightSegments`, `shouldSparklineAcceptNullData` — **no sparkline**.
- `underLabelFontSize` — under-label font is auto.
- `trendFontSize` — trend font is auto.

If you need a sparkline → use `splunk.singlevalue`. If you need a radial → `splunk.singlevalueradial`.

It also does **not** support: legend, axes, `dataValuesDisplay` — the same constraints as `splunk.singlevalue`.

---

## Gotchas

1. **`icon` URLs are per-instance.** The UUID in `splunk-enterprise-kvstore://<name>__<UUID>.svg` is generated when the SVG is uploaded; the same icon on two instances will have two different UUIDs. There is no SPL command to enumerate available icons — use the Dashboard Studio editor's icon picker, copy the URL from source view, paste into your JSON. When packaging for distribution, ship the source SVGs and re-pick on each target instance.
2. **Don't try `data:image/svg+xml;utf8,...` data URIs on this build.** Earlier reference material documents inline data URIs as a valid form; on Splunk Enterprise 10.2.1 they do not render. Same for bare 24-hex ObjectIds and bare named tokens. Stick to `"default"` or the kvstore filename URL.
3. **`iconColor` requires `currentColor` strokes.** Splunk-uploaded icons already use `currentColor`, so `iconColor` Just Works. If you upload a custom SVG and `iconColor` does nothing, open the SVG and confirm the stroke / fill is `currentColor` rather than a hard-coded hex.
4. **`backgroundColor` defaults to `"transparent"` here**, not theme background. If you want the tile to look like a `splunk.singlevalue`, set `"backgroundColor": "#1A1A1A"` (or your theme's panel colour) explicitly.
5. **Absolute layout only.** In Grid layout the panel falls back to a plain singlevalue without the icon.
6. **No sparkline.** Don't try `sparklineDisplay` here — it's silently ignored. Use `splunk.singlevalue` if you need a tile with a sparkline.
7. **`iconOpacity` is a number, not a percent.** `0.3` not `30`.
8. **Light theme readability.** When `backgroundColor` flips to a light tone via `rangeValue`, lock `iconColor` and `majorColor` to a dark hex (`#1A1A1A`). The default theme text colour will be light and disappear on the light bg.
9. **`rangeValue` thresholds are top-down with `from` inclusive and `to` exclusive.** Overlapping buckets like `[{to:70}, {from:70, to:90}, {from:90}]` silently mis-route values: the boundary value 70 lands in amber (not red), and any value in (70, 90) hits the first bucket if you swap order. Always design **disjoint, gap-free** buckets (e.g. `[{to:60}, {from:60, to:80}, {from:80}]`) and verify with at least one demo value per bucket. See pattern 5 above.

---

## Test dashboard

- **Dark:** `splunk-knowledge-testing` → `ds_viz_singlevalueicon_dark`
- **Light:** `splunk-knowledge-testing` → `ds_viz_singlevalueicon_light`

Both dashboards live at `plugins/splunk-dashboards/skills/viz/ds-viz-singlevalueicon/test-dashboard/` and are validated by `splunk_dashboards.validate.check_all`.

---

## Cross-references

- `ds-viz-singlevalue` — the icon-less variant. Use when the number is the only message.
- `ds-viz-singlevalueradial` — single value as a filled ring (percentage of a known whole).
- `ds-viz-markergauge` / `ds-viz-fillergauge` — single value against a target / range.
- `ds-pick-viz` — full decision matrix.
- `ds-design-principles` — KPI tile sizing, contrast, hierarchy.
