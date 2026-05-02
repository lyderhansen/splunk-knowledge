# append — add subsearch results as additional rows

Source: Splunk Search Reference 8.2.12, page 198.

## Syntax

    | append [extendtimerange=<bool>] [maxtime=<int>] [maxout=<int>] [timeout=<int>] [<subsearch>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| subsearch | yes | — | Search enclosed in square brackets |
| extendtimerange | no | false | Extend main search time range to include subsearch results |
| maxtime | no | 60 | Max seconds for subsearch to run |
| maxout | no | 50000 | Max results from subsearch |
| timeout | no | 0 | Seconds to wait after maxtime before killing subsearch |

## Examples

### Basic — combine two stats results

```spl
index=main sourcetype=syslog | stats count AS syslog_count
| append [search index=main sourcetype=access_combined | stats count AS web_count]
```

### Add summary row to a table

```spl
index=main | stats sum(bytes) AS total_bytes by host
| append [search index=main | stats sum(bytes) AS total_bytes | eval host="TOTAL"]
```

## Gotchas

- **No field alignment:** Results are simply stacked. If the subsearch returns different fields, they appear as new columns with null values in other rows.
- **Subsearch limits apply:** Default 60s timeout and 50K result limit. Silently truncates if exceeded.

## See also

- `appendcols.md` — add fields as columns instead of rows
- `appendpipe.md` — apply subpipeline to current results
- `union.md` — combine multiple datasets
- `join.md` — SQL-style join
