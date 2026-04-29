# splunk.line — gotchas (Splunk 10.2.1)

## 1. `stackMode` does NOT exist on `splunk.line`

It belongs to `splunk.area` / `splunk.column` / `splunk.bar`. If you
want a stacked time chart, switch to `splunk.area` (`ds-viz-area`).

## 2. `xAxisLabelRotation` rarely useful on time axis

Splunk's default thinning works better. Use rotation only on
`splunk.column` with long category labels.

## 3. Annotations need a SECOND data source

The `dataSources.annotation` key is required. Without it,
`annotationX` / `annotationLabel` / `annotationColor` expressions
return null and no marks render — no error, no warning.

The annotation SPL must produce exactly three columns:

```spl
| table _time annotationLabel annotationColor
```

## 4. `yAxisScale: "log"` rejects ≤ 0

Set `yAxisMin: "1"` (or higher) explicitly. Otherwise series with zero
values silently vanish from the chart.

Also set `showYMinorGridLines: false` — log decade ticks are noisy.

## 5. `nullValueDisplay: "zero"` is almost always wrong

It conflates "no data" with "metric was zero". Use `"gaps"` (default)
or `"connect"` (bridge sampling holes).

## 6. `seriesColors` is positional and brittle

A SPL change that reorders fields silently swaps colours. Use
`seriesColorsByField` whenever colour carries meaning.

## 7. `resultLimit: 50000` is a hard cap

Beyond that, points are dropped without warning. Aggregate upstream
with `| timechart span=Xh` or `| bin _time`.

## 8. Field names starting with `_` (other than `_time`) are not plotted

If a series disappears, check it isn't named `_anything`. Splunk treats
underscore-prefixed fields as internal metadata.

## 9. Single-series colour goes to `seriesColors[0]`, not viz colour

There is no `lineColor` option. To colour a single line, use:

```json
"seriesColors": ["#00D9FF"]
```

…or if the series has a stable name:

```json
"seriesColorsByField": { "request_count": "#00D9FF" }
```

## 10. Sparkline pattern requires hiding `xAxisLabelVisibility`

The convention hides title and major tick but keeps `xAxisLabelVisibility: "auto"`.
For the sparkline pattern (no chrome), you must explicitly add
`xAxisLabelVisibility: "hide"`. Otherwise the labels appear and the
"sparkline" looks like a normal chart.

## 11. Trellis is changelog-vs-PDF inconsistent

10.0.2503 changelog enables trellis for line; 10.4 *Trellis layout*
contradicts. Until verified on your Splunk version, prefer
`showSplitSeries: true` (PATTERNS.md pattern 8) — stable since well
before 10.0.

## 12. Light-theme palette must remap

Neon colours on light backgrounds vibrate; deep desaturated colours on
dark backgrounds disappear. Always remap (see PATTERNS.md pattern 12).