# inputlookup — load lookup table as search results

Source: Splunk Search Reference 8.2.12, page 354.

## Syntax

    | inputlookup [append=<bool>] [strict=<bool>] [start=<int>] [max=<int>] <lookup-name> [WHERE <search-expression>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| lookup-name | yes | — | Name of the lookup table (CSV or KV store) |
| append | no | false | Append to existing results instead of replacing |
| start | no | 0 | Row to start reading from |
| max | no | 0 (unlimited) | Max rows to return |
| WHERE | no | — | Server-side filter (more efficient than piping to `| search`) |

## Examples

### Load and filter

```spl
| inputlookup customer_lookup.csv WHERE tier="VIP"
| stats count by city
```

### Append multiple lookups

```spl
| inputlookup first_lookup.csv
| append [| inputlookup second_lookup.csv]
```

## Gotchas

- **WHERE is server-side:** Filtering with `WHERE` is much faster than `| inputlookup | search` because it happens before results are sent to the search head.
- **KV store collections:** Works with KV store collections too — not just CSV files.

## See also

- `lookup.md` — enrich events inline
- `outputlookup.md` — write results to lookup
- `inputcsv.md` — load from dispatch directory CSV
