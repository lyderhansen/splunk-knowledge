# Chart selection — full decision table

All 27 Dashboard Studio viz types, with the question shape they
answer best and the most common wrong-tool failure mode.

| Question shape | Recommended viz | Why not the obvious alternative |
|---|---|---|
| What is the current value of one metric? | `splunk.singlevalue` + threshold colouring | Not bar: values not comparable across time. |
| Current value with leading icon? | `splunk.singlevalueicon` | Not singlevalue: numeric alone requires threshold reading. |
| Current value as % of known whole? | `splunk.singlevalueradial` | Not bar: radial fill communicates percentage at a glance. |
| Value against a banded scale? | `splunk.markergauge` | Not singlevalue alone: margin / headroom invisible. |
| % of capacity consumed? | `splunk.fillergauge` | Not line: fill communicates fullness better. |
| How has a metric changed over time? | `splunk.line` | Not bar: bars imply discrete categories, not continuous time. |
| How does cumulative total stack over time? | `splunk.area` (stacked) | Not line: lines obscure part / whole. |
| How do discrete categories compare? | `splunk.column` (vertical) | Not pie >6 cats: slices unreadable. |
| Top N (many categories with long labels)? | `splunk.bar` (horizontal, sorted descending) | Not column: long labels rotate unreadably on x-axis. |
| Part-to-whole, ≤6 categories, one dominates? | `splunk.pie` (or donut) | Not bar: pie communicates "share" at a glance for small N. |
| Correlation between two numeric measures? | `splunk.scatter` | Not line: line implies time ordering. |
| Three-variable correlation (x, y, volume)? | `splunk.bubble` | Not scatter: bubble adds dimension without extra chart. |
| Multi-dimensional comparison (>3 dims)? | `splunk.parallelcoordinates` | Not scatter: parallel coords handles >2 dimensions. |
| Event frequency by hour × weekday? | `splunk.punchcard` | Not table: punchcard reveals patterns tables hide. |
| Geographic distribution of events? | `splunk.map` (real geo) | Not table: location patterns invisible in rows. |
| Custom polygon / floor plan shading? | `splunk.choropleth.svg` | Not map: no Leaflet basemap fits the geometry. |
| Flow between sources and targets (numeric weights)? | `splunk.sankey` | Not stacked bar: Sankey shows path, not just totals. |
| Discrete relationships across N taxonomy levels (no weights)? | `splunk.linkgraph` | Not sankey: link width matters in sankey, not in linkgraph. |
| Timeline of discrete events / incidents? | `splunk.timeline` | Not line: timeline handles categorical events. |
| Raw event payloads with field metadata? | `splunk.events` | Not table: events preserves `_raw`, supports field actions. |
| Dense tabular detail with drilldown? | `splunk.table` | Not chart: exact values + drilldown require table. |
| Severity-coloured heatmap rows? | `splunk.table` + `_color_rank` + DOS row tinting | Not punchcard: tabular data needs exact rows visible. |
| Section header / context / instructions? | `splunk.markdown` | Not table: table implies data, not prose. |
| Logo / screenshot / floor plan image? | `splunk.image` | Not markdown: markdown can't embed arbitrary images. |
| Visual grouping / card background? | `splunk.rectangle` | Not panel borders: rectangles allow layering. |
| Status dot / KPI accent ring / decorative blob? | `splunk.ellipse` | Not rectangle: ellipse for circular shapes only. |

## Decision tree shortcuts

### "Show me X over time"

→ Continuous metric → `splunk.line`
→ Cumulative / stacked → `splunk.area`
→ Discrete buckets (per-day count) → `splunk.column`
→ Discrete events (deploys, alerts) → `splunk.timeline`

### "Show me X by category"

→ ≤6 categories, one dominates, share matters → `splunk.pie`
→ Top N with long labels → `splunk.bar` (sorted)
→ Short labels, simple counts → `splunk.column`
→ Heatmap by hour × weekday → `splunk.punchcard`

### "Show me X across geography"

→ Real countries / states with Leaflet → `splunk.map`
→ Custom shapes (floor plan, schematic) → `splunk.choropleth.svg`
→ Latitude / longitude points → `splunk.map` marker layer
→ Country shading without basemap → `splunk.choropleth.svg` with country SVG

### "Show me single value"

→ Pure number → `splunk.singlevalue`
→ Number + leading icon → `splunk.singlevalueicon`
→ % of known whole as ring → `splunk.singlevalueradial`
→ Value within a banded scale → `splunk.markergauge`
→ How full / how complete → `splunk.fillergauge`

### "Show me relationships"

→ 2D numeric correlation → `splunk.scatter`
→ 3D (x, y, volume) → `splunk.bubble`
→ N-dimensional comparison → `splunk.parallelcoordinates`
→ Flow A → B → C with weights → `splunk.sankey`
→ Network / taxonomy without weights → `splunk.linkgraph`

### "Show me detail"

→ Tabular detail → `splunk.table`
→ Raw events with field metadata → `splunk.events`
→ Multi-dimensional comparison across rows → `splunk.parallelcoordinates`

## When in doubt

- **Pie** — defaults to wrong choice. Use bar unless ≤6 + one
  dominates.
- **Stacked area** — defaults to wrong choice for independent series.
  Use multi-series line unless cumulative is the message.
- **Multi-layer maps** (marker + bubble) — unreliable. Two separate
  panels.
- **Tables** — never without drilldown.

See `ds-viz-pitfalls` for the cross-skill gotchas matrix when the
right viz is picked but mis-configured.
