---
name: ds-ref-design-principles
description: Entry-point index for Splunk Dashboard Studio design references. Routes to the 10 specialized ds-ref-* skills covering archetypes, color, typography, layout-grid, visual-encoding, anti-patterns, personas, references, brand, and themes. Kept as an entry-point because external prompts and legacy invocations reach for "design-principles" by name. Use when a generic design question lands and you need to route to the right specialized reference.
---

# ds-ref-design-principles — design references index

## Stance reminder

A Splunk dashboard is not a report. It is a live surface that an
operator, analyst, or executive scans under time pressure. Every pixel
either earns its place or steals attention from the one that should
have had it.

The default output of any generative tool — including Claude — is
generic. That output passes a demo and fails a shift. The references
linked below exist to refuse it.

## Index — consult this skill when X

| When you need... | Consult |
|---|---|
| The four canonical archetypes (executive, operational, analytical, SOC) | `ds-ref-archetypes` |
| Color palettes, OKLCH, contrast tables, colorblind safety | `ds-ref-color` |
| Font pairings, type scale, casing, number formatting | `ds-ref-typography` |
| 4pt grid, F-pattern, hero KPI sizing, gutters, depth | `ds-ref-layout-grid` |
| Chart-selection rationale, encoding channels, Tufte data-ink | `ds-ref-visual-encoding` |
| Reflex defaults, absolute bans, the Slop Test | `ds-ref-anti-patterns` |
| Audience personas (CISO, SOC operator, NOC, exec, etc.) | `ds-ref-personas` |
| Best-in-class references and anti-references | `ds-ref-references` |
| Brand discovery (color extraction, tone words, fallbacks) | `ds-ref-brand` |
| Light vs dark theme parity, OKLCH rules, decision tree | `ds-ref-themes` |

## When in doubt, start here

If a prompt asks an open-ended design question ("what should my
dashboard look like?", "which chart for X?", "is this dashboard
slop?") and no specific ref is obviously right, scan the table above
and pick the closest match. Most questions resolve to one or two refs.

For the full design workflow (audience → archetype → palette →
typography → layout → encoding → anti-pattern check → hand-off), use
`ds-couture` rather than this skill. `ds-couture` is the orchestrator;
this is the index.
