# splunk-dashboards

A Claude Code / Cursor plugin for guided authoring of Splunk Dashboard Studio (v2) dashboards.

It ships three layers:

1. **A pipeline** of action skills that walk a project from scope to deployed dashboard.
2. **A granular reference library** with one skill per visualization, one per interactivity concept, plus router, design-principles, and JSON-schema references. The skill loader picks the smallest skill that matches the current task, so no context is wasted on irrelevant docs.
3. **A design-first companion** (`ds-couture`) and **an SPL grammar reference** (`ds-spl`) that pipeline skills route into via MUST-LOAD blocks before generating JSON.

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

  ds-couture                 design-first companion · Design Context Protocol + archetype + restraint
  ds-spl                     SPL grammar reference · eval / stats / where / rex / tstats / lookups

  ds-pick-viz                router · from intent ("trend over time") to viz type

  ds-viz-singlevalue         visualization · one per viz type (25 total)
  ds-viz-singlevalueicon
  ds-viz-singlevalueradial
  ds-viz-line                ds-viz-area                ds-viz-column
  ds-viz-bar                 ds-viz-pie                 ds-viz-table
  ds-viz-choropleth-svg      ds-viz-map
  ds-viz-sankey              ds-viz-markergauge         ds-viz-fillergauge
  ds-viz-punchcard           ds-viz-linkgraph           ds-viz-parallelcoordinates
  ds-viz-scatter             ds-viz-bubble              ds-viz-timeline
  ds-viz-events              ds-viz-markdown            ds-viz-image
  ds-viz-rectangle           ds-viz-ellipse

  ds-int-tokens              interactivity · $dataSource:result.field$ + $input.token$ + filters
  ds-int-inputs              interactivity · timerange / dropdown / multiselect / text / number
  ds-int-drilldowns          interactivity · click behavior, link targets, $click.value$
  ds-int-tabs                interactivity · tabbed layout structure
  ds-int-visibility          interactivity · conditional show/hide rules
  ds-int-defaults            interactivity · global ds + viz defaults

  ds-ref-syntax              reference · Dashboard Studio JSON schema
  ds-ref-design-principles   reference · archetypes, chart-selection, slop test, bans
  ds-ref-pitfalls            reference · cross-viz pitfalls matrix
```

## Pipeline

`Scope → Data → Design → Build → Ship → Iterate`

Pipeline skills carry **MUST-LOAD blocks** that route execution to the right content skill before any JSON is written. For example, `ds-create` loads `ds-ref-syntax` plus the relevant `ds-viz-<type>` for each panel before emitting the dashboard JSON.

## How the skills compose

A typical session looks like this:

1. `ds-couture` (optional, recommended) runs the Design Context Protocol — audience, viewing context, tone, anti-references — and commits to an archetype before any other skill is invoked.
2. `ds-init` scopes the project and writes `requirements.md`.
3. `ds-data-explore` (or `ds-mock`) writes `data-sources.json`. SPL drafts consult `ds-spl` for grammar and gotchas.
4. `ds-design` opens the wireframe editor; the user saves `layout.json`. While dragging panels in, the agent reads `ds-pick-viz` to suggest viz types based on user intent.
5. `ds-create` generates `dashboard.json`, reading `ds-ref-syntax` and the relevant `ds-viz-<type>` per panel.
6. `ds-validate` lints. `ds-deploy` ships. `ds-review` / `ds-polish` / `ds-critique` iterate.

The reference, viz, and interactivity skills can also be read **standalone** when answering a question — they are not gated on the pipeline.

## Workspace

Each dashboard project lives in `./.splunk-dashboards/<project-name>/` relative to the current working directory.

## Versioning

- `2.3.0` — last version of the monolithic skill layout (single `ds-viz`, single `ds-syntax`, no router).
- `2.4.0` — skill folders reorganized into `pipeline/` + `reference/` + `viz/` + `interactivity/` + `design/`. `ds-pick-viz` router added, 26 `ds-viz-*` and 6 `interactivity/` stubs introduced (non-breaking).
- `2.5.0` — content migrated out of the legacy monolith into the per-viz skills. The 26 `ds-viz-*` and 6 `ds-int-*` skills carry full content; the legacy `ds-viz` reference retired.
- `2.6.0` — current version. Skills flattened to `skills/<name>/` with prefix-based naming (`ds-ref-*`, `ds-int-*`, `ds-viz-*`). Two new top-level skills added: `ds-couture` (design-first companion) and `ds-spl` (SPL grammar reference). Pipeline skills carry explicit MUST-LOAD blocks routing to the right content skill before JSON is generated.
- `2.6.1` — README and tracking docs refreshed to match the flat layout. Wave A visual QA confirmed clean across all 27 deployed test dashboards.
