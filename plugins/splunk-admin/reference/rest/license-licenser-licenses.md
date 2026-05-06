# /services/licenser/licenses

List, add, inspect, and remove license entitlements for the Splunk Enterprise instance. A license controls features such as indexing quota, authentication, search, and forwarding.

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/licenses`, `/services/licenser/licenses/{name}` |
| Auth required | Yes |
| Capability | `license_edit` (typical; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/licenser/licenses

List all licenses added to the instance across stacks and groups, regardless of which group is currently active.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a01363--en__Pagination_and_filtering_parameters) apply to this method. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| creation_time | Number | Creation time of the license in UTC (epoch-style value in examples). |
| expiration_time | Number | Expiration time of the license in UTC. |
| features | List | Features and components enabled by this license. |
| group_id | String | ID of the group to which this license belongs. |
| label | String | Plain-text description of this license. |
| license_hash | String | Unique identifier for the license; REST uses this hash as `{name}` in resource URLs. |
| max_violations | Number | Maximum violations allowed during `window_period`. Search is disabled when exceeded. |
| quota | Number | Daily indexing quota in bytes for this license. |
| sourcetypes | List | Allowed sourcetypes; indexing sourcetypes not in this list is not permitted. An empty list means all sourcetypes are allowed. |
| stack_id | String | ID of the license stack to which this license belongs. |
| status | String | License status: `VALID` or `EXPIRED`. |
| type | String | Additional information about license type. |
| window_period | Number | Rolling period in days in which violations are aggregated. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/licenses?output_mode=json
```

---

## POST /services/licenser/licenses

Add a license entitlement to the current instance.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Conditional | — | Path to the license file on the server. **Required** unless `payload` is supplied; ignored when `payload` is set. |
| payload | String | Conditional | — | String representation of the license encoded as XML. When present, `name` is ignored. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| creation_time | Number | Creation time of the license in UTC. |
| expiration_time | Number | Expiration time of the license in UTC. |
| features | List | Features and components enabled by this license. |
| group_id | String | ID of the group to which this license belongs. |
| label | String | Plain-text description of this license. |
| license_hash | String | Unique identifier for the license. |
| max_violations | Number | Maximum violations allowed during `window_period`. |
| payload | String | String representation of the license encoded as XML (returned when applicable). |
| quota | Number | Daily indexing quota in bytes for this license. |
| sourcetypes | List | Allowed sourcetypes; empty list means all sourcetypes are allowed. |
| stack_id | String | ID of the license stack to which this license belongs. |
| status | String | `VALID` or `EXPIRED`. |
| type | String | Additional information about license type. |
| window_period | Number | Rolling period in days in which violations are aggregated. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/licenses -d name=/Users/myusername/downloads/Splunk_enterprise.lic
```

---

## GET /services/licenser/licenses/{name}

Return details for one license. `{name}` is the **license hash** (payload hash), not the human-readable label.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| creation_time | Number | Creation time of the license in UTC. |
| expiration_time | Number | Expiration time of the license in UTC. |
| features | List | Features and components enabled by this license. |
| group_id | String | ID of the group to which this license belongs. |
| label | String | Plain-text description of this license. |
| license_hash | String | Unique identifier for the license (matches `{name}`). |
| max_violations | Number | Maximum violations allowed during `window_period`. |
| quota | Number | Daily indexing quota in bytes for this license. |
| sourcetypes | List | Allowed sourcetypes; empty list means all sourcetypes are allowed. |
| stack_id | String | ID of the license stack to which this license belongs. |
| status | String | `VALID` or `EXPIRED`. |
| type | String | Additional information about license type. |
| window_period | Number | Rolling period in days in which violations are aggregated. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/licenses/<LICENSE_HASH>?output_mode=json
```

---

## DELETE /services/licenser/licenses/{name}

Delete the license whose hash is `{name}`. You cannot delete the last license in an active group; switch active groups first, then delete.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented. |

### Example

```
curl -k -u admin:pass --request DELETE https://localhost:8089/services/licenser/licenses/<LICENSE_HASH>
```
