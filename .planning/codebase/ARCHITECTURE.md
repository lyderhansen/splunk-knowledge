<!-- refreshed: 2026-05-14 -->
# Architecture

**Analysis Date:** 2026-05-14

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Claude Code Plugin Marketplace                       │
│                    `.claude-plugin/marketplace.json`                     │
└──────────┬──────────────────┬───────────────────────┬───────────────────┘
           │                  │                        │                   │
           ▼                  ▼                        ▼                   ▼
┌──────────────────┐ ┌───────────────────┐ ┌────────────────────┐ ┌───────────────┐
│splunk-dashboard- │ │  splunk-viz-packs  │ │    splunk-spl      │ │ splunk-admin  │
│    studio        │ │  v4.1.0           │ │    v1.2.0          │ │ v1.1.0        │
│    v3.3.1        │ │`plugins/splunk-   │ │`plugins/splunk-spl`│ │`plugins/      │
│`plugins/splunk-  │ │  viz-packs/`      │ │                    │ │  splunk-admin`│
│  dashboard-      │ └───────────────────┘ └────────────────────┘ └───────────────┘
│  studio/`        │          │                       │
└──────────┬───────┘          │                       │
           │      depends on  │       depends on      │
           └──────────────────┘───────────────────────┘
                    ▼                        ▼
      ┌─────────────────────┐   ┌────────────────────────┐
      │ Dashboard Studio    │   │ Splunk viz pack         │
      │ JSON artifact       │   │ tarball (.tar.gz)       │
      │`.splunk-dashboards/ │   │`test##_<brand>/<app>/` │
      │  <project>/         │   │                        │
      │  dashboard.json`    │   │                        │
      └─────────────────────┘   └────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Marketplace index | Lists all plugins available for Claude Code install | `.claude-plugin/marketplace.json` |
| splunk-dashboard-studio plugin | End-to-end Dashboard Studio v2 JSON authoring (scope, data, design, build, validate, deploy) | `plugins/splunk-dashboard-studio/` |
| splunk-viz-packs plugin | Branded Canvas 2D custom viz app generation and packaging | `plugins/splunk-viz-packs/` |
| splunk-spl plugin | SPL syntax reference — silent-fail traps + per-command docs | `plugins/splunk-spl/` |
| splunk-admin plugin | Splunk administration reference — conf files, REST, CLI | `plugins/splunk-admin/` |
| Python CLI (dashboard-studio) | Scaffold workspaces, generate JSON, lint, deploy artifacts | `plugins/splunk-dashboard-studio/src/splunk_dashboards/` |
| Skills layer | Instruction files Claude reads to guide JSON/code generation | `plugins/*/skills/` |
| Test sessions | Per-test sandbox directories capturing real build output | `test##_<brand>/` |
| Active workspaces | Live dashboard JSON projects managed by ds-init pipeline | `.splunk-dashboards/` |
| Archive | Superseded plugin versions and backup snapshots | `archive/` |

## Pattern Overview

**Overall:** Plugin Marketplace with Progressive Skill Disclosure

**Key Characteristics:**
- Each plugin is a self-contained directory with `plugin.json` metadata and a `skills/` directory of instruction files (SKILL.md + supplementary .md files)
- Skills use a two-tier architecture: eagerly-loaded SKILL.md (lightweight index, ~130 lines) + lazily-loaded `rules/` or `references/` files loaded only when the specific topic is needed
- Cross-plugin dependencies are explicit: `splunk-viz-packs` depends on `splunk-spl` for SPL rules and `splunk-dashboard-studio` for dashboard JSON rules
- The `splunk-dashboard-studio` plugin includes a Python CLI (`src/splunk_dashboards/`) that automates workspace scaffolding and JSON generation; all other plugins are instruction-only
- Output artifacts (dashboard JSON, viz pack tarballs) are written to the repo root in test directories (`test##_<brand>/`) or to `.splunk-dashboards/` for persistent workspaces

## Layers

**Marketplace Layer:**
- Purpose: Claude Code entry point — maps plugin names to source paths
- Location: `.claude-plugin/marketplace.json`
- Contains: Plugin registry with name, description, source path, category
- Depends on: Nothing — pure metadata
- Used by: Claude Code `/install-plugin` command

**Plugin Metadata Layer:**
- Purpose: Per-plugin identity and version declarations
- Location: `plugins/<plugin-name>/.claude-plugin/plugin.json`
- Contains: name, version, description, keywords, author
- Depends on: Nothing
- Used by: Claude Code plugin system

**Skills Layer (Instruction Files):**
- Purpose: Tell Claude HOW to perform tasks — templates, rules, patterns, gotchas
- Location: `plugins/<plugin-name>/skills/<skill-name>/SKILL.md` (and supplementary `.md` files)
- Contains: YAML front-matter (name, description, when_to_use), procedures, templates, do/don't tables, code examples
- Depends on: Other skills via explicit "MUST LOAD" cross-references in SKILL.md
- Used by: Claude Code agent reads on demand during task execution

**Reference Layer (Lazy-loaded Data):**
- Purpose: Deep reference material loaded only when needed — per-command docs, per-viz schemas, design patterns
- Location: `plugins/splunk-spl/reference/*.md`, `plugins/splunk-dashboard-studio/skills/ds-viz-*/`, `plugins/splunk-admin/reference/`
- Contains: Authoritative Splunk documentation (sourced from 10.2), schema definitions, design examples
- Depends on: Skills layer (referenced from SKILL.md "read on demand" sections)
- Used by: Claude agent loads specific files when SKILL.md directs it to

**Python CLI Layer:**
- Purpose: Automate mechanical parts of dashboard creation (workspace scaffolding, JSON assembly, linting, deployment packaging)
- Location: `plugins/splunk-dashboard-studio/src/splunk_dashboards/`
- Contains: `create.py`, `design.py`, `deploy.py`, `validate.py`, `workspace.py`, `requirements.py`, `layout.py`, `data_sources.py`
- Depends on: File system (reads/writes workspace under `.splunk-dashboard-studio/<project>/`)
- Used by: Claude agent invokes via `python3 -m splunk_dashboards.<module>` commands

**Output / Workspace Layer:**
- Purpose: Persists generated artifacts between sessions
- Location: `.splunk-dashboards/<project>/` (active workspaces), `test##_<brand>/` (test sessions)
- Contains: `requirements.md`, `state.json`, `data-sources.json`, `design/layout.json`, `dashboard.json`, `dashboard.xml`, `<app>.tar.gz`
- Depends on: Python CLI layer produces it; skills layer guides what goes in it
- Used by: Splunk (installs `.tar.gz` or `.xml`); next-session Claude reads state

