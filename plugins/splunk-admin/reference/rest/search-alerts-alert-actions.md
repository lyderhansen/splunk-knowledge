# Alert actions

Enumerate configurable alert actions.

## `/services/alerts/alert_actions`

Access alert actions.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/alerts/alert_actions` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/alerts/alert_actions`

Access a list of alert actions.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Pagination and filtering parameters can be used with this method. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/-/alerts/alert_actions
```



---
