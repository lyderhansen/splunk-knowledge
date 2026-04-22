---
name: ds-template
description: Use this skill to seed a dashboard layout from a bundled pattern (SOC overview, ops health, security monitoring, API performance) instead of building from scratch. Runs before ds-design. Reads a bundled template JSON and writes it as design/layout.json under the workspace. Does not advance workspace state — ds-design still owns the data-ready to designed transition when the user finalizes the layout.
---

# ds-template — Load a bundled dashboard pattern

## When to use

Before `ds-design`, when the user answered "Customization: template" in `ds-init`, or when they want to start from a known-good shape rather than a blank canvas.

## Prerequisites

- Workspace exists (from `ds-init`).
- Workspace is at `current_stage=scoped` or `data-ready` — either is fine. `ds-template` seeds the layout but does not transition state.

## What it does

1. Reads a bundled template JSON from the plugin's `templates/` directory.
2. Writes it as `.splunk-dashboards/<project>/design/layout.json`.
3. Prints the template name, panel count, and the next recommended skill (`ds-design`).

## Bundled templates

| Name | Description |
|---|---|
| `soc-overview` | Security operations overview (events, alerts, top sources) |
| `ops-health` | Operational health (uptime, error rate, latency) |
| `security-monitoring` | Authentication and access monitoring (failed logins, geo distribution) |
| `api-performance` | API endpoint performance (throughput, latency percentiles) |

## How to invoke

List available templates:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.templates list
```

Load a template into an existing workspace:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.templates load soc-overview --project <project-name>
```

## After loading

- `design/layout.json` now contains the template's panels at their default positions.
- Workspace state is unchanged (still `scoped` or `data-ready`).
- Next step: `ds-design launch <project>` — opens the wireframe editor with the seeded layout pre-populated, so the user can tweak positions, titles, viz types, and bind panels to specific questions from `data-sources.json`.
