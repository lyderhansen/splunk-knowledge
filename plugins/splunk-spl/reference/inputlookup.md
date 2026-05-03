# inputlookup — load lookup table as search results

Source: Splunk Search Reference 10.2.0

## Syntax

    | inputlookup [append=<bool>] [strict=<bool>] [start=<int>] [max=<int>]
                  <filename | tablename> [WHERE <search-expression>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `filename \| tablename` | Yes | — | CSV filename (must end in `.csv` or `.csv.gz`) or a lookup table name defined in `transforms.conf` |
| `append` | No | `false` | If `true`, append lookup rows to current results instead of replacing them |
| `strict` | No | `false` | If `true`, fail the entire search on any error. If `false`, show a warning and continue |
| `start` | No | `0` | Zero-based offset of the first row to read |
| `max` | No | `1000000000` | Maximum rows to return |
| `WHERE` | No | — | Server-side pre-filter. Supports `=`, `!=`, `<`, `>`, `<=`, `>=`, `AND`, `OR`, `NOT`, and wildcard strings |

## Examples

### Load full lookup

```spl
| inputlookup usertogroup
```

### Filter at source with WHERE (preferred)

```spl
| inputlookup customer_lookup.csv WHERE tier="VIP"
| stats count by city
```

### Paginate a large lookup

```spl
| inputlookup start=1000 max=500 large_table.csv
```

### Append multiple lookups

```spl
| inputlookup region_a.csv
| append [| inputlookup region_b.csv]
```

### Use in subsearch

```spl
index=main [| inputlookup allowlist.csv | fields ip | rename ip AS src_ip]
```

### Verify a geospatial lookup

```spl
| inputlookup geo_us_states
```

Switch to Choropleth Map in Visualizations to confirm polygon data is correct.

## Gotchas

- **`WHERE` is server-side, `search` is not** — `| inputlookup big.csv | search field=value` transfers ALL rows to the search head first, then filters. `| inputlookup big.csv WHERE field=value` filters before transfer. Always prefer `WHERE` for large lookups.
- **`WHERE` supports limited operators only** — no `eval`, no `like`, no regex, no `IN()`. Complex filters must be done post-load with `| where` or `| search`.
- **Filename vs. table name** — CSV filenames must end with `.csv` or `.csv.gz`. Lookup table names (from `transforms.conf`) can be any string. A missing lookup with a filename raises a warning; with `strict=true` it becomes a fatal error.
- **`start` is zero-based** — `start=0` returns from row 1, `start=4` skips the first 4 rows and starts at row 5.
- **KV store collections work too** — the lookup table name can reference a KV store collection defined in `transforms.conf`, not only CSV files.
- **`append=true` in subsearches** — when `inputlookup` runs inside a subsearch with `append=true`, it appends to the main search results. Without `append=true`, the lookup replaces the main results.
- **`strict=false` hides missing lookups** — by default a missing lookup only produces a warning and returns zero rows. Use `strict=true` in scheduled searches where a missing lookup should be a hard failure.

## Tips

To test whether a lookup table exists and see its schema, run `| inputlookup <name> max=5` in a quick search.

## See also

- `lookup.md` — enrich events inline (join-style) rather than loading the full table
- `outputlookup.md` — write search results to a lookup file
- `inputcsv.md` — load from a CSV file in the dispatch directory
