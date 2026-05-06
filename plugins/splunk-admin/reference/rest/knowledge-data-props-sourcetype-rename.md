# /services/data/props/sourcetype-rename

Access or renameprops.conf sourcetypes.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/sourcetype-rename` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/props/sourcetype-rename
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The configuration key. |
| stanza | Various | The sourcetype to rename, which is the name of a stanza in props.conf. |
| type | Various | The value of the configuration key. |
| value | Various | The new name for the sourcetype. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/sourcetype-rename
```

## POST /services/data/props/sourcetype-rename
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | The original sourcetype name. |
| required | String | No | — | The new sourcetype name. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The configuration key. |
| stanza | Various | The sourcetype to rename, which is the name of a stanza in props.conf. |
| type | Various | The value of the configuration key. |
| value | Various | The new name for the sourcetype. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/sourcetype-rename -d name=hardware -d value=hw
```

---

# /services/data/props/sourcetype-rename/{name}

Access, delete, or update a sourcetype name.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/sourcetype-rename/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/props/sourcetype-rename/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/data/props/sourcetype-rename/hardware
```

## GET /services/data/props/sourcetype-rename/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The configuration key. |
| stanza | Various | The sourcetype to rename, which is the name of a stanza in props.conf. |
| type | Various | The value of the configuration key. |
| value | Various | The new name for the sourcetype. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/sourcetype-rename/hardware
```

## POST /services/data/props/sourcetype-rename/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | The new sourcetype name. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The configuration key. |
| stanza | Various | The sourcetype to rename, which is the name of a stanza in props.conf. |
| type | Various | The value of the configuration key. |
| value | Various | The new name for the sourcetype. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/sourcetype-rename/hardware -d value=hrdwr
```
