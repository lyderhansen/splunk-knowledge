# /services/authorization/tokens

Create, get information on, or modify tokens for authentication.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/tokens` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authorization/tokens

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Response keys

| Name | Type | Description |
|---|---|---|
| username | String | The username whose tokens you want to see. Optional. If not provided, all tokens are displayed. |
| id | String | The ID of the token whose information you want to see. Optional. |
| status | String | Show only tokens of a specific status. Optional. Valid values are`enabled` or`disabled`. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/tokens
```

## POST /services/authorization/tokens

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | No | — | The user of the token. Can be up to 1024 characters. |
| audience | String | No | — | The purpose for the token. Can be up to 256 characters. |
| expires_on | String | No | — | String |
| not_before | String | No | — | String |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/tokens -d name=user12 -d audience=Users
```


---

# /services/authorization/tokens/{name}

Get information on, modify, or delete authentication tokens for the`{name}` user.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/tokens/{name}` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## POST /services/authorization/tokens/{name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | No | — | The user of the token. Can be up to 1024 characters. |
| audience | String | No | — | The purpose for the token. Can be up to 256 characters. |
| expires_on | String | No | — | String |
| not_before | String | No | — | String |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/tokens/user12 -d audience=Users -d expires_on=+90d@d
```

## DELETE /services/authorization/tokens/{name}

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Example

```
curl -k -u admin:changeme -X DELETE https://localhost:8089/services/authorization/tokens/user12
```


---
