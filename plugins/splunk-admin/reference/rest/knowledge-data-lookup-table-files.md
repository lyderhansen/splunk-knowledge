# /services/data/lookup-table-files

Access lookup table files. Note: This endpoint is available only in Splunk Enterprise.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/lookup-table-files` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/lookup-table-files
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | The app for which the lookup table applies. |
| eai:data | String | The source path for the lookup staging area. The lookup table file is moved from here into $SPLUNK_HOME. |
| eai:userName | String | The Splunk user who created the lookup table. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/lookup-table-files
```

## POST /services/data/lookup-table-files
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | Move a lookup table file from the given path into $SPLUNK_HOME. This path must have the lookup staging area as an ancestor. |
| required | String | No | — | The lookup table filename. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | The app for which the lookup table applies. |
| eai:data | String | The source path for the lookup staging area. The lookup table file is moved from here into $SPLUNK_HOME. |
| eai:userName | String | The Splunk user who created the lookup table. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/lookup-table-files -d eai:data=/opt/splunk/var/run/splunk/lookup_tmp/lookup-in-staging-dir.csv -d name=lookup.csv
```

---

# /services/data/lookup-table-files/{name}

Manage the {name} lookup table file. Note: This endpoint is available only in Splunk Enterprise.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/lookup-table-files/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/lookup-table-files/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/data/lookup-table-files/lookup.csv
```

## GET /services/data/lookup-table-files/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | The app for which the lookup table applies. |
| eai:attributes | String | Field control information. |
| eai:data | String | The source path for the lookup staging area. The lookup table file is moved from here into $SPLUNK_HOME. |
| eai:userName | String | The Splunk user who created the lookup table. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/lookup-table-files/lookup.csv
```

## POST /services/data/lookup-table-files/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | Move a lookup table file from the given path into $SPLUNK_HOME. This path must have the lookup staging area as an ancestor. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | The app for which the lookup table applies. |
| eai:data | String | The source path for the lookup staging area. The lookup table file is moved from here into $SPLUNK_HOME. |
| eai:userName | String | The Splunk user who created the lookup table. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/lookup-table-files/lookup.csv -d eai:data=/opt/splunk/var/run/splunk/lookup_tmp/another-lookup-in-staging-dir.csv
```
