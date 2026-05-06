> **Overview:** SSO mode must be enabled before you can configure ProxySSO. If you are creating a new ProxySSO configuration for the first time, follow these steps.

# /services/admin/ProxySSO-auth

Access or create a ProxySSO configuration.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-auth` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/admin/ProxySSO-auth

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| defaultRoleIfMissing | String | Name of default role to use if no mapping is found. |
| blacklistedUsers | String | Comma separated list of blacklisted users. |
| blacklistedAutoMappedRoles | String | Comma separated list of blacklisted roles. |
| disabled | String | `0` indicates that the configuration is enabled. |
| title | String | Configuration name |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-auth
```

## POST /services/admin/ProxySSO-auth

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | Yes | — | Required. New ProxySSO configuration name |
| defaultRoleIfMissing | Role name | No | — | Specify a default role to use if no mapping is found. |
| blacklistedUsers | Comma separated list | No | — | Specify blacklisted users. |
| blacklistedAutoMappedRoles | Comma separated list | No | — | Specify blacklisted roles. |

### Returned values

| Name | Type | Description |
|---|---|---|
| defaultRoleIfMissing | String | Name of default role to use if no mapping is found. |
| blacklistedUsers | String | Comma separated list of blacklisted users. |
| blacklistedAutoMappedRoles | String | Comma separated list of blacklisted roles. |
| disabled | String | `0` indicates that the configuration is enabled. |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-auth -d name=my_proxy
```


---

# /services/admin/ProxySSO-auth/{proxy_name}

Access, update, or delete the`{proxy_name}` configuration.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-auth/{proxy_name}` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/admin/ProxySSO-auth/{proxy_name}

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| defaultRoleIfMissing | String | Name of default role to use if no mapping is found. |
| blacklistedUsers | String | Comma separated list of blacklisted users. |
| blacklistedAutoMappedRoles | String | Comma separated list of blacklisted roles. |
| disabled | String | `0` indicates that the configuration is enabled. |
| title | String | Configuration name |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-auth/my_proxy
```

## POST /services/admin/ProxySSO-auth/{proxy_name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | Yes | — | Required. New ProxySSO configuration name |
| defaultRoleIfMissing | Role name | No | — | Specify a default role to use if no mapping is found. |
| blacklistedUsers | Comma separated list | No | — | Specify blacklisted users. |
| blacklistedAutoMappedRoles | Comma separated list | No | — | Specify blacklisted roles. |

### Returned values

| Name | Type | Description |
|---|---|---|
| defaultRoleIfMissing | String | Name of default role to use if no mapping is found. |
| blacklistedUsers | String | Comma separated list of blacklisted users. |
| blacklistedAutoMappedRoles | String | Comma separated list of blacklisted roles. |
| disabled | String | `0` indicates that the configuration is enabled. |
| title | String | Configuration name |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-auth/my_proxy -d blacklistedAutoMappedRoles=role2,role3
```

## DELETE /services/admin/ProxySSO-auth/{proxy_name}

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme -X DELETE https://localhost:8089/services/admin/ProxySSO-auth/my_proxy
```


---

# /services/admin/ProxySSO-auth/{proxy_name}/disable

Disable the`{proxy_name}` configuration.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-auth/{proxy_name}/disable` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/admin/ProxySSO-auth/{proxy_name}/disable

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-auth/my_proxy/disable
```


---

# /services/admin/ProxySSO-auth/{proxy_name}/enable

Use a GET request to create and enable the`{proxy_name}` authentication setting. Changes are made in the default app context.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-auth/{proxy_name}/enable` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/admin/ProxySSO-auth/{proxy_name}/enable

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-auth/my_proxy/enable
```


---

# /services/admin/ProxySSO-groups

Access or create role to group ProxySSO mappings.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-groups` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/ProxySSO-groups

### Request parameters

No request parameters.

### Returned values

For each group returned, lists the`roles` assigned to it.

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-groups
```

## POST /services/admin/ProxySSO-groups

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| roles | User role name | No | — | Specify roles to map to the group that you are creating. Use a separate`roles` parameter for each role added. |

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed -X POST https://localhost:8089/services/admin/ProxySSO-groups/group1 -d roles=power
```


---

# /services/admin/ProxySSO-groups/{group_name}

Access, create, and manage role to group mappings.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-groups/{group_name}` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/ProxySSO-groups/{group_name}

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| roles | String | Roles mapped to this group. |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-groups/group2
```

## POST /services/admin/ProxySSO-groups/{group_name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| roles | User role name | No | — | Specify roles to map to the group that you are creating or updating. Use a separate`roles` parameter for each role added. |

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed -X POST https://localhost:8089/services/admin/ProxySSO-groups/group1 -d roles=power
```

## DELETE /services/admin/ProxySSO-groups/{group_name}

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed -X DELETE https://localhost:8089/services/admin/ProxySSO-groups/group2
```


---

# /services/admin/ProxySSO-user-role-map

Access or create a user to role mapping.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-user-role-map` |
| Auth required | Yes |
| Capability | `edit_user` |

## GET /services/admin/ProxySSO-user-role-map

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| roles | String | Roles mapped to the user |
| title | String | User name |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-user-role-map
```

## POST /services/admin/ProxySSO-user-role-map

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | User name | No | — | Specify a user to map to specific roles |
| roles | User role name | No | — | Specify a role to map to the user. Use a separate`roles` parameter for each role that you are mapping. |

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed -X POST https://localhost:8089/services/admin/ProxySSO-user-role-map -d name=user1  -d roles=power
```


---

# /services/admin/ProxySSO-user-role-map/{user_name}

Access or delete a user to role mapping.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/ProxySSO-user-role-map/{user_name}` |
| Auth required | Yes |
| Capability | `edit_user` |

## GET /services/admin/ProxySSO-user-role-map/{user_name}

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| roles | String | Roles mapped to the`{user_name}` user. |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/ProxySSO-user-role-map/user1
```

## DELETE /services/admin/ProxySSO-user-role-map/{user_name}

### Request parameters

No request parameters.

### Returned values

The response lists remaining user to role mappings.

### Example

```
curl -k -u admin:changed -X DELETE https://localhost:8089/services/admin/ProxySSO-user-role-map/user2
```


---
