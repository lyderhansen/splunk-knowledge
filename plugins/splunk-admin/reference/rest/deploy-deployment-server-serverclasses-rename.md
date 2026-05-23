# REST reference bundle: `deployment/server/serverclasses/rename`

**Category:** Deployment

This file groups related Splunk REST endpoints documented together.

---

# /services/deployment/server/serverclasses/rename
Rename a server class.
**Category:** Deployment
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/serverclasses/rename` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST `/services/deployment/server/serverclasses/rename`
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | The new name of the server class. |  |  |
| required | String | The current name of the server class. |  |  |

### Returned values
| *(see response body / Splunk Atom XML)* | object | Full feed documented in Splunk REST reference. |

### Example
```
curl -k -u admin:pass -X POST https://localhost:8089/services/deployment/server/serverclasses/rename?output_mode=json
```

---

