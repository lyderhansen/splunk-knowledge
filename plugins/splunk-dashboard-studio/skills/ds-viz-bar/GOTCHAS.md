# splunk.bar — gotchas (Splunk 10.2.1)

## 1. Axes are flipped vs column

`xAxis*` is the **value** axis; `yAxis*` is the **category** axis. The
#1 source of confusion when porting from `splunk.column`. The axis
convention template (in OPTIONS.md) hides `yAxis*Visibility`, **not**
`xAxis*Visibility`.

## 2. Don't add `x` / `y` DOS options

Bar uses **positional binding** from the `| table` output: first column
= category (y-axis), last numeric = value (x-axis).

**Adding `"x":` or `"y":` keys at the panel `options` level silently
flips axes and renders no bars.** This is the same trap that broke the
SOC dashboard `viz_top_attackers` panel — applying `splunk.scatter`
patterns to bar/column. Fix: remove `x` / `y` and let positional
binding do the work.

## 3. No `columnGrouping`

Bar can't draw overlapping bars. `stackMode` is the only multi-series
layout choice. If you need overlay grouping, use `splunk.column`.

## 4. No `xAxisLabelRotation`

Numbers fit horizontally; categories are already horizontal — rotation
isn't useful and the option isn't in the bar table.

## 5. Annotations are NOT in the option table

The 10.4 prose may mention `annotationX` / `annotationLabel` /
`annotationColor`, but the **option table at line ~5784 doesn't list
them**. Don't rely on annotations on bar charts. Switch to
`splunk.column` (which DOES list them) if you need annotation lines.

## 6. Bars render in SPL output order

Always `| sort - <value>` (or `| sort + <value>`) before the `| table`.
Random order is unreadable. Splunk does **not** auto-sort bar charts.

## 7. Default `stackMode: "auto"` is grouped, not stacked

Same as `splunk.column`. To stack, you must set `stackMode: "stacked"`
or `"stacked100"` explicitly.

## 8. Negative values + `stackMode: "stacked"` is undefined

Splunk's stacked sum for ± values produces visually misleading bars.
Use `stackMode: "auto"` (grouped) and `showXAxisWithZero: true`
instead. See PATTERNS.md pattern 5.

## 9. `xAxisScale: "log"` rejects ≤ 0

Set `xAxisMin: "1"` (or higher) when using log scale. Otherwise the
viz silently fails to render with a console error.

## 10. `seriesColors` is positional

```spl
| eval delta = q3 - q1
```

A SPL reordering like this swaps the colours assigned to each series
without warning. Use `seriesColorsByField`:

```json
"seriesColorsByField": {
  "q1": "#00D9FF",
  "q2": "#7AA2FF",
  "q3": "#B57BFF"
}
```

## 11. `resultLimit` (50000) drops bars without warning

For top-N work, always limit upstream with `| head 25` or
`| top limit=25`. The result limit is a hard cap with no UI surface.

## 12. First column controls the y-axis (category)

If your SPL puts the value first:

```spl
| table revenue country
```

Splunk interprets `revenue` as the category column and renders bars
labelled "1234.56", "789.01", etc. Always end with:

```spl
| table country revenue
```

## 13. `dataValuesDisplay: "all"` cluttered above ~8 rows

Use `"minmax"` to label only the longest and shortest bar when row
count exceeds 8.

## 14. Sparkbar needs both grids OFF

`showYMajorGridLines` defaults to `true` on bar charts even though the
y-axis is the category axis. Forgetting `"showYMajorGridLines": false`
leaves horizontal lines striping the panel and the "sparkbar" looks
busy. See PATTERNS.md pattern 11.

## 15. Long category labels get truncated, not wrapped

Splunk truncates with `…` when bar height shrinks. Increase panel
height or aggregate to top-N. There is no `wrapLabels` option.
