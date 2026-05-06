# /services/licenser/groups

Access licenser group configuration: each group contains one or more licenser stacks that can run concurrently, while only one group is active at a time.

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/groups`, `/services/licenser/groups/{name}` |
| Auth required | Yes |
| Capability | `license_edit` (typical for licensing endpoints; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform (search-tier REST scope only).

---

## GET /services/licenser/groups

List all licenser groups.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| (standard pagination/filtering) | various | No | — | Splunk REST [pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a01363--en__Pagination_and_filtering_parameters) apply to this method. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| is_active | Boolean | Indicates whether the license group is active. |
| stack_ids | List | The license stacks in the license group. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/groups?output_mode=json
```

---

## GET /services/licenser/groups/{name}

List one licenser group identified by `{name}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| is_active | Boolean | Indicates whether the license group is active. |
| stack_ids | List | The license stacks in the license group. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/groups/Forwarder?output_mode=json
```

---

## POST /services/licenser/groups/{name}

Activate the specified licenser group and deactivate the previously active group. Only one active group may exist per instance (for example switching free ↔ enterprise or download-trial ↔ free).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| is_active | Boolean | Yes | — | Must be set to activate the named licenser group. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented (operation returns feed metadata without detailed content keys in the reference example). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/groups/Enterprise -d is_active=1
```
