# Saved searches

Manage saved searches and operational endpoints such as dispatch, history, and suppression.

## `/services/saved/searches`

Access and create saved searches.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches` |
| Auth required | Yes |
| Capability | `edit_search_schedule_window` |

### GET `/services/saved/searches`

Access saved search configurations.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| earliest_time | String | No |  | For scheduled searches display all the scheduled times starting from this time (not just the next run time) |
| latest_time | String | No |  | For scheduled searches display all the scheduled times until this time (not just the next run time) |
| listDefaultActionArgs | Boolean | No |  | Indicates whether to list default actions. |
| add_orphan_field | Boolean | No |  | Indicates whether the response includes a boolean value for each saved search to show whether the search is orphaned, meaning that it has no valid owner. When add_orphan_field is set to true , the response includes the orphaned search indicators, either 0 to indicate that a search is not orphaned or 1 to indicate that the search is orphaned. Admins can use this setting to check for searches without valid owners and resolve related issues. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.<action_name> | varies | Indicates whether the <action_name> is enabled or disabled for a particular search. For more information about the alert action options see the alert_actions.conf file. |
| action.<action_name>.<parameter> | varies | Overrides the setting defined for an action in the alert_actions.conf file with a new setting that is valid only for the search configuration to which it is applied. |
| action.email | varies | Indicates the state of the email action. |
| action.email.auth_password | varies | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here that is encrypted on the next restart. Defaults to empty string. |
| action.email.auth_username | varies | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |
| action.email.bcc | varies | BCC email address to use if action.email is enabled. |
| action.email.cc | varies | CC email address to use if action.email is enabled. |
| action.email.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.email.format | varies | Specify the format of text in the email. This value also applies to any attachments. Valid values: (plain \| html \| raw \| csv) |
| action.email.from | varies | Email address from which the email action originates. |
| action.email.hostname | varies | Sets the hostname used in the web link (url) sent in email actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) When this value is a simple hostname, the protocol and port which are configured within splunk are used to construct the base of the url. When this value begins with ' http://' , it is used verbatim. Note: This means the correct port must be specified if it is not the default port for http or https. This is useful in cases when the Splunk server is not aware of how to construct a url that can be referenced externally, such as SSO environments, other proxies, or when the server hostname is not generally resolvable. Defaults to current hostname provided by the operating system, or if that fails "localhost." When set to empty, default behavior is used. |
| action.email.inline | varies | Indicates whether the search results are contained in the body of the email. Results can be either inline or attached to an email. See action.email.sendresults. |
| action.email.mailserver | varies | Set the address of the MTA server to be used to send the emails. Defaults to <LOCALHOST> (or whatever is set in alert_actions.conf). |
| action.email.maxresults | varies | Sets the global maximum number of search results to send when email.action is enabled. |
| action.email.maxtime | varies | Specifies the maximum amount of time the execution of an email action takes before the action is aborted. |
| action.email.preprocess_results | varies | Search string to preprocess results before emailing them. Defaults to empty string (no preprocessing). Usually the preprocessing consists of filtering out unwanted internal fields. |
| action.email.reportPaperOrientation | varies | Specifies the paper orientation: portrait or landscape. |
| action.email.reportPaperSize | varies | Specifies the paper size for PDFs. Defaults to letter. Valid values: (letter \| legal \| ledger \| a2 \| a3 \| a4 \| a5) |
| action.email.reportServerEnabled | varies | Not supported. |
| action.email.reportServerURL | varies | Not supported. |
| action.email.sendpdf | varies | Indicates whether to create and send the results as a PDF. |
| action.email.sendresults | varies | Indicates whether to attach the search results in the email. Results can be either attached or inline. See action.email.inline. |
| action.email.subject | varies | Specifies an email subject. Defaults to SplunkAlert-<savedsearchname>. |
| action.email.to | varies | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |
| action.email.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.email.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |
| action.email.use_ssl | varies | Indicates whether to use SSL when communicating with the SMTP server. |
| action.email.use_tls | varies | Indicates whether to use TLS (transport layer security) when communicating with the SMTP server (starttls). |
| action.populate_lookup | varies | The state of the populate lookup action. |
| action.populate_lookup.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.populate_lookup.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.populate_lookup.maxresults | varies | The maximum number of search results sent using alerts. |
| action.populate_lookup.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. Valid values are: Integer[m\|s\|h\|d] |
| action.populate_lookup.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.populate_lookup.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, then this specifies the number of scheduled periods. Defaults to 10p. If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p] |
| action.rss | varies | The state of the RSS action. |
| action.rss.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.rss.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. |
| action.rss.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.rss.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 1m. |
| action.rss.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.rss.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| action.script | varies | The state of the script action. |
| action.script.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.script.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.script.maxresults | varies | The maximum number of search results sent using alerts. |
| action.script.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. |
| action.script.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.script.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 600 (10 minutes). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| action.summary_index | varies | Specifies whether the summary index action is enabled for this search. |
| action.summary_index._type" | varies | Specifies the data type of the summary index where the Splunk software saves the results of the scheduled search. Can be set to event or metric . |
| action.summary_index.force_realtime_schedule | varies | By default, realtime_schedule is false for a report configured for summary indexing. When set to 1 or true , this setting overrides realtime_schedule . Setting this setting to true can cause gaps in summary data, as a realtime_schedule search is skipped if search concurrency limits are violated. |
| action.summary_index.inline | varies | Determines whether to execute the summary indexing action as part of the scheduled search. Note: This option is considered only if the summary index action is enabled and is always executed (in other words, if counttype = always). |
| action.summary_index.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.summary_index.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. |
| action.summary_index.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.summary_index.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 10p. |
| alert.digest_mode | varies | Indicates if alert actions are applied to the entire result set or to each individual result. |
| alert.expires | varies | Sets the period of time to show the alert in the dashboard. Defaults to 24h. Uses [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.managedBy | varies | Specifies the feature or component that created the alert. |
| alert.severity | varies | The alert severity level. Valid values are: 1 DEBUG 2 INFO 3 WARN 4 ERROR 5 SEVERE 6 FATAL |
| alert.suppress | varies | Indicates whether alert suppression is enabled for this scheduled search. |
| alert.suppress.fields | varies | List of fields to use when suppressing per-result alerts. Must be specified if the digest mode is disabled and suppression is enabled. |
| alert.suppress.group_name | varies | Optional setting. Used to define an alert suppression group for a set of alerts that are running over identical or very similar datasets. Alert suppression groups can help you avoid getting multiple triggered alert notifications for the same data. |
| alert.suppress.period | varies | Specifies the suppression period. Only valid if alert.suppress is enabled. Uses [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.track | varies | Specifies whether to track the actions triggered by this scheduled search. auto - (Default) Determine whether to apply alert tracking to this search, based on the tracking setting of each action. Do not track scheduled searches that always trigger actions. true - Force alert tracking for this search. Default. false - Disable alert tracking for this search. |
| alert_comparator | varies | One of the following strings: greater than less than equal to rises by drops by rises by perc drops by perc Used with alert_threshold to trigger alert actions. |
| alert_condition | varies | A conditional search that is evaluated against the results of the saved search. Defaults to an empty string. Alerts are triggered if the specified search yields a non-empty search result list. Note: If you specify an alert_condition , do not set counttype, relation, or quantity. |
| alert_threshold | varies | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator ) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to rises by perc" or "drops by perc." |
| alert_type | varies | What to base the alert on, overridden by alert_condition if it is specified. Valid values are: always, custom, number of events, number of hosts, number of sources. |
| allow_skew | varies | Allows the search scheduler to distribute scheduled searches randomly and more evenly over their specified search periods. CAUTION: This setting does not require adjusting in most use cases. Check with an admin before making any updates. When set to a non-zero value for searches with the following cron_schedule values, the search scheduler randomly skews the second, minute, and hour on which the search runs. CODE Copy * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). When set to a non-zero value for a search that has any other cron_schedule setting, the search scheduler can randomly skew only the second on which the search runs. The amount of skew for a specific search remains constant between edits of the search. A value of 0 disallows skew. 0 is the default setting. Percentage <int> followed by % specifies the maximum amount of time to skew as a percentage of the scheduled search period. Duration <int><unit> specifies a maximum duration. The <unit> can be omitted only when the <int> is 0 . Valid duration units: m min minute mins minutes h hr hour hrs hours d day days Examples CODE Copy 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum |
| auto_summarize | varies | Specifies whether the search scheduler should ensure that the data for this search is automatically summarized. |
| auto_summarize.command | varies | A search template to use to construct the auto-summarization for the search. Do not change. |
| auto_summarize.cron_schedule | varies | Cron schedule to use to probe or generate the summaries for this search |
| auto_summarize.dispatch.<arg-name> | varies | Dispatch options that can be overridden when running the summary search. |
| auto_summarize.max_concurrent | varies | The maximum number of concurrent instances of this auto summarizing search that the scheduler is allowed to run. |
| auto_summarize.max_disabled_buckets | varies | The maximum number of buckets with suspended summarization before the summarization search is completely stopped and the summarization of the search is suspended for the value specified by the auto_summarize.suspend_period setting. |
| auto_summarize.max_summary_ratio | varies | The maximum ratio of summary_size/bucket_size, which specifies when to stop summarization and deem it unhelpful for a bucket. |
| auto_summarize.max_summary_size | varies | The minimum summary size, in bytes, before testing whether the summarization is helpful. |
| auto_summarize.max_time | varies | The maximum time, in seconds, that the auto-summarization search is allowed to run. |
| auto_summarize.suspend_period | varies | The amount of time to suspend summarization of the search if the summarization is deemed unhelpful. |
| auto_summarize.timespan | varies | Comma-delimited list of time ranges that each summarized chunk should span. Comprises the list of available summary ranges for which summaries would be available. Does not support 1w timespans. |
| auto_summarize.workload_pool | varies | Sets the name of the workload pool that is used by the auto-summarization of this search. |
| cron_schedule | varies | The cron schedule to run this search. For more information, refer to the description of this parameter in the POST endpoint. |
| defer_scheduled_searchable_idxc | varies | Specifies whether to defer a continuous saved search during a searchable rolling restart or searchable rolling upgrade of an indexer cluster. |
| description | varies | Human-readable description of this saved search. |
| disabled | varies | Indicates whether this saved search is disabled. |
| dispatch.allow_partial_results | varies | Specifies whether the search job can proceed to provide partial results if a search peer fails. When set to false, the search job fails if a search peer providing results for the search job fails. |
| dispatch.auto_cancel | varies | Specifies the amount of inactive time, in seconds, after which the search job is automatically canceled. |
| dispatch.auto_pause | varies | Specifies the amount of inactive time, in seconds, after which the search job is automatically paused. |
| dispatch.buckets | varies | The maximum number of timeline buckets. |
| dispatch.earliest_time | varies | A time string that specifies the earliest time for this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.index_earliest | varies | Specifies the earliest index time for this search. Can be a relative or absolute time. |
| dispatch.index_latest | varies | Specifies the latest index time for this saved search. Can be a relative or absolute time. |
| dispatch.indexedRealtime | varies | Specifies whether to use 'indexed-realtime' mode when doing real-time searches. |
| dispatch.indexedRealtimeMinSpan | varies | Specifies the minimum number of seconds to wait between component index searches. |
| dispatch.indexedRealtimeOffset | varies | Specifies the number of seconds to wait for disk flushes to finish. |
| dispatch.indexedRealtimeMinSpan | varies | Allows for a per-job override of the [search] indexed_realtime_default_span setting in limits.conf . The default for saved searches is "unset", falling back to the limits.conf setting. |
| dispatch.latest_time | varies | A time string that specifies the latest time for the saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.lookups | varies | Indicates if lookups are enabled for this search. |
| dispatch.max_count | varies | The maximum number of results before finalizing the search. |
| dispatch.max_time | varies | Indicates the maximum amount of time (in seconds) before finalizing the search. |
| dispatch.reduce_freq | varies | Specifies how frequently the MapReduce reduce phase runs on accumulated map values. |
| dispatch.rt_backfill | varies | Specifies whether to do real-time window backfilling for scheduled real-time searches. |
| dispatch.rt_maximum_span | varies | Sets the maximum number of seconds to search data that falls behind real time. |
| dispatch.sample_ratio | varies | The integer value used to calculate the sample ratio. The formula is 1 / <integer> . |
| dispatch.spawn_process | varies | This parameter is deprecated and will be removed in a future release. Do not use this parameter. Specifies whether new search process is spawned when this saved search is executed. Searches against indexes must run in a separate process. |
| dispatch.time_format | varies | Time format string that defines the time format for specifying the earliest and latest time. |
| dispatch.ttl | varies | Indicates the time to live (ttl), in seconds, for the artifacts of the scheduled search, if no actions are triggered. |
| dispatchAs | varies | When the saved search is dispatched using the "saved/searches/{name}/dispatch" endpoint, this setting controls what user that search is dispatched as. Only meaningful for shared saved searches. Can be set to owner or user . |
| displayview | varies | Defines the default UI view name (not label) in which to load the results. Accessibility is subject to the user having sufficient permissions. |
| durable.backfill_type | varies | Specifies how the Splunk software backfills the lost search results of failed scheduled search jobs. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . Valid values are auto , time_interval , and time_whole . |
| durable.lag_time | varies | Specifies the search time delay, in seconds, that a durable search uses to catch events that are ingested or indexed late. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.max_backfill_intervals | varies | Specifies the maximum number of cron intervals (previous scheduled search jobs) that the Splunk software can attempt to backfill for this search, when those jobs have incomplete events. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.track_time_type | varies | Indicates that a scheduled search is durable and specifies how the search tracks events. A value of _time means the durable search tracks each event by its event timestamp , based on time information included in the event. A value of _indextime means the durable search tracks each event by its indexed timestamp. The search is not durable if this setting is unset or is set to none . |
| earliest_time | varies | For scheduled searches display all the scheduled times starting from this time (not just the next run time). |
| is_scheduled | varies | Indicates if this search is to be run on a schedule |
| is_visible | varies | Indicates if this saved search appears in the visible saved search list. |
| latest_time | varies | For scheduled searches display all the scheduled times until this time (not just the next run time). |
| listDefaultActionArgs | varies | List default values of actions.* , even though some of the actions may not be specified in the saved search. |
| max_concurrent | varies | The maximum number of concurrent instances of this search the scheduler is allowed to run. |
| next_scheduled_time | varies | Time when the scheduler runs this search again. |
| orphan | varies | If add_orphan_field has been specified in the GET request, indicates whether the search is orphaned. |
| qualifiedSearch | varies | The exact search string that the scheduler would run. |
| realtime_schedule | varies | Controls the way the scheduler computes the next execution time of a scheduled search. If this value is set to 1, the scheduler bases its determination of the next scheduled search execution time on the current time. If this value is set to 0, the scheduler bases its determination of the next scheduled search on the last search execution time. This is called continuous scheduling. See the POST parameter for this attribute for details. |
| request.ui_dispatch_app | varies | A field used by Splunk Web to denote the app this search should be dispatched in. |
| request.ui_dispatch_view | varies | Specifies a field used by Splunk Web to denote the view this search should be displayed in. |
| restart_on_searchpeer_add | varies | Specifies whether to restart a real-time search managed by the scheduler when a search peer becomes available for this saved search. Note: The peer can be a newly added peer or a peer down and now available. |
| run_n_times | varies | Runs this search exactly the specified number of times. Does not run the search again until the Splunk platform is restarted. |
| run_on_startup | varies | Indicates whether this search runs on startup. If it does not run on startup, it runs at the next scheduled time. Defaults to 0. This parameter should be set to 1 for scheduled searches that populate lookup tables. |
| schedule_priority | varies | Indicates the scheduling priority of a specific search. One of the following values. CODE Copy [ default \| higher \| highest ] [ default \| higher \| highest ] default No scheduling priority increase. higher Scheduling priority is higher than other searches of the same scheduling tier. While there are four tiers of priority for scheduled searches, only the following are affected by this property: CODE Copy * real-Time-Scheduled (realtime_schedule=1). * continuous-Scheduled (realtime_schedule=0). * real-Time-Scheduled (realtime_schedule=1). * continuous-Scheduled (realtime_schedule=0). highest Scheduling priority is higher than other searches regardless of scheduling tier. However, real-time-scheduled searches with priority = highest always have priority over continuous scheduled searches with priority = highest . This is the high-to-low priority order (where RTSS = real-time-scheduled search, CSS = continuous-scheduled search, d = default, h = higher, H = highest). CODE Copy RTSS(H) > CSS(H) > RTSS(h) > RTSS(d) > CSS(h) > CSS(d) RTSS(H) > CSS(H) > RTSS(h) > RTSS(d) > CSS(h) > CSS(d) Changing the priority requires the search owner to have the edit_search_schedule_priority capability in order to make non-default settings. Defaults to default . For more details, see savedsearches.conf.spec . |
| schedule_window | varies | Time window (in minutes) during which the search has lower priority. The scheduler can give higher priority to more critical searches during this window. The window must be smaller than the search period. If set to auto , the scheduler prioritizes searches automatically. |
| search | varies | Search expression to filter the response. The response matches field values against the search expression. For example: search=foo matches any object that has "foo" as a substring in a field. search=field_name%3Dfield_value restricts the match to a single field. URI-encoding is required in this example. |
| vsid | varies | The viewstate id associated with the UI view listed in 'displayview'. Must match up to a stanza in viewstates.conf. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/saved/searches
```


