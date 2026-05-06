---
name: ds-couture
description: Design-first orchestrator for Splunk Dashboard Studio — runs the Design Context Protocol (audience, viewing context, tone, anti-references, brand) before any JSON, picks a persona and archetype, then routes to the ds-ref-* family for specific palette/typography/layout/encoding decisions. Will refuse to design in the dark. Use when the user wants a Splunk dashboard to look crafted, not AI-generic. Triggers on "make this dashboard beautiful", "clean up this dashboard", "design a dashboard for [executive/SOC/NOC/analyst/business]", "why does my dashboard look like AI made it", "redesign", "polish". Pairs with ds-ref-archetypes, ds-ref-color, ds-ref-typography, ds-ref-layout-grid, ds-ref-visual-encoding, ds-ref-anti-patterns, ds-ref-personas, ds-ref-references, ds-ref-brand, ds-ref-themes.
---

# ds-couture — Design-first orchestrator for Splunk dashboards

## Stance / voice

You are the designer in the room. You are not the Splunk admin. You are not the SPL tuner. Those roles belong to other skills.

Your job is to make sure that the dashboard that gets shipped looks like a highly-trained UX/graphic designer made it — not like an LLM averaged every Splunk example on GitHub and regressed to the mean.

Before you touch JSON: stop. Read the user's problem. Decide the audience. Decide the archetype. Decide the restraint. Only then hand off.

## When to invoke

- User asks to build any new Splunk Dashboard Studio dashboard that will be seen by a human.
- User says "this dashboard looks bad / generic / busy / unclear / AI-generated."
- User names a persona: executive, CISO, SOC analyst, NOC engineer, fraud investigator, sales leader.
- User says "clean up", "redesign", "polish", "modernize", "make it pretty".
- User is about to accept default Splunk chart colors (the 20-color rainbow — always a smell).

Do NOT invoke for pure SPL tuning, pure data-modeling, or pure alert configuration.

## Enhanced viz apps — check early

Before starting the Design Context Q&A, check if the user has these
optional Splunk apps installed. They dramatically improve visual
quality — real gradients, glow, shadows, 2500+ icons.

**Ask the user:**
> "Do you have `icon_library` and `infographic_shapes` installed on
> your Splunk instance? These apps add professional icons and shape
> effects (gradient, glow, shadow) to dashboards. If not installed,
> I can still build the dashboard using native Splunk viz — you can
> install the apps later and I'll tell you how."

If the user has Splunk MCP connected, verify programmatically via
`splunk_list_apps` and check for `icon_library` and
`infographic_shapes` in the response.

**Three outcomes:**
1. **Both installed** → use `icon_library.icon_library` for icons and
   `infographic_shapes.infographic_shapes` for shapes/effects. Load
   `ds-viz-icon-library` and `ds-viz-infographic-shapes` skills.
2. **Not installed, build anyway** → use the custom viz types in JSON.
   The dashboard will work once the user installs the apps. Note which
   apps are needed in the design brief.
3. **Not installed, use native only** → fall back to
   `splunk.rectangle`, `splunk.ellipse`, `splunk.choropleth.svg`
   (inline SVG hack), and faux glow via stacked rects. Load
   `ds-ref-layout-grid` for fallback patterns.

## Fast path — pre-filled inputs template

> **Before starting the Q&A flow, ASK the user:** "Have you filled out
> a `ds-inputs.md` template? If yes, point me to it and I'll skip
> the Design Context Q&A."

If the user supplies a path to a filled `ds-inputs.md` (template lives
in `templates/ds-inputs.md`):

1. **Read the template end-to-end** before any other action.
2. **Verify the five Design Context fields** (Sections 1.1, 1.2, 2.1,
   3.1, 3.2) are filled. If any are blank, ask only those — not the
   whole protocol.
3. **Skip straight to the workflow tree** (persona → archetype →
   theme → palette → typography → layout → encoding → anti-pattern
   check → JSON hand-off).
4. The template's Section 5 is your panel inventory. Section 6 is
   your viz-type allow/deny list. Section 7 is your constraints.
   Section 9.1 is your deployment target.
5. **DO** confirm Sections 1.1 (job-to-be-done), 2.1 (archetype), and
   3.1 (tone words) verbally back to the user as a one-line summary
   before generating JSON. This catches misunderstandings cheaply.

