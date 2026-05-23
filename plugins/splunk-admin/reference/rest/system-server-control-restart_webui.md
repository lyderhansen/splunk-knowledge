# REST reference bundle: `server/control/restart_webui`

**Category:** System

This file groups related Splunk REST endpoints documented together.

---

# /services/server/control/restart_webui
Restart the Splunk Web interface. This interface is equivalent to the`splunk restart splunkweb` CLI command, and restarts the Web interface on servers with the default app server mode set. See also [server/control/restart](https://docs.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/system-endpoints/system-endpoint-descriptions#id_776ce8f6_81ed_499a_854a_d8cefe1f2257--en__server.2Fcontrol.2Frestart)
**Category:** System
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/server/control/restart_webui` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST `/services/server/control/restart_webui`
### Request parameters
| *(see Splunk docs)* | | | | None... |

### Returned values
| *(see response body / Splunk Atom XML)* | object | Full feed documented in Splunk REST reference. |

### Example
```
curl -k -u admin:pass -X POST https://localhost:8089/services/server/control/restart_webui?output_mode=json
```

---

