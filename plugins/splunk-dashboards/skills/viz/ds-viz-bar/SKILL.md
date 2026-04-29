---
name: ds-viz-bar
description: Splunk Dashboard Studio splunk.bar visualization — horizontal bar charts. Provides configuration patterns for top-N rankings, long category labels, stacked breakdowns, and share-of-mix views. Use when the user asks about bar charts, top-N tables, hostname/URL/region comparisons, horizontal bars, or any time vertical (column) labels would clip in Splunk Dashboard Studio.
---

# splunk.bar — horizontal bar chart

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_bar_dark` / `ds_viz_bar_light` in
`splunk-knowledge-testing`.

`splunk.bar` is `splunk.column` rotated 90°. Categories on the y-axis,
values on the x-axis, so `xAxis*` controls the value axis and
`yAxis*` controls the category axis.

## When to use

- Top-N rankings sorted descending — easier to scan than vertical
  columns when you want "who's longest".
- Long category labels (hostnames, URLs, error messages, country
  names) that would clip on a column chart.
- ≤25 categories. Above that, paginate or aggregate.
- Stacked breakdowns (`stackMode: "stacked"`) or share-of-mix
  (`stackMode: "stacked100"`).

## When NOT to use

- **Time-series** → `splunk.line` / `splunk.area` / `splunk.column`.
  Bar inverts time intuition.
- **Short labels that fit horizontally** → `splunk.column` is more
  conventional and reads slightly faster.
- **Two numeric dimensions** (correlation, distribution) →
  `splunk.scatter` or `splunk.bubble`. Bar plots one value per
  category, not two against each other.
- **>25 rows** → `splunk.table` with sortable columns, or aggregate to
  Top-N + "Other".

See `ds-pick-viz` for the full decision matrix.

## Quick start

```json
{
  "type": "splunk.bar",
  "title": "Top attacker IPs",
  "dataSources": { "primary": "ds_top_attackers" },
  "options": {
    "seriesColors": ["#DC4E41"],
    "legendDisplay": "off",
    "xAxisTitleText": "Attacks (24h)",
    "xAxisTitleVisibility": "show",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

SPL emits `category, value` columns; `splunk.bar` auto-binds first
column as y-axis category, last numeric as x-axis value:

```spl
| ... | stats sum(attacks) as attacks by src_ip
| sort - attacks
| head 10
| table src_ip attacks
```

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Binding:** SPL emits `category, value` columns; viz auto-binds first as y-axis category, last numeric as x-axis value. | Add `"x":` or `"y":` DOS options. Those are `splunk.scatter` / `splunk.bubble`-only. Bar silently ignores them and renders with axes flipped + no bars. |
| **SPL:** `\| sort - count` to control row order. | Rely on Splunk to sort — bars render in the exact order SPL emits. Random order is unreadable. |
| **Styling:** `seriesColors: ["#hex1"]` (array of hex strings). | `seriesColors: "#hex1,#hex2"` (CSV string is rejected by the schema). |
| **Styling:** `seriesColorsByField: { fieldName: "#hex" }` for refactor safety. | Rely on positional `seriesColors` when columns can be added/removed in SPL — colours rotate to wrong series silently. |
| **Axes:** `yAxisTitleVisibility: "hide"`, `yAxisMajorTickVisibility: "hide"`. Keep `xAxisTitleText` set on the value axis. | Show both axis titles — duplicates the chart title and the category labels. |
| **Layout:** ≤25 rows; aggregate beyond that to top-N + "Other". | Render 100+ rows expecting Splunk to paginate. The viz draws all rows; the panel scrolls but labels collide. |
| **Drilldown:** `eventHandlers` with `drilldown.setToken`, read `row.<field>.value`. | Read `$click.value$` / `$click.value2$` — bar emits row events, not click events (those are scatter/line/bubble). |
| **Versioning:** stick to options listed in the 10.4 PDF options table. | Use `annotationX` / `annotationLabel` / `annotationColor` — annotations appear in PDF prose but not the options table; they don't render on bar charts. |

## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: minimal,
  multi-series grouped, stacked, stacked100, negative, log scale,
  data labels, sparkbar, split sub-charts.
- [OPTIONS.md](OPTIONS.md) — full options reference.
- [GOTCHAS.md](GOTCHAS.md) — visual + perf + edge-case gotchas.
- `ds-viz-column` — vertical equivalent.
- `ds-pick-viz` — viz selection router.
- `ds-design-principles` — REFLEX 6 (tables/bars without drilldown),
  REFLEX 8 (pie vs bar for breakdowns).
