# splunk-knowledge

A Claude Code plugin marketplace for Splunk. Four plugins covering dashboards, custom visualizations, SPL queries, and administration — from idea to deployed app.

## Install

```
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-dashboard-studio
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-viz-packs
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-spl
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-admin
```

## Plugins

### splunk-dashboard-studio v3.3.1

End-to-end toolkit for Splunk Dashboard Studio (v2). 63 skills across six families.

**Pipeline** — walks a project from scope to deploy:

```
ds-init → ds-data-explore / ds-mock → ds-design → ds-create → ds-validate → ds-deploy
                                                                    ↕
                                              ds-review · ds-update · ds-critique · ds-polish
```

| Family | Count | What it covers |
|---|---|---|
| Pipeline | 11 | Scope, data, wireframe, build, lint, deploy, review, update, critique, polish |
| Visualizations | 28 | One skill per viz type (`ds-viz-line`, `ds-viz-table`, `ds-viz-sankey`, ...) + `ds-viz-icon-library` + `ds-viz-infographic-shapes` + `ds-pick-viz` router |
| Interactivity | 6 | Tokens, inputs, drilldowns, tabs, visibility, defaults |
| Design references | 10 | Archetypes, color, typography, layout, visual encoding, anti-patterns, personas, brand, themes, references |
| Asset generation | 1 | `ds-svg` — custom SVG choropleth canvases (floor plans, rack diagrams, pipelines) + 30 icon exemplars |
| Design orchestration | 1 | `ds-couture` — design-first orchestrator with 17 hard rules |

**Key skills:**

- **ds-couture** — design-first orchestrator. Runs the Design Context Protocol (audience, tone, brand) before any JSON. Checks for enhanced viz apps. Enforces 17 hard rules + 3 composition principles (scale contrast, punch color, viz rhythm). Refuses to design in the dark.
- **ds-create** — builds the complete Dashboard Studio JSON from layout + data sources. MUST-LOAD gates ensure per-viz skills are read before writing.
- **ds-pick-viz** — routes from intent ("trend over time", "top N by category") to the right visualization type.
- **ds-viz-icon-library** — 2500+ Material Symbols icons via the `icon_library` Splunk app.
- **ds-viz-infographic-shapes** — 37 shapes with gradient fills, glow, shadow, and animations via the `infographic_shapes` Splunk app.

### splunk-viz-packs v5.3.0

Build fully themed Splunk custom visualization apps — branded viz suites with shared design tokens, Canvas 2D rendering, and AppInspect-ready packaging. Takes a brand brief (palette, fonts, tone) and produces installable Splunk apps with interactive dashboards.

| Family | Count | What it covers |
|---|---|---|
| Orchestration | 2 | `vp-init` (entry point), `vp-design` (brand context → viz suite plan) |
| Build | 2 | `vp-create` (scaffold + dashboard + package), `vp-viz` (per-viz Canvas source) |
| References | 2 | `vp-recipes` (Canvas 2D rendering recipes), `vp-debug` (error diagnosis flowchart) |

**What it generates:**

- Multi-viz themed apps (7-10 vizs per pack sharing one design system)
- Shared `theme.js` design tokens (dark/light mode, brand palette, series colors, font stacks)
- Interactive Dashboard Studio dashboards with drilldown token flows, input controls, and tabbed layouts
- Domain-specific viz types (SOC, healthcare, infrastructure, executive)
- Pure JS PNG assets (appIcon, preview silhouettes per viz type)
- Output: `.tar.gz` tarball ready for `splunk install app`

**Validation pipeline (195+ automated checks):**

- ES5 AST enforcement (acorn) — no const/let/arrow in viz source
- HTML DOM validation (cheerio) — formatter structure
- Dashboard JSON validation (DS1-DS5) — tab schema, background, title, drilldown token defaults
- WCAG AA contrast enforcement (4.5:1 ratio)
- Design quality gate (gradients, typography, spacing, hover effects)
- Automated repair loop for common violations

### splunk-spl v1.2.0

SPL (Search Processing Language) syntax reference. Two-layer architecture:

| Layer | Loaded | Content |
|---|---|---|
| **spl-gotchas** (skill) | Eagerly | 26 silent-fail traps + 151-command categorized index |
| **reference/** (152 files) | On demand | One file per SPL command + `command-types.md` performance guide |

All content sourced from Splunk Enterprise Search Reference 10.2.

**What it catches:**

- `spath output=` not `as` (silent wrong-column)
- `case()` needs explicit default (silent null)
- `matchValue` vs `rangeValue` in table formatting
- `sort` 10K default limit (silent truncation)
- `join` 50K subsearch limit
- Dotted field names need tick-quoting in `where`/`eval`

### splunk-admin v1.1.0

Splunk administration reference. Four skills covering the full admin surface:

| Skill | What it covers |
|---|---|
| **sa-conf-files** | All ~60 configuration files — gotchas, precedence rules, restart-vs-reload matrix |
| **sa-cli** | Every `splunk` CLI subcommand with flags and syntax |
| **sa-rest-api** | REST API reference — auth, endpoints across 14 categories |
| **sa-troubleshooting** | Internal logs, metrics.log, health checks, diagnostic SPL |

## Repository layout

```
splunk-knowledge/
├── plugins/
│   ├── splunk-dashboard-studio/      63 skills, v3.3.1
│   │   ├── skills/
│   │   │   ├── ds-init .. ds-polish    pipeline (11)
│   │   │   ├── ds-viz-*                visualizations (28)
│   │   │   ├── ds-int-*                interactivity (6)
│   │   │   ├── ds-ref-*                design references (10)
│   │   │   ├── ds-svg/                 SVG generator
│   │   │   └── ds-couture/             design orchestrator
│   │   └── _schemas/                   28 viz JSON schemas
│   ├── splunk-viz-packs/              6 skills, v5.3.0
│   │   └── skills/
│   │       ├── vp-init/                entry point
│   │       ├── vp-design/              brand → viz suite plan
│   │       ├── vp-viz/                 per-viz Canvas source + validators
│   │       ├── vp-create/              scaffold + dashboard + package
│   │       ├── vp-recipes/             Canvas 2D rendering recipes
│   │       └── vp-debug/               error diagnosis flowchart
│   ├── splunk-spl/                    2 skills + 152 reference files, v1.2.0
│   │   ├── skills/
│   │   │   ├── spl-init/               entry point + router
│   │   │   └── spl-gotchas/            26 traps + command index
│   │   └── reference/                  per-command markdown files
│   └── splunk-admin/                  4 skills, v1.1.0
│       └── skills/
│           ├── sa-conf-files/           configuration file reference
│           ├── sa-cli/                  CLI command reference
│           ├── sa-rest-api/             REST API reference
│           └── sa-troubleshooting/      diagnostics + debugging
├── .claude-plugin/marketplace.json
├── CLAUDE.md
└── README.md
```

## Requirements

- Claude Code (CLI, desktop, or IDE extension)
- Optionally: Splunk MCP server for real-data exploration in `ds-data-explore`
- Optionally: `icon_library` + `infographic_shapes` Splunk apps for enhanced dashboard visuals

## License

MIT

## Author

Lyder Hansen ([@lyderhansen](https://github.com/lyderhansen))
