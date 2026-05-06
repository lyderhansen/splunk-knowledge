# /services/data/inputs/script

Access scripted inputs.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/script`, `/services/data/inputs/script/restart`, `/services/data/inputs/script/{name}`


## /services/data/inputs/script

Access scripted inputs.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/script` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/script`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Specifies whether the input script is disabled. |
| endtime | varies | If available, the time when the script stopped executing. |
| group | varies | The name of the inputstatus group, which is always "exec commands." |
| host | varies | Host with which these data are identified. |
| index | varies | Sets the index for events from this input. Defaults to the main index. |
| interval | varies | — |
| source | varies | — |
| sourcetype | varies | — |
| starttime | varies | If available, the time the when the script was executed. |


**Additional returned-field documentation:**

An integer or cron schedule.

Specifies how often to execute the specified script, in seconds or a valid cron schedule. For a cron schedule, the script is not executed on start-up.

The source key/field for events from this input. Defaults to the input file path.

Sets the source key initial value. The key is used during parsing/indexing, in particular to set the source field during indexing. It is also the source field used at search time. As a convenience, the chosen string is prepended with 'source::'.

Sets the sourcetype key/field for events from this input. If unset, Splunk software picks a source type based on various aspects of the data. There is no hard-coded default.

For more information, see the documentation for the sourcetype parameter for the POST operation.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/script?output_mode=json'
```

## POST `/services/data/inputs/script`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | — | Specifies whether the input script is disabled. |
| host | String | Varies | — | Sets the host for events from this input. Defaults to whatever host sent the event. |
| index | String | Varies | — | Sets the index for events from this input. Defaults to the main index. |
| interval | Number | Varies | — | Required. Specify an integer or cron schedule. This parameter specifies how often to execute the specified script, in seconds or a valid cron schedule. If you specify a cron schedule, the script is not executed on start-up. |
| name | String | Varies | — | Required. Specify the name of the scripted input. |
| passAuth | String | Varies | — | String |
| rename-source | String | Varies | — | Specify a new name for the source field for the script. |
| source | String | Varies | — | String |
| sourcetype | String | Varies | — | String |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

User to run the script as.

If you provide a username, Splunk software generates an auth token for that user and passes it to the script.

Sets the source key/field for events from this input. Defaults to the input file path.

Sets the source key initial value. The key is used during parsing/indexing, in particular to set the source field during indexing. It is also the source field used at search time. As a convenience, the chosen string is prepended with 'source::'.

Note: Overriding the source key is generally not recommended. Typically, the input layer provides a more accurate string to aid in problem analysis and investigation, accurately recording the file from which the data was retrieved. Consider use of source types, tagging, and search wildcards before overriding this value.

Sets the sourcetype key/field for events from this input. If unset, Splunk software picks a source type based on various aspects of the data. As a convenience, the chosen string is prepended with 'sourcetype::'. There is no hard-coded default.

Sets the sourcetype key initial value. The key is used during parsing/indexing, in particular to set the source type field during indexing. It is also the source type field used at search time.

Primarily used to explicitly declare the source type for this data, as opposed to allowing it to be determined using automated methods. This is typically important both for searchability and for applying the relevant configuration for this type of data during parsing and indexing.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/script'
```


## /services/data/inputs/script/restart

Allows for restarting scripted inputs.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/script/restart` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## POST `/services/data/inputs/script/restart`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| script | String | Varies | — | Required. Path to the script to be restarted. This path must match an already-configured existing scripted input. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/script/restart'
```


## /services/data/inputs/script/{name}

Manage the {name} scripted input.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/script/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/script/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/script/{name}'
```

## GET `/services/data/inputs/script/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Specifies whether the input script is disabled. |
| group | varies | The name of the inputstatus group, which is always "exec commands." |
| host | varies | Host these data are identified with. |
| index | varies | Sets the index for events from this input. Defaults to the main index. |
| interval | varies | — |


**Additional returned-field documentation:**

An integer or cron schedule.

Specifies how often to execute the specified script, in seconds or a valid cron schedule. For a cron schedule, the script is not executed on start-up.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/script/{name}?output_mode=json'
```

## POST `/services/data/inputs/script/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | — | Specifies whether the input script is disabled. |
| host | String | Varies | — | Sets the host for events from this input. Defaults to whatever host sent the event. |
| index | String | Varies | — | Sets the index for events from this input. Defaults to the main index. |
| interval | Number | Varies | — | Specify an integer or cron schedule. This parameter specifies how often to execute the specified script, in seconds or a valid cron schedule. If you specify a cron schedule, the script is not executed on start-up. |
| passAuth | String | Varies | — | String |
| rename-source | String | Varies | — | Specify a new name for the source field for the script. |
| source | String | Varies | — | String |
| sourcetype | String | Varies | — | String |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

User to run the script as.

If you provide a username, Splunk software generates an auth token for that user and passes it to the script.

Sets the source key/field for events from this input. Defaults to the input file path.

Sets the source key initial value. The key is used during parsing/indexing, in particular to set the source field during indexing. It is also the source field used at search time. As a convenience, the chosen string is prepended with 'source::'.

Note: Overriding the source key is generally not recommended. Typically, the input layer provides a more accurate string to aid in problem analysis and investigation, accurately recording the file from which the data was retrieived. Consider use of source types, tagging, and search wildcards before overriding this value.

Sets the sourcetype key/field for events from this input. If unset, Splunk software picks a source type based on various aspects of the data. As a convenience, the chosen string is prepended with 'sourcetype::'. There is no hard-coded default.

Sets the sourcetype key initial value. The key is used during parsing/indexing, in particular to set the source type field during indexing. It is also the source type field used at search time.

Primarily used to explicitly declare the source type for this data, as opposed to allowing it to be determined using automated methods. This is typically important both for searchability and for applying the relevant configuration for this type of data during parsing and indexing.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/script/{name}'
```

