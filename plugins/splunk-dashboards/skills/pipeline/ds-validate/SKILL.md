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
| `viz-unknown-data-source` | error | A panel's `dataSources.primary` points to a dataSource id that isn't defined |
| `token-undeclared` | warning | SPL references `$some_token$` that isn't declared in `inputs` or `defaults` (may still work if the runtime injects it, but fragile) |
| `drilldown-unknown-target` | warning | A `link.viz` drilldown targets a visualization id that doesn't exist |

**Errors** block the stage advance. **Warnings** are reported but do not block.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.validate check <project-name>
```

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
