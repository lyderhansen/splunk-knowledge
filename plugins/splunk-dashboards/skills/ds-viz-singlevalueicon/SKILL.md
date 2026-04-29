---
name: ds-viz-singlevalueicon
description: Splunk Dashboard Studio splunk.singlevalueicon visualization — KPI tile with a leading or trailing icon for categorical identity. Provides patterns for icon-prefixed KPI strips, dynamic iconColor (RAG status lights), icon-only tiles, and the per-instance icon URL caveat. Use when the user asks about icon KPI tiles, KPI with icon, status lights, iconColor, iconPosition, or visually-distinguished tile rows in Splunk Dashboard Studio.
---

# splunk.singlevalueicon — KPI tile with icon

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_singlevalueicon_dark` /
`ds_viz_singlevalueicon_light`.

`splunk.singlevalueicon` is `splunk.singlevalue` with an icon. Same
KPI semantics — major value, under-label, optional trend — plus a
leading or trailing glyph that gives the tile categorical identity at
a glance.

## When to use

- KPI strip needs **categorical icons** — a row where each icon
  (revenue, users, errors, latency) gives the metric an identity
  before the eye reads the number.
- The icon **is** the message (status lights, mode indicators) —
  combine with `showValue: false` for icon-only tiles.
- Dynamic `iconColor` (DOS + `rangeValue`) for traffic-light status
  without losing the icon's shape.

## When NOT to use

- **Default KPI tile** — plain `splunk.singlevalue` reads faster when
  the number is the only thing that matters.
- **Sparkline-driven tile** — `splunk.singlevalueicon` does NOT
  support `sparkline*` options. Use `splunk.singlevalue`.
- **Number against a target** → `splunk.markergauge` /
  `splunk.fillergauge`.

## Layout requirement

`splunk.singlevalueicon` **only renders inside Absolute layout**. In a
Grid layout it falls back to a plain singlevalue without the icon.

```json
"layout": { "type": "absolute", "options": { "width": 1440, "height": 900 } }
```

## Quick start

```json
{
  "type": "splunk.singlevalueicon",
  "title": "Revenue",
  "dataSources": { "primary": "ds_revenue" },
  "options": {
    "icon": "default",
    "iconPosition": "before",
    "underLabel": "Revenue (24h)",
    "unit": "$",
    "unitPosition": "before",
    "shouldAbbreviateTrendValue": true,
    "trendDisplay": "percent"
  }
}
```

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Layout:** Absolute only. | Grid layout — falls back to plain singlevalue. |
| **Portable icon:** `"icon": "default"` for ship-anywhere dashboards. | `splunk-enterprise-kvstore://...` URLs in distributed dashboards — UUIDs are per-instance. |
| **Picker, not invention:** copy `splunk-enterprise-kvstore://name__UUID.svg` URL via the editor's icon picker. | Hand-craft the UUID — it's generated at upload time and cannot be invented. |
| **Dynamic icon colour:** `iconColor: "> primary \| seriesByName('value') \| lastPoint() \| rangeValue(thresholds)"`. | Try to swap the icon itself based on threshold — no API for that; vary `iconColor` only. |
| **Icon-only tile:** `showValue: false`. | Mix icon-only with sparkline expectation — sparkline is unsupported here. |
| **Threshold buckets:** disjoint, gap-free, top-down. | Overlapping bands — middle bucket unreachable, RAG breaks silently. |

## Two valid `icon` forms (10.2.1)

### 1. `"default"` — generic Splunk square

```json
"options": { "icon": "default" }
```

Works everywhere, no upload. **The only form portable across Splunk
instances.**

### 2. KV-store URL (per-instance)

```json
"options": {
  "icon": "splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg"
}
```

The icon is an SVG already uploaded to the `splunk_dashboard_icons`
KV-store collection on this Splunk instance.

**Per-instance footgun.** Icon URLs are NOT portable. The UUID is
unique per upload per instance. A dashboard authored on instance A and
shipped to B silently loses its icons unless the same SVGs are
re-uploaded on B (mints new UUIDs) and URLs rewritten. For portable
artefacts, prefer `"icon": "default"`.

### Forms that do NOT render on 10.2.1

- `data:image/svg+xml;utf8,...` data URIs — inline SVG.
- `splunk-enterprise-kvstore://abcd1234...` bare ObjectId without
  filename / `.svg` suffix.
- Bare named tokens (`thermometerFull`, `check`, etc.) — treated as
  literal filename and 404s.

## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: default, before /
  after positions, dynamic `iconColor`, custom `iconWidth`,
  icon-only, KPI strip layout.
- [OPTIONS.md](OPTIONS.md) — full option list (subset of singlevalue,
  plus icon-specific).
- `ds-viz-singlevalue` — sparkline-driven tile.
- `ds-viz-singlevalueradial` — fill ring instead of icon.
- `ds-viz-markergauge` / `ds-viz-fillergauge` — banded value displays.
