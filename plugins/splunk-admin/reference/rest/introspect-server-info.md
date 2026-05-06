# REST bundle: `server/info`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/info`

Access information about the currently running Splunk instance.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/info` |
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
curl -k -u admin:pass 'https://localhost:8089/services/server/info?output_mode=json'
```

---

