# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is a repo for creating a marketplace to store and create plugins that can be installed in claude and cursor.

## Plugin content language

All artifacts created for plugins in this repository MUST be written in English. This includes: skill definitions (SKILL.md), source code, code comments, CLI output, user-facing prompts, documentation, generated files, and test fixtures. Brainstorming and planning conversations with the user can be in any language, but every file committed to the repo as part of a plugin is English-only.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**splunk-knowledge — Plugin Marketplace**

A marketplace of Claude Code plugins for Splunk development — custom visualizations, dashboards, SPL queries, and admin tasks. The primary focus right now is **splunk-viz-packs** (v4.1.0): a plugin that generates branded Splunk custom visualization apps from a brand brief. The goal is to make every generated viz pack work on first build AND look like a professional designer made it.

**Core Value:** When a user runs `/vp-init`, the resulting viz pack installs in Splunk without errors and produces a dashboard that makes someone say "wait, that's Splunk?" — zero manual fixes, wow-factor by default.

### Constraints

- **ES5 only**: Splunk's RequireJS environment requires pure ES5 in viz source — no const, let, arrow functions, template literals
- **Canvas 2D**: All vizs render via HTML Canvas 2D API — no DOM-based rendering, no D3, no SVG inside vizs
- **AMD modules**: Built vizs must be AMD format (`define([...], function(...) {})`) — flat builder handles this
- **Splunk app structure**: Strict directory layout required (`appserver/static/visualizations/{name}/`)
- **macOS tar**: Must use `COPYFILE_DISABLE=1` to prevent resource fork corruption
- **Zero user deps**: Plugins must work with zero external dependencies for end users — no npm, Python, Node.js required. All tooling runs inside Claude Code during builds, with graceful fallback.
- **Plugin language**: All plugin artifacts must be in English (per CLAUDE.md)
- **SKILL.md < 500 lines**: Official best practice for Claude Code skill authoring
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Markdown — Plugin skill definitions, reference documentation, templates (225+ skill `.md` files across four plugins)
- Python 3.11+ — Dashboard Studio automation module (`plugins/splunk-dashboard-studio/src/splunk_dashboards/`), utility scripts, test suite
- JavaScript (ES5) — Splunk custom visualization source code (`visualization_source.js` per viz, shared `theme.js`)
- Bash — Build and validation scripts (`plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh`, `vp-viz/scripts/validate_viz.sh`)
- JSON — Dashboard Studio JSON output format, plugin manifests (`plugin.json`, `marketplace.json`)
- XML — Splunk app views and navigation (`default/data/ui/views/*.xml`, `default/data/ui/nav/default.xml`)
- INI/conf — Splunk configuration files (`app.conf`, `visualizations.conf`, `savedsearches.conf`, `transforms.conf`)
## Runtime
- Node.js v25.9.0 (system) — JavaScript build tooling only; not a server runtime
- Python 3.11+ (required by `pyproject.toml`) — automation module and tests; system Python 3.9.6 present
- npm — Used only for test/build scaffolds in test visualization projects (lockfiles present in test dirs)
- pip — Python dependency management for `splunk-dashboard-studio` automation module
- Lockfile: `package-lock.json` present in test scaffold dirs (e.g., `test13_tuning/porsche_taycan_viz/package-lock.json`); no lockfile at repo root
## Frameworks
- Claude Code Plugin SDK — Plugin installation via `/install-plugin` command; manifest schema `https://anthropic.com/claude-code/marketplace.schema.json`
- Splunk Dashboard Studio v2 — Target deployment platform; dashboards written as JSON
- Splunk AppInspect — Target validation framework for packaged custom viz apps
- pytest — Test runner, configured in `plugins/splunk-dashboard-studio/pyproject.toml`, testpaths set to `tests/`
- webpack 5 — ES5-targeting AMD bundler for Splunk custom vizs (`webpack ^5.90.0`); used in test scaffolds and referenced in skill instructions
- `build_flat.js` — Custom flat AMD builder (no webpack); inlines `theme.js` into each viz. Canonical source at `plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js`, copied to `vp-create/scripts/build_flat.js`
- setuptools 68+ — Python package build backend for `splunk-dashboard-studio` module
## Key Dependencies
- `webpack ^5.90.0` + `webpack-cli ^5.1.0` — Dev dependency for viz bundling (in test scaffolds; not in committed plugins dir)
- `setuptools>=68` — Python build backend
- `SplunkVisualizationBase` + `SplunkVisualizationUtils` — Splunk-provided AMD APIs; treated as externals in webpack and in flat builder; not installed via npm
- `api/SplunkVisualizationBase` — AMD external; base class every custom viz extends
- `api/SplunkVisualizationUtils` — AMD external; theme detection (`getCurrentTheme`) and formatting utilities
- `shared/theme.js` — Shared design token file per viz pack; inlined into each viz bundle at build time
## Configuration
- No `.env` files or environment variables used by the plugin content itself
- Splunk instance connection (URL, credentials) is configured in the user's Splunk MCP server, not in this repo
- Python test configuration: `pyproject.toml` at `plugins/splunk-dashboard-studio/pyproject.toml`
- webpack config: `webpack.config.js` in test viz scaffold directories (e.g., `test13_tuning/porsche_taycan_viz/webpack.config.js`)
- Flat AMD build: `build_flat.js` invoked as `node build_flat.js [app_dir]`
- Splunk app packaging: `COPYFILE_DISABLE=1 tar czf <name>.tar.gz ...` — macOS resource fork stripping required
## Platform Requirements
- macOS (primary dev environment; `.DS_Store` files in repo, `xattr -rc` cleanup in history)
- Node.js (any recent LTS) for running `build_flat.js` and webpack
- Python 3.11+ for the automation module and tests
- Claude Code CLI, desktop, or IDE extension for plugin installation
- Splunk Enterprise or Splunk Cloud 10.2+ (primary target documented in plugin manifests)
- Splunk Cloud 10.4.2604 (Dashboard Studio schema documented in `docs/SplunkCloud-10.4.2604-DashStudio.txt`)
- Packaged custom viz apps delivered as `.tar.gz` tarballs installed via `splunk install app`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Overview
## Python Conventions
### Naming Patterns
- `snake_case.py` — all module files use snake_case (e.g., `data_sources.py`, `workspace.py`)
- Prefix `test_` for test files (e.g., `test_validate.py`, `test_pipeline_build.py`)
- Internal helpers prefixed with `_` (e.g., `_cli`, `_collect_declared_tokens`, `_data_sources_path`)
- `PascalCase` for domain model classes and exceptions
- Examples: `WorkspaceState`, `DataSource`, `DataSources`, `Layout`, `Panel`, `Finding`, `Requirements`
- Custom exception classes: `InvalidStageTransition`, `StageAdvanceError`
- `snake_case` for all public functions
- `_snake_case` prefix for private/internal helpers
- Consistent verb prefixes: `check_*` for validators, `build_*` for constructors, `handle_*` for HTTP handlers, `save_*`/`load_*` for I/O, `init_*` for setup
- CLI entry point always named `_cli(argv=None) -> int`
- `snake_case` throughout
- Type-aliased literals use `PascalCase`: `Severity`, `HasData`, `Customization`, `Source`, `Theme`
- Constants: `UPPER_SNAKE_CASE` (e.g., `STAGES`, `GRID_UNIT_W`, `WORKSPACE_ROOT`, `BUILT_IN_TOKENS`)
- Full type annotations on all public functions (`-> return_type`)
- `from __future__ import annotations` at top of every source module
- `Optional[T]` for nullable fields (imported from `typing`)
- `list[T]` and `dict` as built-in generics (Python 3.11+)
- `Literal["a", "b"]` used to define constrained string types
### Module Structure Pattern
### Data Model Pattern
### Error Handling
- Raise domain-specific exception subclasses, never bare `Exception`: `InvalidStageTransition`, `StageAdvanceError`
- Use `FileNotFoundError` for missing workspace/file conditions (stdlib, not custom)
- HTTP handlers return `(status: int, body: str)` tuples — they do NOT raise; callers check status
- CLI functions return integer exit codes (0 = success, non-zero = failure), print errors to `stderr`
- Validators return `list[Finding]` — no exceptions raised; empty list = clean
### Import Organization
### Logging
### Comments
## JavaScript (Viz Pack) Conventions
### Naming Patterns
- `visualization_source.js` — canonical source file for each viz
- `visualization.js` — AMD bundle output (generated, not edited)
- `shared/theme.js` — brand-specific design token module (one per viz pack app)
- `camelCase` for all functions: `safeStr`, `safeNum`, `detectTheme`, `hexFromSplunk`, `withAlpha`, `lerpColor`, `roundRect`, `drawPanel`
- Verb prefix pattern: `draw*` for canvas rendering, `parse*` for parsing, `fmt*` for formatting, `get*` for lookups
- `var` declarations only (no `const`/`let`)
- Theme objects: `DARK`, `LIGHT` (UPPER_SNAKE_CASE)
- Font config: `FONTS` (UPPER_SNAKE_CASE)
### Formatter Conventions
- Use `{{VIZ_NAMESPACE}}` (not hardcoded namespace) in all `name=` attributes — enforced by `FAIL B10`
- Use `value=` (not `default=`) on form controls — enforced by `FAIL B7`
- Use `type="custom"` on `<splunk-color-picker>` — enforced by `FAIL B5`
- Set `themeMode` default to `"auto"` (not `"dark"`) — enforced by `FAIL B20`
- Include `section-label=` on every `<form>` — enforced by `FAIL B5`
### Canvas Viz Pattern
- `detectTheme()` call inside `updateView` — enforced by `FAIL B20`
- Null guards on all data fields using `safeStr(val)` / `safeNum(val, fallback)` — enforced by `FAIL B21`
- `this._lastGoodData` cache to preserve last valid render on empty updates
- Store field names in `this._fieldName` during `updateView` for use in event handlers (`_onClick`, `_onMouseMove`)
### Build Validation
## SKILL.md Conventions
- All SKILL.md files are written in **English** (repo-wide requirement per CLAUDE.md)
- Workflow sections use a checkbox task list for progress tracking
- Code examples are complete and runnable — no pseudocode
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
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
- Each plugin is a self-contained directory with `plugin.json` metadata and a `skills/` directory of instruction files (SKILL.md + supplementary .md files)
- Skills use a two-tier architecture: eagerly-loaded SKILL.md (lightweight index, ~130 lines) + lazily-loaded `rules/` or `references/` files loaded only when the specific topic is needed
- Cross-plugin dependencies are explicit: `splunk-viz-packs` depends on `splunk-spl` for SPL rules and `splunk-dashboard-studio` for dashboard JSON rules
- The `splunk-dashboard-studio` plugin includes a Python CLI (`src/splunk_dashboards/`) that automates workspace scaffolding and JSON generation; all other plugins are instruction-only
- Output artifacts (dashboard JSON, viz pack tarballs) are written to the repo root in test directories (`test##_<brand>/`) or to `.splunk-dashboards/` for persistent workspaces
## Layers
- Purpose: Claude Code entry point — maps plugin names to source paths
- Location: `.claude-plugin/marketplace.json`
- Contains: Plugin registry with name, description, source path, category
- Depends on: Nothing — pure metadata
- Used by: Claude Code `/install-plugin` command
- Purpose: Per-plugin identity and version declarations
- Location: `plugins/<plugin-name>/.claude-plugin/plugin.json`
- Contains: name, version, description, keywords, author
- Depends on: Nothing
- Used by: Claude Code plugin system
- Purpose: Tell Claude HOW to perform tasks — templates, rules, patterns, gotchas
- Location: `plugins/<plugin-name>/skills/<skill-name>/SKILL.md` (and supplementary `.md` files)
- Contains: YAML front-matter (name, description, when_to_use), procedures, templates, do/don't tables, code examples
- Depends on: Other skills via explicit "MUST LOAD" cross-references in SKILL.md
- Used by: Claude Code agent reads on demand during task execution
- Purpose: Deep reference material loaded only when needed — per-command docs, per-viz schemas, design patterns
- Location: `plugins/splunk-spl/reference/*.md`, `plugins/splunk-dashboard-studio/skills/ds-viz-*/`, `plugins/splunk-admin/reference/`
- Contains: Authoritative Splunk documentation (sourced from 10.2), schema definitions, design examples
- Depends on: Skills layer (referenced from SKILL.md "read on demand" sections)
- Used by: Claude agent loads specific files when SKILL.md directs it to
- Purpose: Automate mechanical parts of dashboard creation (workspace scaffolding, JSON assembly, linting, deployment packaging)
- Location: `plugins/splunk-dashboard-studio/src/splunk_dashboards/`
- Contains: `create.py`, `design.py`, `deploy.py`, `validate.py`, `workspace.py`, `requirements.py`, `layout.py`, `data_sources.py`
- Depends on: File system (reads/writes workspace under `.splunk-dashboard-studio/<project>/`)
- Used by: Claude agent invokes via `python3 -m splunk_dashboards.<module>` commands
- Purpose: Persists generated artifacts between sessions
- Location: `.splunk-dashboards/<project>/` (active workspaces), `test##_<brand>/` (test sessions)
- Contains: `requirements.md`, `state.json`, `data-sources.json`, `design/layout.json`, `dashboard.json`, `dashboard.xml`, `<app>.tar.gz`
- Depends on: Python CLI layer produces it; skills layer guides what goes in it
- Used by: Splunk (installs `.tar.gz` or `.xml`); next-session Claude reads state
## Data Flow
### Dashboard Studio Pipeline (ds-init → deploy)
### Viz Pack Pipeline (vp-init → tarball)
### Skill Resolution Flow
- Dashboard Studio pipeline state tracked in `.splunk-dashboards/<project>/state.json` with `current_stage` field
- Viz pack state is implicit — tracked by directory structure (source files exist → built; `.tar.gz` exists → packaged)
- No global state between plugins; cross-plugin rules are referenced by name in MUST-LOAD blocks
## Key Abstractions
- Purpose: Self-contained Claude Code extension with a specific Splunk domain
- Examples: `plugins/splunk-dashboard-studio/`, `plugins/splunk-viz-packs/`, `plugins/splunk-spl/`, `plugins/splunk-admin/`
- Pattern: `plugin.json` + `skills/` directory; optionally `src/`, `templates/`, `reference/`, `scripts/`
- Purpose: Named instruction unit that Claude loads to perform a specific task
- Examples: `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md`, `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md`
- Pattern: YAML front-matter (name, description, when_to_use) + markdown body with procedures, templates, checklists; supplementary `.md` files loaded on demand
- Purpose: Persistent project directory tracking pipeline state across sessions
- Examples: `.splunk-dashboards/data-center-pulse/`, `.splunk-dashboards/threat-pulse/`
- Pattern: `state.json` (current_stage), `requirements.md`, `data-sources.json`, `design/layout.json`, `dashboard.json`
- Purpose: Deployable Splunk app containing themed custom visualizations
- Examples: `test28_drilldown_tabs/cloudflare_noc/`, `test25_v4/hospital_nps_gauge/`
- Pattern: Standard Splunk app layout — `appserver/static/visualizations/<viz>/`, `default/`, `lookups/`, `metadata/`, `shared/theme.js`
- Purpose: Isolated sandbox capturing a complete build run against a real brand/prompt
- Examples: `test25_v4/`, `test26_full_pack/`, `test27_table/`, `test28_drilldown_tabs/`
- Pattern: `PROMPT.md` (input), `HANDOVER.md` (session notes), `<app>/` (output), `<app>.tar.gz`
## Entry Points
- Location: `.claude-plugin/marketplace.json`
- Triggers: User runs `/install-plugin lyderhansen/splunk-knowledge/plugins/<name>`
- Responsibilities: Routes Claude Code to the correct plugin directory
- Location: `plugins/splunk-dashboard-studio/skills/ds-init/SKILL.md` (or `ds-couture` for quick path)
- Triggers: User says "build a Splunk dashboard" or "new dashboard project"
- Responsibilities: Scopes project, creates workspace, routes to data → design → build pipeline
- Location: `plugins/splunk-viz-packs/skills/vp-init/SKILL.md`
- Triggers: User says "new viz pack", "build custom viz", "branded Splunk vizs"
- Responsibilities: Collects brand/tone/font/inventory, routes to design → code → build → package
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
### Hardcoded namespace in formatter
### Wrong Dashboard Studio viz type format
### Skipping MUST-LOAD skills before generating JSON
## Error Handling
- Python CLI exits non-zero on errors; stage stays at current value — Claude must fix before proceeding
- `ds-validate` catches structural errors (missing `name`, bad token refs, unknown data sources) before deploy
- `validate_viz.sh` catches formatter/JS code-rule violations (FAIL codes B1-B23, F1-F12, R1-R8) before packaging
- Skills include inline "STOP — read this first" sections for the highest-frequency failure modes
- `ds-ref-pitfalls` is a cross-skill traps matrix for runtime failures that the linter cannot catch
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
