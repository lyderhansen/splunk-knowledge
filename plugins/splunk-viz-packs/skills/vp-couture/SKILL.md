---
name: vp-couture
description: "Design-first orchestrator for themed Splunk custom visualization app suites — takes brand/theme context, selects a viz inventory for the domain, generates a complete design brief (theme tokens, fonts, color palette, per-viz specs), then hands off to vp-create (scaffold) and vp-viz (per-viz Canvas 2D code). Bridges the design world (ds-couture) to the code world. Triggers on 'build an F1 viz pack', 'themed viz suite for healthcare', 'custom viz set for SOC', or any request to plan a coherent multi-viz Splunk app with a unified visual identity."
---

# vp-couture — Design-first orchestrator for themed viz suites

## Stance / voice

You are the art director for a visualization product. You are not the
webpack engineer. You are not the Canvas 2D renderer. Those roles belong
to `vp-create` and `vp-viz`.

Your job: take a brand, a domain, and a tone — and decide WHAT gets
built, HOW it looks, and WHY each viz exists. You produce the plan.
Others produce the code.

## When to invoke

- User wants a themed set of custom Splunk visualizations ("F1 viz pack",
  "hospital operations viz suite", "SOC viz kit").
- User has run `ds-couture` for a dashboard and wants matching custom vizs.
- User asks "which custom vizs should I build for [domain]?"
- User wants to plan before jumping into `vp-viz`.

Do NOT invoke for:
- Writing a single standalone viz with no theme context (use `vp-viz` directly).
- Scaffolding only (use `vp-create`).
- Canvas rendering recipes (use `vp-ref-patterns`).
- Gotchas/rules (use `vp-ref-gotchas`).

## Design Context Gathering

Without context you will plan a generic viz pack that could belong to
anyone. The whole point of a themed suite is that every viz feels like
it came from the same product team with the same brand book.

**Required inputs (all five):**

### 1. Brand identity

Colors, fonts, visual metaphors. Be specific:
- F1 = carbon fiber texture + Scuderia red + precision sans-serif
- Healthcare = clinical blue + white space + calm weight
- SOC = amber-on-dark + dense + monospace accents
- Retail = warm neutrals + pop color for CTAs + friendly rounded type

### 2. Domain

What industry/use case does this pack serve? The domain drives which
viz types exist. An F1 pack needs a tyre compound viz; a hospital pack
needs a bed occupancy viz. Neither needs the other.

### 3. Viz inventory

Which custom vizs does this theme need? Use the decision matrix:

**Universal (every pack gets these):**
- `single_value_tile` — themed KPI with optional sparkline, trend delta
- `status_chip` — small colored badge with label + state
- `ring_gauge` — arc-style gauge with threshold bands

**Domain-specific additions** — select from the taxonomy below based
on what questions the domain asks.

### 4. Tone

Not generic words. Specific, committable directions:
- Aggressive / precise / carbon (F1)
- Calm / clinical / trustworthy (healthcare)
- Dense / urgent / functional (SOC)
- Playful / bold / energetic (gaming)
- Premium / restrained / quiet confidence (fintech)

Three words max. They drive font choice, corner radius, animation
speed, color saturation.

### 5. Font strategy

1-2 fonts maximum. Every font is base64-embedded in the viz bundle
(woff2 = 50-300KB, base64 adds 33%). Three fonts = 600KB-1.2MB of
CSS. Two is the ceiling.

| Slot | Purpose | Examples |
|---|---|---|
| **Display** | Big numbers, hero values | Geist, JetBrains Mono, Space Grotesk, DM Sans |
| **Mono** | Codes, IDs, tickers | JetBrains Mono, Fira Code, IBM Plex Mono |

If the domain is data-heavy (SOC, NOC, infra), use mono for display
too — one font total.

## Viz Type Taxonomy

| Category | Viz types | When needed |
|---|---|---|
| **KPI** | `single_value_tile`, `sparkline_tile` | Every pack |
| **Gauge** | `ring_gauge`, `arc_gauge`, `bar_gauge`, `fill_gauge` | Threshold/SLA metrics |
| **Status** | `status_chip`, `status_board`, `traffic_light` | Service health |
| **Flow** | `process_flow`, `pipeline`, `funnel` | Conversion/workflow |
| **Spatial** | `track_map`, `floor_plan`, `network_topology` | Physical layout |
| **Time** | `live_ticker`, `timeline`, `schedule_board` | Real-time feeds |
| **Ranking** | `leaderboard`, `h_bar_list`, `top_n` | Competitive/ranked data |
| **Composition** | `donut`, `waterfall`, `stacked_bar` | Part-to-whole |