### POST `/services/saved/searches`

Create a saved search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action.<action_name> | Boolean | See docs | — | Enable or disable an alert action. See alert_actions.conf for available alert action types. action_name defaults to an empty string. |
| action.<action_name>.<parameter> |  | See docs | — | Use this syntax to configure action parameters. See alert_actions.conf for parameter options. |
| action.summary_index._type" | String | See docs | — | Specifies the data type of the summary index where the Splunk software saves the results of the scheduled search. Can be set to event or metric . |
| action.summary_index.force_realtime_schedule | Boolean | See docs | — | By default, realtime_schedule is false for a report configured for summary indexing. When set to 1 or True , this setting overrides realtime_schedule . Setting this setting to true can cause gaps in summary data, as a realtime_schedule search is skipped if search concurrency limits are violated. |
| actions | String | See docs | — | A comma-separated list of actions to enable. For example: rss,email |
| alert.digest_mode | Boolean | See docs | — | Specifies whether alert actions are applied to the entire result set or on each individual result. Defaults to 1. |
| alert.expires | Number | See docs | — | Valid values: [number][time-unit] Sets the period of time to show the alert in the dashboard. Defaults to 24h. Use [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.severity | Enum | See docs | — | Valid values: (1 \| 2 \| 3 \| 4 \| 5 \| 6) Sets the alert severity level. Valid values are: 1 DEBUG 2 INFO 3 WARN (default) 4 ERROR 5 SEVERE 6 FATAL |
| alert.suppress | Boolean | See docs | — | Indicates whether alert suppression is enabled for this scheduled search. |
| alert.suppress.fields | String | See docs | — | Comma delimited list of fields to use for suppression when doing per result alerting. Required if suppression is turned on and per result alerting is enabled. |
| alert.suppress.group_name | String | See docs | — | Optional setting. Used to define an alert suppression group for a set of alerts that are running over identical or very similar datasets. Alert suppression groups can help you avoid getting multiple triggered alert notifications for the same data. |
| alert.suppress.period | Number | See docs | — | Valid values: [number][time-unit] Specifies the suppression period. Only valid if alert.suppress is enabled. Use [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.track | String | See docs | — | Valid values: (true \| false \| auto) Specifies whether to track the actions triggered by this scheduled search. auto - Determine whether to apply alert tracking to this search, based on the tracking setting of each action. Do not track scheduled searches that always trigger actions. Default. true - Force alert tracking for this search. false - Disable alert tracking for this search. |
| alert_comparator | String | See docs | — | One of the following strings: greater than, less than, equal to, rises by, drops by, rises by perc, drops by perc. Used with alert_threshold to trigger alert actions. |
| alert_condition | String | See docs | — | Contains a conditional search that is evaluated against the results of the saved search. Defaults to an empty string. Alerts are triggered if the specified search yields a non-empty search result list. Note: If you specify an alert_condition, do not set counttype, relation, or quantity. |
| alert_threshold | Number | See docs | — | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator ) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to "rises by perc" or "drops by perc." |
| alert_type | String | See docs | — | What to base the alert on, overridden by alert_condition if it is specified. Valid values are: always, custom, number of events, number of hosts, number of sources. |
| allow_skew | 0 \| <percentage> \| <duration> | See docs | — | Allows the search scheduler to distribute scheduled searches randomly and more evenly over their specified search periods. Defaults to 0 (skew disabled). CAUTION: This setting does not require adjusting in most use cases. Check with an admin before making any updates. When set to a non-zero value for searches with the following cron_schedule' values, the search scheduler randomly skews the second, minute, and hour on which the search runs. CODE Copy * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). When set to a non-zero value for a search that has any other cron_schedule setting, the search scheduler can randomly skew only the second on which the search runs. The amount of skew for a specific search remains constant between edits of the search. A value of 0 disallows skew. 0 is the default setting. Percentage <int> followed by % specifies the maximum amount of time to skew as a percentage of the scheduled search period. Duration <int><unit> specifies a maximum duration. The <unit> can be omitted only when the <int> is 0 . Valid duration units: m min minute mins minutes h hr hour hrs hours d day days Examples CODE Copy 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum |
| args.* | String | See docs | — | Wildcard argument that accepts any saved search template argument, such as args.username=foobar when the search is search $username$. |
| auto_summarize | Boolean | See docs | — | Indicates whether the scheduler should ensure that the data for this search is automatically summarized. Defaults to 0. |
| auto_summarize.command | String | See docs | — | An auto summarization template for this search. See auto summarization options in savedsearches.conf for more details. Do not change unless you understand the architecture of saved search auto summarization. |
| auto_summarize.cron_schedule | String | See docs | — | Cron schedule that probes and generates the summaries for this saved search. The default value, */10 * * * * , corresponds to "every ten hours". |
| auto_summarize.dispatch.earliest_time | String | See docs | — | A time string that specifies the earliest time for summarizing this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| auto_summarize.dispatch.latest_time | String | See docs | — | A time string that specifies the latest time for summarizing this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| auto_summarize.dispatch.time_format | String | See docs | — | Defines the time format used to specify the earliest and latest time. Defaults to %FT%T.%Q%:z |
| auto_summarize.dispatch.ttl | String | See docs | — | Valid values: Integer[p] Indicates the time to live (ttl), in seconds, for the artifacts of the summarization of the scheduled search. Defaults to 60. |
| auto_summarize.max_concurrent | Number | See docs | — | The maximum number of concurrent instances of this auto summarizing search that the scheduler is allowed to run. |
| auto_summarize.max_disabled_buckets | Number | See docs | — | The maximum number of buckets with the suspended summarization before the summarization search is completely stopped, and the summarization of the search is suspended for auto_summarize.suspend_period. Defaults to 2. |
| auto_summarize.max_summary_ratio | Number | See docs | — | The maximum ratio of summary_size/bucket_size, which specifies when to stop summarization and deem it unhelpful for a bucket. Defaults to 0.1. Note: The test is only performed if the summary size is larger than auto_summarize.max_summary_size. |
| auto_summarize.max_summary_size | Number | See docs | — | The minimum summary size, in bytes, before testing whether the summarization is helpful. The default value, 52428800 , is equivalent to 5MB. |
| auto_summarize.max_time | Number | See docs | — | The maximum time, in seconds, that the summary search is allowed to run. Defaults to 3600. Note: This is an approximate time. The summary search stops at clean bucket boundaries. |
| auto_summarize.suspend_period | String | See docs | — | The amount of time to suspend summarization of this search if the summarization is deemed unhelpful. Defaults to 24h. |
| auto_summarize.timespan | String | See docs | — | Comma-delimited list of time ranges that each summarized chunk should span. Comprises the list of available granularity levels for which summaries would be available. Does not support 1w timespans. For example, a timechart over the last month whose granularity is at the day level should set this to 1d . If you need the same data summarized at the hour level for weekly charts, use: 1h,1d . |
| cron_schedule | String | See docs | — | Valid values: cron string The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * * , which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. To reduce system load, schedule your searches so that they are staggered over time. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. |
| description | String | See docs | — | Human-readable description of this saved search. Defaults to empty string. |
| disabled | Boolean | See docs | — | Indicates whether the saved search is enabled. Defaults to 0. Disabled saved searches are not visible in Splunk Web. |
| dispatch.* | String | See docs | — | Wildcard argument that accepts any dispatch related argument. |
| dispatch.allow_partial_results | Boolean | See docs | — | Specifies whether the search job can proceed to provide partial results if a search peer fails. When set to false, the search job fails if a search peer providing results for the search job fails. |
| dispatch.auto_cancel | Number | See docs | — | Specifies the amount of inactive time, in seconds, after which the search job is automatically canceled. |
| dispatch.auto_pause | Number | See docs | — | Specifies the amount of inactive time, in seconds, after which the search job is automatically paused. |
| dispatch.buckets | Number | See docs | — | The maximum number of timeline buckets. Defaults to 0. |
| dispatch.earliest_time | String | See docs | — | A time string that specifies the earliest time for this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.index_earliest | String | See docs | — | A time string that specifies the earliest index time for this search. Can be a relative or absolute time. |
| dispatch.index_latest | String | See docs | — | A time string that specifies the latest index time for this saved search. Can be a relative or absolute time. |
| dispatch.indexedRealtime | Boolean | See docs | — | Indicates whether to used indexed-realtime mode when doing real-time searches. |
| dispatch.indexedRealtimeOffset | Number | See docs | — | Allows for a per-job override of the [search] indexed_realtime_disk_sync_delay setting in limits.conf . Default for saved searches is "unset", falling back to limits.conf setting. |
| dispatch.indexedRealtimeMinSpan | Number | See docs | — | Allows for a per-job override of the [search] indexed_realtime_default_span setting in limits.conf . Default for saved searches is "unset", falling back to the limits.conf setting. |
| dispatch.latest_time | String | See docs | — | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.lookups | Boolean | See docs | — | Enables or disables the lookups for this search. Defaults to 1. |
| dispatch.max_count | Number | See docs | — | The maximum number of results before finalizing the search. Defaults to 500000. |
| dispatch.max_time | Number | See docs | — | Indicates the maximum amount of time (in seconds) before finalizing the search. Defaults to 0. |
| dispatch.reduce_freq | Number | See docs | — | Specifies, in seconds, how frequently the MapReduce reduce phase runs on accumulated map values. Defaults to 10. |
| dispatch.rt_backfill | Boolean | See docs | — | Whether to back fill the real time window for this search. Parameter valid only if this is a real time search. Defaults to 0. |
| dispatch.rt_maximum_span | Number | See docs | — | Allows for a per-job override of the [search] indexed_realtime_maximum_span setting in limits.conf . Default for saved searches is "unset", falling back to the limits.conf setting. |
| dispatch.sample_ratio | Number | See docs | — | The integer value used to calculate the sample ratio. The formula is 1 / <integer> . |
| dispatch.spawn_process | Boolean | See docs | — | This parameter is deprecated and will be removed in a future release. Do not use this parameter. Specifies whether to spawn a new search process when this saved search is executed. Defaults to 1. Searches against indexes must run in a separate process. |
| dispatch.time_format | String | See docs | — | A time format string that defines the time format for specifying the earliest and latest time. Defaults to %FT%T.%Q%:z . |
| dispatch.ttl | Number | See docs | — | Valid values: Integer[p]. Defaults to 2p. Indicates the time to live (in seconds) for the artifacts of the scheduled search, if no actions are triggered. If an action is triggered, the action ttl is used. If multiple actions are triggered, the maximum ttl is applied to the artifacts. To set the action ttl, refer to alert_actions.conf.spec . If the integer is followed by the letter 'p', the ttl is interpreted as a multiple of the scheduled search period. |
| dispatchAs | String | See docs | — | When the saved search is dispatched using the "saved/searches/{name}/dispatch" endpoint, this setting controls what user that search is dispatched as. Only meaningful for shared saved searches. Can be set to owner or user . |
| displayview | String | See docs | — | Defines the default UI view name (not label) in which to load the results. Accessibility is subject to the user having sufficient permissions. |
| durable.backfill_type | String | See docs | — | Specifies how the Splunk software backfills the lost search results of failed scheduled search jobs. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . Valid values are auto , time_interval , and time_whole . time_whole - The Splunk software schedules a single backfill search job with a time range that spans the combined time ranges of all failed scheduled search jobs. The time_whole setting can be applied only to searches that are streaming, where the results are raw events without additional aggregation. time_interval - The Splunk software schedules multiple backfill search jobs, one for each failed scheduled search job. The backfill jobs have time ranges that match those of the failed jobs. The time_interval setting can be applied to both streaming and non-streaming searches. auto - The Splunk software decides the backfill type by checking whether the search is streaming or not. If the search is streaming, the Splunk software uses the time_whole backfill type. Otherwise, it uses the time_interval backfill type. |
| durable.lag_time | Number | See docs | — | Specifies the search time delay, in seconds, that a durable search uses to catch events that are ingested or indexed late. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.max_backfill_intervals | Number | See docs | — | Specifies the maximum number of cron intervals (previous scheduled search jobs) that the Splunk software can attempt to backfill for this search, when those jobs have incomplete events. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.track_time_type | String | See docs | — | Indicates that a scheduled search is durable and specifies how the search tracks events. A durable search is a search that tries to ensure the delivery of all results, even when the search process is slowed or stopped by runtime issues like rolling restarts, network bottlenecks, and even downed servers. Applies only to scheduled searches. A value of _time means the durable search tracks each event by its event timestamp , based on time information included in the event. A value of _indextime means the durable search tracks each event by its indexed timestamp. The search is not durable if this setting is unset or is set to none . |
| is_scheduled | Boolean | See docs | — | Whether this search is to be run on a schedule |
| is_visible | Boolean | See docs | — | Specifies whether this saved search should be listed in the visible saved search list. Defaults to 1. |
| max_concurrent | Number | See docs | — | The maximum number of concurrent instances of this search the scheduler is allowed to run. Defaults to 1. |
| name | String | See docs | — | Required . A name for the search. |
| next_scheduled_time | String | See docs | — | Read-only attribute. Value ignored on POST. There are some old clients who still send this value |
| qualifiedSearch | String | See docs | — | Read-only attribute. Value ignored on POST. This value is computed during runtime. |
| realtime_schedule | Boolean | See docs | — | Controls the way the scheduler computes the next execution time of a scheduled search. Defaults to 1. If this value is set to 1, the scheduler bases its determination of the next scheduled search execution time on the current time. If this value is set to 0, the scheduler bases its determination of the next scheduled search on the last search execution time. This is called continuous scheduling. If set to 0, the scheduler never skips scheduled execution periods. However, the execution of the saved search might fall behind depending on the scheduler load. Use continuous scheduling whenever you enable the summary index option. If set to 1, the scheduler might skip some execution periods to make sure that the scheduler is executing the searches running over the most recent time range. The scheduler tries to execute searches that have realtime_schedule set to 1 before it executes searches that have continuous scheduling (realtime_schedule = 0). |
| request.ui_dispatch_app | String | See docs | — | Specifies a field used by Splunk Web to denote the app this search should be dispatched in. |
| request.ui_dispatch_view | String | See docs | — | Specifies a field used by Splunk Web to denote the view this search should be displayed in. |
| restart_on_searchpeer_add | Boolean | See docs | — | Specifies whether to restart a real-time search managed by the scheduler when a search peer becomes available for this saved search. Defaults to 1. Note: The peer can be a newly added peer or a peer down and now available. |
| run_n_times | Number | See docs | — | Runs this search exactly the specified number of times. Does not run the search again until the Splunk platform is restarted. |
| run_on_startup | Boolean | See docs | — | Indicates whether this search runs on startup. If it does not run on startup, it runs at the next scheduled time. Defaults to 0. Set run_on_startup to 1 for scheduled searches that populate lookup tables. |
| schedule_priority | String | See docs | — | Configures the scheduling priority of a specific search. One of the following values. CODE Copy [ default \| higher \| highest ] [ default \| higher \| highest ] default No scheduling priority increase. higher Scheduling priority is higher than other searches of the same scheduling tier. While there are four tiers of priority for scheduled searches, only the following are affected by this property: CODE Copy * real-Time-Scheduled (realtime_schedule=1). * continuous-Scheduled (realtime_schedule=0). * real-Time-Scheduled (realtime_schedule=1). * continuous-Scheduled (realtime_schedule=0). highest Scheduling priority is higher than other searches regardless of scheduling tier. However, real-time-scheduled searches with priority = highest always have priority over continuous scheduled searches with priority = highest . This is the high-to-low priority order (where RTSS = real-time-scheduled search, CSS = continuous-scheduled search, d = default, h = higher, H = highest). CODE Copy RTSS(H) > CSS(H) > RTSS(h) > RTSS(d) > CSS(h) > CSS(d) RTSS(H) > CSS(H) > RTSS(h) > RTSS(d) > CSS(h) > CSS(d) Changing the priority requires the search owner to have the edit_search_schedule_priority capability in order to make non-default settings. Defaults to default . For more details, see savedsearches.conf.spec . |
| schedule_window | Number or auto | See docs | — | Time window (in minutes) during which the search has lower priority. Defaults to 0. The scheduler can give higher priority to more critical searches during this window. The window must be smaller than the search period. Set to auto to let the scheduler determine the optimal window value automatically. Requires the edit_search_schedule_window capability to override auto . |
| search | String | See docs | — | Required . The search to save. |
| vsid | String | See docs | — | Defines the viewstate id associated with the UI view listed in 'displayview'. Must match up to a stanza in viewstates.conf. |
| workload_pool | String | See docs | — | Specifies the new workload pool where the existing running search will be placed. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.<action_name> | varies | Indicates whether the <action_name> is enabled or disabled for a particular search. For more information about the alert action options see the alert_actions.conf file. |
| action.<action_name>.<parameter> | varies | Overrides the setting defined for an action in the alert_actions.conf file with a new setting that is valid only for the search configuration to which it is applied. |
| action.email | varies | Indicates the state of the email action. |
| action.email.auth_password | varies | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here and it is encrypted on the next restart. Defaults to empty string. |
| action.email.auth_username | varies | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |
| action.email.bcc | varies | BCC email address to use if action.email is enabled. |
| action.email.cc | varies | CC email address to use if action.email is enabled. |
| action.email.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.email.format | varies | Specify the format of text in the email. This value also applies to any attachments.< Valid values: (plain \| html \| raw \| csv) |
| action.email.from | varies | Email address from which the email action originates. Defaults to splunk@$LOCALHOST or whatever value is set in alert_actions.conf. |
| action.email.hostname | varies | Sets the hostname used in the web link (url) sent in email actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) When this value is a simple hostname, the protocol and port which are configured within splunk are used to construct the base of the url. When this value begins with ' http://' , it is used verbatim. NOTE: This means the correct port must be specified if it is not the default port for http or https. This is useful in cases when the Splunk server is not aware of how to construct a url that can be referenced externally, such as SSO environments, other proxies, or when the server hostname is not generally resolvable. Defaults to current hostname provided by the operating system, or if that fails "localhost". When set to empty, default behavior is used. |
| action.email.inline | varies | Indicates whether the search results are contained in the body of the email. Results can be either inline or attached to an email. See action.email.sendresults. |
| action.email.mailserver | varies | Set the address of the MTA server to be used to send the emails. Defaults to <LOCALHOST> (or whatever is set in alert_actions.conf). |
| action.email.maxresults | varies | Sets the global maximum number of search results to send when email.action is enabled. |
| action.email.maxtime | varies | Specifies the maximum amount of time the execution of an email action takes before the action is aborted. |
| action.email.pdfview | varies | The name of the view to deliver if sendpdf is enabled |
| action.email.preprocess_results | varies | Search string to preprocess results before emailing them. Defaults to empty string (no preprocessing). Usually the preprocessing consists of filtering out unwanted internal fields. |
| action.email.reportCIDFontList | varies | Space-separated list. Specifies the set (and load order) of CID fonts for handling Simplified Chinese(gb), Traditional Chinese(cns), Japanese(jp), and Korean(kor) in Integrated PDF Rendering. If multiple fonts provide a glyph for a given character code, the glyph from the first font specified in the list is used. To skip loading any CID fonts, specify the empty string. Default value: "gb cns jp kor" |
| action.email.reportIncludeSplunkLogo | varies | Indicates whether to include the Splunk logo with the report. |
| action.email.reportPaperOrientation | varies | Specifies the paper orientation: portrait or landscape. |
| action.email.reportPaperSize | varies | Specifies the paper size for PDFs. Defaults to letter. Valid values: (letter \| legal \| ledger \| a2 \| a3 \| a4 \| a5) |
| action.email.reportServerEnabled | varies | Not supported. |
| action.email.reportServerURL | varies | Not supported. |
| action.email.sendpdf | varies | Indicates whether to create and send the results as a PDF. |
| action.email.sendresults | varies | Indicates whether to attach the search results in the email. Results can be either attached or inline. See action.email.inline. |
| action.email.subject | varies | Specifies an email subject. Defaults to SplunkAlert-<savedsearchname>. |
| action.email.to | varies | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |
| action.email.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.email.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |
| action.email.use_ssl | varies | Indicates whether to use SSL when communicating with the SMTP server. |
| action.email.use_tls | varies | Indicates whether to use TLS (transport layer security) when communicating with the SMTP server (starttls). |
| action.email.width_sort_columns | varies | Indicates whether columns should be sorted from least wide to most wide, left to right. Only valid if format=text. |
| action.populate_lookup | varies | Indicates the state of the populate lookup action. |
| action.populate_lookup.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.populate_lookup.dest | varies | Lookup name of path of the lookup to populate. |
| action.populate_lookup.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.populate_lookup.maxresults | varies | The maximum number of search results sent using alerts. |
| action.populate_lookup.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. Valid values are: Integer[m\|s\|h\|d] |
| action.populate_lookup.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.populate_lookup.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, then this specifies the number of scheduled periods. Defaults to 10p. If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p] |
| action.rss | varies | Indicates the state of the RSS action. |
| action.rss.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.rss.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.rss.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.rss.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Valid values are Integer[m \|s \|h \|d]. |
| action.rss.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.rss.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| action.script | varies | Indicates the state of the script for this action. |
| action.script.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.script.filename | varies | File name of the script to call. Required if script action is enabled |
| action.script.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.script.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.script.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. |
| action.script.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.script.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 600 (10 minutes). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| action.summary_index | varies | Indicates the state of the summary index. |
| action.summary_index._name | varies | Specifies the name of the summary index where the results of the scheduled search are saved. Defaults to "summary." |
| action.summary_index.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.summary_index.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.summary_index.inline | varies | Determines whether to execute the summary indexing action as part of the scheduled search. Note: This option is considered only if the summary index action is enabled and is always executed (in other words, if counttype = always). |
| action.summary_index.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.summary_index.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. Valid values are: Integer[m\|s\|h\|d] |
| action.summary_index.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.summary_index.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 10p. If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| actions | varies | Actions triggerd by this alert. |
| alert.digest_mode | varies | Indicates if the alert actions are applied to the entire result set or to each individual result. |
| alert.expires | varies | Sets the period of time to show the alert in the dashboard. Defaults to 24h. Use [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. Valid values: [number][time-unit] |
| alert.severity | varies | Valid values: (1 \| 2 \| 3 \| 4 \| 5 \| 6) Sets the alert severity level. Valid values are: 1 DEBUG 2 INFO 3 WARN 4 ERROR 5 SEVERE 6 FATAL |
| alert.suppress | varies | Indicates whether alert suppression is enabled for this schedules search. |
| alert.suppress.fields | varies | Fields to use for suppression when doing per result alerting. Required if suppression is turned on and per result alerting is enabled. |
| alert.suppress.period | varies | Specifies the suppresion period. Only valid if alert.supress is enabled. Uses [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.track | varies | Specifies whether to track the actions triggered by this scheduled search. auto - determine whether to track or not based on the tracking setting of each action, do not track scheduled searches that always trigger actions. true - force alert tracking. false - disable alert tracking for this search. |
| alert_comparator | varies | One of the following strings: greater than, less than, equal to, rises by, drops by, rises by perc, drops by perc |
| alert_condition | varies | A conditional search that is evaluated against the results of the saved search. Defaults to an empty string. Alerts are triggered if the specified search yields a non-empty search result list. Note: If you specify an alert_condition, do not set counttype, relation, or quantity. |
| alert_threshold | varies | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to "rises by perc" or "drops by perc." |
| alert_type | varies | What to base the alert on, overriden by alert_condition if it is specified. Valid values are: always, custom, number of events, number of hosts, number of sources. |
| allow_skew | varies | 0 \| <percentage> \| <duration> Allows the search scheduler to distribute scheduled searches randomly and more evenly over their specified search periods. CAUTION: This setting does not require adjusting in most use cases. Check with an admin before making any updates. When set to a non-zero value for searches with the following cron_schedule values, the search scheduler randomly skews the second, minute, and hour on which the search runs. CODE Copy * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). When set to a non-zero value for a search that has any other cron_schedule setting, the search scheduler can randomly skew only the second on which the search runs. The amount of skew for a specific search remains constant between edits of the search. A value of 0 disallows skew. 0 is the default setting. Percentage <int> followed by % specifies the maximum amount of time to skew as a percentage of the scheduled search period. Duration <int><unit> specifies a maximum duration. The <unit> can be omitted only when the <int> is 0 (which disables skew). Valid duration units: m min minute mins minutes h hr hour hrs hours d day days Examples CODE Copy 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum |
| args.* | varies | Wildcard argument that accepts any saved search template argument, such as args.username=foobar when the search is search $username$. |
| auto_summarize | varies | Indicates whether the scheduler should ensure that the data for this search is automatically summarized. |
| auto_summarize.command | varies | A search template that constructs the auto summarization for this search. Caution: Advanced feature. Do not change unless you understand the architecture of auto summarization of saved searches. |
| auto_summarize.cron_schedule | varies | Cron schedule that probes and generates the summaries for this saved search. |
| auto_summarize.dispatch.earliest_time | varies | A time string that specifies the earliest time for summarizing this search. Can be a relative or absolute time. |
| auto_summarize.dispatch.latest_time | varies | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. |
| auto_summarize.dispatch.time_format | varies | Time format used to specify the earliest and latest times. |
| auto_summarize.dispatch.ttl | varies | Indicates the time to live (in seconds) for the artifacts of the summarization of the scheduled search. If the integer is followed by the letter 'p', the ttl is interpreted as a multiple of the scheduled search period. |
| auto_summarize.max_disabled_buckets | varies | The maximum number of buckets with the suspended summarization before the summarization search is completely stopped, and the summarization of the search is suspended for auto_summarize.suspend_period. |
| auto_summarize.max_summary_ratio | varies | The maximum ratio of summary_size/bucket_size, which specifies when to stop summarization and deem it unhelpful for a bucket. Note: The test is only performed if the summary size is larger than auto_summarize.max_summary_size. |
| auto_summarize.max_summary_size | varies | The minimum summary size, in bytes, before testing whether the summarization is helpful. |
| auto_summarize.max_time | varies | Maximum time (in seconds) that the summary search is allowed to run. Note: This is an approximate time. The summary search stops at clean bucket boundaries. |
| auto_summarize.suspend_period | varies | Time specifier indicating when to suspend summarization of this search if the summarization is deemed unhelpful. |
| auto_summarize.timespan | varies | The list of time ranges that each summarized chunk should span. This comprises the list of available granularity levels for which summaries would be available. For example a timechart over the last month whose granularity is at the day level should set this to 1d. If you need the same data summarized at the hour level for weekly charts, use: 1h,1d. |
| cron_schedule | varies | The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. Valid values: cron string |
| description | varies | Description of this saved search. Defaults to empty string. |
| disabled | varies | Indicates if this saved search is disabled. |
| dispatch.* | varies | * represents any custom dispatch field. |
| dispatch.buckets | varies | The maximum nuber of timeline buckets. |
| dispatch.earliest_time | varies | A time string that specifies the earliest time for this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.indexedRealtime | varies | Indicates whether to used indexed-realtime mode when doing real-time searches. |
| dispatch.latest_time | varies | A time string that specifies the latest time for the saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.lookups | varies | Indicates if lookups are enabled for this search. |
| dispatch.max_count | varies | The maximum number of results before finalizing the search. |
| dispatch.max_time | varies | Indicates the maximum amount of time (in seconds) before finalizing the search. |
| dispatch.reduce_freq | varies | Specifies how frequently the MapReduce reduce phase runs on accumulated map values. |
| dispatch.rt_backfill | varies | Indicates whether to back fill the real time window for this search. Parameter valid only if this is a real time search |
| dispatch.spawn_process | varies | This parameter is deprecated and will be removed in a future release. Do not use this parameter. Indicates whether a new search process spawns when this saved search is executed. |
| dispatch.time_format | varies | Time format string that defines the time format for specifying the earliest and latest time. |
| dispatch.ttl | varies | Indicates the time to live (in seconds) for the artifacts of the scheduled search, if no actions are triggered. If an action is triggered, the action ttl is used. If multiple actions are triggered, the maximum ttl is applied to the artifacts. To set the action ttl, refer to alert_actions.conf.spec . If the integer is followed by the letter 'p', the ttl is interpreted as a multiple of the scheduled search period. |
| displayview | varies | Defines the default UI view name (not label) in which to load the results. Accessibility is subject to the user having sufficient permissions. |
| durable.backfill_type | varies | Specifies how the Splunk software backfills the lost search results of failed scheduled search jobs. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . Valid values are auto , time_interval , and time_whole . |
| durable.lag_time | varies | Specifies the search time delay, in seconds, that a durable search uses to catch events that are ingested or indexed late. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.max_backfill_intervals | varies | Specifies the maximum number of cron intervals (previous scheduled search jobs) that the Splunk software can attempt to backfill for this search, when those jobs have incomplete events. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.track_time_type | varies | Indicates that a scheduled search is durable and specifies how the search tracks events. A value of _time means the durable search tracks each event by its event timestamp , based on time information included in the event. A value of _indextime means the durable search tracks each event by its indexed timestamp. The search is not durable if this setting is unset or is set to none . |
| is_scheduled | varies | Indicates if this search is to be run on a schedule. |
| is_visible | varies | Indicates if this saved search appears in the visible saved search list. |
| max_concurrent | varies | The maximum number of concurrent instances of this search the scheduler is allowed to run. |
| next_scheduled_time | varies | The time when the scheduler runs this search again. |
| qualifiedSearch | varies | The exact search string that the scheduler would run. |
| realtime_schedule | varies | Controls the way the scheduler computes the next execution time of a scheduled search. If this value is set to 1, the scheduler bases its determination of the next scheduled search execution time on the current time. If this value is set to 0, the scheduler bases its determination of the next scheduled search on the last search execution time. This is called continuous scheduling. If set to 0, the scheduler never skips scheduled execution periods. However, the execution of the saved search might fall behind depending on the scheduler load. Use continuous scheduling whenever you enable the summary index option. If set to 1, the scheduler might skip some execution periods to make sure that the scheduler is executing the searches running over the most recent time range. The scheduler tries to execute searches that have realtime_schedule set to 1 before it executes searches that have continuous scheduling (realtime_schedule = 0). |
| request.ui_dispatch_app | varies | A field used by Splunk Web to denote the app this search should be dispatched in. |
| request.ui_dispatch_view | varies | Specifies a field used by Splunk Web to denote the view this search should be displayed in. |
| restart_on_searchpeer_add | varies | Indicates whether to restart a real-time search managed by the scheduler when a search peer becomes available for this saved search. Note: The peer can be a newly added peer or a peer down and now available. |
| run_on_startup | varies | Indicates whether this search runs on startup. If it does not run on startup, it runs at the next scheduled time. Splunk recommends that you set run_on_startup to true for scheduled searches that populate lookup tables. |
| schedule_window | varies | Time window (in minutes) during which the search has lower priority. The scheduler can give higher priority to more critical searches during this window. The window must be smaller than the search period. If set to auto , the scheduler prioritizes searches automatically. |
| search | varies | Search expression to filter the response. The response matches field values against the search expression. For example: search=foo matches any object that has "foo" as a substring in a field. search=field_name%3Dfield_value restricts the match to a single field. URI-encoding is required in this example. |
| vsid | varies | The viewstate id associated with the UI view listed in 'displayview'. Matches to a stanza in viewstates.conf. |

#### Example

```
curl -k -u admin:chang2me https://fool01:8092/services/saved/searches/ \
 -d name=test_durable \
 -d cron_schedule="*/3 * * * *" \
 -d description="This test job is a durable saved search" \
 -d dispatch.earliest_time="-24h@h" -d dispatch.latest_time=now \
 --data-urlencode search="search index="_internal" | stats count by host" \
```



---

## `/services/saved/searches/{name}`

Manage the {name} saved search.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches/{name}` |
| Auth required | Yes |
| Capability | `edit_search_schedule_priority` |

### DELETE `/services/saved/searches/{name}`

Delete the named saved search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/saved/searches/MySavedSearch
```


### GET `/services/saved/searches/{name}`

Access the named saved search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| earliest_time | String | No |  | If the search is scheduled display scheduled times starting from this time |
| latest_time | String | No |  | If the search is scheduled display scheduled times ending at this time |
| listDefaultActionArgs | Boolean | No |  | Indicates whether to list default actions. |
| add_orphan_field | Boolean | No |  | Indicates whether the response includes a boolean value for each saved search to show whether the search is orphaned, meaning that it has no valid owner. When add_orphan_field is set to true , the response includes the orphaned search indicators, either 0 to indicate that a search is not orphaned or 1 to indicate that the search is orphaned. Admins can use this setting to check for searches without valid owners and resolve related issues. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.<action_name> | varies | Indicates whether the <action_name> is enabled or disabled for a particular search. For more information about the alert action options see the alert_actions.conf file. |
| action.<action_name>.<parameter> | varies | Overrides the setting defined for an action in the alert_actions.conf file with a new setting that is valid only for the search configuration to which it is applied. |
| action.email | varies | Indicates the state of the email action. |
| action.email.auth_password | varies | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here that is encrypted on the next restart. Defaults to empty string. |
| action.email.auth_username | varies | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |
| action.email.bcc | varies | BCC email address to use if action.email is enabled. |
| action.email.cc | varies | CC email address to use if action.email is enabled. |
| action.email.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.email.format | varies | Specify the format of text in the email. This value also applies to any attachments. Valid values: (plain \| html \| raw \| csv) |
| action.email.from | varies | Email address from which the email action originates. |
| action.email.hostname | varies | Sets the hostname used in the web link (url) sent in email actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) When this value is a simple hostname, the protocol and port which are configured within splunk are used to construct the base of the url. When this value begins with ' http://' , it is used verbatim. Note: This means the correct port must be specified if it is not the default port for http or https. This is useful in cases when the Splunk server is not aware of how to construct a url that can be referenced externally, such as SSO environments, other proxies, or when the server hostname is not generally resolvable. Defaults to current hostname provided by the operating system, or if that fails "localhost." When set to empty, default behavior is used. |
| action.email.inline | varies | Indicates whether the search results are contained in the body of the email. Results can be either inline or attached to an email. See action.email.sendresults. |
| action.email.mailserver | varies | Set the address of the MTA server to be used to send the emails. Defaults to <LOCALHOST> (or whatever is set in alert_actions.conf). |
| action.email.maxresults | varies | Sets the global maximum number of search results to send when email.action is enabled. |
| action.email.maxtime | varies | Specifies the maximum amount of time the execution of an email action takes before the action is aborted. |
| action.email.preprocess_results | varies | Search string to preprocess results before emailing them. Defaults to empty string (no preprocessing). Usually the preprocessing consists of filtering out unwanted internal fields. |
| action.email.reportPaperOrientation | varies | Specifies the paper orientation: portrait or landscape. |
| action.email.reportPaperSize | varies | Specifies the paper size for PDFs. Defaults to letter. Valid values: (letter \| legal \| ledger \| a2 \| a3 \| a4 \| a5) |
| action.email.reportServerEnabled | varies | Not supported. |
| action.email.reportServerURL | varies | Not supported. |
| action.email.sendpdf | varies | Indicates whether to create and send the results as a PDF. |
| action.email.sendresults | varies | Indicates whether to attach the search results in the email. Results can be either attached or inline. See action.email.inline. |
| action.email.subject | varies | Specifies an email subject. Defaults to SplunkAlert-<savedsearchname>. |
| action.email.to | varies | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |
| action.email.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.email.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |
| action.email.use_ssl | varies | Indicates whether to use SSL when communicating with the SMTP server. |
| action.email.use_tls | varies | Indicates whether to use TLS (transport layer security) when communicating with the SMTP server (starttls). |
| action.populate_lookup | varies | The state of the populate lookup action. |
| action.populate_lookup.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.populate_lookup.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.populate_lookup.maxresults | varies | The maximum number of search results sent using alerts. |
| action.populate_lookup.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. Valid values are: Integer[m\|s\|h\|d] |
| action.populate_lookup.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.populate_lookup.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, then this specifies the number of scheduled periods. Defaults to 10p. If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p] |
| action.rss | varies | The state of the RSS action. |
| action.rss.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.rss.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. |
| action.rss.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.rss.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 1m. |
| action.rss.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.rss.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| action.script | varies | The state of the script action. |
| action.script.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.script.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.script.maxresults | varies | The maximum number of search results sent using alerts. |
| action.script.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. |
| action.script.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.script.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 600 (10 minutes). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| action.summary_index | varies | The state of the summary index action. |
| action.summary_index._name | varies | Specifies the name of the summary index where the results of the scheduled search are saved. Defaults to "summary." |
| action.summary_index._type" | varies | Specifies the data type of the summary index where the Splunk software saves the results of the scheduled search. Can be set to event or metric . |
| action.summary_index.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.summary_index.hostname | varies | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |
| action.summary_index.force_realtime_schedule | varies | By default, realtime_schedule is false for a report configured for summary indexing. When set to 1 or true , this setting overrides realtime_schedule . Setting this setting to true can cause gaps in summary data, as a realtime_schedule search is skipped if search concurrency limits are violated. |
| action.summary_index.inline | varies | Determines whether to execute the summary indexing action as part of the scheduled search. Note: This option is considered only if the summary index action is enabled and is always executed (in other words, if counttype = always). |
| action.summary_index.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.summary_index.maxtime | varies | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. |
| action.summary_index.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.summary_index.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 10p. If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |
| alert.digest_mode | varies | Specifies whether alert actions are applied to the entire result set or to each individual result. |
| alert.expires | varies | Sets the period of time to show the alert in the dashboard. Defaults to 24h. |
| alert.managedBy | varies | Specifies the feature or component that created the alert. |
| alert.severity | varies | Valid values: (1 \| 2 \| 3 \| 4 \| 5 \| 6) Sets the alert severity level. Valid values are: 1 DEBUG 2 INFO 3 WARN 4 ERROR 5 SEVERE 6 FATAL |
| alert.suppress | varies | Indicates whether alert suppression is enabled for this schedules search. |
| alert.suppress.fields | varies | List of fields to use when suppressing per-result alerts. Must be specified if the digest mode is disabled and suppression is enabled. |
| alert.suppress.group_name | varies | Optional setting. Used to define an alert suppression group for a set of alerts that are running over identical or very similar datasets. Alert suppression groups can help you avoid getting multiple triggered alert notifications for the same data. |
| alert.suppress.period | varies | Specifies the suppression period. Only valid if alert.suppress is enabled. Uses [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.track | varies | Specifies whether to track the actions triggered by this scheduled search. auto - (Default) Determine whether to apply alert tracking to this search, based on the tracking setting of each action. Do not track scheduled searches that always trigger actions. true - Force alert tracking for this search. Default. false - Disable alert tracking for this search. |
| alert_comparator | varies | One of the following strings: greater than less than equal to rises by drops by rises by perc drops by perc Used with alert_threshold to trigger alert actions. |
| alert_condition | varies | A conditional search that is evaluated against the results of the saved search. Defaults to an empty string. Alerts are triggered if the specified search yields a non-empty search result list. Note: If you specify an alert_condition , do not set counttype, relation, or quantity. |
| alert_threshold | varies | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator ) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to rises by perc" or "drops by perc." |
| alert_type | varies | What to base the alert on, overridden by alert_condition if it is specified. Valid values are: always, custom, number of events, number of hosts, number of sources. Typically, reports return the "always" value, while alerts can return any other value. |
| allow_skew | varies | 0 \| <percentage> \| <duration> Allows the search scheduler to distribute scheduled searches randomly and more evenly over their specified search periods. CAUTION: This setting does not require adjusting in most use cases. Check with an admin before making any updates. When set to a non-zero value for searches with the following cron_schedule values, the search scheduler randomly skews the second, minute, and hour on which the search runs. CODE Copy * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). When set to a non-zero value for a search that has any other cron_schedule setting, the search scheduler can randomly skew only the second on which the search runs. The amount of skew for a specific search remains constant between edits of the search. A value of 0 disallows skew. 0 is the default setting. Percentage <int> followed by % specifies the maximum amount of time to skew as a percentage of the scheduled search period. Duration <int><unit> specifies a maximum duration. The <unit> can be omitted only when the <int> is 0 . Valid duration units: m min minute mins minutes h hr hour hrs hours d day days Examples CODE Copy 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum |
| auto_summarize | varies | Specifies whether the search scheduler should ensure that the data for this search is automatically summarized. |
| auto_summarize.command | varies | A search template to use to construct the auto-summarization for the search. Do not change. |
| auto_summarize.cron_schedule | varies | Cron schedule to use to probe or generate the summaries for this search |
| auto_summarize.dispatch.<arg-name> | varies | Dispatch options that can be overridden when running the summary search. |
| auto_summarize.max_concurrent | varies | The maximum number of concurrent instances of this auto summarizing search that the scheduler is allowed to run. |
| auto_summarize.max_disabled_buckets | varies | The maximum number of buckets with suspended summarization before the summarization search is completely stopped and the summarization of the search is suspended for the value specified by the auto_summarize.suspend_period setting. |
| auto_summarize.max_summary_ratio | varies | The maximum ratio of summary_size/bucket_size, which specifies when to stop summarization and deem it unhelpful for a bucket. |
| auto_summarize.max_summary_size | varies | The minimum summary size, in bytes, before testing whether the summarization is helpful. |
| auto_summarize.max_time | varies | The maximum time, in seconds, that the auto-summarization search is allowed to run. |
| auto_summarize.suspend_period | varies | The amount of time to suspend summarization of the search if the summarization is deemed unhelpful. |
| auto_summarize.timespan | varies | Comma-delimited list of time ranges that each summarized chunk should span. Comprises the list of available summary ranges for which summaries would be available. Does not support 1w timespans. |
| auto_summarize.workload_pool | varies | Sets the name of the workload pool that is used by the auto-summarization of this search. |
| cron_schedule | varies | The cron schedule to run this search. For more information, refer to the description of this parameter in the POST endpoint. |
| defer_scheduled_searchable_idxc | varies | Specifies whether to defer a continuous saved search during a searchable rolling restart or searchable rolling upgrade of an indexer cluster. |
| description | varies | Description of this saved search. |
| disabled | varies | Indicates if this saved search is disabled. |
| dispatch.allow_partial_results | varies | Specifies whether the search job can proceed to provide partial results if a search peer fails. When set to false, the search job fails if a search peer providing results for the search job fails. |
| dispatch.auto_cancel | varies | Specifies the amount of inactive time, in seconds, after which the search job is automatically canceled. |
| dispatch.auto_pause | varies | Specifies the amount of inactive time, in seconds, after which the search job is automatically paused. |
| dispatch.buckets | varies | The maximum number of timeline buckets. |
| dispatch.earliest_time | varies | A time string that specifies the earliest time for this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.index_earliest | varies | Specifies the earliest index time for this search. Can be a relative or absolute time. |
| dispatch.index_latest | varies | Specifies the latest index time for this saved search. Can be a relative or absolute time. |
| dispatch.indexedRealtime | varies | Specifies whether to use 'indexed-realtime' mode when doing real-time searches. |
| dispatch.indexedRealtimeMinSpan | varies | Specifies the minimum number of seconds to wait between component index searches. |
| dispatch.indexedRealtimeOffset | varies | Specifies the number of seconds to wait for disk flushes to finish. |
| dispatch.indexedRealtimeMinSpan | varies | Allows for a per-job override of the [search] indexed_realtime_default_span setting in limits.conf . The default for saved searches is "unset", falling back to the limits.conf setting. |
| dispatch.latest_time | varies | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.lookups | varies | Indicates if lookups are enabled for this search. |
| dispatch.max_count | varies | The maximum number of results before finalizing the search. |
| dispatch.max_time | varies | Indicates the maximum amount of time (in seconds) before finalizing the search. |
| dispatch.reduce_freq | varies | Specifies how frequently the MapReduce reduce phase runs on accumulated map values. |
| dispatch.rt_backfill | varies | Specifies whether to do real-time window backfilling for scheduled real-time searches. |
| dispatch.rt_maximum_span | varies | Sets the maximum number of seconds to search data that falls behind real time. |
| dispatch.sample_ratio | varies | The integer value used to calculate the sample ratio. The formula is 1 / <integer> . |
| dispatch.spawn_process | varies | This parameter is deprecated and will be removed in a future release. Do not use this parameter. Indicates whether a new search process spawns when this saved search is executed. |
| dispatch.time_format | varies | A time format string that defines the time format for specifying the earliest and latest time. |
| dispatch.ttl | varies | Indicates the time to live (ttl), in seconds, for the artifacts of the scheduled search, if no actions are triggered. |
| displayview | varies | Defines the default Splunk Web view name (not label) in which to load the results. Accessibility is subject to the user having sufficient permissions. |
| durable.backfill_type | varies | Specifies how the Splunk software backfills the lost search results of failed scheduled search jobs. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . Valid values are auto , time_interval , and time_whole . |
| durable.lag_time | varies | Specifies the search time delay, in seconds, that a durable search uses to catch events that are ingested or indexed late. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.max_backfill_intervals | varies | Specifies the maximum number of cron intervals (previous scheduled search jobs) that the Splunk software can attempt to backfill for this search, when those jobs have incomplete events. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.track_time_type | varies | Indicates that a scheduled search is durable and specifies how the search tracks events. A value of _time means the durable search tracks each event by its event timestamp , based on time information included in the event. A value of _indextime means the durable search tracks each event by its indexed timestamp. The search is not durable if this setting is unset or is set to none . |
| earliest_time | varies | For scheduled searches display all the scheduled times starting from this time. |
| is_scheduled | varies | Indicates if this search is to be run on a schedule. |
| is_visible | varies | Indicates if this saved search appears in the visible saved search list. |
| latest_time | varies | For scheduled searches display all the scheduled times until this time (not just the next run time). |
| listDefaultActionArgs | varies | List default values of actions.*, even though some of the actions may not be specified in the saved search. |
| max_concurrent | varies | The maximum number of concurrent instances of this search the scheduler is allowed to run. |
| next_scheduled_time | varies | The time when the scheduler runs this search again. |
| orphan | varies | If the add_orphan_field parameter is passed in with the GET request, this field indicates whether the search is orphaned. |
| qualifiedSearch | varies | The exact search command for this saved search. |
| realtime_schedule | varies | Controls the way the scheduler computes the next execution time of a scheduled search. If this value is set to 1, the scheduler bases its determination of the next scheduled search execution time on the current time. If this value is set to 0, the scheduler bases its determination of the next scheduled search on the last search execution time. This is called continuous scheduling. See the POST parameter for this attribute for details. |
| request.ui_dispatch_app | varies | A field used by Splunk Web to denote the app this search should be dispatched in. |
| request.ui_dispatch_view | varies | Specifies a field used by Splunk Web to denote the view this search should be displayed in. |
| restart_on_searchpeer_add | varies | Indicates whether to restart a real-time search managed by the scheduler when a search peer becomes available for this saved search. Note: The peer can be a newly added peer or a peer down and now available. |
| run_n_times | varies | Runs this search exactly the specified number of times. Does not run the search again until the Splunk platform is restarted. |
| run_on_startup | varies | Indicates whether this search runs on startup. If it does not run on startup, it runs at the next scheduled time. Set run_on_startup to true for scheduled searches that populate lookup tables. |
| schedule_priority | varies | Indicates the scheduling priority of a specific search. One of the following values. CODE Copy [ default \| higher \| highest ] [ default \| higher \| highest ] Raises the scheduling priority of the named search. default No scheduling priority increase. higher Scheduling priority is higher than other searches of the same scheduling tier. While there are four tiers of priority for scheduled searches, only the following are affected by this property: CODE Copy * real-Time-Scheduled (realtime_schedule=1). * continuous-Scheduled (realtime_schedule=0). * real-Time-Scheduled (realtime_schedule=1). * continuous-Scheduled (realtime_schedule=0). highest Scheduling priority is higher than other searches regardless of scheduling tier. However, real-time-scheduled searches with priority = highest always have priority over continuous scheduled searches with priority = highest . The high-to-low priority order (where RTSS = real-time-scheduled search, CODE Copy CSS = continuous-scheduled search, d = default, h = higher, H = highest) is: CSS = continuous-scheduled search, d = default, h = higher, H = highest) is: CODE Copy RTSS(H) > CSS(H) > RTSS(h) > RTSS(d) > CSS(h) > CSS(d) RTSS(H) > CSS(H) > RTSS(h) > RTSS(d) > CSS(h) > CSS(d) Requires the search owner to have the edit_search_schedule_priority capability in order to make non-default settings. Defaults to default . For more details, see savedsearches.conf.spec . |
| schedule_window | varies | Time window (in minutes) during which the search has lower priority. The scheduler can give higher priority to more critical searches during this window. The window must be smaller than the search period. If set to auto , the scheduler determines the optimal time window automatically. |
| search | varies | Search expression to filter the response. The response matches field values against the search expression. For example: search=foo matches any object that has "foo" as a substring in a field. search=field_name%3Dfield_value restricts the match to a single field. URI-encoding is required in this example. |
| vsid | varies | Defines the viewstate id associated with the UI view listed in 'displayview'. Must match up to a stanza in viewstates.conf. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/searches/MySavedSearch
```


### POST `/services/saved/searches/{name}`

Update the named saved search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action.<action_name> | Boolean | See docs | — | Enable or disable an alert action. See alert_actions.conf for available alert action types. action_name defaults to the empty string. |
| action.<action_name>.<parameter> | String or Number | See docs | — | Use this syntax to configure action parameters. See alert_actions.conf for parameter options. |
| action.summary_index._type" | String | See docs | — | Specifies the data type of the summary index where the Splunk software saves the results of the scheduled search. Can be set to event or metric . |
| action.summary_index.force_realtime_schedule | Boolean | See docs | — | By default, realtime_schedule is false for a report configured for summary indexing. When set to 1 or True , this setting overrides realtime_schedule . Setting this setting to true can cause gaps in summary data, as a realtime_schedule search is skipped if search concurrency limits are violated. |
| actions | String | See docs | — | A comma-separated list of actions to enable. For example: rss,email |
| alert.digest_mode | Boolean | See docs | — | Specifies whether alert actions are applied to the entire result set or on each individual result. Defaults to 1 (true). |
| alert.expires | Number | See docs | — | Valid values: [number][time-unit] Sets the period of time to show the alert in the dashboard. Defaults to 24h. Use [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.severity | Enum | See docs | — | Valid values: (1 \| 2 \| 3 \| 4 \| 5 \| 6) Sets the alert severity level. Valid values are: 1 DEBUG 2 INFO 3 WARN 4 ERROR 5 SEVERE 6 FATAL Defaults to 3. |
| alert.suppress | Boolean | See docs | — | Indicates whether alert suppression is enabled for this scheduled search. |
| alert.suppress.fields | String | See docs | — | Comma delimited list of fields to use for suppression when doing per result alerting. Required if suppression is turned on and per result alerting is enabled. |
| alert.suppress.group_name | String | See docs | — | Optional setting. Used to define an alert suppression group for a set of alerts that are running over identical or very similar datasets. Alert suppression groups can help you avoid getting multiple triggered alert notifications for the same data. |
| alert.suppress.period | Number | See docs | — | Valid values: [number][time-unit] Specifies the suppression period. Only valid if alert.suppress is enabled. Use [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.track | Enum | See docs | — | Valid values: (true \| false \| auto) Specifies whether to track the actions triggered by this scheduled search. auto - Determine whether to apply alert tracking to this search, based on the tracking setting of each action. Do not track scheduled searches that always trigger actions. Default. true - Force alert tracking for this search. false - Disable alert tracking for this search. |
| alert_comparator | String | See docs | — | One of the following strings: greater than, less than, equal to, rises by, drops by, rises by perc, drops by perc. Used with alert_threshold to trigger alert actions. |
| alert_condition | String | See docs | — | Contains a conditional search that is evaluated against the results of the saved search. Defaults to an empty string. Alerts are triggered if the specified search yields a non-empty search result list. Note: If you specify an alert_condition, do not set counttype, relation, or quantity. |
| alert_threshold | Number | See docs | — | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator ) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to "rises by perc" or "drops by perc." |
| alert_type | String | See docs | — | What to base the alert on, overridden by alert_condition if it is specified. Valid values are: always, custom, number of events, number of hosts, number of sources. |
| allow_skew | 0 \| <percentage> \| <duration> | See docs | — | Allows the search scheduler to distribute scheduled searches randomly and more evenly over their specified search periods. CAUTION: This setting does not require adjusting in most use cases. Check with an admin before making any updates. When set to a non-zero value for searches with the following cron_schedule values, the search scheduler randomly skews the second, minute, and hour on which the search runs. CODE Copy * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). When set to a non-zero value for a search that has any other cron_schedule setting, the search scheduler can randomly skew only the second on which the search runs. The amount of skew for a specific search remains constant between edits of the search. A value of 0 disallows skew. 0 is the default setting. Percentage <int> followed by % specifies the maximum amount of time to skew as a percentage of the scheduled search period. Duration <int><unit> specifies a maximum duration. The <unit> can be omitted only when the <int> is 0 . Valid duration units: m min minute mins minutes h hr hour hrs hours d day days Examples CODE Copy 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum |
| args.* | String | See docs | — | Wildcard argument that accepts any saved search template argument, such as args.username=foobar when the search is search $username$. |
| auto_summarize | Boolean | See docs | — | Indicates whether the scheduler should ensure that the data for this search is automatically summarized. Defaults to 0. |
| auto_summarize.command | String | See docs | — | An auto summarization template for this search. See auto summarization options in savedsearches.conf for more details. Do not change unless you understand the architecture of saved search auto summarization. |
| auto_summarize.cron_schedule | String | See docs | — | Cron schedule that probes and generates the summaries for this saved search. The default value is */10 * * * * and corresponds to "every ten hours". |
| auto_summarize.dispatch.earliest_time | String | See docs | — | A time string that specifies the earliest time for summarizing this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| auto_summarize.dispatch.latest_time | String | See docs | — | A time string that specifies the latest time for summarizing this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| auto_summarize.dispatch.time_format | String | See docs | — | Defines the time format that Splunk software uses to specify the earliest and latest time. Defaults to %FT%T.%Q%:z |
| auto_summarize.dispatch.ttl | String | See docs | — | Valid values: Integer[p]. Indicates the time to live (ttl), in seconds, for the artifacts of the summarization of the scheduled search. Defaults to 60. |
| auto_summarize.max_disabled_buckets | Number | See docs | — | The maximum number of buckets with the suspended summarization before the summarization search is completely stopped, and the summarization of the search is suspended for auto_summarize.suspend_period. Defaults to 2. |
| auto_summarize.max_summary_ratio | Number | See docs | — | The maximum ratio of summary_size/bucket_size, which specifies when to stop summarization and deem it unhelpful for a bucket. Defaults to 0.1 Note: The test is only performed if the summary size is larger than auto_summarize.max_summary_size. |
| auto_summarize.max_summary_size | Number | See docs | — | The minimum summary size, in bytes, before testing whether the summarization is helpful. The default value is 52428800 and is equivalent to 5MB. |
| auto_summarize.max_time | Number | See docs | — | Maximum time (in seconds) that the summary search is allowed to run. Defaults to 3600. Note: This is an approximate time. The summary search stops at clean bucket boundaries. |
| auto_summarize.suspend_period | String | See docs | — | Time specifier indicating when to suspend summarization of this search if the summarization is deemed unhelpful. Defaults to 24h. |
| auto_summarize.timespan | String | See docs | — | Comma-delimited list of time ranges that each summarized chunk should span. Comprises the list of available granularity levels for which summaries would be available. Does not support 1w timespans. For example, a timechart over the last month whose granularity is at the day level should set this to 1d . If you need the same data summarized at the hour level for weekly charts, use: 1h,1d . |
| cron_schedule | String | See docs | — | Valid values: cron string The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. |
| description | String | See docs | — | Human-readable description of this saved search. Defaults to empty string. |
| disabled | Boolean | See docs | — | Indicates if the saved search is enabled. Defaults to 0. Disabled saved searches are not visible in Splunk Web. |
| dispatch.* | String | See docs | — | Wildcard argument that accepts any dispatch related argument. |
| dispatch.allow_partial_results | Boolean | See docs | — | Specifies whether the search job can proceed to provide partial results if a search peer fails. When set to false, the search job fails if a search peer providing results for the search job fails. |
| dispatch.auto_cancel | Number | See docs | — | Specifies the amount of inactive time, in seconds, after which the search job is automatically canceled. |
| dispatch.auto_pause | Number | See docs | — | Specifies the amount of inactive time, in seconds, after which the search job is automatically paused. |
| dispatch.buckets | Number | See docs | — | The maximum number of timeline buckets. Defaults to 0. |
| dispatch.earliest_time | String | See docs | — | A time string that specifies the earliest time for this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.index_earliest | String | See docs | — | A time string that specifies the earliest index time for this search. Can be a relative or absolute time. |
| dispatch.index_latest | String | See docs | — | A time string that specifies the latest index time for this saved search. Can be a relative or absolute time. |
| dispatch.indexedRealtime | Boolean | See docs | — | Indicates whether to used indexed-realtime mode when doing real-time searches. |
| dispatch.indexedRealtimeOffset | Integer | See docs | — | Allows for a per-job override of the [search] indexed_realtime_disk_sync_delay setting in limits.conf . Default for saved searches is "unset", falling back to limits.conf setting. |
| dispatch.indexedRealtimeMinSpan | Integer | See docs | — | Allows for a per-job override of the [search] indexed_realtime_default_span setting in limits.conf . Default for saved searches is "unset", falling back to the limits.conf setting. |
| dispatch.latest_time | String | See docs | — | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.lookups | Boolean | See docs | — | Enables or disables the lookups for this search. Defaults to 1. |
| dispatch.max_count | Number | See docs | — | The maximum number of results before finalizing the search. Defaults to 500000. |
| dispatch.max_time | Number | See docs | — | Indicates the maximum amount of time (in seconds) before finalizing the search. Defaults to 0. |
| dispatch.reduce_freq | Number | See docs | — | Specifies, in seconds, how frequently the MapReduce reduce phase runs on accumulated map values. Defaults to 10. |
| dispatch.rt_backfill | Boolean | See docs | — | Whether to back fill the real time window for this search. Parameter valid only if this is a real time search. Defaults to 0. |
| dispatch.rt_maximum_span | Number | See docs | — | Allows for a per-job override of the [search] indexed_realtime_maximum_span setting in limits.conf . Default for saved searches is "unset", falling back to the limits.conf setting. |
| dispatch.sample_ratio | Number | See docs | — | The integer value used to calculate the sample ratio. The formula is 1 / <integer> . |
| dispatch.spawn_process | Boolean | See docs | — | This parameter is deprecated and will be removed in a future release. Do not use this parameter. Specifies whether a new search process spawns when this saved search is executed. Defaults to 1. Searches against indexes must run in a separate process. |
| dispatch.time_format | String | See docs | — | A time format string that defines the time format for specifying the earliest and latest time. Defaults to %FT%T.%Q%:z |
| dispatch.ttl | Number | See docs | — | Valid values: Integer[p]. Defaults to 2p. Indicates the time to live (in seconds) for the artifacts of the scheduled search, if no actions are triggered. If an action is triggered, the ttl changes to that action ttl. If multiple actions are triggered, the maximum ttl is applied to the artifacts. To set the action ttl, refer to alert_actions.conf.spec . If the integer is followed by the letter 'p', the ttl is handled as a multiple of the scheduled search period. |
| dispatchAs | String | See docs | — | When the saved search is dispatched using the "saved/searches/{name}/dispatch" endpoint, this setting controls what user that search is dispatched as. Only meaningful for shared saved searches. Can be set to owner or user . |
| displayview | String | See docs | — | Defines the default UI view name (not label) in which to load the results. Accessibility is subject to the user having sufficient permissions. |
| durable.backfill_type | String | See docs | — | Specifies how the Splunk software backfills the lost search results of failed scheduled search jobs. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . Valid values are auto , time_interval , and time_whole . time_whole - The Splunk software schedules a single backfill search job with a time range that spans the combined time ranges of all failed scheduled search jobs. The time_whole setting can be applied only to searches that are streaming, where the results are raw events without additional aggregation. time_interval - The Splunk software schedules multiple backfill search jobs, one for each failed scheduled search job. The backfill jobs have time ranges that match those of the failed jobs. The time_interval setting can be applied to both streaming and non-streaming searches. auto - The Splunk software decides the backfill type by checking whether the search is streaming or not. If the search is streaming, the Splunk software uses the time_whole backfill type. Otherwise, it uses the time_interval backfill type. |
| durable.lag_time | Number | See docs | — | Specifies the search time delay, in seconds, that a durable search uses to catch events that are ingested or indexed late. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.max_backfill_intervals | Number | See docs | — | Specifies the maximum number of cron intervals (previous scheduled search jobs) that the Splunk software can attempt to backfill for this search, when those jobs have incomplete events. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |
| durable.track_time_type | String | See docs | — | Indicates that a scheduled search is durable and specifies how the search tracks events. A durable search is a search that tries to ensure the delivery of all results, even when the search process is slowed or stopped by runtime issues like rolling restarts, network bottlenecks, and even downed servers. Applies only to scheduled searches. A value of _time means the durable search tracks each event by its event timestamp , based on time information included in the event. A value of _indextime means the durable search tracks each event by its indexed timestamp. The search is not durable if this setting is unset or is set to none . |
| is_scheduled | Boolean | See docs | — | Whether this search is to be run on a schedule |
| is_visible | Boolean | See docs | — | Specifies whether this saved search should be listed in the visible saved search list. Defaults to 1. |
| max_concurrent | Number | See docs | — | The maximum number of concurrent instances of this search the scheduler is allowed to run. Defaults to 1. |
| next_scheduled_time | String | See docs | — | Read-only attribute. Value ignored on POST. There are some old clients who still send this value |
| qualifiedSearch | String | See docs | — | Read-only attribute. Value ignored on POST. The value is computed during runtime. |
| realtime_schedule | Boolean | See docs | — | Defaults to 1. Controls the way the scheduler computes the next execution time of a scheduled search. If this value is set to 1, the scheduler bases its determination of the next scheduled search execution time on the current time. If this value is set to 0, the scheduler bases its determination of the next scheduled search on the last search execution time. This is called continuous scheduling. If set to 0, the scheduler never skips scheduled execution periods. However, the execution of the saved search might fall behind depending on the scheduler load. Use continuous scheduling whenever you enable the summary index option. If set to 1, the scheduler might skip some execution periods to make sure that the scheduler is executing the searches running over the most recent time range. The scheduler tries to execute searches that have realtime_schedule set to 1 before it executes searches that have continuous scheduling (realtime_schedule = 0). |
| request.ui_dispatch_app | String | See docs | — | Specifies a field used by Splunk Web to denote the app this search should be dispatched in. |
| request.ui_dispatch_view | String | See docs | — | Specifies a field used by Splunk Web to denote the view this search should be displayed in. |
| restart_on_searchpeer_add | Boolean | See docs | — | Specifies whether to restart a real-time search managed by the scheduler when a search peer becomes available for this saved search. Defaults to 1. Note: The peer can be a newly added peer or a peer down and now available. |
| run_n_times | Number | See docs | — | Runs this search exactly the specified number of times. Does not run the search again until the Splunk platform is restarted. |
| run_on_startup | Boolean | See docs | — | Indicates whether this search runs at startup. If it does not run on startup, it runs at the next scheduled time. Defaults to 0. Set to 1 for scheduled searches that populate lookup tables. |
| schedule_window | Number or auto | See docs | — | Time window (in minutes) during which the search has lower priority. Defaults to 0. The scheduler can give higher priority to more critical searches during this window. The window must be smaller than the search period. Set to auto to let the scheduler determine the optimal window value automatically. Requires the edit_search_schedule_window capability to override auto . |
| search | String | See docs | — | Required. The search to save. |
| schedule_priority | See description | See docs | — | Raises the scheduling priority of the named search. Use one of the following options. default No scheduling priority increase. higher Scheduling priority is higher than other searches of the same scheduling tier. While there are four tiers of priority for scheduled searches, only the following search types are affected by this property. real-time scheduled (realtime_schedule=1). continuous scheduled (realtime_schedule=0). highest Scheduling priority is higher than other searches regardless of scheduling tier. However, real-time-scheduled searches with priority = highest always have priority over continuous scheduled searches with priority = highest . Requires the search owner to have the edit_search_schedule_priority capability in order to make non-default settings. Defaults to default . For more details, see savedsearches.conf.spec . |
| vsid | String | See docs | — | Defines the viewstate id associated with the UI view listed in 'displayview'. Must match up to a stanza in viewstates.conf. |
| workload_pool | String | See docs | — | Specifies the new workload pool where the existing running search will be placed. |
| action.<action_name> | Indicates whether the <action_name> is enabled or disabled for a particular search. For more information about the alert action options see the alert_actions.conf file. |  |  |  |
| action.<action_name>.<parameter> | Overrides the setting defined for an action in the alert_actions.conf file with a new setting that is valid only for the search configuration to which it is applied. |  |  |  |
| action.email | Indicates the state of the email action. |  |  |  |
| action.email.auth_password | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here and it is encrypted on the next restart. Defaults to empty string. |  |  |  |
| action.email.auth_username | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |  |  |  |
| action.email.bcc | BCC email address to use if action.email is enabled. |  |  |  |
| action.email.cc | CC email address to use if action.email is enabled. |  |  |  |
| action.email.command | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |  |  |  |
| action.email.format | Specify the format of text in the email. This value also applies to any attachments.< Valid values: (plain \| html \| raw \| csv) |  |  |  |
| action.email.from | Email address from which the email action originates. Defaults to splunk@$LOCALHOST or whatever value is set in alert_actions.conf. |  |  |  |
| action.email.hostname | Sets the hostname used in the web link (url) sent in email actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) When this value is a simple hostname, the protocol and port which are configured within splunk are used to construct the base of the url. When this value begins with ' http://' , it is used verbatim. NOTE: This means the correct port must be specified if it is not the default port for http or https. This is useful in cases when the Splunk server is not aware of how to construct a url that can be referenced externally, such as SSO environments, other proxies, or when the server hostname is not generally resolvable. Defaults to current hostname provided by the operating system, or if that fails "localhost". When set to empty, default behavior is used. |  |  |  |
| action.email.inline | Indicates whether the search results are contained in the body of the email. Results can be either inline or attached to an email. See action.email.sendresults. |  |  |  |
| action.email.mailserver | Set the address of the MTA server to be used to send the emails. Defaults to <LOCALHOST> (or whatever is set in alert_actions.conf). |  |  |  |
| action.email.maxresults | Sets the global maximum number of search results to send when email.action is enabled. |  |  |  |
| action.email.maxtime | Specifies the maximum amount of time the execution of an email action takes before the action is aborted. |  |  |  |
| action.email.pdfview | The name of the view to deliver if sendpdf is enabled |  |  |  |
| action.email.preprocess_results | Search string to preprocess results before emailing them. Defaults to empty string (no preprocessing). Usually the preprocessing consists of filtering out unwanted internal fields. |  |  |  |
| action.email.reportCIDFontList | Space-separated list. Specifies the set (and load order) of CID fonts for handling Simplified Chinese(gb), Traditional Chinese(cns), Japanese(jp), and Korean(kor) in Integrated PDF Rendering. If multiple fonts provide a glyph for a given character code, the glyph from the first font specified in the list is used. To skip loading any CID fonts, specify the empty string. Default value: "gb cns jp kor" |  |  |  |
| action.email.reportIncludeSplunkLogo | Indicates whether to include the Splunk logo with the report. |  |  |  |
| action.email.reportPaperOrientation | Specifies the paper orientation: portrait or landscape. |  |  |  |
| action.email.reportPaperSize | Specifies the paper size for PDFs. Defaults to letter. Valid values: (letter \| legal \| ledger \| a2 \| a3 \| a4 \| a5) |  |  |  |
| action.email.reportServerEnabled | Not supported. |  |  |  |
| action.email.reportServerURL | Not supported. |  |  |  |
| action.email.sendpdf | Indicates whether to create and send the results as a PDF. |  |  |  |
| action.email.sendresults | Indicates whether to attach the search results in the email. Results can be either attached or inline. See action.email.inline. |  |  |  |
| action.email.subject | Specifies an email subject. Defaults to SplunkAlert-<savedsearchname>. |  |  |  |
| action.email.to | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |  |  |  |
| action.email.track_alert | Indicates whether the execution of this action signifies a trackable alert. |  |  |  |
| action.email.ttl | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |  |  |  |
| action.email.use_ssl | Indicates whether to use SSL when communicating with the SMTP server. |  |  |  |
| action.email.use_tls | Indicates whether to use TLS (transport layer security) when communicating with the SMTP server (starttls). |  |  |  |
| action.email.width_sort_columns | Indicates whether columns should be sorted from least wide to most wide, left to right. Only valid if format=text. |  |  |  |
| action.populate_lookup | Indicates the state of the populate lookup action. |  |  |  |
| action.populate_lookup.command | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |  |  |  |
| action.populate_lookup.dest | Lookup name of path of the lookup to populate. |  |  |  |
| action.populate_lookup.hostname | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |  |  |  |
| action.populate_lookup.maxresults | The maximum number of search results sent using alerts. |  |  |  |
| action.populate_lookup.maxtime | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. Valid values are: Integer[m\|s\|h\|d] |  |  |  |
| action.populate_lookup.track_alert | Indicates whether the execution of this action signifies a trackable alert. |  |  |  |
| action.populate_lookup.ttl | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, then this specifies the number of scheduled periods. Defaults to 10p. If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p] |  |  |  |
| action.rss | Indicates the state of the RSS action. |  |  |  |
| action.rss.command | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |  |  |  |
| action.rss.hostname | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |  |  |  |
| action.rss.maxresults | Sets the maximum number of search results sent using alerts. |  |  |  |
| action.rss.maxtime | Sets the maximum amount of time the execution of an action takes before the action is aborted. Valid values are Integer[m \|s \|h \|d]. |  |  |  |
| action.rss.track_alert | Indicates whether the execution of this action signifies a trackable alert. |  |  |  |
| action.rss.ttl | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |  |  |  |
| action.script | Indicates the state of the script for this action. |  |  |  |
| action.script.command | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |  |  |  |
| action.script.filename | File name of the script to call. Required if script action is enabled |  |  |  |
| action.script.hostname | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |  |  |  |
| action.script.maxresults | Sets the maximum number of search results sent using alerts. |  |  |  |
| action.script.maxtime | Sets the maximum amount of time the execution of an action takes before the action is aborted. |  |  |  |
| action.script.track_alert | Indicates whether the execution of this action signifies a trackable alert. |  |  |  |
| action.script.ttl | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 600 (10 minutes). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |  |  |  |
| action.summary_index | Indicates the state of the summary index. |  |  |  |
| action.summary_index._name | Specifies the name of the summary index where the results of the scheduled search are saved. Defaults to "summary." |  |  |  |
| action.summary_index.command | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |  |  |  |
| action.summary_index.hostname | Sets the hostname used in the web link (url) sent in alert actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) See action.email.hostname for details. |  |  |  |
| action.summary_index.inline | Determines whether to execute the summary indexing action as part of the scheduled search. Note: This option is considered only if the summary index action is enabled and is always executed (in other words, if counttype = always). |  |  |  |
| action.summary_index.maxresults | Sets the maximum number of search results sent using alerts. |  |  |  |
| action.summary_index.maxtime | Sets the maximum amount of time the execution of an action takes before the action is aborted. Defaults to 5m. Valid values are: Integer[m\|s\|h\|d] |  |  |  |
| action.summary_index.track_alert | Indicates whether the execution of this action signifies a trackable alert. |  |  |  |
| action.summary_index.ttl | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows Integer, specifies the number of scheduled periods. Defaults to 10p. If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are: Integer[p] |  |  |  |
| actions | Actions triggerd by this alert. |  |  |  |
| alert.digest_mode | Indicates if the alert actions are applied to the entire result set or to each individual result. |  |  |  |
| alert.expires | Sets the period of time to show the alert in the dashboard. Defaults to 24h. Use [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. Valid values: [number][time-unit] |  |  |  |
| alert.severity | Valid values: (1 \| 2 \| 3 \| 4 \| 5 \| 6) Sets the alert severity level. Valid values are: 1 DEBUG 2 INFO 3 WARN 4 ERROR 5 SEVERE 6 FATAL |  |  |  |
| alert.suppress | Indicates whether alert suppression is enabled for this schedules search. |  |  |  |
| alert.suppress.fields | Fields to use for suppression when doing per result alerting. Required if suppression is turned on and per result alerting is enabled. |  |  |  |
| alert.suppress.period | Specifies the suppresion period. Only valid if alert.supress is enabled. Uses [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |  |  |  |
| alert.track | Specifies whether to track the actions triggered by this scheduled search. auto - determine whether to track or not based on the tracking setting of each action, do not track scheduled searches that always trigger actions. true - force alert tracking. false - disable alert tracking for this search. |  |  |  |
| alert_comparator | One of the following strings: greater than, less than, equal to, rises by, drops by, rises by perc, drops by perc |  |  |  |
| alert_condition | A conditional search that is evaluated against the results of the saved search. Defaults to an empty string. Alerts are triggered if the specified search yields a non-empty search result list. Note: If you specify an alert_condition, do not set counttype, relation, or quantity. |  |  |  |
| alert_threshold | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to "rises by perc" or "drops by perc." |  |  |  |
| alert_type | What to base the alert on, overriden by alert_condition if it is specified. Valid values are: always, custom, number of events, number of hosts, number of sources. |  |  |  |
| allow_skew | 0 \| <percentage> \| <duration> Allows the search scheduler to distribute scheduled searches randomly and more evenly over their specified search periods. CAUTION: This setting does not require adjusting in most use cases. Check with an admin before making any updates. When set to a non-zero value for searches with the following cron_schedule values, the search scheduler randomly skews the second, minute, and hour on which the search runs. CODE Copy * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). * * * * * Every minute. */M * * * * Every M minutes (M > 0). 0 * * * * Every hour. 0 */H * * * Every H hours (H > 0). 0 0 * * * Every day (at midnight). When set to a non-zero value for a search that has any other cron_schedule setting, the search scheduler can randomly skew only the second on which the search runs. The amount of skew for a specific search remains constant between edits of the search. A value of 0 disallows skew. 0 is the default setting. Percentage <int> followed by % specifies the maximum amount of time to skew as a percentage of the scheduled search period. Duration <int><unit> specifies a maximum duration. The <unit> can be omitted only when the <int> is 0 (which disables skew). Valid duration units: m min minute mins minutes h hr hour hrs hours d day days Examples CODE Copy 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum 100% (for an every-5-minute search) = 5 minutes maximum 50% (for an every-minute search) = 30 seconds maximum 5m = 5 minutes maximum 1h = 1 hour maximum |  |  |  |
| args.* | Wildcard argument that accepts any saved search template argument, such as args.username=foobar when the search is search $username$. |  |  |  |
| auto_summarize | Indicates whether the scheduler should ensure that the data for this search is automatically summarized. |  |  |  |
| auto_summarize.command | A search template that constructs the auto summarization for this search. Caution: Advanced feature. Do not change unless you understand the architecture of auto summarization of saved searches. |  |  |  |
| auto_summarize.cron_schedule | Cron schedule that probes and generates the summaries for this saved search. |  |  |  |
| auto_summarize.dispatch.earliest_time | A time string that specifies the earliest time for summarizing this search. Can be a relative or absolute time. |  |  |  |
| auto_summarize.dispatch.latest_time | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. |  |  |  |
| auto_summarize.dispatch.time_format | Time format used to specify the earliest and latest times. |  |  |  |
| auto_summarize.dispatch.ttl | Indicates the time to live (in seconds) for the artifacts of the summarization of the scheduled search. If the integer is followed by the letter 'p', the ttl is interpreted as a multiple of the scheduled search period. |  |  |  |
| auto_summarize.max_disabled_buckets | The maximum number of buckets with the suspended summarization before the summarization search is completely stopped, and the summarization of the search is suspended for auto_summarize.suspend_period. |  |  |  |
| auto_summarize.max_summary_ratio | The maximum ratio of summary_size/bucket_size, which specifies when to stop summarization and deem it unhelpful for a bucket. Note: The test is only performed if the summary size is larger than auto_summarize.max_summary_size. |  |  |  |
| auto_summarize.max_summary_size | The minimum summary size, in bytes, before testing whether the summarization is helpful. |  |  |  |
| auto_summarize.max_time | Maximum time (in seconds) that the summary search is allowed to run. Note: This is an approximate time. The summary search stops at clean bucket boundaries. |  |  |  |
| auto_summarize.suspend_period | Time specifier indicating when to suspend summarization of this search if the summarization is deemed unhelpful. |  |  |  |
| auto_summarize.timespan | The list of time ranges that each summarized chunk should span. This comprises the list of available granularity levels for which summaries would be available. For example a timechart over the last month whose granularity is at the day level should set this to 1d. If you need the same data summarized at the hour level for weekly charts, use: 1h,1d. |  |  |  |
| cron_schedule | The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. Valid values: cron string |  |  |  |
| description | Description of this saved search. Defaults to empty string. |  |  |  |
| disabled | Indicates if this saved search is disabled. |  |  |  |
| dispatch.* | * represents any custom dispatch field. |  |  |  |
| dispatch.buckets | The maximum nuber of timeline buckets. |  |  |  |
| dispatch.earliest_time | A time string that specifies the earliest time for this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |  |  |  |
| dispatch.indexedRealtime | Indicates whether to used indexed-realtime mode when doing real-time searches. |  |  |  |
| dispatch.latest_time | A time string that specifies the latest time for the saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |  |  |  |
| dispatch.lookups | Indicates if lookups are enabled for this search. |  |  |  |
| dispatch.max_count | The maximum number of results before finalizing the search. |  |  |  |
| dispatch.max_time | Indicates the maximum amount of time (in seconds) before finalizing the search. |  |  |  |
| dispatch.reduce_freq | Specifies how frequently the MapReduce reduce phase runs on accumulated map values. |  |  |  |
| dispatch.rt_backfill | Indicates whether to back fill the real time window for this search. Parameter valid only if this is a real time search |  |  |  |
| dispatch.spawn_process | This parameter is deprecated and will be removed in a future release. Do not use this parameter. Indicates whether a new search process spawns when this saved search is executed. |  |  |  |
| dispatch.time_format | Time format string that defines the time format for specifying the earliest and latest time. |  |  |  |
| dispatch.ttl | Indicates the time to live (in seconds) for the artifacts of the scheduled search, if no actions are triggered. If an action is triggered, the action ttl is used. If multiple actions are triggered, the maximum ttl is applied to the artifacts. To set the action ttl, refer to alert_actions.conf.spec . If the integer is followed by the letter 'p', the ttl is interpreted as a multiple of the scheduled search period. |  |  |  |
| displayview | Defines the default UI view name (not label) in which to load the results. Accessibility is subject to the user having sufficient permissions. |  |  |  |
| durable.backfill_type | Specifies how the Splunk software backfills the lost search results of failed scheduled search jobs. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . Valid values are auto , time_interval , and time_whole . |  |  |  |
| durable.lag_time | Specifies the search time delay, in seconds, that a durable search uses to catch events that are ingested or indexed late. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |  |  |  |
| durable.max_backfill_intervals | Specifies the maximum number of cron intervals (previous scheduled search jobs) that the Splunk software can attempt to backfill for this search, when those jobs have incomplete events. Applies only to scheduled searches that have a valid setting other than none for durable.track_time_type . |  |  |  |
| durable.track_time_type | Indicates that a scheduled search is durable and specifies how the search tracks events. A value of _time means the durable search tracks each event by its event timestamp , based on time information included in the event. A value of _indextime means the durable search tracks each event by its indexed timestamp. The search is not durable if this setting is unset or is set to none . |  |  |  |
| is_scheduled | Indicates if this search is to be run on a schedule. |  |  |  |
| is_visible | Indicates if this saved search appears in the visible saved search list. |  |  |  |
| max_concurrent | The maximum number of concurrent instances of this search the scheduler is allowed to run. |  |  |  |
| next_scheduled_time | The time when the scheduler runs this search again. |  |  |  |
| qualifiedSearch | The exact search string that the scheduler would run. |  |  |  |
| realtime_schedule | Controls the way the scheduler computes the next execution time of a scheduled search. If this value is set to 1, the scheduler bases its determination of the next scheduled search execution time on the current time. If this value is set to 0, the scheduler bases its determination of the next scheduled search on the last search execution time. This is called continuous scheduling. If set to 0, the scheduler never skips scheduled execution periods. However, the execution of the saved search might fall behind depending on the scheduler load. Use continuous scheduling whenever you enable the summary index option. If set to 1, the scheduler might skip some execution periods to make sure that the scheduler is executing the searches running over the most recent time range. The scheduler tries to execute searches that have realtime_schedule set to 1 before it executes searches that have continuous scheduling (realtime_schedule = 0). |  |  |  |
| request.ui_dispatch_app | A field used by Splunk Web to denote the app this search should be dispatched in. |  |  |  |
| request.ui_dispatch_view | Specifies a field used by Splunk Web to denote the view this search should be displayed in. |  |  |  |
| restart_on_searchpeer_add | Indicates whether to restart a real-time search managed by the scheduler when a search peer becomes available for this saved search. Note: The peer can be a newly added peer or a peer down and now available. |  |  |  |
| run_on_startup | Indicates whether this search runs on startup. If it does not run on startup, it runs at the next scheduled time. Splunk recommends that you set run_on_startup to true for scheduled searches that populate lookup tables. |  |  |  |
| schedule_window | Time window (in minutes) during which the search has lower priority. The scheduler can give higher priority to more critical searches during this window. The window must be smaller than the search period. If set to auto , the scheduler prioritizes searches automatically. |  |  |  |
| search | Search expression to filter the response. The response matches field values against the search expression. For example: search=foo matches any object that has "foo" as a substring in a field. search=field_name%3Dfield_value restricts the match to a single field. URI-encoding is required in this example. |  |  |  |
| vsid | The viewstate id associated with the UI view listed in 'displayview'. Matches to a stanza in viewstates.conf. |  |  |  |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:chang2me https://fool01:8092/services/saved/searches/test_durable  -d durable.track_time_type=_time -d durable.max_backfill_intervals=100  -d durable.lag_time=30 -d durable.backfill_type=time_interval
```



