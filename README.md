# splunk-knowledge

A Claude Code plugin marketplace for Splunk. Two plugins that cover dashboards and SPL — from idea to deployed app.

## Install

```
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-dashboards
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-spl
```

## Plugins

### splunk-dashboards v2.9.0

End-to-end toolkit for Splunk Dashboard Studio (v2). 60+ skills across five families.

**Pipeline** — walks a project from scope to deploy:

```
ds-init → ds-data-explore / ds-mock → ds-design → ds-create → ds-validate → ds-deploy
                                                                    ↕
                                              ds-review · ds-update · ds-critique · ds-polish
```

| Family | Count | What it covers |
|---|---|---|
| Pipeline | 11 | Scope, data, wireframe, build, lint, deploy, review, update, critique, polish |
| Visualizations | 26 | One skill per viz type (`ds-viz-line`, `ds-viz-table`, `ds-viz-sankey`, ...) + `ds-pick-viz` router |
| Interactivity | 6 | Tokens, inputs, drilldowns, tabs, visibility, defaults |
| Design references | 10 | Archetypes, color, typography, layout, visual encoding, anti-patterns, personas, brand, themes, references |
| Asset generation | 1 | `ds-svg` — custom SVG icons, logos, choropleth canvases (floor plans, rack diagrams, pipelines) |

**Key skills:**

- **ds-couture** — design-first orchestrator. Runs the Design Context Protocol (audience, tone, brand) before any JSON. Routes to the 10 ds-ref-* design references. Enforces 15 hard rules (layout, shadows, palette, typography, axis labels, dataSource naming). Refuses to design in the dark.
- **ds-svg** — generates custom SVGs for dashboards. Icons for `singlevalueicon`, images for `splunk.image`, data-driven canvases for `splunk.choropleth.svg`. Inherits palette from ds-couture. Includes 30 icon exemplars, 14-category taxonomy, and 5 choropleth canvas templates.
- **ds-create** — builds the complete Dashboard Studio JSON from layout + data sources. MUST-LOAD gates ensure per-viz skills are read before writing.
- **ds-pick-viz** — routes from intent ("trend over time", "top N by category") to the right visualization type.

**Absolute layout + shadow rectangles are the design system defaults.** Grid layout and no-shadows are only valid if the user explicitly requests them.

### splunk-spl v1.0.0

SPL (Search Processing Language) syntax reference. Two-layer architecture:

| Layer | Loaded | Content |
|---|---|---|
| **spl-gotchas** (skill) | Eagerly | 21 silent-fail traps + 151-command categorized index |
| **reference/** (150 files) | On demand | One file per SPL command — syntax, parameters, examples, gotchas |

All content sourced from Splunk Enterprise Search Reference 10.2.0.

**What it catches:**

- `spath output=` not `as` (silent wrong-column)
- `case()` needs explicit default (silent null)
- `matchValue` vs `rangeValue` in table formatting
- `sort` 10K default limit (silent truncation)
- `join` 50K subsearch limit
- Dotted field names need tick-quoting in `where`/`eval`

**Includes:**
- `command-types.md` — performance classification guide (distributable streaming, centralized streaming, generating, transforming, orchestrating, dataset processing)
- Commands marked REMOVED or DEPRECATED in 10.2 (`audit`, `datamodelsimple`, `tscollect`)
- New 10.2 features: `eval` bitwise/type functions, `stats` 15 new aggregation functions, `join` SQL-style dataset syntax

## Repository layout

```
splunk-knowledge/
├── plugins/
│   ├── splunk-dashboards/          60+ skills, v2.9.0
│   │   ├── skills/
│   │   │   ├── ds-init .. ds-polish    pipeline (11)
│   │   │   ├── ds-viz-*                visualizations (26)
│   │   │   ├── ds-int-*                interactivity (6)
│   │   │   ├── ds-ref-*                design references (10)
│   │   │   ├── ds-svg/                 SVG generator (4 files)
│   │   │   ├── ds-couture/             design orchestrator
│   │   │   └── ds-pick-viz/            viz router
│   │   └── _schemas/                   28 viz JSON schemas
│   └── splunk-spl/                 150 reference files, v1.0.0
│       ├── skills/spl-gotchas/         eagerly-loaded traps + index
│       └── reference/                  per-command markdown files
├── .claude-plugin/marketplace.json
├── CLAUDE.md
└── README.md
```

## Requirements

- Claude Code (CLI, desktop, or IDE extension)
- Optionally: Splunk MCP server for real-data exploration in `ds-data-explore`

## License

MIT

## Author

Lyder Hansen ([@lyderhansen](https://github.com/lyderhansen))
