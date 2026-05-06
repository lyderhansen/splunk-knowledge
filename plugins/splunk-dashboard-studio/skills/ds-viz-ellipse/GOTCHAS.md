# splunk.ellipse — gotchas

## 1. No grid-layout support

`splunk.ellipse` requires `layout.type: "absolute"`. Pasting into a
grid dashboard fails to render silently.

## 2. Shape is set by panel aspect ratio

There is no `rx` / `ry` or radius option. For a circle, set
`w == h` exactly. Differences of even 5–10 px are visible.

## 3. `strokeWidth` is clipped at 25 px

Anything above 25 is silently capped per the PDF.

## 4. No `strokeJoinStyle` option

Ellipses have no corner joins (no straight edges on a curve).

## 5. `fillOpacity` and `strokeOpacity` are independent

A faded fill with a solid stroke is a common KPI-ring pattern —
don't tie them together.

## 6. No drop shadow / blur primitives

To approximate elevation, layer a slightly larger, very faint
ellipse behind the main shape. Z-order = `structure` array order
(earlier = behind).

## 7. No text rendering

Ellipses never display text. Always pair with `splunk.markdown` or
`splunk.singlevalue` on top.

## 8. Drilldown payload is `n/a`

Per the 10.4 PDF drilldown table, `splunk.ellipse` returns `n/a`
for `name`, `value`, and `series` payload fields. That means:

- `onSelectionChanged` **does fire** when an ellipse is clicked —
  you can use it as an invisible click-target (e.g. a pie-slice-
  shaped hit-zone over an `splunk.image`).
- But the handler receives **no contextual payload** — you'll get
  the `viz_id` of the clicked ellipse, but nothing like a row's
  `field` or `value`.
- Wire navigation with **hardcoded** drilldown URLs / token values
  per ellipse.

Same drilldown limitation as `splunk.rectangle`.

## 9. Default fill is theme-dependent

A bare `options: {}` ellipse looks completely different in dark vs
light. **Always set `fillColor` explicitly** for shipped dashboards.

## 10. Tiny ellipses can be missed at low DPI / projector resolutions

A 12 × 12 status dot is fine on a laptop but invisible on a
wall-mounted SOC display. **Bump to ≥ 20 × 20** if the dashboard is
meant for big screens.

## 11. `rangeValue` thresholds — top-down, half-open, NO overlaps

- `from` is **inclusive** (`>=`).
- `to` is **exclusive** (`<`).
- Buckets evaluated **top-down**; first match wins.

When two buckets both match a value (e.g. `{to: 70}` and
`{from: 60, to: 80}` both match 65), the first one wins and the
second is dead. Always design buckets to be **disjoint** (no
overlap) and **gap-free** (no value falls outside every bucket).

Canonical RAG shape:

```json
[
  { "to": 60,             "value": "#FF2D95" },
  { "from": 60, "to": 80, "value": "#FFB627" },
  { "from": 80,           "value": "#33FF99" }
]
```

## 12. Demo data must align with the threshold domain

If you build a 3-bucket RAG dot but only test it with two values,
you're not actually verifying the middle bucket. Drive the demo
with at least one value per bucket (e.g. health = 20 / 60 / 95
against thresholds 60 / 80) so each bucket is exercised on render.
