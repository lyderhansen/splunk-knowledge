# /services/data/props/extractions

Splunk REST endpoint.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/extractions` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/props/extractions
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| stanza | Various |  |
| type | Various | Specifies the field extraction type, which can be either`inline` or`uses transform`. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/extractions
```

## POST /services/data/props/extractions
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | The user-specified part of the field extraction name. The full name of the field extraction includes this identifier as a suffix. |
| required | String | No | — | The props.conf stanza to which this field extraction applies, e.g. the sourcetype or source that triggers this field extraction. The full name of the field extraction includes this stanza name as a prefix. |
| required | String | No | — | If this is an EXTRACT-type field extraction, specify a regular expression with named capture groups that define the desired fields. If this is a REPORT-type field extraction, specify a comma- or space-delimited list of transforms.conf stanza names that define the field transformations to apply. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| stanza | Various | Specifies the name of the stanza for the field extraction. |
| type | Various | Specifies the field extraction type, which can be either`inline` or`uses transform`. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/extractions -d name=port -d stanza=ftp_log -d type=EXTRACT -d "value=port (? \d+)"
```

---

# /services/data/props/extractions/{name}

Manage the {name} field extraction.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/extractions/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/props/extractions/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/data/props/extractions/ftp_log%20%3A%20EXTRACT-port
```

## GET /services/data/props/extractions/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| stanza | Various |  |
| type | Various | Specifies the field extraction type, which can be either`inline` or`uses transform`. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/extractions/ftp_log%20%3A%20EXTRACT-port
```

## POST /services/data/props/extractions/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | If this is an EXTRACT-type field extraction, specify a regular expression with named capture groups that define the desired fields. If this is a REPORT-type field extraction, specify a comma- or space-delimited list of transforms.conf stanza names that define the field transformations to apply. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| stanza | Various | Specifies the name of the stanza for the field extraction. |
| type | Various | Specifies the field extraction type, which can be either`inline` or`uses transform`. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/extractions/ftp_log%20%3A%20EXTRACT-port -d "value=connection on port (? \d+)"
```
