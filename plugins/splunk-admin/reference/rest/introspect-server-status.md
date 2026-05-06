# REST bundle: `server/status`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/status`

List`server/status` child resources.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status?output_mode=json'
```

---

# `/services/server/status/dispatch-artifacts`

Access search job information.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/dispatch-artifacts` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| count_realtime | string | Jobs active in the immediate past observation period, not including historical jobs. |
| count_scheduled | string | Jobs active in the immediate past observation period, not including real-time jobs. |
| count_summary | string | Jobs active in the immediate past observation period, not including non-summary jobs. |
| top_apps | string | Top 15 apps in the past observation period, inapp:count key-value pair format. |
| top_named_searches | string | Top 15 named searches in the past observation period, in savedSearchName:count key-value pair format. |
| top_users | string | Top 15 users in the past observation period, in username:count key-value pair format, with count as the number of app contexts for the user. |
| total_count | string | Number of dispatched search jobs since start-up. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/dispatch-artifacts?output_mode=json'
```

---

# `/services/server/status/fishbucket`

Access information about the private BTree database.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/fishbucket` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| key_count | string | Number of file input records (keys) seen since start-up. |
| total_size | string | Total number of file input records (keys). |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/fishbucket?output_mode=json'
```

---

# `/services/server/status/installed-file-integrity`

Check for system file irregularities.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/installed-file-integrity` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| refresh \| Boolean \| Set to`true` to perform a new file integrity check. Only one such check can be performed at a time. \| \| regex_filter \| PCRE regular expression \| Specify a regular expression to filter results of the check. For example, use`rege |

### Returned values

| Name | Type | Description |
|------|------|-------------|
|  | string | Indicates complete file integrity. No irregularities were found. |
| access_failed | string | The`splunkd` process does not have permissions to read the file. |
| differs | string | The installed file differs from the manifest file. |
| missing | string | The installed file was not found. |
| read_failed | string | The installed file comparison failed. |
| other_open_failed | string | A failure other than failure to access or read was encountered when trying to open the file. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/installed-file-integrity?output_mode=json'
```

---

# `/services/server/status/limits/search-concurrency`

Access search concurrency metrics for a standalone Splunk Enterprise instance.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/limits/search-concurrency` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| max_auto_summary_searches | string | Maximum number of auto summary searches. |
| max_hist_scheduled_searches | string | Maximum number of historical scheduled searches. |
| max_hist_searches | string | Maximum number of historical searches. |
| max_rt_scheduled_searches | string | Maximum number of scheduled searches. |
| max_rt_searches | string | Maximum number of real-time searches. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/limits/search-concurrency?output_mode=json'
```

---

# `/services/server/status/partitions-space`

Access disk utilization information for filesystems that have Splunk objects, such as indexes, volumes, and logs. A filesystem can span multiple physical disk partitions.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/status/partitions-space` |
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
| capacity | string | Disk capacity (MB). |
| free | string | Disk free space (MB). |
| fs_type | string |  |
| mount_point | string | Absolute path of the directory where this partition is mounted. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/status/partitions-space?output_mode=json'
```

---

