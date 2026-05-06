# /services/data/props/calcfields

Provides access to calculated fields, which are eval expressions in props.conf.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/calcfields` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/props/calcfields
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The name of the calculated field, which includes the "EVAL-" prefix. |
| field.name | Various | The name of the field which is being calculated with an EVAL expression. |
| stanza | Various | The name of the stanza in props.conf that defines the calculated field. |
| type | Various |  |
| value | Various | The EVAL statement for the calculated field. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/data/props/calcfields
```

## POST /services/data/props/calcfields
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The name of the calculated field, which includes the "EVAL-" prefix. |
| field.name | Various | The name of the field which is being calculated with an EVAL expression. |
| stanza | Various | The name of the stanza in props.conf that defines the calculated field. |
| type | Various |  |
| value | Various | The EVAL statement for the calculated field. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/data/props/calcfields -d name=response_time -d stanza=%3Caccess_common%3E -d value=response_time/1000
```

---

# /services/data/props/calcfields/{name}

Manage the {name} calculated field.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/calcfields/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/props/calcfields/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/services/data/props/calcfields/%3Caccess_common%3E%20%3A%20EVAL-response_time
```

## GET /services/data/props/calcfields/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The name of the calculated field, which includes the "EVAL-" prefix. |
| field.name | Various | The name of the field which is being calculated with an EVAL expression. |
| stanza | Various | The name of the stanza in props.conf that defines the calculated field. |
| type | Various |  |
| value | Various | The EVAL statement for the calculated field. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/data/props/calcfields/%3Caccess_common%3E%20%3A%20EVAL-response_time
```

## POST /services/data/props/calcfields/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various | The name of the calculated field, which includes the "EVAL-" prefix. |
| field.name | Various | The name of the field which is being calculated with an EVAL expression. |
| stanza | Various | The name of the stanza in props.conf that defines the calculated field. |
| type | Various |  |
| value | Various | The EVAL statement for the calculated field. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/data/props/calcfields/%3Caccess_common%3E%20%3A%20EVAL-response_time -d value=response_time/100
```
