# splunk.linkgraph — full options reference

Cross-checked against the 10.4 PDF.

## Background

| Option | Notes |
|---|---|
| `backgroundColor` | Panel fill. Use for editorial tinting on dark themes (e.g. `#101A33` against `#0F1729` page background). |

## Layout / sizing

| Option | Default | Notes |
|---|---|---|
| `nodeWidth` | `200` | Wider nodes accommodate longer labels. |
| `nodeHeight` | `30` | Taller nodes give labels more breathing room. |
| `nodeSpacingX` | `34` | Horizontal gap between columns. |
| `nodeSpacingY` | `8` | Vertical gap between nodes within a column. |
| `linkWidth` | `1` | Increase (`6–8`) when links are the headline; decrease (`1`) for high-density data. |
| `resultLimit` | `50` | Per-column cap before truncation. **Trailing nodes dropped silently;** the column header still shows the *true* total when `showNodeCounts: true`. |

## Field control (DOS)

| Option | Notes |
|---|---|
| `fieldOrder` | Explicit array of column names. Overrides natural order. Use to reorder (put most decision-relevant column first) OR to subset (drop columns by omitting them). |

```json
"fieldOrder": ["Actor", "Asset"]
```

## Colour

| Option | Notes |
|---|---|
| `nodeColor` | Default brand purple `#7B56DB`. **Single colour, same for every node** — no per-column palette. |
| `nodeTextColor` | Text inside the node. Default light on dark theme. |
| `linkColor` | Single colour for every link. **No dynamic link colouring** (unlike `splunk.sankey`'s `colorMode: dynamic`). |
| `nodeHighlightColor` | Colour when a node is hovered/clicked. |
| `nodeTextHighlightColor` | Text colour in highlighted state. |

## Toggles

| Option | Default | Notes |
|---|---|---|
| `showNodeCounts` | `true` | Column header shows total distinct values per column. |
| `showValueCounts` | `true` | Each node label shows occurrence count. Turn both off for clean executive views; on for analyst views where magnitude matters. |

## What linkgraph does NOT have

- **No per-column palette.** All columns share `nodeColor`. Use
  `splunk.sankey` with `colorMode: categorical` if needed.
- **No dynamic link colouring.** `linkColor` is single value. For
  severity-weighted links → `splunk.sankey` with `colorMode: dynamic`
  + `linkColors` DOS.
- **No annotations, overlays, dual axis, stacking** — none of the
  chart-family options apply.
- **No animation hooks.**

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Linkgraph options table.
