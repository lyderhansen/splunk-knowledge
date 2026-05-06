# Search jobs (`/services/search/jobs` family)

Create, inspect, control, export, and delete asynchronous search jobs, including v2 export/results/events endpoints.

## `/services/search/jobs`

List search jobs.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs`

Get details of all current searches.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Pagination and filtering parameters |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| cursorTime | varies | The earliest time from which no events are later scanned. Can be used to indicate progress. See description for doneProgress . |
| custom | varies | Custom job property. (See the search/jobs POST request for an example of how to create a custom property.) Note: Filtering for custom search jobs fails in a search head cluster environment. Remove the ?search=custom filter to see all search jobs including custom jobs. |
| delegate | varies | For saved searches, specifies jobs that were started by the user. Defaults to scheduler. |
| diskUsage | varies | The total amount of disk space used, in bytes. |
| dispatchState | varies | The state of the search. Can be any of QUEUED, PARSING, RUNNING, FINALIZING, PAUSE, INTERNAL_CANCEL, USER_CANCEL, BAD_INPUT_CANCEL, QUIT, FINALIZING, FAILED, DONE. |
| doneProgress | varies | A number between 0 and 1.0 that indicates the approximate progress of the search. doneProgress = (latestTime – cursorTime) / (latestTime – earliestTime) |
| dropCount | varies | For real-time searches only, the number of possible events that were dropped due to the rt_queue_size (default to 100000). |
| earliestTime | varies | A time string that sets the earliest (inclusive), respectively, time bounds for the search. Can be used to indicate progress. See description for doneProgress . |
| eventAvailableCount | varies | The number of events that are available for export. |
| eventCount | varies | The number of events returned by the search. |
| eventFieldCount | varies | The number of fields found in the search results. |
| eventIsStreaming | varies | Indicates if the events of this search are being streamed. |
| eventIsTruncated | varies | Indicates if events of the search are not stored, making them unavailable from the events endpoint for the search. |
| eventPreviewableCount | varies | Number of in-memory events that are not yet committed to disk. Returned if timeline_events_preview is enabled in limits.conf . |
| eventSearch | varies | Subset of the entire search that is before any transforming commands. The timeline and events endpoint represents the result of this part of the search. |
| eventSorting | varies | Indicates if the events of this search are sorted, and in which order. asc = ascending; desc = descending; none = not sorted |
| isDone | varies | Indicates if the search has completed. |
| isEventPreviewEnabled | varies | Indicates if the timeline_events_preview setting is enabled in limits.conf . |
| isFailed | varies | Indicates if there was a fatal error executing the search. For example, invalid search string syntax. |
| isFinalized | varies | Indicates if the search was finalized (stopped before completion). |
| isPaused | varies | Indicates if the search is paused. |
| isPreviewEnabled | varies | Indicates if previews are enabled. |
| isRealTimeSearch | varies | Indicates if the search is a real time search. |
| isRemoteTimeline | varies | Indicates if the remote timeline feature is enabled. |
| isSaved | varies | Indicates that the search job is saved, storing search artifacts on disk for 7 days from the last time that the job was viewed or touched. Add or edit the default_save_ttl value in limits.conf to override the default value of 7 days. |
| isSavedSearch | varies | Indicates if this is a saved search run using the scheduler. |
| isZombie | varies | Indicates if the process running the search is dead, but with the search not finished. |
| keywords | varies | All positive keywords used by this search. A positive keyword is a keyword that is not in a NOT clause. |
| label | varies | Custom name created for this search. |
| latestTime | varies | A time string that sets the latest (exclusive), respectively, time bounds for the search. Can be used to indicate progress. See description for doneProgress . |
| messages | varies | Errors and debug messages. |
| numPreviews | varies | Number of previews generated so far for this search job. |
| performance | varies | A representation of the execution costs. |
| priority | varies | An integer between 0-10 that indicates the search priority. The priority is mapped to the OS process priority. The higher the number the higher the priority. The priority can be changed using action parameter for POST search/jobs/{search_id}/control. For example, for the action parameter, specify priority=5 . Note: In *nix systems, non-privileged users can only reduce the priority of a process. |
| remoteSearch | varies | The search string that is sent to every search peer. |
| reportSearch | varies | If reporting commands are used, the reporting search. |
| request | varies | GET arguments that the search sends to splunkd. |
| resultCount | varies | The total number of results returned by the search. In other words, this is the subset of scanned events (represented by the scanCount) that actually matches the search terms. |
| resultIsStreaming | varies | Indicates if the final results of the search are available using streaming (for example, no transforming operations). |
| resultPreviewCount | varies | The number of result rows in the latest preview results. |
| runDuration | varies | Time in seconds that the search took to complete. |
| scanCount | varies | The number of events that are scanned or read off disk. |
| searchEarliestTime | varies | Specifies the earliest time for a search, as specified in the search command rather than the earliestTime parameter. It does not snap to the indexed data time bounds for all-time searches (something that earliestTime/latestTime does). |
| searchLatestTime | varies | Specifies the latest time for a search, as specified in the search command rather than the latestTime parameter. It does not snap to the indexed data time bounds for all-time searches (something that earliestTime/latestTime does). |
| searchProviders | varies | A list of all the search peers that were contacted. |
| sid | varies | The search ID number. |
| statusBuckets | varies | Maximum number of timeline buckets. |
| ttl | varies | The time to live, or time before the search job expires after it completes. |
| *(notes)* | text | Application usage |
| *(notes)* | text | Information returned for each entry includes the search job properties, such as eventCount (number of events returned), runDuration (time the search took to complete), and others. The parameters to POST /search/jobs provides details on search job properties when creating a search. Search job properties are also described in Search job properties in the Knowledge Manager Manual. |
| *(notes)* | text | You can specify optional arguments based on the search job properties to filter the entries returned. For example, specify search=eventCount>100 as an argument to the GET operation to return searches with event counts greater than 100. |
| *(notes)* | text | The dispatchState property is of particular interest to determine the state of a search, and can contain the following values: |
| *(notes)* | text | This operation also returns performance information for the search. |
| *(notes)* | text | For more information refer to "View search job properties with the Search Job Inspector" in the Knowledge Manager Manual. |
| *(notes)* | text | For more information on searches, see the Search Reference. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs --get -d search="eventCount>100"
```


