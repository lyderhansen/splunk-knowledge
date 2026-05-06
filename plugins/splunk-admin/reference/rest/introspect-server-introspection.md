# REST bundle: `server/introspection`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/introspection`

Access system introspection artifacts.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection?output_mode=json'
```

---

