# /services/auth/login

Get a session ID for use in subsequent API calls that require authentication. Set up cookie-based authorization.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/auth/login` |
| Auth required | No (supply credentials via POST body; examples may show HTTP Basic) |
| Capability | `Authenticated session (establish with username/password[/passcode])` |

## POST /services/auth/login

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| cookie | Boolean, only used value is 1. | No | — | To use cookie-based REST auth, pass in`cookie=1`. Cookies will only be returned if the cookie parameter is passed in with the value of 1. |
| password | String | Yes | — | Required. Current username password. |
| passcode | String | Conditional | — | Required for users with RSA multifactor authentication. The passcode associated with RSA multifactor authentication. This is a combination of the user's RSA token and PIN. |
| username | String | Yes | — | Required. Authenticated session owner name. |

### Returned values

| Name | Type | Description |
|---|---|---|
| sessionKey | String | Session ID. |

### Example

```
curl -k -u admin:changeme  https://localhost:8089/services/auth/login -d username=admin -d password=changeme
```


---