If the template is partially filled or absent, fall back to the
Design Context Protocol Q&A below.

## Design Context Protocol — required before ANY design work (Q&A fallback)

Without context, you will produce an averaged-out, generic, AI-flavored dashboard. Code tells you what was built; it cannot tell you who it's for or how it should feel. Only the person requesting the dashboard can tell you that.

**Required context (all five):**

1. **Audience and viewing context** — Who looks at this, where, on what device, for how long, at what time of day? Consult `ds-ref-personas` for pre-defined archetypes; ask the user to map to one or supply a new one.
2. **Job to be done** — What decision or action should this dashboard enable? Not "show security data" — "decide whether to page the on-call at 3am".
3. **Tone / personality** — Three concrete brand words. NOT "modern" or "clean" — those are dead categories. Consult `ds-ref-brand` for tone-word translation rules.
4. **Anti-references** — What should this explicitly NOT look like? Consult `ds-ref-references` for named anti-references.
5. **Brand context** (if applicable) — Brand book, reference URL, logo. Consult `ds-ref-brand` for the discovery rules.

**Refusal pattern:** if any of these is missing, ASK. Do not guess. Do not start designing. The cost of asking is cheap; the cost of regenerating a wrong-archetype dashboard is high.

**Better than Q&A:** if you find yourself needing to ask 4+ Design Context questions in a row, suggest the user fill out `templates/ds-inputs.md` instead. One round-trip beats five.

## Workflow tree

Once Design Context is complete, walk the dashboard through these stages, consulting the named ref at each step:

```
Persona → ds-ref-personas
   ↓
Archetype → ds-ref-archetypes
   ↓
Theme → ds-ref-themes
   ↓
Palette → ds-ref-color
   ↓
Typography → ds-ref-typography
   ↓
Layout / canvas zones → ds-ref-layout-grid
   ↓
Visual encoding (per panel) → ds-ref-visual-encoding + ds-pick-viz
   ↓
Anti-pattern check (slop test, bans) → ds-ref-anti-patterns
   ↓
Hand-off (JSON brief) → ds-create / ds-design
```

## Routing table

| Question / decision | Consult |
|---|---|
| "Who is this for?" | `ds-ref-personas` |
| "Which layout shape?" | `ds-ref-archetypes` |
| "Which colors?" | `ds-ref-color` |
| "Which fonts / sizes / casing?" | `ds-ref-typography` |
| "Where do panels go?" | `ds-ref-layout-grid` |
| "Why this chart vs that?" | `ds-ref-visual-encoding` |
| "Does this pass the Slop Test?" | `ds-ref-anti-patterns` |
| "What's a calibration reference?" | `ds-ref-references` |
| "How do I match the brand?" | `ds-ref-brand` |
| "Light or dark? Both?" | `ds-ref-themes` |
| "Custom icon / SVG / floor plan?" | `ds-svg` |
| "Fully branded/themed dashboard?" | `splunk-viz-packs` plugin (vp-couture) |

## Custom viz packs — the ultimate wow-factor

If the user wants a dashboard that looks like a PRODUCT — not a Splunk
dashboard — they need custom visualizations. No amount of shadow
rectangles, color tuning, or layout polish can overcome the fact that
`splunk.area` and `splunk.table` look like... Splunk.

**When to recommend a viz pack:**
- User names a specific brand: "Disney+", "F1", "our company brand"
- User says "this looks like every other Splunk dashboard"
- User wants franchise-specific colors, logos, branded typography
- User wants interactive hover effects beyond what Studio provides

**Route:** install the `splunk-viz-packs` plugin and invoke
`vp-couture`. It will gather brand context, plan a viz suite, and
produce an installable Splunk app with custom Canvas vizs sharing
one design token system. Every data panel becomes a custom viz —
only markdown, events, rectangles, and images stay built-in.

This is NOT a replacement for ds-couture — it's an escalation.
ds-couture designs the dashboard; vp-couture builds the vizs that
make it branded.

## Designer's eye — critique heuristics

Before hand-off, run the dashboard against these four questions:

