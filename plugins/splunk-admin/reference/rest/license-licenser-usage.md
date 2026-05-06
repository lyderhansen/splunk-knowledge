# /services/licenser/usage

Return current license usage statistics for the active license group since midnight server time (including recent peer usage).

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/usage` |
| Auth required | Yes |
| Capability | `license_edit` (typical; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/licenser/usage

Enumerate license usage information covering the last minute through midnight server time.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a01363--en__Pagination_and_filtering_parameters) apply to this method. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| quota | Number | Byte quota of the license stack computed from all licenses in the **active** license group. |
| peers_usage_bytes | Number / Object | Peer usage bytes across pools that belong to the active license group (representation follows Splunk REST feed entry). |
| disabled | Number | Present on usage entries when returned (example shows `disabled` alongside ACL metadata). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/usage?output_mode=json
```
