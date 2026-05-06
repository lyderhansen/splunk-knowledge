# Search concurrency settings

Inspect or edit search concurrency limits for scheduler and interactive searches.

## `/services/search/concurrency-settings`

List search concurrency settings.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/concurrency-settings` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/concurrency-settings`

List search concurrency settings.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| max_searches_perc | Number | The maximum number of searches the scheduler can run as a percentage of the maximum number of concurrent searches. Default: 50%. |
| auto_summary_perc | Number | The maximum number of concurrent searches to be allocated for auto summarization, as a percentage of the concurrent searches that the scheduler can run. Default: 50. |
| max_searches_per_cpu | Number | The maximum number of concurrent historical searches allowed per cpu. Default: 1. |
| base_max_searches | Number | A baseline constant to add to the max number of searches (computed as multiplier of the CPUs.) Default is 6. |
| max_rt_search_multiplier | Number | A number by which the maximum number of historical searches is multiplied to determine the maximum number of concurrent real-time searches. Note: The maximum number of real-time searches is computed as max_rt_searches = max_rt_search_multiplier x max_hist_searches |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/concurrency-settings
```



---

## `/services/search/concurrency-settings/scheduler`

Edit settings that determine concurrent scheduled search limits.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/concurrency-settings/scheduler` |
| Auth required | Yes |
| Capability | `edit_search_concurrency_scheduled` |

### POST `/services/search/concurrency-settings/scheduler`

Edit settings that determine concurrent scheduled search limits.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| max_searches_perc | Number | See docs | — | The maximum number of searches the scheduler can run as a percentage of the maximum number of concurrent searches. Default: 50. |
| auto_summary_perc | Number | See docs | — | The maximum number of concurrent searches to be allocated for auto summarization, as a percentage of the concurrent searches that the scheduler can run. Default: 50. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/concurrency-settings/scheduler -d max_searches_perc=40
```



---

## `/services/search/concurrency-settings/search`

Edit settings that determine the maximum number of concurrent scheduled searches.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/concurrency-settings/search` |
| Auth required | Yes |
| Capability | `edit_search_concurrency_all` |

### POST `/services/search/concurrency-settings/search`

Edit settings that determine the maximum number of concurrent scheduled searches.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| max_searches_per_cpu | Number | See docs | — | The maximum number of concurrent historical searches allowed per cpu. Default: 1. |
| base_max_searches | Number | See docs | — | A baseline constant to add to the max number of searches (computed as multiplier of the CPUs.) Default is 6. |
| max_rt_search_multiplier | Number | See docs | — | A number by which the maximum number of historical searches is multiplied to determine the maximum number of concurrent real-time searches. Note: The maximum number of real-time searches is computed as max_rt_searches = max_rt_search_multiplier x max_hist_searches |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/concurrency-settings/search -d base_max_searches=5 -d max_searches_per_cpu=4
```



---