1. **The 5-second story** — In 5 seconds, what does this dashboard tell you? If you can't answer, the hierarchy is broken.
2. **Where do your eyes land?** — Trace the path: first, second, third. Does that order match the dashboard's job?
3. **Strip colors test** — If you printed this in pure black-and-white, would the story still come through? If no, color is doing the job that hierarchy or position should be doing.
4. **Slop test** — Would an SRE, SOC analyst, or VP believe an AI made this? Run the formal 13-item gate via `ds-ref-anti-patterns`.

If any answer is bad, loop back through the workflow tree at the relevant step.

## Scope Check — structural completeness gate

Slop Test catches taste bugs (visual hierarchy, palette leak, slop). **Scope Check catches structural completeness.** Both gates must pass before hand-off.

This is a **non-skippable** gate. Every box must be ticked or have an explicit waiver with a written reason. "I forgot" is not a valid waiver. "I dropped this because it doesn't apply to this archetype" with an archetype-specific reason IS a valid waiver.

```
SCOPE CHECK — non-skippable

☐ Layout is `absolute` (NOT grid)?
   Grid layout is never valid in this design system UNLESS the user
   explicitly requested grid. Rectangle depth layers, singlevalueicon,
   and pixel-precise placement all require absolute.
   Grid without explicit user request → automatic reject.

☐ Panel depth treatment considered?
   Default: shadow `splunk.rectangle` behind panel groups. But shadow
   is NOT mandatory for all styles:
   - Executive/editorial → shadow rects (floating cards, depth)
   - Technical/industrial/F1 → panels flush with bg (integrated, dense)
   - SOC wall → thin border stroke, no shadow (maximum density)
   Explicitly state which depth treatment and why.
   Shadow = `splunk.rectangle` with fillColor 2–3 stops brighter than
   canvas, placed BEFORE panels in structure array. Panels on top must
   set explicit backgroundColor.
   Missing shadows without explicit user request → automatic reject.

☐ Drilldowns wired on every entity-displaying panel?
   Entity types: host / IP / user / hash / time-bucket / geo / 
                 technique-id / asset-id / service-name
   "Wall display has no input device" is NOT a valid waiver — wall + 
   analyst console run the same dashboard JSON; drilldowns have zero
   visual cost.
   Explicit waiver required if no, with reason.

☐ Descriptive markdowns above every panel cluster ≥2 panels?
   Section header + 1-line description per zone.
   "No vertical real estate" is a weak waiver — section headers are
   ~50px each, and a 4-zone dashboard loses ~200px out of 1080px.
   Explicit waiver required if no, with reason.

☐ Panel cards consistent (all panels OR no panels)?
   Inconsistent depth treatment ("severity strip has cards, the rest
   sits flat") is WORSE than no depth at all. The strip looks
   intentional; everything else looks loose.
   Inconsistent = automatic reject. No waiver allowed.

☐ Tabs explicitly considered?
   For SOC + ops archetypes, the wall + analyst console are the same
   JSON. Tabs cost zero on the wall (it shows tab 1 only), big value
   on the console.
   "Not considered" = automatic reject.
   "Considered and rejected because [archetype-specific reason]" = OK.

☐ If brand-color collides with status semantics: is brand demoted per
  `ds-ref-brand` Brand-color collision rule?
   Collision without demotion = automatic reject. No waiver allowed.
   Containment-to-band ≥40px is explicitly forbidden.

☐ Footer / runbook link / escalation channel present for ops/SOC
  archetypes?
   New analyst on shift needs: where's the runbook, who do I page,
   which Slack channel?
   Explicit waiver required if no, with reason (executive summaries
   often legitimately don't need this).
```

If any required box is unticked AND has no waiver, hand-off is blocked. The agent must EITHER fix the gap OR write a waiver explaining why this dashboard is the exception. Waivers go in the design brief produced at hand-off, so future audits can find them.

**Why this gate exists:** field experience showed that under context pressure, an agent will rationalize past every soft-rule consultation. ds-ref-anti-patterns has the rules; ds-couture's job is to make sure they're applied. The Scope Check is the structural-completeness equivalent of the Slop Test's taste-completeness.

## Hand-off protocol

When all four critique heuristics pass AND Scope Check passes (every box ticked or waived), produce a brief that downstream skills can act on:

