---
name: ds-ref-visual-encoding
description: Visual encoding theory for data dashboards — what color, size, position, and shape COMMUNICATE versus DECORATE. Edward Tufte data-ink ratio applied to Studio. Chart-selection rationale (when line vs bar vs pie, when log vs linear, when stacked vs grouped). The encoding rules that pre-date Splunk: ordered data needs ordered hues, categorical needs categorical hues, length-encoding for comparison, position-encoding for trend. Use when picking a viz type, when ds-pick-viz needs rationale beneath its decision table, or when ds-critique questions encoding choices.
---

# ds-ref-visual-encoding — Visual encoding theory for dashboards

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- The four visual encoding channels (color, size, position, shape) — what each communicates.
- Tufte data-ink ratio applied to Splunk Dashboard Studio.
- Ordered vs categorical encoding rules.
- Line (continuous time) vs bar (discrete category) decisions.
- Log vs linear scale decisions.
- Stacked vs grouped vs side-by-side rules.
- Decoration vs information — when chrome adds vs subtracts.

## Out of scope (what's NOT here)

- Per-viz options — see the relevant `ds-viz-*` skill.
- Palette specifics — see `ds-ref-color`.
- Anti-pattern detection — see `ds-ref-anti-patterns`.

## Consults

- `ds-ref-color` (when encoding requires a specific palette type).

## Consulted by

- `ds-couture` (encoding rationale per design decision).
- `ds-pick-viz` (decision-table rationale).
- `ds-critique` (encoding violations).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Chart selection — decision table" rationale.
- New content: Tufte data-ink ratio, channel-by-channel encoding theory, log/linear, stacked/grouped rules.

## Estimated size

M

---

## The four visual encoding channels

Every chart maps data to one or more of four visual channels. Picking
the wrong channel — or stacking them redundantly — is the single most
common reason a dashboard fails the 5-second test.

### Color

Color is two channels in one: **hue** (categorical) and
**saturation/lightness** (ordered). Confusing them is the most frequent
encoding bug.

- **Categorical hue** — different things. Network zones, user roles,
  service tiers. Use a categorical palette where no hue dominates and
  no hue implies "more" than another.
- **Ordered saturation** — more vs less. Severity, latency, traffic.
  Use a sequential or diverging gradient. Light → dark = low → high.
- **Status hue** — semantic. Red = bad, green = good, amber = warn.
  Reserve red and green for status only; never use them as
  identity colors.

**Communicates:** category, status, magnitude.
**Decorates (abuse):** rainbow assigned to a single ordered measure;
red on a chart with no semantic polarity; 12 hues for 12 series; pure
saturation on a wall display where it bleeds.

### Size

Size is two sub-channels with very different accuracy.

- **Length** — bars, columns, position along a shared axis. The most
  accurate quantitative channel humans have. Use for comparison.
- **Area** — bubble radius, treemap rectangle, pie slice. Denser per
  unit screen but ~3x less accurate than length. Use only when length
  is impossible or when exact values aren't the point.

**Communicates:** quantity, comparison, hierarchy.
**Decorates (abuse):** giant heading text where the number is the
point; KPI tile bigger than its data importance; shrunken legend that
hides the encoding key.

### Position

Position along a shared axis is the strongest quantitative channel —
more accurate than length, area, color, or shape. Trends, deltas, and
clusters all read off position before any other encoding.

- **X-axis time** — temporal trend. Always the time axis when time
  matters.
- **Y-axis value** — magnitude. Always start at zero for bar charts,
  not for line charts (where deltas matter more than absolutes).
- **2D scatter** — correlation. Both axes carry meaning.

**Communicates:** trend, correlation, distribution, outliers.
**Decorates (abuse):** time axis on the y-axis (forces head-tilt);
inconsistent zero baselines across panels; reversed axes without a
strong reason.

### Shape

Shape is a low-bandwidth categorical channel. Humans reliably
distinguish about 5–7 shapes; beyond that they blur together.

- **Categorical shape** — circle / square / triangle for series
  identity in scatter or line.
- **Iconic shape** — singlevalueicon (CPU, disk, network) for
  semantic identity, not for magnitude.

**Communicates:** category identity (limited cardinality), semantic
type.
**Decorates (abuse):** decorative circles around KPIs that add no
information; 12 marker shapes in a scatter; emoji as data encoding.

### The redundancy rule

Encoding the same dimension with two channels (color + shape) is fine
if it aids accessibility (colorblind users). Encoding different
dimensions with overlapping channels (color = severity, shape =
team) is fine. **Encoding nothing with a channel — pure decoration —
is the abuse.**

---

