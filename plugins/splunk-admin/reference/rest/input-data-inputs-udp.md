# /services/data/inputs/udp

Access or create UDP data inputs.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/udp`, `/services/data/inputs/udp/{name}`, `/services/data/inputs/udp/{name}/connections`


## /services/data/inputs/udp

Access or create UDP data inputs.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/udp` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/udp`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | Socket receive buffer size (bytes). |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| group | varies | Set to`listenerports` for listening ports. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/udp?output_mode=json'
```

## POST `/services/data/inputs/udp`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| connection_host | Enum | Varies | — | ip |
| disabled | Boolean | Varies | — | Indicates if the input is disabled. |
| host | String | Varies | — | String |
| index | String | Varies | — | Which index events from this input should be stored in. |
| name | String | Varies | — | Required. The UDP port that this input should listen on. |
| no_appending_timestamp | Boolean | Varies | — | If set to true, prevents Splunk software from prepending a timestamp and hostname to incoming events. |
| no_priority_stripping | Boolean | Varies | — | If set to true, Splunk software does not remove the priority field from incoming syslog events. |
| queue | String | Varies | — | Which queue events from this input should be sent to. Generally this does not need to be changed. |
| restrictToHost | String | Varies | — | String |
| source | String | Varies | — | The value to populate in the source field for incoming events. The same source should not be used for multiple data inputs. |
| sourcetype | String | Varies | — | The value to populate in the sourcetype field for incoming events. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (ip | dns | none)

Set the host for the remote server that is sending data.

`ip` sets the host to the IP address of the remote server sending data.

`dns` sets the host to the reverse DNS entry for the IP address of the remote server sending data.

`none` leaves the host as specified in inputs.conf, which is typically the Splunk system hostname.

Default value is`ip`.

The value to populate in the host field for incoming events.

This is used during parsing/indexing, in particular to set the host field. It is also the host field used at search time.

Restrict incoming connections on this port to the host specified here.

If this is not set, the value specified in`[udp://:]` in`inputs.conf` is used.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/udp'
```


## /services/data/inputs/udp/{name}

Manage the {name} UDP host or port.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/udp/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/udp/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/udp/{name}'
```

## GET `/services/data/inputs/udp/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | Socket receive buffer size (bytes). |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| group | varies | Set to`listenerports` for listening ports. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/udp/{name}?output_mode=json'
```

## POST `/services/data/inputs/udp/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| connection_host | Enum | Varies | — | ip |
| disabled | Boolean | Varies | — | Indicates if the input is disabled. |
| host | String | Varies | — | String |
| index | String | Varies | — | Which index events from this input should be stored in. |
| no_appending_timestamp | Boolean | Varies | — | If set to true, prevents Splunk software from prepending a timestamp and hostname to incoming events. |
| no_priority_stripping | Boolean | Varies | — | If set to true, Splunk software does not remove the priority field from incoming syslog events. |
| queue | String | Varies | — | Which queue events from this input should be sent to. Generally this does not need to be changed. |
| restrictToHost | String | Varies | — | String |
| source | String | Varies | — | The value to populate in the source field for incoming events. The same source should not be used for multiple data inputs. |
| sourcetype | String | Varies | — | The value to populate in the sourcetype field for incoming events. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (ip | dns | none)

Set the host for the remote server that is sending data.

`ip` sets the host to the IP address of the remote server sending data.

`dns` sets the host to the reverse DNS entry for the IP address of the remote server sending data.

`none` leaves the host as specified in inputs.conf, which is typically the Splunk system hostname.

Default value is`ip`.

The value to populate in the host field for incoming events.

This is used during parsing/indexing, in particular to set the host field. It is also the host field used at search time.

Restrict incoming connections on this port to the host specified here.

If this is not set, the value specified in [udp://:] in inputs.conf is used.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/udp/{name}'
```


## /services/data/inputs/udp/{name}/connections

List connections to the {name} host or port.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/udp/{name}/connections` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/udp/{name}/connections`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates whether the inputs are disabled. |
| group | varies | Set to 'listenerports' for listening ports. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/udp/{name}/connections?output_mode=json'
```