**Selection rule:** pick 5-8 total. The universal three plus 2-5
domain-specific. If you're above 8, you're building a framework —
stop and cut.

## Domain Templates

Pre-built inventories. Use as starting points, not mandates.

### F1 Racing
| Viz | Purpose |
|---|---|
| `single_value_tile` | Lap time, gap to leader, pit window |
| `ers_gauge` | Energy recovery system charge level |
| `tyre_compound` | Compound indicator with deg gradient |
| `position_board` | Grid/race position with delta arrows |
| `lap_ticker` | Live scrolling lap-by-lap feed |
| `track_info` | Circuit outline with sector highlights |

### SOC / Security
| Viz | Purpose |
|---|---|
| `single_value_tile` | Alert count, MTTD, MTTR |
| `threat_gauge` | Risk score against threshold bands |
| `attack_flow` | Kill chain / MITRE stage progression |
| `severity_board` | Stacked severity lanes with counts |
| `alert_ticker` | Scrolling real-time alert feed |
| `risk_radar` | Polar plot of risk dimensions |

### Retail / E-commerce
| Viz | Purpose |
|---|---|
| `single_value_tile` | Revenue, AOV, conversion rate |
| `revenue_gauge` | Revenue vs target fill |
| `conversion_funnel` | Step-by-step drop-off |
| `basket_donut` | Category composition ring |
| `store_heatmap` | Floor/region performance grid |
| `live_ticker` | Real-time transaction feed |

### Healthcare
| Viz | Purpose |
|---|---|
| `single_value_tile` | Wait time, bed count, patient volume |
| `triage_gauge` | Capacity vs threshold |
| `bed_occupancy` | Ward-level fill bars |
| `patient_flow` | Admission/discharge/transfer pipeline |
| `wait_ticker` | Live queue progression |
| `department_board` | Multi-department status lanes |

### Infrastructure / NOC
| Viz | Purpose |
|---|---|
| `single_value_tile` | Uptime, latency, error rate |
| `resource_gauge` | CPU/memory/disk ring gauge |
| `pipeline_flow` | CI/CD or data pipeline stages |
| `service_board` | Service health status grid |
| `incident_ticker` | Scrolling incident feed |
| `topology_map` | Node-edge service topology |

## Workflow

```
1. Brand research — understand the visual language
       ↓
2. Design context (brand, domain, tone, fonts)
       ↓
3. Design direction — palette, typography, aesthetic flavor
       ↓
4. Viz inventory (from template or custom)
       ↓
5. Design brief with per-viz specs
       ↓
6. Quality Gate
       ↓
7. Build → vp-create (scaffold) → vp-viz (per-viz code)
       ↓
8. Design critique — review the result
```

### Step 1: Brand research

Before designing anything, research the brand's existing visual
language. This prevents "generic dark dashboard with blue accents."

**Establish design context first:**
- Who is the audience? In what context do they use this?
- What jobs are they trying to get done?
- How should the interface feel? (3 brand personality words)

**Then research the brand:**
- Visit the brand's website/app and study colors, typography, spacing,
  imagery style, and interaction patterns
- Identify the brand's signature visual element — the one thing that
  makes it instantly recognizable (Disney+ = the blue gradient header,
  F1 = the carbon fiber texture + timing tower, Netflix = the red N)
- Extract the exact hex values from the brand's digital presence
- Note what fonts they use (even if we substitute with similar)
- Identify domain-specific visual metaphors (F1 = tyre compounds,
  Disney = franchise badges, SOC = kill chain stages)

**Plan the UX** before jumping to code. Run a discovery interview to
surface constraints, priorities, and what makes this pack UNFORGETTABLE.

### Step 3: Design direction

**Color principles:**
- OKLCH over HSL — perceptually uniform steps look equal
- Tint neutrals toward the brand hue (even 0.005 chroma creates
  subconscious cohesion)
- 60-30-10 rule: 60% surface, 30% text/borders, 10% accent. Accents
  work BECAUSE they're rare
- If the palette feels too monochromatic, add strategic color to
  specific elements — don't spread it everywhere

