# /services/saved/eventtypes

Access or create an event type.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/eventtypes` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/saved/eventtypes
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| description | Various | Description of this event type. |
| disabled | Various | Indicates if the event type is disabled. |
| eai:appName | String | The Splunk app for which this event type applies. For example, the Splunk search app. |
| eai:userName | String | Splunk user name of the creator of this event type. For example, the Splunk admin user. |
| priority | Various | The value used to determine the order in which the matching event types of an event are displayed. 1 is the highest priority. |
| search | Various | Search terms for this event type. |
| tags | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/eventtypes
```

## POST /services/saved/eventtypes
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | No | — | The name for the event type. |
| search | String | No | — | Search terms for this event type. |
| description | String | No | — | Human-readable description of this event type. |
| disabled | Boolean | No | 0 | If True, disables the event type. |
| priority | Number | No | 1 | Specify an integer from 1 to 10 for the value used to determine the order in which the matching event types of an event are displayed. 1 is the highest priority. |
| tags | String | No | — | [Deprecated] Use`tags.conf.spec` file to assign tags to groups of events with related field values. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| description | Various | Description of this event type. |
| disabled | Various | Indicates if this event type is disabled. |
| eai:appName | String | The Splunk app for which this event type applies. For example, the Splunk search app. |
| eai:userName | String | Splunk user name of the creator of this event type. For example, the Splunk admin user. |
| priority | Various | The value used to determine the order in which the matching event types of an event are displayed. 1 is the highest priority. |
| search | Various | Search terms for this event type. |
| tags | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/eventtypes -d name="client-errors" --data-urlencode search=search="http client error NOT (403 OR 404)"
```

---

# /services/saved/eventtypes/{name}

Manage the {name} event type.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/eventtypes/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/saved/eventtypes/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/saved/eventtypes/client-errors
```

## GET /services/saved/eventtypes/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| description | Various | Description of this event type. |
| disabled | Various | Indicates if the event type is disabled. |
| eai:appName | String | The Splunk app for which this event type applies. For example, the Splunk search app. |
| eai:attributes | String | Field control information. |
| eai:userName | String | Splunk user name of the creator of this event type. For example, the Splunk admin user. |
| priority | Various | The value used to determine the order in which the matching event types of an event are displayed. 1 is the highest priority. |
| search | Various | Search terms for this event type. |
| tags | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/eventtypes/client-errors
```

## POST /services/saved/eventtypes/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| search | String | No | — | Search terms for this event type. |
| description | String | No | — | Human-readable description of this event type. |
| disabled | Boolean | No | 0 | If True, disables the event type. |
| priority | Number | No | 1 | Specify an integer from 1 to 10 for the value used to determine the order in which the matching event types of an event are displayed. 1 is the highest priority. |
| tags | String | No | — | [Deprecated] Use`tags.conf.spec` file to assign tags to groups of events with related field values. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| description | Various | Description of this event type. |
| disabled | Various | Indicates if this event type is disabled. |
| eai:appName | String | The Splunk app for which this event type applies. For example, the Splunk search app. |
| eai:userName | String | Splunk user name of the creator of this event type. For example, the Splunk admin user. |
| priority | Various | The value used to determine the order in which the matching event types of an event are displayed. 1 is the highest priority. |
| search | Various | Search terms for this event type. |
| tags | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/eventtypes/client-errors -d description="HTTP Client Errors" --data-urlencode search=search="http client error NOT (403 OR 404)"
```
