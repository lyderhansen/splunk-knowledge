# REST reference bundle: `deployment/server/config/_subs`

**Category:** Deployment

This file groups related Splunk REST endpoints documented together.

---

# /services/deployment/server/config/attributesUnsupportedInUI
Access deployment server attributes that cannot be configured from Splunk Web.
**Category:** Deployment
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/config/attributesUnsupportedInUI` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET `/services/deployment/server/config/attributesUnsupportedInUI`
### Request parameters
| *(see Splunk docs)* | | | | None... |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| property | string | The attribute that cannot be configured from Splunk Web. |
| reason | string | The reason an attribute cannot be configured from Splunk Web. |
| stanza | string | In Splunk Enterprise, the stanza in`serverclass.conf` that lists deployment server attributes that cannot be configured from Splunk Web. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/deployment/server/config/attributesUnsupportedInUI?output_mode=json
```

---

# /services/deployment/server/config/listIsDisabled
Access deployment server enablement status.
**Category:** Deployment
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/config/listIsDisabled` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET `/services/deployment/server/config/listIsDisabled`
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Indicates if the deployment server is disabled. |  |  |  |

### Returned values
| *(see response body / Splunk Atom XML)* | object | Full feed documented in Splunk REST reference. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/deployment/server/config/listIsDisabled?output_mode=json
```

---

