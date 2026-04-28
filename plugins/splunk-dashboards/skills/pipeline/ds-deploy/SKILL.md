---
name: ds-deploy
description: Use this skill to produce a deployable Splunk artifact from a validated dashboard.json. Writes dashboard.xml (Dashboard Studio v2 XML envelope with embedded JSON definition) to the workspace, and optionally packages the dashboard as a Splunk TA tarball with app.conf, metadata, and view files ready to install into Splunk. Advances workspace state from validated to deployed.
---

# ds-deploy — Produce a deployable Splunk artifact

## When to use

After `ds-validate` has confirmed the dashboard passes lint checks and state is `validated`. This is the last step before the dashboard lives in Splunk.

## What it produces

1. **`dashboard.xml`** (always) — the Dashboard Studio v2 XML envelope with the JSON definition embedded in a CDATA section. Can be pasted directly into Splunk's dashboard editor.
2. **`<app_name>.tar.gz`** (with `--as-app`) — a Splunk TA tarball containing:
   - `default/app.conf` — app metadata
   - `default/data/ui/views/<view_name>.xml` — the dashboard view
   - `metadata/default.meta` — permissions

Install the TA by dropping the tarball into `$SPLUNK_HOME/etc/apps/` (or using Splunk's UI install flow) and restarting Splunk.

## How to invoke

Plain XML (default):

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.deploy build <project-name> --label "My Dashboard"
```

As Splunk TA:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.deploy build <project-name> --label "My Dashboard" --as-app
```

## Flags

| Flag | Default | Purpose |
|---|---|---|
| `--label` (required) | — | Dashboard label (shown in Splunk UI) |
| `--theme` | `dashboard.json`'s theme | Override theme (`light` / `dark`) |
| `--as-app` | off | Also build a Splunk TA tarball |
| `--app-name` | project name | TA app directory name (dashes → underscores) |
| `--view-name` | project name | View file basename inside the TA |

## After deploying

- `dashboard.xml` ready to paste / install.
- (If `--as-app`) `<app-name>.tar.gz` ready to deploy as a Splunk TA.
- `state.json` has `current_stage=deployed`.
- Next step (optional): `ds-review` to audit the dashboard against best practices.
