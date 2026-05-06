# REST bundle: `server/security/rotate-splunk-secret`

**Category:** System

Grouped Splunk REST Reference endpoints.

---

# `/services/server/security/rotate-splunk-secret`

Rotates the`splunk.secret` file on a standalone Splunk Enterprise instance.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/security/rotate-splunk-secret` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/security/rotate-splunk-secret?output_mode=json'
```

---

