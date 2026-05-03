# datamodelsimple — simplified data model access (REMOVED in 10.2)

Source: Splunk Search Reference 10.2.0

**Status: Removed in Splunk Enterprise 10.2.** This command no longer exists. Any search,
alert, or dashboard panel that references `datamodelsimple` will produce an error on 10.2
and later. Migrate to `datamodel` or the `from` command before upgrading.

## Migration

| Old pattern | Replacement |
|---|---|
| `\| datamodelsimple <model>` | `\| datamodel <model> search` |
| Accessing a specific dataset | `\| from datamodel:<model>.<dataset>` |

## Replacement examples

Using the `from` command (preferred — cleaner syntax):

    | from datamodel:Authentication.Authentication
    | where action="failure"
    | stats count by user

Using the `datamodel` command:

    | datamodel Authentication Authentication search
    | stats count by Authentication.user

## Gotchas

- **Breaking change in 10.2** — saved searches, alerts, and dashboard panels referencing
  `datamodelsimple` will fail immediately on upgrade. Audit with:
  `| rest /servicesNS/-/-/saved/searches | search search="*datamodelsimple*"`
- The `from datamodel:` syntax is preferred for new development — it is more readable and
  aligns with how data model datasets are documented.
- Field names from `datamodel` queries are prefixed with the object name (e.g.,
  `Authentication.user`). The `from` syntax drops the prefix.

## See also

- `datamodel.md` — full data model access command
- `from.md` — dataset access syntax (preferred replacement)
- `pivot.md` — pivot-style queries against data model objects
