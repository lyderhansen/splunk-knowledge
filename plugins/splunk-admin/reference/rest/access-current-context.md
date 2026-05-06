# /services/authentication/current-context

Get the authenticated session owner username.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/current-context` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authentication/current-context

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Response keys

| Name | Type | Description |
|---|---|---|
| capabilities | String | List of capabilities assigned to role. |
| defaultApp | String | Default app for the user, which is invoked at login. |
| defaultAppIsUserOverride | String | `false`= Default app does not override the user role default app. |
| defaultAppSourceRole | String | The role that determines the default app for the user, if the user has multiple roles. |
| email | String | User email address. |
| password | String | User password. |
| realname | String | User full name. |
| restart_background_jobs | String | `false`= Do not restart job. |
| roles | String | Roles assigned to the user. |
| (response) | — | type |
| tz | String | User timezone. |
| username | String | Authenticated session owner name. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/current-context
```


---
