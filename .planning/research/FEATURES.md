# Feature Landscape: v5.1.0 Viz Hardening & Dashboard Wow-Factor

**Domain:** Splunk Dashboard Studio — branded Canvas 2D custom visualization packs
**Researched:** 2026-05-18
**Sources:** PROJECT.md (v5.1.0 target features), REQUIREMENTS.md, ROADMAP.md,
vp-viz/references/viz-blueprints.md, vp-design/references/*, ds-ref-archetypes,
ds-ref-layout-grid, ds-ref-anti-patterns, ds-ref-color, ds-couture

---

## Context: What Ships vs What's Broken

v5.0.0 shipped design principles (Phase 6), design quality gates (Phase 8), and
animation recipes (Phase 9). Phase 7 (generation quality / theme parity) is also
marked complete in ROADMAP.md. The milestone target for v5.1.0 is three things:

1. **Bug fixes** found in test29 — entrance-animation-off breaks gauge; zone color /
   hover toggle / accentIntensity wiring bugs; flashCritical LED not visually prominent
2. **Settings gaps** — pagination controls, text placement, sparkline controls, flexible
   status values (not just "ok"/"warning"/"critical")
3. **New capability** — dashboard composition story/depth/background/professional layout,
   creative freedom in KPI viz design, unique preview.png per viz

---

## Table Stakes

Features users expect from this domain. Missing any of these means the generated output
is not usable or not professional.

### Category 1: Dashboard Composition

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Background color set explicitly | Default Splunk canvas = grey = "untouched AI output". Every professional dashboard has an explicit backgroundColor. | Low | Absolute must — no-bgcolor is slop reflex #3 in ds-ref-anti-patterns |
| Shadow rectangles behind panel groups | Dashboard Studio has no box-shadow. Depth requires `splunk.rectangle` layers BEHIND panels in structure order. Without them, everything looks flat. | Low | Already documented in ds-ref-layout-grid; auto-generation must emit them |
| Asymmetric column widths (60/40 or 70/30) | 50/50 symmetric panels = spreadsheet, not dashboard. The primary side must be wider. | Low | Absolute ban in ds-ref-anti-patterns; auto-generation must pick asymmetry |
| Visual hierarchy in KPI row (anchor hero) | A flat row of 4 identical-sized KPIs has no focal point. One KPI must be 1.5x the others. | Low | Slop reflex #2 in ds-ref-anti-patterns |
| Archetype commitment (not auto-template) | "4 KPIs + 1 line + 1 table" is the LLM default. SOC, executive, operational, analytical each have distinct compositions. | Medium | ds-ref-archetypes has the 4 patterns with ASCII layouts |
| F-pattern reading flow | Top-left = most important. The primary KPI / hero metric must be positioned top-left, not centered. | Low | ds-ref-layout-grid: F-pattern is the first layout principle |
| Time-bounded searches | Unbounded full-index scans as default for demo data makes dashboards slow. | Low | Absolute ban #4 in ds-ref-anti-patterns |
| Panel titles 40 chars max, Title Case | Long panel titles wrap and break layout. All-caps panel titles read as machine-generated. | Low | Slop Test item in ds-ref-anti-patterns |

### Category 2: Viz Formatter Settings Completeness

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Entrance animation OFF does not break rendering | Toggling showEntrance=false must not corrupt a gauge or any other viz. This is a live bug. | Medium | Cited in PROJECT.md v5.1.0 target features |
| Zone color + hover toggle + accentIntensity wiring | Settings that exist in the formatter but do nothing in JS feel broken. Users discover these immediately. | Medium | Wiring bugs confirmed in test29 per PROJECT.md |
| accentIntensity (0-100) actually scales glow | A setting that claims to control intensity but produces identical output at 10 vs 90 is worthless. | Medium | CFG-06 requirement; wiring confirmed as broken |
| Flexible status field values | Status chip/badge hard-coded to "ok"/"warning"/"critical" breaks when data returns "active"/"inactive" or numeric severities. | Medium | Cited in PROJECT.md v5.1.0 — "flexible status values" |
| Pagination formatter control for tables | Tables without pagination controls force the user to edit JS. A maxRows setting must control rows-per-page. | Low | Already in viz-blueprints.md Data Table spec; gap is that it is not always generated |
| Sparkline controls | Spark Strip has sparkHeight, showArea settings but no control over line smoothing or fill opacity. | Low | Cited in PROJECT.md v5.1.0 — "sparkline controls" |
| Text placement settings for KPI | Label position (above/below/beside value), unit position (after/superscript/suppressed). Users expect these to be configurable. | Low | viz-blueprints.md KPI has unitPosition but generation skips it |
| themeMode default is "auto" | Any viz shipping with themeMode default="dark" fails on light dashboards. | Low | B20 rule already enforced by validate_viz.sh; must be correct at generation time |

### Category 3: Creative Viz Design

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| KPI viz is not just "big number centered" | Every AI-generated KPI is identical. Users who have seen DataDrivers-quality work expect branded creativity. | Medium | PROJECT.md: "loosen viz blueprints — creative freedom over rigid templates, especially KPI" |
| Gradient fills on all data elements | Flat solid fills look unfinished. Users expect gradients on bars, arcs, and panel fills. | Low | DPR-03 requirement already codified; gap is enforcement and generation discipline |
| flashCritical LED pulse visually prominent | A "critical alert" effect that produces a barely-visible flicker is worse than nothing. | Medium | PROJECT.md: "make flashCritical LED pulse visually prominent" |
| Unique preview.png per viz | When 4 vizs in a pack share the same placeholder silhouette, the pack looks unfinished in the Splunk app browser. | Low | PROJECT.md: "generate unique preview.png per viz (no duplicates)" |

---

## Differentiators

Features not expected, but that significantly raise the bar above comparable outputs.

### Category 1: Dashboard Composition Story

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Gradient background wash (canvas-level depth) | Flat black / flat white canvas reads as "default". A 2-3 layer gradient wash (accent color at 0.04 opacity + brand tint at 0.08) adds immediate depth without distracting from data. | Low | ds-ref-layout-grid "Gradient background" recipe is already written with exact JSON; gap is auto-generation not emitting it |
| Faux glow on panel groups (stacked rects) | 2-3 rectangles at decreasing opacity behind a card simulate soft shadow. Makes panels feel lifted off the canvas — the Vercel / Linear feel. | Low | ds-ref-layout-grid "Faux glow" recipe is documented with exact JSON; gap is auto-generation |
| Story-first layout (one question per zone) | A professionally composed dashboard answers one question per visual zone. Each zone has a heading, not just panels floating in space. | High | Requires vp-init to capture "primary question" and vp-design to structure zones around it |
| Zone dividers (section labels via rectangle + markdown) | Operators on a busy NOC do not read panel titles — they read zone headers. A thin horizontal rectangle with a markdown label ("Service Health", "Recent Incidents") zones the canvas clearly. | Medium | Requires generating splunk.rectangle + splunk.markdown pairs per section |
| Background accent wash derived from brand palette | The gradient wash uses the brand accent color, not a generic dark blue. Makes the canvas feel brand-specific instead of Splunk-generic. | Low | Requires reading brand accent from vp-design Visual Language output before emitting dashboard JSON |

### Category 2: Viz Design Depth

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| KPI creative variants (badge, progress, streak, delta card) | The same data can be a counter, a progress bar with target, a win-streak indicator, or a delta card with directional arrow. Brand-appropriate variant selection dramatically raises wow-factor. | High | viz-blueprints.md already lists KPI creative decisions; gap is Claude defaulting to centered number instead of choosing among them |
| Brand-specific arc sweep angle for gauges | F1 expects 270-degree sweeps. Healthcare expects 180-degree semicircles. Gauge arc angle should follow brand personality. | Low | Already a creative decision in viz-blueprints.md Ring Gauge; gap is generation defaulting to one shape |
| Glass panel effect on Luxury / Futuristic mood | Semi-transparent fill with a highlight edge on the panel background. Visually distinctive from flat panels. | Medium | DPR-06 requirement already codified in design-principles.md; gap is conditional application by mood |
| Domain-appropriate viz inventory | A security pack should default to threat gauge + kill chain flow + severity grid + alert ticker. A retail pack: revenue gauge + conversion funnel + category ring + live ticker. | Medium | domain-templates.md in vp-design/references/ already has F1, SOC, Retail, Healthcare, NOC inventories; gap is vp-design not consulting them |

### Category 3: Formatter Design Quality

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 3-section formatter structure (Data, Appearance, Interaction) | A flat list of 10-14 options is hard to navigate. Section-labels with logical grouping make the formatter feel professional. | Low | DQG-05 requires 3+ section-labels; formatter-patterns.md has the pattern; gap is generation |
| Bidirectional formatter-to-JS wiring | Every formatter option must be read in the JS and every JS opt() call must have a formatter control. Dead controls make settings feel broken. | Medium | DQG-08 already a check; gap is wiring being incomplete when generated |
| Accent color preset swatches | The accentColor picker with 3-5 brand-appropriate preset swatches lets users quickly try alternatives without typing hex codes. | Low | formatter-patterns.md color picker supports splunk-color swatches; gap is generation not populating them |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Dashboard grid layout ("type": "grid") | splunk.rectangle depth cards and splunk.singlevalueicon silently fail in grid layout. Absolute layout is the only mode that supports the full design system. | Always emit "type": "absolute" with explicit x/y/w/h per ds-ref-layout-grid |
| fontColor / bgColor as formatter controls | Dashboard Studio owns panel-level colors. A viz formatter color picker for background color fights the dashboard theme. | accentColor is the only color formatter control per formatter-patterns.md D-03 rule |
| 4 identical-size KPI tiles without hierarchy | No visual anchor. The eye has nowhere to go. | One hero KPI (1.5x size) + supporting KPIs; use semantic polarity for status vs informational |
| Same preview.png silhouette for all vizs in a pack | Looks unfinished in Splunk's app browser. Erodes trust before the viz is even used. | generate_assets.js already has per-viz-type silhouette generation — must be called with viz-type parameter, not a generic shape |
| Entrance animation that corrupts gauge state | showEntrance=false must be a clean no-op. A broken animation is worse than no animation. | Guard with if (!opt('showEntrance', 'true')) before the animation entry point; render directly at final state |
| Status values hard-coded to "ok"/"warning"/"critical" | Splunk data varies enormously. "active"/"inactive", "1"/"2"/"3", "healthy"/"degraded"/"down" are all common. | statusOkValues, statusWarningValues, statusCriticalValues as comma-separated formatter inputs |
| Pie chart with >6 slices | Slice angles below ~30 degrees are indistinguishable. | Sorted horizontal bar chart or aggregate to Top 5 + "Other" in SPL |
| Dashboard JSON without canvas backgroundColor | Default Splunk canvas grey reads as "untouched AI output". | Always set layout.options.backgroundColor per ds-ref-anti-patterns absolute ban list |
| 50/50 symmetric column layout | Mechanical, feels like a spreadsheet. No visual hierarchy. | 60/40 or 70/30 asymmetry; primary panel always wider |
| Solid-color rectangle as dashboard header banner | Flat single-color rectangle banner reads as PowerPoint 2010. | Use gradient (2-3 stops at low opacity), a brand image, or no banner at all |

---

## Feature Dependencies

```
Dashboard composition with depth →
  Requires: vp-init Q7 (dashboard included?) answered YES
  Requires: brand accent color known (from vp-design Visual Language output)
  Requires: archetype chosen (executive / operational / analytical / SOC)
  Unlocks: gradient background wash, faux glow, zone dividers, shadow rects

Entrance animation fix (animation OFF does not break gauge) →
  Requires: animation-recipes.md lifecycle section (Phase 9 complete)
  Pattern: guard showEntrance check at render entry, render at final state when false

flashCritical LED pulse prominence →
  Requires: animation-recipes.md LED pulse recipe (Phase 9 complete)
  Fix: increase shadowBlur range (current 4-12 too subtle); use brand accent color for glow

Flexible status values →
  Requires: formatter-patterns.md text input template (exists)
  Requires: viz-blueprints.md Status Chip settings list to replace hard-coded labels
  Blocks: any viz using statusField until resolved

Unique preview.png per viz →
  Requires: generate_assets.js per-viz-type silhouette rendering (exists in vp-create)
  Fix: ensure each viz type maps to a distinct shape in the generator

3-section formatter structure →
  Requires: formatter-patterns.md section wrapper template (exists)
  Requires: generation step in vp-viz SKILL.md to group options into Data / Appearance / Interaction

Domain-appropriate viz inventory →
  Requires: domain-templates.md (exists in vp-design/references/)
  Requires: vp-design SKILL.md to consult domain-templates.md before choosing types

KPI creative variants →
  Requires: viz-blueprints.md KPI "Creative decisions YOU make" section (exists)
  Fix: remove implicit default from generation instructions; force explicit choice among variants
```

---

## MVP Recommendation

**P0 — Bugs (break trust immediately):**

1. Fix entrance-animation-off breaking gauge rendering — users who turn off animation get a broken viz
2. Fix zone color / accentIntensity / hover toggle wiring — settings that do nothing break the formatter UX
3. Fix flashCritical to be visually prominent — a "critical alert" effect that barely flickers is worse than nothing

**P1 — Table stakes (completeness gaps):**

4. Flexible status values (comma-separated formatter inputs for ok/warning/critical label matching)
5. Dashboard composition: explicit backgroundColor + shadow rectangles + asymmetric column layout — the three changes that most visibly separate professional from AI-generated
6. Unique preview.png silhouettes per viz type

**P2 — Differentiators (wow factor):**

7. KPI creative variants — loosen viz-blueprints.md so Claude must choose a treatment, not default to centered number
8. Gradient background wash in auto-generated dashboard JSON
9. Zone labels (splunk.rectangle + splunk.markdown pairs) in generated dashboard
10. Brand-specific arc sweep angle for gauges driven by mood

**Defer to v5.2.0:**

- Glass panel effect on Luxury/Futuristic mood: medium complexity, already in recipe files, can be applied manually in the interim
- Domain viz inventory auto-selection: high value but requires vp-design prompt changes with uncertain scope
- sparkline fill opacity granularity: low user impact relative to bugs above
- Story-first zone layout: high complexity, requires new vp-init question and layout generation logic

---

## User Expectations by Persona

### The Brand Designer receiving the pack

Expects: "I can display this on a screen next to our brand guidelines and it will not be embarrassing."
Sees first: the generated preview PNGs in the Splunk app browser.
Deal-breaker: identical preview images, flat unbranded panel colors, no visual depth.

### The Splunk Admin installing the pack

Expects: "It installs without errors and the formatter options actually do something."
Sees first: the formatter sidebar when configuring a viz.
Deal-breaker: settings that produce no visible change (accentIntensity slider changes nothing), animation breaking the render on toggle-off.

### The SOC Operator using the dashboard

Expects: "I can read this from 3 meters away at 2am and know immediately what is wrong."
Sees first: the primary KPI zone in the top-left.
Deal-breaker: all panels the same size and weight, no semantic color discipline, status colors leaking into series charts.

### The Executive reviewing the dashboard

Expects: "This looks designed, not auto-generated."
Sees first: the overall composition — does it have depth, does it tell a story.
Deal-breaker: default grey canvas, uniform panel grid, 4 identical KPI tiles with no hierarchy.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Bug list (what is broken) | HIGH | Explicitly listed in PROJECT.md v5.1.0 target features |
| Table stakes for viz formatter settings | HIGH | Derived directly from viz-blueprints.md + formatter-patterns.md + REQUIREMENTS.md |
| Dashboard composition table stakes | HIGH | Sourced from ds-ref-anti-patterns, ds-ref-layout-grid, ds-ref-archetypes — these encode real Splunk production patterns |
| Creative differentiators | MEDIUM | Based on domain-templates.md and mood-and-design.md patterns; reference bar is DataDrivers F1 app cited in PROJECT.md |
| Priority ordering | MEDIUM | Based on impact/complexity judgment; actual user pain ranking from test29 session notes would sharpen P1/P2 boundary |
