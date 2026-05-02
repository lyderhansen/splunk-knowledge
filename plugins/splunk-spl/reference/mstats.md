# mstats — aggregate statistics over metrics indexes

Source: Splunk Search Reference 8.2.12, page 415.

## Syntax

    | mstats [chart=<bool>] [prestats=<bool>]
             [fillnull_value=<string>] [chunk_size=<int>]
             <stats-metric-term>...
             WHERE [<logical-expression>]...
             [(BY|GROUPBY) <field-list>]
             [<span-length>]

`mstats` is a generating command (leading `|`) that queries **metrics indexes** directly.
It performs statistical calculations on `metric_name`, `measurement`, and `dimension`
fields. Supports both historical and real-time searches.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `stats-metric-term` | Yes | — | One or more stats functions applied to metric names |
| `WHERE logical-expression` | No | (none) | Filter by dimensions, sourcetype, host, source, or time modifiers |
| `BY / GROUPBY field-list` | No | (none) | Group results by dimension fields |
| `span=<int><timescale>` | No | auto | Time bucket size for the output |
| `chart=<bool>` | No | false | Output in chart/timechart format instead of stats format |
| `prestats=<bool>` | No | false | Output in prestats format for piping into `chart`, `stats`, or `timechart` |
| `fillnull_value=<string>` | No | empty string | Replace null group-by field values with this string |
| `chunk_size=<int>` | No | 10000000 | Advanced: controls time series batching; minimum 10000 |

## Stats functions for metrics

| Type | Supported functions |
|---|---|
| Aggregate | `avg()`, `count()`, `max()`, `median()`, `min()`, `perc<N>()`, `range()`, `stdev()`, `sum()`, `var()` |
| Time | `earliest()`, `earliest_time()`, `latest()`, `latest_time()`, `rate()` |
| Metrics-specific | `rate_avg()`, `rate_sum()` — per-time-series rates for counter metrics |

## Examples

### Average CPU utilization per host, 1-minute buckets

    | mstats avg("cpu.util") AS avg_cpu
        WHERE index=metrics_prod
        BY host
        span=1m

### Multiple metrics in one search

    | mstats avg("cpu.util") AS avg_cpu,
             avg("mem.used_pct") AS avg_mem
        WHERE index=metrics_prod sourcetype=perfmon
        BY host
        span=5m

### Dashboard-specific pattern: metrics timechart via prestats

Feed `timechart` directly from `mstats` for time-series visualization:

    | mstats prestats=t avg("network.bytes_sent") AS bytes
        WHERE index=metrics_prod
        BY host
        span=1h
    | timechart sum(bytes) AS total_bytes BY host

## Gotchas

- **`mstats` only works on metrics indexes** — it cannot search event indexes. For event
  data, use `stats`, `timechart`, or `tstats`.

- **Two incompatible syntax forms** — `<stats-func>` syntax and `<stats-func-value>` syntax
  cannot be mixed in the same `mstats` call. Use `<stats-func>` (e.g. `avg("cpu.util")`)
  for most cases; use `<stats-func-value>` (e.g. `count(_value) WHERE metric_name="cpu.util"`)
  only when you need wildcard metric names.

- **All metrics commands are case-sensitive** — `cpu.util`, `CPU.UTIL`, and `Cpu.Util`
  are three distinct metric names. Check exact casing from `| mcatalog values(metric_name)`.

- **`span` without `every` samples all data in each bin** — use
  `span=<size> every=<larger-size>` to downsample for faster searches on large time ranges.

## See also

- `stats.md` — equivalent aggregation for event indexes
- `timechart.md` — time-series chart for event data
- `tstats.md` — accelerated stats over indexed fields and data model accelerations
