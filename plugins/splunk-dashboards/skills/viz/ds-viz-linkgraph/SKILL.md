---
name: ds-viz-linkgraph
description: |
  splunk.linkgraph - visualize discrete relationships across multiple
  categorical columns. Each column becomes a stack of nodes; links connect
  adjacent columns where pairs co-occur. Best for taxonomies, kill chains,
  org charts, and dependency maps.
  Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_linkgraph_dark
  - ds_viz_linkgraph_light
related:
  - ds-viz-sankey
  - ds-viz-table
  - ds-viz-bar
  - ds-viz-events
---

# splunk.linkgraph

Link graphs are the workhorse for **discrete categorical relationships across
2-N columns**. Pick this when:

- Each column is a **distinct taxonomy level** (Region -> Team -> Lead, or
  Actor -> Technique -> Asset -> Action) and you want to *see every cross-
  column pair at once*.
- You don't care about magnitude on the links - just *which pairs exist*. If
  link width must encode a numeric value, use [`ds-viz-sankey`](../ds-viz-sankey/SKILL.md)
  instead.
- The result has roughly 5-50 distinct nodes per column. Past `resultLimit`
  (default `50`) the trailing nodes are truncated.

## When NOT to use

- **Numeric flow / weighted relationships** -> use `splunk.sankey`. Sankey
  link width = value; linkgraph link width is fixed via `linkWidth`.
- **Single-axis frequency** -> use `splunk.bar` / `splunk.column`.
- **Free-text search results** -> use `splunk.events`.

## Data shape

Each result row is **one connection across all columns**. Field order
matters: column 1 -> column 2 -> column 3 ... (you can override with
`fieldOrder`, see below).

The minimum is two categorical columns. The canonical PDF example uses three:

| Breakfast  | Lunch        | Dinner            |
| ---------- | ------------ | ----------------- |
| cheese     | quiche       | souffle           |
| croissant  | sandwich     | dinner roll       |
| eggs       | frittata     | strata            |
| eggs       | quiche       | strata            |
| eggs       | custard      | egg tart          |
| eggs       | shakshuka    | huevos rancheros  |

Built with SPL:

```spl
| makeresults count=6
| streamstats count AS rn
| eval Breakfast = case(rn==1,"cheese", rn==2,"croissant", rn>=3,"eggs")
| eval Lunch     = case(rn==1,"quiche", rn==2,"sandwich", rn==3,"frittata", rn==4,"quiche", rn==5,"custard", rn==6,"shakshuka")
| eval Dinner    = case(rn==1,"souffle", rn==2,"dinner roll", rn==3,"strata", rn==4,"strata", rn==5,"egg tart", rn==6,"huevos rancheros")
| table Breakfast Lunch Dinner
```

## Options (10.4 PDF, full list)

### Background

- `backgroundColor` - panel fill. Use for editorial tinting on dark themes
  (e.g. `#101A33` against an `#0F1729` page background).

### Layout / sizing

- `nodeWidth` - default `200`. Wider nodes accommodate longer labels.
- `nodeHeight` - default `30`. Taller nodes give labels more breathing room.
- `nodeSpacingX` - horizontal gap between columns. Default `34`.
- `nodeSpacingY` - vertical gap between nodes within a column. Default `8`.
- `resultLimit` - default `50`. Per-column cap before truncation. The
  trailing nodes are dropped silently; the column header still shows the
  *true* total when `showNodeCounts: true`.

### Field control (DOS)

- `fieldOrder` - explicit array of column names. Overrides natural order
  from the search. Two valuable patterns:
  - **Reorder** to put the most decision-relevant column first (e.g. put
    `Action` first in a kill chain to lead with the response posture).
  - **Subset** by listing only the columns you want to render. Unspecified
    columns are dropped entirely - useful when one search drives multiple
    panels with different views.

  ```json
  "fieldOrder": ["Actor", "Asset"]
  ```

### Color

- `nodeColor` - default brand purple `#7B56DB`. Single color, same for every
  node. There is **no per-column palette** - all columns share the same
  `nodeColor`.