## Tufte data-ink ratio

Edward Tufte's data-ink ratio: of all the ink (pixels) on a chart, what
fraction encodes data? The rest is **chart junk** — gridlines, borders,
3D bevels, drop shadows, redundant labels. Studio's defaults are
chart-junk-heavy. Strip aggressively.

### What to remove first

- **3D effects on bar / pie / column** — never improves comprehension.
- **Drop shadows on KPI tiles** — kills contrast on dark themes.
- **Gradient fills on bars** — visual noise; the bar length already
  encodes the value.
- **Redundant axis labels** — if the panel title is "Latency p99 (ms)"
  the y-axis doesn't need "ms" again.
- **Major + minor gridlines** — pick one. Minor is almost always wrong.

### When to remove gridlines

- **Sparse data** (one or two series, exact values not load-bearing) —
  remove gridlines; the trend reads from line position alone.
- **Ambient / wall displays** — remove gridlines; viewers won't read
  exact values from 10ft.
- **Sparklines inside KPI tiles** — always gridline-free; sparkline is
  trend-only.

### When to keep gridlines

- **Precise comparison required** — finance dashboards, capacity
  planning, anything where the operator reads exact values off the
  axis. Keep horizontal gridlines on line/area, vertical on bar/column.
- **Multiple stacked series** — gridlines anchor the eye when stacking
  obscures individual baselines.
- **Threshold charts** — keep the threshold reference line bold; remove
  other gridlines so threshold stands out.

### Annotation vs decoration

An annotation **adds information not present in the data**: a deploy
marker on a latency chart, a threshold line, a "incident at 14:23"
callout. Annotations are data-ink.

A decoration **adds visual weight without information**: a panel
border, a gradient background, an emoji prefix on a panel title.
Decorations are not data-ink.

When in doubt: ask "if I removed this, would the operator miss
something they needed?" If no — it's decoration; remove it.

### The 5-second story test

After stripping every decoration: glance at the panel for 5 seconds and
say one sentence about what's happening. If the sentence is "I don't
know" or "let me look closer," the encoding has failed. Either:

- The chart type is wrong (use `ds-pick-viz` to reconsider).
- The data needs aggregating (too many series, too fine a time bucket).
- A label / title / legend is missing the lede.

Apply the test BEFORE shipping; apply it again at 6 weeks (drift check).

---

## Chart-selection rationale

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

### Decision tree shortcuts

#### "Show me X over time"

→ Continuous metric → `splunk.line`
→ Cumulative / stacked → `splunk.area`
→ Discrete buckets (per-day count) → `splunk.column`
→ Discrete events (deploys, alerts) → `splunk.timeline`

#### "Show me X by category"

→ ≤6 categories, one dominates, share matters → `splunk.pie`
→ Top N with long labels → `splunk.bar` (sorted)
→ Short labels, simple counts → `splunk.column`
→ Heatmap by hour × weekday → `splunk.punchcard`

#### "Show me X across geography"

→ Real countries / states with Leaflet → `splunk.map`
→ Custom shapes (floor plan, schematic) → `splunk.choropleth.svg`
→ Latitude / longitude points → `splunk.map` marker layer
→ Country shading without basemap → `splunk.choropleth.svg` with country SVG

#### "Show me single value"

→ Pure number → `splunk.singlevalue`
→ Number + leading icon → `splunk.singlevalueicon`
→ % of known whole as ring → `splunk.singlevalueradial`
→ Value within a banded scale → `splunk.markergauge`
→ How full / how complete → `splunk.fillergauge`

#### "Show me relationships"

→ 2D numeric correlation → `splunk.scatter`
→ 3D (x, y, volume) → `splunk.bubble`
→ N-dimensional comparison → `splunk.parallelcoordinates`
→ Flow A → B → C with weights → `splunk.sankey`
→ Network / taxonomy without weights → `splunk.linkgraph`

#### "Show me detail"

→ Tabular detail → `splunk.table`
→ Raw events with field metadata → `splunk.events`
→ Multi-dimensional comparison across rows → `splunk.parallelcoordinates`

### When in doubt

- **Pie** — defaults to wrong choice. Use bar unless ≤6 + one
  dominates.
- **Stacked area** — defaults to wrong choice for independent series.
  Use multi-series line unless cumulative is the message.
- **Multi-layer maps** (marker + bubble) — unreliable. Two separate
  panels.
- **Tables** — never without drilldown.

See `ds-ref-pitfalls` for the cross-skill gotchas matrix when the
right viz is picked but mis-configured.

---

## Line vs bar vs pie

Three default chart types, three rules.

### Line — continuous time

