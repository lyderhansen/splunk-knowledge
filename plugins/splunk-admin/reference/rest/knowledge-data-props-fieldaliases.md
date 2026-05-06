# /services/data/props/fieldaliases

Access or create field aliases.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/fieldaliases` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/props/fieldaliases
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| alias.* | Various | The user-specified part of the field alias name. The full name of the field alias includes this identifier as a suffix. |
| attribute | Various |  |
| stanza | Various | The props.conf stanza to which this field alias applies, e.g. the sourcetype or source that causes this field alias to be applied. The full name of the field alias includes this stanza name as a prefix. |
| type | Various | Specifies the field extraction type, which can be either`inline` or`uses transform`. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/fieldaliases
```

## POST /services/data/props/fieldaliases
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| alias.* | Various | The user-specified part of the field alias name. The full name of the field alias includes this identifier as a suffix. |
| attribute | Various |  |
| stanza | Various | The props.conf stanza to which this field alias applies, e.g. the sourcetype or source that causes this field alias to be applied. The full name of the field alias includes this stanza name as a prefix. |
| type | Various | Specifies the field extraction type, which can be either inline or uses transform. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/fieldaliases -d name=alias_name -d stanza=my_sourcetype -d alias.foo=bar
```

---

# /services/data/props/fieldaliases/{name}

Manage the {name} field alias.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/fieldaliases/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/props/fieldaliases/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/data/props/fieldaliases/my_sourcetype%20%3A%20FIELDALIAS-alias_name
```

## GET /services/data/props/fieldaliases/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| alias.* | Various | The user-specified part of the field alias name. The full name of the field alias includes this identifier as a suffix. |
| attribute | Various |  |
| stanza | Various | The props.conf stanza to which this field alias applies, e.g. the sourcetype or source that causes this field alias to be applied. The full name of the field alias includes this stanza name as a prefix. |
| type | Various | Specifies the field extraction type, which can be either`inline` or`uses transform`. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/fieldaliases/my_sourcetype%20%3A%20FIELDALIAS-alias_name
```

## POST /services/data/props/fieldaliases/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| alias.* | String | No | — | The alias for a given field. For example, supply a value of "bar" for an argument "alias.foo" to alias "foo" to "bar". |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| alias.* | Various | The alias for a given field. For example, supply a value of "bar" for an argument "alias.foo" to alias "foo" to "bar". |
| attribute | Various |  |
| stanza | Various | The props.conf stanza to which this field alias applies, e.g. the sourcetype or source that causes this field alias to be applied. The full name of the field alias includes this stanza name as a prefix. |
| type | Various | Specifies the field extraction type, which can be either inline or uses transform. |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/fieldaliases/my_sourcetype%20%3A%20FIELDALIAS-alias_name -d alias.hi=hello -d alias.bye=goodbye
```
