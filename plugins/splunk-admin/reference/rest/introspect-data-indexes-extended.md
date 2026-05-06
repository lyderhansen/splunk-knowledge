# REST bundle: `data/indexes-extended`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/data/indexes-extended`

Access index bucket-level information. There are three bucket super-directories per index.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/indexes-extended` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| datatype | String | No | all | Valid values: (all\|event\|metric). Specifies the type of index. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| bucket_dirs | string | (If total_size > 0) Lists the following attributes for each index bucket super-directory (home, cold, thawed): bucket_count (thawed and cold only), event_count, event_max_time, event_min_time, hot_bucket_count (home only), size, warm_bucket_count (home only). |
| name | string | Index name. |
| total_bucket_count | string | (If total_size >`0`) Number of index buckets. |
| total_event_count | string | (If total_size >`0`) Number of events for index, excluding`frozen` events. Approximately equal to the event_count sum of all buckets. |
| total_raw_size | string | (If total_size >`0`) Cumulative size (fractional MB) on disk of the` /rawdata/` directories of all buckets in this index, excluding`frozen`. |
| total_size | string | Size (fractional MB) on disk of this index. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/indexes-extended?output_mode=json'
```

---

# `/services/data/indexes-extended/{name}`

Access bucket-level information for the`{name}` index. There are three bucket super-directories per index.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/indexes-extended/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| (If total_size >`0`) Lists the following attributes for each index bucket super-directory (home, cold, thawed): bucket_count (thawed and cold only), event_count, event_max_time, event_min_time, hot_bucket_count (home only), size, warm_bucket_count (home only). | string |  |
| name | string | Index name. |
| (If total_size >`0`) Number of index buckets. | string |  |
| total_row_size | string | (If total_size >`0`) Cumulative size (fractional MB) on disk of the` /rawdata/` directories of all buckets in this index, excluding`frozen`. |
| total_size | string | Size (fractional MB) on disk of this index. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/indexes-extended/YOUR_NAME?output_mode=json'
```

---