### POST `/services/search/jobs`

Start a new search and return the search ID (<sid>)

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| adhoc_search_level | String | No |  | Use one of the following search modes. CODE Copy [ verbose \| fast \| smart ] [ verbose \| fast \| smart ] If adhoc_search_level is not specified, the default mode is fast . |
| allow_partial_results | Boolean | No | true | Indicates whether the search job can proceed to provide partial results if a search peer fails. When set to false , the search job fails if a search peer providing results for the search job fails. |
| auto_cancel | Number | No | 0 | If specified, the job automatically cancels after this many seconds of inactivity. (0 means never auto-cancel) |
| auto_finalize_ec | Number | No | 0 | Auto-finalize the search after at least this many events are processed. Specify 0 to indicate no limit. |
| auto_pause | Number | No | 0 | If specified, the search job pauses after this many seconds of inactivity. (0 means never auto-pause.) To restart a paused search job, specify unpause as an action to POST search/jobs/{search_id}/control . auto_pause only goes into effect once. Unpausing after auto_pause does not put auto_pause into effect again. |
| custom | String | No |  | Specify a custom parameter (see example). |
| earliest_time | String | No |  | Specify a time string. Sets the earliest (inclusive), respectively, time bounds for the search. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. Compare to index_earliest parameter. Also see comment for the search_mode parameter. |
| enable_lookups | Boolean | No | true | Indicates whether lookups should be applied to events. Specifying true (the default) may slow searches significantly depending on the nature of the lookups. |
| exec_mode | Enum | No | normal | Valid values: (blocking \| oneshot \| normal) If set to normal, runs an asynchronous search. If set to blocking, returns the sid when the job is complete. If set to oneshot, returns results in the same call. In this case, you can specify the format for the output (for example, json output) using the output_mode parameter as described in GET search/jobs/export . Default format for output is xml. Does not return the search ID. |
| force_bundle_replication | Boolean | No | false | Specifies whether this search should cause (and wait depending on the value of sync_bundle_replication) for bundle synchronization with all search peers. |
| id | String | No |  | Optional string to specify the search ID ( <sid> ). If unspecified, a random ID is generated. |
| index_earliest | String | No |  | Specify a time string. Sets the earliest (inclusive), respectively, time bounds for the search, based on the index time bounds. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Compare to earliest_time parameter. Also see comment for the search_mode parameter. Refer to Time modifiers for search for information and examples of specifying a time string. |
| index_latest | String | No |  | Specify a time string. Sets the latest (exclusive), respectively, time bounds for the search, based on the index time bounds. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. Compare to latest_time parameter. Also see comment for the search_mode parameter. |
| indexedRealtime | Boolean | No |  | Indicate whether or not to used indexed-realtime mode for real-time searches. |
| indexedRealtimeOffset | Number | No |  | Set disk sync delay for indexed real-time search (seconds). |
| latest_time | String | No |  | Specify a time string. Sets the latest (exclusive), respectively, time bounds for the search. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. Compare to index_latest parameter. Also see comment for the search_mode parameter. |
| max_count | Number | No | 10000 | The number of events that can be accessible in any given status bucket. Also, in transforming mode, the maximum number of results to store. Specifically, in all calls, codeoffset+count max_count . |
| max_time | Number | No | 0 | The number of seconds to run this search before finalizing. Specify 0 to never finalize. |
| namespace | String | No |  | The application namespace in which to restrict searches. The namespace corresponds to the identifier recognized in the /services/apps/local endpoint. |
| now | String | No | current system time | Specify a time string to set the absolute time used for any relative time specifier in the search. Defaults to the current system time. You can specify a relative time modifier for this parameter. For example, specify +2d to specify the current time plus two days. If you specify a relative time modifier both in this parameter and in the search string, the search string modifier takes precedence. Refer to Time modifiers for search for details on specifying relative time modifiers. |
| reduce_freq | Number | No | 0 | Determines how frequently to run the MapReduce reduce phase on accumulated map values. |
| reload_macros | Boolean | No | true | Specifies whether to reload macro definitions from macros.conf . Default is true. |
| remote_server_list | String | No | empty list | Comma-separated list of (possibly wildcarded) servers from which raw events should be pulled. This same server list is to be used in subsearches. |
| replay_speed | Number greater than 0 | No |  | Indicate a real-time search replay speed factor. For example, 1 indicates normal speed. 0.5 indicates half of normal speed, and 2 indicates twice as fast as normal. earliest_time and latest_time arguments must indicate a real-time time range to use replay options. Use replay_speed with replay_et and replay_lt relative times to indicate a speed and time range for the replay. For example, CODE Copy replay_speed = 10 replay_et = -d@d replay_lt = -@d replay_speed = 10 replay_et = -d@d replay_lt = -@d specifies a replay at 10x speed, as if the "wall clock" time starts yesterday at midnight and ends when it reaches today at midnight. For more information about using relative time modifiers, see Search time modifiers in the Search reference . |
| replay_et | Time modifier string | No |  | Relative "wall clock" start time for the replay. |
| replay_lt | Time modifier string. | No |  | Relative end time for the replay clock. The replay stops when clock time reaches this time. |
| required_field_list | String | No | empty list | [Deprecated] Use rf . A comma-separated list of required fields that, even if not referenced or used directly by the search, is still included by the events and summary endpoints. Splunk Web uses these fields to prepopulate panels in the Search view. |
| reuse_max_seconds_ago | Number | No |  | Specifies the number of seconds ago to check when an identical search is started and return the job's search ID instead of starting a new job. |
| rf | String | No |  | Adds a required field to the search. There can be multiple rf POST arguments to the search. These fields, even if not referenced or used directly by the search, are still included by the events and summary endpoints. Splunk Web uses these fields to prepopulate panels in the Search view. Consider using this form of passing the required fields to the search instead of the deprecated required_field_list . If both rf and required_field_list are provided, the union of the two lists is used. |
| rt_blocking | Boolean | No | false | For a real-time search, indicates if the indexer blocks if the queue for this search is full. |
| rt_indexfilter | Boolean | No | true | For a real-time search, indicates if the indexer prefilters events. |
| rt_maxblocksecs | Number | No | 60 | For a real-time search with rt_blocking set to true, the maximum time to block. Specify 0 to indicate no limit. |
| rt_queue_size | Number | No | 10000 events | For a real-time search, the queue size (in events) that the indexer should use for this search. |
| search | String | Yes |  | The search language string to execute, taking results from the local and remote servers. Examples: "search *" "search * \| outputcsv" |
| search_listener | String | No |  | [Disabled] Registers a search state listener with the search. Use the format: search_state;results_condition;http_method;uri; For example: search_listener=onResults;true;POST;/servicesNS/admin/search/saved/search/foobar/notify; |
| search_mode | Enum | No | normal | Valid values: (normal \| realtime) If set to realtime , search runs over live data. A real-time search may also be indicated by earliest_time and latest_time variables starting with 'rt' even if the search_mode is set to normal or is unset. For a real-time search, if both earliest_time and latest_time are both exactly 'rt', the search represents all appropriate live data received since the start of the search. Additionally, if earliest_time and/or latest_time are 'rt' followed by a relative time specifiers then a sliding window is used where the time bounds of the window are determined by the relative time specifiers and are continuously updated based on the wall-clock time. |
| spawn_process | Boolean | No | true | This parameter is deprecated and will be removed in a future release. Do not use this parameter. Specifies whether the search should run in a separate spawned process. Default is true. Searches against indexes must run in a separate process. |
| status_buckets | Number | No | 0 | The most status buckets to generate. 0 indicates to not generate timeline information. |
| sync_bundle_replication | Boolean | No |  | Specifies whether this search should wait for bundle replication to complete. |
| time_format | String | No | %FT%T.%Q%:z | Used to convert a formatted time string from {start,end}_time into UTC seconds. The default value is the ISO-8601 format. |
| timeout | Number | No | 86400 | The number of seconds to keep this search after processing has stopped. |
| workload_pool | String | No |  | Specifies the new workload pool where the existing running search should be placed. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| sid | varies | Search ID |
| *(notes)* | text | Application usage |
| *(notes)* | text | The search parameter is a search language string that specifies the search. Often you create a search specifying just the search parameter. Use the other parameters to customize a search to specific needs. |
| *(notes)* | text | Use the returned (<sid>) in the following endpoints to view and manage the search: |
| *(notes)* | text | You can also use the custom attribute to create custom job properties (see example). |
| *(notes)* | text | For more information on searches, see the Splunk Search Reference. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/jobs --data-urlencode search="search index=_internal source=*/metrics.log" -d id=mysearch_02151949 -d max_count=50000 -d status_buckets=300
```

```
curl -u admin:changeme -k https://localhost:8089/services/search/jobs
    -d search="search *"
    -d custom.foobar="myCustomPropA"
    -d custom.foobaz="myCustomPropB"
