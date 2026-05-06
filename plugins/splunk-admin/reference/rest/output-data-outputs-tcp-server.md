# /services/data/outputs/tcp/server

Access data forwarding configurations.

**Category:** Output

**Related REST paths in this file:** `/services/data/outputs/tcp/server`, `/services/data/outputs/tcp/server/{name}`, `/services/data/outputs/tcp/server/{name}/allconnections`


## /services/data/outputs/tcp/server

Access data forwarding configurations.

**Category:** Output

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/outputs/tcp/server` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/outputs/tcp/server`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| destHost | varies | DNS name of the destination server. |
| destIp | varies | IP address of the destination server. |
| destPort | varies | Port on which the destination server is listening. |
| disabled | varies | Indicates if the outputs to the destination server is disabled. |
| method | varies | — |
| sourcePort | varies | Port on destination server where data is forwarded. |
| status | varies | Indicates the status of the connection to the server. |


**Additional returned-field documentation:**

The data distribution method used when two or more servers exist in the same forwarder group.

Valid values: (clone | balance | autobalance)

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/outputs/tcp/server?output_mode=json'
```

## POST `/services/data/outputs/tcp/server`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | If true, disables the forwarder. |  |
| method | Enum | Varies |  |  |
| required | String | Varies | : of the Splunk receiver. can be either an ip address or server name. is the that port that the Splunk receiver is listening on. |  |
| sslAltNameToCheck | String | Varies | The alternate name to match in the remote server's SSL certificate. |  |
| sslCertPath | String | Varies | Path to the client certificate. If specified, connection uses SSL. |  |
| sslCipher | String | Varies | SSL Cipher in the form ALL:!aNULL:!eNULL:!LOW:!EXP:RC4+RSA:+HIGH:+MEDIUM |  |
| sslCommonNameToCheck | String | Varies |  |  |
| sslPassword | String | Varies |  |  |
| sslRootCAPath | String | Varies | The path to the root certificate authority file (optional). |  |
| sslVerifyServerCert | Boolean | Varies | If true, make sure that the server you are connecting to is a valid one (authenticated). Both the common name and the alternate name of the server are then checked for a match. |  |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (clone | balance | autobalance)

The data distribution method used when two or more servers exist in the same forwarder group.

name

Check the common name of the server's certificate against this name.

If there is no match, assume that Splunk Enterprise is not authenticated against this server. You must specify this setting if sslVerifyServerCert is true.

The password associated with the CAcert.

The default Splunk Enterprise CAcert uses the password "password."

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/outputs/tcp/server'
```


## /services/data/outputs/tcp/server/{name}

Manage the {name} forwarder.

**Category:** Output

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/outputs/tcp/server/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/outputs/tcp/server/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/outputs/tcp/server/{name}'
```

## GET `/services/data/outputs/tcp/server/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates if the outputs to the destination server is disabled. |
| method | varies | — |


**Additional returned-field documentation:**

The data distribution method used when two or more servers exist in the same forwarder group.

Valid values: (clone | balance | autobalance)

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/outputs/tcp/server/{name}?output_mode=json'
```

## POST `/services/data/outputs/tcp/server/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | If true, disables the forwarder. |  |
| method | Enum | Varies |  |  |
| sslAltNameToCheck | String | Varies | The alternate name to match in the remote server's SSL certificate. |  |
| sslCertPath | String | Varies | Path to the client certificate. If specified, connection uses SSL. |  |
| sslCipher | String | Varies | SSL Cipher in the form ALL:!aNULL:!eNULL:!LOW:!EXP:RC4+RSA:+HIGH:+MEDIUM |  |
| sslCommonNameToCheck | String | Varies |  |  |
| sslPassword | String | Varies |  |  |
| sslRootCAPath | String | Varies | The path to the root certificate authority file (optional). |  |
| sslVerifyServerCert | Boolean | Varies | If true, make sure that the server you are connecting to is a valid one (authenticated). Both the common name and the alternate name of the server are then checked for a match. |  |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Valid values: (clone | balance | autobalance)

The data distribution method used when two or more servers exist in the same forwarder group.

Check the common name of the server's certificate against this name.

If there is no match, assume that Splunk Enterprise is not authenticated against this server. You must specify this setting if sslVerifyServerCert is true.

The password associated with the CAcert.

The default Splunk Enterprise CAcert uses the password "password."

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/outputs/tcp/server/{name}'
```


## /services/data/outputs/tcp/server/{name}/allconnections

Get {name} forwarder connections.

**Category:** Output

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/outputs/tcp/server/{name}/allconnections` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/outputs/tcp/server/{name}/allconnections`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| destHost | varies | DNS name of the destination server. |
| destIp | varies | IP address of the destination server. |
| destPort | varies | Port on which the destination server is listening. |
| sourcePort | varies | Port on destination server where data is forwarded. |
| status | varies | Indicates the status of the connection to the server. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/outputs/tcp/server/{name}/allconnections?output_mode=json'
```

