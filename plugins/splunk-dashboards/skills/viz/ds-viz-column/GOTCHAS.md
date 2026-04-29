# splunk.column — gotchas (Splunk 10.2.1)

## 1. Default `stackMode` is `"auto"` = grouped, not stacked

If you want vertical sums, set `"stacked"` explicitly. Same trap on
`splunk.bar` and `splunk.area`.

## 2. `columnGrouping: "overlay"` silently disables `stackMode`

No warning, no error. Pick one:

- `stackMode: "stacked"` → cumulative
- `columnGrouping: "overlay"` → target-vs-actual on top of each other

Combining them: stacking is dropped silently.

## 3. Don't add `x` / `y` DOS options

Column uses positional binding from `| table` output: first column =
x-axis category (or `_time`), remaining numerics = y-axis values.

**Adding `"x":` or `"y":` keys at the panel `options` level silently
flips axes and drops bars.** Same trap as `splunk.bar`.

## 4. `columnSpacing` / `seriesSpacing` are absolute pixels, not ratios

Splunk doesn't enforce a minimum bar width. On narrow panels with many
categories you can end up with bars that are 1 px wide. Test on the
smallest panel size you intend to ship.

## 5. `xAxisLabelRotation` only accepts 5 discrete values

`-90 | -45 | 0 | 45 | 90`. Other numbers are silently ignored (no
rotation applied). Use `-45` for most "long label" cases.

## 6. `dataValuesDisplay: "all"` cluttered above ~8 bars

Use `"minmax"` to label only the longest/shortest, or turn it off and
rely on tooltip.

## 7. Negative values + `stackMode: "stacked"` is undefined

Splunk stacks them above zero anyway, producing a misleading total.
Use `auto` (grouped) and `showYAxisWithZero: true`.

## 8. `yAxisScale: "log"` rejects ≤ 0

Combined with bars-near-zero, bars vanish. Set `yAxisMin: "1"` (or
filter the data) when using log scale.

## 9. `seriesColors` is positional

```spl
| eval delta = q3 - q1
```

A SPL reordering swaps the colours. Use `seriesColorsByField`:

```json
"seriesColorsByField": {
  "q1": "#00D9FF",
  "q2": "#7AA2FF",
  "q3": "#B57BFF"
}
```

## 10. `resultLimit` (50000) drops bars without warning

Aggregate upstream with `| head 25`, `| top limit=25`, or a `| where`
filter on the long tail.

## 11. First column controls the x-axis

If your SPL puts the value first:

```spl
| stats sum(x) as total by region
```

Splunk renders bars-by-`total` (numeric x) instead of by `region`.
Reorder:

```spl
| table region total
```

## 12. Annotations work on column, NOT on bar

The 10.4 PDF options table for `splunk.column` lists `annotationX` /
`annotationLabel` / `annotationColor`. The `splunk.bar` options table
does NOT list them. Don't try to port column's annotation pattern to
bar — switch to column if you need annotations.

## 13. Trellis is changelog-vs-PDF inconsistent

The 10.0.2503 changelog enables trellis for column; 10.4 *Trellis
layout* page says single-value only. Until verified on your version,
prefer `showSplitSeries: true` (PATTERNS.md pattern 12) — it's
guaranteed to work.

## 14. Time-series x-axis: large data with `_time` reverts to "category" rendering

When `_time` has too many distinct values to fit on the x-axis, Splunk
silently switches to category-style rendering and labels collide.
Either `| timechart span=Xh` to bucket coarsely, or switch to
`splunk.line` / `splunk.area` for continuous time.