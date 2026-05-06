# /services/data/transforms/lookups

Access or create lookup definitions.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/transforms/lookups` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/data/transforms/lookups
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| getsize | Boolean | No | `false` | Enable to return the file size. |
| replicate_delta | Boolean | No | `false` | Enable to replicate only the changes to a CSV lookup table rather than replicating the entire lookup table. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| CAN_OPTIMIZE | Various |  |
| CLEAN_KEYS | Various | If set to true, Splunk software "cleans" the field names extracted at search time by replacing non-alphanumeric characters with underscores and stripping leading underscores. |
| DEFAULT_VALUE | Various | Optional attribute for index-time field extractions. Splunk software writes the specified value to DEST_KEY if the specified REGEX fails. |
| DEST_KEY | Various | Valid for index-time field extractions, specifies where Splunk software stores the REGEX results. |
| FORMAT | Various |  |
| GETSIZE | Various | If enabled, returns the file size. |
| KEEP_EMPTY_VALS | Various | If set to true, Splunk software preserves extracted fields with empty values. |
| LOOKAHEAD | Various |  |
| MV_ADD | Various | If Splunk software extracts a field that already exists and MV_ADD is set to true, the field becomes multivalued, and the newly-extracted value is appended. If MV_ADD is set to false, the newly-extracted value is discarded. |
| REGEX | Various |  |
| SOURCE_KEY | Various | The KEY to which Splunk software applies REGEX. |
| WRITE_META | Various |  |
| disabled | Various | Indicates if this lookup is disabled. |
| eai:appName | String | The Splunk app for which the lookups are defined. For example, the search app. |
| eai:userName | String | The Splunk user for which the lookups are defined. |
| external_cmd | Various |  |
| fields_list | Various | List of all fields that are supported by the external command. |
| replicate_delta | Various | Indicates that only the changes to a CSV lookup table are replicated, rather than the entire lookup table. |
| type | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/transforms/lookups
```

## POST /services/data/transforms/lookups
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| collection | String | No | ` ` | To create a KV Store lookup, use`collection` to pass in the KV Store collection name and include the`external_type` parameter with a value of`kvstore` in your`POST` request. |
| name | String | No | — | The name of the lookup definition. |
| default_match | String | No | — | If min_matches is greater than zero and Splunk software has less than min_matches for any given input, it provides this default_match value one or more times until the min_matches threshold is reached. |
| disabled | Boolean | No | — | Specifies whether the lookup definition is disabled. |
| fields_list | String | No | — | A comma- and space-delimited list of all fields that are supported by the external command. Use this for external (or "scripted") lookups. |
| filename | String | No | — | The name of the static lookup table file. |
| max_matches | Number | No | — | The maximum number of possible matches for each input lookup value. |
| max_offset_secs | Number | No | — | For temporal lookups, this is the maximum time (in seconds) that the event timestamp can be later than the lookup entry time for a match to occur. |
| min_matches | Number | No | — | The minimum number of possible matches for each input lookup value. |
| min_offset_secs | Number | No | — | For temporal lookups, this is the minimum time (in seconds) that the event timestamp can be later than the lookup entry timestamp for a match to occur. |
| replicate_delta | Boolean | No | `false` | Enable to replicate only the changes to a CSV lookup table rather than replicating the entire lookup table. |
| time_field | String | No | — | For temporal lookups, this is the field in the lookup table that represents the timestamp. |
| time_format | String | No | — | For temporal lookups, this specifies the "strptime" format of the timestamp field. |

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
| default_match | Various | If min_matches is greater than zero and Splunk software has less than min_matches for any given input, it provides this default_match value one or more times until the min_matches threshold is reached. |
| disabled | Various | Specifies whether the lookup definition is disabled. |
| eai:appName | String | The Splunk app for which the lookups are defined. For example, the search app. |
| eai:userName | String | The Splunk user for which the lookups are defined. |
| external_cmd | Various |  |
| fields_list | Various | List of all fields that are supported by the external command. Use this for external (or "scripted") lookups. |
| filename | Various | The name of the static lookup table file. |
| max_matches | Various |  |
| max_offset_secs | Various | For temporal lookups, this is the maximum time (in seconds) that the event timestamp can be later than the lookup entry time for a match to occur. |
| min_matches | Various | The minimum number of possible matches for each input lookup value. |
| min_offset_secs | Various | For temporal lookups, this is the maximum time (in seconds) that the event timestamp can be later than the lookup entry time for a match to occur. |
| time_field | Various | For temporal lookups, this is the field in the lookup table that represents the timestamp. |
| time_format | Various | For temporal lookups, this specifies the \\"strptime\\" format of the timestamp field. |
| type | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/transforms/lookups -d name=my_lookup -d filename=lookup.csv
```

---

# /services/data/transforms/lookups/{name}

Manage the {name} lookup definition.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/transforms/lookups/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /services/data/transforms/lookups/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/data/transforms/lookups/my_lookup
```

