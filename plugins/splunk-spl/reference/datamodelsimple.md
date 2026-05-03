# datamodelsimple — simplified data model access (REMOVED in 10.2)

Source: Splunk Search Reference 10.2.0

**Status: Removed in Splunk Enterprise 10.2.** This command no longer exists in 10.2 and will produce an error if used. The `datamodel` command and `| from datamodel:` syntax are the supported replacements.

## Migration

| Old pattern | Replacement |
|---|---|
| `\| datamodelsimple <model>` | `\| datamodel <model> search` |
| Accessing a specific dataset | `\| from datamodel:<model>.<dataset>` |

## Examples of replacements

    | from datamodel:Authentication.Authentication
    | where action="failure"
    | stats count by user

Or using the full datamodel command:

    | datamodel Authentication Authentication search
    | stats count by Authentication.user

## Gotchas

- **10.2 breaking change** — any saved search, alert, or dashboard panel still referencing `datamodelsimple` will fail on Splunk 10.2 and later.
- The `from` command offers cleaner, more readable syntax and should be preferred in new development.

## See also

- `datamodel.md` — full data model access
- `from.md` — dataset access syntax (preferred)
- `pivot.md` — pivot-style queries against data model objects
