# meventcollect — convert streaming events into metric data points on indexers

Source: Splunk Search Reference 10.2.0

## Syntax

    | meventcollect index=<string>
        [file=<string>]
        [split=<bool>]
        [spool=<bool>]
        [prefix_field=<string>]
        [host=<string>]
        [source=<string>]
        [sourcetype=<string>]
        [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | Yes | — | Name of the target metric index |
| `field-list` | If `split=true` | — | Comma-delimited list of dimension fields; required when `split=true` |
| `split` | No | false | When `true`, treats named fields as measures and remaining fields as dimensions |
| `spool` | No | true | When `true`, writes to `$SPLUNK_HOME/var/spool/splunk` for auto-indexing; when `false`, writes to `var/run/splunk` |
| `prefix_field` | No | — | Only with `split=true`; prefixes its value to the metric name |
| `file` | No | `$random$_metrics.csv` | Output filename; use `$timestamp$` or `$random$` for unique names |
| `host` | No | — | Override the host metadata for the collected metrics (spool=true only) |
| `source` | No | Search name | Override the source metadata |
| `sourcetype` | No | `metrics_csv` | Override the sourcetype — do not change without Professional Services guidance |

## Examples

### Write all numeric fields as measures to a metric index

    index=os_stats sourcetype=cpu
    | meventcollect index=my_metrics

### Use split=true to specify which fields are measures

    index=os_stats sourcetype=cpu
    | meventcollect index=my_metrics split=true cpu_pct mem_pct host os

### Scheduled collection with explicit host and source

    index=netflow
    | meventcollect index=network_metrics host=collector1 source="netflow_daily"

## Gotchas

- **Streaming-only predecessor** — only streaming commands may precede `meventcollect`. If your pipeline includes a transforming command (e.g. `stats`, `timechart`), use `mcollect` instead, which runs on the search head.
- **Runs on every execution** — `meventcollect` writes data on every search run. In scheduled searches this means data accumulates; running it twice for the same time window doubles your metrics. There is no built-in deduplication.
- **Case sensitive** — all metric search commands are case-sensitive. `CPU_PCT` and `cpu_pct` are treated as different metric names.
- **run_mcollect capability required** — users without this capability receive a permission error.

## Tips

- Prefer `meventcollect` over `mcollect` for large-scale scheduled metric ingestion — it distributes the write load to indexers rather than burdening the search head.
- Pair with `| where isnum(value_field)` before calling to avoid ingesting null or string-valued measures.

## See also

- `mcollect.md` — search-head-side metric collection; supports transforming commands upstream
- `mstats.md` — query metric data after collection
- `mpreview.md` — inspect raw metric data points in a metric index
