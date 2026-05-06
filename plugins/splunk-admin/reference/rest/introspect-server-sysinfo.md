# REST bundle: `server/sysinfo`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/sysinfo`

Exposes relevant information about the resources and OS settings of the machine where Splunk Enterprise is running.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/sysinfo` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| cpu_arch | string | Server CPU architecture. |
| numberOfCores | string | Number of server processor cores. Not applicable if host is a VM guest. A value of`0` is returned if the number cannot be accessed and the access failure reason is logged to`splunkd.log`. |
| numberOfVirtualCores | string | Number of server virtual cores. |
| os_build | string | Software build for the server os_version. |
| os_name | string | Server operating system name. |
| os_name_extended | string | Server operating system name. |
| os_version | string | Server operating system version. |
| physicalMemoryMB | string | Server physical memory (MB). The same value is returned as the`mem` field from`server/status/resource-usage/hostwide`. A value of`0` is returned if the number cannot be accessed and the access failure reason is logged to`splunkd.log`. |
| transparent_hugepages | string |  |
| ulimits | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/sysinfo?output_mode=json'
```

---

