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
| **Data** | Numbers, KPIs, gauges, axis labels | Tabular/monospaced for alignment. Many options beyond JetBrains Mono. |
| **UI** | Labels, headers, section titles, descriptions | Sans-serif for readability. Match brand tone. |

**Font selection — DON'T default to JetBrains Mono every time.**

JetBrains Mono is a developer tool font. It's fine for SOC/infra but
wrong for luxury, editorial, or brand-forward dashboards. Choose fonts
that match the brand's visual language:

| Brand tone | Data font | UI font |
|---|---|---|
| Technical / engineering | JetBrains Mono, Fira Code, IBM Plex Mono | Inter, Helvetica |
| Premium / luxury | Söhne Mono, Geist Mono, DM Mono | Söhne, Geist, Neue Haas |
| Editorial / magazine | Iosevka, Input Mono | Tiempos, Canela, Playfair |
| Playful / brand-forward | Space Mono, Overpass Mono | Space Grotesk, DM Sans, Outfit |
| Clinical / healthcare | IBM Plex Mono | IBM Plex Sans, Atkinson Hyperlegible |
| Default (no brand specified) | SF Mono, Menlo, Consolas (system) | Helvetica Neue, Arial (system) |

**System fonts are free.** Using `"SF Mono", Menlo, Consolas, monospace`
and `"Helvetica Neue", Helvetica, Arial, sans-serif` requires NO
base64 embedding — 0KB overhead. Only embed custom fonts when the
brand specifically requires them.

If the domain is data-heavy (SOC, NOC, infra), use mono for both
slots — one font total.

## Viz Type Inspiration

The table below is a STARTING POINT — not a constraint. You have
full Canvas 2D freedom. If the brand or data calls for a viz type
that doesn't exist in this table, INVENT IT. The best viz packs
have at least one viz that makes someone say "I've never seen that
in Splunk before."

| Category | Example types | Inspiration |
|---|---|---|
| **KPI** | single value, sparkline tile, stat card | Bloomberg terminal, Tesla instrument cluster |
| **Gauge** | ring, needle, segmented arc, fill bar | F1 telemetry, car dashboard, medical monitors |
| **Status** | health grid, status matrix, traffic light | Datadog service map, AWS health dashboard |
| **Chart** | area, bar, radar, horizon, spark strip | FT data journalism, Stripe analytics |
| **Flow** | pipeline, waterfall, funnel, sankey | Figma flow diagrams, Vercel deploy pipeline |
| **Spatial** | track map, floor plan, network topology | F1 circuit map, datacenter floor, network diagram |
| **Time** | live ticker, timeline, schedule board | Bloomberg news ticker, airport departures |
| **Ranking** | leaderboard, horizontal bars, top-N | ESPN standings, app store rankings |
| **Composition** | donut, treemap, stacked, waterfall | NYT election results, GitHub language breakdown |
| **Matrix** | heat grid, punchcard, correlation | GitHub contributions, Spotify listening patterns |

**Rules:**
- 5-8 vizs total per pack
- Minimum 3 DISTINCT categories — no all-gauges or all-donuts
- Let the DATA drive the viz choice, not habit
- If you catch yourself defaulting to donut + ring gauge + KPI tile
  for the third brand in a row, STOP and ask: what would a graphic
  designer choose for THIS specific data story?

## Domain Templates

Example inventories for inspiration. The AI should analyze the actual
data and domain before choosing viz types — don't copy these blindly.
These are starting points, not mandates.

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

## Workflow — NO STEPS MAY BE SKIPPED

**MANDATORY:** Every step below MUST be executed in order. Skipping
steps 1-3 produces generic output. Skipping step 6 ships bugs.
Skipping step 8 ships mediocrity. There are no shortcuts.

If time is limited, reduce VIZ COUNT (3 instead of 6) — do NOT
reduce DESIGN DEPTH. Three unique vizs beat six generic ones.

```
1. Brand research — understand the visual language        [BLOCKING] [OPUS]
       ↓
2. Design context (brand, domain, tone, fonts)            [BLOCKING] [OPUS]
       ↓
3. Design direction — palette, typography, aesthetic       [BLOCKING] [OPUS]
       ↓
4. Viz inventory (from template or custom)                           [OPUS]
       ↓
5. Design brief with per-viz specs                                   [OPUS]
       ↓
6. Quality Gate — ALL checks must pass                    [BLOCKING] [OPUS]
       ↓
7. Build → vp-create (scaffold) → vp-viz (per-viz code)             [SONNET]
       ↓
8. Design critique — review the result                    [BLOCKING] [OPUS]
```

