# splunk-dashboards plugin — design spec

**Date:** 2026-04-22
**Status:** Draft for review
**Scope:** Design of a new Claude Code / Cursor plugin for authoring Splunk Dashboard Studio (v2) dashboards end-to-end.

---

## 1. Goals and non-goals

### Goals

- Provide a guided, end-to-end pipeline from dashboard idea to deployed Splunk artifact.
- Keep each step as a standalone skill that is also useful on its own (not only as a pipeline step).
- Support fully automated runs via an `--autopilot` flag for experienced users.
- Persist workspace state on disk so any step can be resumed or re-run.
- Produce output compatible with Splunk Dashboard Studio v2 (JSON definition wrapped in an XML envelope).

### Non-goals

- Classic Simple XML (v1) dashboards. Dashboard Studio v2 only.
- Other BI tools (Grafana, Tableau, etc.).
- Live data preview inside the wireframe editor. MVP is structural only.
- Dependency on the `fake-data` plugin. Synthetic data is handled inline (see §5 `ds-mock`). A future dedicated synthetic-data plugin can extend this.

---

## 2. Plugin overview

- **Plugin name:** `splunk-dashboards`
- **Skill prefix:** `ds-` (Dashboard Studio)
- **Skill count:** 12
- **Orchestrator:** `ds-init` (entry point, optionally `--autopilot`)
- **Language rule:** all plugin artifacts — skill definitions, source, comments, CLI output, generated files — are English-only (per repo `CLAUDE.md`).

### Skill inventory (grouped by lifecycle stage)

| Stage | Skill | Purpose |
|---|---|---|
| 1. Scope & Data | `ds-init` | Scoping, requirements gathering, pipeline entry point |
| | `ds-data-explore` | Discover indexes/sourcetypes, propose SPL queries |
| | `ds-mock` | Generate inline synthetic data via `makeresults` / CSV lookups |
| 2. Design | `ds-design` | Local HTTP server wireframe editor with drag-and-drop |
| | `ds-template` | Load or save reusable dashboard patterns (SOC, ops, etc.) |
| 3. Build | `ds-create` | Generate Dashboard Studio JSON for a new dashboard |
| | `ds-update` | Modify an existing dashboard JSON |
| | `ds-syntax` | Standalone reference: JSON structure, dataSources, tokens, drilldowns, layout |
| | `ds-viz` | Standalone reference: all visualization types and their options |
| 4. Ship & Iterate | `ds-validate` | Lint JSON, SPL, tokens, drilldowns |
| | `ds-deploy` | Wrap in XML envelope, optionally package as Splunk TA |
| | `ds-review` | Audit an existing dashboard against best practices |

---

## 3. Workspace and state contract

Every dashboard project lives in a dedicated workspace directory. All skills read from and write to this directory. This is the same pattern as the `fake-data` plugin.

### Layout

```
./.splunk-dashboards/<project-name>/
├── state.json              # Pipeline state, which skills have run
├── requirements.md         # Output of ds-init
├── data-sources.json       # Output of ds-data-explore or ds-mock
├── design/
│   ├── wireframe.html      # Served by ds-design HTTP server
│   └── layout.json         # Panel grid, viz types, dataSource refs
├── dashboard.json          # Output of ds-create (Dashboard Studio JSON)
├── dashboard.xml           # Output of ds-deploy (XML envelope)
└── review.md               # Output of ds-review
```

### `state.json` schema

```json
{
  "project": "my-dashboard",
  "created": "2026-04-22T10:00:00Z",
  "current_stage": "designed",
  "stages_completed": ["scoped", "data-ready", "designed"],
  "data_path": "mock",
  "autopilot": false
}
```

### Stage transitions

```
scoped → data-ready → designed → built → validated → deployed → reviewed
                                    ↑                              │
                                    └──────── ds-update ───────────┘
```

Each skill reads `state.json`, verifies prerequisites, performs its work, and updates state before exiting. Skills refuse to run out of order unless the user passes `--force`.

---

## 4. Pipeline flow

```
ds-init
   │
   ▼
ds-data-explore  OR  ds-mock     (based on "has data?" answer)
   │
   ▼
ds-template (optional)            (seed layout.json from a pattern)
   │
   ▼
ds-design                         (HTTP server wireframe editor)
   │
   ▼
ds-create                         (generate Dashboard Studio JSON)
   │
   ▼
ds-validate                       (lint — blocks on errors)
   │
   ▼
ds-deploy                         (XML envelope + optional TA package)
   │
   ▼
ds-review                         (audit, produce findings)
   │
   ▼
ds-update ──────▶ back to ds-validate
```

`ds-template` can also be invoked **after** `ds-create` to save the current dashboard as a reusable template for future projects.

---

## 5. Skill specifications

Each skill is described by inputs, outputs, and CLI flags. Implementation detail belongs in the per-skill `SKILL.md`.

### 5.1 `ds-init`

**Purpose:** Entry point. Gather requirements, decide routing.

**Inputs:** None (or existing workspace for resume).

**Outputs:** `requirements.md`, initial `state.json`.

