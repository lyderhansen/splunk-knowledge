# fieldsummary — generate summary statistics for all fields

Source: Splunk Search Reference 8.2.12, page 308.

## Syntax

    | fieldsummary [maxvals=<int>] [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| maxvals | no | 100 | Max distinct values to return per field |
| field-list | no | all | Specific fields to summarize |

Returns one row per field with: count, distinct_count, is_exact, min, max, mean, stdev, numeric_count, values (JSON array).

## Examples

### Explore unknown data

```spl
index=new_source | fieldsummary | sort -count | table field, count, distinct_count, numeric_count
```

## Gotchas

- **Expensive on large result sets:** Computes stats across all fields and all events. Use `| head 10000` before `fieldsummary` for exploration.

## See also

- `analyzefields.md` — predictive strength analysis
- `metadata.md` — index-level metadata
