---
name: ds-ref-typography
description: Typography for Splunk Dashboard Studio — font pairings safe within Studio's constraints (only splunk.markdown exposes fontFamily), modular type scales per archetype, UPPER vs Title vs sentence case rules, number formatting (numberPrecision, tabular figures, k/M/B abbreviations), and the reflex_fonts_to_reject list (Inter, Roboto, default-system reaches). Use when picking fonts, when ds-polish fixes type hierarchy, or when number formatting needs review.
---

# ds-ref-typography — Typography for Splunk dashboards

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- Font pairing recipes (display + body) safe in Studio.
- Modular type scale (1.25 ratio recommended) per archetype.
- Line-height adjustments (dark-on-light vs light-on-dark).
- UPPER vs Title vs sentence case rules per archetype/element.
- Number formatting: `numberPrecision`, tabular figures, k/M/B abbreviations.
- `reflex_fonts_to_reject` list (Inter, Roboto, default-system reaches).

## Out of scope (what's NOT here)

- Studio-CSS fonts — only `splunk.markdown` supports `fontFamily` (platform constraint).
- Text color — see `ds-ref-color`.
- Spacing between text elements — see `ds-ref-layout-grid`.

## Consults

- (none — typography stands alone).

## Consulted by

- `ds-couture` (typography decision after archetype).
- `ds-polish` (typography corrections).
- `ds-viz-markdown` (fontFamily picks).
- `ds-viz-singlevalue` (numberPrecision).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Typography & text" section + Slop Test typography checks.
- New content: font pairing recipes, type-scale-per-archetype, k/M/B abbreviations, reflex fonts list.

## Estimated size

M

---

## Typography rules

Extracted verbatim from the original design-principles guidance.

- **Panel titles** — 40 char max, 3–5 words, Title Case.
- **Descriptions** — only when non-obvious. One sentence.
- **Section headers** — `splunk.markdown` `### Section`. 2–4 words.
- **Avoid paragraphs** — dashboards read at a glance.
- **Axis labels** — human-readable + units (`"Latency (ms)"`).

### Why

A dashboard is not a document. The eye should hit a panel title and
know in under a second what question it answers; descriptions exist to
disambiguate, not to narrate. Paragraphs of body copy in a panel are a
sign the panel is doing the wrong job — that content belongs in
`splunk.markdown` as an editorial intro, or out of the dashboard
entirely.

## Type scale (size tokens)

The Splunk Dashboard Studio type scale uses an approximate 1.25 ratio
across eight tokens. Pixel values are exact, not relative.

| Token | px | Use |
|---|---|---|
| `FS_TICK` | 11 | Chart tick labels. |
| `FS_AXIS` | 12 | Axis titles. |
| `FS_BODY` | 14 | Markdown body, table cells. |
| `FS_LARGE` | 18 | Panel subtitles. |
| `FS_XLARGE` | 24 | Section headers. |
| `FS_KPI_MINOR` | 28 | Secondary KPI value. |
| `FS_KPI_MAJOR` | 48 | **Standard KPI majorValue.** |
| `FS_KPI_HERO` | 72 | Hero / landing KPI. |

Sizes below `FS_TICK` are illegible at standard viewing distance and
must not be used. Sizes above `FS_KPI_HERO` exceed Studio's KPI tile
proportions and clip on the default 3×3 cell minimum.

## Font pairing recipes

**Studio platform constraint:** only `splunk.markdown` exposes
`fontFamily`. Everything else (singlevalue, table, axis, legend) uses
the Splunk default sans. Pairing recipes therefore apply to markdown
headers, editorial intros, and embedded brand text — not to chart
internals.

A pairing is one **display** font (for `### Section` headers and
editorial copy in `splunk.markdown`) and one **body** font (for
descriptive paragraphs inside markdown panels). For chart text you
inherit Splunk default; pick a body font that lives near it tonally so
the markdown doesn't read as a foreign object on the canvas.

### Editorial — Spectral display + Inter body

- Use for: exec / report dashboards, quarterly review prints.
- Tone: serif headlines feel considered, deliberate.
- Spectral has authority without ornament; Inter as body keeps the
  paragraph light and readable.

### Operational — JetBrains Mono display + system-ui body

- Use for: SRE and operational monitoring dashboards.
- Tone: monospaced headers signal "this is a console, this is data."
- JetBrains Mono shows status names like `INCIDENT-4271` cleanly;
  system-ui body matches the OS the operator is reading from.

### Brutalist — Druk display + Söhne body

- Use for: SOC walls, status walls, large-display canvases.
- Tone: thick condensed display reads at distance; restrained body
  prevents the canvas from screaming at standard distance.

### Refined — GT Sectra display + Söhne body

