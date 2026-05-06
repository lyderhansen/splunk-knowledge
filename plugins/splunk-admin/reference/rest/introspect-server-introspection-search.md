# REST bundle: `server/introspection/search`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/introspection/search/dispatch`

Provides vital statistics for distributed search framework, including details on search peer performance.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/search/dispatch` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Bundle_Directory_Reaper_Average_Time(ms) | string | Average time for dispatch reaper to walk search peer directory and reap obsolete bundles. |
| Bundle_Directory_Reaper_Max_Time(ms) | string | Maximum time for dispatch reaper to walk search peer directory and reap obsolete bundles. |
| Compute_User_Search_Quota_Average_Time(ms) | string | Average time for computing user search quota. |
| Compute_User_Search_Quota_Max_Time(ms) | string | Maximum time for computing user search quota. |
| Dispatch_Directory_Reaper_Average_Time(ms) | string | Average time for dispatch reaper to walk dispatch directory and reap stale artifacts. |
| Dispatch_Directory_Reaper_Max_Time(ms) | string | Maximum time for dispatch reaper to walk dispatch directory and reap stale artifacts. |
| Search_StartUp_Time_Average_Time(ms) | string |  |
| Search_StartUp_Time_Max_Time(ms) | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/search/dispatch?output_mode=json'
```

---

# `/services/server/introspection/search/dispatch/Bundle_Directory_Reaper`

Get average and maximum time for the dispatch reaper to walk the search peer directory and reap obsolete bundles.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/search/dispatch/Bundle_Directory_Reaper` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Bundle_Directory_Reaper_Average_Time(ms) | string | Average time for dispatch reaper to walk search peer directory and reap obsolete bundles. |
| Bundle_Directory_Reaper_Max_Time(ms) | string | Maximum time for dispatch reaper to walk search peer directory and reap obsolete bundles. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/search/dispatch/Bundle_Directory_Reaper?output_mode=json'
```

---

# `/services/server/introspection/search/dispatch/Compute_User_Search_Quota`

Provides average and maximum time for computing user search quotas.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/search/dispatch/Compute_User_Search_Quota` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Compute_User_Search_Quota_Average_Time(ms) | string | Average time for computing user search quota. |
| Compute_User_Search_Quota_Max_Time(ms) | string | Maximum time for computing user search quota. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/search/dispatch/Compute_User_Search_Quota?output_mode=json'
```

---

# `/services/server/introspection/search/dispatch/Dispatch_Directory_Reaper`

Get average and maximum time for the dispatch reaper to walk the dispatch directory and reap stale artifacts.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/search/dispatch/Dispatch_Directory_Reaper` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Dispatch_Directory_Reaper_Average_Time(ms) | string | Average time for dispatch reaper to walk dispatch directory and reap stale artifacts. |
| Dispatch_Directory_Reaper_Max_Time(ms) | string | Maximum time for dispatch reaper to walk dispatch directory and reap stale artifacts. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/search/dispatch/Dispatch_Directory_Reaper?output_mode=json'
```

---

# `/services/server/introspection/search/dispatch/Search_StartUp_Time`

Get average and maximum time for search preprocessing before startup.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/search/dispatch/Search_StartUp_Time` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Search_StartUp_Time_Average_Time(ms) | string | Average time for preprocessing before search startup. Counted from time search state is set to`RUNNING`. |
| Search_StartUp_Time_Max_Time(ms) | string | Maximum time for preprocessing before search startup. Counted from time search state is set to`RUNNING`. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/search/dispatch/Search_StartUp_Time?output_mode=json'
```

---

# `/services/server/introspection/search/distributed`

Get information about the search knowledge bundle replication, if the current instance is the search head. Provides details about maximum and average time to execute routine distributed search methods, including peer info, peer bundles list, and authentication token requests from search heads.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/search/distributed` |
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
| Get_Authentication_Max_Time(ms) | string | Maximum time for search head to get authentication from this peer. |
| Get_Authentication_Mean_Time(ms) | string | Average time for search head to get authentication from this peer. |
| Get_BundleList_Max_Time(ms) | string | Maximum time for search head to get bundle list from this peer. |
| Get_ServerInfo_Max_Time(ms) | string | Maximum time for search head to get server information back from this peer. |
| Get_ServerInfo_Mean_Time(ms) | string | Average time for search head to get server information back from this peer. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/search/distributed?output_mode=json'
```

---

# `/services/server/introspection/search/saved`

Access most recent scheduled search priority scores and score calculation adjustments.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/search/saved` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| final_score | string | Most recent calculated priority score, based on adjustments and original score. |
| name | string | Scheduled search name. |
| orig_score | string | A score based on a search's originally scheduled run time. |
| owner | string | Search scope or context owner. This could be a specific user or "nobody" for a search defined in an app or system-level scope. |
| priority_no | string | Most recent calculated priority number for this search. |
| real_time_adj | string | Real-time search priority adjustment. Real-time searches default to -80000 and continuous scheduled searches default to 0. This particular value is for internal purposes only and is subject to change. |
| runtime_adj | string | Calculated value based on average search runtime. |
| skipped_adj | string | Adjustment for number of times search has been skipped and search period. 0 means the search has not been skipped. |
| window_adj | string | Adjustment for remaining time in search run window. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/search/saved?output_mode=json'
```

---