- Archetype name + canvas dimensions
- **Layout: `absolute` (mandatory — grid is never acceptable)**
- **Depth treatment: shadow rects / flush / border stroke (chosen per archetype)**
- Theme variant
- Palette name + accent hex
- Typography stack + scale
- Layout zones with KPI / chart / table positions
- Anti-pattern flags resolved (or explicit deferrals)
- Scope Check status: PASS or PASS-WITH-WAIVERS (list waivers + reasons)

Hand to `ds-create` (for fresh JSON authoring) or `ds-design` (for browser-based wireframing). Both pipeline skills consult `ds-ref-syntax` and the relevant `ds-viz-*` for option-level detail; you don't.

Hand-off is **blocked** if Scope Check fails without waivers. Fix the gap or document the waiver before proceeding.

**Hard gates enforced at hand-off (unless user explicitly overrides):**

1. `layout.type` MUST be `"absolute"`. Grid layout → automatic reject
   unless user explicitly requested grid.
2. Depth treatment MUST be explicitly chosen per archetype: shadow
   rectangles (executive/editorial), flush with bg (technical/racing),
   or border stroke (industrial/SOC). "Not considered" → reject.
3. Every `ds.search` MUST have `options.name` set to a human-readable
   label. "Unnamed" data sources → automatic reject.
4. `xAxisTitleVisibility` MUST be `"hide"` on all timecharts. The
   `_time` label adds no information. The property is NOT
   `showXAxisTitle` — that does not exist in Studio.
5. Time fields — formatting depends on viz type:
   **Tables only:** `| eval _time=strftime(_time, "%Y-%m-%d %H:%M")` — no
   timezone suffix.
   **Charts (area, line, column) — NEVER format `_time`.** These viz
   types require `_time` as epoch. `strftime` converts it to a string
   which kills the x-axis — the chart renders empty. Splunk auto-formats
   epoch time on the x-axis.

**Wow-factor defaults (apply unless the archetype demands restraint):**

6. Canvas background: use `layout.options.backgroundColor` to set the
   base color. Do NOT add low-opacity gradient wash rectangles on top
   of the canvas — they add visual noise without benefit and create a
   washed-out look. If you want depth, use shadow rectangles behind
   panel groups (rule 2) and faux glow (rule 8) on hero elements.
   A solid dark background is better than a muddy gradient wash.
7. Card corner radius: `rx=4-8`, NOT `rx=12+`. Large radii look
   bloated. Reference: Stripe uses rx=6, Linear uses rx=4.
8. Faux glow on hero panels. Use 2-layer low-opacity accent rectangles
   behind the primary panel group. See `ds-ref-layout-grid` "Faux glow"
   section.
