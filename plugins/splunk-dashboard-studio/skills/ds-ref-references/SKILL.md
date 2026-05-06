---
name: ds-ref-references
description: Named best-in-class dashboard examples for mental calibration — NYTimes pandemic graphics, Stripe Sigma analytics, Splunk ITSI service map, Linear status pages, FT visual journalism. Per-reference: archetype it exemplifies, what makes it work, what would not transfer to Splunk's constraints. Plus anti-references — named examples to refuse (default uniform grids, 2010-era PowerPoint exec slides, neon SOC walls). Use when ds-couture needs a reference point ("make it feel like X"), or when calibrating taste.
---

# ds-ref-references — Best-in-class examples and anti-references

> **Status:** skeleton only. Body authored as new content in a follow-up task.

## Scope (what's IN)

- 8–12 named best-in-class references with archetype mapping.
- Per reference: what specifically makes it work, what would not transfer to Studio's constraints.
- 5–8 named anti-references with refusal rationale.
- Translation guide — when user says "like Stripe", what visual decisions does that imply.

## Out of scope (what's NOT here)

- Brand discovery process — see `ds-ref-brand`.
- Color extraction from logos — see `ds-ref-brand`.

## Consults

- `ds-ref-archetypes` (which archetype each reference exemplifies).

## Consulted by

- `ds-couture` (reference calibration).
- `ds-ref-brand` ("like X" translations).

## Source / migration

- All new content — no existing source. Curated by hand. Will need refresh discipline as named brands evolve.

## Estimated size

S–M

---

## How to use this skill

When the user says "make it look like X" or "I want this to feel like
[brand or product]":

1. **Check the curated set below.** If X appears as a named
   best-in-class reference, route to its per-reference notes — read the
   archetype, what specifically works, what translates to Studio, and
   what does NOT translate. Use those to set the design direction.
2. **If X is not curated**, ask the user what specifically about X they
   want to evoke. Probe for: layout discipline, color restraint,
   typographic rhythm, density level, or motion feel. Without that, "like
   X" is a vibe — not a brief.
3. **Check the anti-reference list before generating.** If the request
   sounds like a default uniform grid, a 2010-era PowerPoint slide, or a
   neon SOC wall, refuse and propose an archetype-driven alternative.
4. **Use the "like X" translation guide** to compress a named reference
   into concrete decisions: theme, palette, typography, spacing,
   density, criticality.

The reference set is curated, not exhaustive. Refresh annually as named
brands evolve — Stripe redesigns, Linear adds chrome, products ship
new module. A reference frozen in 2026 will mislead by 2028.

## Best-in-class references

### NYTimes pandemic graphics (2020–2022)

- **Archetype:** analytical deep-dive
- **What works:** information density without overwhelm; map +
  trendline + table integrated; clear ordering of data; consistent
  sequential color ramp tied to severity; editorial typography that
  signals "this is journalism, not a control panel"
- **What translates to Studio:** F-pattern reading, sequential color
  for ordered data (severity / case counts), generous spacing around
  the hero number, table-as-supporting-detail beneath chart-as-headline
- **What does NOT translate to Studio:** custom interpolation between
  charts; fluid scrolling narratives; per-state selection animations;
  bespoke SVG annotation layers

### Stripe Sigma analytics

- **Archetype:** executive summary / analytical
- **What works:** generous whitespace; single anchor metric per panel;
  refined typography; near-monochrome palette with one accent (Stripe
  purple); deliberate restraint — every pixel earns its place
- **What translates to Studio:** restraint principle; one anchor KPI
  per zone; semantic-only color; whitespace as a design element;
  near-monochrome with brand accent
- **What does NOT translate to Studio:** custom font (Sigma uses brand
  font; Studio only allows fontFamily on splunk.markdown); subtle
  hover motion on KPI cards; in-product query builder UI

### Splunk ITSI service map

- **Archetype:** operational monitoring
- **What works:** node-link graph as primary signal; status color on
  edges; pop-out detail without leaving context; high information
  density that rewards experts and tolerates novices
- **What translates to Studio:** linkgraph viz, status colors on
  edges, click-to-detail via drilldowns, dark theme as the operational
  default
- **What does NOT translate to Studio:** continuous force-directed
  layout updates; per-edge tooltip animation; live streaming arc
  animations along edges

