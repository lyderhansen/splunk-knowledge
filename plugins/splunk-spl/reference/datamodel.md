# datamodel — examine or search a data model

Source: Splunk Search Reference 8.2.12, page 254.

## Syntax

    | datamodel <datamodel-name> [<object-name>] [search | strict_fields | fields]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| datamodel-name | yes | — | Name of the data model |
| object-name | no | — | Specific object within the data model |
| search | no | — | Return events matching the data model constraints |

## Examples

```spl
| datamodel Authentication search | stats count by action, user
```

## Gotchas

- **Prefer `| from datamodel:`:** Cleaner syntax for searching data models.
- **CIM field names:** Fields are prefixed with object name (e.g., `Authentication.user`).

## See also

- `from.md` — cleaner data model access
- `tstats.md` — accelerated data model search
- `pivot.md` — pivot-style data model queries