**Flags:**
- `--autopilot` — skip interactive questions, use sensible defaults, run full pipeline.
- `--quick` — ask only the minimum (goal, data-readiness) and skip design phase.
- `--resume` — load existing workspace and continue.

**Question flow:** see §6.

### 5.2 `ds-data-explore`

**Purpose:** Discover available Splunk data and propose SPL queries for each dashboard question.

**Inputs:** `requirements.md` (dashboard questions, indexes).

**Outputs:** `data-sources.json` with one entry per dashboard question:
```json
{
  "question": "What are the top failed login sources?",
  "spl": "index=auth action=failure | stats count by src",
  "earliest": "-24h",
  "latest": "now"
}
```

**Notes:** Uses Splunk MCP (if configured) to verify indexes and test queries. Falls back to heuristic SPL generation if no MCP connection.

### 5.3 `ds-mock`

**Purpose:** Generate synthetic data when the user has no real data yet.

**Inputs:** `requirements.md` (questions).

**Outputs:** `data-sources.json` with inline synthetic queries.

**Two modes:**
1. **`makeresults`-based (default):** inline SPL that generates fake events on the fly.
   ```
   | makeresults count=100
   | eval user=mvindex(split("alice,bob,carol,dave",","), random()%4)
   | eval action=mvindex(split("success,failure",","), random()%2)
   | stats count by user action
   ```
2. **CSV-lookup-based (`--lookup`):** writes a CSV file under the workspace, referenced via `| inputlookup mock_logins.csv`.

**Future:** a dedicated synthetic-data plugin can take over and be called from here. Out of scope for MVP.

### 5.4 `ds-design`

**Purpose:** Wireframe the dashboard layout. Runs a local HTTP server so the user can drag and drop panels in a browser.

**Inputs:** `requirements.md`, `data-sources.json`.

**Outputs:** `design/layout.json`, `design/wireframe.html`.

