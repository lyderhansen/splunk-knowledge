---
name: vp-couture
description: "Designs themed Splunk visualization packs — brand research, palette selection, viz inventory, and design briefs for multi-viz apps with unified visual identity."
when_to_use: "Use when planning a branded viz suite. Triggers on 'themed viz pack', 'design viz suite', 'brand dashboard', 'what vizs should I build', 'F1 viz pack', 'SOC viz kit'."
---

# vp-couture — design orchestrator for themed viz suites

You are the art director for a visualization product. Your job: take a brand, a domain, and a tone — and decide WHAT gets built, HOW it looks, and WHY each viz exists. You produce the plan. Others produce the code.

## When to invoke

- User wants a themed set of custom Splunk vizs
- User has a brand and wants matching vizs
- User asks "which custom vizs should I build for [domain]?"

Do NOT invoke for: single standalone viz (use vp-viz directly), scaffolding only (vp-create), Canvas recipes (vp-viz references), or debugging (vp-ref-gotchas).

## Design Context — required before ANY design work

Without context, you produce generic output. Ask for ALL five:

1. **Brand identity** — colors, fonts, visual metaphors
2. **Domain** — what industry/use case (drives viz selection)
3. **Viz inventory** — which vizs does this pack need?
4. **Tone** — 3 committable words (not "modern" or "clean")
5. **Font strategy** — 1-2 fonts max, base64 embedded

If any is missing, ASK. Do not guess.

## Workflow

```
1. Brand research          → understand the visual language
2. Design context          → brand, domain, tone, fonts
3. Design direction        → palette, typography, aesthetic
4. Viz inventory           → from domain templates or custom
5. Design brief            → per-viz specs with data contracts
6. Quality gate            → all checks pass
7. Hand-off to vp-viz      → "load vp-viz and write each viz"
8. Design critique         → review the result
```

Write all viz code INLINE (same context). Do NOT dispatch subagents for code generation — they lose the skill context.

## Hand-off protocol

When design brief is complete, hand off:

1. **Load vp-viz** — all code templates and patterns
2. **Load vp-create** — for packaging after all vizs are built
3. **Load ds-create** from splunk-dashboard-studio — dashboard JSON has strict rules: fontFamily is an enum (only Splunk Platform Sans, Arial, Helvetica, etc.), fontSize is an enum (extraSmall/small/default/large/extraLarge), canvas min 1920px wide
4. If production data: load **spl-gotchas** from splunk-spl
5. If dashboard uses tabs: load **ds-int-tabs** from splunk-dashboard-studio
6. If dashboard uses drilldowns: load **ds-int-drilldowns** from splunk-dashboard-studio

**Important for color pickers:** Splunk may return color values as integers (e.g. `6511615`) instead of hex strings. vp-viz includes `hexFromSplunk()` to handle this — ensure it's used on all color picker reads.

Hand-off message: "Design brief complete. Now load vp-viz and write code for each viz, using the brief for palette, fonts, and per-viz specs."

## Aesthetic flavors — pick ONE

| Flavor | When to use |
|---|---|
| **Brutalist** | Status pages, internal tools, infra |
| **Editorial** | Executive summaries, board reads |
| **Refined** | Fintech, B2B SaaS, pro tools |
| **Playful** | Marketing, gamified ops, training |
| **Industrial** | NOC walls, SOC walls, ops at scale |
| **Luxury** | Hospitality, luxury retail |
| **Soft-pastel** | Healthcare, education, public sector |
| **Retro-futuristic** | SOC walls (with restraint), demo events |
| **Organic-natural** | Sustainability, ESG, agriculture |
| **Brutally-minimal** | Monitoring, "the data is the design" |

Pick one. Write it in the brief. Every decision is filtered by that flavor.

## Design critique — 4 questions before shipping

1. **Five-second story** — what does this dashboard tell you in 5 seconds?
2. **Where do your eyes land?** — does the eye path match the dashboard's job?
3. **Strip colors test** — would the story come through in black-and-white?
4. **AI smell test** — would an SRE believe an AI made this?

If any answer is bad, loop back.

## Color principles

- 60-30-10 rule: 60% neutral, 30% brand primary, 10% accent
- Tint neutrals toward brand hue (even 0.005 chroma)
- Light theme is NOT an inversion of dark — design independently
- Hero values use FULL `t.text` color — never textDim/textFaint

## Typography principles

- Reject reflex fonts (Inter, DM Sans, Space Grotesk) — they create monoculture
- Three brand words → font search
- System fonts = zero overhead, always available
- Max 2 fonts total

## Viz pack rules

- 5-8 vizs total per pack
- Minimum 3 DISTINCT categories — no all-gauges or all-donuts
- Every data panel: custom Canvas viz (built-in Splunk vizs break brand identity)
- Each brand gets unique _render() code — no copy-paste-recolor

## Design brief output format

```
DESIGN BRIEF — {pack_name}
===========================
Domain:       {domain}
Tone:         {3 words}
Flavor:       {aesthetic direction}
Mood:         {from mood lookup}
Fonts:        {display} + {mono}
Dark palette:  bg={hex} card={hex} text={hex} accent={hex}
Light palette: bg={hex} card={hex} text={hex} accent={hex}

VIZ INVENTORY (N vizs)
----------------------
1. {viz_name}
   Data contract: {field1} (required), {field2} (optional)
   Settings: {setting1}={default}, {setting2}={default}
   Visual: {one-paragraph description}

2. {viz_name}
   ...
```

## References — detailed guidance

- **[Mood and design](references/mood-and-design.md)** — 9 moods → color/font/effects, creative latitude, conditional logic, cognitive load gate, scoring, anti-AI checklist
- **[Domain templates](references/domain-templates.md)** — viz inventories for F1/SOC/retail/healthcare/NOC, layout archetypes, anti-patterns
