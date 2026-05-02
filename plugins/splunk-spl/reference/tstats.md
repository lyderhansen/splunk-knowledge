# tstats — accelerated search over indexed fields and data models

Source: Splunk Search Reference 8.2.12, page 614.

## Syntax

    | tstats [prestats=<bool>] [local=<bool>] [append=<bool>] [summariesonly=<bool>] [allow_old_summaries=<bool>] [chunk_size=<int>] <stats-func>... FROM <datamodel> | WHERE <index-expression> [BY <field-list> [span=<timespan>]]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| stats-func | yes | — | Aggregation: count, dc, sum, avg, min, max, earliest, latest, values, list |
| FROM datamodel | option 1 | — | Data model to search (e.g., `FROM datamodel=Authentication`) |
| WHERE | option 2 | — | Index-level filter (e.g., `WHERE index=main`) |
| BY field-list | no | — | Group-by fields |
| summariesonly | no | false | Only use accelerated data (faster but may miss recent events) |
| span | no | — | Time span for bucketing (used with `_time` in BY clause) |

## Examples

### Indexed field search

```spl
| tstats count WHERE index=main by sourcetype, host
```

### Data model acceleration

```spl
| tstats summariesonly=t count FROM datamodel=Authentication WHERE action=failure by Authentication.user, Authentication.src
```

### Time-bucketed

```spl
| tstats count WHERE index=main by sourcetype, _time span=1h
```

## Gotchas

- **No eval inside tstats:** Cannot compute fields inline. Post-process with `| eval` after.
- **Limited aggregations:** Only count, dc, sum, avg, min, max, earliest, latest, values, list. No perc95, stdev, etc.
- **Field name prefix for data models:** Data model fields must be fully qualified (e.g., `Authentication.user`, not just `user`).
- **summariesonly=t risks missing data:** Only searches pre-built summaries. Recent events not yet summarized are invisible.

## See also

- `stats.md` — full-featured aggregation (slower)
- `datamodel.md` — data model exploration
- `tscollect.md` — build tsidx files for tstats
