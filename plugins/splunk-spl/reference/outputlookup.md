# outputlookup — write results to a lookup table

Source: Splunk Search Reference 8.2.12, page 443.

## Syntax

    | outputlookup [append=<bool>] [create_empty=<bool>] [createinapp=<bool>] [max=<int>] [key_field=<field>] <lookup-name>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| lookup-name | yes | — | Name of the lookup table to write to |
| append | no | false | Append to existing lookup instead of replacing |
| create_empty | no | true | If true, create an empty lookup if no results |
| key_field | no | — | Unique key field for KV store upsert |
| max | no | 0 (unlimited) | Max rows to write |

## Examples

### Save threat summary

```spl
index=threats | stats count by src, category
| outputlookup threat_summary.csv
```

### Append to existing

```spl
index=main | stats count by src
| outputlookup append=true daily_counts.csv
```

## Gotchas

- **Destructive by default:** Without `append=true`, the entire lookup is replaced. Any existing data is lost.
- **create_empty=true trap:** If your search returns zero results, `outputlookup` creates an empty lookup — wiping all existing data. Set `create_empty=false` in scheduled searches.

## See also

- `inputlookup.md` — read lookup table
- `lookup.md` — enrich events inline
- `outputcsv.md` — write to dispatch directory