- `nodeTextColor` - text inside the node. Default light on dark theme.
- `linkColor` - single color for every link. There is **no dynamic link
  coloring** in linkgraph (unlike `splunk.sankey`'s `colorMode: dynamic`).
- `nodeHighlightColor` - color when a node is hovered/clicked.
- `nodeTextHighlightColor` - text color in the highlighted state.

### Other toggles

- `linkWidth` - default `1`. Increase (`6-8`) when links are the headline,
  decrease (`1`) for high-density data.
- `showNodeCounts` (default `true`) - column header shows total distinct
  values per column.
- `showValueCounts` (default `true`) - each node label shows its occurrence
  count. Turn off both for clean executive views; turn on for analyst views
  where magnitude matters.

## Verified patterns (in `test-dashboard/`)

Each panel in the test dashboard documents one option or pattern:

1. **Default** - canonical PDF example with no options. Brand purple nodes.
2. **PDF-styled** - reproduces the docs example styling: yellow nodes
   (`#f8be44`), red links (`#dc4e41`), `nodeWidth: 220`, `nodeHeight: 50`.
3. **4-column kill chain** - SOC use case: Actor -> Technique -> Asset ->
   Action. Demonstrates that 4 columns render fine.
4. **`fieldOrder` reorders** - same data as #3 but `["Action", "Technique",
   "Asset", "Actor"]` puts the response action first.
5. **`fieldOrder` subset** - `["Actor", "Asset"]` drops Technique and Action
   columns entirely.
6. **Highlight colors** - custom `nodeHighlightColor: #FF5252` and
   `nodeTextHighlightColor`.
7. **Thick links** (`linkWidth: 8`) - link prominence over node prominence.
8. **Compact** - `nodeWidth: 120`, `nodeHeight: 18`, `nodeSpacingY: 4`.
9. **Spacious** - hero sizing: `nodeWidth: 320`, `nodeHeight: 70`,
   `nodeSpacingX: 80`, `nodeSpacingY: 30`.
10. **Counts off** - `showNodeCounts: false`, `showValueCounts: false`.
    Cleaner but loses the magnitude story.
11. **Counts on (defaults)** - shown for direct comparison with #10.
12. **`resultLimit: 8`** with 80-row data - first 8 nodes per column,
    trailing rows silently dropped.
13. **Tinted background** - panel-level `backgroundColor` for editorial
    grouping.

## Drilldown

Linkgraph supports node-level drilldown:

```json
{
  "type": "splunk.linkgraph",
  "options": { ... },
  "eventHandlers": [
    {
      "type": "drilldown.setToken",
      "options": {
        "tokens": [
          { "token": "selected_node",  "key": "row.Actor.value" },
          { "token": "selected_field", "key": "name" }
        ]
      }
    }
  ]
}
```

The click target is **always a node** (never a link). The payload contains
every column value for that row plus a `name` indicating which column was
clicked. To wire a downstream search, branch on `$selected_field$` and
filter by `$selected_node$`.

## Common gotchas

- **Links only render between *adjacent* columns**. There is no rendering of
  Column 1 -> Column 3 unless you reorder via `fieldOrder` or build a chain
  search to get them adjacent.
- **All columns must be string-valued**. Numeric fields are coerced to
  strings; if your numeric values share digits (e.g. `1`, `10`, `100`) they
  collapse into separate nodes - usually fine but verify.
- **No per-column palette**. If you need column-level color cues, switch to
  `splunk.sankey` with `colorMode: categorical`.
- **No dynamic link coloring**. `linkColor` is one value; for severity-
  weighted links use `splunk.sankey` with `linkColors: "> primary | seriesByName(...) | rangeValue(linkColorRangeConfig)"`.
- **Truncation is silent**. With `resultLimit` defaulting to `50` and
  `showNodeCounts` showing the *true* total, a viewer can read "73" in the
  column header but only see 50 nodes. Make this explicit in the panel
  description, or raise `resultLimit` deliberately.
- **`nodeSpacingY` interacts with panel height**. With many distinct values
  per column the rendering can clip the column. Either widen the column
  (`nodeWidth`), shorten the rows (`nodeHeight`), or raise the panel height
  in `layout.structure`.
- **Light theme readability**. Dark `linkColor` on a light background reads
  fine; brand purple (`#7B56DB`) nodes on white sometimes feel washed out -
  bump `linkWidth` or pick a deeper node color (e.g. `#5C4ECC`).

## Test dashboards

| Dashboard                     | Theme  | Path                                                                          |
| ----------------------------- | ------ | ----------------------------------------------------------------------------- |
| `ds_viz_linkgraph_dark`       | dark   | `splunk-knowledge-testing` app                                                |
| `ds_viz_linkgraph_light`      | light  | `splunk-knowledge-testing` app                                                |
| `dashboard.json`              | dark   | `plugins/splunk-dashboards/skills/viz/ds-viz-linkgraph/test-dashboard/`       |
| `dashboard-light.json`        | light  | `plugins/splunk-dashboards/skills/viz/ds-viz-linkgraph/test-dashboard/`       |
