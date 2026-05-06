# savedsearches.conf

Reference for `savedsearches.conf` (Splunk Enterprise).

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Search |
| Restart required | No (reload via REST or UI) |
| Related files | alert_actions.conf, macros.conf, transforms.conf |

## Stanzas and settings

### `[default]`

Optional global defaults for saved searches.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[<stanza_name>]`

Each stanza is one saved search, scheduled report, or alert; settings below apply per stanza.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Disable your search by setting 'disabled=true'. You cannot run a disabled search. |
| `search` | `<string>` | (none) | The actual search string for the saved search. For example, 'search = index::sampledata http NOT 500'. |
| `dispatchAs` | `[user|owner]` | owner | Determines which user a saved search is dispatched as, when a search is This setting only applies to shared saved searches. When dispatched as "user", the search is run as if the requesting user owned When dispatched as "owner", the search is run as if the owner of the search If the... |
| `federated_providers` | `<string>` | (none) | Specifies a comma-separated list of federated provider names that this saved Supports exact provider names as well as the use of wildcards (*) to Examples: "rsh1,rsh2" or "rsh*,provider_test" or "*_prod" Provider names must match those configured in 'federated.conf' for this |
| `enableSched` | `[0 | 1]` | 0 | Specifies whether or not to run the search on a schedule. The only acceptable values for this setting are 0 and 1. |
| `cron_schedule` | `<cron string>` | (none) | The cron schedule that is used to run this search. For example: */5 * * * * causes the search to run every 5 minutes. |
| `schedule` | `<cron-style string>` | — | This setting is DEPRECATED as of version 4.0. For more information, see the pre-4.0 spec file. |
| `allow_skew` | `<percentage>|<duration-specifier>` | 0 | Lets the search scheduler randomly distribute scheduled searches more evenly When set to non-zero for searches with the following cron_schedule values, * * * * Every minute. /M * * * * Every M minutes (M > 0). |
| `allow_data_time_skew` | `<boolean>` | false | Whether or not a search can dynamically adjust its time range based on A value of "true" means that a search can dynamically adjust its A value of "false" or no value means that the search does not adjust Use this setting to prioritize low search latencies over For example, if this setting has a value of "true", a... |
| `max_concurrent` | `<unsigned integer>` | 1 | The maximum number of concurrent instances of this search that the scheduler |
| `realtime_schedule` | `<boolean>` | true | Controls the way the scheduler computes the next run time of a scheduled When set to 'true', the scheduler determines the next scheduled search run When set to 'false', the scheduler determines the next scheduled search run Use continuous scheduling whenever you enable the 'summary index' option. The scheduler... |
| `schedule_priority` | `[default | higher | highest]` | default | Raises the scheduling priority of a search: When set to "default", this setting specifies that there is no increase to When set to "higher", this setting specifies that the scheduling priority When set to "highest", this setting specifies that the scheduling priority The high-to-low order is: The scheduler honors a... |
| `schedule_window` | `<unsigned integer> | auto` | 0 for searches that are owned by users with the | When 'schedule_window' is non-zero, it indicates to the scheduler that the When 'schedule_window' is set to an integer greater than 0, it specifies the The 'schedule_window' must be shorter than the period of the search. Schedule windows are not recommended for searches that run every minute. |
| `schedule_as` | `[auto|classic|prjob]` | 'auto' | Specifies whether a scheduled search should use parallel reduce search When set to 'auto', the Splunk software determines automatically whether When set to 'classic', the Splunk software is forced to NOT use parallel reduce When set to 'prjob', the Splunk software is forced to use parallel reduce |
| `workload_pool` | `<name of workload pool>` | — | Specifies the name of the workload pool to be used by this search. There are multiple workload pools defined in the workload_pools.conf file. |
| `counttype` | `number of events | number of hosts | number of sources | custom | always` | always | Set the type of count for alerting. Used with the 'relation' and 'quantity' settings. |
| `relation` | `greater than | less than | equal to | not equal to | drops by | rises by` | empty string | Specifies how to compare against 'counttype'. |
| `quantity` | `<integer>` | empty string | Specifies a value for the 'counttype' and 'relation' settings, to determine Think of it as a sentence constructed like this: <counttype> <relation> For example, "number of events [is] greater than 10" sends an alert when the For example, "number of events drops by 10%" sends an alert when the count |
| `alert_condition` | `<search string>` | empty string | Contains a conditional search that is evaluated against the results of the |
| `action.<action_name>` | `<boolean>` | empty string | Indicates whether the action is enabled for a particular saved The 'action_name' can be: email \| populate_lookup \| script \| summary_index For more about your defined alert actions see the alert_actions.conf file. |
| `action.<action_name>.<parameter>` | `<value>` | empty string | Overrides an action's <parameter> as defined in the alert_actions.conf file, |
| `action.email` | `<boolean>` | false | Specifies whether the email action is enabled for this search. |
| `action.email.to` | `<email list>` | empty string | REQUIRED. This setting is not defined in the alert_actions.conf file. |
| `action.email.from` | `<email address>` | splunk@<LOCALHOST> | Set an email address to use as the sender's address. |
| `action.email.subject` | `<string>` | SplunkAlert-<savedsearchname> | Set the subject of the email delivered to recipients. |
| `action.email.mailserver` | `<string>` | <LOCALHOST> | Set the address of the MTA server to be used to send the emails. |
| `action.email.maxresults` | `<integer>` | 10000 | Set the maximum number of results to email. Any alert-level results threshold greater than this number is capped at this This value affects all methods of result inclusion by email alert: inline, |
| `action.email.include.results_link` | `[1|0]` | 1 (true) | Specify whether to include a link to search results in the alert notification |
| `action.email.include.search` | `[1|0]` | 0 (false) | Specify whether to include the query whose results triggered the email. |
| `action.email.include.trigger` | `[1|0]` | 0 (false) | Specify whether to include the alert trigger condition. |
| `action.email.include.trigger_time` | `[1|0]` | 0 (false) or whatever is set in the alert_actions.conf file | Specify whether to include the alert trigger time. |
| `action.email.include.view_link` | `[1|0]` | 1 (true) | Specify whether to include saved search title and a link for editing the |
| `action.email.inline` | `[1|0]` | 0 (false) | Specify whether to include search results or PNG exports in the body of |
| `action.email.sendcsv` | `[1|0]` | 0 | Specify whether to send results as a CSV file. |
| `action.email.allow_empty_attachment` | `<boolean>` | set by the 'allow_empty_attachment' setting in | Specifies whether the Splunk software attaches a CSV or PDF file to an Use this setting to override for specific alerts the default set for |
| `action.email.sendpdf` | `[1|0]` | 0 (false) | Specify whether to send results as a PDF file. |
| `action.email.sendpng` | `[1|0]` | 0 (false) | Specify whether to send Dashboard Studio results as a PNG file. |
| `action.email.sendresults` | `[1|0]` | 0 (false) | Specify whether to include search results in the alert notification email. |
| `action.script` | `<boolean>` | false | Specifies whether the script action is enabled for this search. |
| `action.script.filename` | `<script filename>` | empty string | The filename, with no path, of the shell script to run. The script should be located in: $SPLUNK_HOME/bin/scripts/ For system shell scripts on UNIX, or .bat or .cmd file on Windows, there For other types of scripts, the first line should begin with a #! |
| `action.lookup` | `<boolean>` | false | Specifies whether the lookup action is enabled for this search. |
| `action.lookup.filename` | `<lookup name>` | — | Specifies either the name of a CSV lookup file or a KV store collection For CSV lookup files, enter the file name only. Do not enter the file path. |
| `action.lookup.append` | `<boolean>` | false | Specifies whether to append results to the lookup file defined for the |
| `action.summary_index` | `<boolean>` | false. | Specifies whether the summary index action is enabled for this search. |
| `action.summary_index._name` | `<index>` | summary | Specifies the name of the summary index where the results of the scheduled |
| `action.summary_index._type` | `[event | metric]` | event | Specifies the data type of the summary index where the Splunk software saves |
| `action.summary_index._metric_dims` | `<comma-delimited-field-list>` | empty string | Optional Identify one or more fields with numeric values that the Splunk software The Splunk software converts all fields with numeric values that are not in If you provide a list of fields, separate them with commas. |
| `action.summary_index.inline` | `<boolean>` | 1 (true) | Specify whether to run the summary indexing action as part of the |
| `action.summary_index.<field>` | `<string>` | — | Specifies a field/value pair to add to every event that gets summary indexed You can define multiple field/value pairs for a single summary index search. |
| `action.summary_index.force_realtime_schedule` | `<boolean>` | 0 (false) | By default 'realtime_schedule' is false for a report configured for |
| `action.populate_lookup` | `<boolean>` | false | Specifies whether the lookup population action is enabled for this search. |
| `action.populate_lookup.dest` | `<string>` | empty string | Can be one of the following two options: A lookup name from transforms.conf. The lookup name cannot be associated A path to a lookup .csv file that the search results should be copied to, etc/system/lookups/ etc/apps/<app-name>/lookups |
| `run_on_startup` | `<boolean>` | false | Specifies whether this search runs when the Splunk platform starts If set to "true", the search is run as soon as possible during startup or Set 'run_on_startup' to "true" for scheduled searches that populate |
| `run_n_times` | `<unsigned integer>` | 0 (infinite) | Runs this search exactly the specified number of times. The search is not run |
| `dispatch.ttl` | `<integer>[p]` | 2p | Indicates the time to live (ttl), in seconds, for the search job artifacts If the integer is followed by the letter 'p', the ttl is calculated as a For example, if the search is scheduled to run hourly and ttl is set to 2p, If an action is triggered for the scheduled search, the ttl changes to the If the scheduled... |
| `dispatch.buckets` | `<integer>` | 0 | The maximum number of timeline buckets. |
| `dispatch.max_count` | `<integer>` | 500000 | The maximum number of results before finalizing the search. |
| `dispatch.max_time` | `<integer>` | 0 | The maximum amount of time, in seconds, before finalizing the search. |
| `dispatch.lookups` | `1| 0` | 1 | Enables or disables lookups for this search. Specify 1 to enable, 0 to disable. |
| `dispatch.earliest_time` | `<time-str>` | empty string | Specifies the earliest time for this search. Can be a relative or absolute If this value is an absolute time, use the 'dispatch.time_format' setting |
| `dispatch.latest_time` | `<time-str>` | empty string | Specifies the latest time for this saved search. Can be a relative or If this value is an absolute time, use the 'dispatch.time_format' setting |
| `dispatch.index_earliest` | `<time-str>` | empty string | Specifies the earliest index time for this search. Can be a relative or If this value is an absolute time, use the 'dispatch.time_format' setting |
| `dispatch.index_latest` | `<time-str>` | empty string | Specifies the latest index time for this saved search. Can be a relative or If this value is an absolute time, use the 'dispatch.time_format' setting |
| `dispatch.time_format` | `<time format str>` | %FT%T.%Q%:z | Defines the time format that is used to specify the earliest and latest |
| `dispatch.spawn_process` | `1 | 0` | 1 (true) | Specifies whether a new search process is started when this saved search |
| `dispatch.auto_cancel` | `<integer>` | 0 | Specifies the amount of inactive time, in seconds, after which the job 0 means to never auto-cancel the job. |
| `dispatch.auto_pause` | `<integer>` | 0 | Specifies the amount of inactive time, in seconds, after which the 0 means to never auto-pause the job. To restart a paused search job, specify 'unpause' as an action to POST auto_pause only goes into effect once. |
| `dispatch.reduce_freq` | `<integer>` | 10 | Specifies the frequency, in number of intermediary results chunks, that |
| `dispatch.allow_partial_results` | `<boolean>` | true | Specifies whether the search job can proceed to provide partial results if a search |
| `dispatch.rt_backfill` | `<boolean>` | false | Specifies whether to do real-time window backfilling for scheduled real-time |
| `dispatch.indexedRealtime` | `<boolean>` | The value for 'indexed_realtime_use_by_default' in the limits.conf | Specifies whether to use 'indexed-realtime' mode when doing real-time Overrides the setting in the limits.conf file for the This setting applies to each job. See the [realtime] stanza in the limits.conf.spec file for more information. |
| `dispatch.indexedRealtimeOffset` | `<integer>` | The value for 'indexed_realtime_disk_sync_delay' in the limits.conf | Controls the number of seconds to wait for disk flushes to finish. Overrides the setting in the limits.conf file for the This setting applies to each job. |
| `dispatch.indexedRealtimeMinSpan` | `<integer>` | The value for 'indexed_realtime_default_span' in the limits.conf | Minimum seconds to wait between component index searches. Overrides the setting in the limits.conf file for the This setting applies to each job. |
| `dispatch.rt_maximum_span` | `<integer>` | the value for 'indexed_realtime_maximum_span' in the limits.conf | The max seconds allowed to search data which falls behind realtime. Use this setting to set a limit, after which events are not longer considered Overrides the setting in the limits.conf file for the This setting applies to each job. |
| `dispatch.sample_ratio` | `<integer>` | 1 | The integer value used to calculate the sample ratio. The formula is The sample ratio specifies the likelihood of any event being included in the For example, if sample_ratio = 500, each event has a 1/500 chance of being |
| `dispatch.rate_limit_retry` | `<boolean>` | false | Specifies whether the search job will be re-run in case of failure caused by Currently this setting only applies when used in SHC. Overrides value of 'allow_partial_results'. |
| `restart_on_searchpeer_add` | `1 | 0` | 1 (true) | Specifies whether to restart a real-time search managed by the scheduler when |
| `durable.track_time_type` | `[ _time | _indextime | none ]` | Not set | Indicates that a scheduled search is durable and specifies how the search A durable search is a search that tries to ensure the delivery of all When durable searches encounter search errors that they cannot recover When a durable scheduled search job fails in this manner, the Splunk This setting cannot be applied... |
| `durable.lag_time` | `<unsigned integer>` | 0 | Specifies the search time delay, in seconds, that a durable search uses to catch This setting takes effect only for searches that have a setting for In most cases, '60' (1 minute) is a good 'lag_time' for durable searches that If your durable search tracks '_time', check to see how long the events for |
| `durable.backfill_type` | `[ auto | time_interval | time_whole ]` | auto | Specifies how the Splunk software backfills the lost search results of failed When set to 'time_whole', the Splunk software schedules a single backfill When set to 'time_interval', the Splunk software schedules multiple backfill When set to 'auto', the Splunk software decides the backfill type by checking This... |
| `durable.max_backfill_intervals` | `<unsigned integer>` | 0 (unlimited) | Specifies the maximum number of cron intervals (previous scheduled search This setting takes effect only for searches that have a setting for For example, if 'durable.max_backfill_intervals' is set to '100', the maximum |
| `auto_summarize` | `<boolean>` | false | Specifies if the scheduler should ensure that the data for this search is |
| `auto_summarize.command` | `<string>` | — | A search template to use to construct the auto summarization for this search. DO NOT change this setting unless you know what you're doing. |
| `auto_summarize.timespan` | `<time-specifier> (, <time-specifier>)*` | — | Comma-delimited list of time ranges that each summarized chunk should span. This setting does not support "1w" timespans. |
| `auto_summarize.cron_schedule` | `<cron-string>` | — | Cron schedule to use to probe or generate the summaries for this search. |
| `auto_summarize.dispatch.<arg-name>` | `<string>` | — | Any dispatch.* options that need to be overridden when running the summary |
| `auto_summarize.suspend_period` | `<time-specifier>` | 24h | The amount of time to suspend summarization of this search if the |
| `auto_summarize.max_summary_size` | `<unsigned integer>` | 52428800 (5MB) | The minimum summary size when to start testing its helpfulness. |
| `auto_summarize.max_summary_ratio` | `<positive decimal>` | 0.1 | The maximum ratio of summary_size/bucket_size when to stop summarization and |
| `auto_summarize.max_disabled_buckets` | `<unsigned integer>` | 2 | The maximum number of buckets with the suspended summarization before the |
| `auto_summarize.max_time` | `<unsigned integer>` | 3600 | The maximum amount of time that the summary search is allowed to run. |
| `auto_summarize.hash` | `<string>` | — | An auto generated setting. |
| `auto_summarize.normalized_hash` | `<string>` | — | An auto generated setting. |
| `auto_summarize.max_concurrent` | `<unsigned integer>` | — | The maximum number of concurrent instances of this auto summarizing search, Defaults: 1 |
| `auto_summarize.workload_pool` | `<name of workload pool>` | — | Sets the name of the workload pool that is used by this auto summarization. There are multiple workload pools defined in workload_pools.conf. |
| `alert.suppress` | `<boolean>` | false | Specifies whether alert suppression is enabled for this scheduled search. |
| `alert.suppress.period` | `<time-specifier>` | empty string | Sets the suppression period. Use [number][time-unit] to specify a time. |
| `alert.suppress.fields` | `<comma-delimited-field-list>` | empty string. | List of fields to use when suppressing per-result alerts. This field *must* |
| `alert.suppress.group_name` | `<string>` | empty string. | Optional. Use this setting to define an alert suppression group for a set of alerts All alerts with the same 'alert.suppress.group_name' value are in the same Alerts belonging to different users cannot be included in the same When an alert within an alert suppression group is triggered, all of the For example, say... |
| `alert.severity` | `<integer>` | 3 | Sets the alert severity level. Valid values are: 1-debug, 2-info, 3-warn, 4-error, 5-severe, 6-fatal |
| `alert.expires` | `<time-specifier>` | 24h | Sets the period of time to show the alert on the Triggered Alerts page. Use [number][time-unit] to specify a time. |
| `alert.digest_mode` | `<boolean>` | true | Whether or not the Splunk platform applies the alert actions to the entire A value of "true" means that the Splunk platform applies the alert actions A value of "false" means that the Splunk platform applies the alert actions |
| `alert.track` | `<boolean> | auto` | auto | Specifies whether to track the actions triggered by this scheduled search. auto - determine whether to track or not based on the tracking setting of true - force alert tracking. |
| `alert.display_view` | `<string>` | empty string | Name of the UI view where the emailed link for each result alerts should If not specified, the value of the 'request.ui_dispatch_app' setting is used. |
| `alert.managedBy` | `<string>` | empty string | Specifies the feature or component that created the alert. |
| `displayview` | `<string>` | empty string | Defines the default UI view name (not label) in which to load the results. Accessibility is subject to the user having sufficient permissions. |
| `vsid` | `<string>` | empty string | Defines the view state ID associated with the UI view listed in the Must match up to a stanza in the viewstates.conf file. |
| `is_visible` | `<boolean>` | true | Specifies whether this saved search should be listed in the visible saved Saved searches are still visible when accessing the "Searches, reports, |
| `description` | `<string>` | empty string | Human-readable description of this saved search. |
| `request.ui_dispatch_app` | `<string>` | empty string | Specifies a field used by Splunk UI to denote the app that this search |
| `request.ui_dispatch_view` | `<string>` | empty string | Specifies a field used by Splunk UI to denote the view this search should be |
| `display.general.enablePreview` | `[0 | 1]` | — | See Splunk documentation. |
| `display.general.type` | `[events|statistics|visualizations]` | — | See Splunk documentation. |
| `display.general.timeRangePicker.show` | `[0 | 1]` | — | See Splunk documentation. |
| `display.general.migratedFromViewState` | `[0 | 1]` | — | See Splunk documentation. |
| `display.general.locale` | `<string>` | — | See Splunk documentation. |
| `display.events.fields` | `[<string>(, <string>)*]` | — | See Splunk documentation. |
| `display.events.type` | `[raw|list|table]` | — | See Splunk documentation. |
| `display.events.rowNumbers` | `[0 | 1]` | — | See Splunk documentation. |
| `display.events.maxLines` | `<integer>` | — | See Splunk documentation. |
| `display.events.raw.drilldown` | `[inner|outer|full|none]` | — | See Splunk documentation. |
| `display.events.list.drilldown` | `[inner|outer|full|none]` | — | See Splunk documentation. |
| `display.events.list.wrap` | `[0 | 1]` | — | See Splunk documentation. |
| `display.events.table.drilldown` | `[0 | 1]` | — | See Splunk documentation. |
| `display.events.table.wrap` | `[0 | 1]` | — | See Splunk documentation. |
| `display.statistics.rowNumbers` | `[0 | 1]` | — | See Splunk documentation. |
| `display.statistics.wrap` | `[0 | 1]` | — | See Splunk documentation. |
| `display.statistics.overlay` | `[none|heatmap|highlow]` | — | See Splunk documentation. |
| `display.statistics.drilldown` | `[row|cell|none]` | — | See Splunk documentation. |
| `display.statistics.totalsRow` | `[0 | 1]` | — | See Splunk documentation. |
| `display.statistics.percentagesRow` | `[0 | 1]` | — | See Splunk documentation. |
| `display.statistics.show` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.trellis.enabled` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.trellis.scales.shared` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.trellis.size` | `[small|medium|large]` | — | See Splunk documentation. |
| `display.visualizations.trellis.splitBy` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.show` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.type` | `[charting|singlevalue|mapping|custom]` | — | See Splunk documentation. |
| `display.visualizations.chartHeight` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.charting.chart` | `[line|area|column|bar|pie|scatter|bubble|radialGauge|fillerGauge|markerGauge]` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.stackMode` | `[default|stacked|stacked100]` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.nullValueMode` | `[gaps|zero|connect]` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.overlayFields` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.charting.drilldown` | `[all|none]` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.style` | `[minimal|shiny]` | — | See Splunk documentation. |
| `display.visualizations.charting.layout.splitSeries` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.charting.layout.splitSeries.allowIndependentYRanges` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.charting.legend.mode` | `[standard|seriesCompare]` | — | See Splunk documentation. |
| `display.visualizations.charting.legend.placement` | `[right|bottom|top|left|none]` | — | See Splunk documentation. |
| `display.visualizations.charting.legend.labelStyle.overflowMode` | `[ellipsisEnd|ellipsisMiddle|ellipsisStart]` | — | See Splunk documentation. |
| `display.visualizations.charting.axisTitleX.text` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.charting.axisTitleY.text` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.charting.axisTitleY2.text` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.charting.axisTitleX.visibility` | `[visible|collapsed]` | — | See Splunk documentation. |
| `display.visualizations.charting.axisTitleY.visibility` | `[visible|collapsed]` | — | See Splunk documentation. |
| `display.visualizations.charting.axisTitleY2.visibility` | `[visible|collapsed]` | — | See Splunk documentation. |
| `display.visualizations.charting.axisX.scale` | `linear|log` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY.scale` | `linear|log` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY2.scale` | `linear|log|inherit` | — | See Splunk documentation. |
| `display.visualizations.charting.axisX.abbreviation` | `none|auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY.abbreviation` | `none|auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY2.abbreviation` | `none|auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisLabelsX.majorLabelStyle.overflowMode` | `[ellipsisMiddle|ellipsisNone]` | — | See Splunk documentation. |
| `display.visualizations.charting.axisLabelsX.majorLabelStyle.rotation` | `[-90|-45|0|45|90]` | — | See Splunk documentation. |
| `display.visualizations.charting.axisLabelsX.majorUnit` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisLabelsY.majorUnit` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisLabelsY2.majorUnit` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisX.minimumNumber` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY.minimumNumber` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY2.minimumNumber` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisX.maximumNumber` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY.maximumNumber` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY2.maximumNumber` | `<decimal> | auto` | — | See Splunk documentation. |
| `display.visualizations.charting.axisY2.enabled` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.sliceCollapsingThreshold` | `<decimal>` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.showDataLabels` | `[all|none|minmax]` | — | See Splunk documentation. |
| `display.visualizations.charting.gaugeColors` | `[<hex>(, <hex>)*]` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.rangeValues` | `[<string>(, <string>)*]` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.bubbleMaximumSize` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.bubbleMinimumSize` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.charting.chart.bubbleSizeBy` | `[area|diameter]` | — | See Splunk documentation. |
| `display.visualizations.charting.fieldColors` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.charting.fieldDashStyles` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.charting.lineWidth` | `<decimal>` | — | See Splunk documentation. |
| `display.visualizations.custom.drilldown` | `[all|none]` | — | See Splunk documentation. |
| `display.visualizations.custom.height` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.custom.type` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.singlevalueHeight` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.beforeLabel` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.afterLabel` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.underLabel` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.unit` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.unitPosition` | `[before|after]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.drilldown` | `[all|none]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.colorMode` | `[block|none]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.rangeValues` | `[<string>(, <string>)*]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.rangeColors` | `[<string>(, <string>)*]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.trendInterval` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.trendColorInterpretation` | `[standard|inverse]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.showTrendIndicator` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.showSparkline` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.trendDisplayMode` | `[percent|absolute]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.colorBy` | `[value|trend]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.useColors` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.numberPrecision` | `[0|0.0|0.00|0.000|0.0000]` | — | See Splunk documentation. |
| `display.visualizations.singlevalue.useThousandSeparators` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.mapHeight` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.mapping.type` | `[marker|choropleth]` | — | See Splunk documentation. |
| `display.visualizations.mapping.drilldown` | `[all|none]` | — | See Splunk documentation. |
| `display.visualizations.mapping.map.center` | `(<decimal>,<decimal>)` | — | See Splunk documentation. |
| `display.visualizations.mapping.map.zoom` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.mapping.map.scrollZoom` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.mapping.map.panning` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.mapping.choroplethLayer.colorMode` | `[auto|sequential|divergent|categorical]` | — | See Splunk documentation. |
| `display.visualizations.mapping.choroplethLayer.maximumColor` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.mapping.choroplethLayer.minimumColor` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.mapping.choroplethLayer.colorBins` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.mapping.choroplethLayer.neutralPoint` | `<decimal>` | — | See Splunk documentation. |
| `display.visualizations.mapping.choroplethLayer.shapeOpacity` | `<decimal>` | — | See Splunk documentation. |
| `display.visualizations.mapping.choroplethLayer.showBorder` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.mapping.markerLayer.markerOpacity` | `<decimal>` | — | See Splunk documentation. |
| `display.visualizations.mapping.markerLayer.markerMinSize` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.mapping.markerLayer.markerMaxSize` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.mapping.legend.placement` | `[bottomright|none]` | — | See Splunk documentation. |
| `display.visualizations.mapping.data.maxClusters` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.mapping.showTiles` | `[0 | 1]` | — | See Splunk documentation. |
| `display.visualizations.mapping.tileLayer.tileOpacity` | `<decimal>` | — | See Splunk documentation. |
| `display.visualizations.mapping.tileLayer.url` | `<string>` | — | See Splunk documentation. |
| `display.visualizations.mapping.tileLayer.minZoom` | `<integer>` | — | See Splunk documentation. |
| `display.visualizations.mapping.tileLayer.maxZoom` | `<integer>` | — | See Splunk documentation. |
| `display.page.search.patterns.sensitivity` | `<decimal>` | — | See Splunk documentation. |
| `display.page.search.mode` | `[fast|smart|verbose]` | — | This setting has no effect on saved search execution when dispatched by the |
| `display.page.search.timeline.format` | `[hidden|compact|full]` | — | See Splunk documentation. |
| `display.page.search.timeline.scale` | `[linear|log]` | — | See Splunk documentation. |
| `display.page.search.showFields` | `[0 | 1]` | — | See Splunk documentation. |
| `display.page.search.tab` | `[events|statistics|visualizations|patterns]` | — | See Splunk documentation. |
| `display.page.pivot.dataModel` | `<string>` | — | See Splunk documentation. |
| `display.statistics.format.<index>` | `[color|number]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.field` | `<string>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.fields` | `[<string>(, <string>)*]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale` | `[category|linear|log|minMidMax|sharedCategory|threshold]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette` | `[expression|list|map|minMidMax|sharedList]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.precision` | `<integer>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.useThousandSeparators` | `<boolean>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.unit` | `<string>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.unitPosition` | `[before|after]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.categories` | `[<string>(, <string>)*]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.base` | `<integer>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.minType` | `[number|percent|percentile]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.minValue` | `<decimal>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.midType` | `[number|percent|percentile]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.midValue` | `<decimal>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.maxType` | `[number|percent|percentile]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.maxValue` | `<decimal>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.scale.thresholds` | `[<decimal>(, <decimal>)*]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette.rule` | `<string>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette.colors` | `[<hex>(, <hex>)*]` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette.interpolate` | `<boolean>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette.colors` | `{<string>:<hex>(, <string>:<hex>)*}` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette.minColor` | `<hex>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette.midColor` | `<hex>` | — | See Splunk documentation. |
| `display.statistics.format.<index>.colorPalette.maxColor` | `<hex>` | — | See Splunk documentation. |
| `embed.enabled` | `[0 | 1]` | — | Specifies whether a saved search is shared for access with a guestpass. The only acceptable values for this setting are 0 and 1. |
| `defer_scheduled_searchable_idxc` | `<boolean>` | false (disabled) | Specifies whether to defer a continuous saved search during a searchable Note: When disabled, a continuous saved search might return partial results. |
| `skip_scheduled_realtime_idxc` | `<boolean>` | false (does not skip) | Specifies whether to skip a continuous saved realtime search during a searchable Note: When set to false, a continuous saved search might return partial results. |
| `precalculate_required_fields_for_alerts` | `<boolean>` | true | Whether or not the search scheduler pre-calculates the required fields Pre-calculation of the required fields occurs within the main splunkd process A value of "true" means that the search scheduler pre-calculates the A value of "false" means that the search scheduler does not pre-calculate |
| `calculate_alert_required_fields_in_search` | `<boolean>` | false | Whether or not alert search processes calculate the required Alert search processes calculate the set of fields required by A value of "true" means that alert searches perform calculations A value of "false" means that the search scheduler pre-calculates the If this setting has a value of "true", it takes... |
| `sendresults` | `<boolean>` | — | Use the 'action.email.sendresult' setting. |
| `action_rss` | `<boolean>` | — | Use the 'action.rss' setting. |
| `action_email` | `<string>` | — | Use the 'action.email' and 'action.email.to' settings. |
| `role` | `<string>` | — | See saved search permissions. |
| `userid` | `<string>` | — | See saved search permissions. |
| `query` | `<string>` | — | Use the 'search' setting. |
| `nextrun` | `<integer>` | — | Not used anymore. The scheduler maintains this info internally. |
| `qualifiedSearch` | `<string>` | — | Not used anymore. Splunk software computes this value during runtime. |
