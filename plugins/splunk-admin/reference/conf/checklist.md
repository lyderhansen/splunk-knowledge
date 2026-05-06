# checklist.conf

Defines custom Monitoring Console health checks: titles, SPL backdrops, severity scoring schema, documentation links, drilldowns, and audience scoping so administrators can extend built-in checklist coverage.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<app>/local/` (recommended) or `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | `health.conf` |

## Stanzas and settings

### `[<checklist_name>]`

Each stanza name is a unique ASCII identifier for the health check entry.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `title` | `<ASCII string>` | _(required)_ | Display title rendered in Monitoring Console lists and detail views. |
| `category` | `<ASCII string>` | _(required)_ | Logical grouping label used to cluster related checks in the UI. |
| `tags` | `<ASCII string>` | _(unset)_ | Comma-separated labels enabling filtered subsets when operators run partial health suites. |
| `description` | `<ASCII string>` | _(unset)_ | Optional prose explaining what signal the SPL evaluates for reviewers. |
| `failure_text` | `<ASCII string>` | _(unset)_ | Message shown when severity is failing; omitting it yields no failure narrative in the UI. |
| `suggested_action` | `<ASCII string>` | _(unset)_ | Recommended remediation copy displayed beside failures for faster MTTR. |
| `doc_link` | `<ASCII string>` | _(unset)_ | Help URL or comma-separated URLs tied to `doc_title`; omitted means no inline documentation shortcut. |
| `doc_title` | `<ASCII string>` | _(unset)_ | Companion titles for each `doc_link`, comma-aligned when multiple links exist (required whenever `doc_link` is set). |
| `applicable_to_groups` | `<ASCII string>` | _(unset)_ | Limits execution to named deployment console groups; blank means any eligible instance grouping. |
| `environments_to_exclude` | `<ASCII string>` | _(unset)_ | Comma list (`standalone`, `distributed`) that suppresses the check in matching topology modes. |
| `disabled` | `<boolean>` | `0` | Set to `1` to hide/disable the custom health item without deleting its stanza. |
| `search` | `<ASCII string>` | _(required)_ | SPL (use `\` continuations) producing rows with `instance`, optional metric columns, and numeric `severity_level` (-1..3); must embed `$rest_scope$` or `$hist_scope$` for targeting. |
| `drilldown` | `<ASCII string>` | _(unset)_ | Dashboard or search drilldown template referencing `$field$` tokens emitted by the check results for deeper triage. |
