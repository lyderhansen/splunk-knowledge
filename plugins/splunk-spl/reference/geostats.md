# geostats — geographic binning for map visualization

Source: Splunk Search Reference 8.2.12, page 338.

## Syntax

    | geostats [translatetoxy=<bool>] [latfield=<field>] [longfield=<field>] [globallimit=<int>] [locallimit=<int>] [binspanlat=<float>] [binspanlong=<float>] <stats-agg-term>...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| latfield | no | lat | Field containing latitude |
| longfield | no | lon | Field containing longitude |
| stats-agg-term | yes | — | Aggregation (same as `stats`: count, avg, sum, etc.) |
| globallimit | no | 1000 | Max total clusters |
| binspanlat/long | no | auto | Cluster bin size in degrees |

## Examples

### Bubble map — events by location

```spl
index=main | iplocation src
| geostats latfield=lat longfield=lon count
```

## Gotchas

- **REQUIRED for `splunk.map` bubble layers:** Dashboard Studio map viz won't render bubbles without `geostats` output. This is a common error.
- **Needs lat/lon fields:** Either from `iplocation` or from your own data. Field names must match `latfield`/`longfield`.

## See also

- `iplocation.md` — extract lat/lon from IPs
- `geom.md` — polygon data for choropleth