- Use for: brand-led exec dashboards where typography is part of the
  visual identity.
- Tone: high-contrast modern serif headlines, clean grotesk body.
- Higher production cost — only use when brand is intentional.

### Pairing rules

1. Display half must NOT come from `reflex_fonts_to_reject` — those
   are training-data defaults and signal a generic dashboard.
2. Body half should be near the Splunk chart default (system sans)
   tonally; otherwise markdown panels appear pasted in.
3. Never pair two display fonts. Never pair two serifs. Never pair two
   monospaces.
4. If brand is unspecified, default to **Operational** (JetBrains Mono
   + system-ui) — it disappears into operational contexts and never
   embarrasses an exec one.

## Modular type scale per archetype

The full type-scale token set is shared across archetypes. What
differs is **which tokens each archetype uses** and **how aggressive
the size jumps are**.

### Exec / report (light theme)

```
Hero KPI       72 px   FS_KPI_HERO
Section header 24 px   FS_XLARGE
Panel title    18 px   FS_LARGE
Body / desc    14 px   FS_BODY
Axis tick      11 px   FS_TICK
```

- Top-of-scale is hero (72). Bottom is body (14).
- Generous spacing between tiers — exec scans, doesn't drill.
- Skip `FS_KPI_MINOR` (28) entirely; exec needs one big number, not
  two competing ones.

### Operational monitoring

```
KPI value      48 px   FS_KPI_MAJOR
Section header 24 px   FS_XLARGE
Panel title    18 px   FS_LARGE
Body           14 px   FS_BODY
Axis title     12 px   FS_AXIS
Axis tick      11 px   FS_TICK
```

- Dense canvas, but hierarchy preserved through size.
- Operators read at laptop distance; 48 px KPI is enough.
- Use full 6-tier scale; every level earns its place.

### Analytical deep-dive

```
Section header 24 px   FS_XLARGE
Panel title    18 px   FS_LARGE
KPI value      28 px   FS_KPI_MINOR
Body           14 px   FS_BODY
Axis title     12 px   FS_AXIS
Axis tick      11 px   FS_TICK
```

- KPIs are secondary in this archetype; ceiling is `FS_KPI_MINOR`.
- Many small panels need readable axis ticks — `FS_TICK` and
  `FS_AXIS` are load-bearing.
- Skip `FS_KPI_HERO` and `FS_KPI_MAJOR` — analytical surfaces don't
  shout.

### SOC wall (dark theme, distance-readable)

```
Hero KPI         72 px   FS_KPI_HERO
Status tile      28 px   FS_KPI_MINOR
Panel title      18 px   FS_LARGE
Body             14 px   FS_BODY
```

- Two extremes: hero (1–2 KPIs) and status tile grid.
- ALL CAPS acceptable for short status labels — see casing rules.
- Skip mid-range tokens (`FS_XLARGE`, `FS_AXIS`) where possible;
  the gap between hero and status is the hierarchy.

## Number formatting

Numbers in dashboards are read at speed. Formatting decides whether
the operator sees `1,247,302` or `1.2M`, whether two columns of
percentages align or jitter, whether `0.5%` reads as half-a-percent or
five-tenths.

### `numberPrecision` per metric kind

| Metric kind | numberPrecision | Example |
|---|---|---|
| Counts (events, requests, users) | `0` | `1,247` |
| Latency (ms, seconds) | `1` | `342.7 ms` |
| Rates (req/s, per minute) | `2` | `12.47 /s` |
| Percentages | `1` (≥10%) or `2` (<10%) | `87.3%`, `0.42%` |
| Currency | `2` | `$1,204.00` |
| Bytes (raw) | `0` | `1024` |
| Bytes (abbreviated) | `1` | `1.0 GB` |

### Tabular figures

Enable tabular (monospaced-width) figures whenever numbers stack in a
column — tables, KPI rows, axis labels. Without tabular figures, `1`
is narrower than `8` and the column right-edge wobbles.

- `splunk.table` — set `font-feature-settings: 'tnum'` via theme CSS
  if available; otherwise rely on the default Splunk numeric font.
- `splunk.singlevalue` rows — pad the unit; major values are already
  monospaced via Splunk default.
- Markdown tables — wrap the cell in a `<span>` with monospace.

### k/M/B abbreviations

Splunk's `yAxisAbbreviation` accepts `auto`, `none`, or explicit
units.

| Setting | Use when |
|---|---|
| `auto` | Default. Splunk picks k/M/B by axis range. Best for line/area charts where exact value matters less than shape. |
| `none` | Tables, exec KPIs where exact value is the point. Forces `1,247,302` not `1.2M`. |
| Explicit (e.g., `M`) | Multi-panel grids where you need every panel on the same scale to compare. |

