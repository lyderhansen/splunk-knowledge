# /services/authentication/httpauth-tokens

List currently active session IDs and users.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/httpauth-tokens` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authentication/httpauth-tokens

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Response keys

| Name | Type | Description |
|---|---|---|
| authString | String | Unique identifier for this session. |
| searchId | String | Search ID associated with the session, if it was created for a search job. If it is a login-type session, the value is empty. The session ID token is valid for the duration of the web session. |
| timeAccessed | String | Last time the session was touched. |
| userName | String | Username associated with the session. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/httpauth-tokens
```


---

# /services/authentication/httpauth-tokens/{name}

Access or delete the`{name}` session, where`{name}` is the session ID returned by [auth/login](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTaccess).

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/httpauth-tokens/{name}` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authentication/httpauth-tokens/{name}

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| authString | String | Unique session identifier. |
| searchId | String | Session search ID, if it is a search job session. The value is blank for a login-type session. |
| timeAccessed | String | Last time the session was touched. |
| userName | String | Username associated with the session. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/httpauth-tokens/vdZv2eB9F0842dyJhrIEiGNTcBMpBeGuwGPYxtGLKAESQkzjSjG7dbymQW58y^oI3kxYXWfK_Fd3cRGqwPQGp58RvEkzwCaC6PmQgCsK
```

## DELETE /services/authentication/httpauth-tokens/{name}

### Request parameters

No request parameters.

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme --request DELETE https://localhost:8089/services/authentication/httpauth-tokens/vdZv2eB9F0842dyJhrIEiGNTcBMpBeGuwGPYxtGLKAESQkzjSjG7dbymQW58y^oI3kxYXWfK_Fd3cRGqwPQGp58RvEkzwCaC6PmQgCsK
```


---