**Model selection:** Steps 1-6 and 8 require judgment, taste, and
evaluative reasoning — use **Opus**. Step 7 is implementation —
use **Sonnet** (faster, cheaper, equally reliable for code).
When dispatching subagents for step 7, set `model: "sonnet"`.

**Step 7 MUST-LOAD — cross-plugin rules:**
Before building, the agent (or subagent) MUST load:
- `vp-ref-gotchas` — viz code rules (ES5, outputMode, file paths)
- `ds-create` from `splunk-dashboard-studio` — dashboard hard defaults
  (canvas 1920×1080, fontFamily, fontSize, markdown sizing)
- `spl-gotchas` from `splunk-spl` — SPL traps for data source queries

Missing any of these produces broken output with no obvious error.

**STOP gates:** Steps marked [BLOCKING] must produce an artifact
before proceeding. Step 1 produces brand research notes. Steps 2-3
produce the design brief. Step 6 produces a checklist with all
items checked. Step 8 produces a critique score. If ANY of these
is missing, the build was rushed and the output will be generic.

**Quick mode:** For rapid prototyping or demos, steps 1-3 can be
condensed into a single design direction statement from the user.
The full protocol is for production brand launches.

### Subagent enforcement

When delegating to `vp-viz` subagents, the prompt MUST include:
1. The full design brief (not just "use HBO Max colors")
2. The brand-specific panel chrome description (not "use drawPanel()")
3. The anti-pattern list (copy from the Anti-patterns section below)
4. Explicit instruction: "Do NOT use theme.drawPanel() — use the
   brand-specific chrome described in the brief"
5. Explicit instruction: "outputMode MUST be
   SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE, NEVER 'json'"
6. Explicit instruction: "Use require()/module.exports, NEVER
   define() — webpack adds the AMD wrapper (see gotchas F6)"
7. Explicit instruction: "Use SplunkVisualizationBase.extend({...})
   object literal, NEVER prototypal constructor pattern (see F7)"
8. Explicit instruction: "Canvas background must use clearRect(),
   NEVER fillRect() with theme colors (see B13)"
9. Explicit instruction: "Include accentIntensity setting (0-100,
   default 50) — multiply all glow/shadow/accent opacities by gi"
10. Explicit instruction: "Download hero/brand images to
    appserver/static/images/ — NEVER use external URLs (see F8)"

Without these in the prompt, subagents default to generic patterns.

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
- 60-30-10 rule: 60% neutral surface, 30% brand primary, 10% accent.
  Accents work BECAUSE they're rare. More than 3 saturated colors at full
  brightness simultaneously = toy look. Gauge segments, chart fills, and
  data badges count toward the 10%
- If the palette feels too monochromatic, add strategic color to
  specific elements — don't spread it everywhere
- No gradient wash rectangles on canvas: low-opacity colored overlays
  create a muddy, washed-out look. Use a solid `layout.options.backgroundColor`
  for the base, shadow rectangles behind panel groups for depth, and
  faux glow on hero elements for accent

**Light theme is not an inversion of dark.** It requires independent
design — `s/dark/light/g` produces harsh, broken results:
- Background: `#F0F2F5` (NOT pure white — too harsh)
- Panel: `#FFFFFF` with subtle `rgba(0,0,0,0.06)` edge
- Text: `#0B0E1A` primary, `rgba(11,14,26,0.60)` dim
- Gauge unfilled: `rgba(0,0,0,0.06)` (NOT white-based)
- Grid lines: `rgba(0,0,0,0.06)` (NOT white-based)
- Hero dimming overlay: `#F0F2F5` at 35% (NOT black)
- Accent colors may need lower chroma on white backgrounds

The `getTheme('light')` function MUST return a complete independent
palette, not derived values. Every viz must be tested in both themes.

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

