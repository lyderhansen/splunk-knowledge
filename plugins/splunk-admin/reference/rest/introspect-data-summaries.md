# REST bundle: `data/summaries`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/data/summaries`

Get disk usage information about all summaries in an indexer.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/summaries` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | string | Summary name. |
| related_indexes | string | Lists up to 10 indexes that contribute to this summary. |
| related_indexes_count | string | Provides total count of related indexes for this summary. |
| search_head_guid | string | GUID for the search head that created the summary data. |
| total_bucket_count | string | Number of buckets for this summary. |
| total_size | string | Total disk size for this summary, in MB. |
| type | string | Summary type, either`"report_acceleration"` or`"data_model_acceleration"`. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/summaries?output_mode=json'
```

---

# `/services/data/summaries/{summary_name}`

Get disk usage information about the`{name}` indexer summary.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/summaries/{summary_name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | string | Summary name. |
| related_indexes | string | Lists up to 10 indexes that contribute to this summary. |
| related_indexes_count | string | Provides total count of related indexes for this summary. |
| search_head_guid | string | GUID for search head creating the summary data. |
| total_bucket_count | string | Number of buckets for this summary. |
| total_size | string | Total summary disk size in MB. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/summaries/YOUR_SUMMARY?output_mode=json'
```

---

