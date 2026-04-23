# splunk-knowledge

A Claude Code plugin marketplace for authoring Splunk artifacts end-to-end. Currently hosts **splunk-dashboards** — a complete workflow for building, validating, and deploying Splunk Dashboard Studio dashboards from idea to installable app.

## Install

In Claude Code:

```
/plugin marketplace add lyderhansen/splunk-knowledge
/plugin install splunk-dashboards@splunk-knowledge
```

To pull updates later:

```
/plugin marketplace update splunk-knowledge
```

## Plugins

### splunk-dashboards (v0.10.0)

Guided authoring of Splunk Dashboard Studio (v2) dashboards. Thirteen skills covering the full lifecycle, plus a theme engine that styles generated dashboards with semantic colors and KPI tiles.

**Pipeline:**

```
ds-init ──▶ ds-data-explore | ds-mock ──▶ ds-template (opt.) ──▶ ds-design
              │                                                      │
              ▼                                                      ▼
            data-ready                                            designed
                                                                      │
                                                                      ▼
                                                                   ds-create
                                                                      │
                                                                      ▼
                                                                    built
                                                                      │
                                                                      ▼
                                                                  ds-validate
                                                                      │
                                                                      ▼
                                                                  validated
                                                                      │
                                                                      ▼
                                                                   ds-deploy
                                                                      │
                                                                      ▼
                                                                   deployed
                                                                      │
                                                                      ▼
                                                                   ds-review ──┐
                                                                               │
                                                                   ds-update ◀─┘
```

**Pipeline skills (workspace-aware):**

| Skill | Stage transition | Purpose |
|---|---|---|
| `ds-init` | → scoped | Scoping questions, requirements.md, workspace setup |
| `ds-data-explore` | scoped → data-ready | Draft SPL against real indexes (MCP-aware) |
| `ds-mock` | scoped → data-ready | Inline synthetic data via `makeresults` |
| `ds-template` | (no advance) | Seed layout from a bundled pattern |
| `ds-design` | data-ready → designed | Local browser wireframe editor (Gridstack.js DnD) |
| `ds-create` | designed → built | Build Dashboard Studio JSON with optional theme |
| `ds-validate` | built → validated | Lint SPL, tokens, drilldowns, data-source refs |
| `ds-deploy` | validated → deployed | XML envelope + optional Splunk TA tarball |
| `ds-review` | (standalone) | Audit against best practices, write review.md |
| `ds-update` | (standalone) | Apply natural-language edits to any dashboard |

**Reference skills (standalone):**

| Skill | Content |
|---|---|
| `ds-syntax` | Dashboard Studio JSON schema — dataSources (ds.search / ds.chain / ds.test / savedSearch), inputs, drilldowns, tabbed + grid layouts, Dynamic Options Syntax, token filters, color palette |
| `ds-viz` | All 27 visualization types with per-type options + shared options library (AXES / LEGEND / SERIES / etc.) |
| `ds-design-principles` | Four dashboard archetypes, layout principles, KPI sizing, chart-selection decision table (21 rows), 10 common antipatterns |

**Themes** (via `ds-create --theme`):

- `clean` — minimal (default, no-op)
- `soc` — security-ops palette, red/amber/green semantics, sparklines on KPIs, auto header panel
- `ops` — cool-blue operations with traffic-light semantics
- `exec` — muted executive with subtle critical-state accents

Themes detect SPL semantics (failure / success / latency / count / volume / critical) and apply `majorColor` + sparklines automatically.

**Aurora design framework (v0.10.0+):**

The Aurora framework codifies four professionally-tuned themes and six composition patterns that make generated dashboards look world-class while respecting Splunk's own design language. All native Dashboard Studio JSON — no CSS, no JS, Enterprise + Cloud compatible.

- **Themes:** `pro` (dark default), `glass` (premium hero), `exec` (editorial light), `noc` (mission-control). Legacy `clean`/`ops`/`soc` aliases still work.
- **Patterns:** `card-kpi`, `hero-kpi`, `sparkline-in-kpi`, `compare-prev`, `annotations`, `section-zones`. Apply via `--pattern` or use the theme's default package.
- **Polish scorecard:** `ds-review` produces a weighted 0–10 score across 10 dimensions with actionable `ds-update` suggestions for gaps.

See `docs/superpowers/specs/2026-04-23-aurora-design-framework-design.md` for the full spec.

**Example flow:**

```bash
# After installing the plugin in Claude Code:
/ds-init                           # scope: "Monitor failed authentications"
/ds-mock                           # generate makeresults-based mock SPL
/ds-template load security-monitoring --project my-dash
/ds-design launch my-dash          # browser wireframe editor
/ds-create build my-dash --title "Auth Monitor" --theme soc
/ds-validate check my-dash
/ds-deploy build my-dash --label "Auth Monitor" --as-app
```

You end up with `dashboard.xml` and a `my_dash.tar.gz` Splunk TA in `./.splunk-dashboards/my-dash/`.

## Requirements

- Python 3.9+ (system Python works — no external dependencies)
- A browser (for `ds-design`'s local wireframe editor)
- Optionally: Splunk MCP server for real-data exploration in `ds-data-explore`

## Repository layout

```
splunk-knowledge/
├── .claude-plugin/marketplace.json   # Marketplace metadata (used by /plugin marketplace add)
├── plugins/
│   └── splunk-dashboards/            # The plugin
│       ├── .claude-plugin/plugin.json
│       ├── skills/                   # 13 SKILL.md files
│       ├── src/splunk_dashboards/    # Python modules (stdlib only)
│       ├── templates/                # Bundled dashboard patterns
│       └── tests/                    # 105 pytest tests
├── docs/superpowers/
│   ├── specs/                        # Design specs
│   └── plans/                        # Sub-plan implementation documents
└── CLAUDE.md                          # Repo policies
```

## Development

Tests run on stdlib Python — no venv needed:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

All plugin artifacts are authored in English (see `CLAUDE.md`). Brainstorming / planning can happen in any language.

## License

MIT.

## Author

Lyder Hansen ([@lyderhansen](https://github.com/lyderhansen))
