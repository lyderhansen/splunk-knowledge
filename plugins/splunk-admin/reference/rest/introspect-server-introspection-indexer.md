# REST bundle: `server/introspection/indexer`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/introspection/indexer`

Access the current indexer status.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/indexer` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/indexer?output_mode=json'
```

---

