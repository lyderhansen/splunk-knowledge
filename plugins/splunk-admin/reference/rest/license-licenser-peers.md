# /services/licenser/peers

Inspect license peers registered with this license manager.

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/peers`, `/services/licenser/peers/{name}` |
| Auth required | Yes |
| Capability | `license_edit` (typical; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/licenser/peers

List all peers registered to this license manager. Any manager connection attempt is reported regardless of pool allocation.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None documented for endpoint-specific parameters. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| label | String | Plain-text name for the license peer. |
| pool_ids | List | License pools of which this peer is a member. |
| stack_ids | List | License stacks of which this peer is a member. |
| warning_count | Number | Number of license warnings issued for this peer. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/peers?output_mode=json
```

---

## GET /services/licenser/peers/{name}

Return attributes for the peer `{name}` (typically the peer GUID).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| label | String | Plain-text name for the license peer. |
| pool_ids | List | License pools of which this peer is a member. |
| stack_ids | List | License stacks of which this peer is a member. |
| warning_count | Number | Number of license warnings issued for this peer. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/peers/<PEER_GUID>?output_mode=json
```
