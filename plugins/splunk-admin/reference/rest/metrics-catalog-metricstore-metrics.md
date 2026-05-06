# /services/catalog/metricstore/metrics

Enumerate metric names available to the Metrics Catalog across the caller’s accessible metric indexes.

**Category:** Metrics

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/catalog/metricstore/metrics` |
| Auth required | Yes |
| Capability | `list_metrics_catalog` |

### Default indexes

If `filter` omits index selection, Metrics Catalog uses the role’s default searchable indexes (metrics indexes only; event indexes are ignored). With no metrics indexes, results are empty.

---

## GET /services/catalog/metricstore/metrics

Returns metric names as Atom/JSON feed entries (titles are metric identifiers).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| earliest | String | No | `-1d` | Earliest time boundary for the catalog probe (relative or absolute). |
| latest | String | No | `now` | Latest time boundary for the catalog probe (relative or absolute). |
| filter | String | No | — | URL-encoded key/value expressions restricting metric fields (indexes, dimensions, etc.). Example dimension-only filter: `filter=dc`. Multiple equality clauses combine with `&` encoded as `%26` (for example `index%3dindex1%26index%3dindex2`). |
| list_indexes | Boolean | No | `false` | When `true`, responses include index associations per metric. |
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| (feed entries) | Feed | Each entry’s title/ID corresponds to a metric name; additional metadata may include ACL nodes and optional index listings when `list_indexes=true`. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/catalog/metricstore/metrics?output_mode=json
```

### Additional examples

```
curl -k -u admin:pass "https://localhost:8089/services/catalog/metricstore/metrics?filter=dc&output_mode=json"
curl -k -u admin:pass "https://localhost:8089/services/catalog/metricstore/metrics?filter=dc%3deast&filter=dc%3dwest&output_mode=json"
curl -k -u admin:pass "https://localhost:8089/services/catalog/metricstore/metrics?filter=index%3dindex1%26index%3dindex2&list_indexes=t&output_mode=json"
```