**XML regeneration:** Dashboard Studio v2 dashboards are stored as JSON
inside XML CDATA. After any change to the dashboard JSON, regenerate the
XML in `default/data/ui/views/`. Stale XML means users install the app
and see an old dashboard.

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
   Settings: {setting1}={default}, {setting2}={default}, accentIntensity=50
   Number format: raw scale ({e.g. value is literal dollars}), decimals={0|1|2}, unit="{$|%|ms}" position={before|after}
   Visual: {one-paragraph description of what it looks like}

2. {viz_name}
   ...

THEME TOKENS (theme.js)
-----------------------
{token name → value mapping}

STANDARD SETTINGS (every viz gets these)
----------------------------------------
accentIntensity: 0-100 (default 50) — glow/accent effect strength
accentColor: hex (default from palette) — primary accent
theme: dark|light (default dark)
backgroundColor: transparent (set via Dashboard Studio panel option)

IMAGE ASSETS
------------
{image}: {source URL} → download to appserver/static/images/{filename}
NEVER reference external URLs in dashboards — always bundle locally.

FONT EMBEDDING
--------------
{font_name}: {source URL} → woff2 → base64
Estimated CSS size: {N}KB

APP NAMING
----------
App ID = {brand_slug} (e.g. f1_viz_pack, disney_plus_viz)
The app ID becomes the viz type prefix in every dashboard JSON:
  disney_plus_viz.kpi_tile, f1_viz_pack.ers_gauge
Name the app after the brand so the JSON reads naturally.
Never use generic names like custom_viz or my_viz.
```

## Quality Gate

Before hand-off, run every check. Technical items are hard blockers.
Design items are recommendations — flag them, but they do not stop
hand-off on their own.

| Check | Rule | Fail = |
|---|---|---|
| Brand research | Brand visual language studied, signature element identified | Recommended |
| Full custom coverage | Every data panel uses a custom viz | Recommended |
| Unique rendering | Each viz has brand-specific _render() code | Recommended |
| Panel chrome defined | Brand-specific chrome, not generic drawPanel() | Recommended |
| Depth treatment | Shadow/flush/stroke chosen per brand | Recommended |
| Font count | Max 2 custom fonts | Blocked |
| Palette completeness | Dark AND light mode tokens defined | Blocked |
| Data contracts | Every viz has required/optional fields listed | Blocked |
| Settings defaults | Every viz has settings with sensible defaults | Blocked |
| Number formats | Every KPI has decimals/unit/scale specified | Blocked |
| Hover tooltips | Every viz has mousemove tooltip + visual highlight | Blocked |
| Branded header | Dashboard has logo/wordmark header element | Recommended |
| App naming | App name = brand name | Blocked |
| Viz count | 5-8 vizs total — fewer is fine if they're distinctive | Recommended |
| Viz variety | Minimum 3 DISTINCT viz types — no all-gauges or all-donuts | Recommended |
| Field configurability | No hardcoded field names — all via formatter | Blocked |
| accentIntensity | Every viz has accentIntensity setting (0-100, default 50) | Blocked |
| Transparent canvas | Vizs use clearRect(), never fillRect() with bg color | Blocked |
| Images bundled | All images downloaded to appserver/static/images/, no external URLs | Blocked |
| Data source names | Every dashboard data source has a `"name"` property | Blocked |
| Bundle size estimate | Total font base64 under 800KB | Warning |

## Anti-patterns

### Don't copy vizs between brands and swap colors
THIS IS THE #1 FAILURE MODE. Building Disney+, Netflix, and Red Bull
with the same 5 viz source files and different theme.js produced
dashboards that looked nearly identical — same panel chrome, same
arc shapes, same layout rhythm, different hex values.

**Color tokens are NOT enough for brand identity.** The Canvas
rendering code itself — how shapes are drawn, what chrome exists,
how elements are sized and positioned — defines the visual identity
far more than palette tokens.

**Rule:** every brand gets UNIQUE `visualization_source.js` files
by default. The shared `theme.js` provides colors and fonts, but
the `_render()` function must be brand-specific. A Red Bull speed
gauge has segmented arcs with red zone markings and shift lights.
A Disney+ subscriber gauge has a smooth gradient ring with soft glow.
They are fundamentally different drawings, not recolored copies.

**Only reuse viz code** if the user explicitly asks for a "quick
theme swap" or "just change the colors." Treat it as a downgrade
from the default, not the standard approach.

### Don't use `drawPanel()` on every viz
The generic `theme.drawPanel()` function (1px border, rounded rect)
creates identical-looking panel chrome across all vizs and all brands.
This is the "AI dashboard" look.

Instead, design panel chrome per brand:
- F1/Racing: no border, sharp edges, dark panels that blend with bg
- Streaming: soft rounded cards, subtle edge
- Industrial: heavy borders, square corners, thick stroke
- Medical: clean white panels, thin separator lines

Define the panel chrome explicitly in the design brief before handing
off to vp-viz.

### Shadow rectangles are optional, not mandatory

Shadow rects create depth but also visual sameness. Some brands look
better without them:
- F1 telemetry: panels should feel INTEGRATED with the dark bg — no
  shadow = flush = technical
- Industrial: thick borders create depth, shadows are redundant

Shadow rectangles are recommended for executive and editorial styles.
They are NOT mandatory for technical, industrial, or race-engineer styles.

### Don't use built-in Splunk vizs for data panels
Every data panel must be a custom Canvas viz from the pack.

### Don't embed 5 fonts
Two max. One display, one mono.

### Don't hardcode field names
Every field must come from formatter settings. The user will rename
`status` to `severity` or `_time` to `event_time`. If the viz breaks,
the viz is wrong.

### Branded header — go beyond a solid-color banner
Every themed dashboard should have a branded header element — logo,
wordmark, or styled title bar. Without it, the dashboard is "dark theme
with colored accents." Use `splunk.image` pointing to
`/static/app/{pack_name}/images/logo.svg` for bundled logos (no external
URLs — they fail on domain allow lists). Include the logo file in
`appserver/static/images/`.

A flat, single-color rectangle as the header is the laziest form of
design. It looks like PowerPoint 2010. Instead:
- **Gradient:** 2-3 color gradient along the banner (brand primary → darker shade)
- **Gradient + texture:** subtle noise or pattern on top of gradient
- **Image banner:** hero image cropped to banner height with text overlay
- **No banner at all:** sometimes the brand identity comes from the
  viz chrome, hero image, and typography — not a colored stripe

If the dashboard has a hero background image, a banner is usually redundant.

### Consider a hero image as visual anchor

A dashboard without a hero image is widgets on a dark background.
A brand-relevant hero (car photo, product render, facility shot)
transforms the whole dashboard.

**Hero composition pattern:**
1. `splunk.image` at z-layer 0, full canvas width, top 50-60% of height
2. `splunk.rectangle` dimming overlay (30-40% opacity bg color) at z-layer 1
3. `splunk.rectangle` vignette at bottom (85-95% opacity, 80-120px tall) to fade into data area
4. Semi-transparent panels (85-92% opacity bg color) floated over the image for gauges/data
5. Data elements ON TOP of the panels

Dark theme: overlay `#0B0E1A` at 35%, panels at 88%.
Light theme: overlay `#F0F2F5` at 35%, panels at 88%.

