# /services/workloads/config/*

Operational helpers for enabling/disabling workload management, inspecting cgroup base directories, running Linux preflight validation, and updating cgroup naming on non-systemd deployments.

**Category:** Workloads

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/workloads/config/enable`, `/services/workloads/config/disable`, `/services/workloads/config/get-base-dirname`, `/services/workloads/config/set-base-dirname`, `/services/workloads/config/preflight-checks` |
| Auth required | Yes |
| Capability | `enable` / `disable` / `set-base-dirname`: `edit_workload_pools`; `get-base-dirname`: `edit_workload_pools`; `preflight-checks`: `list_workload_pools` **and** `edit_workload_pools` |

### Splunk Cloud Platform

Workload endpoints are generally **not** available on Splunk Cloud Platform.

---

## POST /services/workloads/config/enable

Turn workload management on.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented (feed references parent `/services/workloads/config` collection). |

### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/workloads/config/enable
```

---

## POST /services/workloads/config/disable

Turn workload management off.

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
curl -k -u admin:pass -X POST https://localhost:8089/services/workloads/config/disable
```

---

## GET /services/workloads/config/get-base-dirname

Fetch the Splunk parent cgroup directory name (ignored on systemd hosts—only meaningful for legacy cgroup layouts).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| workload_pool_base_dir_name | String | Parent cgroup directory Splunk should nest workload pools under when systemd delegation is unavailable. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/config/get-base-dirname?output_mode=json
```

---

## POST /services/workloads/config/set-base-dirname

Persist a new parent cgroup directory name (non-systemd deployments only).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| workload_pool_base_dir_name | String | Yes | — | Desired cgroup parent directory name. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/config/set-base-dirname \
  -d workload_pool_base_dir_name=splunkbase
```

---

## GET /services/workloads/config/preflight-checks

Execute Linux readiness checks (cgroup version, Splunk systemd unit, Delegates, permissions, etc.).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| cgroup_version.title | String | Check title (`Cgroup Version`). |
| cgroup_version.preflight_check_status | Number | Status flag from Splunk’s checker (example responses use `1`). |
| cgroup_version.mitigation | String | Remediation text when checks fail. |
| cpu_splunk_base_dir_permission.title | String | CPU cgroup permission check title. |
| cpu_splunk_base_dir_permission.preflight_check_status | Number | Status flag. |
| cpu_splunk_base_dir_permission.mitigation | String | Mitigation narrative. |
| cpu_splunk_base_dir_present.title | String | CPU cgroup presence title. |
| cpu_splunk_base_dir_present.preflight_check_status | Number | Status flag. |
| cpu_splunk_base_dir_present.mitigation | String | Mitigation narrative. |
| delegate_set.title | String | systemd Delegate property check title. |
| delegate_set.preflight_check_status | Number | Status flag. |
| delegate_set.mitigation | String | Mitigation narrative (often instructs setting Delegate=true). |
| launched_under_systemd.title | String | Splunk systemd launch validation title. |
| launched_under_systemd.preflight_check_status | Number | Status flag. |
| launched_under_systemd.mitigation | String | Mitigation narrative referencing Restart/ExecStart expectations. |
| memory_splunk_base_dir_permission.title | String | Memory cgroup permission title. |
| memory_splunk_base_dir_permission.preflight_check_status | Number | Status flag. |
| memory_splunk_base_dir_permission.mitigation | String | Mitigation narrative. |
| memory_splunk_base_dir_present.title | String | Memory cgroup presence title. |
| memory_splunk_base_dir_present.preflight_check_status | Number | Status flag. |
| memory_splunk_base_dir_present.mitigation | String | Mitigation narrative. |
| platform_type.title | String | Operating system compatibility title (`Operating System`). |
| platform_type.preflight_check_status | Number | Status flag. |
| platform_type.mitigation | String | Mitigation narrative (expects Linux). |
| unit_file_present.title | String | Unit file detection title. |
| unit_file_present.preflight_check_status | Number | Status flag. |
| unit_file_present.mitigation | String | Mitigation narrative referencing Splunkd.service. |
| general.preflight_checks_status | Number | Aggregate readiness indicator. |
| general.systemd_present | Number | Indicates whether systemd detection succeeded (example shows `1`). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/config/preflight-checks?output_mode=json
```
