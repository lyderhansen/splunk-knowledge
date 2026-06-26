# splunk-admin

Splunk administration reference plugin for the [splunk-knowledge](https://github.com/lyderhansen/splunk-knowledge) marketplace.

## What's inside

| Skill | Type | Content |
|-------|------|---------|
| `sa-conf-files` | Eager | Config file gotchas, precedence rules, data pipeline mapping, restart matrix, index of all ~52 conf files |
| `sa-cli` | Eager | Every `splunk` CLI subcommand with flags, syntax, and gotchas |
| `sa-rest-api` | Eager | REST API gotchas, auth patterns, Cloud differences, cookbook, index of all endpoints |
| `sa-troubleshooting` | Eager | Internal logs, metrics.log, health checks, common error patterns, diagnostic SPL |
| `sa-ucc` | Eager | UCC Framework add-on development — globalConfig, inputs/config pages, build/package; lazy references for OAuth, alert actions, custom UI, advanced patterns |
| `sa-ui-toolkit` | Eager | Splunk UI Toolkit (SUIT) — `@splunk/create`, Unified Dashboard Framework, custom React visualizations, `@splunk/react-ui`; lazy references for UDF, custom viz, react-ui |

Plus ~52 lazy-loaded conf file references (`reference/conf/*.md`) and ~100+ REST endpoint references (`reference/rest/*.md`).

## Install

```
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-admin
```

## Source versions

- Config files: Splunk Enterprise Admin Manual 10.2.0 (2026-05-01)
- REST API: Splunk Enterprise REST API Reference 10.2

## Skills

### sa-conf-files

Triggers on any `.conf` file writing or editing. Includes:
- 12+ silent-fail traps ranked by frequency
- Configuration file precedence rules
- Data pipeline phase mapping
- Restart vs reload matrix
- Complete conf file index with lazy references

### sa-cli

Triggers on `splunk` CLI usage and shell-level administration. Includes:
- Every `splunk` subcommand with flags and syntax
- `btool` debugging patterns
- Start/stop, indexing, clustering, deployment, user management

### sa-rest-api

Triggers on any Splunk REST API usage. Includes:
- 10+ silent-fail traps ranked by frequency
- Authentication patterns (basic, session token, bearer)
- Cloud Platform differences
- Common operations cookbook
- Complete endpoint index with lazy references

### sa-troubleshooting

Triggers on Splunk errors and diagnostics. Includes:
- Internal log and `metrics.log` interpretation
- Health checks and common error patterns
- Diagnostic SPL queries

### sa-ucc

Triggers on UCC / add-on development (globalConfig, ucc-gen, modular inputs, TA packaging). Includes:
- Setup, init, build, and package workflow
- globalConfig structure — configuration tabs, inputs, entity field reference, validators
- Lazy references: `oauth.md`, `alert-actions.md`, `custom-ui.md`, `advanced.md`

### sa-ui-toolkit

Triggers on Splunk UI Toolkit (SUIT) / React app and custom viz work. Includes:
- `@splunk/create` scaffolding and packaging
- Unified Dashboard Framework (UDF) and Dashboard Studio vs Framework vs Classic guidance
- `@splunk/react-ui` components and theming
- Lazy references: `udf.md`, `custom-viz.md`, `react-ui.md`