**Typography principles:**
- Reject reflex fonts (Inter, DM Sans, Space Grotesk — they create
  monoculture across projects). Find a font that fits the brand as a
  physical object — a museum exhibit caption, a hand-painted shop
  sign, a fabric label
- Three concrete brand words → font search (NOT "modern" or "clean")
- Pair one display font + one mono font. Max 2 fonts total
- Cross-check: the right font for "elegant" is NOT necessarily a
  serif. If your pick lines up with the obvious pattern, look further

### Step 8: Design critique

After building, review the result before shipping:

**Score the design** across visual hierarchy, information architecture,
emotional resonance, and brand fidelity. Quantify it — don't accept
"looks fine."

**Is it too safe?** The most common failure mode is technically correct
vizs that lack personality. If the dashboard could belong to any brand,
it needs more character. Amplify what makes it distinctive.

**Add delight:** hover effects, micro-interactions, transitions, and
unexpected polish that make the viz pack memorable. Functional is the
floor, not the ceiling.

## Design Brief Output Format

The brief is the contract between this skill and the execution skills.
It must contain:

```
DESIGN BRIEF — {pack_name}
===========================

Domain:       {domain}
Tone:         {3 words}
Flavor:       {aesthetic direction}
Fonts:        {display} + {mono} (or single font)
Dark palette:  bg={hex} card={hex} text={hex} accent={hex} muted={hex}
Light palette: bg={hex} card={hex} text={hex} accent={hex} muted={hex}

VIZ INVENTORY (N vizs)
----------------------
1. {viz_name}
   Data contract: {field1} (required), {field2} (required), {field3} (optional)
   Settings: {setting1}={default}, {setting2}={default}
   Visual: {one-paragraph description of what it looks like}

2. {viz_name}
   ...

THEME TOKENS (theme.js)
-----------------------
{token name → value mapping}

FONT EMBEDDING
--------------
{font_name}: {source URL} → woff2 → base64
Estimated CSS size: {N}KB
```

## Quality Gate

Before hand-off, every item must pass. Failure blocks hand-off.

| Check | Rule | Fail = |
|---|---|---|
| Brand research | Brand visual language studied, signature element identified | Blocked |
| Full custom coverage | Every data panel uses a custom viz (L1) | Blocked |
| Font count | Max 2 custom fonts | Blocked |
| Palette completeness | Dark AND light mode tokens defined | Blocked |
| Data contracts | Every viz has required/optional fields listed | Blocked |
| Settings defaults | Every viz has settings with sensible defaults | Blocked |
| Number formats | Every KPI has decimals/unit/scale specified (L3) | Blocked |
| Hover tooltips | Every viz has mousemove tooltip + visual highlight | Blocked |
| Branded header | Dashboard has logo/wordmark header element (L2) | Blocked |
| App naming | App name = brand name (L4) | Blocked |
| Viz count | 5-8 vizs total (not 3, not 15) | Warning |
| Field configurability | No hardcoded field names — all via formatter | Blocked |
| Bundle size estimate | Total font base64 under 800KB | Warning |

## Anti-patterns

### Don't use built-in Splunk vizs for data panels
The whole point of a viz pack is branded expression. A Disney+
dashboard with `splunk.area` and `splunk.table` is just a dark
dashboard with blue accents. Every data panel — table, chart, gauge,
KPI, donut — must be a custom Canvas viz from the pack. The custom
vizs ARE the product. (See L1 for the exemption list.)

### Don't embed 5 fonts
Two max. One display, one mono. If the brand font isn't available in
woff2, pick the closest match from Google Fonts and move on. Brand
fidelity at 1.5MB bundle size is not worth it.

### Don't hardcode field names
Every field must come from formatter settings. The user will rename
`status` to `severity` or `_time` to `event_time`. If the viz breaks,
the viz is wrong.

### Don't skip the data contract
"It takes any SPL output" is not a data contract. Specify: this viz
requires a `value` field (number) and a `label` field (string).
Optional: `trend` (number), `unit` (string). If the required fields
are missing, the viz renders an error state — not a blank canvas.

### Don't mix themes within a pack
Every viz in the pack shares ONE `theme.js`. If `single_value_tile`
uses JetBrains Mono and `ring_gauge` uses Inter, the pack looks like
a parts bin, not a product.

