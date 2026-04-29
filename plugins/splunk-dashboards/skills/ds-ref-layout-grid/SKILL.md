---
name: ds-ref-layout-grid
description: Layout, spacing, and grid math for Splunk Dashboard Studio — 4pt and 8pt grid scales, F-pattern reading flow, hero KPI sizing rules, gutter math for absolute layouts, golden-ratio for hero zones, depth via layered splunk.rectangle, and canvas-zone presets per archetype (1440×960 exec, 1920×1080 SOC wall). Use when wireframing, when ds-design positions panels, or when ds-polish tightens alignment.
---

# ds-ref-layout-grid — Layout, spacing, and grid math

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- 4pt and 8pt grid scales with named tokens (`S_0_5`, `S_1`, `S_2`, ...).
- F-pattern reading flow + panel placement.
- Hero KPI sizing rules (1.5–2× supporting KPIs).
- Gutter math (20px standard, 8px tight, 32px exec).
- Golden ratio for hero zones.
- Depth via layered `splunk.rectangle` (Studio has no box-shadow).
- Per-archetype canvas-zone presets.

## Out of scope (what's NOT here)

- Archetype shapes themselves — see `ds-ref-archetypes`.
- Color of layered rectangles — see `ds-ref-color`.

## Consults

- `ds-ref-archetypes` (per-archetype canvas zones).

## Consulted by

- `ds-couture` (layout commitment after archetype).
- `ds-design` (panel positioning during wireframing).
- `ds-polish` (alignment fixes).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Layout principles", "KPI sizing rules", "Spacing/radius/type scale", "Depth and layering" sections.
- New content: golden ratio for hero zones, gutter presets per archetype.

## Estimated size

L

---

## Layout principles

- **F-pattern reading** — most important KPIs at top-left.
- **Visual hierarchy** — size signals importance.
- **Grouping** — related panels adjacent. `splunk.rectangle`
  backgrounds delimit zones.
- **Whitespace** — minimum 20 px gutters and canvas margins.
- **Consistent column widths** — 2-column or 3-column grid; stick to
  it.

## Recommended canvas zones (per archetype)

### Exec summary (1440 × 960 px)

The classic four-zone layout for executive dashboards: input bar,
hero KPI row, primary chart zone, secondary detail zone.

```
x=0                                               x=1440
y=0   +-------------------------------------------------+
      | Canvas margin (20 px)                           |
y=20  | [Input bar: time + filters]           h=40      |
y=80  | [KPI row — background rect]           h=160     |
      |  KPI1 | KPI2 | KPI3 | KPI4                      |
y=260 | [Primary chart zone]                  h=340     |
      |  Main chart (w=860) | Table (w=520)             |
y=620 | [Secondary / detail zone]             h=300     |
      |  Alert history / secondary chart                |
y=940 | [Footer / nav links]                  h=20      |
y=960 +-------------------------------------------------+
```

- Panel minimum heights: singlevalue 120, chart 240, table 200 px.
- Gutter: 20 px between every panel edge; 20 px from canvas edges.
- KPI background card: `splunk.rectangle` at `y=80, h=160` BEHIND
  KPIs (earlier in `structure` array).

### Operational NOC (1920 × 1080 px)

Wider canvas, denser grid. Status tiles get more breathing room
horizontally; primary monitoring chart is taller. Designed for a
24/7 NOC team viewing on a 27" desk monitor or a small wall display.

```
x=0                                                            x=1920
y=0   +-------------------------------------------------------------+
      | Canvas margin (20 px)                                       |
y=20  | [Input bar: time + scope filters]              h=40         |
y=80  | [Status-tile row — background rect]            h=180        |
      |  T1 | T2 | T3 | T4 | T5 | T6                                |
y=280 | [Primary monitoring chart]                     h=420        |
      |  Multi-series line / area (w=1240) | Top-N bar (w=640)      |
y=720 | [Detail / secondary zone]                      h=320        |
      |  Recent alerts table | Saturation heatmap                   |
y=1060| [Footer]                                       h=20         |
y=1080+-------------------------------------------------------------+
```