The car/product should remain visible between the side panels.
This is a recommended pattern, not mandatory — SOC walls and status
pages often work better without a hero image.

### Semi-transparent grouping panels

Floating panels with 85-92% opacity background create visual hierarchy
without heavy borders or drop shadows:
- Group related elements (gauges + gear + ERS together)
- Panel color matches canvas bg (just barely visible as a region)
- Stroke at 3-4% white opacity for subtle edge definition
- rx:4 for slight softness (not 0 = harsh, not 8 = bubbly)

This is the middle ground between "everything flat on canvas" (no
hierarchy) and "every panel in a card" (too much chrome).

### Section labels should whisper, not shout

Section headers ("TELEMETRY", "SECTOR TIMES", "TYRE STRATEGY") should
be extraSmall fontSize at 30% text opacity. They organize without
competing with data. Never use `## Heading` style markdown for section
labels in themed dashboards — too heavy.

## Design scoring — quantitative quality gate

**Run this scoring BEFORE step 7 (build) and AFTER step 8 (critique).**

Rate each dimension 1-10. Score each dimension. Low scores are warnings,
not blockers. A brutalist dashboard that scores 5 on emotional resonance
but 10 on brand distinctiveness is a valid design choice.

### Dimension 1: Visual hierarchy (1-10)

