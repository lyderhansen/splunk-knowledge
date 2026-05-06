# /services/directory

Access user configurable objects. These objects includes search commands, UI views, UI navigation, saved searches and event types. This is useful to see which objects are provided by all apps, or a specific app when the call is namespaced.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/directory` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/directory
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/directory
```

---

# /services/directory/{name}

Get information about the {name} directory entity. Usage details This is rarely used. Typically after using the directory service enumeration, a client follows the specific link for an object in an enumeration.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/directory/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/directory/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:type | String | Entity type. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/directory/dashboard_live
```
