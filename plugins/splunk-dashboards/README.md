# splunk-dashboards

A Claude Code / Cursor plugin for guided authoring of Splunk Dashboard Studio (v2) dashboards.

It ships two layers:

1. **A pipeline** of action skills that walk a project from scope to deployed dashboard.
2. **A granular reference library** with one skill per visualization, one per interactivity concept, plus router and design-principles skills. The skill loader picks the smallest skill that matches the current task, so no context is wasted on irrelevant docs.

## Pipeline

`Scope → Data → Design → Build → Ship → Iterate`

Each stage is a skill. The folder layout follows the pipeline order:

```
skills/
  pipeline/
    ds-init               Scope a new dashboard project (interactive or autopilot)
    ds-data-explore       Discover real Splunk data and draft SPL per question
    ds-mock               Generate inline synthetic data when real data is not yet available
    ds-design             Browser-based wireframe editor (Gridstack, drag-and-drop)
    ds-create             Generate dashboard.json from layout + data sources
    ds-validate           Lint dashboard.json (token resolution, data-source bindings, drilldown targets)
    ds-deploy             Wrap dashboard.json in a Splunk TA tarball or write dashboard.xml
    ds-review             Audit a dashboard.json/.xml against authoring best practices
    ds-update             Apply natural-language change requests to an existing dashboard
    ds-critique           Quantitative UX critique with persona-based testing and anti-pattern detection
    ds-polish             Final pre-ship pass: alignment, spacing, consistency, micro-detail
```

## Reference library

```
skills/
  reference/
    ds-syntax             Dashboard Studio JSON schema (dataSources, layout, tokens, drilldowns)
    ds-design-principles  Archetypes, chart-selection rationale, color/typography, slop test
    ds-viz                Monolithic per-viz reference (legacy — being migrated to viz/ds-viz-*)

  viz/
    ds-pick-viz           Router: from intent ("trend over time") to viz type
    ds-viz-singlevalue    ds-viz-singlevalueicon    ds-viz-singlevalueradial
    ds-viz-line           ds-viz-area               ds-viz-column
    ds-viz-bar            ds-viz-pie                ds-viz-table
    ds-viz-choropleth-svg ds-viz-map                ds-viz-choropleth-map
    ds-viz-sankey         ds-viz-markergauge        ds-viz-fillergauge
    ds-viz-punchcard      ds-viz-linkgraph          ds-viz-parallelcoordinates
    ds-viz-scatter        ds-viz-bubble             ds-viz-timeline
    ds-viz-events         ds-viz-markdown           ds-viz-image
    ds-viz-rectangle      ds-viz-ellipse

  interactivity/
    ds-tokens             $dataSource:result.field$ + $input.token$ + filters
    ds-inputs             input.timerange / dropdown / multiselect / text / checkbox / radio / number
    ds-drilldowns         Click behavior, link targets, $click.value$
    ds-tabs               Tabbed layout structure
    ds-visibility         Conditional show/hide rules
    ds-defaults           Global ds + viz defaults

  design/
    (reserved for a future split of ds-design-principles — out of scope today)
```

> **Note (work in progress):** The 26 `viz/ds-viz-*` skills and the 6 `interactivity/` skills are currently stubs. The body of each will be migrated out of `reference/ds-viz` and `reference/ds-syntax` in follow-up commits. The router (`ds-pick-viz`) is fully written and works today against the stub names. Once migration is complete, `reference/ds-viz` will be removed.

## How the skills compose

A typical session looks like this:

1. `ds-init` scopes the project and writes `requirements.md`.
2. `ds-data-explore` (or `ds-mock`) writes `data-sources.json`.
3. `ds-design` opens the wireframe editor; user saves `layout.json`. While dragging panels in, the agent reads `ds-pick-viz` to suggest viz types based on user intent.
4. `ds-create` generates `dashboard.json`, reading `ds-syntax` and the relevant `ds-viz-<type>` per panel.
5. `ds-validate` lints. `ds-deploy` ships. `ds-review` / `ds-polish` / `ds-critique` iterate.

The reference skills (`ds-pick-viz`, `ds-viz-*`, `ds-tokens`, `ds-inputs`, `ds-drilldowns`, `ds-design-principles`, `ds-syntax`) can also be read **standalone** when answering a question — they are not gated on the pipeline.

## Workspace

Each dashboard project lives in `./.splunk-dashboards/<project-name>/` relative to the current working directory.

## Versioning

- `2.3.0` — last version of the monolithic skill layout (single `ds-viz`, single `ds-syntax`, no router).
- `2.4.0` — this version. Skill folders reorganized (`pipeline/` + `reference/` + `viz/` + `interactivity/` + `design/`), `ds-pick-viz` router added, 26 `ds-viz-*` and 6 `interactivity/` stubs added. **Non-breaking**: all existing skill names still resolve.
- Future `2.5.0`+ — migrate content out of `reference/ds-viz` into the per-type stubs and remove the legacy file.