```

```
curl -k -u admin:changed https://localhost:8089/services/search/jobs
    -d search="search index=_* *"
    -d search_mode="realtime"
    -d indexedRealtime="1"
    -d indexedRealtimeOffset="300"
```



---

## `/services/search/jobs/export`

Stream search results as they become available.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/export` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs/export`

Performs a search identical to POST search/jobs

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| auto_cancel | Number | No |  | See the POST parameter descriptions for search/jobs |
| auto_finalize_ec | Number | No |  | See the POST parameter descriptions for search/jobs |
| auto_pause | Number | No |  | See the POST parameter descriptions for search/jobs |
| earliest_time | String | No |  | See the POST parameter descriptions for search/jobs |
| enable_lookups | Bool | No |  | See the POST parameter descriptions for search/jobs |
| force_bundle_replication | Bool | No |  | See the POST parameter descriptions for search/jobs |
| id | String | No |  | See the POST parameter descriptions for search/jobs |
| index_earliest | String | No |  | Specify a time string. Sets the earliest (inclusive), respectively, time bounds for the search, based on the index time. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. |
| index_latest | String | No |  | Specify a time string. Sets the latest (inclusive), respectively, time bounds for the search, based on the index time. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. |
| latest_time | String | No |  | See the POST parameter descriptions for search/jobs |
| max_time | Number | No |  | See the POST parameter descriptions for search/jobs |
| namespace | String | No |  | See the POST parameter descriptions for search/jobs |
| now | String | No |  | See the POST parameter descriptions for search/jobs |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| reduce_freq | Number | No |  | See the POST parameter descriptions for search/jobs |
| reload_macros | Bool | No |  | See the POST parameter descriptions for search/jobs |
| remote_server_list | String | No |  | See the POST parameter descriptions for search/jobs |
| required_field_list | String | No |  | See the POST parameter descriptions for search/jobs |
| rf | String | No |  | See the POST parameter descriptions for search/jobs |
| rt_blocking | Bool | No |  | See the POST parameter descriptions for search/jobs |
| rt_indexfilter | Bool | No |  | See the POST parameter descriptions for search/jobs |
| rt_maxblocksecs | Number | No |  | See the POST parameter descriptions for search/jobs |
| rt_queue_size | Number | No |  | See the POST parameter descriptions for search/jobs |
| search | String | Yes |  | See the POST parameter descriptions for search/jobs |
| search_listener | String | No |  | See the POST parameter descriptions for search/jobs |
| search_mode | Enum | No |  | See the POST parameter descriptions for search/jobs |
| sync_bundle_replication | Bool | No |  | See the POST parameter descriptions for search/jobs |
| time_format | String | No |  | See the POST parameter descriptions for search/jobs |
| timeout | Number | No |  | See the POST parameter descriptions for search/jobs |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | For non-streaming searches, previews of the final results are available if preview is enabled. If preview is not enabled, use the search/jobs endpoint with exec_mode=oneshot to retrieve results from them. |
| *(notes)* | text | If the result set returned by a non-streaming search is significantly large, use the search/jobs endpoint with exec_mode=blocking . This approach lets you page through the results and request them from a server under your control. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/jobs/export -d search="search index%3D_internal | head 1"
```


