# /services/licenser/stacks

Inspect license stacks: each stack aggregates one or more licenses of the same type, with additive daily indexing quota.

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/stacks`, `/services/licenser/stacks/{name}` |
| Auth required | Yes |
| Capability | `license_edit` (typical; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/licenser/stacks

Enumerate all license stacks.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a01363--en__Pagination_and_filtering_parameters) apply to this method. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| label | String | Display name of this license stack. |
| quota | Number | Byte quota for the stack (sum of member license quotas). |
| type | String | Additional stack type metadata (for example `enterprise`, `forwarder`, `free`). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/stacks?output_mode=json
```

---

## GET /services/licenser/stacks/{name}

Retrieve details for stack `{name}` (for example `enterprise`, `forwarder`, `free`, `download-trial`).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| label | String | Display name of this license stack. |
| quota | Number | Byte quota for the stack (sum of member license quotas). |
| type | String | Additional stack type metadata. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/stacks/enterprise?output_mode=json
```
