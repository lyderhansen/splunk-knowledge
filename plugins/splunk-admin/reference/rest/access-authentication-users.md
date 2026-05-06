# /services/authentication/users

List current users and create new users.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/users` |
| Auth required | Yes |
| Capability | `edit_user` |

## GET /services/authentication/users

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
| locked-out | String | Returns`1` if the user is locked out, and`0` if the user is not locked out. |
| password | String | User password. |
| realname | String | User full name. |
| restart_background_jobs | String | `false`= Do not restart job. |
| roles | String | Roles assigned to the user. |
| (response) | — | type |
| tz | String | User timezone. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/users
```

## POST /services/authentication/users

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| Name | Datatype | No | — | Description |
| createrole | String | No | — | Boolean |
| defaultApp | String | No | — | User default app. Overrides the default app inherited from the user roles. |
| email | String | No | — | User email address. |
| force-change-pass | Boolean | No | — | `false`= Do not force password change. |
| name | String | Yes | — | Required. Unique user login name. |
| password | String | No | — | User login password. |
| realname | String | No | — | Full user name. |
| restart_background_jobs | Boolean | No | — | `false`= Do not restart job. |
| roles | String | No | — | At least one existing role is required if you are not using the`createrole` parameter to create a new role for the user. If you are using`createrole` to create a new role, you can optionally use this parameter to specify additional roles to assign to the user. |
| tz | String | No | — | User timezone. |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/users -d name=User1 -d password=changeme -d roles=admin
```


---

# /services/authentication/users/{name}

Access and update user information or delete the`{name}`> user.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/users/{name}` |
| Auth required | Yes |
| Capability | `edit_user` |

## GET /services/authentication/users/{name}

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| capabilities | String | List of capabilities assigned to role. |
| defaultApp | String | Default app for the user, which is invoked at login. |
| defaultAppIsUserOverride | String | `false`= Default app does not override the user role default app. |
| defaultAppSourceRole | String | Role that determines the default app for the user, if the user has multiple roles. |
| email | String | User email address |
| locked-out | String | Returns`1` if the user is locked out, and`0` if the user is not locked out. |
| password | String | User password |
| realname | String | User full name |
| restart_background_jobs | String | `false`= Do not restart jobs. |
| roles | String | Roles assigned to the user. |
| (response) | — | type |
| tz | String | User timezone. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/users/user1
```

## POST /services/authentication/users/{name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| defaultApp | String | No | — | User default app. This overrides the default app inherited from the user roles. |
| email | String | No | — | User email address. |
| force-change-pass | Boolean | No | — | `false`= Do not force password change. |
| oldpassword | String | No | — | Old user login password. Only required if using the password parameter to change the current user's password. |
| password | String | Yes | — | Required. User login password. To change the user password, enter the new user login password here. To change the current user's password, also supply the old password in the oldpassword parameter. |
| realname | String | No | — | Full user name. |
| restart_background_jobs | Boolean | No | — | `false`= Do not restart job. |
| roles | String | No | — | At least one existing role is required if you are not using the`createrole` parameter to create a new role for the user. If you are using`createrole` to create a new role, you can optionally use this parameter to specify additional roles to assign to the user. |
| tz | String | No | — | User timezone. |

### Response keys

| Name | Type | Description |
|---|---|---|
| capabilities | String | List of capabilities assigned to role. |
| defaultApp | String | Default app for the user, which is invoked at login. |
| defaultAppIsUserOverride | String | `false`= Default app does not override the user role default app. |
| defaultAppSourceRole | String | Role that determines the default app for the user, if the user has multiple roles. |
| email | String | User email address. |
| password | String | User password. |
| realname | String | User full name. |
| restart_background_jobs | String | `false`= Do not restart job. |
| roles | String | Roles assigned to the user. |
| (response) | — | type |
| tz | String | User timezone. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/users/user1 -d defaultApp=launcher
```

## DELETE /services/authentication/users/{name}

### Request parameters

No request parameters.

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme --request DELETE https://localhost:8089/services/authentication/users/user1
```


---
