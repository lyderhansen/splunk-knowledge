# datamodelsimple — simplified data model access (REMOVED in 10.2)

Source: Splunk Search Reference 10.2.0

**Status: Removed in Splunk Enterprise 10.2.** This command no longer exists in 10.2 or
later. Any search, alert, or dashboard panel that references `datamodelsimple` will produce
an "Unknown search command" error immediately on upgrade. Migrate before upgrading.

## Migration

| Old pattern | Replacement | Notes |
|---|---|---|
| `\| datamodelsimple <model>` | `\| datamodel <model> search` | Field names are prefixed with object name |
| `\| datamodelsimple <model>.<dataset>` | `\| from datamodel:<model>.<dataset>` | Field names are not prefixed |
| Filter after load | `\| from datamodel:<model>.<dataset> \| where <expr>` | Preferred pattern |

The `from` command is the preferred replacement for new development — it is more readable,
field names are not prefixed, and it aligns with how datasets are documented.

## Replacement examples

### Using `from` (preferred — cleaner field names)

    | from datamodel:Authentication.Authentication
    | where action="failure"
    | stats count by user

### Using `datamodel` command (compatible but verbose field names)

    | datamodel Authentication Authentication search
    | search Authentication.action=failure
    | stats count by Authentication.user

### Find affected saved searches before upgrading

    | rest /servicesNS/-/-/saved/searches
    | search search="*datamodelsimple*"
    | table title, search, eai:acl.app

## Gotchas

- **Breaking change in 10.2** — there is no deprecation period; the command was removed.
  Saved searches, alerts, and dashboard panels fail immediately on upgrade with an error.
- **Audit before upgrading** — use the `rest` search above to find all saved searches that
  reference `datamodelsimple`. Also search dashboard XML for the string manually.
- **Field name difference between replacements** — `datamodel` prefixes field names with
  the object name (e.g., `Authentication.user`). The `from` syntax returns unprefixed field
  names (e.g., `user`). Choosing the wrong replacement can break downstream `eval`, `stats`,
  and `where` expressions that reference those fields.
- **`from datamodel:` requires data model acceleration for best performance** — without
  acceleration, the search scans raw events. The behavior is identical to `datamodel search`
  in that mode.

## Tips

- When migrating, prefer `from` over `datamodel` — the unprefixed field names reduce
  verbosity and make searches easier to read.
- Check dashboard panels with the REST API in addition to saved searches:
  `| rest /servicesNS/-/-/data/ui/views | search eai:data="*datamodelsimple*"`

## See also

- `datamodel.md` — full data model access command
- `from.md` — dataset access syntax (preferred replacement)
- `pivot.md` — pivot-style queries against data model objects
- `tstats.md` — fast aggregation over accelerated data model data
