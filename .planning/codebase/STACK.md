# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- Markdown — Plugin skill definitions, reference documentation, templates (225+ skill `.md` files across four plugins)
- Python 3.11+ — Dashboard Studio automation module (`plugins/splunk-dashboard-studio/src/splunk_dashboards/`), utility scripts, test suite
- JavaScript (ES5) — Splunk custom visualization source code (`visualization_source.js` per viz, shared `theme.js`)

**Secondary:**
- Bash — Build and validation scripts (`plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh`, `vp-viz/scripts/validate_viz.sh`)
- JSON — Dashboard Studio JSON output format, plugin manifests (`plugin.json`, `marketplace.json`)
- XML — Splunk app views and navigation (`default/data/ui/views/*.xml`, `default/data/ui/nav/default.xml`)
- INI/conf — Splunk configuration files (`app.conf`, `visualizations.conf`, `savedsearches.conf`, `transforms.conf`)

## Runtime

**Environment:**
- Node.js v25.9.0 (system) — JavaScript build tooling only; not a server runtime
- Python 3.11+ (required by `pyproject.toml`) — automation module and tests; system Python 3.9.6 present

**Package Manager:**
- npm — Used only for test/build scaffolds in test visualization projects (lockfiles present in test dirs)
- pip — Python dependency management for `splunk-dashboard-studio` automation module
- Lockfile: `package-lock.json` present in test scaffold dirs (e.g., `test13_tuning/porsche_taycan_viz/package-lock.json`); no lockfile at repo root

## Frameworks

**Core:**
- Claude Code Plugin SDK — Plugin installation via `/install-plugin` command; manifest schema `https://anthropic.com/claude-code/marketplace.schema.json`
- Splunk Dashboard Studio v2 — Target deployment platform; dashboards written as JSON
- Splunk AppInspect — Target validation framework for packaged custom viz apps

**Testing (Python):**
- pytest — Test runner, configured in `plugins/splunk-dashboard-studio/pyproject.toml`, testpaths set to `tests/`

**Build/Dev:**
- webpack 5 — ES5-targeting AMD bundler for Splunk custom vizs (`webpack ^5.90.0`); used in test scaffolds and referenced in skill instructions
- `build_flat.js` — Custom flat AMD builder (no webpack); inlines `theme.js` into each viz. Canonical source at `plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js`, copied to `vp-create/scripts/build_flat.js`
- setuptools 68+ — Python package build backend for `splunk-dashboard-studio` module

## Key Dependencies

**Critical:**
- `webpack ^5.90.0` + `webpack-cli ^5.1.0` — Dev dependency for viz bundling (in test scaffolds; not in committed plugins dir)
- `setuptools>=68` — Python build backend
- `SplunkVisualizationBase` + `SplunkVisualizationUtils` — Splunk-provided AMD APIs; treated as externals in webpack and in flat builder; not installed via npm

**Infrastructure:**
- `api/SplunkVisualizationBase` — AMD external; base class every custom viz extends
- `api/SplunkVisualizationUtils` — AMD external; theme detection (`getCurrentTheme`) and formatting utilities
- `shared/theme.js` — Shared design token file per viz pack; inlined into each viz bundle at build time

## Configuration

**Environment:**
- No `.env` files or environment variables used by the plugin content itself
- Splunk instance connection (URL, credentials) is configured in the user's Splunk MCP server, not in this repo
- Python test configuration: `pyproject.toml` at `plugins/splunk-dashboard-studio/pyproject.toml`

**Build:**
- webpack config: `webpack.config.js` in test viz scaffold directories (e.g., `test13_tuning/porsche_taycan_viz/webpack.config.js`)
- Flat AMD build: `build_flat.js` invoked as `node build_flat.js [app_dir]`
- Splunk app packaging: `COPYFILE_DISABLE=1 tar czf <name>.tar.gz ...` — macOS resource fork stripping required

## Platform Requirements

**Development:**
- macOS (primary dev environment; `.DS_Store` files in repo, `xattr -rc` cleanup in history)
- Node.js (any recent LTS) for running `build_flat.js` and webpack
- Python 3.11+ for the automation module and tests
- Claude Code CLI, desktop, or IDE extension for plugin installation

**Production:**
- Splunk Enterprise or Splunk Cloud 10.2+ (primary target documented in plugin manifests)
- Splunk Cloud 10.4.2604 (Dashboard Studio schema documented in `docs/SplunkCloud-10.4.2604-DashStudio.txt`)
- Packaged custom viz apps delivered as `.tar.gz` tarballs installed via `splunk install app`

---

*Stack analysis: 2026-05-14*
