# /services/data/inputs/tcp/cooked

Access cooked TCP input information and create new containers for managing cooked data.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/tcp/cooked`, `/services/data/inputs/tcp/cooked/{name}`, `/services/data/inputs/tcp/cooked/{name}/connections`


## /services/data/inputs/tcp/cooked

Access cooked TCP input information and create new containers for managing cooked data.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/cooked` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/tcp/cooked`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | [Deprecated] |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| group | varies | Set to`listenerports` for listening ports. |
| host | varies | The default value to fill in for events lacking a host value. |
| index | varies | The index in which to store generated events. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/cooked?output_mode=json'
```

## POST `/services/data/inputs/tcp/cooked`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| SSL | Boolean | Varies | — | If SSL is not already configured, error is returned |
| connection_host | Enum | Varies | — | dns |
| disabled | Boolean | Varies | — | Indicates whether the input is disabled. |
| host | String | Varies | — | The default value to fill in for events lacking a host value. |
| name | Number | Varies | — | Required. The port number of this input. |
| queue | "parsingQueue" | Varies | — | Specifies where the input processor should deposit the events it reads. |
| restrictToHost | String | Varies | — | Restrict incoming connections on this port to the host specified here. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (ip | dns | none)

Set the host for the remote server that is sending data.

`ip` sets the host to the IP address of the remote server sending data.

`dns` sets the host to the reverse DNS entry for the IP address of the remote server sending data.

`none` leaves the host as specified in inputs.conf, which is typically the Splunk system hostname.

Default value is`dns`.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/tcp/cooked'
```


## /services/data/inputs/tcp/cooked/{name}

Manage cooked TCP inputs for the {name} host or port.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/cooked/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/tcp/cooked/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/tcp/cooked/{name}'
```

## GET `/services/data/inputs/tcp/cooked/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | [Deprecated] |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| group | varies | Set to`listenerports` for listening ports. |
| host | varies | The default value to fill in for events lacking a host value. |
| index | varies | The index in which to store generated events. |
| restrictToHost | varies | Restrict incoming connections on this port to the specified host. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/cooked/{name}?output_mode=json'
```

## POST `/services/data/inputs/tcp/cooked/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| SSL | Boolean | Varies | — | If SSL is not already configured, error is returned |
| connection_host | Enum | Varies | — | ip |
| disabled | Boolean | Varies | — | Indicates whether the input is disabled. |
| host | String | Varies | — | The default value to fill in for events lacking a host value. |
| restrictToHost | String | Varies | — | Restrict incoming connections on this port to the host specified here. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (ip | dns | none)

Set the host for the remote server that is sending data.

`ip` sets the host to the IP address of the remote server sending data.

`dns` sets the host to the reverse DNS entry for the IP address of the remote server sending data.

`none` leaves the host as specified in inputs.conf, which is typically the Splunk system hostname.

Default value is`ip`.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/tcp/cooked/{name}'
```


## /services/data/inputs/tcp/cooked/{name}/connections

Get active connections to the {name} port.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/cooked/{name}/connections` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/tcp/cooked/{name}/connections`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| connection | varies | Identifies the connection to port. |
| servername | varies | Server name of forwarder connecting to this port. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/cooked/{name}/connections?output_mode=json'
```