### POST `/services/search/jobs/export`

Performs a search identical to POST search/jobs. For parameter and returned value descriptions, see the POST parameter descriptions for search/jobs .

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| search | String | No |  | See the parameters and returned values for search/jobs . |
| auto_cancel | Number | No |  | See the parameters and returned values for search/jobs . |
| auto_finalize_ec | Number | No |  | See the parameters and returned values for search/jobs . |
| auto_pause | Number | No |  | See the parameters and returned values for search/jobs . |
| earliest_time | String | No |  | See the parameters and returned values for search/jobs . |
| enable_lookups | Bool | No |  | See the parameters and returned values for search/jobs . |
| force_bundle_replication | Bool | No |  | See the parameters and returned values for search/jobs . |
| id | String | No |  | See the parameters and returned values for search/jobs . |
| index_earliest | String | No |  | Specify a time string. Sets the earliest (inclusive), respectively, time bounds for the search, based on the index time. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. |
| index_latest | String | No |  | Specify a time string. Sets the latest (inclusive), respectively, time bounds for the search, based on the index time. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. |
| latest_time | String | No |  | See the parameters and returned values for search/jobs . |
| max_time | Number | No |  | See the parameters and returned values for search/jobs . |
| namespace | String | No |  | See the parameters and returned values for search/jobs . |
| now | String | No |  | See the parameters and returned values for search/jobs . |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| reduce_freq | Number | No |  | See the parameters and returned values for search/jobs . |
| reload_macros | Bool | No |  | See the parameters and returned values for search/jobs . |
| remote_server_list | String | No |  | See the parameters and returned values for search/jobs . |
| required_field_list | String | No |  | See the parameters and returned values for search/jobs . |
| rf | String | No |  | See the parameters and returned values for search/jobs . |
| rt_blocking | Bool | No |  | See the parameters and returned values for search/jobs . |
| rt_indexfilter | Bool | No |  | See the parameters and returned values for search/jobs . |
| rt_maxblocksecs | Number | No |  | See the parameters and returned values for search/jobs . |
| rt_queue_size | Number | No |  | See the parameters and returned values for search/jobs . |
| search_listener | String | No |  | See the parameters and returned values for search/jobs . |
| search_mode | Enum | No |  | See the parameters and returned values for search/jobs . |
| sync_bundle_replication | Bool | No |  | See the parameters and returned values for search/jobs . |
| time_format | String | No |  | See the parameters and returned values for search/jobs . |
| timeout | Number | No |  | See the parameters and returned values for search/jobs . |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | For non-streaming searches, previews of the final results are available if preview is enabled. If preview is not enabled, it is better to use search/jobs with exec_mode=oneshot. |
| *(notes)* | text | If it is too big, you might instead run with the search/jobs (not search/jobs/export) endpoint (it takes POST with the same parameters), maybe using the exec_mode=blocking. You'll then get back a search id, and then you can page through the results and request them from the server under your control, which is a better approach for extremely large result sets that need to be chunked. |
| *(notes)* | text | This is an example of running a saved search and passing a variable to it. In this case, the variable is host field: |
| *(notes)* | text | $curl -k -u admin:password https://splunkserver:8089/services/search/jobs/export -d search="savedsearch \ MySavedSearch%20host%3Dwolverine*" |
| *(notes)* | text | (use "MySavedSearch" and input variable host=wolverine* ) |
| *(notes)* | text | I have a saved search named "MySavedSearch" the query of the search contains: |
| *(notes)* | text | "index=main $host$ \| head 100" |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/export -d key=value
```



---

## `/services/search/v2/jobs/export`

Stream search results as they become available.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/v2/jobs/export` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/search/v2/jobs/export`

Performs a search identical to POST search/jobs. For parameter and returned value descriptions, see the POST parameter descriptions for search/jobs .

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| search | String | No |  | See the parameters and returned values for search/jobs . |
| auto_cancel | Number | No |  | See the parameters and returned values for search/jobs . |
| auto_finalize_ec | Number | No |  | See the parameters and returned values for search/jobs . |
| auto_pause | Number | No |  | See the parameters and returned values for search/jobs . |
| earliest_time | String | No |  | See the parameters and returned values for search/jobs . |
| enable_lookups | Bool | No |  | See the parameters and returned values for search/jobs . |
| force_bundle_replication | Bool | No |  | See the parameters and returned values for search/jobs . |
| id | String | No |  | See the parameters and returned values for search/jobs . |
| index_earliest | String | No |  | Specify a time string. Sets the earliest (inclusive), respectively, time bounds for the search, based on the index time. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. |
| index_latest | String | No |  | Specify a time string. Sets the latest (inclusive), respectively, time bounds for the search, based on the index time. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. Refer to Time modifiers for search for information and examples of specifying a time string. |
| latest_time | String | No |  | See the parameters and returned values for search/jobs . |
| max_time | Number | No |  | See the parameters and returned values for search/jobs . |
| namespace | String | No |  | See the parameters and returned values for search/jobs . |
| now | String | No |  | See the parameters and returned values for search/jobs . |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| reduce_freq | Number | No |  | See the parameters and returned values for search/jobs . |
| reload_macros | Bool | No |  | See the parameters and returned values for search/jobs . |
| remote_server_list | String | No |  | See the parameters and returned values for search/jobs . |
| required_field_list | String | No |  | See the parameters and returned values for search/jobs . |
| rf | String | No |  | See the parameters and returned values for search/jobs . |
| rt_blocking | Bool | No |  | See the parameters and returned values for search/jobs . |
| rt_indexfilter | Bool | No |  | See the parameters and returned values for search/jobs . |
| rt_maxblocksecs | Number | No |  | See the parameters and returned values for search/jobs . |
| rt_queue_size | Number | No |  | See the parameters and returned values for search/jobs . |
| search_listener | String | No |  | See the parameters and returned values for search/jobs . |
| search_mode | Enum | No |  | See the parameters and returned values for search/jobs . |
| sync_bundle_replication | Bool | No |  | See the parameters and returned values for search/jobs . |
| time_format | String | No |  | See the parameters and returned values for search/jobs . |
| timeout | Number | No |  | See the parameters and returned values for search/jobs . |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | For non-streaming searches, previews of the final results are available if preview is enabled. If preview is not enabled, use search/jobs with exec_mode=oneshot. |
| *(notes)* | text | If your search is too big, considering running it with the search/jobs endpoint, instead of the search/jobs/export endpoint, and using exec_mode=blocking. You'll then get back a search id, and then you can page through the results and request them from the server under your control. This is a better approach for extremely large result sets that need to be chunked. |
| *(notes)* | text | The following example runs a saved search and passes a variable to it. In this case, the variable is the host field: |
| *(notes)* | text | This request creates a saved search named "MySavedSearch" which contains the following result: |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/v2/jobs/export -d key=value
```