### Linear status pages

- **Archetype:** simplified operational / executive
- **What works:** single-column timeline + status tiles; calm visual
  rhythm; clear incident metadata; the page communicates "we have this
  under control" via design alone
- **What translates to Studio:** single-column NEAT layout; sparse-but-clear
  status; understated typography; restrained green/yellow/red status
  vocabulary
- **What does NOT translate to Studio:** custom motion design between
  state transitions; SVG illustrations between content sections; the
  Inter font at custom weights

### FT visual journalism

- **Archetype:** analytical / editorial
- **What works:** unusual chart types tied tightly to story; type-set
  numbers as a design element; FT pink (#FFF1E5 background, dark text)
  as deliberate accent; chart selection driven by the question, not
  the default
- **What translates to Studio:** chart-selection rationale, deliberate
  color accent, hierarchy through type, willingness to pick a less
  common viz when it answers the question better
- **What does NOT translate to Studio:** bespoke SVG charts; custom
  fonts; print-grade typesetting; the warm cream background

### Apple System Status

- **Archetype:** simplified operational
- **What works:** ruthless reduction — one status dot per service, one
  sparse calendar grid for history; the entire page reads in two
  seconds; the absence of decoration is the design
- **What translates to Studio:** ellipse-as-status-dot patterns; sparse
  table for incident history; refusal to show numbers when a green dot
  carries the message; deliberately low information density when the
  audience is non-technical
- **What does NOT translate to Studio:** the nearly empty page (Splunk
  pressure usually demands more density); custom spacing tokens; the
  San Francisco font

### Cloudflare Radar

- **Archetype:** analytical deep-dive
- **What works:** information-dense world map + trend lines + ranked
  tables coexisting on one page; deliberate orange-on-near-black
  brand accent; categorical color that does NOT collapse into rainbow;
  dark theme done with restraint
- **What translates to Studio:** map + line + table composition pattern;
  brand-accent on dark background discipline; categorical palette with
  bounded slot count; F-pattern landing on the map
- **What does NOT translate to Studio:** custom Mapbox styling;
  per-region animated transitions; bespoke icons for traffic categories

### Vercel Analytics

- **Archetype:** executive / analytical hybrid
- **What works:** stark monochrome (near-black + near-white) with one
  brand-accent stripe; the chart IS the page; geometry-of-numbers
  typography (large monospace numerals); confident hierarchy — the
  primary metric is unmissable
- **What translates to Studio:** monochrome-with-one-accent palette;
  large-numerals KPI singlevalue tiles with monospace; aggressive
  hierarchy where one number dwarfs everything else
- **What does NOT translate to Studio:** the Geist font; the
  custom-cursor crosshair on hover; framer-motion scrubbing
  interactions on the line chart

### Splunk Enterprise Security default SOC overview

- **Archetype:** SOC overview
- **What works:** purpose-built for the multi-monitor wall context;
  status-first encoding; high signal density that experts decode at a
  glance; consistent severity vocabulary across panels
- **What translates to Studio:** SOC severity palette
  (red/orange/yellow/green) used consistently; high panel count is OK
  *for SOC archetype only*; status badges via singlevalueicon; dark
  theme by default
- **What does NOT translate to other archetypes:** the density is
  archetype-specific — copying ES's panel count into an executive
  summary is the most common dashboard-design mistake. Use this
  reference ONLY when the audience is SOC analysts on a wall display.

## Anti-references

### "Default uniform grid"

- 3×3 panels of identical size, default colors, no hierarchy, every
  panel a line chart, legend in the same place on every panel.
- **Refusal rationale:** this is what AI generates by default and what
  beginners ship before learning hierarchy. Refuse and propose
  archetype-driven layout — one hero zone, supporting context, detail
  at the bottom.

### "2010-era PowerPoint exec slide"

- Pie chart with 8 slices in rainbow palette + 3D shadow + drop-shadow
  on text + gradient title bar.
- **Refusal rationale:** pie > 6 slices is an absolute ban (use bar);
  rainbow on ordered data is reflex-refuse; 3D shadow is gradient
  text's cousin; gradient title bars are the visual signature of
  amateur dashboards.

### "Neon SOC wall"

- All-glow accents, every metric in #00FFAA cyan, animated pulses on
  every status indicator, monospace EVERYTHING, screen-saver vibes.
- **Refusal rationale:** glow accents drown out semantic status colors;
  everything cyan = nothing important; pulses cry-wolf for attention
  the moment any panel actually goes red. The goal of a SOC wall is
  *legibility under stress*, not *aesthetics of stress*.

### "Splunk default rainbow chart"

- A column chart with 20 categorical series, each in a different hue
  from the default Splunk categorical palette, no legend ordering, no
  consolidation of long tail.
- **Refusal rationale:** categorical color saturates around 7-8 slots;
  beyond that, slot identity collapses. Refuse and propose top-N + an
  "Other" bucket, or a different viz (table sorted by metric).

### "Executive dashboard with 47 KPIs"

- A dashboard titled "Executive Overview" with 30+ singlevalue tiles
  in a uniform grid, no visual hierarchy, every tile equally loud, no
  prioritization between revenue and helpdesk-ticket-count.
- **Refusal rationale:** executive summary archetype caps at ~5-7
  hero metrics. Beyond that, the audience cannot rank importance and
  the dashboard becomes wallpaper. Refuse and ask which 3-5 metrics
  the executive actually opens this page to see.

### "AI-generated dashboard tutorial output"

- The dashboard you get when you paste "make me a Splunk dashboard"
  into a generic LLM: title bar, 6 panels in a 3×2 grid, every panel
  a line chart of `_time | stats count`, default theme, no inputs,
  no drilldowns, no purpose statement.
- **Refusal rationale:** this is the visual signature of "no design
  context was gathered." Refuse and run ds-couture's Design Context
  Protocol (archetype, audience, brand, criticality) before writing
  any panel.

## "Like X" translation guide

When user says "make it like Stripe":

- **Theme:** light (Stripe runs light interfaces in product)
- **Palette:** near-monochrome with one accent (Stripe purple #635BFF
  or the user's brand equivalent)
- **Typography:** refined display + clean body; size hierarchy carries
  the weight, not bold
- **Spacing:** generous — whitespace is the dominant material
- **Density:** low (3-5 panels per zone, big hero number)
- **Criticality:** low (their analytics are deliberate, not pager-bound)

When user says "make it like Splunk ITSI":

- **Theme:** dark
- **Palette:** status semantic (red/orange/yellow/green) + categorical
  for service identity, bounded ~7 slots
- **Typography:** clean monospace for IDs and timestamps, sans for
  labels
- **Spacing:** tight
- **Density:** high
- **Criticality:** high (ops surface — operators are paged from this)

When user says "make it like Linear":

- **Theme:** dark by default; light variant exists
- **Palette:** near-monochrome neutrals + a single brand accent
  (Linear's purple); status colors used sparingly
- **Typography:** Inter-style sans, balanced size scale, 1.5 line
  height, no bold for hierarchy
- **Spacing:** generous; ample padding around every element
- **Density:** low to medium
- **Criticality:** medium (status awareness, not paging)

When user says "make it like NYTimes":

- **Theme:** light (editorial default)
- **Palette:** near-grayscale + one categorical sequential ramp tied
  to ordered data; deliberate red as accent for severity
- **Typography:** serif headline + clean sans body; numbers as a
  design element
- **Spacing:** column-grid driven; map and chart are the centerpieces
- **Density:** medium-high but layered (hero chart, supporting chart,
  table)
- **Criticality:** low (analytical)

When user says "make it like Cloudflare Radar":

- **Theme:** dark
- **Palette:** near-black background + Cloudflare orange accent +
  bounded categorical; sequential ramp on the map
- **Typography:** clean sans for labels, monospace for technical
  identifiers (ASN, country code)
- **Spacing:** medium — dense but not packed
- **Density:** high (map + lines + tables coexist)
- **Criticality:** low to medium (analytical with operational tinge)

When user says "make it like Vercel":

- **Theme:** light or dark, but stark — near-white or near-black
  background with no in-between greys
- **Palette:** monochrome with one accent stripe; no categorical
  variety
- **Typography:** large monospace numerals as hero; clean sans
  elsewhere
- **Spacing:** generous, almost empty
- **Density:** very low — the chart IS the page
- **Criticality:** low (this is "look at how clean our analytics are",
  not "watch this for incidents")
