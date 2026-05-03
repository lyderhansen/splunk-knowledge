# fieldsummary — generate summary statistics for all fields

Source: Splunk Search Reference 10.2.0

## Syntax

    | fieldsummary [maxvals=<unsigned_int>] [<wc-field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `maxvals` | no | 100 | Maximum distinct values to return per field; set to `0` for unlimited |
| `wc-field-list` | no | all fields | Space-delimited field names or wildcard patterns (e.g., `bytes*`) |

## Output fields

One row per field is returned with these summary columns:

| Column | Description |
|---|---|
| `field` | Field name |
| `count` | Number of events containing this field |
| `distinct_count` | Number of unique values (approximate when `is_exact=0`) |
| `is_exact` | `1` if distinct count is exact; `0` if approximate (more distinct values than `maxvals`) |
| `min` | Minimum value (numeric fields only) |
| `max` | Maximum value (numeric fields only) |
| `mean` | Mean value (numeric fields only) |
| `stdev` | Standard deviation (numeric fields only) |
| `numeric_count` | Count of numeric (non-null) values |
| `values` | JSON array of distinct values sorted by frequency then alphabetically |

## Examples

### Explore an unknown data source

```spl
index=new_source | head 10000
| fieldsummary
| sort -count
| table field, count, distinct_count, is_exact
```

### Summarize only specific fields

```spl
index=web | fieldsummary status bytes uri
| table field, count, distinct_count, min, max, mean
```

### Find fields with very high cardinality (potential ID fields)

```spl
index=main | head 50000
| fieldsummary
| where distinct_count > 1000
| sort -distinct_count
```

## Gotchas

- **Expensive on large result sets** — `fieldsummary` is a dataset processing command that buffers all
  results. Always use `| head <N>` before it for exploratory use. Processing 1M+ events can cause
  out-of-memory errors on the search head.
- **Approximate distinct counts** — when a field has more unique values than `maxvals`, `is_exact` is set
  to `0` and `distinct_count` is an estimate. Set `maxvals=0` for exact counts, at the cost of more memory.
- **`values` column is a JSON string** — to process individual values, use `spath` or `mvexpand` on the
  `values` field after `fieldsummary`.
- **Internal fields included by default** — `_raw`, `_time`, `_indextime`, etc. appear in output unless you
  specify an explicit field list or filter them with `| search NOT field="_*"`.

## Tips

- Use `| fieldsummary` immediately after `| inputlookup` to quickly profile a lookup table.
- Wildcard field lists like `fieldsummary bytes* status*` narrow the output to related field families.

## See also

- `analyzefields.md` — predictive strength analysis for classification tasks
- `metadata.md` — index-level metadata (not event-level field profiles)
