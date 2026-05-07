# splunk-dashboard-studio

A Claude Code / Cursor plugin for guided authoring of Splunk Dashboard Studio (v2) dashboards.

**Version:** 3.1.1

It ships three layers:

1. **A pipeline** of action skills that walk a project from scope to deployed dashboard.
2. **A granular reference library** with one skill per visualization, one per interactivity concept, plus router, design-principles, and JSON-schema references.
3. **A design-first companion** (`ds-couture`) with composition principles, design scoring, and anti-AI checklist.

## Skill layout

Skills live flat under `skills/<name>/SKILL.md`. The prefix indicates the family:

```
skills/
  ds-init                    pipeline · scope a new dashboard project
  ds-data-explore            pipeline · discover real Splunk data, draft SPL per question
  ds-mock                    pipeline · generate inline synthetic data
  ds-design                  pipeline · browser-based wireframe editor (Gridstack)
  ds-create                  pipeline · generate dashboard.json from layout + data sources
  ds-validate                pipeline · lint dashboard.json (tokens, bindings, drilldown targets)
  ds-deploy                  pipeline · wrap dashboard.json in a Splunk TA tarball or write XML
  ds-review                  pipeline · audit a dashboard against authoring best practices
  ds-update                  pipeline · apply natural-language change requests
  ds-critique                pipeline · UX critique with persona-based testing
  ds-polish                  pipeline · final pre-ship pass (alignment, spacing, consistency)

  ds-couture                 design orchestrator · Design Context Protocol + archetype + scoring
  ds-svg                     SVG generator · custom icons, logos, choropleth canvases
  ds-pick-viz                router · from intent ("trend over time") to viz type

  ds-viz-singlevalue         visualization · one per viz type (25 total)
  ds-viz-singlevalueicon     ds-viz-singlevalueradial
  ds-viz-line                ds-viz-area                ds-viz-column
  ds-viz-bar                 ds-viz-pie                 ds-viz-table
  ds-viz-choropleth-svg      ds-viz-map
  ds-viz-sankey              ds-viz-markergauge         ds-viz-fillergauge
  ds-viz-punchcard           ds-viz-linkgraph           ds-viz-parallelcoordinates
  ds-viz-scatter             ds-viz-bubble              ds-viz-timeline
  ds-viz-events              ds-viz-markdown            ds-viz-image
  ds-viz-rectangle           ds-viz-ellipse
  ds-viz-icon-library        ds-viz-infographic-shapes

  ds-int-tokens              interactivity · $token$ syntax, filters, resolution
  ds-int-inputs              interactivity · time picker, dropdown, multiselect, text
  ds-int-drilldowns          interactivity · click handlers, setToken, linkToDashboard
  ds-int-tabs                interactivity · tabbed layout structure
  ds-int-visibility          interactivity · conditional show/hide
  ds-int-defaults            interactivity · global ds + viz defaults

  ds-ref-syntax              reference · Dashboard Studio JSON schema + DOS
  ds-ref-design-principles   reference · entry-point index for 10 ds-ref-* skills
  ds-ref-pitfalls            reference · cross-viz pitfalls matrix
  ds-ref-archetypes          reference · 4 canonical dashboard layouts
  ds-ref-color               reference · OKLCH, palettes, semantic vs series
  ds-ref-typography          reference · font pairings, type scales, number formatting
  ds-ref-layout-grid         reference · 1920×1080 minimum, grid math, zones
  ds-ref-visual-encoding     reference · chart selection, Tufte data-ink ratio
  ds-ref-anti-patterns       reference · AI slop catalog, absolute bans, Slop Test
  ds-ref-personas            reference · CISO, SOC operator, NOC engineer, Sales VP
  ds-ref-references          reference · NYT, Stripe, Linear — calibration targets
  ds-ref-brand               reference · brand discovery, tone-word translation
  ds-ref-themes              reference · light/dark parity, OKLCH adjustments
```

## Pipeline

`Scope → Data → Design → Build → Ship → Iterate`

Pipeline skills carry **MUST-LOAD blocks** that route to the right content skill before JSON is written.

## Key rules (hard defaults in ds-create)

0. Canvas minimum: **1920 × 1080 px**
1. `xAxisTitleVisibility: "hide"` on all chart vizs
2. `strftime` on `_time` only in tables, never charts
3. Canvas background with gradient rectangle
4. Card `rx` must be 4-8 (not 12+)
6. `fontFamily` on markdown: only 7 allowed values
7. `fontSize` on markdown: only 5 enum values
8. Markdown panels sized to avoid scrollbars
9. `backgroundColor: transparent` on icon_library panels

## Composition principles (ds-couture)

1. Scale contrast — hero 1.5-2× supporting
2. Color discipline — one punch color (60-30-10)
3. Viz-type rhythm — sparse/medium/dense layering
4. Hero image as background — dimming overlay + vignette + floating panels
5. No solid-color banners — gradient, pattern, or image instead
6. Intentional asymmetry — 60/40, rule of thirds

## Anti-patterns (ds-ref-anti-patterns)

1. Status colors as series colors
2. Red/green as sole differentiator
3. Pie >6 slices
4. Searches without earliest/latest
5. Inputs without defaultValue
6. Solid-color banners
7. 50/50 symmetric panels
8. Uniform spacing everywhere

## Dependencies

| Plugin | Required? |
|---|---|
| `splunk-spl` | Required — SPL in data sources |
| `icon_library` Splunk app | Optional — Material Symbols icons |
| `infographic_shapes` Splunk app | Optional — gradient shapes |

## Versioning

- `2.6.1` — skills flattened, ds-couture + ds-svg added, visual QA confirmed
- `3.0.0` — renamed from `splunk-dashboards` to `splunk-dashboard-studio`
- `3.0.1` — 1920×1080 minimum enforced
- `3.0.2` — fontFamily + fontSize strict schema rules
- `3.1.0` — design scoring (4 dimensions), anti-AI checklist (11 tells), composition §5-6
- `3.1.1` — markdown panel sizing, no scrollbar rule