---

## `/services/search/jobs/{search_id}`

Manage the {search_id} search job.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}` |
| Auth required | Yes |
| Capability | `search` |

### DELETE `/services/search/jobs/{search_id}`

Delete the {search_id} search job.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |

#### Example

```
curl -k -u admin:pass --request DELETE https://localhost:8089/services/search/jobs/mysearch_02151949
```


### GET `/services/search/jobs/{search_id}`

Get information about the {search_id} search job.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | Information returned includes the search job properties, such as eventCount (number of events returned), runDuration (time the search took to complete), and others. The parameters to POST /search/jobs provides details on search job properties when creating a search. Search job properties are also described in View search job properties in the Search Manual . |
| *(notes)* | text | The dispatchState property is of particular interest to determine the state of a search, and can contain the following values: |
| *(notes)* | text | This operation also returns performance information for the search. For more information refer to View search job properties in the Search Manual . |
| *(notes)* | text | For more information on searches in Splunk, refer to the Splunk Search Reference. |
| *(notes)* | text | POST /search/jobs returns a <sid> for a search. You can also get a search ID from the <sid> field returned from GET search/jobs. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/mysearch_02151949
```


### POST `/services/search/jobs/{search_id}`

Update the {search_id} search job.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| custom.* | String | Yes |  | Specify custom job properties for the specified search job. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/{search_id} -d key=value
```



---

## `/services/search/jobs/{search_id}/control`

Run a job control command for the {search_id} search.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}/control` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/search/jobs/{search_id}/control`

Run a job control command for the {search_id} search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action | Enum | Yes |  | Valid values: (pause \| unpause \| finalize \| cancel \| touch \| setttl \| setpriority \| enablepreview \| disablepreview \| setworkloadpool) The control action to execute. pause: Suspends the execution of the current search. unpause: Resumes the execution of the current search, if paused. finalize: Stops the search, and provides intermediate results to the /results endpoint. cancel: Stops the current search and deletes the result cache. touch: Extends the expiration time of the search to now + ttl setttl: Change the ttl of the search. Arguments: ttl=<number> setpriority: Sets the priority of the search process. Arguments: priority=<0-10> enablepreview: Enable preview generation (may slow search considerably). disablepreview: Disable preview generation. setworkloadpool: Moves a running search to a new workload pool. Arguments: workload_pool=<string>. Specifies the new workload pool. Requires edit_workload_pools capability. save: saves the search job, storing search artifacts on disk for 7 days. Add or edit the default_save_ttl value in limits.conf to override the default value of 7 days. unsave: Disables any action performed by save. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | XML Response |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/mysearch_02151949/control -d action=pause
```



