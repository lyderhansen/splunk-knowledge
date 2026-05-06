# /services/authorization/grantable_capabilities

Get a list of all capabilities that the current user can grant.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/grantable_capabilities` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authorization/grantable_capabilities

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Response keys

| Name | Type | Description |
|---|---|---|
| capabilities | String | For users with the`edit_roles` capability, lists all capabilities. For users with`edit_roles_grantable`,`edit_user`, and`grantableRoles`, lists only grantable capabilities. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/grantable_capabilities
```


---
