# /services/workloads/categories

Inspect and edit predefined workload categories (`search`, `ingest`, `misc`). Categories cannot be created or deleted—only listed or updated.

**Category:** Workloads

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/workloads/categories`, `/services/workloads/categories/{name}` |
| Auth required | Yes |
| Capability | GET: `list_workload_pools`; POST: `edit_workload_pools` |

### Splunk Cloud Platform

Workload endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/workloads/categories

List workload categories and their CPU/memory weights.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| cpu_weight | Number | Relative CPU share weight for the category (> 0 and ≤ 100). Combined weights determine each category’s fraction of parent CPU shares. |
| mem_weight | Number | Percentage of memory from the parent cgroup allocated to the category (> 0 and ≤ 100). |
| cpu_allocated_percent | Number | Derived percentage of CPU capacity allocated after normalization (example responses include decimals such as `70.00`). |
| mem_allocated_percent | Number | Derived percentage of memory allocated after normalization. |
| cpu_weight_sum | Number | Sum of cpu_weight values participating in normalization (example field). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/categories?output_mode=json
```

---

## GET /services/workloads/categories/{name}

Retrieve details for category `{name}` (`search`, `ingest`, or `misc`).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| cpu_weight | Number | Declared CPU weight for the category. |
| mem_weight | Number | Declared memory weight for the category. |
| cpu_allocated_percent | Number | Effective CPU allocation percentage after normalization. |
| mem_allocated_percent | Number | Effective memory allocation percentage after normalization. |
| cpu_weight_sum | Number | Aggregated CPU weights used for normalization. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/categories/search?output_mode=json
```

---

## POST /services/workloads/categories/{name}

Update CPU/memory weights for category `{name}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| cpu_weight | Number | No | — | Relative CPU weight (> 0 and ≤ 100). |
| mem_weight | Number | No | — | Relative memory percentage (> 0 and ≤ 100). |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented; Splunk returns updated feed entries reflecting new weights. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/categories/search \
  -d cpu_weight=40 -d mem_weight=50
```
