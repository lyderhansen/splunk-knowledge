# /services/data/inputs/tcp/ssl

Provides access to the SSL configuration of a Splunk server.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/tcp/ssl`, `/services/data/inputs/tcp/ssl/{name}`


## /services/data/inputs/tcp/ssl

Provides access to the SSL configuration of a Splunk server.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/ssl` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/tcp/ssl`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | [Deprecated] |
| cipherSuite | varies | Specifies list of acceptable ciphers to use in ssl. |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/ssl?output_mode=json'
```


## /services/data/inputs/tcp/ssl/{name}

Access or update the SSL configuration for the {name} host.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/ssl/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/tcp/ssl/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | [Deprecated] |
| cipherSuite | varies | Specifies list of acceptable ciphers to use in ssl. |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/ssl/{name}?output_mode=json'
```

## POST `/services/data/inputs/tcp/ssl/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | — | Indicates whether the inputs are disabled. |
| password | String | Varies | — | Server certificate password, if any. |
| requireClientCert | Boolean | Varies | — | Determines whether a client must authenticate. |
| rootCA | String | Varies | — | Certificate authority list (root file) |
| serverCert | String | Varies | — | Full path to the server certificate. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/tcp/ssl/{name}'
```

