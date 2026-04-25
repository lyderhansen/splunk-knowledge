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

### splunk-dashboards (v2.4.0)

A professional toolkit for Splunk Dashboard Studio (v2). It ships two layers:

1. **An action pipeline** — eleven skills that walk a project from scope to deployed dashboard.
2. **A granular reference library** — one skill per visualization type, one per interactivity concept, plus a viz-picker router and design-principles. The skill loader picks the smallest skill that matches the current task.

**Pipeline:**

```
ds-init ─▶ ds-data-explore | ds-mock ─▶ ds-design ─▶ ds-create ─▶ ds-validate ─▶ ds-deploy
                                                                          │
                                                          ds-review ◀─────┤
                                                          ds-update ◀─────┤
                                                          ds-critique ◀───┤
                                                          ds-polish ◀─────┘
```

**Pipeline skills** (workspace-aware, in `plugins/splunk-dashboards/skills/pipeline/`):

| Skill | Stage transition | Purpose |
|---|---|---|
| `ds-init` | → scoped | Scoping questions, requirements.md, workspace setup |
| `ds-data-explore` | scoped → data-ready | Draft SPL against real indexes (MCP-aware) |
| `ds-mock` | scoped → data-ready | Inline synthetic data via `makeresults` |
| `ds-design` | data-ready → designed | Local browser wireframe editor (Gridstack.js DnD) |
| `ds-create` | designed → built | Build Dashboard Studio JSON with optional theme |
| `ds-validate` | built → validated | Lint SPL, tokens, drilldowns, data-source refs |
| `ds-deploy` | validated → deployed | XML envelope + optional Splunk TA tarball |
| `ds-review` | (standalone) | Audit against best practices, write review.md |
| `ds-update` | (standalone) | Apply natural-language edits to any dashboard |
| `ds-critique` | (standalone) | Quantitative UX critique with persona-based testing |
| `ds-polish` | (standalone) | Final pre-ship pass: alignment, spacing, micro-detail |

**Reference library** (`plugins/splunk-dashboards/skills/`):

| Folder | Skills | Content |
|---|---|---|
| `reference/` | `ds-syntax`, `ds-design-principles`, `ds-viz` (legacy) | JSON schema, archetypes, chart-selection rationale, color/typography. `ds-viz` is the legacy monolithic per-viz reference and will be removed once content is migrated into `viz/`. |
| `viz/` | `ds-pick-viz` + 26 `ds-viz-<type>` | Router skill (intent → viz type) plus one skill per visualization (`ds-viz-line`, `ds-viz-sankey`, `ds-viz-markergauge`, `ds-viz-table`, etc.). |
| `interactivity/` | `ds-tokens`, `ds-inputs`, `ds-drilldowns`, `ds-tabs`, `ds-visibility`, `ds-defaults` | One skill per interactivity concept. |
| `design/` | (reserved) | Future split of `ds-design-principles` — out of scope today. |

> **Migration in progress (v2.4.0):** The 26 `viz/ds-viz-*` and 6 `interactivity/` skills are currently **stubs** (frontmatter + content placeholder). Until migration is complete, `reference/ds-viz/SKILL.md` is the authoritative per-viz reference. The router (`ds-pick-viz`) is fully functional today against the stub names.

**Themes** (via `ds-create --theme`):

- `clean` — minimal (default, no-op)
- `pro` — dark default
- `glass` — premium hero
- `exec` — editorial light
- `noc` — mission-control
- Legacy `clean`/`ops`/`soc` aliases still work.

Themes detect SPL semantics (failure / success / latency / count / volume / critical) and apply `majorColor` + sparklines automatically.

**Aurora design framework:**

The Aurora framework codifies professionally-tuned themes and six composition patterns that make generated dashboards look world-class while respecting Splunk's own design language. All native Dashboard Studio JSON — no CSS, no JS, Enterprise + Cloud compatible.

- **Patterns:** `card-kpi`, `hero-kpi`, `sparkline-in-kpi`, `compare-prev`, `annotations`, `section-zones`. Apply via `--pattern` or use the theme's default package.
- **Polish scorecard:** `ds-review` produces a weighted 0–10 score across 10 dimensions with actionable `ds-update` suggestions for gaps.

See `docs/superpowers/specs/2026-04-23-aurora-design-framework-design.md` for the full spec.

**Example flow:**

```bash
/ds-init                           # scope: "Monitor failed authentications"
/ds-mock                           # generate makeresults-based mock SPL
/ds-design launch my-dash          # browser wireframe editor
/ds-create build my-dash --title "Auth Monitor" --theme pro
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
├── .claude-plugin/marketplace.json   # Marketplace metadata
├── plugins/
│   └── splunk-dashboards/
│       ├── .claude-plugin/plugin.json
│       ├── skills/
│       │   ├── pipeline/             # 11 lifecycle skills
│       │   ├── reference/            # ds-syntax, ds-design-principles, ds-viz (legacy)
│       │   ├── viz/                  # ds-pick-viz + 26 ds-viz-<type> stubs
│       │   ├── interactivity/        # 6 interactivity stubs
│       │   └── design/               # (reserved, empty)
│       ├── src/splunk_dashboards/    # Python modules (stdlib only)
│       ├── templates/                # Bundled dashboard patterns
│       └── tests/                    # pytest tests
├── docs/superpowers/                  # Specs and plans
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
