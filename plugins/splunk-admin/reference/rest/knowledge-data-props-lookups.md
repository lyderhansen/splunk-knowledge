# /services/data/props/lookups

Access or create automatic lookups.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/lookups` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/props/lookups
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| overwrite | Various | If set to true, output fields are always overridden. If set to false, output fields are only written out if they do not already exist. |
| stanza | Various |  |
| transform | Various | The transforms.conf stanza that defines the lookup to apply. |
| type | Various |  |
| value | Various | The transform stanza with the value for the lookup. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/lookups
```

## POST /services/data/props/lookups
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| lookup.field.input.* | String | No | — | A column in the lookup table to match against. Supply a non-empty value if the corresponding field has a different name in your actual events. |
| lookup.field.output.* | String | No | — | A column in the lookup table to output. Supply a non-empty value if the field should have a different name in your actual events. |
| required | String | No | — | The user-specified part of the automatic lookup name. The full name of the automatic lookup includes this identifier as a suffix. |
| required | Boolean | No | — | If set to true, output fields are always overridden. If set to false, output fields are only written out if they do not already exist. |
| required | String | No | — | The props.conf stanza to which this automatic lookup applies, e.g. the sourcetype or source that automatically triggers this lookup. The full name of the automatic lookup includes this stanza name as a prefix. |
| required | String | No | — | The transforms.conf stanza that defines the lookup to apply. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| lookup.field.input.* | Various | A column in the lookup table to match against. Supply a non-empty value if the corresponding field has a different name in your actual events. |
| lookup.field.output.* | Various | A column in the lookup table to output. Supply a non-empty value if the field should have a different name in your actual events. |
| overwrite | Various | If set to true, output fields are always overridden. If set to false, output fields are only written out if they do not already exist. |
| stanza | Various |  |
| transform | Various | The transforms.conf stanza that defines the lookup to apply. |
| type | Various |  |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/lookups -d name=my_lookup -d overwrite=1 -d stanza=my_sourcetype -d transform=my_transform -d lookup.field.input.foo= -d lookup.field.output.fuzz=
```

---

# /services/data/props/lookups/{name}

Manage the {name} automatic lookup.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/props/lookups/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/props/lookups/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/data/props/lookups/my_sourcetype%20%3A%20LOOKUP-my_lookup
```

## GET /services/data/props/lookups/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| overwrite | Various | If set to true, output fields are always overridden. If set to false, output fields are only written out if they do not already exist. |
| stanza | Various |  |
| transform | Various | The transforms.conf stanza that defines the lookup to apply. |
| type | Various |  |
| value | Various | The transform stanza with the value for the lookup. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/lookups/my_sourcetype%20%3A%20LOOKUP-my_lookup
```

## POST /services/data/props/lookups/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| lookup.field.input.* | String | No | — | A column in the lookup table to match against. Supply a non-empty value if the corresponding field has a different name in your actual events. |
| lookup.field.output.* | String | No | — | A column in the lookup table to output. Supply a non-empty value if the field should have a different name in your actual events. |
| required | Boolean | No | — | If set to true, output fields are always overridden. If set to false, output fields are only written out if they do not already exist. |
| required | String | No | — | The transforms.conf stanza that defines the lookup to apply. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| attribute | Various |  |
| lookup.field.input.* | Various | A column in the lookup table to match against. Supply a non-empty value if the corresponding field has a different name in your actual events. |
| lookup.field.output.* | Various | A column in the lookup table to output. Supply a non-empty value if the field should have a different name in your actual events. |
| overwrite | Various | If set to true, output fields are always overridden. If set to false, output fields are only written out if they do not already exist. |
| stanza | Various |  |
| transform | Various | The transforms.conf stanza that defines the lookup to apply. |
| type | Various |  |
| value | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/props/lookups/my_sourcetype%20%3A%20LOOKUP-my_lookup -d overwrite=1 -d transform=other_transform -d lookup.field.input.bar= -d lookup.field.output.buzz=
```
