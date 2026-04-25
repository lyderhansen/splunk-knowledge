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

The `icon` property accepts exactly two value shapes:

### 1. The literal string `"default"`

```json
"options": { "icon": "default" }
```

Renders the generic Splunk square. Useful when you want an icon-prefixed tile for visual consistency but don't need a specific glyph.

### 2. A `data:image/svg+xml;utf8,<svg ...>...</svg>` data URI

```json
"options": {
  "icon": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>"
}
```

Anything renderable as inline SVG works — Lucide, Heroicons, Splunk Visual Library exports. Two rules that make it Just Work:

- Use **single quotes inside the SVG** (the data URI lives inside a JSON string with double quotes).
- Use **`stroke="currentColor"`** (or `fill="currentColor"`) on the SVG so `iconColor` controls the colour. If you hard-code a `stroke="#FF2D95"`, `iconColor` becomes a no-op.

URL-encoding is *not* required — the `;utf8,` form passes the SVG verbatim. Keep paths short; some browsers truncate very long data URIs.

---

## 12 verified patterns (all live in `splunk-knowledge-testing`)

Each pattern below is a single `splunk.singlevalueicon` panel from the test dashboard. Copy the `options` block.

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

### 2. Inline SVG data URI (check icon)

```json
"options": {
  "icon": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>",
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
  "icon": "<svg ...>",
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
  "icon": "<svg ...>",
  "iconColor": "#7AA2FF",
  "showValue": false
}
```

### 5. Dynamic `iconColor` via `rangeValue`

Icon colour traffic-lights based on the data. Pattern: `> primary | seriesByName(field) | lastPoint() | rangeValue(thresholds)`.

```json
"options": {
  "icon": "<svg with stroke='currentColor'>",
  "underLabel": "System health",
  "unit": "/100",
  "unitPosition": "after",
  "trendDisplay": "absolute",
  "iconColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)"
},
"context": {
  "thresholds": [
    { "to": 70,             "value": "#FF2D95" },
    { "from": 70, "to": 90, "value": "#FFB627" },
    { "from": 90,           "value": "#33FF99" }
  ]
}
```

### 6. Dynamic `majorColor` (icon stays calm, number flips)

A common SOC pattern: the icon stays a calm hue (it's identity), the number flips colour (it's the alert). Reads as *"something is wrong with this metric"* without losing the icon's identity.

```json
"options": {
  "icon": "<svg ...>",
  "iconColor": "#7AA2FF",
  "underLabel": "Errors / hour",
  "trendDisplay": "absolute",
  "majorColor": "> primary | seriesByName('errors') | lastPoint() | rangeValue(majorThresholds)"
},
"context": {
  "majorThresholds": [
    { "to": 15,             "value": "#33FF99" },
    { "from": 15, "to": 25, "value": "#FFB627" },
    { "from": 25,           "value": "#FF2D95" }
  ]
}
```

### 7. `iconOpacity: 0.3` — muted secondary icon

`iconOpacity` accepts `0.0`–`1.0`. Use a low value when the icon is decorative / categorisation rather than the message; the eye lands on the value first, the icon is context.

```json
"options": {
  "icon": "<svg ...>",
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
  "icon": "<svg ...>",
  "iconColor": "#33FF99",
  "underLabel": "Orders today",
  "trendDisplay": "off"
}
```

### 9. `majorFontSize: 56` — locked size for KPI strip

Locks the number font size so a row of tiles stays visually consistent regardless of underlying value magnitude (`1.2K` and `1,245,000` will look like the same metric instead of fighting for attention).

```json
"options": {
  "icon": "<svg ...>",
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
  "icon": "<svg ...>",
  "iconColor": "#FFFFFF",
  "majorColor": "#FFFFFF",
  "underLabel": "Errors / hour",
  "trendDisplay": "absolute",
  "backgroundColor": "> primary | seriesByName('errors') | lastPoint() | rangeValue(bgThresholds)"
},
"context": {
  "bgThresholds": [
    { "to": 15,             "value": "#152034" },
    { "from": 15, "to": 25, "value": "#A85A1F" },
    { "from": 25,           "value": "#8B1F3A" }
  ]
}
```

Use sparingly — one or two of these is enough per dashboard. A wall of flashing tiles loses signal.

### 11. `shouldUseThousandSeparators: false`

Strips commas. Use for IDs, sequence numbers, version numbers — `1245000` reads as a build ID, not a quantity, when commas are absent.

```json
"options": {
  "icon": "<svg ...>",
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
  "icon": "<svg ...>",
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
| `icon` | `"default"` \| `data:image/svg+xml;utf8,<svg...>` | `"default"` | The icon. Two valid forms — see *The icon* section above. |
| `iconColor` | hex / theme token / DOS expression | theme accent | Icon stroke / fill colour. Requires SVG to use `stroke="currentColor"` to take effect. |
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

1. **`stroke="currentColor"` is mandatory** for `iconColor` to do anything. Hard-coding a stroke colour in the SVG silently disables the option.
2. **Single quotes inside the SVG**, double quotes around the JSON string. JSON-escaping nested double quotes works but produces a wall of `\"` that's hard to maintain.
3. **`backgroundColor` defaults to `"transparent"` here**, not theme background. If you want the tile to look like a `splunk.singlevalue`, set `"backgroundColor": "#1A1A1A"` (or your theme's panel colour) explicitly.
4. **Absolute layout only.** In Grid layout the panel falls back to a plain singlevalue without the icon.
5. **No sparkline.** Don't try `sparklineDisplay` here — it's silently ignored. Use `splunk.singlevalue` if you need a tile with a sparkline.
6. **`iconOpacity` is a number, not a percent.** `0.3` not `30`.
7. **Long data URIs** — keep SVGs under ~2KB. Optimise with SVGO before embedding.
8. **Light theme readability.** When `backgroundColor` flips to a light tone via `rangeValue`, lock `iconColor` and `majorColor` to a dark hex (`#1A1A1A`). The default theme text colour will be light and disappear on the light bg.

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
