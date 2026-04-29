# splunk.pie — gotchas (Splunk 10.2.1)

## 1. No `sort` option

Slice order = SPL output order. **Always** end your search with:

```spl
| sort - <value_field>
```

Or the largest slice won't be first.

## 2. `collapseThreshold` is a fraction (0–1), not a percent

- `0.05` = 5% threshold ✅
- `5` = 500% threshold = collapses everything into `Other` ❌
- `0.5` = 50% threshold = collapses every slice except the dominant one ✅

## 3. `collapseThreshold` operates on share of total, not raw value

Two slices can both be huge and still trigger collapse if their
combined share is small relative to a dominant slice.

## 4. `seriesColorsByField` keys must match label EXACTLY

Case-sensitive. Whitespace-sensitive. If the SPL emits `"Healthy"`
(capital H), the key must be `"Healthy"`. Mismatched keys silently
fall back to the default palette.

## 5. Legend cannot be moved or hidden via options

There is no `legendDisplay` for pie. If the legend is in the way:

- Use a wider panel.
- Switch to `splunk.bar` with `legendDisplay: "off"` (bars don't need
  a legend if labelled).

## 6. Pie ignores `defaults.visualizations.global.backgroundColor`

Set `backgroundColor` per panel if you need a transparent or themed
background.

## 7. Donut hole + small panel = no readable label space

When `showDonutHole: true` and the panel is below ~280 px wide, set
`labelDisplay: "off"` and let the legend do the work.

## 8. Pie has no axes, gridlines, log scale, dual axis, annotations, stacking, trellis

If you find yourself wanting any of those, switch viz family:

- "Share over time" → `splunk.area` / `splunk.column` with
  `stackMode: "stacked100"`.
- "Long-tail breakdown with ranks" → `splunk.bar` (top-N).
- "Single big number with breakdown ring" → chrome-stripped donut +
  `splunk.singlevalue` overlay (PATTERNS.md pattern 10).

## 9. >5 slices is rarely readable

Even with `labelDisplay: "valuesAndPercentage"`, pie reads poorly above
5 slices. Apply `collapseThreshold` aggressively (0.05 or 0.10), or
switch to `splunk.bar`.

## 10. Default `collapseThreshold: 0.01` is too low

1% means the long tail still shows tiny slices. Bump to 0.02–0.05 for
executive views.

## 11. `seriesColors` index follows SPL row order

Same as `seriesColorsByField` but by position. After `| sort` the
positions shift — use `seriesColorsByField` whenever colour carries
meaning.

## 12. Pie always renders a legend (no opt-out)

Build panel layout assuming there's a legend. If the panel can't
accommodate one, switch to a chrome-stripped donut (PATTERNS.md
pattern 10) and use a separate `splunk.markdown` panel for the
explanation.