**HTTP server MVP scope:**
- **Stack:** Python stdlib `http.server` + `json` + `pathlib`. No external Python deps.
- **Frontend:** single HTML file, [Gridstack.js](https://gridstackjs.com/) via CDN (one `<script>` tag, MIT license).
- **Features:**
  - Drag-and-drop panels in a grid.
  - Resize handles on panels.
  - Per-panel viz-type picker (dropdown) with these types:
    - `splunk.singlevalue`, `splunk.line`, `splunk.column`, `splunk.bar`, `splunk.pie`, `splunk.area`, `splunk.table`, `splunk.timeline`, `splunk.choropleth`, `splunk.markergauge`
  - Inline SVG thumbnail in each panel showing the viz type iconically.
  - "Save & Exit" button — POSTs layout to `/save`, server writes `layout.json` and shuts down.
- **Out of scope for MVP:** live data preview, SPL editing inside panels, theming, reordering via keyboard.

**Panel schema:**
```json
{
  "id": "panel-1",
  "x": 0, "y": 0, "w": 6, "h": 4,
  "title": "Failed Logins",
  "vizType": "splunk.singlevalue",
  "dataSourceRef": "question-1"
}
```

### 5.5 `ds-template`

**Purpose:** Load a reusable dashboard pattern, or save the current dashboard as a new template.

**Two modes:**
1. **Load** (`ds-template load <name>`): runs *before* `ds-design`. Seeds `design/layout.json` from a stored template so the wireframe editor opens with a pre-populated layout.
2. **Save** (`ds-template save <name>`): runs *after* `ds-create`. Exports `dashboard.json` (or the current `layout.json`) as a reusable template for future projects.

**Inputs:** template name (or path for external templates).

**Outputs (load):** `design/layout.json` written from the template.
**Outputs (save):** a new template file under the plugin's template directory.

**Bundled templates (initial set):** `soc-overview`, `ops-health`, `security-monitoring`, `api-performance`. Stored under the plugin directory as JSON files.

### 5.6 `ds-create`

**Purpose:** Generate the full Dashboard Studio JSON definition from layout + data sources.

**Inputs:** `design/layout.json`, `data-sources.json`, `requirements.md`.

**Outputs:** `dashboard.json` (Dashboard Studio JSON).

**Internal references loaded at runtime:** `ds-syntax`, `ds-viz` (as in-repo documentation, not invoked as separate skills).

### 5.7 `ds-update`

**Purpose:** Modify an existing dashboard JSON.

**Inputs:** path to `dashboard.json` or `dashboard.xml`, a natural-language change request.

**Outputs:** updated `dashboard.json`.

**Standalone use:** can operate on any dashboard file outside a workspace.

### 5.8 `ds-syntax`

**Purpose:** Standalone reference skill for Dashboard Studio JSON structure.

**Content areas:** top-level keys, `dataSources`, `visualizations`, `inputs`, `defaults`, `layout`, tokens, drilldowns, XML envelope.

**Standalone use:** user asks `/ds-syntax how do tokens work?` without a workspace. Also loaded internally by `ds-create` and `ds-update`.

### 5.9 `ds-viz`

**Purpose:** Standalone reference skill for all visualization types and their options.

**Content areas:** one section per viz type, listing required and optional fields, common token bindings, layout caveats.

**Standalone use:** `/ds-viz pie chart options`. Also loaded internally by `ds-create` and `ds-update`.

### 5.10 `ds-validate`

**Purpose:** Lint a dashboard before deploy.

**Checks:**
- JSON schema conforms to Dashboard Studio spec.
- Every `ds.search` has a `name`.
- All token references (`$token$`) are defined in `inputs` or `defaults`.
- Every drilldown target exists.
- SPL queries parse (syntactic check; semantic via MCP if available).
- Every panel references an existing data source.

**Outputs:** pass/fail, list of findings. Blocks `ds-deploy` on fail unless `--force`.

### 5.11 `ds-deploy`

**Purpose:** Produce a deployable Splunk artifact.

**Outputs:**
- `dashboard.xml` — the JSON wrapped in `<dashboard version="2"><definition><![CDATA[...]]></definition></dashboard>`.
- **Optional** (`--as-app`): a Splunk TA tarball containing the dashboard as an app, with `app.conf`, `default/data/ui/views/<name>.xml`, and `metadata/default.meta`.

**Flags:**
- `--theme light|dark`
- `--as-app` — produce a `.tar.gz` Splunk TA.

### 5.12 `ds-review`

**Purpose:** Audit a dashboard against best practices.

**Inputs:** `dashboard.json` or `dashboard.xml`.

**Checks:**
- Panel count (too many → overloaded; too few → not useful).
- Consistent viz types for similar data.
- Drilldown coverage.
- Token reuse (global time vs per-panel).
- Accessibility (color contrast, theme compatibility).
- SPL performance (no `*` wildcards on raw events, use of `tstats` where applicable).

**Outputs:** `review.md` with findings and suggested `ds-update` invocations.

**Standalone use:** can audit any existing dashboard file.

---

## 6. `ds-init` question flow

Questions are asked one at a time. User can type `skip` at any prompt to accept defaults for the rest.

### Group 1 — Context

1. **Role:** multi-choice — SOC analyst / DevOps / Platform admin / Developer / Business / Other.
2. **Audience:** multi-choice — Self / Team / Leadership / External.
3. **Primary goal:** free text, one sentence.

### Group 2 — Content

4. **Focus:** multi-choice — Technical/operational / Business/executive / Mixed.
5. **Questions the dashboard should answer:** free text, 3–5 items. These become panels.
6. **Similar dashboard exists?** Yes (provide path/URL) / No. If yes, `ds-review` can be run on it first.

### Group 3 — Data

7. **Data already in Splunk?** Yes / No / Partial. Routes to `ds-data-explore` or `ds-mock`.
8. **(If yes) Relevant indexes/sourcetypes:** free text or auto-discover via Splunk MCP.

### Group 4 — Scope

9. **Customization level:** multi-choice — Start from template / Moderate / Fully bespoke.
10. **Nice-to-haves:** multi-select — Drilldowns / Alerts / Scheduled reports / Tokens/filters / Dark theme / Other.

### Defaults used by `--autopilot`

- Role: auto-detect from `CLAUDE.md` if mentioned; otherwise "Developer".
- Audience: Self.
- Focus: Mixed.
- Questions: inferred from the goal sentence by prompting Claude.
- Reference dashboard: none.
- Data: auto-discover via Splunk MCP if configured; otherwise route to `ds-mock`.
- Customization: Moderate.
- Nice-to-haves: Drilldowns + Tokens/filters.

---

## 7. `--autopilot` behavior

- Runs the full pipeline end-to-end without interactive prompts.
- Each stage logs a concise summary to stdout and writes its output to the workspace.
- On any error, autopilot halts, prints the stage name, leaves state on disk, and instructs the user how to resume.
- `ds-validate` failures block deploy; user must manually run `ds-update` and re-validate.
- `ds-review` always runs at the end. Its findings are informational — they do not block.

---

## 8. Standalone usage

Four skills are designed to work outside a workspace:

| Skill | Standalone invocation | Behavior |
|---|---|---|
| `ds-syntax` | `/ds-syntax <topic>` | Answers questions about Dashboard Studio JSON syntax |
| `ds-viz` | `/ds-viz <vizType>` | Returns options and examples for a viz type |
| `ds-review` | `/ds-review <path>` | Audits an arbitrary dashboard file |
| `ds-update` | `/ds-update <path> "<change>"` | Modifies an arbitrary dashboard file |

The remaining eight skills require an active workspace.

---

## 9. Deferred / future work

- Integration with a future dedicated synthetic-data plugin (rename of `fake-data` scope).
- Phase 2 of `ds-design`: live mock-data preview inside the wireframe editor.
- Phase 3 of `ds-design`: inline SPL editing per panel.
- `ds-diff` — compare two dashboard versions.
- `ds-migrate` — if scope ever expands to convert Classic Simple XML to Dashboard Studio.

---

## 10. Open questions

None blocking at spec approval. Any additional detail is handled in the implementation plan (next step).