---

## `/services/saved/searches/{name}/acknowledge`

Acknowledge the {name} saved search alert suppression.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches/{name}/acknowledge` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/saved/searches/{name}/acknowledge`

Acknowledge the {name} saved search alert suppression and resume alerting.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| key | String | No |  | The suppression key used in field-based suppression. For example, in host-based suppression, with data from 5 hosts, the key is the host, as each host could have different suppression expiration times. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/searches/MyAlert/acknowledge -X POST
```



---

## `/services/saved/searches/{name}/dispatch`

Dispatch the {name} saved search.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches/{name}/dispatch` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/saved/searches/{name}/dispatch`

Dispatch the {name} saved search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| args.* |  | No |  | Arg values to create a saved search if the saved search is a template search. For example, specify arg.index_name to create the following search: search index=$args.index_name$ \| ... |
| dispatchAs | String | No | "owner" \| "user" | Indicate the user context, quota, and access rights for the saved search. The saved search runs according to the context indicated. |
| dispatch.* | String | No |  | Any dispatch.* field of the search that needs to be overridden when running the summary search. |
| dispatch.adhoc_search_level | String | No |  | Use one of the following search modes. CODE Copy [ verbose \| fast \| smart ] [ verbose \| fast \| smart ] |
| dispatch.now | Boolean | No |  | Dispatch the search as if the specified time for this parameter was the current time. |
| force_dispatch | Boolean | No |  | Indicates whether to start a new search even if another instance of this search is already running. |
| now | String | No |  | [Deprecated] Use dispatch.now . |
| replay_speed | Number greater than 0 | No |  | Indicate a real-time search replay speed factor. For example, 1 indicates normal speed. 0.5 indicates half of normal speed, and 2 indicates twice as fast as normal. earliest_time and latest_time arguments must indicate a real-time time range to use replay options. Use replay_speed with replay_et and replay_lt relative times to indicate a speed and time range for the replay. For example, CODE Copy replay_speed = 10 replay_et = -d@d replay_lt = -@d replay_speed = 10 replay_et = -d@d replay_lt = -@d specifies a replay at 10x speed, as if the "wall clock" time starts yesterday at midnight and ends when it reaches today at midnight. For more information about using relative time modifiers, see Search time modifiers in the Search reference . |
| replay_et | Time modifier string | No |  | Relative "wall clock" start time for the replay. |
| replay_lt | Time modifier string. | No |  | Relative end time for the replay clock. The replay stops when clock time reaches this time. |
| trigger_actions | Boolean | No |  | Indicates whether to trigger alert actions. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/searches/MySavedSearch/dispatch -d trigger_actions=1
```



