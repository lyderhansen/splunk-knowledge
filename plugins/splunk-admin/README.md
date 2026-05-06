# splunk-admin

Splunk administration reference plugin for the [splunk-knowledge](https://github.com/lyderhansen/splunk-knowledge) marketplace.

## What's inside

| Skill | Type | Content |
|-------|------|---------|
| `sa-conf-files` | Eager | Config file gotchas, precedence rules, data pipeline mapping, restart matrix, index of all ~52 conf files |
| `sa-rest-api` | Eager | REST API gotchas, auth patterns, Cloud differences, cookbook, index of all endpoints |

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

### sa-rest-api

Triggers on any Splunk REST API usage. Includes:
- 10+ silent-fail traps ranked by frequency
- Authentication patterns (basic, session token, bearer)
- Cloud Platform differences
- Common operations cookbook
- Complete endpoint index with lazy references