## Data Flow

### Dashboard Studio Pipeline (ds-init → deploy)

1. **Scope** — `ds-init` runs Q&A, invokes `python3 -m splunk_dashboards.requirements from-json` → writes `.splunk-dashboards/<project>/state.json` + `requirements.md`
2. **Data** — `ds-mock` or `ds-data-explore` writes `.splunk-dashboards/<project>/data-sources.json`, advances state to `data-ready`
3. **Design** — `ds-design` starts local Gridstack.js server, user edits layout, writes `.splunk-dashboards/<project>/design/layout.json`, state → `designed`
4. **Build** — `ds-create` reads `layout.json` + `data-sources.json`, invokes `python3 -m splunk_dashboards.create build`, writes `dashboard.json`, state → `built`
5. **Validate** — `ds-validate` runs `python3 -m splunk_dashboards.validate check`, reports errors/warnings, state → `validated`
6. **Deploy** — `ds-deploy` runs `python3 -m splunk_dashboards.deploy build`, writes `dashboard.xml` (+ optional `.tar.gz`), state → `deployed`

### Viz Pack Pipeline (vp-init → tarball)

1. **Init** — `vp-init` gathers brand/tone/font/inventory via Q&A, routes to `vp-design` or `vp-viz` directly
2. **Design** — `vp-design` produces per-viz design briefs with data contracts and Canvas rendering direction
3. **Code** — `vp-viz` writes `formatter.html`, `visualization_source.js`, `visualization.css` INLINE (no subagents) per the SKILL.md templates
4. **Build** — `vp-create` runs `node build_flat.js <app>` (inlines `shared/theme.js`), then `bash validate_viz.sh <app>`, generates app icons + preview PNGs
5. **Package** — `vp-create` produces `COPYFILE_DISABLE=1 tar czf <app>.tar.gz <app>` from parent directory; output at `test##_<brand>/<app>.tar.gz`

