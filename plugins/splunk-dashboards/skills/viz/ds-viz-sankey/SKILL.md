---
name: ds-viz-sankey
description: Splunk Dashboard Studio splunk.sankey visualization — flow diagram between source/target nodes with link width proportional to value. Provides patterns for conversion funnels, workflow routing, attribution, energy/material flows, and severity-tinted dynamic colouring. Use when the user asks about Sankey diagrams, conversion funnels, kill-chain progression, attack flow, attribution flow, or workflow routing in Splunk Dashboard Studio.
---

# splunk.sankey — proportional flow diagram

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_sankey_dark` / `ds_viz_sankey_light`.

A Sankey diagram shows directed proportional flow between two columns
of nodes. Every link's thickness equals the value field for that pair,
so the eye reads volume directly without scanning a number.

> "Where does the flow go — and how much of it makes it through?"

## When to use

- Conversion funnel with drop-offs.
- Routing across N stages (intake → triage → resolve).
- Budget / spend breakdown.
- Energy / material flow.
- Attribution (channel → conversion).
- Kill-chain or attack-path progression in security.

## When NOT to use

| Scenario | Use instead |
|---|---|
| Hierarchical breakdown without flow | Custom treemap / `splunk.bar` |
| Network with cycles or peer relationships | `splunk.linkgraph` |
| Timed sequence / Gantt | `splunk.timeline` |
| Single-stage breakdown | `splunk.pie` / `splunk.bar` |

## Required data shape

The data source MUST expose three fields named **exactly**:

| Field | Type | Role |
|---|---|---|
| `source` | string | The from-node. |
| `target` | string | The to-node. |
| `value` | number | Link width / weight. |

Optional 4th numeric field drives `colorMode: "dynamic"` link colour.

```spl
... | stats sum(count) AS value by stage_from stage_to
| rename stage_from AS source stage_to AS target
| table source target value
```

## Quick start

```json
{
  "type": "splunk.sankey",
  "title": "Conversion funnel",
  "dataSources": { "primary": "ds_funnel" },
  "options": {
    "colorMode": "categorical",
    "linkOpacity": 0.6,
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF", "#FFB627"]
  }
}
```

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Field names:** lowercase `source`, `target`, `value` exactly. | `from` / `to` / `weight` — chart won't render. |
| **Numeric value:** `\| eval value = tonumber(value)` if input is text. | Pass `value` as string — silently breaks. |
| **Acyclic data:** filter `\| where source != target` upstream. | Allow `Cart → Cart` self-loops or back-edges — unpredictable rendering. |
| **Colours:** `seriesColors: ["#7B56DB", "#009CEB"]` (array). | `seriesColors: "#7B56DB,#009CEB"` — schema rejects CSV string even though 10.4 PDF shows it. |
| **Categorical palette:** ≤12 source nodes. | Expect >12 distinct colours — palette wraps. Provide a longer `seriesColors` array. |
| **Dynamic colour:** pair `colorMode: "dynamic"` with `linkColors` DOS pointing to a 4th numeric field. | Set `colorMode: "dynamic"` without `linkColors` — every link gets default colour. |
| **Top-N:** `\| sort -value \| head N` upstream. | Use `resultLimit: 4` expecting "top 4" — it picks first 4 rows from the source, not the largest. |
| **Density:** `linkOpacity: 0.2`–`0.3` when many links overlap. | Default `0.5` blindly with 50+ links — visual mush. |

## Verified patterns

12 panels in `ds_viz_sankey_dark`. Inspect for live JSON. Patterns:
canonical PDF energy example, ecommerce funnel, support routing,
`linkOpacity` editorial (0.2) and headline (0.9), custom palette,
`colorMode: "dynamic"` severity tint, branded `backgroundColor`,
`resultLimit` raised (2000) and lowered (4) for truncation, explicit
`linkValues` from multi-numeric source, alert/SOC palette.

## Eight options total

| Option | Type | Default |
|---|---|---|
| `backgroundColor` | string (hex) | `> themes.defaultBackgroundColor` |
| `colorMode` | `"categorical"` \| `"dynamic"` | `"categorical"` |
| `linkOpacity` | number 0–1 OR `"50%"` | `0.5` |
| `linkValues` | DOS string | `> primary \| seriesByType('number')` |
| `linkColors` | DOS string | `> linkValues \| rangeValue(linkColorRangeConfig)` |
| `resultLimit` | number | `1000` |
| `seriesColors` | string[] OR DOS string (must start `>`) | brand 12-colour palette |

## Drilldown

| Token | Value |
|---|---|
| `$click.name$` | Field name (`source` / `target` for nodes, `value` for links). |
| `$click.value$` | Value clicked (e.g. `Cart`, `Checkout`, `260`). |
| `$click.value2$` | n/a |

```json
"eventHandlers": [
  {
    "type": "drilldown.linkToSearch",
    "options": { "search": "index=app stage IN (\"$click.value$\")" }
  }
]
```

## Gotchas

- Field names lowercase, exact, no aliases.
- `seriesColors` CSV string rejected (PDF lies, schema is authoritative).
- Cycles / self-loops break rendering.
- `resultLimit: N` is "first N rows", not "top N by value".
- Categorical palette wraps after 12 distinct source nodes.
- Node order = layout algorithm, NOT SPL order.

## See also

- `ds-viz-linkgraph` — when network has cycles or peer relations.
- `ds-viz-bar` — single-stage breakdown.
- `ds-viz-timeline` — when sequence is timed.
- `ds-viz-events` — when individual flow events matter.
