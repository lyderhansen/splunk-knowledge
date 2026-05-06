# /services/licenser/pools

Create, list, update, and delete license pools that partition daily volume entitlements within a stack across peers.

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/pools`, `/services/licenser/pools/{name}` |
| Auth required | Yes |
| Capability | `license_edit` (typical; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/licenser/pools

Enumerate all license pools.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a01363--en__Pagination_and_filtering_parameters) apply to this method. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| description | String | Description of the license pool. |
| quota | String | Byte quota for the pool: `MAX` for maximum allowed by the license (only one `MAX` pool per stack), or a numeric byte count. |
| peers | List | Peer IDs that are members of this pool; may include `*` for all peers (Atom list in XML examples). |
| peers_usage_bytes | Object | Map of peer identifier to usage in bytes for peers assigned to this license. |
| stack_id | String | Stack ID for the stack that owns this pool. |
| used_bytes | Number | Usage in bytes for this license pool. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/pools?output_mode=json
```

---

## POST /services/licenser/pools

Create a license pool.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Name of the pool being created. |
| description | String | No | — | Description of the pool. |
| quota | String | Yes | — | Pool quota: `MAX`, a raw byte count (for example `552428800`), or a suffixed size such as `50MB`. |
| peers | String | Yes | — | Comma-separated peer IDs, `*` for all peers, or comma-separated GUIDs allowed to use the pool. |
| stack_id | Enum | Yes | — | Stack ID; valid values: `download-trial`, `Enterprise`, `Forwarder`, `Free`, `Lite`, `Lite_Free`. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented for the collection POST response body beyond standard feed metadata. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/pools -d name=myLicensePool -d quota=MAX -d peers=* -d stack_id=enterprise
```

---

## GET /services/licenser/pools/{name}

Return details for the pool `{name}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| description | String | Description of the license pool. |
| quota | String | Byte quota (`MAX` or numeric representation). |
| peers | List | Pool member peer IDs. |
| peers_usage_bytes | Object | Per-peer usage in bytes. |
| stack_id | String | Owning stack ID. |
| used_bytes | Number | Pool usage in bytes. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/pools/auto_generated_pool_forwarder?output_mode=json
```

---

## POST /services/licenser/pools/{name}

Edit properties of an existing pool `{name}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| append_peers | Boolean | No | — | When updating `peers`, controls whether new peers append to the existing list (`true`) or replace it (`false`). |
| description | String | No | — | Pool description. |
| quota | String | No | — | Quota string (`MAX`, numeric bytes, or values such as `50MB`). |
| peers | String | No | — | Comma-separated peer IDs or `*`. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented; response typically echoes updated pool entry fields in feed form. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/pools/myLicensePool -d quota=50MB
```

---

## DELETE /services/licenser/pools/{name}

Delete the named pool. Some stacks expose fixed pools that cannot be deleted.

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
curl -k -u admin:pass --request DELETE https://localhost:8089/services/licenser/pools/auto_generated_pool_enterprise
```
