---
name: ds-validate
description: Use this skill to lint a built dashboard.json before deploying it to Splunk. Checks that every ds.search has a name, every panel references an existing data source, all token references resolve to declared inputs or defaults, and drilldown targets exist. Reports errors (blocking) and warnings (non-blocking). Advances workspace state from built to validated. Requires a workspace at built stage produced by ds-create.
---

# ds-validate — Dashboard lint

## When to use

After `ds-create` has produced `dashboard.json` and advanced state to `built`. Always run this before `ds-deploy` — it catches the Dashboard-Studio-specific mistakes that would otherwise silently break the dashboard in production.

## What it checks

| Check | Severity | What it catches |
|---|---|---|
| `ds.search-missing-name` | error | A `ds.search` without a `name` field (Dashboard Studio UI won't show the search) |
| `dataSource-name-illegal-chars` | error | A dataSource `name` field contains characters outside `[A-Za-z0-9 \-_.]+`. Splunk's editor rejects the save and `splunk_create_dashboard` errors out. Allowed: letters, numbers, spaces, dashes, underscores, periods. Common offenders: `/ : ( ) [ ] \| , ? ! & + * = ' "`, smart quotes, non-ASCII (æøåéüñ etc.) |
| `viz-unknown-data-source` | error | A panel's `dataSources.primary` points to a dataSource id that isn't defined |
| `token-undeclared` | warning | SPL references `$some_token$` that isn't declared in `inputs` or `defaults` (may still work if the runtime injects it, but fragile) |
| `drilldown-unknown-target` | warning | A `link.viz` drilldown targets a visualization id that doesn't exist |

**Errors** block the stage advance. **Warnings** are reported but do not block.

> **Note — `name` vs object key.** `dataSource-name-illegal-chars`
> only checks the user-facing `name` field. The JSON object key
> (e.g. `"ds_base":`) is an internal ID with the broader JS-identifier
> rules and is not subject to this regex. See `reference/ds-syntax` for
> the full rule.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.validate check <project-name>
```

### Interim: standalone audit for `dataSource-name-illegal-chars`

While the full validator (`splunk_dashboards.validate`) is still under
construction, you can run the standalone `name`-field audit on its own:

```bash
python3 plugins/splunk-dashboards/scripts/audit_data_source_names.py \
    [path/to/dashboard.json | path/to/dir ...]
```

With no arguments it walks `plugins/splunk-dashboards/skills/`. Output
is one tab-separated row per violation: `<file>\t<ds_id>\t<bad_chars>\t<name>`.
Exit code is 0 if clean, 1 if any violations. Pipe through `cut`/`sort`
to triage.

When the Python validator lands, this rule will be wired in as
`dataSource-name-illegal-chars` and the standalone script will remain
as a faster precommit hook.

Output:

```
[error] ds.search-missing-name: dataSource 'ds_2' (ds.search) is missing required 'name' field
[warning] token-undeclared: dataSource 'ds_1' references token 'env' which is not declared in inputs or defaults

Validation complete: 1 error(s), 1 warning(s). Refusing to advance stage. Use --force to override.
```

With errors and no `--force`, the CLI exits non-zero and leaves state at `built`. With `--force`, stage advances regardless.

## After a clean run

- `state.json` has `current_stage=validated`.
- Next step: `ds-deploy` to produce `dashboard.xml` (and optionally a Splunk TA tarball).
