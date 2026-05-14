# Codebase Structure

**Analysis Date:** 2026-05-14

## Directory Layout

```
splunk-knowledge/
├── .claude-plugin/               # Marketplace metadata (Claude Code entry point)
│   └── marketplace.json          # Lists all 4 plugins with source paths
├── plugins/                      # All published plugins
│   ├── splunk-dashboard-studio/  # Dashboard Studio v2 authoring toolkit (v3.3.1)
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       # Plugin metadata + version
│   │   ├── skills/               # 60+ skill instruction files
│   │   │   ├── _schemas/         # 28 JSON schemas (one per viz type)
│   │   │   ├── ds-couture/       # Design orchestrator (DCP + Slop Test)
│   │   │   ├── ds-create/        # Dashboard JSON builder (SKILL.md with MUST-LOAD)
│   │   │   ├── ds-critique/      # Post-deploy critique skill
│   │   │   ├── ds-data-explore/  # Real-data Splunk MCP exploration
│   │   │   ├── ds-deploy/        # XML + TA tarball packaging
│   │   │   ├── ds-design/        # Gridstack.js wireframe editor
│   │   │   ├── ds-init/          # Pipeline entry point + scoping Q&A
│   │   │   ├── ds-int-defaults/  # Global time input / defaults block
│   │   │   ├── ds-int-drilldowns/ # Click handlers + linkToDashboard
│   │   │   ├── ds-int-inputs/    # Input widgets (5 valid types)
│   │   │   ├── ds-int-tabs/      # Multi-tab layout schema
│   │   │   ├── ds-int-tokens/    # Token system + multiselect
│   │   │   ├── ds-int-visibility/ # Conditional panel show/hide
│   │   │   ├── ds-mock/          # Fake data generation
│   │   │   ├── ds-pick-viz/      # Viz selection router
│   │   │   ├── ds-polish/        # Post-build visual polish
│   │   │   ├── ds-ref-anti-patterns/  # Anti-pattern catalog
│   │   │   ├── ds-ref-archetypes/     # Exec/ops/analytical/SOC archetypes
│   │   │   ├── ds-ref-brand/          # Brand-color collision rules
│   │   │   ├── ds-ref-color/          # Semantic palette + canvas tokens
│   │   │   ├── ds-ref-design-principles/ # Archetype + palette + Slop Test
│   │   │   ├── ds-ref-layout-grid/    # Grid constants + gradient bg
│   │   │   ├── ds-ref-personas/       # Audience persona library
│   │   │   ├── ds-ref-pitfalls/       # Cross-skill traps matrix
│   │   │   ├── ds-ref-references/     # External reference links
│   │   │   ├── ds-ref-syntax/         # Dashboard Studio JSON schema
│   │   │   ├── ds-ref-themes/         # Dark/light theme rules
│   │   │   ├── ds-ref-typography/     # Font rules + allowed fontFamily enum
│   │   │   ├── ds-ref-visual-encoding/ # Chart selection + data encoding
│   │   │   ├── ds-review/             # Audit against best practices
│   │   │   ├── ds-spl/                # SPL grammar embedded reference
│   │   │   ├── ds-svg/                # Custom SVG generator
│   │   │   ├── ds-update/             # Edit existing dashboard
│   │   │   ├── ds-validate/           # Dashboard JSON linter
│   │   │   ├── ds-viz-area/           # splunk.area viz skill
│   │   │   ├── ds-viz-bar/            # splunk.bar viz skill
│   │   │   ├── ds-viz-bubble/         # splunk.bubble viz skill
│   │   │   ├── ds-viz-choropleth-svg/ # splunk.choropleth.svg viz skill
│   │   │   ├── ds-viz-column/         # splunk.column viz skill
│   │   │   ├── ds-viz-ellipse/        # splunk.ellipse viz skill
│   │   │   ├── ds-viz-events/         # splunk.events viz skill
│   │   │   ├── ds-viz-fillergauge/    # splunk.fillergauge viz skill
│   │   │   ├── ds-viz-icon-library/   # icon_library.icon_library viz skill
│   │   │   ├── ds-viz-image/          # splunk.image viz skill
│   │   │   ├── ds-viz-infographic-shapes/ # infographic_shapes viz skill
│   │   │   ├── ds-viz-line/           # splunk.line viz skill
│   │   │   ├── ds-viz-linkgraph/      # splunk.linkgraph viz skill
│   │   │   ├── ds-viz-map/            # splunk.map viz skill
│   │   │   ├── ds-viz-markdown/       # splunk.markdown viz skill
│   │   │   ├── ds-viz-markergauge/    # splunk.markergauge viz skill
│   │   │   ├── ds-viz-parallelcoordinates/ # splunk.parallelcoordinates viz skill
│   │   │   ├── ds-viz-pie/            # splunk.pie viz skill
│   │   │   ├── ds-viz-punchcard/      # splunk.punchcard viz skill
│   │   │   ├── ds-viz-rectangle/      # splunk.rectangle viz skill
│   │   │   ├── ds-viz-sankey/         # splunk.sankey viz skill
│   │   │   ├── ds-viz-scatter/        # splunk.scatter viz skill
│   │   │   ├── ds-viz-singlevalue/    # splunk.singlevalue viz skill
│   │   │   ├── ds-viz-singlevalueicon/ # splunk.singlevalueicon viz skill
│   │   │   ├── ds-viz-singlevalueradial/ # splunk.singlevalueradial viz skill
│   │   │   ├── ds-viz-table/          # splunk.table viz skill
│   │   │   └── ds-viz-timeline/       # splunk.timeline viz skill
│   │   ├── src/
│   │   │   └── splunk_dashboards/     # Python CLI package
│   │   │       ├── __init__.py
│   │   │       ├── create.py          # dashboard.json builder
│   │   │       ├── data_sources.py    # data-sources.json I/O
│   │   │       ├── deploy.py          # XML + TA tarball packager
│   │   │       ├── design.py          # Gridstack.js server
│   │   │       ├── layout.py          # layout.json parser
│   │   │       ├── requirements.py    # requirements.md writer
│   │   │       ├── validate.py        # dashboard.json linter
│   │   │       └── workspace.py       # state.json manager
│   │   ├── scripts/                   # Utility scripts
│   │   │   ├── audit_data_source_names.py
│   │   │   ├── make_light.py
│   │   │   ├── qa_extract_queries.py
│   │   │   └── sanitize_data_source_names.py
│   │   ├── templates/                 # Dashboard input templates + examples
│   │   │   ├── ds-inputs.md
│   │   │   ├── ds-inputs-EXAMPLE-acme-ciso.md
│   │   │   ├── ds-inputs-EXAMPLE-faketshirt-retail.md
│   │   │   └── ds-inputs-EXAMPLE-fjellbryggeri-brewfloor.md
│   │   ├── test-dashboards/           # Shared reference test dashboard JSON
│   │   │   ├── interactivity/
│   │   │   ├── soc/
│   │   │   └── viz/                   # Per viz-type reference dashboards
│   │   ├── tests/                     # Python unit tests (pytest)
│   │   │   ├── test_create.py
│   │   │   ├── test_validate.py
│   │   │   ├── test_pipeline_build.py
│   │   │   └── ...
│   │   └── viz_packs/                 # Shared viz pack samples
│   │
│   ├── splunk-viz-packs/              # Custom viz app builder (v4.1.0)
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── skills/
│   │   │   ├── vp-init/               # Entry point — collects brand/tone/inventory
│   │   │   ├── vp-design/             # Art director — brand → viz briefs
│   │   │   │   └── references/
│   │   │   │       └── viz-pack-brief.md
│   │   │   ├── vp-viz/                # Canvas 2D code writer (inline only)
│   │   │   │   ├── references/
│   │   │   │   │   ├── viz-blueprints.md
│   │   │   │   │   ├── canvas-recipes.md
│   │   │   │   │   ├── conf-templates.md
│   │   │   │   │   └── theme-template.md
│   │   │   │   └── scripts/
│   │   │   │       ├── build_flat.js  # Flat AMD bundler (inlines theme.js)
│   │   │   │       └── validate_viz.sh # Rule validator (FAIL codes B/F/R/I/C)
│   │   │   ├── vp-create/             # Build + package
│   │   │   │   └── scripts/
│   │   │   │       ├── build_flat.js
│   │   │   │       └── validate_viz.sh
│   │   │   ├── vp-debug/              # Diagnosis flowchart
│   │   │   │   └── references/
│   │   │   ├── vp-recipes/            # Canvas 2D recipes + mood recipes
│   │   │   │   └── references/
│   │   │   │       ├── all-patterns.md
│   │   │   │       └── mood-recipes.md
│   │   │   └── vp-recipes/
│   │   └── templates/
│   │
│   ├── splunk-spl/                    # SPL reference (v1.2.0)
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── skills/
│   │   │   ├── spl-gotchas/           # Eagerly loaded — 26 traps + command index
│   │   │   └── spl-init/              # Entry point skill
│   │   └── reference/                 # 150+ per-command .md files (lazy-loaded)
│   │       ├── abstract.md
│   │       ├── append.md
│   │       ├── chart.md
│   │       ├── eval.md
│   │       ├── stats.md
│   │       └── ... (~150 files total)
│   │
│   └── splunk-admin/                  # Splunk admin reference (v1.1.0)
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── skills/
│       │   ├── sa-cli/
│       │   ├── sa-conf-files/
│       │   ├── sa-rest-api/
│       │   └── sa-troubleshooting/
│       ├── reference/
│       │   ├── cli/
│       │   ├── conf/
│       │   ├── rest/
│       │   └── troubleshooting/
│       └── scripts/
│
├── .planning/                         # GSD planning artifacts
│   └── codebase/                      # Codebase analysis documents
│
├── .splunk-dashboards/                # Active dashboard workspaces (ds-init pipeline)
│   ├── data-center-pulse/
│   ├── disney-plus-revenue/
│   ├── komplett-revenue/
│   └── threat-pulse/
│
├── test##_<brand>/                    # Test session outputs (numbered, 01-28+)
│   ├── PROMPT.md                      # Input prompt used for the test
│   ├── HANDOVER.md                    # Session notes + result assessment
│   ├── <app_name>/                    # Generated Splunk app (viz pack)
│   │   ├── appserver/static/visualizations/<viz>/
│   │   │   ├── formatter.html
│   │   │   ├── visualization.js       # Post-build flat AMD bundle
│   │   │   ├── visualization.css
│   │   │   └── preview.png
│   │   ├── default/                   # Splunk app config
│   │   ├── lookups/                   # Demo CSV data
│   │   ├── metadata/
│   │   └── shared/theme.js            # Shared design tokens
│   └── <app_name>.tar.gz              # Packaged Splunk app
│
├── archive/                           # Superseded versions + backups
│   └── splunk-dashboard-studio/
│       └── _backup/
│
├── docs/                              # Reference PDFs and converted text
│   ├── SplunkCloud-10.4.2604-DashStudio.pdf
│   ├── SplunkManual10.2.pdf
│   └── SplunkSearchManual10.2.md
│
├── scripts/                           # Repo-level utility scripts
│   ├── build-admin-conf-refs.py
│   └── generate_splunk_admin_conf_refs.py
│
├── logos/                             # Brand logos for test sessions
├── svgs/                              # SVG design explorations
├── dashboard-agent/                   # Experimental agent workspace
│
├── CLAUDE.md                          # Project instructions for Claude Code
└── README.md                          # Public-facing documentation
```

