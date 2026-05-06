# /services/data/transforms/extractions

Access field extraction definitions.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/transforms/extractions` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/transforms/extractions
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Splunk REST prologue parameters | Various | No | — | Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| CAN_OPTIMIZE | Various |  |
| CLEAN_KEYS | Various | If set to true, Splunk software "cleans" the field names extracted at search time by replacing non-alphanumeric characters with underscores and stripping leading underscores. |
| DEFAULT_VALUE | Various | Optional attribute for index-time field extractions. Splunk software writes the specified value to DEST_KEY if the specified REGEX fails. |
| DEST_KEY | Various | Valid for index-time field extractions, specifies where Splunk software stores the REGEX results. |
| FORMAT | Various |  |
| KEEP_EMPTY_VALS | Various | If set to true, Splunk software preserves extracted fields with empty values. |
| LOOKAHEAD | Various |  |
| MV_ADD | Various | If Splunk software extracts a field that already exists and MV_ADD is set to true, the field becomes multivalued, and the newly-extracted value is appended. If MV_ADD is set to false, the newly-extracted value is discarded. |
| REGEX | Various |  |
| SOURCE_KEY | Various | The KEY to which Splunk software applies REGEX. |
| WRITE_META | Various |  |
| disabled | Various | Indicates if the field transformation is disabled. |
| eai:appName | String | The Splunk app for which the field extractions are defined. For example, the search app. |
| eai:userName | String | The name of the Splunk user who created the field extraction definitions. For example, the admin user. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/transforms/extractions
```

---

# /services/data/transforms/extractions/{name}

Access, delete, or update the {name} field extraction.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/transforms/extractions/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/transforms/extractions/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/data/transforms/extractions/my_transform
```

## GET /services/data/transforms/extractions/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| CAN_OPTIMIZE | Various |  |
| CLEAN_KEYS | Various | If set to true, Splunk software "cleans" the field names extracted at search time by replacing non-alphanumeric characters with underscores and stripping leading underscores. |
| DEFAULT_VALUE | Various | Optional attribute for index-time field extractions. Splunk software writes the specified value to DEST_KEY if the specified REGEX fails. |
| DEST_KEY | Various | Valid for index-time field extractions, specifies where Splunk software stores the REGEX results. |
| FORMAT | Various |  |
| KEEP_EMPTY_VALS | Various | If set to true, Splunk software preserves extracted fields with empty values. |
| LOOKAHEAD | Various |  |
| MV_ADD | Various | If Splunk software extracts a field that already exists and MV_ADD is set to true, the field becomes multivalued, and the newly-extracted value is appended. If MV_ADD is set to false, the newly-extracted value is discarded. |
| REGEX | Various |  |
| SOURCE_KEY | Various | The KEY to which Splunk software applies REGEX. |
| WRITE_META | Various |  |
| disabled | Various | Indicates if the field transformation is disabled. |
| eai:appName | String | The Splunk app for which the field extractions are defined. For example, the search app. |
| eai:attributes | String | Field control information. |
| eai:userName | String | The name of the Splunk user who created the field extraction definitions. For example, the admin user. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/transforms/extractions/my_transform
```

## POST /services/data/transforms/extractions/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| SOURCE_KEY | String | No | _raw | Specify the KEY to which Splunk software applies REGEX. |
| CAN_OPTIMIZE | Bool | No | — | True |
| CLEAN_KEYS | Boolean | No | True | If set to true, Splunk software "cleans" the field names extracted at search time by replacing non-alphanumeric characters with underscores and stripping leading underscores. |
| KEEP_EMPTY_VALS | Boolean | No | False | If set to true, Splunk software preserves extracted fields with empty values. |
| MV_ADD | Boolean | No | False | If Splunk software extracts a field that already exists and MV_ADD is set to true, the field becomes multivalued, and the newly-extracted value is appended. If MV_ADD is set to false, the newly-extracted value is discarded. |
| disabled | Boolean | No | — | Specifies whether the field transformation is disabled. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| CAN_OPTIMIZE | Various |  |
| CLEAN_KEYS | Various | If set to true, Splunk software "cleans" the field names extracted at search time by replacing non-alphanumeric characters with underscores and stripping leading underscores. |
| DEFAULT_VALUE | Various | Optional attribute for index-time field extractions. Splunk software writes the specified value to DEST_KEY if the specified REGEX fails. |
| DEST_KEY | Various | Valid for index-time field extractions, specifies where Splunk software stores the REGEX results. |
| FORMAT | Various |  |
| KEEP_EMPTY_VALS | Various | If set to true, Splunk software preserves extracted fields with empty values. |
| LOOKAHEAD | Various |  |
| MV_ADD | Various | If Splunk software extracts a field that already exists and MV_ADD is set to true, the field becomes multivalued, and the newly-extracted value is appended. If MV_ADD is set to false, the newly-extracted value is discarded. |
| REGEX | Various |  |
| SOURCE_KEY | Various | The KEY to which Splunk software applies REGEX. |
| WRITE_META | Various |  |
| disabled | Various | Indicates if the field transformation is disabled. |
| eai:appName | String | The Splunk app for which the field extractions are defined. For example, the search app. |
| eai:userName | String | The name of the Splunk user who created the field extraction definitions. For example, the admin user. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/transforms/extractions/my_transform -d REGEX="(?<_KEY_1>[a-z]*),(?<_VAL_1>[a-z]*)" -d SOURCE_KEY=_raw -d CLEAN_KEYS=false
```