### Skill Resolution Flow

1. Claude receives a task (e.g., "build dashboard for Cloudflare NOC")
2. Claude reads `SKILL.md` for the entry-point skill (e.g., `ds-init`, `vp-init`)
3. SKILL.md's MUST-LOAD block lists additional skills to read before generating output
4. Claude reads each required skill's SKILL.md and any specified supplementary `.md` files
5. Claude invokes Python CLI commands as directed, then generates JSON/code inline using loaded skill patterns
6. Output is written to workspace or test directory

**State Management:**
- Dashboard Studio pipeline state tracked in `.splunk-dashboards/<project>/state.json` with `current_stage` field
- Viz pack state is implicit — tracked by directory structure (source files exist → built; `.tar.gz` exists → packaged)
- No global state between plugins; cross-plugin rules are referenced by name in MUST-LOAD blocks

## Key Abstractions

**Plugin:**
- Purpose: Self-contained Claude Code extension with a specific Splunk domain
- Examples: `plugins/splunk-dashboard-studio/`, `plugins/splunk-viz-packs/`, `plugins/splunk-spl/`, `plugins/splunk-admin/`
- Pattern: `plugin.json` + `skills/` directory; optionally `src/`, `templates/`, `reference/`, `scripts/`

**Skill:**
- Purpose: Named instruction unit that Claude loads to perform a specific task
- Examples: `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md`, `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md`
- Pattern: YAML front-matter (name, description, when_to_use) + markdown body with procedures, templates, checklists; supplementary `.md` files loaded on demand

**Workspace (dashboard-studio):**
- Purpose: Persistent project directory tracking pipeline state across sessions
- Examples: `.splunk-dashboards/data-center-pulse/`, `.splunk-dashboards/threat-pulse/`
- Pattern: `state.json` (current_stage), `requirements.md`, `data-sources.json`, `design/layout.json`, `dashboard.json`

**Viz Pack App (viz-packs):**
- Purpose: Deployable Splunk app containing themed custom visualizations
- Examples: `test28_drilldown_tabs/cloudflare_noc/`, `test25_v4/hospital_nps_gauge/`
- Pattern: Standard Splunk app layout — `appserver/static/visualizations/<viz>/`, `default/`, `lookups/`, `metadata/`, `shared/theme.js`

**Test Session:**
- Purpose: Isolated sandbox capturing a complete build run against a real brand/prompt
- Examples: `test25_v4/`, `test26_full_pack/`, `test27_table/`, `test28_drilldown_tabs/`
- Pattern: `PROMPT.md` (input), `HANDOVER.md` (session notes), `<app>/` (output), `<app>.tar.gz`

## Entry Points

**Marketplace install:**
- Location: `.claude-plugin/marketplace.json`
- Triggers: User runs `/install-plugin lyderhansen/splunk-knowledge/plugins/<name>`
- Responsibilities: Routes Claude Code to the correct plugin directory

**Dashboard pipeline start:**
- Location: `plugins/splunk-dashboard-studio/skills/ds-init/SKILL.md` (or `ds-couture` for quick path)
- Triggers: User says "build a Splunk dashboard" or "new dashboard project"
- Responsibilities: Scopes project, creates workspace, routes to data → design → build pipeline

**Viz pack start:**
- Location: `plugins/splunk-viz-packs/skills/vp-init/SKILL.md`
- Triggers: User says "new viz pack", "build custom viz", "branded Splunk vizs"
- Responsibilities: Collects brand/tone/font/inventory, routes to design → code → build → package

**Python CLI entry points:**
- Location: `plugins/splunk-dashboard-studio/src/splunk_dashboards/` — modules invoked as `python3 -m splunk_dashboards.<module>`
- Triggers: Claude invokes after reading ds-init, ds-create, ds-validate, ds-deploy skills
- Responsibilities: Mechanical scaffold and JSON generation; Claude writes the creative/design content

