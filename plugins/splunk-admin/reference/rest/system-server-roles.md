# REST bundle: `server/roles`

**Category:** System

Grouped Splunk REST Reference endpoints.

---

# `/services/server/roles`

Access server role information.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/roles` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
|  | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/roles?output_mode=json'
```

---

