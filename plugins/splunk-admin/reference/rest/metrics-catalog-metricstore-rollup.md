# /services/catalog/metricstore/rollup

Manage metric rollup policies: list rollup summaries per metric index, create policies from POST bodies, update policies for a specific index, or delete them.

**Category:** Metrics

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/catalog/metricstore/rollup`, `/services/catalog/metricstore/rollup/{index}` |
| Auth required | Yes |
| Capability | GET: `list_metrics_catalog`; POST (collection or `{index}`) / DELETE (`{index}`): `edit_metrics_rollup` |

---

## GET /services/catalog/metricstore/rollup

Return rollup summaries for each configured source metric index.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | No endpoint-specific parameters; Splunk REST pagination/filtering applies. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | String | Source metric index name supplying raw metric points for rollup summaries. |
| summaries | Object | Dictionary of summary slots (numeric keys) each containing `span` (rollup period) and `rollupIndex` (destination rollup index). Format mirrors `metric_rollups.conf` rollup stanzas. |
| aggregation.&lt;metric&gt; | String | Optional per-metric aggregation overrides expressed as functions joined by `#` (for example `min#avg`). |
| defaultAggregation | String | Default aggregation pipeline (`fn#fn...`) used unless overridden. |
| dimensionList | String | Comma-separated dimensions paired with `dimensionListType`. |
| dimensionListType | String | `included` or `excluded`, controlling whether `dimensionList` is allow-list or deny-list for rollup dimensions. |
| disabled | Boolean | Whether the policy is disabled. |
| metricList | String | Comma-separated metrics paired with `metricListType`. |
| metricListType | String | `included` or `excluded`, controlling whether `metricList` metrics are allow-listed or deny-listed for rollup. |
| minSpanAllowed | Number | Minimum rollup span permitted for the policy (seconds in examples). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/catalog/metricstore/rollup?output_mode=json
```

---

## POST /services/catalog/metricstore/rollup

Create rollup policies for a source metric index.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Source metric index from which rollup summaries are computed. |
| summaries | String | Yes | — | Comma-separated list of `span|rollupIndex` pairs describing each rollup summary (for example `1h|index_d_1h,1d|index_d_1d`). Allowed spans: minutes ∈ {1,2,3,4,5,6,10,12,20,30,60}; hours ∈ {1,2,3,4,6,8,12,24}; days ∈ {1}. |
| default_agg | String | No | `avg` | Aggregation functions separated by `#` (`avg`, `count`, `max`, `median`, `min`, `perc*`, `sum`). |
| metric_list | String | No | empty | Comma-separated metric names restricted according to `metric_list_type`. |
| metric_list_type | Enum | No | `excluded` | `included` (only listed metrics roll up) or `excluded` (listed metrics skipped). |
| dimension_list | String | No | empty | Comma-separated dimensions governed by `dimension_list_type`. |
| dimension_list_type | Enum | No | `excluded` | `included` (only listed dimensions kept) or `excluded` (listed dimensions removed). |
| metric_overrides | String | No | empty | Comma-separated rules `metric|fn#fn` overriding default aggregation per metric. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| aggregation.&lt;metric&gt; | String | Effective override aggregation chain per metric after applying `metric_overrides`. |
| defaultAggregation | String | Effective default aggregation chain stored on the policy. |
| dimensionList | String | Stored comma-separated dimension list. |
| dimensionListType | String | Stored include/exclude mode for dimensions. |
| metricList | String | Stored comma-separated metric filter list. |
| metricListType | String | Stored include/exclude mode for metrics. |
| rollup.&lt;n&gt;.rollupIndex | String | Destination rollup index for summary slot `n`. |
| rollup.&lt;n&gt;.span | String | Rollup span for summary slot `n`. |
| summaries | Object | Nested dictionary mirroring configured summaries. |
| minSpanAllowed | Number | Enforced minimum span for the policy. |
| disabled | Boolean | Policy disabled flag when present. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/catalog/metricstore/rollup \
  -d name=index_s \
  -d default_agg=avg#max \
  -d dimension_list="app,region" \
  -d dimension_list_type=included \
  -d metric_overrides="foo2|count#avg,foo1|min#avg" \
  -d summaries="1h|index_d_1h,1d|index_d_1d" \
  -d metric_list="foo3,foo4" \
  -d metric_list_type=excluded
```

---

## GET /services/catalog/metricstore/rollup/{index}

Return rollup configuration for the source metric index `{index}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | No endpoint-specific parameters beyond Splunk REST pagination/filtering. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| summaries | Object | Summary dictionary (`rollupIndex`, `span` pairs). |
| aggregation.&lt;metric&gt; | String | Metric-specific aggregation overrides. |
| defaultAggregation | String | Default aggregation chain. |
| dimensionList | String | Dimension allow/deny list contents. |
| dimensionListType | String | `included` or `excluded`. |
| metricList | String | Metric allow/deny list contents. |
| metricListType | String | `included` or `excluded`. |
| minSpanAllowed | Number | Minimum permitted rollup span. |
| disabled | Boolean | Disabled flag when returned. |
| eai:attributes.optionalFields | List | Writable fields advertised by Splunk (examples include `default_agg`, `dimension_list`, `dimension_list_type`, `isProxyRequest`, `metric_overrides`, `noProxy`, `summaries`). |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/catalog/metricstore/rollup/index_s?output_mode=json
```

---

## POST /services/catalog/metricstore/rollup/{index}

Update rollup policy for `{index}`. At least one argument must be supplied.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| default_agg | String | No | — | Aggregation chain separated by `#`. |
| metric_list | String | No | — | Metric filter list. |
| metric_list_type | Enum | No | — | `included` or `excluded`. |
| dimension_list | String | No | — | Dimension filter list. |
| dimension_list_type | Enum | No | — | `included` or `excluded`. |
| metric_overrides | String | No | — | Override specifications `metric|fn#fn`. |
| summaries | String | No | — | Updated `span|rollupIndex` list respecting allowed span enumerations. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| aggregation.&lt;metric&gt; | String | Stored overrides after update. |
| defaultAggregation | String | Stored default aggregation chain. |
| dimensionList | String | Stored dimensions list. |
| dimensionListType | String | Stored dimension mode. |
| metricList | String | Stored metric list. |
| metricListType | String | Stored metric mode. |
| rollup.&lt;n&gt;.rollupIndex | String | Destination indexes per summary slot. |
| rollup.&lt;n&gt;.span | String | Span per summary slot. |
| summaries | Object | Nested summary dictionary post-update. |
| minSpanAllowed | Number | Minimum span enforcement. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/catalog/metricstore/rollup/index_s \
  -d summaries="30m|index_d_30m"
```

---

## DELETE /services/catalog/metricstore/rollup/{index}

Remove the rollup policy backing `{index}` (equivalent to deleting `[index:<name>]` from `metric_rollups.conf`).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None documented. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | Empty feed referencing collection endpoint metadata. |

### Example

```
curl -k -u admin:changeme -X DELETE https://localhost:8089/services/catalog/metricstore/rollup/metric_x
```