## Architectural Constraints

- **Inline code generation:** Viz code (formatter.html, visualization_source.js) MUST be written inline in the same Claude context — never dispatched to subagents (proven to cause 100% code-rule failure in tests 22a/22b)
- **ES5 only for viz JS:** visualization_source.js must use `var`, `function`, `require`/`module.exports` — no `const`, `let`, arrow functions, or template literals (Splunk's AMD loader requires ES5)
- **Namespace discipline:** Formatter `name=` attrs use `{{VIZ_NAMESPACE}}.key`; dashboard JSON options use `{app_id}.{viz_name}.key`; savedsearches.conf uses `display.visualizations.custom.{app_id}.{viz_name}.key`
- **Canvas minimum:** Dashboard Studio JSON must use `"width": 1920, "height": 1080` — no smaller canvas sizes
- **Tarball macOS:** Always `COPYFILE_DISABLE=1 tar czf` to prevent resource fork files breaking Splunk install
- **No jQuery in viz JS:** Dashboard Studio v2 does not expose `this.$el`; use `this.el` directly
- **Cross-plugin dependencies:** `splunk-viz-packs` requires `splunk-spl` for SPL and `splunk-dashboard-studio` for dashboard JSON; load explicitly before generating output

## Anti-Patterns

### Subagent dispatch for viz code

**What happens:** Claude dispatches a subagent to write `visualization_source.js` or `formatter.html`
**Why it's wrong:** Subagents lose the accumulated code-level rules from the parent context; every rule in `vp-viz/SKILL.md` is violated (proven in test22a and test22b — 100% code rule failure rate)
**Do this instead:** Write all viz code inline in the same context after loading `vp-viz/SKILL.md`

### Hardcoded namespace in formatter

**What happens:** `name="myapp.myviz.scoreField"` written directly in `formatter.html`
**Why it's wrong:** The hardcoded name breaks when the app is installed in a Splunk instance that resolves the namespace differently; settings silently never reach `updateView`
**Do this instead:** Always use `name="{{VIZ_NAMESPACE}}.scoreField"` — Splunk resolves the template at runtime

### Wrong Dashboard Studio viz type format

**What happens:** `"type": "custom"` or `"type": "custom.myapp.myviz"` written in dashboard JSON
**Why it's wrong:** These are Classic Simple XML formats; Dashboard Studio v2 silently renders nothing
**Do this instead:** `"type": "myapp.myviz"` — exactly `{app_id}.{viz_name}`, nothing else

### Skipping MUST-LOAD skills before generating JSON

**What happens:** Claude generates `dashboard.json` without reading `ds-viz-<type>` skills for the viz types used
**Why it's wrong:** Every viz type has unique option shapes, schema traps, and silent-fail patterns that cannot be inferred from training data
**Do this instead:** Read every `ds-viz-<type>/SKILL.md` listed in `ds-create`'s MUST-LOAD block before writing a single line of JSON

## Error Handling

**Strategy:** Explicit validation gates between pipeline stages — errors block advancement; warnings are reported but non-blocking

**Patterns:**
- Python CLI exits non-zero on errors; stage stays at current value — Claude must fix before proceeding
- `ds-validate` catches structural errors (missing `name`, bad token refs, unknown data sources) before deploy
- `validate_viz.sh` catches formatter/JS code-rule violations (FAIL codes B1-B23, F1-F12, R1-R8) before packaging
- Skills include inline "STOP — read this first" sections for the highest-frequency failure modes
- `ds-ref-pitfalls` is a cross-skill traps matrix for runtime failures that the linter cannot catch

## Cross-Cutting Concerns

**Logging:** No centralized logging; Python CLI prints to stdout; skills describe expected output format
**Validation:** Two-layer — structural (Python CLI `validate.py`) and visual (ds-couture Slop Test checklist)
**Authentication:** Not applicable — this is a local authoring tool; Splunk MCP server handles auth for real-data exploration in `ds-data-explore`

---

*Architecture analysis: 2026-05-14*
