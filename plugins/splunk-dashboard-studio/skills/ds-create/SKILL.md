---
name: ds-create
description: Use this skill to generate a full Splunk Dashboard Studio JSON definition (dashboard.json) from a workspace's layout.json and data-sources.json. Reads Panel positions, visualization types, and SPL queries; produces the complete dataSources + visualizations + layout.structure. Advances workspace state from designed to built. Requires a workspace at designed stage produced by ds-design. **Before generating JSON, this skill REQUIRES loading the per-viz `ds-viz-<type>` skill for every distinct viz type in the layout, plus `ds-pick-viz`, `ds-ref-design-principles`, `ds-ref-syntax`, and `ds-ref-pitfalls`. Skipping these lookups produces output that fails schema validation or renders empty.**
---

# ds-create — Dashboard Studio JSON builder

## When to use

After `ds-design` has written `design/layout.json` and advanced state to `designed`. Combined with `data-sources.json` from `ds-data-explore` or `ds-mock`, this skill produces the complete `dashboard.json` that a Splunk instance can consume.

## Prerequisites

- Workspace exists with `current_stage=designed`.
- `design/layout.json` has panels.
- `data-sources.json` has one entry per question.

## What it does

1. Reads `design/layout.json` (panels: id, title, grid position, viz_type, data_source_ref).
2. Reads `data-sources.json` (sources: question, SPL, earliest, latest, name).
3. Generates Dashboard Studio JSON:
   - One `ds.search` entry per data source, keyed `ds_1`, `ds_2`, …
   - One visualization per panel, keyed `viz_<panel.id>`, with `dataSources.primary` pointing to the matching `ds_N`.
   - Absolute layout structure: grid cells × `GRID_UNIT_W`/`GRID_UNIT_H` (100 × 80 pixels).
4. Writes `dashboard.json` at the workspace root.
5. Advances state `designed` → `built`.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboard-studio/src \
python3 -m splunk_dashboards.create build <project-name> \
  --title "<dashboard title>" \
  --description "<optional description>"
```

The `title` becomes the dashboard's top-level title (shown in the Splunk UI). `description` is optional.

## Output shape

`dashboard.json` matches the Splunk Dashboard Studio (v2) schema:

```json
{
  "title": "...",
  "description": "...",
  "theme": "dark",
  "dataSources": { "ds_1": { "type": "ds.search", "name": "...", "options": { "query": "...", "queryParameters": { "earliest": "...", "latest": "..." } } } },
  "visualizations": { "viz_p1": { "type": "splunk.singlevalue", "title": "...", "dataSources": { "primary": "ds_1" }, "options": {} } },
  "inputs": {},
  "defaults": {},
  "layout": { "type": "absolute", "options": { "width": 1920, "height": 1080 }, "structure": [ { "item": "viz_p1", "type": "block", "position": { "x": 0, "y": 0, "w": 600, "h": 320 } } ] }
}
```

For deeper schema details, invoke `ds-ref-syntax`. For per-visualization option fields, invoke the matching `ds-viz-<type>` skill — see "Required reading" below.

## New: global time input, drilldowns, grid layout

### CLI flags

- `--no-time-input` — Omits the global time-range input and the `defaults` block that wires panel queries to it. Useful when embedding a dashboard in a context that supplies its own time picker, or for static dashboards.
- `--layout grid` — Emits a grid layout instead of absolute positioning. Panels are grouped into rows by their `y` coordinate and sorted by `x` within each row. Each row becomes a `{"type": "row", "items": [...]}` entry with `width` expressed as a percentage of the row. Default is `--layout absolute`.

### Global time input (default on)

When `--no-time-input` is NOT passed (the default), `ds-create` automatically:

1. Adds an `input.timerange` keyed `input_global_time` with token `global_time` to the `inputs` block.
2. Adds a `defaults.dataSources.global` block that wires every panel's `queryParameters.earliest` / `latest` to `$global_time.earliest$` / `$global_time.latest$`.

This means users get a working time-range picker that controls all panels without any extra configuration.

### Panel drilldowns

Panels in `layout.json` can carry a `drilldown` field:

```json
{
  "id": "p1",
  "title": "My Panel",
  "drilldown": {"type": "link.dashboard", "dashboard": "target_dash"}
}
```

`ds-create` translates this into `options.drilldown = "all"` and `options.drilldownAction = <drilldown value>` on the matching visualization, enabling click-through behavior in the rendered dashboard.

## Hard rule — every dataSource MUST have a `name`

Every `ds.search` entry in `dataSources` **must** include
`options.name`. Without it, the Splunk Dashboard Studio editor shows
"Unnamed" in the data source picker, making the dashboard impossible
to maintain. This is a non-negotiable requirement — no exceptions.

```json
"ds_health": {
  "type": "ds.search",
  "options": {
    "query": "| makeresults | eval value=94",
    "queryParameters": { "earliest": "0", "latest": "now" },
    "name": "Health Score"
  }
}
```

## Hard rule — dataSource `name` character set

Every `dataSource.name` field this skill emits **must** match
`^[A-Za-z0-9 \-_.]+$`. Splunk's Studio editor enforces this regex on
the user-facing "Data source name" input — anything else is rejected at
save time and `splunk_create_dashboard` fails. Allowed characters:
**letters, numbers, spaces, dashes, underscores, periods**.

When deriving a `name` from a question string in `data-sources.json`
(e.g. `"What's the failure rate by host?"`), sanitize before writing:

| Found | Replace with |
|---|---|
| `?` `!` `"` `'` smart quotes | drop |
| `/` `:` `(` `)` `[` `]` `\|` `,` `&` `+` `*` `=` | space or dash |
| accented letters (æøåéüñ etc.) | ASCII fold (`æ→ae`, `ø→o`, `å→a`, `é→e` …) |
| consecutive spaces | single space |
| leading/trailing whitespace | trim |

