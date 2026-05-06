# /services/admin/summarization

Get aggregated details about all accelerated data model summaries.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/admin/summarization` |
| Auth required | Yes |
| Capability | Role-based (Splunk ACLs) |

## GET /services/admin/summarization
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| search | Various | The data models, represented as search strings. |
| summary.access_count | Number / String | The total number of times that the summary for each data model has been accessed. |
| summary.access_time | Number / String | The last time that the summary of each data model was accessed. |
| summary.average_time | Number / String | The average runtime of the past 48 summarization search jobs for this data model. |
| summary.buckets | Number / String | The total number of buckets in the summaries of each data model. |
| summary.buckets_size | Number / String | The total size of the buckets in the summaries of each data model. The size is reported in terms of megabytes (MB). |
| summary.complete | Number / String | Reports whether or not the summaries for each data model are complete. |
| summary.earliest_time | Number / String | The timestamp of the earliest event in the summaries for each data model. |
| summary.id | Number / String | The ID of the data models being summarized. The format is`DM_ _ `. |
| summary.is_inprogress | Number / String | Indicates whether or not the summary build is currently in progress for each data model. |
| summary.last_error | Number / String | Lists errors that were logged in the latest run (from`last_sid`) of the summary creation search. |
| summary.last_sid | Number / String | The SID of the latest creation search job for each data model summary. |
| summary.latest_time | Number / String | The timestamp of the latest events in each data model summary. |
| summary.latest_dispatch_time | Number / String | The timestamp of the latest summary creation search for each data model. |
| summary.latest_run_duration | Number / String | The runtime of the latest summary creation search for each data model. |
| summary.mod_time | Number / String | The last time each data model summary was modified. |
| summary.p50 | Number / String | The 50th percentile of summarization search runtimes for each data model. 50 percent of the summarization searches for a given data model had runtimes that were less than this value. |
| summary.p90 | Number / String | The 90th percentile of summarization search runtimes for each data model. 90 percent of the summarization searches for a given data model had runtimes that were less than this value. |
| summary.run_stats | Number / String | The start and duration of all saved previous summarization search jobs, up to 100 jobs. |
| summary.size | Number / String | The total size of each summary, in bytes. |
| summary.time_range | Number / String | The range of time covered by each summary. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/admin/summarization/?by_tstats=1
```

---

# /services/admin/summarization/tstats:DM_{app}_{data_model_ID}

Review information about the summaries of a specific data model. Identify specific data models by providing their app short name and their data model ID.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/admin/summarization/tstats:DM_{app}_{data_model_ID}` |
| Auth required | Yes |
| Capability | Role-based (Splunk ACLs) |

## GET /services/admin/summarization/tstats:DM_{app}_{data_model_ID}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | string | No | — | The short name of the app to which the data set belongs. |
| required | string | No | — | The ID of the data model. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| search | Various | The data model, represented as a search string. |
| summary.access_count | Number / String | The total number of times that the summary for this data model has been accessed. |
| summary.access_time | Number / String | The last time that the summary of this data model was accessed. |
| summary.average_time | Number / String | The average runtime of the past 48 summarization search jobs for this data model. |
| summary.buckets | Number / String | The total number of buckets in the summary of this data model. |
| summary.buckets_size | Number / String | The total size of the buckets in the summary of this data model. The size is reported in terms of megabytes (MB). |
| summary.complete | Number / String | Reports whether or not the summary for the data model are complete. |
| summary.earliest_time | Number / String | The timestamp of the earliest event in the summary for this data model. |
| summary.id | Number / String | The ID of the data model being summarized. The format is`DM_ _ `. |
| summary.is_inprogress | Number / String | Indicates whether or not the data model summary build is currently in progress. |
| summary.last_error | Number / String | Lists errors that were logged in the latest run (from`last_sid`) of the summary creation search. |
| summary.last_sid | Number / String | The SID of the latest data model summary creation search job. |
| summary.latest_time | Number / String | The timestamp of the latest event in the data model summary. |
| summary.latest_dispatch_time | Number / String | The timestamp of the latest summary creation search for the data model. |
| summary.latest_run_duration | Number / String | The runtime of the latest summary creation search for the data model. |
| summary.mod_time | Number / String | The last time the data model summary was modified. |
| summary.p50 | Number / String | The 50th percentile of summarization search runtimes for the data model. 50 percent of the summarization searches for this data model had runtimes that were less than this value. |
| summary.p90 | Number / String | The 90th percentile of summarization search runtimes for the data model. 90 percent of the summarization searches for this data model had runtimes that were less than this value. |
| summary.run_stats | Number / String | The start and duration of all saved previous summarization search jobs, up to 100 jobs. |
| summary.size | Number / String | The total size of the summary, in bytes. |
| summary.time_range | Number / String | The range of time covered by the summary. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/admin/summarization/tstats:DM_search_test_new_accel
```
