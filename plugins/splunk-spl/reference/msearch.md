# msearch — alias for mpreview

Source: Splunk Search Reference 10.2.0

`msearch` is an exact alias for the `mpreview` command. All arguments, options, and
behavior are identical. `msearch` exists for backward compatibility; `mpreview` is the
canonical name as of Splunk 8.0. The underlying configuration stanza in `limits.conf`
is still named `[msearch]`, which is why the alias remains.

## Syntax

    | msearch
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
| `target_per_timeseries` | No | 5 | Target data points per metric time series per `.tsidx` file |
| `chunk_size` | No | 1000 | Metric time series retrieved per `.tsidx` chunk; minimum 10 |
| `splunk_server` | No | all peers | Limit to a specific search peer (wildcards allowed) |
| `splunk_server_group` | No | all groups | Limit to a server group |

## Examples

### Browse metrics — msearch form

    | msearch index=my_metrics | head 20

Exactly equivalent to:

    | mpreview index=my_metrics | head 20

### Filter to a specific metric name

    | msearch index=infra_metrics filter="metric_name=\"cpu.usage\""
        earliest=-1h latest=now

### Count distinct metric names in an index

    | msearch index=my_metrics | stats dc(metric_name) AS unique_metrics

## Gotchas

- **Use `mpreview` in new code** — `msearch` works but is the legacy name. Reviewers and
  documentation will reference `mpreview`. Using the alias in production searches makes it
  harder to understand intent.
- **Cannot search pre-8.0 data** — neither `msearch` nor `mpreview` can access metric data
  indexed before the upgrade to Splunk 8.0.x. That data is invisible to both commands.
- **`run_msearch` capability required** — roles without this capability cannot run either
  form. The capability name itself uses the alias spelling.
- **Not for aggregation** — this command is a diagnostic/preview tool. Use `mstats` for
  aggregated metric queries. Setting `target_per_timeseries=0` returns all data points and
  can be extremely slow.
- **Metrics search is case-sensitive** — `cpu.usage`, `CPU.USAGE`, and `Cpu.Usage` are
  treated as three distinct metric names.

## Tips

- Use `target_per_timeseries=1` to quickly verify a metric exists without pulling full data.
- Lower `chunk_size` when a search consumes too much memory on high-cardinality dimension sets.

## See also

- `mpreview.md` — canonical command with full syntax and examples
- `mstats.md` — aggregate and analyze metric data
- `mcollect.md` — write metric data from search head
