# /services/data/inputs/tcp/raw

Container for managing raw tcp inputs from forwarders.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/tcp/raw`, `/services/data/inputs/tcp/raw/{name}`, `/services/data/inputs/tcp/raw/{name}/connections`


## /services/data/inputs/tcp/raw

Container for managing raw tcp inputs from forwarders.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/raw` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## GET `/services/data/inputs/tcp/raw`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | [Deprecated] |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| group | varies | Set to`listenerports` for listening ports. |
| host | varies | Host from which the indexer gets data. |
| index | varies | The index in which to store generated events. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/raw?output_mode=json'
```

## POST `/services/data/inputs/tcp/raw`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| connection_host | Enum | Varies | — | dns |
| disabled | Boolean | Varies | — | Indicates whether the inputs are disabled. |
| host | String | Varies | — | Host from which the indexer gets data. |
| index | String | Varies | — | Index to store generated events. |
| required | String | Varies | — | The input port which receives raw data. |
| queue | Enum | Varies | — | Enum |
| rawTcpDoneTimeout | Number | Varies | — | Number |
| restrictToHost | String | Varies | — | Allows for restricting this input to only accept data from the host specified here. |
| SSL | Boolean | Varies | — | Boolean |
| source | String | Varies | — | String |
| sourcetype | String | Varies | — | String |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (ip | dns | none)

Set the host for the remote server that is sending data.

`ip` sets the host to the IP address of the remote server sending data.

`dns` sets the host to the reverse DNS entry for the IP address of the remote server sending data.

`none` leaves the host as specified in inputs.conf, which is typically the Splunk system hostname.

Default value is`ip`.

name

Valid values: (parsingQueue | indexQueue)

Specifies where the input processor should deposit the events it reads. Defaults to parsingQueue.

Set queue to`parsingQueue` to apply props.conf and other parsing rules to your data. For more information about props.conf and rules for timestamping and linebreaking, refer to`props.conf` and the online documentation at " [Monitor files and directories with inputs.conf](https://docs.splunk.com/?resourceId=Splunk_Data_Monitorfilesanddirectorieswithinputs.conf)"

Set queue to`indexQueue` to send your data directly into the index.

Specifies in seconds the timeout value for adding a Done-key. Default value is 10 seconds.

If a connection over the port specified by`name` remains idle after receiving data for specified number of seconds, it adds a Done-key. This implies the last event is completely received.

Sets the source key/field for events from this input. Defaults to the input file path.

Sets the source key initial value. The key is used during parsing/indexing, in particular to set the source field during indexing. It is also the source field used at search time. As a convenience, the chosen string is prepended with 'source::'.

Note: Overriding the source key is generally not recommended. Typically, the input layer provides a more accurate string to aid in problem analysis and investigation, accurately recording the file from which the data was retrieved. Consider use of source types, tagging, and search wildcards before overriding this value.

Set the source type for events from this input.

"sourcetype=" is automatically prepended to.

Defaults to audittrail (if signedaudit=true) or fschange (if signedaudit=false).

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/tcp/raw'
```


## /services/data/inputs/tcp/raw/{name}

Manage raw inputs for the {name} host or port.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/raw/{name}` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## DELETE `/services/data/inputs/tcp/raw/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/tcp/raw/{name}'
```

## GET `/services/data/inputs/tcp/raw/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | [Deprecated] |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| group | varies | Set to`listenerports` for listening ports. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| restrictToHost | varies | Restrict incoming connections on this port to the specified host. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/raw/{name}?output_mode=json'
```

## POST `/services/data/inputs/tcp/raw/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| SSL | Boolean | Varies | — | Boolean |
| connection_host | Enum | Varies | — | dns |
| disabled | Boolean | Varies | — | Indicates whether the inputs are disabled. |
| host | String | Varies | — | Host from which the indexer gets data. |
| index | String | Varies | — | Index to store generated events. |
| queue | Enum | Varies | — | Enum |
| rawTcpDoneTimeout | Number | Varies | — | Number |
| restrictToHost | String | Varies | — | Allows for restricting this input to only accept data from the host specified here. |
| source | String | Varies | — | String |
| sourcetype | String | Varies | — | String |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (ip | dns | none)

Set the host for the remote server that is sending data.

`ip` sets the host to the IP address of the remote server sending data.

`dns` sets the host to the reverse DNS entry for the IP address of the remote server sending data.

`none` leaves the host as specified in inputs.conf, which is typically the Splunk system hostname.

Default value is`ip`.

Valid values: (parsingQueue | indexQueue)

Specifies where the input processor should deposit the events it reads. Defaults to parsingQueue.

Set queue to`parsingQueue` to apply props.conf and other parsing rules to your data. For more information about props.conf and rules for timestamping and linebreaking, refer to`props.conf` and [Monitor files and directories with inputs.conf](https://docs.splunk.com/?resourceId=Splunk_Data_Monitorfilesanddirectorieswithinputs.conf).

Set queue to`indexQueue` to send your data directly into the index.

Specifies in seconds the timeout value for adding a Done-key. Default value is 10 seconds.

If a connection over the port specified by`name` remains idle after receiving data for specified number of seconds, it adds a Done-key. This implies the last event is completely received.

Sets the source key/field for events from this input. Defaults to the input file path.

Sets the source key initial value. The key is used during parsing/indexing, in particular to set the source field during indexing. It is also the source field used at search time. As a convenience, the chosen string is prepended with 'source::'.

Note: Overriding the source key is generally not recommended. Typically, the input layer provides a more accurate string to aid in problem analysis and investigation, accurately recording the file from which the data was retrieved. Consider use of source types, tagging, and search wildcards before overriding this value.

Set the source type for events from this input.

"sourcetype=" is automatically prepended to.

Defaults to audittrail (if signedaudit=true) or fschange (if signedaudit=false).

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/tcp/raw/{name}'
```


## /services/data/inputs/tcp/raw/{name}/connections

Get active connections the {name} host or port.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/raw/{name}/connections` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## GET `/services/data/inputs/tcp/raw/{name}/connections`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| connection | varies | IP address and port of the source connecting to this TCP input port. |
| servername | varies | DNS name of the source connecting to this TCP input port. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/raw/{name}/connections?output_mode=json'
```