---

## `/services/search/jobs/{search_id}/events`

Get {search_id} search events.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}/events` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs/{search_id}/events`

Access {search_id} search events.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. Default value is 100 . |
| earliest_time | String | No |  | A time string representing the earliest (inclusive), respectively, time bounds for the results to be returned. If not specified, the range applies to all results found. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided, the union of the lists is used. |
| field_list | String | No | * | [Deprecated] Use f . A comma-separated list of the fields to return for the event set. |
| latest_time | String | No |  | A time string representing the latest (exclusive), respectively, time bounds for the results to be returned. If not specified, the range applies to all results found. |
| max_lines | Number | No | 0 | The maximum lines that any single event _raw field should contain. Specify 0 to specify no limit. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. In 4.1+, negative offsets are allowed and are added to count to compute the absolute offset (for example, offset=-1 is the last available offset. Offsets in the results are always absolute and never negative. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| output_time_format | String | No | time_format | Formats a UTC time. Defaults to what is specified in time_format . |
| search | String | No |  | The post processing search to apply to results. Can be any valid search language string. |
| segmentation | String | No | raw | The type of segmentation to perform on the data. This includes an option to perform k/v segmentation. |
| time_format | String | No | %m/%d/%Y:%H:%M:%S | Expression to convert a formatted time string from {start,end}_time into UTC seconds. |
| truncation_mode | Enum | No | abstract | Valid values: (abstract \| truncate) Specifies how "max_lines" should be achieved. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | This endpoint is only valid if the status_buckets > 0 or the search has no transforming commands. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/1312313809.20/events --get -d f=arch -d f=build -d f=connectionType -d r -d count=3
```



---

## `/services/search/jobs/{search_id}/results`

Get {search_id} search results.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}/results` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs/{search_id}/results`

Get {search_id} search results.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| add_summary_to_metadata | Boolean | No | false | Set the value to "true" to include field summary statistics in the response. |
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided the union of the lists is used. |
| field_list | String | No |  | [Deprecated] Use f . Specify a comma-separated list of the fields to return for the event set. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. In 4.1+, negative offsets are allowed and are added to count to compute the absolute offset (for example, offset=-1 is the last available offset). Offsets in the results are always absolute and never negative. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| search | String | No |  | The post processing search to apply to results. Can be any valid search language string. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | This is the primary method for a client to fetch a set of TRANSFORMED events. If the dispatched search does not include a transforming command, the effect is the same as get_events, however with fewer options. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/mysearch_02151949/results --get -d f=index -d f=source -d f=sourcetype -d count=3 -d output_mode=json
```



---

## `/services/search/jobs/{search_id}/results_preview`

Preview {search_id} search results.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}/results_preview` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs/{search_id}/results_preview`

