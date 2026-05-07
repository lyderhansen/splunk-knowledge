---
name: vp-init
description: "Entry point for the splunk-viz-packs plugin. Routes the user to the right skill based on intent: vp-couture for design-first themed viz suites, vp-create for scaffolding, vp-viz for single viz builds, vp-ref-gotchas for rules lookup. Use when the user says 'build custom vizs', 'themed viz pack', 'custom Splunk visualization', or invokes splunk-viz-packs without a specific skill."
---

# vp-init — Entry point for custom viz packs

## What this plugin does

Builds **themed Splunk custom visualization apps** — branded Canvas 2D
vizs sharing one design token system, packaged as installable Splunk
apps (.tar.gz).

**Input:** brand context (palette, fonts, tone) + domain (F1, SOC,
healthcare, retail)

**Output:** tarball with 5-8 custom vizs, shared theme.js, dashboard
with hero image, webpack build, AppInspect-ready packaging

## Quick brief template

For structured input, point the user to `templates/viz-pack-brief.md`.
It covers brand, domain, metrics, viz preferences, and constraints.
Or use the minimal version:

```
Build a viz pack for [BRAND].
Theme: [dark/light].
Data: [what the dashboard shows].
Key metrics: [3-5 metrics with types].
Style: [3 tone words].
```

## Routing table

| User says | Route to | Why |
|---|---|---|
| "Build a themed viz pack for [brand]" | `vp-couture` | Design-first: brand research → palette → viz inventory → build |
| "Make my dashboard look like [brand]" | `vp-couture` | Same — needs design context before code |
| "Which vizs should I build for [domain]?" | `vp-couture` | Planning question → design orchestrator |
| "Scaffold a viz app called X" | `vp-create` | Structure only, no design |
| "Build a single [kpi/gauge/chart] viz" | `vp-viz` | One viz, no suite planning |
| "What are the rules for custom vizs?" | `vp-ref-gotchas` | Reference lookup |
| "How do I draw X on Canvas?" | `vp-ref-patterns` | Recipe lookup |

## Quick start — recommended flow

```
vp-init (you are here)
   ↓
vp-couture — design brief (brand, palette, viz inventory)
   ↓
vp-create — scaffold app directory + theme.js + webpack
   ↓
vp-viz — write each visualization_source.js
   ↓
vp-create — build + package tarball
```

**Always load `vp-ref-gotchas` before writing ANY viz code.**

## Model selection

| Task | Model | Why |
|---|---|---|
| Brand research, design decisions, palette selection | **Opus** | Judgment, creativity, taste |
| Design brief, viz inventory planning | **Opus** | Strategic decisions |
| Design critique, quality gate review | **Opus** | Evaluative reasoning |
| Writing visualization_source.js | **Sonnet** | Fast, reliable code generation |
| Writing formatter.html, CSS, conf files | **Sonnet** | Mechanical, well-specified |
| Webpack build, packaging, file operations | **Sonnet** | Execution, not judgment |
| Dashboard JSON layout | **Sonnet** | Structured output |
| CSV lookup data generation | **Sonnet** | Data creation |

**Default:** Opus plans, Sonnet builds. When dispatching subagents,
use `model: "sonnet"` for implementation tasks and `model: "opus"`
for design/review tasks.

## Prerequisites

| Dependency | Required? | Why |
|---|---|---|
| `splunk-spl` plugin | Required | SPL in savedsearches.conf and dashboard data sources |
| `splunk-dashboard-studio` plugin | Recommended | Dashboard JSON schema (ds-ref-syntax), viz type reference (ds-viz-*) |
| `icon_library` Splunk app | Optional | Material Symbols icons in dashboards |
| `infographic_shapes` Splunk app | Optional | Gradient shapes, progress bars, glow effects |

## What this skill does NOT do

This is a router. It does not write code, generate designs, or
produce artifacts. It identifies intent and hands off to the
right skill.

| Task | Skill |
|---|---|
| Design a themed viz suite | `vp-couture` |
| Scaffold app structure | `vp-create` |
| Write a single viz | `vp-viz` |
| Canvas rendering recipes | `vp-ref-patterns` |
| Hard rules and gotchas | `vp-ref-gotchas` |
| Dashboard JSON | `ds-create` (from `splunk-dashboard-studio`) |
| SPL queries | `spl-gotchas` (from `splunk-spl`) |