Default to `auto` for charts; `none` for hero KPIs that are read once
per dashboard; explicit when comparing.

### Trailing zeros

- Sub-1% values: keep the trailing zero (`0.50%` not `0.5%`) when
  alongside other percentages — it preserves column alignment and
  signals precision.
- Currency: always two decimals (`$12.00` not `$12`).
- Rates and ratios: trailing zero only if the column has values that
  need it — never decorate.

## UPPER vs Title vs sentence case

Casing is archetype-driven. The operator's reading speed and viewing
distance determine which convention wins.

### SOC wall

- Panel titles: **UPPER CASE** — legibility at distance trumps
  convention.
- Status labels: **UPPER CASE**, short (`OPEN`, `ACK`, `CRITICAL`).
- Section headers: **UPPER CASE** with letter-spacing 0.05em for
  readability.
- Body / descriptions: sentence case (descriptions are rare on SOC
  walls).

### Exec / report

- Panel titles: **Title Case** — `Revenue by Region`, not `revenue by
  region`.
- Descriptions: **sentence case** — one sentence, period at the end.
- Section headers (markdown `###`): **Title Case**.
- KPI under-labels: **sentence case** — `vs last quarter`, not `Vs
  Last Quarter`.

### Analytical

- Panel titles: **Title Case**.
- Descriptions: **sentence case**.
- Section headers: **Title Case**.
- Axis labels: **sentence case** with units in parentheses
  (`Latency (ms)`, not `Latency (Ms)`, not `LATENCY (MS)`).
- Legend entries: **as data** — preserve the dimension's natural
  casing (`prod`, `staging`, `us-east-1`).

### Operational

- Panel titles: **Title Case** — same as exec/analytical.
- Status names embedded in titles: preserve source casing
  (`incident-4271 active`, not `Incident-4271 Active`).
- Axis labels: **sentence case** with units.

### Universal rules

- Markdown `### Section` headers: **Title Case** across all
  archetypes.
- Axis labels: **sentence case** with units in parentheses.
- Legend entries: preserve data casing — never up-case or
  down-case data values.
- Acronyms (`API`, `SLA`, `P95`): always all-caps regardless of
  archetype.

## reflex_fonts_to_reject

These fonts are training-data reflexes. They appear in 80%+ of
generated dashboards because they appear in 80%+ of generated
websites. Refuse them as the **display** half of any pairing — they
have no brand voice and signal a generic AI output.

| Font | Why rejected |
|---|---|
| Inter | Default of every AI design tool. Zero distinctiveness. |
| Roboto | Material Design reflex. Signals 2014 Android. |
| Arial | System fallback in disguise. Signals "no font was chosen." |
| Open Sans | Bootstrap-era reflex. Reads as legacy. |
| DM Sans | Trendy 2022 default. Already over-used. |
| Plus Jakarta Sans | Trendy 2023 default. Same problem. |
| Outfit | Trendy 2024 default. Same problem. |
| Fraunces | Variable-axis reflex. Used everywhere. |
| Playfair Display | "Editorial" reflex serif. Signals lifestyle blog. |
| Cormorant | Romance-novel reflex. Wrong tone for any dashboard. |
| Newsreader | Substack reflex. Wrong context. |
| Lora | Medium.com reflex. Wrong context. |
| Crimson | Portfolio-site reflex. |
| Space Mono | Cyberpunk reflex. Looks like a 2017 startup deck. |
| Space Grotesk | Same family, same problem. |
| IBM Plex (any) | Corporate-default reflex. Reads as IBM, not your brand. |
| Instrument Sans | 2024 design-system reflex. |
| Instrument Serif | Pair to Instrument Sans. Same problem. |

### Why this matters

Typography carries voice. A dashboard in Inter says nothing about its
audience, its operator, or its purpose. The rejection list isn't
about font quality — Inter is technically excellent — it's about
**signal-to-noise**: a font already used by every other AI-generated
artifact carries no signal at all.

The pairings in **Font pairing recipes** above are deliberately not
in this list. If brand is specified, derive a pair from brand. If
brand is unspecified, pick from the four named recipes. Never default
to Inter.

## See also

- `ds-ref-design-principles` — the index that points here.
- `ds-ref-archetypes` — archetype profiles that drive type-scale
  selection.
- `ds-ref-color` — text colour rules (paired with type, not
  duplicated here).
- `ds-ref-layout-grid` — spacing tokens (`S_*`) and radius tokens
  (`R_*`); type scale lives here.
- `ds-ref-brand` — brand-driven font pair selection.
- `ds-viz-markdown` — the only viz that exposes `fontFamily`.
- `ds-viz-singlevalue` — `numberPrecision` and `unit` configuration.

