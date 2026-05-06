# /services/search/fields

Access search field configurations. Usage details Field configuration is specified in$SPLUNK_HOME/etc/system/default/fields.conf, with overriden values in$SPLUNK_HOME/etc/system/local/fields.conf.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/fields` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/search/fields
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/fields
```

---

# /services/search/fields/{field_name}

Access the {field_name} field.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/fields/{field_name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/search/fields/{field_name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/fields/sourcetype
```

---

# /services/search/fields/{field_name}/tags

Access or update the tags associated with the {field_name} field.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/fields/{field_name}/tags` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/search/fields/{field_name}/tags
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/fields/host/tags
```

## POST /services/search/fields/{field_name}/tags
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| value | String | No | — | The specific field value on which to bind the tags. |
| add | String | No | — | The tag to attach to this`field_name:value` combination. |
| delete | String | No | — | The tag to remove to this`field_name::value` combination. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/fields/host/tags -d add=sfo -d delete=nyc -d value=location
```

---

# /services/search/tags

Access search time tags.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/tags` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/search/tags
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/tags
```

---

# /services/search/tags/{tag_name}

Access, update, or delete{tag_name} values.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/tags/{tag_name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/search/tags/{tag_name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/search/tags/user
```

## GET /services/search/tags/{tag_name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/tags/user
```

## POST /services/search/tags/{tag_name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| add | String | No | — | A field:value pair to tag with {tag_name}. |
| delete | String | No | — | A field:value pair to remove from {tag_name}. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/tags/user -d add=eventtype::userupdate -d delete=eventtype::useradd-suse
```
