# outputlookup — write results to a lookup table

Source: Splunk Search Reference 10.2.0

## Syntax

    | outputlookup [append=<bool>] [create_empty=<bool>] [override_if_empty=<bool>]
                   [createinapp=<bool>] [create_context=<string>] [max=<int>]
                   [key_field=<field>] [allow_updates=<bool>] [output_format=<string>]
                   <filename> | <tablename>

The lookup target can be a CSV filename (must end in `.csv` or `.csv.gz`) or a
lookup definition name from `transforms.conf`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `filename` / `tablename` | Yes | — | Lookup file name or transforms.conf stanza name |
| `append` | No | false | Append to existing lookup instead of replacing it |
| `create_empty` | No | false | Create an empty lookup when search returns no results |
| `override_if_empty` | No | true | Delete the existing output file when no results are passed |
| `key_field` | No | — | KV store upsert key; implicitly sets `append=true` |
| `max` | No | 0 (unlimited) | Max rows to write |
| `allow_updates` | No | true (when append or key_field set) | Update existing records; false = insert only |
| `createinapp` | No | true | Create lookup in current app directory vs. system |
| `create_context` | No | app | Where to create the file: `app`, `user`, or `system` |
| `output_format` | No | splunk_sv_csv | `splunk_sv_csv` or `splunk_mv_csv` (preserves multivalue fields) |

## Examples

### Save threat summary to CSV

```spl
index=threats | stats count by src, category
| outputlookup threat_summary.csv
```

### Append to existing lookup (scheduled search pattern)

```spl
index=main | stats count by src
| outputlookup append=true daily_counts.csv
```

### KV store upsert by key field

```spl
index=assets | stats latest(owner) AS owner, latest(env) AS env by asset_id
| outputlookup key_field=asset_id asset_inventory
```

### Write multivalue fields to lookup

```spl
index=web | stats values(uri) AS uris by host
| outputlookup output_format=splunk_mv_csv host_uris.csv
```

## Gotchas

- **Destructive by default:** Without `append=true`, the entire lookup is replaced
  with the current result set. Existing rows not in the new results are permanently
  lost. This is trap #1 for scheduled lookup-building searches.

- **`create_empty=true` wipes data on zero results:** The default in 10.2 is
  `create_empty=false` but historically some deployments had it `true`. If a
  scheduled search returns zero events (e.g., during maintenance), the lookup is
  silently emptied. Always test your filter logic before scheduling.

- **`override_if_empty=true` (default) deletes on empty:** Even without
  `create_empty`, when `override_if_empty=true` (the default), a zero-result run
  deletes the existing file. Set `override_if_empty=false` in scheduled searches
  to protect against accidental data loss.

- **Cannot append to `.gz` files:** `outputlookup append=true` only works with
  plain `.csv`; compressed `.csv.gz` lookups do not support append.

- **Field removal on non-append writes:** When `append=false`, any field that was
  in the original CSV but is absent from the current results is removed from the
  file entirely.

- **Risky command:** Splunk flags `outputlookup` as a risky command. It may trigger
  SPL safeguard warnings in some environments.

## Tips

- Use `outputlookup` at the end of a scheduled saved search to maintain a persistent
  summary table that other searches can query with `inputlookup` for fast lookups.
- Use `create_empty=false override_if_empty=false` together as the safest pattern for
  automated scheduled searches.

## See also

- `inputlookup.md` — read lookup table
- `lookup.md` — enrich events inline
- `outputcsv.md` — write to dispatch directory (temporary, not persistent)