- Status tiles use `splunk.singlevalueicon` or `splunk.singlevalue`
  with dynamic `majorColor` — 6 across at 280 × 180.
- Gutter: 20 px standard.
- Primary chart taller than exec (420 vs 340) so multi-series detail
  remains legible.

### Analytical deep-dive (1600 × 1100 px)

Filter bar prominent, table-heavy bottom. Designed for fraud / SOC
investigators running open-ended exploration sessions.

```
x=0                                                       x=1600
y=0   +---------------------------------------------------------+
      | Canvas margin (16 px)                                   |
y=16  | [Filter bar — multi-row, prominent]         h=80        |
      |  Time | Region | Severity | User | Asset | Search       |
y=112 | [Correlation chart zone]                    h=320       |
      |  Scatter / parallelcoords (w=1000) | Distribution (w=584)|
y=448 | [Cross-reference KPIs]                      h=140       |
      |  KPI1 | KPI2 | KPI3 | KPI4 | KPI5                       |
y=604 | [Detail table — primary investigation surface] h=480    |
      |  Sortable, drilldownable, ~12-20 visible rows           |
y=1100+---------------------------------------------------------+
```

- Filter bar can wrap to 2 rows; allow up to 80 px.
- Table is the hero — 480 px tall, drilldown-enabled.
- Gutter: 16 px outer, 12 px inner. Denser than exec to fit filters
  + scatter + table.

### SOC wall display (1920 × 1080 — or 3840 × 2160 scaled)

Wide canvas scaled for distance viewing (10–100 ft). Tile sizes
larger, text larger, gutters tighter to maximize visible information.
Same coordinate logic at 4K — multiply every value by 2.

```
x=0                                                            x=1920
y=0   +-------------------------------------------------------------+
      | Canvas margin (12 px)                                       |
y=12  | [Title strip + global health]                  h=80         |
y=100 | [Severity pyramid — hero zone]                 h=520        |
      |  Geo map (w=1186) | Severity tile column (w=722)            |
      |  (golden-ratio split: 1186 / 722 + 12 px gutter)            |
y=628 | [Status tile rail]                             h=200        |
      |  T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8                      |
y=836 | [Live event ticker]                            h=232        |
      |  Streaming events table, large rows, no chrome              |
y=1080+-------------------------------------------------------------+
```

- Font sizes 1.4–1.8× larger than desk-monitor archetypes.
- Gutter: 8 px inner (max info density), 12 px outer.
- Hero zone sized via golden ratio (see "Golden-ratio for hero zones"
  below).

## KPI sizing rules

- **Minimum:** 3×3 grid cells (~300×120 px). Below this, major value
  unreadable at distance.
- **Recommended:** 300–440 px wide, font 36–56 px, 4-KPI row on 1440
  canvas.
- **Max per row:** 6.
- **Show trend or sparkline** when direction matters.
- **Always set `unit`** (`"%"`, `"ms"`, `"°C"`).
- Use `splunk.singlevalueicon` for binary status, `splunk.markergauge`
  for SLA thresholds, `splunk.fillergauge` for percentage-completion.
- Status KPIs: dynamic `majorColor` via `rangeValue`. Informational
  counts: static `#006D9C`.

### KPI grouping with background cards

```
splunk.rectangle  x=20,  y=80,  w=1400, h=160   (card behind KPIs)
KPI 1             x=30,  y=90,  w=320,  h=140
KPI 2             x=370, y=90,  w=320,  h=140
KPI 3             x=710, y=90,  w=320,  h=140
KPI 4             x=1050,y=90,  w=350,  h=140
```

Rule: card edge + 10 px = panel edge on all sides. Place rectangle
entry in `layout.structure` BEFORE the KPI entries.

## Spacing scale (px)

