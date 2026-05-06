# Search data commands

Enumerate SPL streaming/generating commands exposed through REST.

## `/services/data/commands`

Access Python search commands.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/commands` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/data/commands`

Access Python search commands.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Pagination and filtering parameters can be used with this method. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| changes_colorder | varies | Indicates whether the script output should be used to change the column ordering of the fields. |
| disabled | varies | Indicates if the command is disabled. |
| enableheader | varies | Indicate whether or not your script is expecting header information or not. Currently, the only thing in the header information is an auth token. If set to true the command expects as input a head section + '\ ' then the csv input. Note: Should be set to true if you use splunk.Intersplunk |
| filename | varies | Name of script file for command. <stanza-name>.pl for perl. <stanza-name>.py for python. |
| generates_timeorder | varies | If generating = false and streaming = true, indicates if the command changes the order of events w/respect to time. |
| generating | varies | Indicates if the command generates new events. |
| maxinputs | varies | Maximum number of events that can be passed to the command for each invocation. This limit cannot exceed the value of maxresultrows in limits.conf. 0 indicates no limit. Defaults to 50000. |
| outputheader | varies | If true, the output of script should be a header section + blank line + csv output. If false, script output should be pure csv only. |
| passauth | varies | If true, passes an authentication token on the start of input. |
| required_fields | varies | A list of fields that this command may use. Informs previous commands that they should retain/extract these fields if possible. No error is generated if a field specified is missing. Defaults to '*'. |
| requires_preop | varies | Indicates whether the command sequence specified by the streaming_preop key is required for proper execution or is it an optimization only. Default is false (stremaing_preop not required). |
| retainsevents | varies | Indicates whether the command retains events (the way the sort/dedup/cluster commands do) or whether the command transforms them (the way the stats command does). |
| streaming | varies | Indicates whether the command is streamable. |
| supports_getinfo | varies | Indicates whether the command supports dynamic probing for settings (first argument invoked == __GETINFO__ or __EXECUTE__). |
| supports_rawargs | varies | Indicates whether the command supports raw arguments being passed to it or if it uses parsed arguments (where quotes are stripped). |
| type | varies | Specifies the type of command. The only valid value for this attribute is python . |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/search/data/commands
```



---

## `/services/data/commands/{name}`

Get information about the {name} python search command.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/commands/{name}` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/data/commands/{name}`

Access search command information.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| changes_colorder | varies | Indicates whether the script output should be used to change the column ordering of the fields. |
| disabled | varies | Indicates if the command is disabled. |
| enableheader | varies | Indicate whether or not your script is expecting header information or not. Currently, the only thing in the header information is an auth token. If set to true the command expects as input a head section + '\ ' then the csv input. Note: Should be set to true if you use splunk.Intersplunk |
| filename | varies | Name of script file for command. <stanza-name>.pl for perl. <stanza-name>.py for python. |
| generates_timeorder | varies | If generating = false and streaming = true, indicates if the command changes the order of events w/respect to time. |
| generating | varies | Indicates if the command generates new events. |
| maxinputs | varies | Maximum number of events that can be passed to the command for each invocation. This limit cannot exceed the value of maxresultrows in limits.conf. 0 indicates no limit. Defaults to 50000. |
| outputheader | varies | If true, the output of script should be a header section + blank line + csv output. If false, script output should be pure csv only. |
| passauth | varies | If true, passes an authentication token on the start of input. |
| required_fields | varies | A list of fields that this command may use. Informs previous commands that they should retain/extract these fields if possible. No error is generated if a field specified is missing. Defaults to '*'. |
| requires_preop | varies | Indicates whether the command sequence specified by the streaming_preop key is required for proper execution or is it an optimization only. Default is false (stremaing_preop not required). |
| retainsevents | varies | Indicates whether the command retains events (the way the sort/dedup/cluster commands do) or whether the command transforms them (the way the stats command does). |
| streaming | varies | Indicates whether the command is streamable. |
| supports_getinfo | varies | Indicates whether the command supports dynamic probing for settings (first argument invoked == __GETINFO__ or __EXECUTE__). |
| supports_rawargs | varies | Indicates whether the command supports raw arguments being passed to it or if it uses parsed arguments (where quotes are stripped). |
| type | varies | Specifies the type of command. The only valid value for this attribute is python . |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/search/data/commands/input
```



---
