---
name: ds-viz-ellipse
description: Splunk Dashboard Studio splunk.ellipse shape primitive — circular and oval shape for status dots, KPI accent rings, donut outlines, decorative blobs, and circular legend swatches. Provides patterns for static fills, DOS-bound RAG status dots that flip on a metric, token-driven colour pickers, and the canonical "ring + singlevalue overlay" KPI recipe. Use when the user asks about ellipses, status dots, KPI rings, donut outlines, circular shapes, or background blobs in Splunk Dashboard Studio.
---

# splunk.ellipse — circular shape primitive

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_ellipse_dark` / `ds_viz_ellipse_light`.

The circular / oval shape primitive in Dashboard Studio. Same purpose
as `splunk.rectangle` but with curves: status dots, KPI accent rings,
donut outlines, decorative blobs, circular legend swatches.

## When to use

- **Status dots / health indicators** — tiny circles next to labels.
- **KPI accent rings** behind a circular `splunk.singlevalue`.
- **Donut outlines** — transparent fill + thick stroke.
- **Faint background blobs** — large radius, very low `fillOpacity`,
  decorative only.
- **Legend swatches** for circular plot markers (bubble, scatter,
  marker gauge).

## When NOT to use

- **Rectangular cards / pills** → `splunk.rectangle` (it has `rx`/`ry`
  for rounded-corner pills; ellipses do not).
- **Photographic content** → `splunk.image`.
- **Typographic content** → `splunk.markdown` (ellipses never render
  text).
- **Grid layouts** — ellipses only render in **absolute** layout.

## Quick start

```json
{
  "viz_status_dot": {
    "type": "splunk.ellipse",
    "options": {
      "fillColor": "#0E7C70",
      "strokeColor": "transparent"
    }
  }
}
```

Layout: place at e.g. `{ "x": 20, "y": 20, "w": 16, "h": 16 }` next to
a `splunk.markdown` label. **Shape is set by panel aspect ratio**:
`w == h` is a circle, `w != h` is an oval.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Layout:** absolute only. | Paste into grid layout — fails silently. |
| **Circle:** `w == h` exactly. | Mix `w: 200, h: 195` and expect a circle — 5 px difference is visible. |
| **Status dot RAG:** disjoint, gap-free buckets `[{to:60}, {from:60, to:80}, {from:80}]`. | Overlap `[{to:70}, {from:60, to:80}, {from:70}]` — second bucket is dead because top-down + first-match wins. |
| **Pair with text:** `splunk.markdown` (label) or `splunk.singlevalue` (KPI ring overlay). | Expect the ellipse to render text — it never does. |
| **Theme-aware:** always set `fillColor` explicitly for shipped dashboards. | Ship with bare `options: {}` — default fill is theme-dependent and looks different dark vs light. |
| **Big-screen visibility:** ≥ 20 × 20 px for SOC wall displays. | Ship 12 × 12 dots for projector use — invisible at distance. |
| **DOS pickers:** `> primary \| seriesByName('field')` OR `seriesByType("number")` (both work). | Use `seriesByIndex(0)` when SPL field order isn't stable. |
| **Drilldown:** hardcode handlers per ellipse — payload is `n/a`. | Read `$click.value$` / `$row.<field>$` — ellipse click events have no contextual payload. |

## Three colour-source patterns

### 1. Static colour (most common)

```json
"options": { "fillColor": "#0E7C70" }
```

### 2. DOS-bound colour — data-driven status dot

```json
{
  "type": "splunk.ellipse",
  "dataSources": { "primary": "ds_health" },
  "options": {
    "fillColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)",
    "strokeColor": "transparent"
  },
  "context": {
    "thresholds": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  }
}
```

Disjoint, gap-free buckets. Verify with at least one demo value per
bucket (health = 20 / 60 / 95 against thresholds 60 / 80) — boundary
values are easy to mis-route.

### 3. Token-driven — input-driven colour

```json
"options": { "fillColor": "$colour_token$" }
```

Pair with an `input.dropdown`. Token must produce a valid hex string.
Use for design previews and brand-colour pickers.

## Six options total

| Option | Type | Default | Notes |
|---|---|---|---|
| `fillColor` | string (hex) | `> themes.defaultFillColor` | DOS-bindable. |
| `fillOpacity` | number 0–1 | `1` | UI also accepts `"80%"`. |
| `strokeColor` | string (hex) | `> themes.defaultStrokeColor` | DOS-bindable. |
| `strokeDashStyle` | number (px) | `0` (solid) | Dash & gap length, both equal. |
| `strokeOpacity` | number 0–1 | `1` | Independent of `fillOpacity`. |
| `strokeWidth` | number 1–25 (px) | `1` | Hard-clipped at 25. |

No `rx`/`ry`, no `strokeJoinStyle` (no corners on a curve).

> Legacy PDF examples occasionally use `fill`/`stroke` (no "Color"
> suffix). The canonical 10.4 names are `fillColor`/`strokeColor`.

## See also

- [PATTERNS.md](PATTERNS.md) — 16 verified patterns: circle, oval,
  fade levels, donut outline, dashed ring, status dots, KPI ring +
  singlevalue overlay, DOS RAG, token-driven.
- `ds-viz-rectangle` — rectangular twin with `rx`/`ry` for pills.
- `ds-viz-singlevalue` — overlay number on top of a KPI ring.
- `ds-viz-markdown` — pair with status dot for "label + indicator".
- `ds-design-principles` — RAG colour discipline.