### Don't skip brand research
The most common failure: jumping straight to code without studying
the brand's actual visual language. Research the brand first.
Visit the brand's website. Extract real colors. Note their typography.
Identify the signature element. Without this, the viz pack will look
like "generic dark + brand color accent" — which is exactly what the
Disney+ v1 dashboard looked like before we added franchise badges
and custom vizs.

### Don't ship without hover
Canvas vizs without hover tooltips feel dead and unfinished. Every
data-displaying viz must have mousemove tooltip + visual highlight.
See `vp-ref-gotchas` I1/I2.

## Integration with ds-couture

If the user has already run `ds-couture` for a dashboard design:

1. **Import context** — Pull the palette, tone words, and brand identity
   directly from the design brief. Don't re-ask questions that are
   already answered.

2. **Archetype drives inventory** — The dashboard archetype tells you
   which vizs are needed:
   - Executive summary archetype → `single_value_tile`, `ring_gauge`,
     `sparkline_tile`
   - Operational monitoring → `status_board`, `live_ticker`, `bar_gauge`
   - SOC overview → `severity_board`, `alert_ticker`, `threat_gauge`

3. **Naming convention** — The dashboard JSON will reference custom vizs
   as `{pack_name}.{viz_name}`. Example: `f1_viz_pack.ers_gauge`. The
   pack name comes from `vp-create`; confirm it during the brief.

4. **Palette must match** — The viz pack's dark/light tokens must be
   identical to (or derived from) the dashboard's palette. Two products,
   one brand.

## Hard lessons — codified rules from shipping

These rules were learned from building and testing real viz packs.

### L1. All data vizs must be custom — only markdown and events exempt

Every viz that displays data MUST be a custom viz from the pack.
The only built-in Splunk vizs allowed in a themed dashboard are:

- `splunk.markdown` — text headers, section labels, footers
- `splunk.events` — raw event log display
- `splunk.rectangle` — shadow cards, dividers (structural, not data)
- `splunk.image` — logo, static images (structural, not data)

Everything else — tables, charts, gauges, KPIs, donuts, bars — must
be custom. If the dashboard has a table, build a custom table viz.
If it has a line chart, build a custom line chart viz. Using built-in
`splunk.area` or `splunk.table` in a themed pack defeats the purpose —
the standard Splunk chrome breaks the brand identity.

### L2. Branded header is mandatory

Every themed dashboard MUST have a branded header element — logo,
wordmark, or styled title bar. Without it, the dashboard is just
"dark theme with colored accents." The header is the first thing
the eye sees; it must immediately communicate the brand.

Use `splunk.image` pointing to `/static/app/{pack_name}/logo.svg`
for bundled images (no external URLs — they fail on domain allow
lists). Include the logo file in the app's `static/` directory.

### L3. Design brief MUST specify number format per KPI

For every KPI in the dashboard, the brief must define:
- **Raw value scale** — is 7.27 literally $7.27 or $7.27M?
- **Display decimals** — 0, 1, 2, or auto-compact?
- **Unit and position** — "$" before, "%" after, "M" after?

Without this, the viz code will auto-compact 7.27 → 7 (rounds to
integer) or 3800000 → 3.8M when you meant 3.8%.

### L4. App name = brand name

The app ID becomes the viz type prefix in every dashboard JSON:
`disney_plus_viz.kpi_tile`, `f1_viz_pack.ers_gauge`. Name the app
after the brand so the JSON reads naturally. Never use generic names
like `custom_viz` or `my_viz`.

### L5. Always regenerate XML when JSON changes

Dashboard Studio v2 dashboards are stored as JSON inside XML CDATA.
If you update the JSON definition, you MUST regenerate the XML in
`default/data/ui/views/`. Otherwise the installed app has stale
dashboards.

### L6. No gradient wash rectangles on canvas

Low-opacity colored rectangles overlaid on the canvas create a
washed-out, muddy look — not depth. Use a solid
`layout.options.backgroundColor` for the base, shadow rectangles
behind panel groups for depth, and faux glow on hero elements for
accent.

## What this skill does NOT do

| Task | Responsible skill |
|---|---|
| Write `visualization_source.js` | `vp-viz` |
| Scaffold app directory structure | `vp-create` |
| Build/package/webpack | `vp-create` |
| Canvas 2D rendering recipes | `vp-ref-patterns` |
| Hard rules (AppInspect, iframe, ES5) | `vp-ref-gotchas` |
| Dashboard JSON authoring | `ds-create` |
| SPL queries | `splunk-spl` |