| Score | Meaning |
|---|---|
| 1-3 | Everything same size. No focal point. Eye wanders. |
| 4-6 | Some contrast but subtle. Multiple elements compete for attention. |
| 7-8 | Clear hero element per zone. Supporting data recedes. Labels whisper. |
| 9-10 | 2-second story. One element dominates. Eyes follow intended path. |

**Typographic tension test:** measure the ratio between your largest
text (hero value) and smallest text (label). Under 3:1 = flat.
Target ≥ 4:1. Three tiers required:

| Tier | Size | Opacity | Example |
|---|---|---|---|
| **Hero** | 36-72px bold | 100% | The ONE most important number |
| **Body** | 14-24px | 60-80% | Supporting values, secondary data |
| **Whisper** | 8-11px uppercase | 25-35% | Labels, section headers, metadata |

### Dimension 2: Whitespace quality (1-10)

| Score | Meaning |
|---|---|
| 1-3 | Everything edge-to-edge. No breathing room. |
| 4-6 | Uniform padding everywhere — the AI default. Mechanical, not designed. |
| 7-8 | Intentional variation. Dense within groups, spacious between sections. |
| 9-10 | Whitespace IS the design. Negative space creates tension and focus. |

**Spacing variation test:** if every gap is the same (16px everywhere),
score ≤ 5. Fix: 8px within groups, 24-32px between sections, 48px+
between major zones.

### Dimension 3: Brand distinctiveness (1-10)

| Score | Meaning |
|---|---|
| 1-3 | Generic dark dashboard with colored accents. Could be any brand. |
| 4-6 | Colors match but forms are generic. "Themed" not "branded." |
| 7-8 | Shape language, typography, and chrome feel brand-specific. |
| 9-10 | Recognizable with colors removed. Someone could name the brand from silhouette. |

### Dimension 4: Emotional resonance (1-10)

| Score | Meaning |
|---|---|
| 1-3 | Spreadsheet with dark mode. Zero emotional response. |
| 4-6 | "Professional" but forgettable. Nobody screenshots this. |
| 7-8 | Creates mood. You WANT to look at it. Invites interaction. |
| 9-10 | "Wait, that's Splunk?" Makes someone share it. |

## Anti-AI aesthetic checklist — step 8 gate

Run after design critique. 3+ items present = BLOCKED.

| # | AI tell | What it looks like | Fix |
|---|---|---|---|
| 1 | Uniform spacing | 16px gap everywhere | 8px within groups, 32px+ between sections |
| 2 | Symmetric layout | Left column = right column width | 60/40 or 70/30 asymmetry |
| 3 | Same-size values | Every KPI is 24px | ONE hero 48px+, rest 14-18px |
| 4 | Rainbow variety | Each panel different color | 60-30-10 rule, max 2 saturated |
| 5 | Everything centered | All text center-aligned | Left-align data, right-align numbers |
| 6 | Flat depth | Every panel at same visual level | 3 layers: bg → mid-ground → foreground |
| 7 | Generic chrome | roundRect 1px border everywhere | Brand-specific panel treatment |
| 8 | No visual anchor | No hero image, no dominant element | Hero image, oversized gauge, or statement |
| 9 | Overcomplete | Shows everything equally | Ask: what can I REMOVE? |
| 10 | Solid-color banner | Flat single-color rectangle for branding | Gradient, pattern, image, or no banner |
| 11 | No tension | Nothing bold, nothing quiet, all medium | Contrast: big vs small, dense vs sparse |

**Scoring:** Count present tells. 0-1 = pass. 2 = warning. 3+ = blocked.

## Intentional asymmetry principle

Symmetry is comfortable but forgettable. Asymmetry creates energy
and directs attention.

**Panel widths:** 60/40 or 70/30 by default. Avoid 50/50 by default —
asymmetry creates hierarchy. But 50/50 is valid when comparing two equal
datasets or in status grids. The wider panel signals primary content;
the narrower supports.

**Vertical rhythm:** vary density through the dashboard:
```
Top:      Tight KPI strip (dense, scannable)
Middle:   Generous hero zone (spacious, dominant)
Bottom:   Dense data area (tables, detail)
```

**Hero placement:** rule of thirds. Place the most important element
at 1/3 from left or 1/3 from top — not dead center.

**Exception:** symmetry IS valid for KPI strips (5 equal-width tiles)
because the data type is uniform. But even then, one tile should be
visually differentiated (larger font, accent color, border).

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