| Token | px | Common use |
|---|---|---|
| `S_0_5` | 4 | Tight icon gap. |
| `S_1` | 8 | Inline label gap. |
| `S_1_5` | 12 | Panel inner padding (tight). |
| `S_2` | 16 | Section heading → first panel. |
| `S_2_5` | 20 | **Default gutter between panels.** |
| `S_3` | 24 | KPI row → primary chart zone. |
| `S_4` | 32 | Between logical sections. |
| `S_6` | 48 | Between major zones in long dashboards. |
| `S_8` | 64 | Canvas outer margin on ultrawide wall displays. |

## Corner radius (px)

| Token | px | Use |
|---|---|---|
| `R_SHARP` | 0 | Grid / table cells. |
| `R_SUBTLE` | 4 | Inputs, small chips. |
| `R_CARD` | 8 | **Default card / rectangle radius.** |
| `R_HERO` | 12 | Hero KPI background. |
| `R_PILL` | 999 | Status chips, badges. |

## Depth and layering in Dashboard Studio

Dashboard Studio has no box-shadow, no backdrop-blur. Depth comes from
**layered rectangles** — `splunk.rectangle` first in
`layout.structure` (renders behind), KPIs after.

**Array-order rule:** earlier = behind, later = in front. No
`z-index`.

**Shape layouts only:** `splunk.rectangle` / `splunk.ellipse` require
`layout.type: "absolute"`. Silently ignored on grid / tabs.

## Golden-ratio for hero zones (NEW)

When an archetype calls for a hero zone — one dominant chart plus a
supporting tile cluster — the 1.618 golden ratio between hero and
supporting widths produces visual rhythm that a 50/50 split or a
70/30 eyeball never quite achieves.

**The math:** total canvas width minus gutter, split so
`hero / supporting = 1.618`. Or equivalently:
`hero = total × 0.618` and `supporting = total × 0.382`.

| Canvas | Total (minus margins) | Gutter | Hero | Supporting |
|---|---|---|---|---|
| 1440 px | 1400 px | 20 px | 884 px | 556 px |
| 1600 px | 1568 px | 16 px | 988 px | 612 px |
| 1920 px | 1880 px | 20 px | 1186 px | 734 px |
| 1920 px (SOC) | 1908 px | 12 px | 1186 px | 722 px |
| 3840 px (4K) | 3800 px | 24 px | 2370 px | 1466 px |

**When to use the rule:**

- **SOC dashboards** — geo map (hero) + severity tile column
  (supporting).
- **Exec summaries** — primary chart (hero) + KPI strip
  (supporting), turned vertical to make the strip a column.
- **Operational NOC** — primary multi-series chart (hero) + Top-N
  bar (supporting).

**When NOT to use it:**

- Symmetric comparisons (two equal-weight charts).
- Three-column layouts (use thirds, not golden).
- Tables — readability requires a single full-width row, not a
  ratio split.

## Gutter presets per archetype (NEW)

Different archetypes tolerate different gutter densities. The
spacing scale tokens above are the menu; these are the recommended
defaults per archetype.

| Archetype | Outer margin | Inner gutter | Notes |
|---|---|---|---|
| **Exec summary** | 32 px (`S_4`) | 24 px (`S_3`) | Generous, executive feel; KPIs breathe. |
| **Operational** | 20 px (`S_2_5`) | 20 px (`S_2_5`) | Standard, balanced density. |
| **Analytical** | 16 px (`S_2`) | 12 px (`S_1_5`) | Denser to fit filter bar + scatter + table. |
| **SOC wall** | 12 px (`S_1_5`) | 8 px (`S_1`) | Maximum information density; slight outer breathing. |

**Rule of thumb:** the further the viewer, the tighter the inner
gutter (information density wins). The closer the viewer, the wider
the gutter (calm wins). SOC wall at 100 ft tolerates 8 px because the
gap visually scales with distance; an exec at 18 inches needs the 24
px gutter to feel deliberate.

**Pairing with depth:** when using layered `splunk.rectangle` cards
behind a panel group, the rectangle inset is the gutter / 2 — a 20
px gutter means the card's inner edge is 10 px outside each panel
edge. See "KPI grouping with background cards" above.
