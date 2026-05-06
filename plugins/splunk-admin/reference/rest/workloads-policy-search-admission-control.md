# /services/workloads/policy/search_admission_control

Toggle Splunk admission-control (`search_filter`) enforcement independent from broader workload routing rules.

**Category:** Workloads

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/workloads/policy/search_admission_control` |
| Auth required | Yes |
| Capability | GET: `list_workload_policy`; POST: `edit_workload_policy` |

> **Note:** Splunk’s REST reference heading historically referenced `/services/search/workloads/policy/search_admission_control`, while shipped examples use `/services/workloads/policy/search_admission_control`. This document follows the working curl/XML feed IDs.

### Splunk Cloud Platform

Workload endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/workloads/policy/search_admission_control

Return whether admission rules are enabled.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| admission_rules_enabled | Boolean | `1` enables admission rules; `0` disables them. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/policy/search_admission_control?output_mode=json
```

---

## POST /services/workloads/policy/search_admission_control

Enable or disable admission rules processing.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| admission_rules_enabled | Boolean | Yes | — | `1` enables admission rules; `0` disables them. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented (feed echoes updated policy entry). |

### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/workloads/policy/search_admission_control \
  -d admission_rules_enabled=1
```
