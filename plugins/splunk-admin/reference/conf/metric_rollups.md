# metric_rollups.conf

Defines automated rollup policies that summarize raw metric index data into secondary metric indexes on configurable spans (for example hourly/daily), including aggregation functions and optional metric/dimension inclusion lists.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app paths) |
| Pipeline phase | Indexing |
| Restart required | Yes |
| Related files | `indexes.conf`, Metrics Catalog REST endpoints, `limits.conf` (`minSpanAllowed`) |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *none documented* | — | — | Follow standard Splunk global stanza merge semantics when present. |

### `[index:<metric_index_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `defaultAggregation` | `<#-separated list>` | `avg` | Default reducer applied to every metric rolled up unless overridden by `aggregation.<metric_name>` entries; supports `avg`, `count`, `max`, `median`, `min`, `perc<int>`, `sum`. |
| `dimensionList` | `<comma-separated list>` | — | Dimensions eligible for filtering according to `dimensionListType`; must exist in the source metric index. |
| `dimensionListType` | `excluded \| included` | `excluded` | Determines whether `dimensionList` enumerates dimensions to drop (`excluded`) or the only dimensions to keep (`included`). |
| `metricList` | `<comma-separated list>` | — | Metrics eligible for filtering according to `metricListType`; must exist in the source index. |
| `metricListType` | `excluded \| included` | `excluded` | Controls whether `metricList` enumerates metrics to skip or metrics to exclusively retain during rollup. |
| `aggregation.<metric_name>` | `<#-separated list>` | — | Per-metric override for aggregation functions diverging from `defaultAggregation`. |
| `rollup.<n>.span` | `<time range string>` | `1h` (per summary) | Required rollup period for summary slot `<n>`; must respect `minSpanAllowed` in `limits.conf`. |
| `rollup.<n>.rollupIndex` | `<index>` | Source index name | Destination metric index receiving rolled-up points for summary `<n>`; must exist in `indexes.conf`. |