## Directory Purposes

**`plugins/`:**
- Purpose: The core of the repo — all published Claude Code plugins live here
- Contains: One subdirectory per plugin, each self-contained with `plugin.json`, `skills/`, and optionally `src/`, `reference/`, `scripts/`, `templates/`
- Key files: `plugins/splunk-dashboard-studio/`, `plugins/splunk-viz-packs/`, `plugins/splunk-spl/`, `plugins/splunk-admin/`

**`plugins/*/skills/`:**
- Purpose: Instruction files that Claude loads to guide task execution
- Contains: Named skill subdirectories, each with `SKILL.md` as the primary entry point
- Key files: Every `SKILL.md` is the lightweight index (~130 lines); supplementary `.md` files in `references/` are loaded on demand

**`plugins/splunk-dashboard-studio/src/splunk_dashboards/`:**
- Purpose: Python CLI package — automates the mechanical parts of dashboard creation
- Contains: Python modules for each pipeline stage
- Key files: `create.py` (201 lines — JSON assembly), `workspace.py` (119 lines — state management)

**`plugins/splunk-viz-packs/skills/vp-viz/scripts/`:**
- Purpose: Build tooling for viz pack apps
- Contains: `build_flat.js` (AMD bundler that inlines `shared/theme.js`), `validate_viz.sh` (rule validator)
- Key files: `build_flat.js`, `validate_viz.sh`

