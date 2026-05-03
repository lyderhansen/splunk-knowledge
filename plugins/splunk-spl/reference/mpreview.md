# mpreview — preview raw metric data points from a metrics index

Source: Splunk Search Reference 10.2.0

## Syntax

    | mpreview
        [filter=<string>]
        [index=<index-name>]...
        [splunk_server=<wc-string>]
        [splunk_server_group=<wc-string>]...
        [earliest=<time-specifier>]
        [latest=<time-specifier>]
        [chunk_size=<unsigned-integer>]
        [target_per_timeseries=<unsigned-integer>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | No | default index | Target metric index; accepts wildcards; multiple allowed |
| `filter` | No | (all) | Boolean expression over dimension or `metric_name` fields |
| `earliest` / `latest` | No | time picker | Time range in relative, ISO8601, or epoch format |
| `target_per_timeseries` | No | 5 | Target number of data points to return per metric time series per `.tsidx` file |
| `chunk_size` | No | 1000 | Number of metric time series retrieved per `.tsidx` chunk; minimum 10 |
| `splunk_server` | No | all peers | Limit to a specific search peer (wildcards allowed) |
| `splunk_server_group` | No | all groups | Limit to a server group |

## Examples

### Browse all metric time series in an index

    | mpreview index=my_metrics | head 20

### Filter to a specific metric

    | mpreview index=my_metrics filter="metric_name=\"cpu.usage\""

### Inspect metrics for a specific host dimension

    | mpreview index=my_metrics filter="host=\"web01\""
        earliest=-1h latest=now

### Troubleshoot ingestion by checking recent data points

    | mpreview index=my_metrics earliest=-15m | stats count by metric_name

## Gotchas

- **Cannot search pre-8.0 data** — `mpreview` only works with data indexed on Splunk 8.0 or later. Older metric data in the same index is invisible.
- **Returns JSON format** — metric data points are returned in JSON; use `spath` or `jq`-style field extractions if you need to access nested fields.
- **run_msearch capability required** — roles without this capability cannot run `mpreview`.
- **Field filters may block access** — if your organization uses Splunk field filters for data protection, `mpreview` may be restricted.
- **Not for aggregation** — `mpreview` is a diagnostic/preview tool. For aggregated metric queries use `mstats`.

## Tips

- Use `| mpreview | stats dc(metric_name) as unique_metrics` to quickly count distinct metric names in an index.
- Use `target_per_timeseries=1` when you only need to verify that a metric exists, not examine its values.
- Lower `chunk_size` if a search is consuming too much memory on high-cardinality dimension sets.

## See also

- `mstats.md` — aggregate and analyze metric data
- `mcollect.md` — write metric data from search head
- `meventcollect.md` — write metric data from indexers