Preview {search_id} search results.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| add_summary_to_metadata | Boolean | No | false | Set the value to "true" to include field summary statistics in the response. |
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided the union of the lists is used. |
| field_list | String | No |  | [Deprecated] Use f . A comma-separated list of the fields to return for the event set. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| search | String | No |  | The post processing search to apply to results. Can be any valid search language string. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | JSON request |
| *(notes)* | text | JSON response |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/mysearch_02151949/results_preview --get -d f=index -d f=source -d f=sourcetype -d count=3 -d output_mode=json
```



---

## `/services/search/jobs/{search_id}/search.log`

Get the {search_id} search log.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}/search.log` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs/{search_id}/search.log`

Get the {search_id} search log.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| attachment | Boolean | No | false | If true, returns search.log as an attachment. Otherwise, streams search.log. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/mysearch_02151949/search.log
```



---

## `/services/search/jobs/{search_id}/summary`

Get the getFieldsAndStats output of the events to-date, for the search_id search.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}/summary` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs/{search_id}/summary`

Get the getFieldsAndStats output of the events to-date, for the search_id search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| earliest_time | String | No |  | Time string representing the earliest (inclusive), respectively, time bounds for the search. The time string can be either a UTC time (with fractional seconds), a relative time specifier (to now) or a formatted time string. (Also see comment for the search_mode variable.) |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided, the union of the lists is used. |
| field_list | String | No |  | [Deprecated] Use f . A comma-separated list of the fields to return for the event set. |
| histogram | Boolean | No | false | Indicates whether to add histogram data to the summary output. |
| latest_time | String | No |  | Time string representing the latest (exclusive), respectively, time bounds for the search. |
| min_freq | Number | No | 0 | For each key, the fraction of results this key must occur in to be displayed. Express the fraction as a number between 0 and 1. |
| output_time_format | String | No | time_format | Formats a UTC time. |
| search | String | No | Empty string | Specifies a substring that all returned events should contain either in one of their values or tags. |
| time_format | String | No | %m/%d/%Y:%H:%M:%S | Expression to convert a formatted time string from {start,end}_time into UTC seconds. |
| top_count | Number | No | 10 | For each key, specifies how many of the most frequent items to return. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/mytestsid/summary --get -d f=source -d f=sourcetype -d f=host -d top_count=5
```



---

## `/services/search/jobs/{search_id}/timeline`

Get event distribution over time of the untransformed events read to-date, for the search_id search.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/jobs/{search_id}/timeline` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/jobs/{search_id}/timeline`

Get event distribution over time of the untransformed events read to-date, for the search_id search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| output_time_format | String | No | time_format | Formats a UTC time. |
| time_format | String | No | %m/%d/%Y:%H:%M:%S | Expression to convert a formatted time string from {start,end}_time into UTC seconds. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| c | varies | Event count |
| a | varies | Available. Not all events in a bucket are retrievable. Generally capped at 10000. |
| t | varies | Time in epoch seconds |
| d | varies | Bucket size (time) |
| f | varies | Indicates if the search finished scanning events from the time range of this bucket. |
| etz | varies | Timezone offset, in seconds, for the earliest time of this bucket. etz and ltz are different if the buckets are months or days and you have a DST change during the middle. |
| ltz | varies | Timezone offset, in seconds, for the latest time of this bucket. |
| *(notes)* | text | The output from this endpoint provides values for the following fields: |
| *(notes)* | text | Application usage |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/jobs/mytestsid/timeline --get -d time_format="%c"
```



---

## `/services/search/v2/jobs/{search_id}/events`

Access {search_id} search events.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/v2/jobs/{search_id}/events` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/v2/jobs/{search_id}/events`