**`.splunk-dashboards/`:**
- Purpose: Persistent workspace storage for active ds-init pipeline projects
- Contains: One subdirectory per project with `state.json`, `requirements.md`, `data-sources.json`, `design/`, `dashboard.json`
- Generated: Yes, by Python CLI
- Committed: Yes — workspace state persists across sessions

**`test##_<brand>/`:**
- Purpose: Numbered test session directories capturing complete build runs
- Contains: `PROMPT.md`, `HANDOVER.md`, generated app directory, `.tar.gz`
- Key directories: `test25_v4/` through `test28_drilldown_tabs/` are the most recent passing tests
- Committed: Yes — used for regression reference

**`archive/`:**
- Purpose: Backup snapshots of superseded plugin versions
- Contains: Pre-refactor backups with timestamps
- Committed: Yes
- Note: Do not reference for current patterns — use `plugins/` only

## Key File Locations

**Entry Points:**
- `CLAUDE.md`: Project-level instructions for Claude Code (English-only rule, plugin scope)
- `.claude-plugin/marketplace.json`: Claude Code marketplace index — lists all 4 plugins
- `plugins/splunk-dashboard-studio/.claude-plugin/plugin.json`: Dashboard Studio plugin metadata (v3.3.1)
- `plugins/splunk-viz-packs/.claude-plugin/plugin.json`: Viz packs plugin metadata (v4.1.0)

