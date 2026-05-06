# /services/catalog/metricstore/dimensions

Discover dimension names for metrics and enumerate dimension values for a specific dimension field.

**Category:** Metrics

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/catalog/metricstore/dimensions`, `/services/catalog/metricstore/dimensions/{dimension-name}/values` |
| Auth required | Yes |
| Capability | `list_metrics_catalog` |

---

## GET /services/catalog/metricstore/dimensions

Return dimension field names observed for the supplied metric context.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| metric_name | String | Yes | — | Metric whose dimensions should be listed (wildcard usage follows Splunk REST semantics as shown in docs, for example `metric_name=*`). |
| earliest | String | No | `-1d` | Earliest time boundary for the catalog probe. |
| latest | String | No | `now` | Latest time boundary for the catalog probe. |
| filter | String | No | — | URL-encoded restriction on metric fields/dimensions/indexes (same pattern as metrics endpoint). |
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| (feed entries) | Feed | Each entry corresponds to a dimension name present for the filtered metric/time range. |

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/catalog/metricstore/dimensions?metric_name=*&output_mode=json"
```

```
curl -k -u admin:pass "https://localhost:8089/services/catalog/metricstore/dimensions?metric_name=os.mem.free&filter=dc%3deast&output_mode=json"
```

---

## GET /services/catalog/metricstore/dimensions/{dimension-name}/values

Return observed values for the path dimension `{dimension-name}` restricted by metric/time/filter context.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| metric_name | String | Yes | — | Metric whose dimension values should be listed. |
| earliest | String | No | `-1d` | Earliest time boundary for the catalog probe. |
| latest | String | No | `now` | Latest time boundary for the catalog probe. |
| filter | String | No | — | Additional URL-encoded filters (for example locking another dimension). |
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| (feed entries) | Feed | Each entry corresponds to a concrete value for `{dimension-name}` given the metric/filter constraints. |

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/catalog/metricstore/dimensions/app/values?metric_name=os.mem.free&output_mode=json"
```

```
curl -k -u admin:pass "https://localhost:8089/services/catalog/metricstore/dimensions/dc/values?metric_name=os.mem.free&filter=dc%3deast&output_mode=json"
```