---

## `/services/saved/searches/{name}/history`

List available search jobs created from the {name} saved search.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches/{name}/history` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/saved/searches/{name}/history`

List available search jobs created from the {name} saved search.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| savedsearch | String triplet consisting of user:app:search_name . The triplet constitutes a unique identifier for accessing saved search history. Passing in this parameter can help you work around saved search access limitations in search head clustered deployments. As an example, the following parameter triplet represents an admin user, the search app context, and a search named Splunk errors last 24 hours . CODE Copy savedsearch=admin:search:Splunk%20errors%20last%2024%20hours savedsearch=admin:search:Splunk%20errors%20last%2024%20hours |  |  |  |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| durableTrackTime | varies | The durable cursor timestamp for the search job, expressed in UNIX Epoch time notation (elapsed time since 1/1/1970). If durableTrackType=_indextime , this timestamp is associated with the indexed timestamp of the events returned by the job. If durableTrackType=_time , this timestamp is associated with the event timestamp of the events returned by the job. |
| durableTrackType | varies | Indicates that a scheduled search is durable and specifies how the search tracks events. A value of _time means the durable search tracks each event by its event timestamp , based on time information included in the event. A value of _indextime means the durable search tracks each event by its indexed timestamp. The search is not durable if this setting is unset or is set to none . |
| earliest_time | varies | The earliest time a search job is configured to start. |
| isDone | varies | Indicates if the search has completed. |
| isFinalized | varies | Indicates if the search was finalized (stopped before completion). |
| isRealTimeSearch | varies | Indicates if the search is a real time search. |
| isSaved | varies | Indicates if the search is saved indefinitely. |
| isScheduled | varies | Indicates if the search is a scheduled search. |
| isZombie | varies | Indicates if the process running the search is dead, but with the search not finished. |
| latest_time | varies | The latest time a search job is configured to start. |
| listDefaultActionArgs | varies | List default values of actions.*, even though some of the actions may not be specified in the saved search. |
| ttl | varies | The time to live, or time before the search job expires after it completes. |

