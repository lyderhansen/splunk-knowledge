# /services/data/inputs/monitor

Access monitor inputs.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/monitor`, `/services/data/inputs/monitor/{name}`, `/services/data/inputs/monitor/{name}/members`


## /services/data/inputs/monitor

Access monitor inputs.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/monitor` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/monitor`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _TCP_ROUTING | varies | List of TCP forwarding groups, as specified in`outputs.conf`. |
| disabled | varies | Indicates if inputs monitoring is disabled. |
| filecount | varies | Number of files monitored. |
| host | varies | Name of the Splunk host for which inputs are monitored. |
| index | varies | The index in which to store the gathered data. |
| sourcetype | varies | — |


**Additional returned-field documentation:**

Source type being monitored.

The source type of an event is the format of the data input from which it originates, such as access_combined or cisco_syslog. The source type determines how Splunk software formats your data.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/monitor?output_mode=json'
```

## POST `/services/data/inputs/monitor`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| blacklist | String | Varies | — | Specify a regular expression for a file path. The file path that matches this regular expression is not indexed. |
| check-index | Boolean | Varies | — | If set to true, the index value is checked to ensure that it is the name of a valid index. |
| check-path | Boolean | Varies | — | If set to true, the name value is checked to ensure that it exists. |
| crc-salt | String | Varies | — | A string that modifies the file tracking identity for files in this input. The magic value " " invokes special behavior (see admin documentation). |
| disabled | Boolean | Varies | — | Indicates if input monitoring is disabled. |
| followTail | Boolean | Varies | — | If set to true, files that are seen for the first time is read from the end. |
| host | String | Varies | — | The value to populate in the host field for events from this data input. |
| host_regex | String | Varies | — | Specify a regular expression for a file path. If the path for a file matches this regular expression, the captured value is used to populate the host field for events from this data input. The regular expression must have one capture group. |
| host_segment | Number | Varies | — | Use the specified slash-separate segment of the filepath as the host field value. |
| ignore-older-than | String | Varies | — | Specify a time value. If the modification time of a file being monitored falls outside of this rolling time window, the file is no longer being monitored. |
| index | String | Varies | — | Which index events from this input should be stored in. Defaults to`default`. |
| name | String | Varies | — | Required. The file or directory path to monitor on the system. |
| recursive | Boolean | Varies | — | Setting this to`false` prevents monitoring of any subdirectories encountered within this data input. |
| rename-source | String | Varies | — | The value to populate in the source field for events from this data input. The same source should not be used for multiple data inputs. |
| sourcetype | String | Varies | — | The value to populate in the sourcetype field for incoming events. |
| time-before-close | Number | Varies | — | When Splunk software reaches the end of a file that is being read, the file is kept open for a minimum of the number of seconds specified in this value. After this period has elapsed, the file is checked again for more data. |
| whitelist | String | Varies | — | Specify a regular expression for a file path. Only file paths that match this regular expression are indexed. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/monitor'
```


## /services/data/inputs/monitor/{name}

Manage the {name} monitor input.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/monitor/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/monitor/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/monitor/{name}'
```

## GET `/services/data/inputs/monitor/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates if inputs monitoring is disabled. |
| filecount | varies | Number of files being monitored. |
| host | varies | Name of the Splunk host for which inputs are monitored. |
| index | varies | The index events from this input should be stored in. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/monitor/{name}?output_mode=json'
```

## POST `/services/data/inputs/monitor/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| blacklist | String | Varies | — | Specify a regular expression for a file path. The file path that matches this regular expression is not indexed. |
| check-index | Boolean | Varies | — | If set to true, the "index" value is checked to ensure that it is the name of a valid index. |
| check-path | Boolean | Varies | — | If set to true, the "name" value is checked to ensure that it exists. |
| crc-salt | String | Varies | — | A string that modifies the file tracking identity for files in this input. The magic value " " invokes special behavior (see admin documentation). |
| disabled | Boolean | Varies | — | Indicates if input monitoring is disabled. |
| followTail | Boolean | Varies | — | If set to true, files that are seen for the first time is read from the end. |
| host | String | Varies | — | The value to populate in the host field for events from this data input. |
| host_regex | String | Varies | — | Specify a regular expression for a file path. If the path for a file matches this regular expression, the captured value is used to populate the host field for events from this data input. The regular expression must have one capture group. |
| host_segment | Number | Varies | — | Use the specified slash-separate segment of the filepath as the host field value. |
| ignore-older-than | String | Varies | — | Specify a time value. If the modification time of a file being monitored falls outside of this rolling time window, the file is no longer being monitored. |
| index | String | Varies | — | Which index events from this input should be stored in. Defaults to`default`. |
| recursive | Boolean | Varies | — | Setting this to "false" prevents monitoring of any subdirectories encountered within this data input. |
| rename-source | String | Varies | — | The value to populate in the source field for events from this data input. The same source should not be used for multiple data inputs. |
| sourcetype | String | Varies | — | The value to populate in the sourcetype field for incoming events. |
| time-before-close | Number | Varies | — | When Splunk software reaches the end of a file that is being read, the file is kept open for a minimum of the number of seconds specified in this value. After this period has elapsed, the file is checked again for more data. |
| whitelist | String | Varies | — | Specify a regular expression for a file path. Only file paths that match this regular expression are indexed. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/monitor/{name}'
```


## /services/data/inputs/monitor/{name}/members

List {name} monitor input files.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/monitor/{name}/members` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/monitor/{name}/members`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

The response includes a list of monitored files. See the following example for more details.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/monitor/{name}/members?output_mode=json'
```