**Pipeline Skills:**
- `plugins/splunk-dashboard-studio/skills/ds-init/SKILL.md`: Dashboard pipeline entry
- `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md`: JSON builder with MUST-LOAD block
- `plugins/splunk-dashboard-studio/skills/ds-couture/SKILL.md`: Design orchestrator
- `plugins/splunk-viz-packs/skills/vp-init/SKILL.md`: Viz pack pipeline entry
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md`: Canvas 2D code templates

**Critical Reference:**
- `plugins/splunk-spl/skills/spl-gotchas/SKILL.md`: 26 SPL silent-fail traps (eagerly loaded)
- `plugins/splunk-dashboard-studio/skills/ds-ref-pitfalls/SKILL.md`: Cross-skill traps matrix
- `plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md`: Dashboard JSON schema
- `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md`: Splunk app conf templates

**Build Scripts:**
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js`: Flat AMD bundler
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh`: Rule validator (FAIL B/F/R/I/C codes)
- `plugins/splunk-dashboard-studio/scripts/audit_data_source_names.py`: Data source name linter

**Testing:**
- `plugins/splunk-dashboard-studio/tests/test_create.py`: Dashboard JSON builder tests
- `plugins/splunk-dashboard-studio/tests/test_pipeline_build.py`: End-to-end pipeline tests
- `plugins/splunk-dashboard-studio/tests/test_validate.py`: Validator tests

## Naming Conventions

**Files:**
- Skill entry points: Always `SKILL.md` (uppercase)
- Supplementary skill files: `UPPERCASE.md` for primary references (e.g., `DOS-REFERENCE.md`, `CHART-SELECTION.md`)
- Python modules: `snake_case.py` (e.g., `create.py`, `data_sources.py`, `workspace.py`)
- Test files: `test_<module>.py` (e.g., `test_create.py`, `test_pipeline_build.py`)
- Generated Splunk config: Splunk conventions — `app.conf`, `visualizations.conf`, `transforms.conf`
- Viz source files: `visualization_source.js` (pre-build), `visualization.js` (post-build flat AMD)

**Directories:**
- Skills: `ds-<name>` (dashboard studio), `vp-<name>` (viz packs), `spl-<name>` (SPL), `sa-<name>` (admin)
- Skill sub-families: `ds-ref-*` (design references), `ds-int-*` (interactivity), `ds-viz-*` (per viz-type)
- Test sessions: `test##_<brand>` (zero-padded number + brand slug, e.g., `test28_drilldown_tabs`)
- Splunk app IDs: `snake_case` (e.g., `cloudflare_noc`, `hospital_nps_gauge`, `nike_training_club`)

