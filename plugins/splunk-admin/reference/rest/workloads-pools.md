# /services/workloads/pools

Create, list, inspect, update, and delete workload pools that carve CPU/memory resources within each workload category.

**Category:** Workloads

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/workloads/pools`, `/services/workloads/pools/{name}` |
| Auth required | Yes |
| Capability | GET: `list_workload_pools`; POST / DELETE: `edit_workload_pools` |

### Splunk Cloud Platform

Workload endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/workloads/pools

List workload pools.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| category | String | Category hosting the pool (`search`, `ingest`, `misc`). |
| cpu_weight | Number | Relative CPU share inside the category. |
| mem_weight | Number | Relative memory share inside the category. |
| cpu_allocated_percent | Number | Effective CPU percentage allocated to the pool. |
| mem_allocated_percent | Number | Effective memory percentage allocated to the pool. |
| cpu_shares | Number | cgroup CPU shares calculated for the pool. |
| mem_limit | Number | Memory limit in bytes allocated to the pool. |
| default_category_pool | Boolean | `1` when this pool is the category default. |
| default_pool | Boolean | Deprecated compatibility flag for search default pools (retained for 7.2.x upgrades). |
| ingest_pool | Boolean | Deprecated compatibility flag for ingest default pools (retained for 7.2.x upgrades). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/pools?output_mode=json
```

---

## POST /services/workloads/pools

Create a workload pool.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Pool name to create. |
| category | String | Yes | — | `search`, `ingest`, or `misc`. |
| cpu_weight | Number | Yes | — | Relative CPU fraction versus sibling pools in the category. |
| mem_weight | Number | Yes | — | Documentation stresses setting `100` to avoid out-of-memory errors when provisioning pools. |
| default_category_pool | Boolean | No | `0` | Marks the pool as the category default. |
| default_pool | Boolean | No | — | Deprecated search-default toggle retained for compatibility. |
| ingest_pool | Boolean | No | — | Deprecated ingest-default toggle retained for compatibility. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented; Splunk echoes created pool entries in feed responses. |

### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/workloads/pools \
  -d name=search_pool_3 \
  -d category=search \
  -d cpu_weight=40 \
  -d mem_weight=100 \
  -d default_category_pool=1
```

---

## GET /services/workloads/pools/{name}

Return metadata for pool `{name}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| category | String | Hosting workload category. |
| cpu_weight | Number | Relative CPU weight. |
| mem_weight | Number | Relative memory weight. |
| cpu_allocated_percent | Number | Effective CPU allocation. |
| mem_allocated_percent | Number | Effective memory allocation. |
| cpu_shares | Number | cgroup CPU shares. |
| mem_limit | Number | cgroup memory limit (bytes). |
| default_category_pool | Boolean | Category default marker. |
| default_pool | Boolean | Deprecated compatibility flag. |
| ingest_pool | Boolean | Deprecated compatibility flag. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/pools/search_pool_1?output_mode=json
```

---

## POST /services/workloads/pools/{name}

Edit pool `{name}` using Splunk’s REST edit semantics (fields mirror optional POST arguments documented for pools such as `cpu_weight`, `mem_weight`, `default_category_pool`, deprecated flags).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| cpu_weight | Number | No | — | Updated CPU weight. |
| mem_weight | Number | No | — | Updated memory weight (Splunk docs highlight keeping `100` where required to avoid OOM issues). |
| default_category_pool | Boolean | No | — | Toggle category default status. |
| default_pool | Boolean | No | — | Deprecated compatibility flag. |
| ingest_pool | Boolean | No | — | Deprecated compatibility flag. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented explicitly; responses mirror GET payload after edits. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/pools/search_pool_1 \
  -d cpu_weight=30 -d mem_weight=100
```

---

## DELETE /services/workloads/pools/{name}

Remove pool `{name}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented. |

### Example

```
curl -k -u admin:pass -X DELETE https://localhost:8089/services/workloads/pools/search_pool_tmp
```
