# mcollect — write results as metrics to metric index

Source: Splunk Search Reference 8.2.12, page 397.

## Syntax

    | mcollect index=<string> [file=<string>] [spool=<bool>] [prefix_field=<field>] [split=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| index | yes | — | Target metric index |
| split | no | true | If true, create one metric per numeric field |

## Examples

```spl
index=main | stats avg(cpu_pct) AS cpu, avg(mem_pct) AS mem by host
| mcollect index=my_metrics
```

## See also

- `meventcollect.md` — indexer-side metric collection
- `collect.md` — write to event summary index
- `mstats.md` — query metric indexes
