# append — add subsearch results as additional rows

Source: Splunk Search Reference 10.2.0

Appends the results of a subsearch to the current results as additional rows (not columns).
The two result sets are stacked vertically — fields align by name, not by position.

## Syntax

    | append [extendtimerange=<bool>] [maxtime=<int>] [maxout=<int>] [timeout=<int>]
             [<subsearch>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `subsearch` | Yes | — | Secondary search enclosed in square brackets |
| `extendtimerange` | No | false | Extend main search time range to include subsearch time range; important when a time-based `chart`/`timechart`/`stats` follows the `append` |
| `maxtime` | No | 60 | Max seconds for subsearch to run before auto-finalizing |
| `maxout` | No | 50000 | Max result rows returned from the subsearch |
| `timeout` | No | 0 | Additional seconds to wait after `maxtime` before killing subsearch |

## Examples

### Add a grand total row to a by-host breakdown

    index=web sourcetype=access_combined
    | stats sum(bytes) AS total_bytes by host
    | append
        [search index=web sourcetype=access_combined
         | stats sum(bytes) AS total_bytes
         | eval host="ALL HOSTS"]

### Combine two separate index summaries in one table

    index=main sourcetype=syslog
    | stats count AS event_count, "syslog" AS source_label
    | append
        [search index=main sourcetype=access_combined
         | stats count AS event_count
         | eval source_label="web"]

### Append a second time window for comparison

    index=orders earliest=-7d@d latest=-1d@d
    | stats sum(revenue) AS revenue eval("last_week") AS period
    | append
        [search index=orders earliest=-1d@d latest=now
         | stats sum(revenue) AS revenue
         | eval period="this_week"]

## Gotchas

- **No field alignment** — results are stacked regardless of field differences. Columns
  present in only one side produce null values on the other side. This is expected behavior,
  not an error.
- **Not valid in real-time searches** — `append` runs only over historical data. Using it
  in a real-time search produces incorrect or undefined results.
- **Subsearch limits apply silently** — if the subsearch exceeds `maxtime` (60s default) or
  `maxout` (50,000 rows), it is truncated without error. The main search continues with
  whatever partial data the subsearch returned. Always check whether limits are hit.
- **`extendtimerange` matters for timechart** — if the subsearch covers a different time
  window than the main search and you pipe into `timechart`, omitting `extendtimerange=true`
  causes the subsearch rows to be dropped or misaligned on the time axis.
- **Performance** — the subsearch runs sequentially after the main search. For large
  datasets, consider `union` (runs searches in parallel) instead.

## Tips

- Use `| eval label="..."` inside both searches to add an identifier column that survives
  the stack.
- `appendcols` is the right choice when you want to add new fields (columns) rather than
  new events (rows).

## See also

- `appendcols.md` — add fields as columns instead of rows
- `appendpipe.md` — apply a subpipeline to the current results
- `union.md` — combine multiple datasets (parallel execution)
- `join.md` — SQL-style join on a key field
