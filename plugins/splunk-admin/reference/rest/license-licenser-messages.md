# /services/licenser/messages

Read licenser messages such as warnings for pools, stacks, orphan peers, and license windows.

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/messages`, `/services/licenser/messages/{name}` |
| Auth required | Yes |
| Capability | `license_edit` (typical; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/licenser/messages

List all licenser messages, alerts, and persisted warnings for this node.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a01363--en__Pagination_and_filtering_parameters) apply to this method. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| category | String | Message category. Documented values: `license_window`, `pool_over_quota`, `stack_over_quota`, `orphan_peer`, `pool_warning_count`, `pool_violated_peer_count`. |
| create_time | Number | Time the message was created (UTC). |
| description | String | Human-readable licenser message text. |
| pool_id | String | License pool ID when the message applies to a pool; empty or absent when not pool-specific. |
| severity | String | Message severity: `INFO`, `WARN`, or `ERROR`. |
| peer_id | String | License peer ID when the message applies to a peer. |
| stack_id | String | License stack ID when the message applies to a stack; empty or absent when not stack-specific. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/messages?output_mode=json
```

---

## GET /services/licenser/messages/{name}

Return the message whose message ID equals `{name}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| category | String | Message category (`license_window`, `pool_over_quota`, `stack_over_quota`, `orphan_peer`, `pool_warning_count`, `pool_violated_peer_count`). |
| create_time | Number | Time the message was created (UTC). |
| description | String | Human-readable licenser message text. |
| pool_id | String | License pool ID when applicable. |
| severity | String | `INFO`, `WARN`, or `ERROR`. |
| peer_id | String | License peer ID when applicable. |
| stack_id | String | License stack ID when applicable. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/messages/<MSG_ID>?output_mode=json
```
