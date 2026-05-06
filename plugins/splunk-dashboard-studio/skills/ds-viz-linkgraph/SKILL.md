---
name: ds-viz-linkgraph
description: Splunk Dashboard Studio splunk.linkgraph visualization — discrete categorical relationships across 2-N columns where each column is a stack of nodes and links connect adjacent columns showing co-occurring pairs. Provides patterns for taxonomies, kill chains, org charts, dependency maps, fieldOrder reordering, and full-row layout rules. Use when the user asks about link graphs, kill chains, multi-column relationships, taxonomy visualization, or attack-path diagrams in Splunk Dashboard Studio.
---

# splunk.linkgraph — multi-column relationship graph

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_linkgraph_dark` / `ds_viz_linkgraph_light`.

The workhorse for **discrete categorical relationships across 2-N
columns**. Each column is a stack of nodes; links connect adjacent
columns where pairs co-occur.

## When to use

- Each column is a **distinct taxonomy level** (Region → Team → Lead,
  or Actor → Technique → Asset → Action).
- You don't care about magnitude on links — just *which pairs exist*.
  If link width must encode a numeric value, use `splunk.sankey`.
- ~5-50 distinct nodes per column. Past `resultLimit` (default 50)
  trailing nodes are truncated silently.

## When NOT to use

| Story | Use instead |
|---|---|
| Numeric flow / weighted relationships | `splunk.sankey` (link width = value) |
| Single-axis frequency | `splunk.bar` / `splunk.column` |
| Free-text search results | `splunk.events` |

## Quick start

```json
{
  "type": "splunk.linkgraph",
  "title": "Attack path",
  "dataSources": { "primary": "ds_kill_chain" },
  "options": {
    "fieldOrder": ["Actor", "Technique", "Asset", "Action"],
    "nodeWidth": 220,
    "nodeHeight": 50,
    "nodeSpacingX": 80,
    "linkWidth": 6,
    "showNodeCounts": true,
    "showValueCounts": true
  }
}
```

```spl
| ... | table Actor Technique Asset Action
```

Each row = one connection across all columns. Field order matters
(unless overridden with `fieldOrder`).

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Field order:** `fieldOrder` to put the most decision-relevant column first (e.g. `Action` first to lead with response posture). | Trust SPL emission order — `\| stats` reorders unpredictably. |
| **Subset columns:** `fieldOrder` array drops unspecified columns entirely. | Hide columns by removing them from SPL — slower than just listing what you want. |
| **Full row** when ≥4 columns, hero sizing, long labels, or `linkWidth ≥ 6`. | Half-row layouts with kill chains — labels truncate, links cross illegibly. |
| **Promote dimensions together:** when you bump `nodeWidth` to 280, also bump `nodeSpacingX` to 60-80 and `nodeSpacingY` to 12-16. | Wide nodes with default spacing — looks small in wide canvas. |
| **resultLimit visibility:** description notes truncation when `showNodeCounts: true` shows >50 nodes. | Default `resultLimit: 50` with 80+ rows — silent truncation; viewer reads "73" but sees 50. |
| **Sankey for weighted:** if link width must encode a value. | Hack `linkWidth` per row — there's no per-link width DOS. |

## Layout: when a linkgraph deserves a full row

| Panel scale | Layout |
|---|---|
| Default-styled, 2-3 columns, short labels, ≤10 nodes/col | half-row OK |
| 4+ columns | **full row** |
| Hero sizing (`nodeWidth ≥ 280`, `nodeHeight ≥ 50`) | **full row** |
| Long labels (CIDRs, FQDNs, technique names) | **full row** |
| `linkWidth ≥ 6` (links are headline) | **full row** |

## Verified patterns

13 panels in `ds_viz_linkgraph_dark`. Inspect for live JSON:

1. Default — canonical PDF example.
2. PDF-styled — yellow nodes, red links, `nodeWidth: 220`,
   `nodeHeight: 50`.
3. 4-column kill chain (Actor → Technique → Asset → Action).
4. `fieldOrder` reorder — Action first (response posture).
5. `fieldOrder` subset — Actor + Asset only.
6. Highlight colours.
7. Thick links (`linkWidth: 8`).
8. Compact (`nodeWidth: 120, nodeHeight: 18, nodeSpacingY: 4`).
9. Hero sizing.
10. Counts off — cleaner; loses magnitude story.
11. Counts on (defaults) — for direct comparison.
12. `resultLimit: 8` truncation demo.
13. Tinted background — editorial grouping.

## See also

- [OPTIONS.md](OPTIONS.md) — full options table (sizing, field
  control, colour, toggles).
- [GOTCHAS.md](GOTCHAS.md) — silent truncation, no per-column
  palette, no dynamic link colour, hero-sizing pitfalls.
- `ds-viz-sankey` — weighted flow (link width = value).
- `ds-viz-table` — exact pair inspection.
- `ds-viz-bar` — single-axis frequency.
- `ds-viz-events` — free-text search results.