- Use when x-axis is time and points connect meaningfully.
- Trend, rate-of-change, correlation across series — line.
- y-axis does NOT need to start at zero (deltas matter more than
  absolutes).
- Multi-series ≤ 5 lines is readable; > 5 either small-multiples or
  pick a top-N.

**When line is wrong:** discrete events with no continuity (deploys,
alerts, incidents). Connecting them with a line implies values between
events that don't exist. Use `splunk.timeline` or `splunk.column`.

### Bar (column or horizontal) — discrete categories

- **Vertical column** — short labels, ≤ 10 categories. Time-bucketed
  counts (per-day, per-hour) when the bucket is the unit (not a
  continuous reading).
- **Horizontal bar** — long labels, top-N rankings, sorted descending.
- y-axis MUST start at zero for honest length comparison.
- No implied order between bars unless explicitly sorted.

**When bar is wrong:** continuous time at fine granularity (per-second,
per-minute trends) — use line. Bars at fine time granularity look like
a barcode and obscure trend.

### Pie (or donut) — part-to-whole, small N

- ≤ 6 slices.
- One slice should clearly dominate (otherwise the message is
  "everything is roughly equal," which a sentence communicates better).
- Total must be a meaningful 100% (license seats used, traffic split
  by region) — not a sum of unrelated counts.

**When pie is wrong:** > 6 slices (slices < 5° are unreadable) — use a
horizontal bar sorted descending. Independent counts that don't sum to
a meaningful whole — use bar. Time series — never pie.

---

## Log vs linear

### Linear — the default

Linear y-axis is the default for the same reason zero baselines are:
human eyes read length proportionally. Always start with linear.

### Log — when ratios matter more than differences

Switch to logarithmic when BOTH conditions hold:

1. **Data spans 2+ orders of magnitude** — top series is 100x or more
   the smallest series, and the small series matter.
2. **Ratios matter more than absolute differences** — latency p50 vs
   p99 (10ms vs 1000ms), request volumes across services (1k vs 1M),
   earthquake magnitudes.

Common log-axis cases:

- Latency percentiles (p50, p95, p99, p999) on one chart.
- Request rates across services of very different scale.
- File sizes, memory, disk capacity across heterogeneous fleets.

### Log gotchas

- **Never log a count series that can hit zero.** `log(0)` is
  undefined. Studio either drops the point or breaks the line.
- **Never log a series that can go negative** (deltas, profit/loss).
- **Always label the axis as log** — operators reading a log chart as
  linear will misread by 2+ orders of magnitude.
- **Bar charts on log axis are misleading** — bar length no longer
  encodes value linearly; eye still reads it that way. Use line/area
  for log scales.

### Studio support

- `splunk.line` and `splunk.area` support `yAxis.scale: "log"`.
- `splunk.column` and `splunk.bar` technically accept log but the
  output is misleading (see above).
- No log support on `splunk.scatter` or `splunk.bubble` axes — handle
  the transform in SPL with `eval logvalue=log(value)` and label the
  axis manually.

---

## Stacked vs grouped vs side-by-side

When showing multiple series across a categorical or time x-axis,
three layouts compete.

### Stacked — totals AND parts both matter

Use stacked when:

- The total (sum of all series) is itself a meaningful number.
- The parts (per-series share) is also meaningful.
- Series are mutually exclusive (every event is in exactly one
  category — severity, status, region).

Examples: severity counts over time (total alerts AND breakdown
matter), license seats by team (total used AND per-team).

**Gotcha:** stacked area for independent series (CPU on host A and CPU
on host B) is the most common reflex misuse. Use multi-line.

### Grouped — comparing parts across categories

Use grouped (clustered) bar when:

- Comparing the same series across multiple categories.
- The total is NOT meaningful (apples + oranges).
- ≤ 3 series per group; > 3 becomes hard to read.

Examples: revenue by region split by quarter (4 quarters × 4 regions);
test pass-rate by suite split by environment.

### Side-by-side (small multiples) — each series has its own pattern

Use small multiples (one panel per series, repeated layout) when:

- Each series has a distinct pattern that gets lost in stacking or
  grouping.
- > 5 series — neither stack nor group reads cleanly.
- Operators need to scan each series independently.

Examples: 8 service-latency charts on a NOC wall; 12 region revenue
trends in an exec dashboard.

In Studio, small multiples are achieved by a panel-per-series layout —
not a single chart. Use the same x-axis range, the same y-axis
range, and the same color across panels for visual consistency.

### Quick rule

- Totals matter + parts mutually exclusive → **stacked**.
- Compare same series across categories → **grouped**.
- Each series tells its own story → **small multiples**.
