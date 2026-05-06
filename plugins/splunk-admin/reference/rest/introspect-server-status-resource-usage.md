# REST bundle: `server/status/resource-usage`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/status/resource-usage`

Get current resource (CPU, RAM, VM, I/O, file handle) utilization for entire host, and per Splunk-related processes.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/resource-usage` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/resource-usage?output_mode=json'
```

---

# `/services/server/status/resource-usage/hostwide`

Access host-level dynamic CPU utilization and paging information.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/resource-usage/hostwide` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/resource-usage/hostwide?output_mode=json'
```

---

# `/services/server/status/resource-usage/iostats`

Access the most recent disk I/O statistics for each disk. This endpoint is currently supported for Linux, Windows, and Solaris. By default this endpoint is updated every 60s seconds.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/resource-usage/iostats` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| avg_service_ms | string | Average time requests caused the CPU to be in use, in milliseconds. |
| avg_total_ms | string | Average queue + execution time for requests to be completed, in milliseconds. |
| cpu_pct | string | Percentage of time the CPU was servicing requests. |
| device | string | Device name (e.g., as listed under /dev on UNIX). |
| fs_type | string | Mounted device file system type. |
| interval | string | Interval over which sampling occurred, in seconds. |
| mount_point | string | Mount point(s) of the underlying device. |
| reads_kb_ps | string | Total number of kb read per second. |
| reads_ps | string | Number of read requests per second. |
| writes_kb_ps | string | Total number of kb written per second. |
| writes_ps | string | Number of write requests per second. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/resource-usage/iostats?output_mode=json'
```

---

# `/services/server/status/resource-usage/splunk-processes`

Access operating system resource utilization information.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/resource-usage/splunk-processes` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| args | string | Non-search process arguments. |
| cpu_system_time | string | Cumulative time this process has spent executing in kernel (incl. system calls). Extra field. |
| cpu_user_time | string | Cumulative time this process has spent executing in user space (incl. library functions). Extra field. |
| elapsed | string | Elapsed wall time, accurate to within the [collection period](https://help.splunk.com/?resourceId=Splunk_Troubleshooting_ConfigurePIF). |
| fd_used | string | Number of currently open files used by this process. |
| label | string | Human-readable label for the saved search. |
| mem_unshared_data_used | string | Amount of heap and stack used. Not available on Windows. Extra field. |
| mem_used | string | On Windows, mem_used is obtained by reading the`WorkingSetSize` property returned by the`GetProcessMemoryInfo()` function (see [GetProcessMemoryInfo function](https://msdn.microsoft.com/en-us/library/windows/desktop/ms683219%28v=vs.85%29.aspx) and [PROCESS_MEMORY_COUNTERS structure](https://msdn.microsoft.com/en-us/library/windows/desktop/ms684877%28v=vs.85%29.aspx)). |
| normalized_pct_cpu | string | Percentage of CPU usage across all cores.`100%` is equivalent to all CPU resources on the machine. |
| page_faults | string | Number of major page faults. Extra field. |
| pct_cpu | string | Percentage of CPU usage, relative to one core.`100%` is equivalent to 1 core. |
| pct_memory | string | Percentage of physical memory used hostwide ((mem_used/available_host_memory) * 100). |
| pid | string | Process ID. |
| ppid | string | Parent process ID. Not available for all processes. |
| process | string | Process name. The`.exe` suffix is stripped on Windows operating systems. |
| read_mb | string | Amount of data read (MB), excluding cache reads. |
| search_head | string | Dispatching search head for processes running saved searches. |
| search_props | string |  |
| status | string | Status from the OS scheduler. Can be R (runnable or running), W (waiting), stopped, Z (zombie), or O (other). W includes voluntary sleep or blocking on I/O. O means status is knowable but does not fit into one of those categories. Not available on Windows. |
| t_count | string | Current number of threads. |
| written_mb | string | Amount of data written (MB), excluding canceled writes. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/resource-usage/splunk-processes?output_mode=json'
```

---

