# REST bundle: `server/control`

**Category:** System

Grouped Splunk REST Reference endpoints.

---

# `/services/server/control`

List available controls.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/control` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/control?output_mode=json'
```

---

# `/services/server/control/restart`

Restart the splunkd server daemon and Splunk Web interface. The POST operation is equivalent to the`splunk restart` CLI command.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/control/restart` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/control/restart?output_mode=json'
```

---

# `/services/server/control/restart_webui`

Restart the Splunk Web interface. This interface is equivalent to the`splunk restart splunkweb` CLI command, and restarts the Web interface on servers with the default app server mode set. See also [server/control/restart](https://docs.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/system-endpoints/system-endpoint-descriptions#id_776ce8f6_81ed_499a_854a_d8cefe1f2257--en__server.2Fcontrol.2Frestart)

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/control/restart_webui` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/control/restart_webui?output_mode=json'
```

---