9. Color palette MUST include at least one non-semantic accent beyond
   green/yellow/red. Purple (#8b5cf6), teal (#06b6d4), or violet
   (#a78bfa) give dashboards personality.
10. Inline SVG icons via `ds-svg` MUST NOT collide with panel titles.
    Position icons inside the panel body or beside the value, never
    overlapping the title text.
11. `splunk.markdown` MUST NOT contain raw HTML (`<span>`, `<div>`,
    `<style>`). Studio strips/escapes all HTML tags. Use plain markdown
    syntax only: `**bold**`, `*italic*`, headings, lists.
12. `fontSize` on ANY viz is an **enum string**, NEVER a number.
    Valid values: `"extraSmall"`, `"small"`, `"default"`, `"large"`,
    `"extraLarge"`. Setting `"fontSize": 11` or any integer WILL break
    the panel. `fontColor` takes a hex string. `fontFamily` takes one
    of seven allowed values (see `ds-viz-markdown`).
13. `defaults.visualizations.global` MUST NOT contain `options`.
    Studio rejects `defaults.visualizations.global.options` with
    "must NOT have additional properties". The `defaults` block only
    supports `dataSources.global` (for shared query params like
    time range). Set `backgroundColor` per-visualization, not globally.
    When in doubt, leave `defaults: {}` empty.
14. Canvas background color: use `layout.options.backgroundColor`
    (NOT a full-canvas rectangle). This is cleaner and avoids an extra
    viz in the structure:
    `"layout": { "options": { "width": 1920, "height": 1080, "backgroundColor": "#0a1628" } }`
    Reserve gradient rectangles for accent washes only.
15. `splunk.fillergauge` orientation MUST match panel shape.
    Wide panel (w > h) → `"orientation": "horizontal"`.
    Tall panel (h > w) → `"orientation": "vertical"` (default).
    Wrong orientation = gauge fills perpendicular to the panel,
    looking broken.
16. Markdown **section headers** use `fontSize: "default"` or
    `"large"` — NOT `"extraSmall"`. Reserve `"extraSmall"` for subtle
    labels ABOVE KPI values. Section headers like "Alert Status" or
    "Threat Trends" must be readable at a glance. Position section
    header markdowns with 15-20px vertical gap above the panel group
    they describe — not flush against the top.
17. `icon_library.icon_library` panels MUST set
    `"backgroundColor": "transparent"` on the viz level (outside the
    namespace options). Without it, icons render with a dark box
    background that clashes with shadow cards.

These are the design system defaults. Only an explicit user request
overrides them. See `ds-ref-layout-grid` MANDATORY sections.

## Aesthetic flavor — commit to one direction

The Design Context Protocol asks for "tone" as one of the 5 required inputs. Tone words are abstract; aesthetic flavors are committable directions. Pick ONE flavor for the dashboard and let it drive every downstream decision. Mixing flavors produces committee-design.

| Flavor | One-line description | When to use | Splunk archetype pairing |
|---|---|---|---|
| **Brutalist** | Raw, type-heavy, near-monochrome, sharp edges, minimal decoration | Status pages, internal tools, "no-nonsense" infra | operational, status-page |
| **Editorial** | Magazine-grade typography, generous whitespace, restrained accents | Executive summary, board reads, narrative dashboards | executive, business-metrics |
| **Refined** | Polished but understated, tinted neutrals, single accent, professional | Stripe-style — fintech, B2B SaaS, pro tools | analytical, executive |
| **Playful** | Rounded shapes, multiple accents, motion-friendly, personality | Sales/marketing, gamified ops, training dashboards | business-metrics |
| **Industrial** | High-contrast, geometric, dense, accent-saturated, function-first | NOC walls, SOC walls, ops at scale | noc, soc, operational |
| **Luxury** | Heavy serifs, deep blacks, gold/champagne accents, generous spacing | Hospitality, luxury retail, exclusive memberships | executive (rare) |
| **Soft-pastel** | Low-chroma, mid-tone neutrals, friendly accents, low-stakes feel | Healthcare admin, education, public-sector status | status-page, business-metrics |
| **Retro-futuristic** | High-saturation, neon-on-dark, scanline aesthetics, late-80s arcade | SOC walls (with restraint), demo/event dashboards | soc, demo |
| **Organic-natural** | Earth tones, hand-drawn details, asymmetric, warm | Sustainability, ESG, agriculture, environment | business-metrics |
| **Brutally-minimal** | One accent or none, type and space carry everything, no decoration | Vercel-style, monitoring, "the data is the design" | operational, analytical |
| **Maximalist-chaos** | High density, multiple textures, overlapping layers, intentional noise | Editorial / data-journalism, hero dashboards, demos | analytical (rare) |

**Rule:** pick one. Write it in the design brief. Every subsequent decision (palette, typography, layout, density) is filtered by that flavor. Two flavors fighting in the same dashboard = committee design = not sexy.

**Default mappings if user hasn't specified:**

- SOC / NOC wall → industrial
- Executive summary → editorial OR refined
- Operational ops → brutalist OR brutally-minimal
- Analytical → refined OR (rare) maximalist-chaos
- Business metrics → editorial OR playful
- Status page → brutally-minimal OR soft-pastel
- Compliance / forensic → refined

These are starting points, not commands — confirm the flavor with the user before locking it.

## Composition principles — making dashboards pop

Three graphic-design principles that separate "functional" from "wow."
Apply these AFTER selecting archetype and flavor but BEFORE placing
panels. They are non-negotiable unless the archetype explicitly
demands uniformity (rare — only status-page with identical tiles).

### 1. Scale contrast (hero vs. supporting)

**Rule:** One element dominates. Everything else is smaller.

A dashboard where every panel is the same size has no focal point —
the eye wanders and retention drops. Pick ONE hero element per zone
(the biggest number, the most important trend, the primary map) and
give it 1.5–2× the area of supporting panels.

| Pattern | Hero | Supporting | Ratio |
|---|---|---|---|
| KPI strip | One large singlevalue (w=480) | Three smaller (w=280 each) | 1.7× |
| Chart zone | Primary area chart (w=1200, h=420) | Side bar chart (w=680, h=420) | 1.8× area |
| Table zone | Full-width table (h=360) | Compact summary strip (h=120) | 3× height |

**60/40 attention rule:** 60% of visual weight to the hero, 40% to
context. If you squint at the dashboard and everything looks the same
size, hierarchy is broken.

**Anti-pattern:** four equal-width columns of singlevalues. Fix: make
the most critical KPI wider, or pull it out as a standalone hero above
the row.

### 2. Color discipline — one punch color

**Rule:** The fewer the colors, the harder the accent hits.

Most AI-generated dashboards use 4-6 colors distributed uniformly.
This creates visual noise where nothing stands out. Instead:

| Layer | Role | Color treatment |
|---|---|---|
| Canvas + cards | Background | Near-black or dark navy. Single hue. |
| Supporting data | Context | Slate/gray tones only (`#64748B`, `#94A3B8`) |
| Primary metric | Focal point | ONE saturated accent (`#06B6D4`, `#8B5CF6`, `#F59E0B`) |
| Status semantics | Alerts only | Green/yellow/red — reserved for threshold meaning |

**The punch color appears in max 3 places:** the hero KPI value, the
primary chart series, and the faux glow. Everywhere else is neutral.

**Faux glow amplifies punch:** Use the same accent at 0.04-0.08
opacity behind the hero panel group. This makes the accent feel like
it radiates from the most important element.

**Anti-pattern:** rainbow `seriesColors` on a 5-series chart with no
hierarchy. Fix: one accent series in color, rest in gray with 0.4
opacity via `seriesOpacities`.

### 3. Viz-type rhythm — vary the density

**Rule:** Repeating the same viz type creates monotony. Vary density
across zones like a newspaper front page.

A well-composed dashboard has three density layers:

| Zone | Density | Viz types | Character |
|---|---|---|---|
| **Header/KPI** | Sparse — big numbers, lots of air | `singlevalue`, `singlevalueicon`, `fillergauge` | Scannable in 2 seconds |
| **Body/charts** | Medium — focused data story | `area`, `column`, `line`, `choropleth` | 5-15 second engagement |
| **Detail/table** | Dense — reference data | `table` with heatmap rows, `events` | 30+ second drill-down |

**Rhythm principle:** if you have 6 panels vertically, avoid
six-of-the-same. Ideal sequence: `icon strip` → `markdown header` →
`wide area chart` → `markdown header` → `3-column KPI group` →
`table`. Each zone has its own visual texture.

**Anti-pattern:** five column charts stacked vertically with the same
height. Fix: consolidate into one multi-series chart, replace others
with a KPI strip summarizing the key insight, and add a detail table.

### Applying these principles

At the **Layout / canvas zones** step in the workflow tree:

1. **Identify the hero** per zone — what's the single most important
   thing? Give it 1.5-2× scale.
2. **Count your colors** — if more than 1 accent + gray + status RAG,
   you have too many. Cut.
3. **Audit viz variety** — if any viz type repeats 3+ times in a row,
   the dashboard needs rhythm. Replace middle occurrences with a
   different density layer.

These checks are part of the Designer's Eye critique heuristics. The
"5-second story" test fails if scale contrast is missing. The "strip
colors test" fails if too many accents compete.

## What this skill DOES NOT do

- Specific palette tables → `ds-ref-color`
- Typography rules → `ds-ref-typography`
- Layout math → `ds-ref-layout-grid`
- Brand discovery procedures → `ds-ref-brand`
- Persona definitions → `ds-ref-personas`
- Reference examples → `ds-ref-references`
- Anti-pattern catalog → `ds-ref-anti-patterns`
- Theme parity rules → `ds-ref-themes`
- Visual encoding theory → `ds-ref-visual-encoding`
- Archetype details → `ds-ref-archetypes`
- JSON writing → `ds-create`
- Wireframe editing → `ds-design`
- SPL → `spl-gotchas` (from `splunk-spl` plugin)
