# /services/workloads/status

Snapshot Splunk workload-management health: enablement state, OS compatibility, cgroup-backed pool telemetry, and configured workload rules.

**Category:** Workloads

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/workloads/status` |
| Auth required | Yes |
| Capability | `list_workload_pools` |

### Splunk Cloud Platform

Workload endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/workloads/status

Return consolidated workload management status.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| advanced | Boolean | No | — | When `advanced=1`, responses include per-process dispatch timestamps inside each search pool (per Splunk REST reference). |

### Returned values — general

| Name | Type | Description |
|------|------|-------------|
| general.default_pool | String | Workload pool designated as the overall default (example: `default_search_pool`). |
| general.ingest_pool | String | Pool designated for ingest workloads (`default_ingest_pool` in samples). |
| general.error_message | String | Last error encountered while enabling workload management; cleared after successful enablement. |
| general.enabled | Boolean | Whether workload management is active (`1`/`0`). |
| general.isSupported | Boolean | Whether the OS/stack supports workload management (`1`/`0`). |
| general.os_build | String | Kernel/OS build string. |
| general.os_extended_name | String | Extended OS marketing name (`Linux` in samples). |
| general.os_name | String | Short OS name. |
| general.os_version | String | Kernel/OS version string. |

### Returned values — workload pools (`workload-pools`)

Each child key is a pool name mapping to:

| Name | Type | Description |
|------|------|-------------|
| cpu_group | String | cgroup filesystem path for CPU controllers associated with the pool. |
| cpu_weight | Number | Effective normalized CPU weight inside cgroup telemetry snapshots. |
| mem_group | String | cgroup filesystem path for memory controllers associated with the pool. |
| mem_weight | Number | Effective normalized memory weight inside cgroup telemetry snapshots. |

*(When `advanced=1`, Splunk documents additional per-process dispatch timing nested beneath pools.)*

### Returned values — workload rules (`workload-rules`)

Each child key is a rule name mapping to:

| Name | Type | Description |
|------|------|-------------|
| order | Number | Evaluation priority for the rule. |
| predicate | String | Predicate text (`role=…`, `app=…`, etc.). |
| workload_pool | String | Target workload pool selected when the predicate matches. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/status?output_mode=json
```

```
curl -k -u admin:pass "https://localhost:8089/services/workloads/status?advanced=1&output_mode=json"
```
