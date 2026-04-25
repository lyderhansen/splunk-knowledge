---
name: ds-viz-sankey
description: |
  splunk.sankey - flow diagram between source/target nodes where link width
  is proportional to a value. The workhorse for funnels, workflow routing,
  energy/material flows, attribution, and budget breakdowns.
  Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_sankey_dark
  - ds_viz_sankey_light
related:
  - ds-viz-linkgraph
  - ds-viz-bar
  - ds-viz-column
  - ds-viz-events
---

# splunk.sankey

A **Sankey diagram** shows directed proportional flow between two columns
of nodes. Every link's thickness equals the value field for that pair, so
the eye reads volume directly without scanning a number.

> "Where does the flow go - and how much of it makes it through?"

## When to use it

| Scenario                                            | Sankey?         |
| --------------------------------------------------- | --------------- |
| Conversion funnel with drop-offs                    | Yes |
| Routing across N stages (intake -> triage -> resolve) | Yes |
| Budget / spend breakdown                            | Yes |
| Energy / material flow                              | Yes |
| Attribution (channel -> conversion)                 | Yes |
| Hierarchical breakdown without flow                 | No -> treemap (custom) / bar |
| Network with cycles or peer relationships           | No -> linkgraph |
| Timed sequence / Gantt                              | No -> timeline |

## Required data shape

The data source MUST expose three fields named exactly:

| Field    | Type    | Role |
| -------- | ------- | ---- |
| `source` | string  | The from-node |
| `target` | string  | The to-node |
| `value`  | number  | Width / weight of the link |

A 4th optional numeric field can drive **dynamic link coloring** (e.g.
`severity`, `error_rate`).

Reshape SPL example:
```spl
... | stats sum(count) AS value by stage_from stage_to
    | rename stage_from AS source stage_to AS target
    | table source target value
```

## Options

The complete option surface from the 10.4 PDF:

| Option            | Type                          | Default                                     |
| ----------------- | ----------------------------- | ------------------------------------------- |
| `backgroundColor` | string (hex)                  | `> themes.defaultBackgroundColor`           |
| `colorMode`       | `categorical` \| `dynamic`    | `categorical`                               |
| `linkOpacity`     | number (0-1) \| percent string| `0.5`                                       |
| `linkValues`      | DOS string                    | `> primary | seriesByType('number')`        |
| `linkColors`      | DOS string                    | `> linkValues | rangeValue(linkColorRangeConfig)` |
| `resultLimit`     | number                        | `1000`                                      |
| `seriesColors`    | string (CSV of hex)           | brand 12-color palette starting `#7B56DB`   |

### colorMode

- `categorical` (default) - one color per source node, drawn from `seriesColors`. Best for funnels and workflows.
- `dynamic` - link color is mapped from a numeric field via `linkColors` DOS. Best for severity/heatmap views.

### linkOpacity

Accepts both `0.5` and `"50%"` forms. Lower opacity (0.2-0.3) helps when
many links overlap; higher opacity (0.7-0.9) makes flow the headline.

### linkValues / linkColors

Both are DOS strings. Use them when your data has multiple numeric columns
and you want to choose which drives width vs color:

```json
"options": {
  "linkValues": "> primary | seriesByName(\"value\")",
  "linkColors": "> primary | seriesByName(\"severity\") | rangeValue(linkColorRangeConfig)",
  "colorMode": "dynamic"
}
```

### resultLimit

Default `1000`. Sankey degrades visually past ~80-150 distinct links. Lower
for performance and clarity, raise only when you genuinely need it.

## Verified patterns

12 panels deployed in `ds_viz_sankey_dark` / `ds_viz_sankey_light`:

1. **Default** - canonical PDF energy example with `ds.test` inline data.
2. **Ecommerce funnel** - five-stage conversion shape.
3. **Support routing** - branching workflow.
4. **linkOpacity=0.2** - editorial; node labels breathe.
5. **linkOpacity=0.9** - flow as headline.
6. **Custom seriesColors** - brand palette override.
7. **colorMode=dynamic** - severity-tinted links.
8. **Custom backgroundColor** - tinted panel.
9. **resultLimit=2000** - increase for wide flows.
10. **resultLimit=4** - truncation demo.
11. **Explicit linkValues** - pick `value2` from multi-numeric source.
12. **Alert / SOC palette**.

## Drilldown

Per the 10.4 PDF the click context for `splunk.sankey` is:

| Token                 | Value |
| --------------------- | ----- |
| `$click.name$`        | Field name of the value clicked (e.g. `source`, `target`, `value`) |
| `$click.value$`       | Value of the area clicked (e.g. `Cart`, `Checkout`, `260`) |
| `$click.value2$`      | n/a |

Pattern - drill into a node's underlying events:

```json
"eventActions": {
  "actions": [
    {
      "type": "openSearch",
      "search": "index=app stage IN (\"$click.value$\")"
    }
  ]
}
```

Tip: the click target is **either a node or a link**. To distinguish, the
clicked field name comes through as `$click.name$` (`source`/`target` for
nodes, `value` for links).

## Common gotchas

- **Field names are NOT optional.** Source/target/value must appear with
  those exact lowercase names. `from`/`to`/`weight` will not render.
- **No cycles.** Sankey is acyclic by design. If a node is both a source
  and target of the same link the chart will collapse or omit it.
- **Loops or back-edges** (e.g. `Cart -> Cart`) cause unpredictable
  rendering. Pre-filter them out in SPL.
- **String values for `value` field** silently break the chart - cast with
  `tonumber()` if the data is text.
- **Categorical color palette runs out** at ~12 source nodes - extra nodes
  reuse colors. Provide a longer `seriesColors` string for distinct nodes.
- **Dynamic mode requires a 4th numeric field** referenced by `linkColors`.
  Missing this leaves all links the same color.
- **`resultLimit: 4`** doesn't pick the "important" 4 - it picks the first
  4 rows from your data source. Pre-sort with `sort -value` if you need
  the top N.
- **Ordering of nodes** is determined by the layout algorithm, not your
  SPL order. To force ordering you typically must rebuild via custom viz
  or tweak the data so the algorithm emits the desired layout.

## Reference

Verified against `SplunkCloud-10.4.2604-DashStudio` PDF.
