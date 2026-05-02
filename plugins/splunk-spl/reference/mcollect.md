# mcollect — convert search results into metric data points and write to a metric index

Source: Splunk Search Reference 10.2.0

## Syntax

    | mcollect index=<string>
              [split=true|false|allnums]
              [spool=<bool>]
              [prefix_field=<string>]
              [file=<string>]
              [host=<string>]
              [source=<string>]
              [sourcetype=<string>]
              [marker=<string>]
              [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | Yes | — | Name of the target metric index |
| `split` | No | `false` | `true`: each numeric field becomes a separate metric (field-list specifies dimensions); `false`: all fields become dimensions; `allnums`: all numeric fields become metrics |
| `spool` | No | `true` | If `true`, writes data to the spool directory for indexing. If `false`, writes to `var/run/splunk` |
| `prefix_field` | No | none | Field whose value is prepended to the metric name. Only used with `split=true` |
| `field-list` | No | — | When `split=true`, specifies the dimension fields. Required when using `split=true` |
| `file` | No | `$random$_metrics.csv` | Output file name when `spool=false`. Use `$timestamp$` or `$random$` as dynamic values |
| `host` | No | — | Override the `host` metadata field on the metric data points |
| `source` | No | search name | Source metadata for the metrics |
| `sourcetype` | No | `mcollect_stash` | Source type. Do not change without Splunk PS/Support guidance |
| `marker` | No | none | Comma-separated key=value pairs added as dimensions to all generated data points |

## Usage

`mcollect` converts event-based search results into metric data points stored in a metric index. A metric index must exist on the search head (or data will be forwarded to an indexer). Use it to convert logs-derived aggregations into metrics for `mstats` queries and metric-based dashboards.

`mcollect` writes **new data every time it runs**. Run it on a schedule carefully to avoid duplicate metric data points.

The `run_mcollect` capability is required on the user's role.

## Examples

### Store hourly average CPU and memory as metrics (split mode)

    index=main sourcetype=perflog
    | stats avg(cpu_pct) AS cpu, avg(mem_pct) AS mem by host
    | mcollect index=my_metrics split=true host

### Collect all numeric fields as metrics

    index=main sourcetype=app_telemetry
    | stats avg(response_ms) AS response_ms, avg(error_rate) AS error_rate by service
    | mcollect index=app_metrics split=allnums

### Tag metric data points with a search identifier

    index=main
    | stats count AS event_count by sourcetype
    | mcollect index=audit_metrics split=true marker="search=daily_audit" sourcetype

## Gotchas

- **`run_mcollect` capability required** — users without this role capability receive a permissions error.
- **Writes new data on every run** — running an mcollect search multiple times creates duplicate metric data points. Use scheduled searches with non-overlapping time windows to prevent duplicates.
- **`sourcetype` default should not be changed** — `mcollect_stash` bypasses license counting. Changing it to another sourcetype causes Splunk to count the ingested data against your license.
- **Metric index must exist** — `mcollect` does not create the index. Create the metric index in Splunk Web or `indexes.conf` before running the search.
- **Risky command** — `mcollect` triggers SPL safeguards due to its data-write nature. Users need `run_risk_cmd` in addition to `run_mcollect`.
- **All metric commands are case-sensitive** — `cpu.usage`, `CPU.usage`, and `Cpu.Usage` are treated as three distinct metric names.

## See also

- `mstats.md` — query metric indexes
- `meventcollect.md` — indexer-side metric collection (alternative to mcollect)
- `collect.md` — write events to a summary event index (not metric)
