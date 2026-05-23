# REST reference bundle: `server/control/restart`

**Category:** System

This file groups related Splunk REST endpoints documented together.

---

# /services/server/control/restart
Restart the splunkd server daemon and Splunk Web interface. The POST operation is equivalent to the`splunk restart` CLI command.
**Category:** System
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/server/control/restart` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST `/services/server/control/restart`
### Request parameters
| *(see Splunk docs)* | | | | None... |

### Returned values
| *(see response body / Splunk Atom XML)* | object | Full feed documented in Splunk REST reference. |

### Example
```
curl -k -u admin:pass -X POST https://localhost:8089/services/server/control/restart?output_mode=json
```

---

