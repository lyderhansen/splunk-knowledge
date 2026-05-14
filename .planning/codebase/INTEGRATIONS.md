# External Integrations

**Analysis Date:** 2026-05-14

## APIs & External Services

**Splunk MCP Server:**
- Service: Splunk MCP (Model Context Protocol) — custom MCP server connecting Claude Code to a live Splunk instance
- Purpose: Real-data exploration (`ds-data-explore`), dashboard creation/update, query execution
- MCP tools used: `splunk_run_query`, `splunk_create_dashboard`, `splunk_update_dashboard`, `splunk_get_dashboard`, `splunk_list_dashboards`, `splunk_list_apps`, `splunk_get_app`, `splunk_get_info`
- Integration point: Referenced in skill `.md` files and `.claude/settings.local.json` permission list
- Optional: All plugin skills have a "no-MCP" fallback path using mock data

**Splunk REST API:**
- Service: Splunk Enterprise / Splunk Cloud REST API (port 8089 by default)
- Purpose: Documented as reference in `plugins/splunk-admin/` skills; used indirectly via MCP tools
- Auth: Token-based or username/password; credentials held in MCP server config, not in this repo
- Reference: `plugins/splunk-admin/skills/sa-rest-api/SKILL.md`

**Claude Code Plugin Marketplace:**
- Service: Anthropic Claude Code plugin registry
- Purpose: Plugin discovery and installation via `/install-plugin lyderhansen/splunk-knowledge/plugins/<name>`
- Schema: `https://anthropic.com/claude-code/marketplace.schema.json` (validated by `marketplace.json`)
- Manifest: `.claude-plugin/marketplace.json` (repo root), per-plugin `plugin.json` files

**GitHub:**
- Service: GitHub (`github.com/lyderhansen/splunk-knowledge`)
- Purpose: Repository hosting and plugin source distribution
- API: `gh` CLI used for PR management (referenced in `.claude/settings.local.json`)
- Domains whitelisted: `api.github.com`, `raw.githubusercontent.com`

**Splunk UI / Documentation Sites:**
- `splunkui.splunk.com` — Splunk visualization component schema source (fetched during schema extraction)
- `docs.splunk.com` — Splunk product documentation
- `registry.npmjs.org` — npm package metadata queries (e.g., `@splunk/visualizations` version info)
- Both `splunkui.splunk.com` and `docs.splunk.com` are in the `WebFetch` allowlist in `.claude/settings.local.json`

## Data Storage

**Databases:**
- None — no database used. All data is in flat files (Markdown, JSON, conf).

**File Storage:**
- Local filesystem — Plugin content (skills, references, schemas) stored as Markdown files under `plugins/`
- Workspace state — Dashboard Studio pipeline state stored in project-local JSON files at `.splunk-dashboards/<project>/` (gitignored)
- Dashboard output — Generated JSON stored in workspace dir; packaged as `.tar.gz` for Splunk deployment

**Caching:**
- None — no caching layer. Skill files are read directly from disk.

## Authentication & Identity

**Auth Provider:**
- None in this repo — authentication is entirely delegated to the Splunk MCP server (user-configured separately)
- Plugin content itself requires no authentication to read or install

## Monitoring & Observability

**Error Tracking:**
- None — no error tracking service integrated

**Logs:**
- Python: `print()` to stdout in CLI tools (`src/splunk_dashboards/*.py` when run as `__main__`)
- Bash: `echo` to stdout in `validate_viz.sh`
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- GitHub — source hosting and distribution
- No CI/CD pipeline configured (no `.github/workflows/`, no `Makefile` with deploy targets)

**CI Pipeline:**
- Not detected — tests run manually via `PYTHONPATH=src python3 -m pytest tests/`

**Plugin Deployment:**
- Users install via Claude Code CLI: `/install-plugin lyderhansen/splunk-knowledge/plugins/<plugin-name>`
- Custom viz apps deployed to Splunk via: `COPYFILE_DISABLE=1 tar czf <app>.tar.gz <app_dir>` then `splunk install app` or MCP `splunk_create_dashboard`

## Environment Configuration

**Required env vars:**
- None required by the repo itself
- Splunk MCP server requires: Splunk instance URL, Splunk credentials (configured outside this repo in the user's MCP config)

**Secrets location:**
- Not stored in this repo; Splunk credentials live in the MCP server configuration on the user's machine

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None — all Splunk communication is initiated by Claude Code via MCP tool calls, not by webhooks

## Optional Splunk App Dependencies

**`icon_library` Splunk app:**
- Purpose: 2500+ Material Symbols icons via embedded font; air-gap safe
- Required by: `ds-viz-icon-library` skill in `plugins/splunk-dashboard-studio/`
- Install: separate Splunk app; not included in this repo

**`infographic_shapes` Splunk app:**
- Purpose: 37 PowerPoint-style shapes with gradient, glow, shadow, animation via Canvas 2D
- Required by: `ds-viz-infographic-shapes` skill in `plugins/splunk-dashboard-studio/`
- Install: separate Splunk app; not included in this repo

**`splunk-custom-visualizations` repo:**
- Purpose: Build infrastructure for custom viz packs (referenced in `splunk-viz-packs` README)
- Required by: `vp-create` / `vp-viz` skills when building full viz packs
- Location: separate Git repo at `splunk-custom-visualizations/`; not a submodule of this repo

---

*Integration audit: 2026-05-14*