#### Example

```
curl -k -u admin:pass https://fool01:8092/services/saved/searches/summary_durable/history
```



---

## `/services/saved/searches/{name}/reschedule`

Set {name} scheduled saved search to start at a specific time and then run on its schedule thereafter.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches/{name}/reschedule` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/saved/searches/{name}/reschedule`

Define a new start time for a scheduled saved search. Usage details

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| schedule_time | Timestamp | No |  | The next time to run the search. The timestamp can be in one of three formats: ISO8601 format (adjusted for UTC time), UNIX time format, or relative time format. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | XML Request |
| *(notes)* | text | XML Response |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/saved/searches/Purchased%20products%2C%20last%2024%20hours/reschedule -d schedule_time=schedule_time=2018-08-15T14:11:01-08:00
```



---

## `/services/saved/searches/{name}/scheduled_times`

Get the {name} saved search scheduled time.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches/{name}/scheduled_times` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/saved/searches/{name}/scheduled_times`

Access {name} saved search scheduled time.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| earliest_time | String | Yes |  | Absolute or relative earliest time |
| latest_time | String | Yes |  | Absolute or relative latest time |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.email | varies | Indicates the state of the email action. |
| action.email.auth_password | varies | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here that is encrypted on the next platform restart. Defaults to empty string. |
| action.email.auth_username | varies | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |
| action.email.pdfview | varies | The name of the view to deliver if sendpdf is enabled. |
| action.email.subject | varies | Specifies an email subject. Defaults to SplunkAlert-<savedsearchname>. |
| action.email.to | varies | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |
| action.summary_index | varies | The state of the summary index action. |
| action.summary_index._name | varies | Specifies the name of the summary index where the results of the scheduled search are saved. Defaults to "summary." |
| actions | varies | Actions triggered by this alert. |
| alert.digest_mode | varies | Indicates if alert actions are applied to the entire result set or to each individual result. |
| alert.expires | varies | Sets the period of time to show the alert in the dashboard. Defaults to 24h. Uses [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.severity | varies | Valid values: (1 \| 2 \| 3 \| 4 \| 5 \| 6) Sets the alert severity level. Valid values are: 1 DEBUG 2 INFO 3 WARN 4 ERROR 5 SEVERE 6 FATAL |
| alert.suppress | varies | Indicates whether alert suppression is enabled for this schedules search. |
| alert.suppress.fields | varies | Fields to use for suppression when doing per result alerting. Required if suppression is turned on and per result alerting is enabled. |
| alert.suppress.period | varies | Specifies the suppression period. Only valid if alert.supress is enabled. Use [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| alert.track | varies | Specifies whether to track the actions triggered by this scheduled search. auto - determine whether to track or not based on the tracking setting of each action, do not track scheduled searches that always trigger actions. true - force alert tracking. false - disable alert tracking for this search. |
| alert_comparator | varies | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to "rises by perc" or "drops by perc." |
| alert_condition | varies | A conditional search that is evaluated against the results of the saved search. Defaults to an empty string. Alerts are triggered if the specified search yields a non-empty search result list. Note: If you specify an alert_condition, do not set counttype, relation, or quantity. |
| alert_threshold | varies | Valid values are: Integer[%] Specifies the value to compare (see alert_comparator) before triggering the alert actions. If expressed as a percentage, indicates value to use when alert_comparator is set to "rises by perc" or "drops by perc." |
| alert_type | varies | What to base the alert on, overridden by alert_condition if it is specified. Valid values are: always, custom, number of events, number of hosts, number of sources. |
| cron_schedule | varies | The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. Valid values: cron string |
| description | varies | Description of the saved search. |
| disabled | varies | Indicates if this saved search is disabled. |
| dispatch.buckets | varies | The maximum number of timeline buckets. |
| dispatch.earliest_time | varies | A time string that specifies the earliest time for this search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.latest_time | varies | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| dispatch.lookups | varies | Indicates if lookups are enabled for this search. |
| dispatch.max_count | varies | The maximum number of results before finalizing the search. |
| dispatch.max_time | varies | Indicates the maximum amount of time (in seconds) before finalizing the search |
| earliest_time | varies | For scheduled searches display all the scheduled times starting from this time. |
| is_scheduled | varies | Indicates if this search is to be run on a schedule. |
| is_visible | varies | Indicates if this saved search appears in the visible saved search list. |
| latest_time | varies | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| listDefaultActionArgs | varies | List default values of actions.*, even though some of the actions may not be specified in the saved search. |
| max_concurrent | varies | The maximum number of concurrent instances of this search the scheduler is allowed to run. |
| next_scheduled_time | varies | The time when the scheduler runs this search again. |
| qualifiedSearch | varies | The exact search command for this saved search. |
| realtime_schedule | varies | Controls the way the scheduler computes the next execution time of a scheduled search. If this value is set to 1, the scheduler bases its determination of the next scheduled search execution time on the current time. If this value is set to 0, the scheduler bases its determination of the next scheduled search on the last search execution time. This is called continuous scheduling. If set to 0, the scheduler never skips scheduled execution periods. However, the execution of the saved search might fall behind depending on the scheduler load. Use continuous scheduling whenever you enable the summary index option. If set to 1, the scheduler might skip some execution periods to make sure that the scheduler is executing the searches running over the most recent time range. The scheduler tries to execute searches that have realtime_schedule set to 1 before it executes searches that have continuous scheduling (realtime_schedule = 0). |
| request.ui_dispatch_app | varies | A field used by Splunk Web to denote the app this search should be dispatched in. |
| request.ui_dispatch_view | varies | A field used by Splunk Web to denote the app this search should be dispatched in. |
| restart_on_searchpeer_add | varies | Indicates whether to restart a real-time search managed by the scheduler when a search peer becomes available for this saved search. Note: The peer can be a newly added peer or a peer down and now available. |
| run_on_startup | varies | Indicates whether this search runs on startup. If it does not run on startup, it runs at the next scheduled time. Splunk recommends that you set run_on_startup to true for scheduled searches that populate lookup tables. |
| scheduled_times | varies | The times when the scheduler runs the search. |
| search | varies | Search expression to filter the response. The response matches field values against the search expression. For example: search=foo matches any object that has "foo" as a substring in a field. search=field_name%3Dfield_value restricts the match to a single field. URI-encoding is required in this example. |
| vsid | varies | The viewstate id associated with the Splunk Web view listed in 'displayview'. Matches to a stanza in viewstates.conf. |
| *(notes)* | text | Application usage |
| *(notes)* | text | XML Response |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/saved/searches/_ScheduledView__dashboard_live/scheduled_times --get -d earliest_time=-5h -d latest_time=-3h
```



---

## `/services/saved/searches/{name}/suppress`

Get the {name} saved search alert suppression state.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/searches/{name}/suppress` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/saved/searches/{name}/suppress`

Get the {name} saved search alert suppression state.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| expiration | String | No |  | Indicates the time the suppression period expires. |
| key |  | No |  |  |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| earliest_time | varies | For scheduled searches display all the scheduled times starting from this time. |
| expiration | varies | Sets the period of time to show the alert in the dashboard. Defaults to 24h. Uses [number][time-unit] to specify a time. For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour. |
| latest_time | varies | A time string that specifies the latest time for this saved search. Can be a relative or absolute time. If this value is an absolute time, use the dispatch.time_format to format the value. |
| listDefaultActionArgs | varies | List default values of actions.*, even though some of the actions may not be specified in the saved search. |
| suppressed | varies | Indicates if alert suppression is enabled for this search. |
| suppressionKey | varies | A combination of all the values of the suppression fields (or the combinations MD5), if fields were specified. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/saved/searches/MySavedSearch/suppress
```



---
