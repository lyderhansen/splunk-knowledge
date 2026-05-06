# /services/data/inputs/tcp/splunktcptoken

Manage receiver access using tokens.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/tcp/splunktcptoken`, `/services/data/inputs/tcp/splunktcptoken/{name}`


## /services/data/inputs/tcp/splunktcptoken

Manage receiver access using tokens.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/splunktcptoken` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## GET `/services/data/inputs/tcp/splunktcptoken`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| token | varies | Token value. |


**Additional returned-field documentation:**

Response data keys are returned for each receiver token.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/splunktcptoken?output_mode=json'
```

## POST `/services/data/inputs/tcp/splunktcptoken`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Varies | — | Required. Name for the token to create. |
| token | String | Varies | — | Optional. Token value to use. If unspecified, a token is generated automatically. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| token | varies | Token value. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/tcp/splunktcptoken'
```


## /services/data/inputs/tcp/splunktcptoken/{name}

Manage existing receiver tokens.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/tcp/splunktcptoken/{name}` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## GET `/services/data/inputs/tcp/splunktcptoken/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| token | varies | Token value. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/tcp/splunktcptoken/{name}?output_mode=json'
```

## POST `/services/data/inputs/tcp/splunktcptoken/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| token | String | Varies | — | New token value. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| token | varies | Token value. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/tcp/splunktcptoken/{name}'
```

## DELETE `/services/data/inputs/tcp/splunktcptoken/{name}`

### Request parameters

- None.

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| token | varies | Token value. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/tcp/splunktcptoken/{name}'
```