## GET /services/data/transforms/lookups/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| replicate_delta | Boolean | No | `false` | Enable to replicate only the changes to a CSV lookup table rather than replicating the entire lookup table. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| CAN_OPTIMIZE | Various |  |
| CLEAN_KEYS | Various | Indicates whether Splunk software "cleans" the field names extracted at search time by replacing non-alphanumeric characters with underscores and stripping leading underscores. |
| DEFAULT_VALUE | Various | Optional attribute for index-time field extractions. Splunk software writes the specified value to DEST_KEY if the specified REGEX fails. |
| DEST_KEY | Various | Valid for index-time field extractions, specifies where Splunk software stores the REGEX results. |
| FORMAT | Various |  |
| KEEP_EMPTY_VALS | Various | Indicates whether Splunk software preserves extracted fields with empty values. |
| LOOKAHEAD | Various |  |
| MV_ADD | Various | "If Splunk software extracts a field that already exists and MV_ADD is set to true, the field becomes multivalued, and the newly-extracted value is appended. If MV_ADD is set to false, the newly-extracted value is discarded. |
| REGEX | Various |  |
| SOURCE_KEY | Various | The KEY to which Splunk software applies REGEX. |
| WRITE_META | Various |  |
| disabled | Various | Indicates if this lookup is disabled. |
| eai:appName | String | The Splunk software app for which the lookups are defined. For example, the search app. |
| eai:attributes | String | Field control information. |
| eai:userName | String | The Splunk user for which the lookups are defined. |
| filename | Various | The name of the static lookup table file. |
| replicate_delta | Various | Indicates that only the changes to a CSV lookup table are replicated, rather than the entire lookup table. |
| type | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/transforms/lookups/my_lookup
```

## POST /services/data/transforms/lookups/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| collection | String | No | ` ` | To create a KV Store lookup, use`collection` to pass in the KV Store collection name and include the`external_type` parameter with a value of`kvstore` in your`POST` request. |
| default_match | String | No | — | If min_matches is greater than zero and Splunk software has less than min_matches for any given input, it provides this default_match value one or more times until the min_matches threshold is reached. |
| disabled | Boolean | No | — | Specifies whether the lookup definition is disabled. |
| fields_list | String | No | — | A comma- and space-delimited list of all fields that are supported by the external command. Use this for external (or "scripted") lookups. |
| filename | String | No | — | The name of the static lookup table file. |
| max_matches | Number | No | — | The maximum number of possible matches for each input lookup value. |
| max_offset_secs | Number | No | — | For temporal lookups, this is the maximum time (in seconds) that the event timestamp can be later than the lookup entry time for a match to occur. |
| min_matches | Number | No | — | The minimum number of possible matches for each input lookup value. |
| min_offset_secs | Number | No | — | For temporal lookups, this is the minimum time (in seconds) that the event timestamp can be later than the lookup entry timestamp for a match to occur. |
| replicate_delta | Boolean | No | `false` | Enable to replicate only the changes to a CSV lookup table rather than replicating the entire lookup table. |
| time_field | String | No | — | For temporal lookups, this is the field in the lookup table that represents the timestamp. |
| time_format | String | No | — | For temporal lookups, this specifies the "strptime" format of the timestamp field. |

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
| default_match | Various | If min_matches is greater than zero and Splunk software has less than min_matches for any given input, it provides this default_match value one or more times until the min_matches threshold is reached. |
| disabled | Various | Specifies whether the lookup definition is disabled. |
| eai:appName | String | The Splunk app for which the lookups are defined. For example, the search app. |
| eai:userName | String | The Splunk user for which the lookups are defined. |
| external_cmd | Various |  |
| fields_list | Various | List of all fields that are supported by the external command. Use this for external (or "scripted") lookups. |
| filename | Various | The name of the static lookup table file. |
| max_matches | Various | The maximum number of possible matches for each input lookup value. |
| max_offset_secs | Various | For temporal lookups, this is the maximum time (in seconds) that the event timestamp can be later than the lookup entry time for a match to occur. |
| min_matches | Various | The minimum number of possible matches for each input lookup value. |
| min_offset_secs | Various | For temporal lookups, this is the maximum time (in seconds) that the event timestamp can be later than the lookup entry time for a match to occur. |
| time_field | Various | For temporal lookups, this is the field in the lookup table that represents the timestamp. |
| time_format | Various | For temporal lookups, this specifies the "strptime" format of the timestamp field. |
| type | Various |  |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/transforms/lookups/my_lookup -d external_cmd=myscript.py -d fields_list=a,b,c
```