**Plugin versions:**
- `plugin.json` `version` field uses semver (`major.minor.patch`)
- Increment `version` before every push of a new feature to main

## Where to Add New Code

**New dashboard-studio skill:**
- Implementation: `plugins/splunk-dashboard-studio/skills/ds-<name>/SKILL.md`
- If has supplementary docs: `plugins/splunk-dashboard-studio/skills/ds-<name>/<NAME>.md`
- Register: No registry file needed — Claude discovers skills by reading SKILL.md files

**New viz-type skill (ds-viz-*):**
- Implementation: `plugins/splunk-dashboard-studio/skills/ds-viz-<type>/SKILL.md`
- Add corresponding JSON schema: `plugins/splunk-dashboard-studio/skills/_schemas/<type>.md`
- Add test dashboard: `plugins/splunk-dashboard-studio/test-dashboards/viz/ds-viz-<type>/`

**New interactivity skill (ds-int-*):**
- Implementation: `plugins/splunk-dashboard-studio/skills/ds-int-<name>/SKILL.md`
- Update cross-reference: Add entry to `ds-create/SKILL.md` MUST-LOAD "Before adding interactivity" table

**New viz-packs skill:**
- Implementation: `plugins/splunk-viz-packs/skills/vp-<name>/SKILL.md`
- With references: `plugins/splunk-viz-packs/skills/vp-<name>/references/<NAME>.md`

**New SPL command reference:**
- Implementation: `plugins/splunk-spl/reference/<command>.md`
- Register in index: Add to `plugins/splunk-spl/skills/spl-gotchas/SKILL.md` command index

**New admin reference:**
- Conf files: `plugins/splunk-admin/reference/conf/<file>.md`
- REST endpoints: `plugins/splunk-admin/reference/rest/<endpoint>.md`

**New plugin:**
- Create: `plugins/<plugin-name>/.claude-plugin/plugin.json`
- Add skills: `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`
- Register: Add entry to `.claude-plugin/marketplace.json` `plugins[]` array

**New test session:**
- Directory: `test##_<brand>/` at repo root (increment number from highest existing test)
- Always include: `PROMPT.md` (the input prompt), `HANDOVER.md` (result notes)

## Special Directories

**`.claude/`:**
- Purpose: Claude Code workspace settings for this repo
- Contains: `settings.local.json`
- Generated: Partially (settings auto-generated by Claude Code)
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes, by GSD map-codebase command
- Committed: Yes

**`.splunk-dashboards/`:**
- Purpose: Active dashboard project workspaces (ds-init pipeline outputs)
- Generated: Yes, by Python CLI
- Committed: Yes — maintains state across sessions

**`.splunk-agent/`:**
- Purpose: Experimental Splunk agent workspace
- Generated: No
- Committed: Yes

**`archive/`:**
- Purpose: Backup snapshots of plugin versions before major refactors
- Generated: Manually
- Committed: Yes — serves as rollback reference

**`docs/`:**
- Purpose: Source documentation (Splunk PDFs, converted text) used when building reference files
- Contains: Large PDFs and `.md` conversions of Splunk 10.2 and 10.4 documentation
- Generated: No (manually added)
- Committed: Yes

---

*Structure analysis: 2026-05-14*
