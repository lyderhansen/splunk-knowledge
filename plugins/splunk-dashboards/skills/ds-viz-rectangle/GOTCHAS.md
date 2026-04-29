# splunk.rectangle — gotchas

## 1. No grid-layout support

`splunk.rectangle` requires `layout.type: "absolute"`. Pasting into
a grid dashboard fails to render silently.

## 2. `strokeWidth` is clipped at 25 px

Anything above 25 is silently capped per the PDF.

## 3. `strokeJoinStyle` is invisible at small `strokeWidth`

You won't see a difference between `miter` and `round` at
`strokeWidth: 1`. Bump `strokeWidth` to 8+ to see the join shape.

## 4. `rx` interacts with `strokeJoinStyle`

When `rx > 0`, the corners are already curved, so
`strokeJoinStyle: round` adds nothing visible. Set `rx: 0` to see
the join style work.

## 5. `fillOpacity` and `strokeOpacity` are independent

A faded fill with a solid stroke is a common card pattern; don't
tie them together.

## 6. No drop shadow / blur primitives

To approximate elevation, layer a slightly larger, very faint
rectangle (e.g. `fillOpacity: 0.08`, `rx: 12`) **behind** the card.
**Z-order matters** — shadow rectangle must come earlier in
`structure`.

See PATTERNS.md "Faux drop-shadow (two rectangles)".

## 7. No text rendering

Rectangles never display text. Always pair with `splunk.markdown` or
`splunk.singlevalue` on top.

## 8. `fill` / `stroke` (without "Color") may appear in older example dashboards

Use the canonical `fillColor` / `strokeColor` from the 10.4 option
table. Older properties may stop working in future Splunk releases.

## 9. Transparent rectangles are still clickable

Set both `fillColor` and `strokeColor` to `"transparent"` and the
panel **still fires `onSelectionChanged`**. This is the foundation
of "image hit-zones" (see PATTERNS.md and `ds-viz-image`).

## 10. Default fill is theme-dependent

A rectangle with `options: {}` will look different in dark vs light.
**Always set `fillColor` explicitly** for shipped dashboards.

## 11. `rangeValue` thresholds — top-down, half-open, NO overlaps

- `from` is **inclusive** (`>=`).
- `to` is **exclusive** (`<`).
- Buckets evaluated **top-down**; first match wins.

When two buckets both match a value (e.g. `{to: 70}` and `{from: 60,
to: 80}` both match 65), the first one wins and the second is dead.
Always design buckets to be **disjoint** (no overlap) and
**gap-free** (no value falls outside every bucket).

Canonical RAG shape:

```json
[
  { "to": 60,             "value": "#FF2D95" },
  { "from": 60, "to": 80, "value": "#FFB627" },
  { "from": 80,           "value": "#33FF99" }
]
```

## 12. Demo data must align with the threshold domain

If you build a 3-bucket RAG card but only test it with two values,
you're not actually verifying the middle bucket. Drive the demo
with at least one value per bucket (e.g. health = 20 / 60 / 95
against thresholds 60 / 80) so each bucket is exercised on render.
