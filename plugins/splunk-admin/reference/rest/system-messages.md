# REST bundle: `messages`

**Category:** System

Grouped Splunk REST Reference endpoints.

---

# `/services/messages/{name}`

Manage the message associated with the`{name}` message ID.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/messages/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## DELETE

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/messages/YOUR_NAME?output_mode=json'
```

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| help | string | For internal use only |
|  | string | In the following example response, this field is`"manifest_error"`. |
| message | string | Message text |
| server | string | Name of the server that generated the error |
| severity | string |  |
| timeCreated_epochSecs | string | Timestamp when the message was posted |
| timeCreated_iso | string | ISO formatted timestamp |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/messages/YOUR_NAME?output_mode=json'
```

---

