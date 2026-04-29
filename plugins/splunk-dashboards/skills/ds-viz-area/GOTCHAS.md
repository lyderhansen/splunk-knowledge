# splunk.area — gotchas (Splunk 10.2.1)

## 1. `stackMode: "auto"` is unstacked, not stacked

Same trap as `splunk.bar` and `splunk.column`. Default is unstacked
overlap with `areaOpacity` blending. Set `"stacked"` explicitly for
cumulative.

## 2. Negative values break area

Area assumes non-negative inputs. With negatives:

- `stackMode: "auto"` (overlap) — negative regions render below zero,
  blending strangely with positives.
- `stackMode: "stacked"` — Splunk stacks the negative *above* zero,
  inverting the meaning of the chart.

Use `splunk.line` (no fill) for delta data, or `splunk.column` with
`showYAxisWithZero: true`.

## 3. Series order in stack matters

The first SPL output column is the bottom of the stack. Largest series
should be at the bottom (so it doesn't visually flatline). Sort with
`| sort` or use `seriesColorsByField` + manual SPL ordering.

## 4. `nullValueDisplay: "zero"` changes stacked totals

With stacking, `"zero"` adds a zero contribution at the gap, lowering
the total. `"gaps"` skips the bucket entirely, raising the total
visually. Both lie differently. `"connect"` is usually the right answer
for sampling gaps.

## 5. `areaOpacity` defaults to 0.75 — wrong for both stacked and overlap

- For stacked: too transparent — the top-edge line is fuzzy. Set 0.85+.
- For overlap: too opaque — bottom regions hidden. Set 0.4–0.5.

The default suits no one.

## 6. `showLines: false` + thin stack = no edge

Without the line edge, adjacent series in a thin stack blur together.
Either keep `showLines: true` or use a high-contrast palette.

## 7. `yAxisScale: "log"` + stacked = visually wrong

Log scale + stacked produces stacks that grow exponentially and
compress at the top. Use linear with stacking, or log without.

## 8. `seriesColors` is positional

```spl
| eval new_series = q1 + q2
```

A SPL reordering swaps colours. `seriesColorsByField`:

```json
"seriesColorsByField": {
  "frontend": "#00D9FF",
  "backend":  "#7AA2FF"
}
```

## 9. Stacking with one series renders identically to unstacked

If `| timechart count` produces a single series, `stackMode: "stacked"`
has no effect. Splunk does NOT warn — set the explicit stacking only
when you have multiple series.

## 10. Don't add `x` / `y` DOS options

Same as line/column/bar. Area uses positional binding from `_time` +
numerics.

## 11. `resultLimit: 50000` is a hard cap

Aggregate upstream with `| timechart span=Xh`.

## 12. Light-theme palette must remap

Filled areas cover more pixels than line strokes — neon on light is
even worse than on lines. Always remap.