This rule applies **only** to the `name` field. The JSON object key
(`ds_1`, `ds_2`, …) is an internal ID and is not user-visible — it is
not subject to this regex (the codebase convention is `ds_*` snake_case).

`ds-validate` enforces this with `dataSource-name-illegal-chars` —
catch it at `built`-stage rather than at deploy.

## Hard defaults — applied to every dashboard

These defaults are non-negotiable unless the user explicitly overrides:

0. **Canvas minimum: 1920 × 1080 px.** No exceptions. Never use
   1440, 1280, or any width below 1920. Every Splunk dashboard
   target (analyst workstation, 27" monitor, SOC wall) is 1080p+.
   ```json
   "layout": { "type": "absolute", "options": { "width": 1920, "height": 1080 } }
   ```

1. **`xAxisTitleVisibility: "hide"`** on every `splunk.area`,
   `splunk.line`, `splunk.column` viz. The `_time` label adds zero
   information. NOT `showXAxisTitle` — that property does not exist.

2. **Time fields — tables vs charts:**
   **Tables:** `| eval _time=strftime(_time, "%Y-%m-%d %H:%M")` — drop
   the timezone suffix (+00:00) and milliseconds.
   **Charts (area, line, column): NEVER `strftime` on `_time`.** Chart
   viz types need `_time` as epoch. Converting to string kills the
   x-axis — the chart renders empty with no data points. Splunk
   auto-formats epoch time on chart axes.

3. **Canvas background** must include at least one low-opacity
   gradient rectangle. See `ds-ref-layout-grid` "Gradient background."

4. **Card `rx`** must be 4-8, not 12+. Large radii look amateur.

5. **Choropleth context** must use a flat array with key name
   `areaColorsEditorConfig`, NOT a `{type: "range", ranges: [...]}`
   wrapper. The wrapper causes "d is not iterable" in Studio.

6. **`fontFamily` on `splunk.markdown`** — strict allow-list, ONLY these 7:
   `Splunk Platform Sans`, `Splunk Data Sans`, `Splunk Platform Mono`,
   `Arial`, `Helvetica`, `Times New Roman`, `Comic Sans MS`.
   Custom fonts (`Inter`, `Roboto`, `Georgia`, `system-ui`, etc.)
   cause schema validation error: `must match a schema in anyOf`.

7. **`fontSize` on `splunk.markdown`** — strict enum, ONLY:
   `extraSmall`, `small`, `default`, `large`, `extraLarge`.
   Numeric values (`"14"`, `"11"`) cause schema validation error.

8. **Markdown panels must never produce scrollbars.** Size the panel
   width and height to fit ALL text at the chosen fontSize. Budget:
   - `extraLarge` heading: ~40px per line height
   - `large`: ~30px per line
   - `default`: ~24px per line
   - `small` / `extraSmall`: ~18px per line
   - Add 16px vertical padding
   Always oversize the panel, then tighten. A clipped markdown with
   a scrollbar is worse than 20px extra whitespace.

9. **`icon_library` panels** MUST set `"backgroundColor": "transparent"`
   on the viz level (outside the namespace options). This is the viz-level
   `backgroundColor`, not `icon_library.icon_library.bgColor`. Without it,
   icons render with a dark box background that clashes with shadow cards
   and canvas. Apply by default on EVERY `icon_library.icon_library` panel.

## Splunk Enterprise and Cloud compatibility

`ds-create` emits **native Dashboard Studio v2 JSON only** — no custom CSS, no JavaScript, no app dependencies. Output runs unmodified on Splunk Enterprise (9.x+) and Splunk Cloud.

## After building

- `dashboard.json` exists at the workspace root.
- `state.json` has `current_stage=built`.
- Next step: `ds-validate` (lint SPL, tokens, drilldowns) before `ds-deploy`.

## ⚠️ MUST LOAD — required reading before generating any JSON

These skills MUST be loaded before you write a single line of
dashboard.json. **This is not optional.** Skipping any of them
produces output that fails schema validation, renders empty in
Splunk, fails the Slop Test, or — most commonly — looks generic and
AI-generated despite passing every technical check.

The CLI builds the mechanical skeleton (data sources, visualizations,
structure). It does **not** know per-viz option shapes, threshold
semantics, schema traps, SPL grammar pitfalls, or visual taste.
**Do not freestyle from training-data memory** — load the specific
skills below.

### ALWAYS-LOAD (every dashboard, no exceptions)

1. **`ds-pick-viz`** — viz selection router. Given the question
   shape in `requirements.md`, picks the right viz type and warns
   about common mismatches (pie >6 slices, bar without sort,
   scatter for time series).
2. **`ds-ref-design-principles`** — archetype (executive / ops /
   analytical / SOC), KPI sizing, semantic colour palette, canvas
   tokens, absolute bans, the Slop Test rubric.
3. **`ds-couture`** — visual taste, depth, hierarchy, typography,
   colour discipline, KPI hero-sizing, sparkline placement,
   panel-card rectangles. **Without this skill, your dashboard
   will pass validation but look like AI slop.** The skill starts
   with a Design Context Protocol (audience, tone, anti-reference,
   brand) — answer those before touching JSON.
4. **`ds-ref-syntax`** — Dashboard Studio JSON schema (top-level
   keys, dataSources, inputs, defaults, layout, expressions,
   drilldowns, DOS, token filters).
5. **`spl-gotchas`** (from `splunk-spl` plugin) — SPL silent-fail
   traps + categorized command index. Covers `spath output=`,
   `case()` default, dotted-field quoting, `matchValue` vs
   `rangeValue`, and 20+ more traps. For full command syntax,
   read `splunk-spl/reference/<command>.md`.

### Before writing the JSON for ANY visualization

Read **`ds-viz-<type>/SKILL.md`** for every viz type that appears
in your `layout.json`. This is the single most important step. Each
SKILL.md has:

- Quick start JSON (copy this).
- Do / Don't table (the per-viz traps).
- See also pointers to PATTERNS.md / OPTIONS.md / GOTCHAS.md when
  more detail is needed.

Worked examples of what each per-viz skill catches:

| If layout has… | Read this | Common trap it stops |
|---|---|---|
| `splunk.bar` / `splunk.column` | `ds-viz-bar` / `ds-viz-column` | Adding `x` / `y` DOS options (those are scatter-only) — flips axes silently. |
| `splunk.singlevalue` | `ds-viz-singlevalue` | Threshold bucket overlaps; `trendColor` doesn't auto-flip on +/-. |
| `splunk.singlevalueicon` | `ds-viz-singlevalueicon` | Per-instance icon URLs (UUID is non-portable); panel `title` not supported. |
| `splunk.map` | `ds-viz-map` | `geo_countries` keys on full names; bubble layer **must** use `\| geostats`. |
| `splunk.choropleth.map` (typo) | `ds-viz-map` Common confusions | Doesn't exist — use `splunk.map` with choropleth layer. |
| `splunk.sankey` | `ds-viz-sankey` | Needs lowercase `source` / `target` / `value` exactly; CSV `seriesColors` rejected. |
| `splunk.timeline` | `ds-viz-timeline` | `category` must be DOS string, not bare field name. |
| `splunk.table` with sparklines | `ds-viz-table` + SPARKLINE-DATA.md | `eval x="..." \| makemv` only types row 1 — use `\| stats sparkline()`. |
| `splunk.markdown` | `ds-viz-markdown` | GFM pipe-tables NOT supported; only 7 fontFamily values allowed. |
| `icon_library.icon_library` | `ds-viz-icon-library` | All options need `icon_library.icon_library.` prefix; needs ds.test stub dataSource. |
| `infographic_shapes.infographic_shapes` | `ds-viz-infographic-shapes` | All options need `infographic_shapes.infographic_shapes.` prefix; boolean values must be strings `"true"`/`"false"`. |

### Before adding interactivity

Read the matching `interactivity/<skill>` for any of:

| If layout includes… | Read this |
|---|---|
| Any input widget | `ds-int-inputs` (only 5 input types exist; `input.radio` / `input.number` are NOT valid) |
| Tokens consumed in SPL or options | `ds-int-tokens` (multiselect needs `\|s` filter for `IN()`) |
| Global time picker via defaults | `ds-int-defaults` |
| Click handlers on charts/tables | `ds-int-drilldowns` (`linkToDashboard.tokens` is **array**, not map) |
| Conditional show/hide panels | `ds-int-visibility` (`containerOptions.visibility` only; `isSet()` is Cloud-only) |
| Multi-tab dashboard | `ds-int-tabs` |

### Before generating custom SVG assets

If any panel in the layout uses `splunk.choropleth.svg` with a custom
canvas, `splunk.singlevalueicon` with a custom icon, or `splunk.image`
with a custom logo/diagram that needs to be generated:

- **`ds-svg`** — custom SVG generator. Provides icon exemplars,
  choropleth canvas templates, and the data-URI encoding rules for
  inline SVG. Without this skill, you will freestyle SVGs that break
  Splunk's parsing or look inconsistent with the dashboard's design
  language.

### After writing the JSON, before validating

Two passes are required:

1. **`ds-ref-pitfalls`** — cross-skill traps matrix. Symptom-to-fix
   lookup that catches issues spanning multiple skills (CSV
   `seriesColors` rejected on sankey/timeline/linkgraph; dataSource
   name regex; threshold-bucket overlap on
   singlevalue/ellipse/rectangle/filler/markergauge; bubble layer
   needing `\| geostats`; ISO-2 codes on `geo_countries`).

2. **`ds-couture`** Slop Test (final pass) — runs through the visual
   checklist: canvas-background set, KPI row has semantic polarity
   AND visual hierarchy (anchor KPI hero-sized), depth from layered
   rectangles, sparklines on count KPIs, markdown section headers,
   no rainbow on ordered data, no red/green as sole differentiator,
   pie ≤6 slices, panel titles ≤40 chars Title Case. **A dashboard
   that passes ds-ref-pitfalls but fails ds-couture's Slop Test
   still ships AI-slop.** Both must pass.

### Per-viz JSON enrichment after the CLI writes `dashboard.json`

- Set `layout.options.backgroundColor` to the canvas token from
  `ds-ref-color` (`#0b0c0e` dark, `#FAFAF7` light,
  `#000000` NOC wall).
- Populate per-viz `options` with the semantic palette (failure
  KPIs get `"majorColor": "#DC4E41"`, etc.) — the exact hex values
  are in `ds-ref-color`.
- Add `splunk.rectangle` cards behind KPI rows for depth (place
  **first** in `layout.structure` — earlier = behind). See
  `ds-viz-rectangle` PATTERNS.md.
- Add `splunk.markdown` section headers between zones when panel
  count > 6.
- Wire `trendValue`, `sparklineValue`, or `majorValue` Dynamic
  Options Syntax expressions on singlevalues — see `ds-viz-
  singlevalue` PATTERNS.md.

If the layout picked viz types that don't fit the data shape, use
the chart-selection decision table in `ds-ref-visual-encoding` and
invoke `ds-update` to swap viz types before running the CLI.

## Self-check before declaring `dashboard.json` ready

### Always-load skills (the 5 from MUST LOAD)

- [ ] Read **`ds-pick-viz`** for viz selection.
- [ ] Read **`ds-ref-design-principles`** for archetype + Slop Test rubric.
- [ ] Read **`ds-couture`** + answered the Design Context Protocol
  questions (audience, tone, anti-reference, brand).
- [ ] Read **`ds-ref-syntax`** for the JSON envelope.
- [ ] Read **`spl-gotchas`** (from `splunk-spl` plugin) for SPL grammar in every data source query.

### Per-dashboard-content skills

- [ ] Read **`ds-viz-<type>`** for every distinct viz type in the layout.
- [ ] Read every relevant **`ds-int-*`** skill if the dashboard has
  inputs / tokens / drilldowns / visibility / tabs.

### Final passes

- [ ] **`ds-ref-pitfalls`** — cross-skill traps (config / schema bugs).
- [ ] **`ds-couture`** Slop Test — visual hierarchy, depth, taste.
- [ ] No "I know this from training data" decisions on options, DOS
  expressions, SPL grammar, or visual choices. Every decision is
  traceable to a specific skill.

### Visual finishing — non-negotiable items the CLI cannot do

- [ ] `layout.options.backgroundColor` set explicitly (not Splunk default grey).
- [ ] KPI row has semantic polarity (status = threshold-coloured majorColor; informational = static `#006D9C`).
- [ ] KPI row has visual hierarchy — anchor KPI is hero-sized OR distinguished from supporting ones.
- [ ] Sparklines on count-style KPIs (paired with a `ds.chain` to `\| timechart`).
- [ ] `splunk.rectangle` panel-card behind KPI rows for depth (placed FIRST in `layout.structure`).
- [ ] **Panel cards consistent — all main panels have a card OR none do.** Half-implemented depth ("severity strip has cards, the rest sits flat") looks worse than no depth. No partial-depth waivers allowed.
- [ ] **`splunk.markdown` section header above every panel cluster ≥2 panels.** Default-ON for SOC and operational archetypes (the original "when panel count > 6" was too lax). Includes a 1-line description per zone explaining what data it shows and where to escalate.
- [ ] **Every chart displaying an entity has a drilldown.** Entity types: `host` / `IP` / `user` / `hash` / `time-bucket` / `geo` / `technique-id` / `asset-id` / `service-name`. Applies to tables, bars, maps, punchcards, line charts with a `by`-clause, scatter — not just tables. Explicit waiver required if any entity-displaying panel has no drilldown. "Wall display has no input device" is NOT a valid waiver — see `ds-ref-archetypes` SOC wall sub-archetype.
- [ ] **Brand-color demoted per `ds-ref-brand` if it collides with status semantics.** Containment-to-band ≥40px is explicitly banned. Brand-red on a SOC dashboard goes to wordmark-only or ≤5px accent stripe.
- [ ] **Footer markdown with runbook / on-call / Slack channel for ops and SOC archetypes.** Wall doesn't read it; console operator does. Executive and analytical archetypes can waive with reason.
- [ ] Every input has a `defaultValue`.
- [ ] Every search bound to `$global_time.earliest$ / .latest$` via `defaults.dataSources.ds.search.options.queryParameters`.
- [ ] Series colours from a categorical palette (semantic colours never leak to chart series).
- [ ] Colour paired with icon / label / shape for status (red/green never alone).
- [ ] Pie ≤6 slices (or replaced with bar).
- [ ] Panel titles ≤40 chars, Title Case.

### Scope discipline — deployed = production

A "sketch" that gets deployed to Splunk is **no longer a sketch**. The moment `dashboard.json` lands in any Splunk instance — local lab, staging, or production — it becomes a real surface that real users can read, screenshot, share, and depend on. The visual-finishing checklist above is **not skippable based on authoring intent**.

**Authoring intent is NOT a valid waiver:**

- ❌ "This is just a sketch, I'll polish later" — no, you won't. The sketch ships.
- ❌ "It's only for the demo" — demo dashboards screenshot widely.
- ❌ "I'll add drilldowns in v2" — v2 rarely happens; v1 is what people remember.
- ❌ "User said sketch, so I skipped Scope Check" — user's authoring intent does not relax the deploy-time gate.

**If you plan to deploy, run all checklists.** Both Slop Test (taste) and Scope Check (structural completeness, see `ds-couture`). Authoring shortcuts that survive into deploy become field bugs the next session has to clean up.

**Detection trigger:** any of these signals means deploy is imminent and Scope Check is mandatory:

- The user invokes `ds-deploy`, `splunk_create_dashboard`, `splunk_update_dashboard`, or any equivalent MCP tool.
- The user pastes a Splunk URL or app name and asks to "put this in".
- The user says "deploy", "ship", "install", "push to Splunk", or any synonym.

When any signal fires, do not let "this is a sketch" in the original conversation override the gate. Re-run the checklist. Fix gaps or document waivers explicitly.
