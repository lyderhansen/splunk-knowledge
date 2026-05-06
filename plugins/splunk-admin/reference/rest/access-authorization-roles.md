# /services/authorization/roles

Create a role or get a list of defined roles with role permissions.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/roles` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authorization/roles

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Response keys

| Name | Type | Description |
|---|---|---|
| capabilities | String | List of capabilities assigned to role. |
| cumulativeRTSrchJobsQuota | String | Maximum number of concurrently running real-time searches for all role members. Warning message logged when limit is reached. |
| cumulativeSrchJobsQuota | String | Maximum number of concurrently running searches for all role members. Warning message logged when limit is reached. |
| (response) | — | defaultApp |
| fieldFilterExemption | String | A list of field filters from which each role is exempt. If a role is exempt from a field filter, the field filter is not run at search time for any users holding this role. Roles inherit all field filter exemptions from imported roles. You can't remove inherited field filter exemptions. |
| imported_capabilities | String | List of capabilities assigned to role made available from imported roles. |
| (response) | — | imported_roles |
| (response) | — | imported_rtSrchJobsQuota |
| (response) | — | imported_srchDiskQuota |
| (response) | — | imported_srchFilter |
| imported_srchIndexesAllowed | String | A list of indexes, imported from other roles, this role has permissions to search. |
| imported_srchIndexesDefault | String | A list of indexes, imported from other roles, that this role defaults to when no index is specified in a search. |
| imported_srchJobsQuota | String | The maximum number of historical searches for this role that are imported from other roles. |
| (response) | — | imported_srchTimeWin |
| rtSrchJobsQuota | String | The maximum number of concurrent real time search jobs for this role. This count is independent from the normal search jobs limit. |
| srchDiskQuota | String | The maximum disk space in MB that can be used by a user's search jobs. For example, 100 limits this role to 100 MB total. |
| (response) | — | srchFilter |
| srchIndexesAllowed | String | A list of indexes this role has permissions to search. |
| srchIndexesDefault | String | List of search indexes that default to this role when no index is specified. |
| (response) | — | srchJobsQuota |
| (response) | — | srchTimeWin |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/roles
```

## POST /services/authorization/roles

### Request parameters

List of capabilities assigned to role. To send multiple capabilities, send this argument multiple times.

Roles inherit all capabilities from imported roles.

Maximum number of concurrently running real-time searches that all members of this role can have.

Note: If a user belongs to multiple roles then the user first consumes searches from the roles with the largest cumulative search quota. When the quota of a role is completely used up then roles with lower quotas are examined.

Maximum number of concurrently running searches for all role members. Warning message logged when limit is reached.

Note: If a user belongs to multiple roles then the user first consumes searches from the roles with the largest cumulative search quota. When the quota of a role is completely used up then roles with lower quotas are examined.

Specify a role to import attributes from. To import multiple roles, specify them separately. By default a role imports no other roles.

Importing other roles imports all aspects of that role, such as capabilities and allowed indexes to search. In combining multiple roles, the effective value for each attribute is the value with the broadest permissions.

Default roles

- admin
- can_delete
- power
- user

You can specify additional roles created.

name

Specify the maximum number of concurrent real-time search jobs for this role.

This count is independent from the normal search jobs limit.

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/roles -d name=newrole1 -d imported_roles=user
```


---

# /services/authorization/roles/{name}

Access, create, or delete properties for the`{name}` role.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/roles/{name}` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authorization/roles/{name}

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| capabilities | String | List of capabilities assigned to this role. |
| cumulativeRTSrchJobsQuota | String | Maximum number of concurrently running real-time searches for all role members. A warning message is logged when this limit is reached. |
| cumulativeSrchJobsQuota | String | Maximum number of concurrently running searches for all role members. A warning message is logged when this limit is reached. |
| (response) | — | defaultApp |
| fieldFilterExemption | String | A list of field filters from which this role is exempt. If a role is exempt from a field filter, the field filter is not run at search time for any users holding this role. Roles inherit all field filter exemptions from imported roles. You can't remove inherited field filter exemptions. |
| imported_capabilities | String | List of capabilities assigned to the role that were made available from imported roles. |
| (response) | — | imported_roles |
| (response) | — | imported_rtSrchJobsQuota |
| (response) | — | imported_srchDiskQuota |
| (response) | — | imported_srchFilter |
| imported_srchIndexesAllowed | String | A list of indexes, imported from other roles, that this role has permissions to search. |
| imported_srchIndexesDefault | String | A list of indexes, imported from other roles, that this role defaults to when no index is specified in a search. |
| imported_srchJobsQuota | String | The maximum number of historical searches for this role that are imported from other roles. |
| (response) | — | imported_srchTimeWin |
| rtSrchJobsQuota | String | The maximum number of concurrent real-time search jobs for this role. This count is independent from the normal search jobs limit. |
| srchDiskQuota | String | The maximum disk space in MB that can be used by a user's search jobs. For example, 100 limits this role to 100 MB total. |
| (response) | — | srchFilter |
| srchIndexesAllowed | String | A list of indexes this role has permissions to search. |
| srchIndexesDefault | String | List of search indexes that default to this role when no index is specified. |
| srchIndexesDisallowed | String | A list of indexes that this role does not have permission to search on or delete. |
| (response) | — | srchJobsQuota |
| (response) | — | srchTimeWin |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/roles/user
```

## POST /services/authorization/roles/{name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| capabilities | String | No | — | List of capabilities assigned to this role. |
| cumulativeRTSrchJobsQuota | Number | No | — | Maximum number of concurrently running real-time searches for all role members. A warning message is logged when this limit is reached. |
| cumulativeSrchJobsQuota | Number | No | — | Maximum number of concurrently running searches for all role members. A warning message is logged when this limit is reached. |
| defaultApp | String | No | — | String |
| imported_capabilities | String | No | — | List of capabilities assigned to the role that were made available from imported roles. |
| imported_roles | String | No | — | String |
| imported_rtSrchJobsQuota | String | No | — | String |
| imported_srchDiskQuota | String | No | — | String |
| imported_srchFilter | String | No | — | String |
| imported_srchIndexesAllowed | String | No | — | A list of indexes, imported from other roles, that this role has permissions to search. |
| imported_srchIndexesDefault | String | No | — | A list of indexes, imported from other roles, that this role defaults to when no index is specified in a search. |
| imported_srchJobsQuota | String | No | — | The maximum number of historical searches for this role that are imported from other roles. |
| imported_srchTimeWin | String | No | — | String |
| rtSrchJobsQuota | Number | No | — | The maximum number of concurrent real-time search jobs for this role. This count is independent from the normal search jobs limit. |
| srchDiskQuota | Number | No | — | The maximum disk space in MB that can be used by a user's search jobs. For example, 100 limits this role to 100 MB total. |
| srchFilter | String | No | — | String |
| srchIndexesAllowed | String | No | — | A list of indexes this role has permissions to search. |
| srchIndexesDefault | String | No | — | List of search indexes that default to this role when no index is specified. |
| srchIndexesDisallowed | String | No | — | A list of indexes that this role does not have permission to search on or delete. |
| srchJobsQuota | String | No | — | Number |
| srchTimeWin | String | No | — | Number |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authentication/users/user fieldFilter-foo=sha256&fieldFilter-bar=NULL&fieldFilterLimit=sourcetype::foobar
```

## DELETE /services/authorization/roles/{name}

### Request parameters

No request parameters.

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme --request DELETE https://localhost:8089/services/authorization/roles/newrole1
```


---