Get {search_id} search events.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. Default value is 100 . |
| earliest_time | String | No |  | A time string representing the earliest (inclusive), respectively, time bounds for the results to be returned. If not specified, the range applies to all results found. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided, the union of the lists is used. |
| field_list | String | No | * | [Deprecated] Use f . A comma-separated list of the fields to return for the event set. |
| latest_time | String | No |  | A time string representing the latest (exclusive), respectively, time bounds for the results to be returned. If not specified, the range applies to all results found. |
| max_lines | Number | No | 0 | The maximum lines that any single event _raw field should contain. Specify 0 to specify no limit. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. In 4.1+, negative offsets are allowed and are added to count to compute the absolute offset (for example, offset=-1 is the last available offset. Offsets in the results are always absolute and never negative. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| output_time_format | String | No | time_format | Formats a UTC time. Defaults to what is specified in time_format . |
| segmentation | String | No | raw | The type of segmentation to perform on the data. This includes an option to perform k/v segmentation. |
| time_format | String | No | %m/%d/%Y:%H:%M:%S | Expression to convert a formatted time string from {start,end}_time into UTC seconds. |
| truncation_mode | Enum | No | abstract | Valid values: (abstract \| truncate) Specifies how "max_lines" should be achieved. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | This endpoint is only valid if the status_buckets > 0 or the search has no transforming commands. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/v2/jobs/1312313809.20/events --get -d f=arch -d f=build -d f=connectionType -d r -d count=3
```


### POST `/services/search/v2/jobs/{search_id}/events`

Access {search_id} search events.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. Default value is 100 . |
| earliest_time | String | No |  | A time string representing the earliest (inclusive), respectively, time bounds for the results to be returned. If not specified, the range applies to all results found. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided, the union of the lists is used. |
| field_list | String | No | * | [Deprecated] Use f . A comma-separated list of the fields to return for the event set. |
| latest_time | String | No |  | A time string representing the latest (exclusive), respectively, time bounds for the results to be returned. If not specified, the range applies to all results found. |
| max_lines | Number | No | 0 | The maximum lines that any single event _raw field should contain. Specify 0 to specify no limit. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. In 4.1+, negative offsets are allowed and are added to count to compute the absolute offset (for example, offset=-1 is the last available offset. Offsets in the results are always absolute and never negative. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| output_time_format | String | No | time_format | Formats a UTC time. Defaults to what is specified in time_format . |
| search | String | No |  | The post processing search to apply to results. Can be any valid search language string. Only usable from POST operations. |
| segmentation | String | No | raw | The type of segmentation to perform on the data. This includes an option to perform k/v segmentation. |
| time_format | String | No | %m/%d/%Y:%H:%M:%S | Expression to convert a formatted time string from {start,end}_time into UTC seconds. |
| truncation_mode | Enum | No | abstract | Valid values: (abstract \| truncate) Specifies how "max_lines" should be achieved. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | This endpoint is only valid if the status_buckets > 0 or the search has no transforming commands. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/v2/jobs/1312313809.20/events --get -d f=arch -d f=build -d f=connectionType -d r -d count=3
```



---

## `/services/search/v2/jobs/{search_id}/results`

Access {search_id} search results.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/v2/jobs/{search_id}/results` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/v2/jobs/{search_id}/results`

Get {search_id} search results.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| add_summary_to_metadata | Boolean | No | false | Set the value to "true" to include field summary statistics in the response. |
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided the union of the lists is used. |
| field_list | String | No |  | [Deprecated] Use f . Specify a comma-separated list of the fields to return for the event set. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. In 4.1+, negative offsets are allowed and are added to count to compute the absolute offset (for example, offset=-1 is the last available offset). Offsets in the results are always absolute and never negative. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | This is the primary method for a client to fetch a set of TRANSFORMED events. If the dispatched search does not include a transforming command, the effect is the same as get_events, however with fewer options. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/v2/jobs/mysearch_02151949/results --get -d f=index -d f=source -d f=sourcetype -d count=3 -d output_mode=json
```


### POST `/services/search/v2/jobs/{search_id}/results`

Access {search_id} search results.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| add_summary_to_metadata | Boolean | No | false | Set the value to "true" to include field summary statistics in the response. |
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided the union of the lists is used. |
| field_list | String | No |  | [Deprecated] Use f . Specify a comma-separated list of the fields to return for the event set. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. In 4.1+, negative offsets are allowed and are added to count to compute the absolute offset (for example, offset=-1 is the last available offset). Offsets in the results are always absolute and never negative. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| search | String | No |  | The post processing search to apply to results. Can be any valid search language string. Only usable from POST operations. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | This is the primary method for a client to fetch a set of TRANSFORMED events. If the dispatched search does not include a transforming command, the effect is the same as get_events, however with fewer options. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/v2/jobs/mysearch_02151949/results -d f=index -d f=source -d f=sourcetype -d count=3 -d output_mode=json
```



---

## `/services/search/v2/jobs/{search_id}/results_preview`

Preview {search_id} search results.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/v2/jobs/{search_id}/results_preview` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/v2/jobs/{search_id}/results_preview`

Preview {search_id} search results.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| add_summary_to_metadata | Boolean | No | false | Set the value to "true" to include field summary statistics in the response. |
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided the union of the lists is used. |
| field_list | String | No |  | [Deprecated] Use f . A comma-separated list of the fields to return for the event set. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | JSON request |
| *(notes)* | text | JSON response |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/v2/jobs/mysearch_02151949/results_preview --get -d f=index -d f=source -d f=sourcetype -d count=3 -d output_mode=json
```


### POST `/services/search/v2/jobs/{search_id}/results_preview`

Access a preview of {search_id} search results.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| add_summary_to_metadata | Boolean | No | false | Set the value to "true" to include field summary statistics in the response. |
| count | Number | No | 100 | The maximum number of results to return. If value is set to 0 , then all available results are returned. |
| f | String | No |  | A field to return for the event set. You can pass multiple POST f arguments if multiple field are required. If field_list and f are provided the union of the lists is used. |
| field_list | String | No |  | [Deprecated] Use f . A comma-separated list of the fields to return for the event set. |
| offset | Number | No | 0 | The first result (inclusive) from which to begin returning data. This value is 0-indexed. Default value is 0. |
| output_mode | Enum | No | xml | Valid values: (atom \| csv \| json \| json_cols \| json_rows \| raw \| xml) Specifies the format for the returned output. |
| search | String | No |  | The post processing search to apply to results. Can be any valid search language string. Only usable from POST operations. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |
| *(notes)* | text | JSON request |
| *(notes)* | text | JSON response |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/v2/jobs/mysearch_02151949/results_preview --get -d f=index -d f=source -d f=sourcetype -d count=3 -d output_mode=json
```



---
