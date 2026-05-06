# indexes.conf

This file contains all possible options for an indexes.conf file. Use this file to configure Splunk's indexes and their properties. Each stanza controls different search commands settings. There is a indexes.conf file in the $SPLUNK_HOME/etc/system/default/ directory. Never change or copy the configuration files in the default directory. The files in the default directory must remain intact and in their original location. To set custom configurations, create a new file with the name indexes.conf in the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings that you want...

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Indexing |
| Restart required | Yes (most settings) |
| Related files | props.conf, transforms.conf, server.conf |

## Stanzas and settings

### `[default]`

Global defaults and indexer-wide tuning (also allowed outside any stanza).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sync` | `<nonnegative integer>` | 0 | The index processor syncs events every 'sync' number of events. Set to 0 to disable. |
| `defaultDatabase` | `<index name>` | main | If an index is not specified during search, Splunk software The specified index displays as the default in Splunk Manager settings. |
| `bucketMerging` | `<boolean>` | false | This setting is supported on indexer clusters when 'storageType' is "remote" or "local". The bucket merge task will evaluate and localize remote buckets before merging. |
| `bucketMerge.minMergeSizeMB` | `<unsigned integer>` | 750 | This setting is supported on indexer clusters when 'storageType' is "remote" or "local". Minimum cumulative bucket sizes to merge. |
| `bucketMerge.maxMergeSizeMB` | `<unsigned integer>` | 1000 | This setting is supported on indexer clusters when 'storageType' is "remote" or "local". Maximum cumulative bucket sizes to merge. |
| `bucketMerge.maxMergeTimeSpanSecs` | `<unsigned integer>` | 7776000 (90 days) | This setting is supported on indexer clusters when 'storageType' is "remote" or "local". Maximum allowed time span, in seconds, between buckets about to be merged. |
| `bucketMerge.minMergeCount` | `<unsigned integer>` | 2 | This setting is supported on indexer clusters when 'storageType' is "remote" or "local". Minimum number of buckets to merge. |
| `bucketMerge.maxMergeCount` | `<unsigned integer>` | 24 | This setting is supported on indexer clusters when 'storageType' is "remote" or "local". Maximum number of buckets to merge. |
| `allowBulkDataMove` | `<boolean>` | false | Whether or not Splunk software allows bulk data move operations on A value of "true" means Splunk software allows bulk data move operations. A value of "false" means Splunk software does not allow bulk data move |
| `queryLanguageDefinition` | `<path to file>` | — | REMOVED. This setting is no longer used. |
| `lastChanceIndex` | `<index name>` | empty string | An index that receives events that are otherwise not associated If you do not specify a valid index with this setting, such events are Routes the following kinds of events to the specified index: events with a non-existent index specified at an input layer, like an events with a non-existent index computed at... |
| `malformedEventIndex` | `<index name>` | empty string | Currently not supported. This setting is related to a feature that is An index to receive malformed events. |
| `memPoolMB` | `<positive integer>|auto` | auto | Determines how much memory is given to the indexer memory pool. This Must be greater than 0; maximum value is 1048576 (which corresponds to 1 TB) Setting this too high can cause splunkd memory usage to increase Setting this too low can degrade splunkd indexing performance. |
| `indexThreads` | `<nonnegative integer>|auto` | auto | Determines the number of threads to use for indexing. Must be at least 1 and no more than 16. |
| `rtRouterThreads` | `0|1` | — | Set to "1" if you expect to use non-indexed real time searches regularly. Index If you are not sure what "indexed vs non-indexed" real time searches are, see |
| `rtRouterQueueSize` | `<positive integer>` | 10000 | This setting is only valid if 'rtRouterThreads' != 0 This queue sits between the indexer pipeline set thread (producer) and the Changing the size of this queue can impact real-time search performance. |
| `selfStorageThreads` | `<positive integer>` | 2 | Specifies the number of threads used to transfer data to customer-owned remote The threads are created on demand when any index is configured with |
| `assureUTF8` | `<boolean>` | false | Verifies that all data retrieved from the index is proper by validating This does not ensure all data will be emitted, but can be a workaround Will degrade indexing performance when enabled (set to true). Can only be set globally, by specifying in the [default] stanza. |
| `enableRealtimeSearch` | `<boolean>` | true | Enables real-time searches. |
| `perfTuneMetaDataAPIs` | `<boolean>` | false | Whether or not the Splunk daemon auto-tunes metadata access to A value of "true" means that the Splunk daemon auto-tunes A value of "false" means that the Splunk daemon does not auto-tune |
| `perfTuneMetaDataReads` | `<boolean>` | true | Whether or not the Splunk daemon auto-tunes metadata read APIs. A value of "true" means that the Splunk daemon auto-tunes A value of "false" means that the Splunk daemon does not auto-tune When 'perfTuneMetaDataAPIs' has a value of "false", this setting This is an advanced setting. |
| `perfTuneMetaDataWrites` | `<boolean>` | true | Whether or not the Splunk daemon auto-tunes metadata write APIs. A value of "true" means that the Splunk daemon auto-tunes A value of "false" means that the Splunk daemon does not auto-tune When 'perfTuneMetaDataAPIs' has a value of "false", this setting This is an advanced setting. |
| `quadReloadHashTable` | `<boolean>` | false | Whether or not the Splunk daemon auto-tunes metadata internal table reloads. A value of "true" means that the Splunk daemon auto-tunes A value of "false" means that the Splunk daemon does not auto-tune When 'perfTuneMetaDataAPIs' has a value of "false", this setting This is an advanced setting. |
| `hashTableSize` | `<integer>` | 1024 | The size, in bytes, of the metadata internal table. This is an advanced setting. |
| `suppressBannerList` | `<comma-separated list of strings>` | empty string | suppresses index missing warning banner messages for specified indexes |
| `maxRunningProcessGroups` | `<positive integer>|auto` | auto | The number of child processes that splunkd can run at a given time. Splunkd runs helper child processes like "splunk-optimize", This maximum applies to all of splunkd, not per index. |
| `maxRunningProcessGroupsLowPriority` | `<positive integer>` | 1 | Of the 'maxRunningProcessGroups' helper child processes, at most This maximum applies to all of splunkd, not per index. If you have N There must always be fewer 'maxRunningProcessGroupsLowPriority' child This is an advanced setting; do NOT set unless instructed by Splunk Highest legal value is 4294967295. |
| `bucketRebuildMemoryHint` | `<positive integer>[KB|MB|GB]|auto` | auto | A suggestion for the bucket rebuild process for the size, in bytes, Larger files use more memory in a rebuild, but rebuilds fail if there is Smaller files make the rebuild take longer during the final optimize step. This is an advanced setting, do NOT set this unless instructed by Splunk If set to "auto", the... |
| `inPlaceUpdates` | `<boolean>` | true | Whether or not splunkd writes metadata updates to .data files in place. Intended for advanced debugging of metadata issues. |
| `serviceInactiveIndexesPeriod` | `<positive integer>` | 60 | How frequently, in seconds, inactive indexes are serviced. An inactive index is an index that has not been written to for a period The highest legal value is 4294967295. |
| `serviceOnlyAsNeeded` | `<boolean>` | true | DEPRECATED; use 'serviceInactiveIndexesPeriod' instead. Causes index service (housekeeping tasks) overhead to be incurred only Indexer module problems might be easier to diagnose when this optimization |
| `serviceSubtaskTimingPeriod` | `<positive integer>` | 30 | Subtasks of indexer service task will be timed on every Nth execution, Smaller values give greater accuracy; larger values lessen timer Timer measurements are found in metrics.log, marked Highest legal value is 4294967295 Configure a value for this setting that divides evenly into the value for |
| `processTrackerServiceInterval` | `<nonnegative integer>` | 1 | How often, in seconds, the indexer checks the status of the child OS If set to 0, the indexer checks child process status every second. Highest legal value is 4294967295. |
| `maxBucketSizeCacheEntries` | `<nonnegative integer>` | — | This value is no longer needed. Its value is ignored. |
| `tsidxStatsHomePath` | `<string>` | $SPLUNK_DB/tsidxstats | An absolute path that specifies where the indexer creates namespace data If the directory does not exist, the indexer attempts to create it. Optional. |
| `tsidxWritingLevel` | `[1|2|3|4]` | 3 | Enables various performance and space-saving improvements for tsidx files. Tsidx files written with a higher tsidxWritingLevel setting have limited backward Setting tsidxWritingLevel globally is recommended. |
| `hotBucketTimeRefreshInterval` | `<positive integer>` | 10 (services) | How often each index refreshes the available hot bucket times A refresh occurs every N times service is performed for each index. For busy indexes, this is a multiple of seconds. |
| `fileSystemExecutorWorkers` | `<positive integer>` | 5 | Determines the number of threads to use for file system io operations. This maximum applies to all of splunkd, not per index. |
| `hotBucketStreaming.extraBucketBuildingCmdlineArgs` | `<string>` | empty | Currently not supported. This setting is related to a feature that is |

### `[<index_name>]`

Per-index paths, retention, datatype, SmartStore/remote storage, and threading overrides.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Toggles your index entry off and on. Set to "true" to disable an index. |
| `deleted` | `true` | (none) | If present, means that this index has been marked for deletion: if splunkd Do NOT manually set, clear, or modify the value of this setting. |
| `deleteId` | `<nonnegative integer>` | (none) | If present, means that this index has been marked for deletion: if splunkd Do NOT manually set, clear, or modify the value of this setting. |
| `homePath` | `<string>` | (none) | An absolute path that contains the hot and warm buckets for the index. Best practice is to specify the path with the following syntax: Splunkd keeps a file handle open for warmdbs at all times. |
| `coldPath` | `<string>` | — | An absolute path that contains the colddbs for the index. Best practice is to specify the path with the following syntax: Cold databases are opened as needed when searching. |
| `thawedPath` | `<string>` | — | An absolute path that contains the thawed (resurrected) databases for the CANNOT contain a volume reference. Path must be writable. |
| `bloomHomePath` | `<string>` | — | The location where the bloomfilter files for the index are stored. If specified, 'bloomHomePath' must be defined in terms of a volume definition If 'bloomHomePath' is not specified, the indexer stores bloomfilter files Path must be writable. |
| `createBloomfilter` | `<boolean>` | true | Whether or not to create bloomfilter files for the index. If set to "true", the indexer creates bloomfilter files. |
| `summaryHomePath` | `<string>` | (none) | An absolute path where transparent summarization results for data in this This value must be different for each index and can be on any disk drive. Best practice is to specify the path with the following syntax: Can contain a volume reference (see volume section below) in place of $SPLUNK_DB. |
| `tstatsHomePath` | `<string>` | volume:_splunk_summaries/$_index_name/datamodel_summary, | Location where data model acceleration TSIDX data for this index should be stored. Required. |
| `remotePath` | `<root path for remote volume, prefixed by a URI-like scheme>` | — | Optional. Presence of this setting means that this index uses remote storage, instead This setting must be defined in terms of a storageType=remote volume The path portion that follows the volume reference is relative to the path If 'remotePath' is specified, the 'coldPath' and 'thawedPath' settings are |
| `maxBloomBackfillBucketAge` | `<nonnegative integer>[smhd]|infinite` | 30d | If a (warm or cold) bucket with no bloomfilter is older than this, When set to 0, splunkd never backfills bloomfilters. When set to "infinite", splunkd always backfills bloomfilters. |
| `hotlist_recency_secs` | `<unsigned integer>` | The global setting in the server.conf file [cachemanager] stanza | When a bucket is older than this value, it becomes eligible for eviction. |
| `hotlist_bloom_filter_recency_hours` | `<unsigned integer>` | The global setting in the server.conf file [cachemanager] stanza | When a bucket's non-journal and non-tsidx files (such as bloomfilter files) |
| `enableOnlineBucketRepair` | `<boolean>` | true | Controls asynchronous "online fsck" bucket repair, which runs concurrently When enabled, you do not have to wait until buckets are repaired, to start When enabled, you might observe a slight degradation in performance. You must set to "true" for remote storage enabled indexes. |
| `enableDataIntegrityControl` | `<boolean>` | false | Whether or not splunkd computes hashes on rawdata slices and stores the hashes If set to "true", hashes are computed on the rawdata slices. If set to "false", no hashes are computed on the rawdata slices. |
| `maxWarmDBCount` | `<nonnegative integer>` | 300 | The maximum number of warm buckets. Warm buckets are located in the 'homePath' for the index. |
| `maxTotalDataSizeMB` | `<nonnegative integer>` | 500000 | The maximum size of an index, in megabytes. If an index grows larger than the maximum size, splunkd freezes the oldest This setting applies only to hot, warm, and cold buckets. |
| `maxGlobalRawDataSizeMB` | `<nonnegative integer>` | 0 (no limit to the amount of raw data in an index) | The maximum amount of cumulative raw data (in MB) allowed in a remote This setting is available for both standalone indexers and indexer clusters. When the amount of uncompressed raw data in an index exceeds the value of this For example, assume that the setting is set to 500 and the indexer cluster This value... |
| `maxGlobalDataSizeMB` | `<nonnegative integer>` | 0 (No limit to the space that the warm buckets on an index can occupy.) | The maximum size, in megabytes, for all warm buckets in a SmartStore This setting includes the sum of the size of all buckets that reside If the total size of the warm buckets in an index exceeds For example, assume that 'maxGlobalDataSizeMB' is set to 5000 for The size calculation for this setting applies on a... |
| `rotatePeriodInSecs` | `<positive integer>` | 60 | Controls the service period (in seconds): how often splunkd performs Check if a new hot DB needs to be created. Check if there are any cold DBs that should be frozen. |
| `frozenTimePeriodInSecs` | `<nonnegative integer>` | 188697600 (6 years) | The number of seconds after which indexed data rolls to frozen. If you do not specify a 'coldToFrozenScript', data is deleted when rolled to The highest legal value is 4294967295. |
| `warmToColdScript` | `<script path>` | empty string | Specifies a script to run when moving data from warm to cold buckets. This setting is supported for backwards compatibility with versions If you specify a script here, the script becomes responsible for moving The script must accept two arguments: First: the warm directory (bucket) to be rolled to cold. |
| `coldToFrozenScript` | `<path to script interpreter> <path to script>` | (none) | Specifies a script to run when data is to leave the splunk index system. Essentially, this implements any archival tasks before the data is Add "$DIR" (including quotes) to this setting on Windows (see below Script Requirements: The script must accept only one argument: An absolute path to the bucket directory In... |
| `python.version` | `{default|python|python2|python3|python3.7|python3.9|latest}` | Not set; uses the system-wide Python version. | DEPRECATED. Use 'python.required' instead to specify which Python versions the For Python scripts only, selects which Python version to use. |
| `python.required` | `<comma-separated list>` | Not set; uses 'python.version' if that setting has a value. | For Python scripts only, the versions of Python that the script supports. The Splunk platform uses this setting for 'coldToFrozenScript' only when This setting takes precedence over the 'python.version' setting if both The Splunk platform selects the highest version of Python that is The following values are... |
| `coldToFrozenDir` | `<path to frozen archive>` | — | An alternative to a 'coldToFrozen' script - this setting lets you Splunk software automatically puts frozen buckets in this directory For information on how buckets created by different versions are If both 'coldToFrozenDir' and 'coldToFrozenScript' are specified, You must restart splunkd after changing this... |
| `compressRawdata` | `true|false` | — | This setting is ignored. The splunkd process always compresses raw data. |
| `maxConcurrentOptimizes` | `<nonnegative integer>` | 6 | The number of concurrent optimize processes that can run against a hot This number should be increased if: There are always many small tsidx files in the hot bucket. After rolling, there are many tsidx files in warm or cold buckets. |
| `maxDataSize` | `<positive integer>|auto|auto_high_volume` | "auto" (sets the size to 750 megabytes) | The maximum size, in megabytes, that a hot bucket can reach before splunkd Specifying "auto" or "auto_high_volume" will cause Splunk to autotune this You should use "auto_high_volume" for high-volume indexes (such as the "auto_high_volume" sets the size to 10GB on 64-bit, and 1GB on 32-bit Although the maximum... |
| `rawFileSizeBytes` | `<positive integer>` | — | Deprecated in version 4.2 and later. Splunkd ignores this value. |
| `rawChunkSizeBytes` | `<positive integer>` | 131072 (128 kilobytes) | Target uncompressed size, in bytes, for individual raw slices in the rawdata This is an advanced setting. Do not change it unless a Splunk Support If you specify "0", 'rawChunkSizeBytes' is set to the default value. |
| `minRawFileSyncSecs` | `<nonnegative decimal>|disable` | "disable" | How frequently splunkd forces a filesystem sync while compressing journal If you specify "0", splunkd forces a filesystem sync after every slice If you specify "disable", syncing is disabled entirely; uncompressed Some filesystems are very inefficient at performing sync operations, so You must restart splunkd after... |
| `maxMemMB` | `<nonnegative integer>` | 5 | The amount of memory, in megabytes, to allocate for indexing. This amount of memory will be allocated PER INDEX THREAD, or, if The default is recommended for all environments. |
| `tsidxSyncPeriod` | `<positive integer>` | 1 | The amount of time, in seconds, after which splunkd forces a sync of tsidx Indexed events become searchable after the sync, which happens when the Use the higher value to reduce indexing overhead, especially on systems with Use the lower value for faster searchability. If the indexedRealtime mode is used,... |
| `maxHotSpanSecs` | `<positive integer>` | 7776000 (90 days) | Upper bound of timespan of hot/warm buckets, in seconds. This is an advanced setting that should be set Splunkd applies this limit per ingestion pipeline. |
| `maxHotIdleSecs` | `<nonnegative integer>` | 0 | How long, in seconds, that a hot bucket can remain in hot status without If a hot bucket receives no data for more than 'maxHotIdleSecs' seconds, This setting operates independently of 'maxHotBuckets', which can also cause A value of 0 turns off the idle check (equivalent to infinite idle time). The highest legal... |
| `maxHotBuckets` | `<positive integer> | auto` | "auto" | Maximum number of hot buckets that can exist per index. When 'maxHotBuckets' is exceeded, the indexer rolls the hot bucket Both normal hot buckets and quarantined hot buckets count towards this This setting operates independently of maxHotIdleSecs, which can also With N parallel ingestion pipelines, the maximum... |
| `metric.maxHotBuckets` | `<positive integer> | auto` | "auto" | Maximum number of hot buckets that can exist per metric index When 'metric.maxHotBuckets' is exceeded, the indexer rolls the hot bucket Both normal hot buckets and quarantined hot buckets count towards this This setting operates independently of maxHotIdleSecs, which can also With N parallel ingestion pipelines,... |
| `minHotIdleSecsBeforeForceRoll` | `<nonnegative integer>|auto` | auto | When there are no existing hot buckets that can fit new events because of If no hot bucket has been idle for 'minHotIdleSecsBeforeForceRoll' seconds, This setting operates independently of 'maxHotIdleSecs', which causes hot If you specify "auto", splunkd autotunes this setting. If you specify a value of "0",... |
| `splitByIndexKeys` | `<comma separated list>` | empty string (no key) | By default, splunkd splits buckets by time ranges. When this happens, each Use this setting to optionally split buckets by one or more index key fields Valid key values are: host, sourcetype, source. |
| `metric.splitByIndexKeys` | `<comma separated list>` | empty string (no key) | By default, splunkd splits buckets by time ranges. When this happens, each Use this setting to optionally split buckets by one or more index key fields Valid key values are: host, sourcetype, source, metric_name. |
| `quarantinePastSecs` | `<positive integer>` | 77760000 (900 days) | Determines what constitutes an anomalous past timestamp for quarantining If an event has a timestamp of 'quarantinePastSecs' older than the This is a mechanism to prevent the main hot buckets from being polluted The highest legal value is 4294967295 |
| `quarantineFutureSecs` | `<positive integer>` | 2592000 (30 days) | Determines what constitutes an anomalous future timestamp for quarantining If an event has a timestamp of 'quarantineFutureSecs' newer than the This is a mechanism to prevent the main hot buckets from being polluted with The highest legal value is 4294967295 |
| `maxMetaEntries` | `<nonnegative integer>` | 1000000 | The maximum number of unique lines in .data files in a bucket, which If this value is exceeded, a hot bucket is rolled to prevent further increase If your buckets are rolling due to Strings.data reaching this limit, the There is a delta between when 'maxMetaEntries' is exceeded and splunkd rolls This means a bucket... |
| `syncMeta` | `<boolean>` | true | Whether or not splunkd calls a sync operation before the file descriptor When set to "true", splunkd calls a sync operation before it closes the This functionality was introduced to improve integrity of metadata files, You must restart splunkd after changing this setting. Reloading the |
| `serviceMetaPeriod` | `<positive integer>` | 25 | Defines how frequently, in seconds, that metadata is synced to disk. You might want to set this to a higher value if the sum of your metadata The highest legal value is 4294967295 |
| `partialServiceMetaPeriod` | `<positive integer>` | 0 (disabled) | The amount of time, in seconds, that splunkd syncs metadata for records that Related to 'serviceMetaPeriod'. Records that require a full rewrite of the If you set this to 0, the feature is turned off, and 'serviceMetaPeriod' If the value of 'partialServiceMetaPeriod' is greater than Splunkd ignores this setting if... |
| `throttleCheckPeriod` | `<positive integer>` | 15 | How frequently, in seconds, that splunkd checks for index throttling The highest legal value is 4294967295. |
| `maxTimeUnreplicatedWithAcks` | `<nonnegative decimal>` | 60 | How long, in seconds, that events can remain in an unacknowledged state This value is important if you have enabled indexer acknowledgment on This is an advanced setting. Confirm that you understand the settings Do not exceed the ack timeout configured on any forwarders. |
| `maxTimeUnreplicatedNoAcks` | `<nonnegative decimal>` | 300 | How long, in seconds, that events can remain in a raw slice. This setting is important only if replication is enabled for this index, If there are any acknowledged events that share this raw slice, this setting The highest legal value is 2147483647. |
| `isReadOnly` | `<boolean>` | false | Whether or not the index is read-only. If you set to "true", no new events can be added to the index, but the You must restart splunkd after changing this setting. |
| `homePath.maxDataSizeMB` | `<nonnegative integer>` | 0 | Specifies the maximum size of 'homePath' (which contains hot and warm If this size is exceeded, splunkd moves buckets with the oldest value If you set this setting to 0, or do not set it, splunkd does not constrain the The highest legal value is 4294967295. Splunkd ignores this setting for remote storage enabled... |
| `coldPath.maxDataSizeMB` | `<nonnegative integer>` | 0 | Specifies the maximum size of 'coldPath' (which contains cold buckets). If this size is exceeded, splunkd freezes buckets with the oldest value If you set this setting to 0, or do not set it, splunkd does not constrain the If splunkd freezes buckets due to enforcement of this setting, and Splunkd ignores this... |
| `repFactor` | `0|auto` | 0 | Valid only for indexer cluster peer nodes. Determines whether an index gets replicated. |
| `minStreamGroupQueueSize` | `<nonnegative integer>` | 2000 | Minimum size of the queue that stores events in memory before committing As splunkd operates, it continually adjusts this size internally. Splunkd Do not configure this setting unless a Splunk Support professional The highest legal value is 4294967295. |
| `streamingTargetTsidxSyncPeriodMsec` | `<nonnegative integer>` | (none) | The amount of time, in milliseconds, that splunkd forces a sync This setting is needed for multisite clustering where streaming targets If you configure this setting to 0, syncing of tsidx files on |
| `journalCompression` | `gzip|lz4|zstd` | zstd | The compression algorithm that splunkd should use for the rawdata journal This setting does not have any effect on already created buckets. There is |
| `zstdCompressionStrategy` | `[1|2|3|4|5|6|7|8|9]` | 2 | Specifies the zstd compression strategy that splunkd should use for the rawdata journal Changing this setting has no effect on already created buckets and Generally, higher values for this setting result in smaller journal files This is an advanced setting. Do not change this setting unless |
| `enableTsidxReduction` | `<boolean>` | false | When set to true, this setting enables tsidx file reduction for event indexes. Under tsidx file reduction, the indexer reduces the tsidx files of buckets |
| `metric.enableFloatingPointCompression` | `<boolean>` | true | Determines whether the floating-point values compression is enabled for metric Set this to false only if you are experiencing high CPU usage during data |
| `metric.compressionBlockSize` | `<integer>` | 1024 (8192 bytes) | The block size, in words (eight-byte multiples), that the floating-point compression Valid only if 'metric.enableMetricTsidxFloatingPointCompression' is set to "true". Minimum value: 128 (1024 bytes) |
| `metric.stubOutRawdataJournal` | `<boolean>` | true | For metrics indexes only. Determines whether the data in the rawdata file is deleted when the hot bucket Tsidx files are not affected by this setting. |
| `suspendHotRollByDeleteQuery` | `<boolean>` | false | Whether or not splunkd rolls hot buckets upon running of the "delete" When the "delete" search command is run, all buckets that contain data When 'suspendHotRollByDeleteQuery' is set to "true", the rolling of hot |
| `tsidxReductionCheckPeriodInSec` | `<positive integer>` | 600 | The amount of time, in seconds, between service runs to reduce the tsidx |
| `timePeriodInSecBeforeTsidxReduction` | `<positive integer>` | 604800 | The amount of time, in seconds, that a bucket can age before it The bucket age is the difference between the current time When this time difference is exceeded, a bucket becomes eligible |
| `tsidxDedupPostingsListMaxTermsLimit` | `<positive integer>` | 8,388,608 (2^23) | This setting is valid only when 'tsidxWritingLevel' is at 4 or higher. This max term limit sets an upper bound on the number of terms kept inside an The tsidx optimizer uses the hash table to identify terms with identical Consider increasing this limit to improve compression for large tsidx files. |
| `tsidxTargetSizeMB` | `<positive integer>` | 1500 (MB) | The target size for tsidx files. The indexer attempts to make all tsidx files This value is used to help tune the performance of tsidx-based search queries, If this value exceeds 'maxDataSize', then the hot bucket will roll based Cannot exceed 4096 MB (4 GB). |
| `metric.tsidxTargetSizeMB` | `<positive integer>` | 1500 (MB) | The target size for msidx files (tsidx files for metrics data). The indexer This value is used to help tune the performance of metrics search queries, If this value exceeds 'maxDataSize', then the hot bucket will roll based Cannot exceed 4096 MB (4 GB). |
| `metric.timestampResolution` | `<s|ms>` | s | This setting specifies the timestamp resolution for metrics tsidx files. Indexes with millisecond timestamp precision have reduced search performance. |
| `datatype` | `<event|metric>` | event | Determines whether the index stores log events or metric data. If set to "metric", the indexer optimizes the index to store metric Use the "metric" data type only for metric sourcetypes like statsd. |
| `waitPeriodInSecsForManifestWrite` | `<nonnegative integer>` | 60 (1 min) | This setting specifies the minimum interval, in seconds, between periodic Setting to a lower value can reduce the performance of bucket operations like Do not increase this value beyond the default except through consultation with The highest legal value is 4294967295. |
| `hotBucketStreaming.sendSlices` | `<boolean>` | false | Currently not supported. This setting is related to a feature that is Enables uploading of journal slices of hot buckets to the remote storage. |
| `hotBucketStreaming.removeRemoteSlicesOnRoll` | `<boolean>` | false | Currently not supported. This setting is related to a feature that is Enables removal of uploaded journal slices of hot buckets from the remote This setting should be enabled only if 'hotBucketStreaming.sendSlices' is |
| `hotBucketStreaming.removeRemoteSlicesOnFreeze` | `<boolean>` | false | Currently not supported. This setting is related to a feature that is Enables removal of uploaded journal slices of hot buckets from the remote This setting should be enabled only if 'hotBucketStreaming.sendSlices' is |
| `hotBucketStreaming.reportStatus` | `<boolean>` | false | Currently not supported. This setting is related to a feature that is |
| `hotBucketStreaming.deleteHotsAfterRestart` | `<boolean>` | false | Currently not supported. This setting is related to a feature that is |

### `[provider-family:<family_name>]`

Shared defaults for external resource providers (ERP); provider stanzas override family values.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[provider:<provider_name>]`

External Resource Provider (ERP) configuration (e.g. Hadoop/Hunk); referenced by virtual indexes.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `vix.family` | `<family>` | — | A provider family to which this provider belongs. The only family available by default is "hadoop". |
| `vix.mode` | `stream|report` | — | Usually specified at the family level. Typically should be "stream". |
| `vix.command` | `<command>` | — | The command to be used to launch an external process for searches on this Usually specified at the family level. |
| `vix.command.arg.<N>` | `<argument>` | — | The Nth argument to the command specified by vix.command. Usually specified at the family level, but frequently overridden at the |
| `vix.<property name>` | `<property value>` | — | All such properties will be made available as "configuration properties" to For example, if this provider is in the Hadoop family, the configuration |
| `vix.env.<env var name>` | `<env var variable>` | — | Will create an environment variable available to search processes on this For example, to set the JAVA_HOME variable to "/path/java" for search |
| `vix.javaprops.<JVM system property name>` | `<value>` | — | All such properties will be used as Java system properties. For example, to specify a Kerberos realm (say "foo.com") as a Java |
| `vix.mapred.job.tracker` | `<logical name or server:port>` | — | In high-availability mode, use the logical name of the Job Tracker. Otherwise, should be set to server:port for the single Job Tracker. |
| `vix.fs.default.name` | `<logical name or hdfs://server:port>` | — | In high-availability mode, use the logical name for a list of Name Nodes. Otherwise, use the URL for the single Name Node. |
| `vix.splunk.setup.onsearch` | `true|false` | false | Whether to perform setup (install & bundle replication) on search. |
| `vix.splunk.setup.package` | `current|<path to file>` | — | Splunk .tgz package to install and use on data nodes Uses the current install if set to value 'current' (without quotes). |
| `vix.splunk.home.datanode` | `<path to dir>` | — | Path to where splunk should be installed on datanodes/tasktrackers, i.e. Required. |
| `vix.splunk.home.hdfs` | `<path to dir>` | — | Scratch space for this Splunk instance on HDFS Required. |
| `vix.splunk.search.debug` | `true|false` | false | Whether to run searches against this index in debug mode. In debug mode, Optional. |
| `vix.splunk.search.recordreader` | `<list of classes>` | — | Comma separated list of data preprocessing classes. Each such class must extend BaseSplunkRecordReader and return data to be |
| `vix.splunk.search.splitter` | `<class name>` | — | Set to override the class used to generate splits for MR jobs. Classes must implement com.splunk.mr.input.SplitGenerator. |
| `vix.splunk.search.mr.threads` | `<postive integer>` | 10 | Number of threads to use when reading map results from HDFS Numbers less than 1 will be treated as 1. Numbers greater than 50 will be treated as 50. |
| `vix.splunk.search.mr.maxsplits` | `<positive integer>` | 10000 | Maximum number of splits in an MR job. |
| `vix.splunk.search.mr.minsplits` | `<positive integer>` | 100 | Number of splits for first MR job associated with a given search. |
| `vix.splunk.search.mr.splits.multiplier` | `<decimal greater than or equal to 1.0>` | 10 | Factor by which the number of splits is increased in consecutive MR jobs for |
| `vix.splunk.search.mr.poll` | `<positive integer>` | 1000 (1 second). | Polling period for job status, in milliseconds. |
| `vix.splunk.search.mr.mapper.output.replication` | `<positive integer>` | 3 | Replication level for mapper output. |
| `vix.splunk.search.mr.mapper.output.gzlevel` | `<integer between 0 and 9, inclusive>` | 2 | The compression level used for the mapper output. |
| `vix.splunk.search.mixedmode` | `<boolean>` | true | Whether mixed mode execution is enabled. |
| `vix.splunk.search.mixedmode.maxstream` | `<nonnegative integer>` | 10737418240 (10 GB). | Maximum number of bytes to stream during mixed mode. Value = 0 means there's no stream limit. |
| `vix.splunk.jars` | `<list of paths>` | — | Comma delimited list of Splunk dirs/jars to add to the classpath in the |
| `vix.env.HUNK_THIRDPARTY_JARS` | `<list of paths>` | — | Comma delimited list of 3rd-party dirs/jars to add to the classpath in the |
| `vix.splunk.impersonation` | `true|false` | — | Enable/disable user impersonation. |
| `vix.splunk.setup.bundle.replication` | `<positive integer>` | The default replication factor for the file-system applies. | Set custom replication factor for bundles on HDFS. Must be an integer between 1 and 32767. |
| `vix.splunk.setup.bundle.max.inactive.wait` | `<positive integer>` | 5 | A positive integer represent a time interval in seconds. While a task waits for a bundle being replicated to the same node by another |
| `vix.splunk.setup.bundle.poll.interval` | `<positive integer>` | 100 | A positive number, representing a time interval in milliseconds. While a task waits for a bundle to be installed by another task on the same |
| `vix.splunk.setup.bundle.setup.timelimit` | `<positive integer>` | 20000 (20 seconds). | A positive number, representing a time duration in milliseconds. A task will wait this long for a bundle to be installed before it quits. |
| `vix.splunk.setup.package.replication` | `true|false` | — | Set custom replication factor for the Splunk package on HDFS. This is the Must be an integer between 1 and 32767. |
| `vix.splunk.setup.package.max.inactive.wait` | `<positive integer>` | 5 | A positive integer represent a time interval in seconds. While a task waits for a Splunk package being replicated to the same node by |
| `vix.splunk.setup.package.poll.interval` | `<positive integer>` | 100 | A positive number, representing a time interval in milliseconds. While a task waits for a Splunk package to be installed by another task on |
| `vix.splunk.setup.package.setup.timelimit` | `<positive integer>` | 20000 (20 seconds) | A positive number, representing a time duration in milliseconds. A task will wait this long for a Splunk package to be installed before it quits. |
| `vix.splunk.setup.bundle.reap.timelimit` | `<positive integer>` | 86400000 (24 hours) | Specific to Hunk provider For bundles in the working directory on each data node, this property controls Unit is milliseconds Values larger than 86400000 will be treated as if set to 86400000. |
| `vix.splunk.search.column.filter` | `<boolean>` | true | Enables/disables column filtering. When enabled, Hunk will trim columns that Should normally increase performance, but does have its own small overhead. |
| `vix.kerberos.principal` | `<kerberos principal name>` | — | Specifies principal for Kerberos authentication. Should be used with vix.kerberos.keytab and either |
| `vix.kerberos.keytab` | `<kerberos keytab path>` | — | Specifies path to keytab for Kerberos authentication. See usage note with vix.kerberos.principal. |
| `vix.splunk.heartbeat` | `<boolean>` | true | Turn on/off heartbeat update on search head, and checking on MR side. |
| `vix.splunk.heartbeat.path` | `<path on HDFS>` | — | Path to heartbeat file. If not set, defaults to <vix.splunk.home.hdfs>/dispatch/<sid>/ |
| `vix.splunk.heartbeat.interval` | `<positive integer>` | 6000 (6 seconds) | The frequency, in milliseconds, with which the Heartbeat will be updated Minimum value is 1000. Smaller values will cause an exception to be thrown. |
| `vix.splunk.heartbeat.threshold` | `<positive integer>` | 10 | The number of times the MR job will detect a missing heartbeat update before |
| `vix.splunk.search.recordreader.sequence.ignore.key` | `<boolean>` | true | When reading sequence files, if this key is enabled, events will be expected |
| `vix.splunk.search.recordreader.avro.regex` | `<string>` | \.avro$ | The regular expression that files must match in order to be considered avro files. Optional. |
| `vix.splunk.search.splitter.parquet.simplifyresult` | `<boolean>` | true | If enabled, field names for map and list type fields will be simplified by May be specified in either the provider stanza or in the virtual index stanza. |
| `vix.splunk.search.splitter.hive.ppd` | `<boolean>` | true | Enable or disable Hive ORC Predicate Push Down. If enabled, ORC PPD will be applied whenever possible to prune unnecessary May be specified in either the provider stanza or in the virtual index stanza. |
| `vix.splunk.search.splitter.hive.fileformat` | `textfile|sequencefile|rcfile|orc` | "textfile" | Format of the Hive data files in this provider. May be specified in either the provider stanza or in the virtual index stanza. |
| `vix.splunk.search.splitter.hive.dbname` | `<DB name>` | "default" | Name of Hive database to be accessed by this provider. Optional. |
| `vix.splunk.search.splitter.hive.tablename` | `<table name>` | — | Table accessed by this provider. Required property. |
| `vix.splunk.search.splitter.hive.columnnames` | `<list of column names>` | — | Comma-separated list of file names. Required if using Hive, not using metastore. |
| `vix.splunk.search.splitter.hive.columntypes` | `string:float:int # COLON separated list of column types, required` | — | Colon-separated list of column- types. Required if using Hive, not using metastore. |
| `vix.splunk.search.splitter.hive.serde` | `<SerDe class>` | — | Fully-qualified class name of SerDe. Required if using Hive, not using metastore, and if specified in creation of Hive table. |
| `vix.splunk.search.splitter.hive.serde.properties` | `<list of key-value pairs>` | — | Comma-separated list of "key=value" pairs. Required if using Hive, not using metastore, and if specified in creation of Hive table. |
| `vix.splunk.search.splitter.hive.fileformat.inputformat` | `<InputFormat class>` | — | Fully-qualified class name of an InputFormat to be used with Hive table data. Can be specified in either the provider stanza or in the virtual index stanza. |
| `vix.splunk.search.splitter.hive.rowformat.fields.terminated` | `<delimiter>` | — | Will be set as the Hive SerDe property "field.delim". Optional. |
| `vix.splunk.search.splitter.hive.rowformat.escaped` | `<escape char>` | — | Will be set as the Hive SerDe property "escape.delim". Optional. |
| `vix.splunk.search.splitter.hive.rowformat.lines.terminated` | `<delimiter>` | — | Will be set as the Hive SerDe property "line.delim". Optional. |
| `vix.splunk.search.splitter.hive.rowformat.mapkeys.terminated` | `<delimiter>` | — | Will be set as the Hive SerDe property "mapkey.delim". Optional. |
| `vix.splunk.search.splitter.hive.rowformat.collectionitems.terminated` | `<delimiter>` | — | Will be set as the Hive SerDe property "colelction.delim". Optional. |
| `vix.output.buckets.max.network.bandwidth` | `0|<bits per second>` | 0 (no throttling) | Throttles network bandwidth to <bits per second> Set at provider level. Applied to all virtual indexes using a provider |

### `[<virtual_index_name>]`

Virtual index stanza; sets `vix.provider` and Hadoop/streaming input options.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `vix.provider` | `<provider_name>` | — | Name of the external resource provider to use for this virtual index. |
| `vix.input.x.path` | `<path>` | — | Path in a Hadoop filesystem (usually HDFS or S3). May contain wildcards. |
| `vix.input.x.accept` | `<regex>` | — | Specifies an allow list regex. Only files within the location given by matching vix.input.x.path, whose |
| `vix.input.x.ignore` | `<regex>` | — | Specifies a deny list regex. Searches will ignore paths matching this regex. |
| `vix.input.x.required.fields` | `<comma separated list of fields>` | — | Fields that will be kept in search results even if the field is not |
| `vix.input.x.et.regex` | `<regex>` | — | Regex extracting earliest time from vix.input.x.path |
| `vix.input.x.et.format` | `<java.text.SimpleDateFormat date pattern>` | — | Format of the extracted earliest time. See documentation for java.text.SimpleDateFormat |
| `vix.input.x.et.offset` | `<seconds>` | — | Offset in seconds to add to the extracted earliest time. |
| `vix.input.x.et.timezone` | `<java.util.SimpleTimeZone timezone id>` | — | Timezone in which to interpret the extracted earliest time. Examples: "America/Los_Angeles" or "GMT-8:00" |
| `vix.input.x.et.value` | `mtime|<epoch time in milliseconds>` | — | Sets the earliest time for this virtual index. Can be used instead of extracting times from the path via vix.input.x.et.regex When set to "mtime", uses the file modification time as the earliest time. |
| `vix.input.x.lt.regex` | `<regex>` | — | Latest time equivalent of vix.input.x.et.regex |
| `vix.input.x.lt.format` | `<java.text.SimpleDateFormat date pattern>` | — | Latest time equivalent of vix.input.x.et.format |
| `vix.input.x.lt.offset` | `<seconds>` | — | Latest time equivalent of vix.input.x.et.offset |
| `vix.input.x.lt.timezone` | `<java.util.SimpleTimeZone timezone id>` | — | Latest time equivalent of vix.input.x.et.timezone |
| `vix.input.x.lt.value` | `<mod time>` | — | Latest time equivalent of vix.input.x.et.value |
| `vix.output.buckets.path` | `<hadoop path>` | — | Path to a hadoop filesystem where buckets will be archived |
| `vix.output.buckets.older.than` | `<integer>` | — | The age of a bucket, in seconds, before it is archived. The age of a bucket is determined by the the earliest _time field of |
| `vix.output.buckets.from.indexes` | `<comma separated list of splunk indexes>` | — | List of (non-virtual) indexes that will get archived to this (virtual) index. |
| `vix.unified.search.cutoff_sec` | `<seconds>` | — | Window length before present time that configures where events are retrieved Events from now to now-cutoff_sec will be retrieved from the splunk index |
| `recordreader.<name>.<conf_key>` | `<conf_value>` | — | Sets a configuration key for a RecordReader with <name> to <conf_value> |
| `recordreader.<name>.regex` | `<regex>` | — | Regex specifying which files this RecordReader can be used for. |
| `recordreader.journal.buffer.size` | `<bytes>` | — | Buffer size used by the journal record reader |
| `recordreader.csv.dialect` | `default|excel|excel-tab|tsv` | — | Set the csv dialect for csv files A csv dialect differs on delimiter_char, quote_char and escape_char. Here is a list of how the different dialects are defined in order delimiter, default = , " \ excel = , " " excel-tab = \t " " tsv = \t " \ |
| `splitter.<name>.<conf_key>` | `<conf_value>` | — | Sets a configuration key for a split generator with <name> to <conf_value> See comment above under "PER VIRTUAL INDEX OR PROVIDER OPTIONS". This means |
| `splitter.file.split.minsize` | `<integer>` | 1 | Minimum size, in bytes, for file splits. |
| `splitter.file.split.maxsize` | `<integer>` | Long.MAX_VALUE | Maximum size, in bytes, for file splits. |

### `[volume:<volume_name>]`

Storage volume definition for local or remote paths; referenced from index paths via `volume:` prefix.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `storageType` | `local | remote` | "local" | Optional. Specifies whether the volume definition is for indexer local storage or remote |
| `path` | `<path on server>` | — | Required. If storageType is set to its default value of "local": The 'path' setting points to the location on the file system where all This location must not overlap with the location for any other volume If storageType is set to "remote": The 'path' setting points to the remote storage location where indexes The... |
| `maxVolumeDataSizeMB` | `<positive integer>` | — | If set, this setting limits the total size of all databases that reside If the size is exceeded, splunkd removes buckets with the oldest value The highest legal value is 4294967295. The lowest legal value is 1. |
| `rotatePeriodInSecs` | `<nonnegative integer>` | The global 'rotatePeriodInSecs' value | Optional, ignored for storageType=remote Specifies period of trim operation for this volume. The highest legal value is 4294967295. |
| `remote.*` | `<string>` | — | With remote volumes, communication between the indexer and the external Optional. |
| `remote.s3.header.<http-method-name>.<header-field-name>` | `<string>` | — | Enable server-specific features, such as reduced redundancy, encryption, Example: remote.s3.header.PUT.x-amz-storage-class = REDUCED_REDUNDANCY Optional. |
| `remote.s3.access_key` | `<string>` | (none) | Specifies the access key to use when authenticating with the remote storage If not specified, the indexer will look for these environment variables: If the environment variables are not set and the indexer is running on EC2, Unencrypted access key cannot begin with "$1$" or "$7$". These prefixes are reserved Optional. |
| `remote.s3.secret_key` | `<string>` | (none) | Specifies the secret key to use when authenticating with the remote storage If not specified, the indexer will look for these environment variables: If the environment variables are not set and the indexer is running on EC2, Unencrypted secret key cannot begin with "$1$" or "$7$". These prefixes are reserved Optional. |
| `remote.s3.list_objects_version` | `v1|v2` | v1 | The AWS S3 Get Bucket (List Objects) Version to use. See AWS S3 documentation "GET Bucket (List Objects) Version 2" for details. |
| `remote.s3.signature_version` | `v2|v4` | v4 | The signature version to use when authenticating with the remote storage For 'sse-kms' and 'sse-c' server-side encryption schemes, and for 'cse' For signature_version=v2 you must set url_version=v1. Optional. |
| `remote.s3.url_version` | `v1|v2` | v1 | Specifies which url version to use, both for parsing the endpoint/path, and for communicating with the remote storage. This value only needs to be specified when running on non-AWS S3-compatible storage that has been configured to use v2 urls. |
| `remote.s3.auth_region` | `<string>` | (none) | The authentication region to use for signing requests when interacting Used with v4 signatures only. If unset and the endpoint (either automatically constructed or explicitly If unset and an authentication region cannot be determined, the request Optional. |
| `remote.s3.use_delimiter` | `<boolean>` | true | Specifies whether a delimiter (currently "guidSplunk") should be A delimiter groups objects that have the same delimiter value Optional. |
| `remote.s3.supports_versioning` | `<boolean>` | true | Specifies whether the remote storage supports versioning. Versioning is a means of keeping multiple variants of an object This setting determines how splunkd removes data from remote storage. |
| `remote.s3.endpoint` | `<URL>` | — | The URL of the remote storage system supporting the S3 API. The scheme, http or https, can be used to enable or disable SSL connectivity If not specified and the indexer is running on EC2, the endpoint will be Example: https://<bucketname>.s3.us-west-2.amazonaws.com Optional. |
| `remote.s3.bucket_name` | `<string>` | — | Specifies the S3 bucket to use when endpoint isn't set. Example Used for constructing the amazonaws.com hostname, as shown above. |
| `remote.s3.tsidx_compression` | `<boolean>` | false | DEPRECATED; use 'remote.s3.compression' instead. Whether or not the indexer compresses tsidx files before it uploads them to S3. |
| `remote.s3.compression` | `<boolean>` | false | Whether or not the indexer compresses files before it uploads them to S3. A value of "true" means the indexer compresses files before it uploads Ensure that all indexers run Splunk Enterprise version 9.4.0 or This feature is not backward compatible. |
| `remote.s3.compression_extension_list` | `<comma-separated list>` | tsidx | A list of extensions of the files to be compressed when 'remote.s3.compression' |
| `remote.s3.multipart_download.part_size` | `<unsigned integer>` | 134217728 (128 MB) | Sets the download size of parts during a multipart download. This setting uses HTTP/1.1 Range Requests (RFC 7233) to improve throughput The special value of 0 disables downloading in multiple parts. |
| `remote.s3.multipart_upload.part_size` | `<unsigned integer>` | 134217728 (128 MB) | Sets the upload size of parts during a multipart upload. The special value of 0 disables uploading in multiple parts. |
| `remote.s3.multipart_max_connections` | `<unsigned integer>` | 8 | Specifies the maximum number of HTTP connections to have in progress for A value of 0 means unlimited. |
| `remote.s3.max_idle_connections` | `<unsigned integer>` | 25 | Specifies the maximum number of idle HTTP connections that can be pooled for A value of 0 means pooling of connections is disabled. |
| `remote.s3.enable_data_integrity_checks` | `<boolean>` | false | If set to true, Splunk sets the data checksum in the metadata field of the The checksum is used to verify the integrity of the data on uploads. |
| `remote.s3.enable_signed_payloads` | `<boolean>` | true | If set to true, Splunk signs the payload during upload operation to S3. Valid only for remote.s3.signature_version = v4 |
| `remote.s3.retry_policy` | `max_count` | max_count | Sets the retry policy to use for remote file operations. A retry policy specifies whether and how to retry file operations that fail Retry policies: Optional. |
| `remote.s3.max_count.max_retries_per_part` | `<unsigned integer>` | 9 | When the 'remote.s3.retry_policy' setting is "max_count", sets the maximum number The count is maintained separately for each file part in a multipart download Optional. |
| `remote.s3.max_count.max_retries_in_total` | `<unsigned integer>` | 128 | When the remote.s3.retry_policy setting is max_count, sets the maximum number The count is maintained for each file as a whole. Optional. |
| `remote.s3.timeout.connect` | `<unsigned integer>` | 5000 | Set the connection timeout, in milliseconds, to use when interacting Optional. |
| `remote.s3.timeout.read` | `<unsigned integer>` | 60000 | Set the read timeout, in milliseconds, to use when interacting with Optional. |
| `remote.s3.timeout.write` | `<unsigned integer>` | 60000 | Set the write timeout, in milliseconds, to use when interacting with Optional. |
| `remote.s3.sslVerifyServerCert` | `<boolean>` | false | If this is set to true, Splunk verifies certificate presented by S3 Optional |
| `remote.s3.sslVersions` | `<comma-separated list>` | tls1.2 | The list of TLS versions to use to connect to 'remote.s3.endpoint'. The versions available are "tls1.0", "tls1.1", and "tls1.2". |
| `remote.s3.sslCommonNameToCheck` | `<commonName1>, <commonName2>, ..` | not set | If this value is set, and 'remote.s3.sslVerifyServerCert' is set to true, |
| `remote.s3.sslAltNameToCheck` | `<alternateName1>, <alternateName2>, ..` | (none) | If this value is set, and 'remote.s3.sslVerifyServerCert' is set to true, |
| `remote.s3.sslRootCAPath` | `<path>` | [sslConfig/caCertFile] in server.conf | Full path to the Certificate Authority (CA) certificate PEM format file Optional. |
| `remote.s3.cipherSuite` | `<cipher suite string>` | TLSv1+HIGH:TLSv1.2+HIGH:@STRENGTH | If set, uses the specified cipher string for the SSL connection. If not set, uses the default cipher string. |
| `remote.s3.ecdhCurves` | `<comma-separated list>` | (none) | ECDH curves to use for ECDH key negotiation. The curves should be specified in the order of preference. |
| `remote.s3.dhFile` | `<path>` | (none) | PEM format Diffie-Hellman parameter file name. DH group size should be no less than 2048bits. |
| `remote.s3.encryption` | `sse-s3 | sse-kms | sse-c | cse | none` | none | The encryption scheme to use for data buckets that are currently being stored (data at rest). sse-s3: Search for "Protecting Data Using Server-Side Encryption with Amazon S3-Managed sse-kms: Search for "Protecting Data Using Server-Side Encryption with CMKs Stored in AWS sse-c: Search for "Protecting Data Using... |
| `remote.s3.encryption.cse.algorithm` | `aes-256-gcm` | aes-256-gcm | Currently not supported. This setting is related to a feature that is The encryption algorithm to use for bucket encryption while Optional. |
| `remote.s3.encryption.cse.key_type` | `kms` | kms | Currently not supported. This setting is related to a feature that is The mechanism that the Splunk platform uses to generate the key The only valid value is 'kms', indicating AWS KMS service. |
| `remote.s3.encryption.cse.key_refresh_interval` | `<unsigned integer>` | 86400 | Currently not supported. This setting is related to a feature that is The interval, in seconds, at which the Splunk platform generates a new key and uses Optional. |
| `remote.s3.encryption.cse.tmp_dir` | `<path>` | $SPLUNK_HOME/var/run/splunk/cse-tmp | Currently not supported. This setting is related to a feature that is The full path to the directory where the Splunk platform temporarily stores encrypted files. |
| `remote.s3.kms.endpoint` | `<string>` | (none) | Indicates the host name to use when server-side or client-side encryption If not set, SmartStore uses 'remote.s3.kms.auth_region' to Optional. |
| `remote.s3.kms.key_id` | `<string>` | (none) | Required if remote.s3.encryption = sse-c \| sse-kms \| cse Specifies the identifier for Customer Master Key (CMK) on KMS. It can be the Examples: |
| `remote.s3.kms.access_key` | `<string>` | (none) | Similar to 'remote.s3.access_key'. If not specified, KMS access uses 'remote.s3.access_key'. |
| `remote.s3.kms.secret_key` | `<string>` | (none) | Similar to 'remote.s3.secret_key'. If not specified, KMS access uses 'remote.s3.secret_key'. |
| `remote.s3.kms.auth_region` | `<string>` | (none) | Required if 'remote.s3.auth_region' is unset and Splunk can not Similar to 'remote.s3.auth_region'. If not specified, KMS access uses 'remote.s3.auth_region'. |
| `remote.s3.kms.max_concurrent_requests` | `<unsigned integer>` | 10 | Optional. Limits maximum concurrent requests to KMS from this Splunk instance. |
| `remote.s3.kms.<ssl_settings>` | `<...>` | — | Optional. Check the descriptions of the SSL settings for remote.s3.<ssl_settings> Valid ssl_settings are sslVerifyServerCert, sslVersions, sslRootCAPath, All of these settings are optional. |
| `remote.s3.max_batchremove_batch_size` | `<unsigned integer>` | 1 | Specifies the maximum number of remote objects that can be included in Setting this value to 0 or 1 disables the batch removal feature. The highest permissible value is 1000. |
| `remote.s3.max_download_batch_size` | `<unsigned integer>` | 50 | The maximum number of objects that can be downloaded in a single batch |
| `remote.s3.use_sdk` | `true|false|auto` | false | Currently not supported. This setting is related to a feature that is Specifies whether to use the AWS C++ SDK or make direct HTTP requests to If auto is specified, the SDK will be used if the storage provider is S3 |
| `remote.s3.data_integrity_validation` | `disabled | sha256` | disabled | Specifies the signature algorithm that SmartStore uses to generate file A value of "disabled" means that SmartStore ignores existing file signatures A value of "sha256" means SmartStore uses the SHA-256 encryption algorithm This setting is optional. |
| `federated.provider` | `<provider_name>` | "" | Identifies the federated provider on which this search is run. Select the stanza for the federated provider defined in the federated.conf file. |
| `federated.dataset` | `<string>` | (none) | Identifies the dataset located on the federated providers. The dataset takes a format of <prefix>:<remote_name>. |
| `remote.gs.credential_file` | `<credentials.json>` | Not set. | Name of the json file with GCS credentials. For standalone indexers, this file must be located in the $SPLUNK_HOME/etc/auth For indexer clusters, this file must be located either in the _cluster/local You must set either this setting or 'service_account_email' to use The indexer tries different ways of providing... |
| `remote.gs.service_account_email` | `<email-address>` | Not set. | Credential of the specified custom service_account is used. This service_account must be associated with every Compute Engine This setting uses GCP metadata server to get the credential. |
| `remote.gs.project_id` | `<string>` | Not set. | The ID of the GCP project associated with the volume. The project ID is a unique string across Google Cloud. |
| `remote.gs.upload_chunk_size` | `<unsigned integer>` | 33554432 (32MB) | Specifies the maximum size, in bytes, for file chunks in a parallel upload. A value of 0 disables uploading in multiple chunks. |
| `remote.gs.download_chunk_size` | `<unsigned integer>` | 33554432 (32MB) | Specifies the maximum size for file chunks in a parallel download. Specify as bytes Minimum value: 5242880 (5 MB) |
| `remote.gs.max_parallel_non_upload_threads` | `<unsigned integer>` | 250 | Number of threads used for parallel downloads and other async gcs This is the total count across all such operations. This does not include parallel upload operations, which are specified For SmartStore, this is only used for parallel download of files. |
| `remote.gs.max_threads_per_parallel_upload` | `<unsigned integer>` | 64 | Number of threads used for a single parallel upload operation. |
| `remote.gs.max_connection_pool_size` | `<unsigned integer>` | 500 | Size of the connection pool to the remote storage per index volume. |
| `remote.gs.max_download_batch_size` | `<unsigned integer>` | 50 | The maximum number of objects that can be downloaded in a single batch |
| `remote.gs.remove_all_versions` | `<boolean>` | true | If true, a remove operation on an object explicitly deletes all versions |
| `remote.gs.use_delimiter` | `<boolean>` | true | Specifies whether a delimiter (currently "guidSplunk") should be A delimiter groups objects that have the same delimiter value Optional. |
| `remote.gs.retry_policy` | `max_count` | max_count | Sets the retry policy to use for remote file operations. A retry policy specifies whether and how to retry file operations that fail Retry policies: |
| `remote.gs.max_count.max_retries_per_part` | `<unsigned integer>` | 9 | When the remote.gs.retry_policy setting is max_count, sets the maximum number The count is maintained separately for each file part in a multipart download |
| `remote.gs.backoff.initial_delay_ms` | `<unsigned integer>` | 3000 (3s) | If retries are enabled, an exponential backoff interval is used to perform This setting specifies the delay for the first retry, in milliseconds. |
| `remote.gs.backoff.max_delay_ms` | `<unsigned integer>` | 60000 (60s) | If retries are enabled, an exponential backoff interval is used to perform This setting specifies the maximum delay before the next retry, in milliseconds |
| `remote.gs.backoff.scaling` | `<unsigned integer>` | 2 | If retries are enabled, an exponential backoff interval is used to perform This setting specifies the amount by which subsequent delays are scaled, |
| `remote.gs.connectUsingIpVersion` | `auto|4-only|6-only` | auto | When making outbound connections to the storage service, this setting Connections to literal IPv4 or IPv6 addresses are unaffected by this setting. "4-only" : Splunkd only attempts to connect to the IPv4 address. |
| `remote.gs.sslVersionsForClient` | `tls1.0|tls1.1|tls1.2` | tls1.2 | Defines the minimum ssl/tls version to use for outgoing connections. |
| `remote.gs.sslVerifyServerCert` | `<boolean>` | false. | If set to true, Splunkd authenticates the certificate of the services |
| `remote.gs.sslVerifyServerName` | `<boolean>` | false | Whether or not splunkd, as a client, performs a TLS hostname validation check A TLS hostname validation check ensures that a client Specifically, the validation check forces splunkd to verify that either For this setting to have any effect, the 'sslVerifyServerCert' setting must A value of "true" for this setting... |
| `remote.gs.sslRootCAPath` | `<path>` | value of [sslConfig]/caCertFile in server.conf | Full path to the Certificate Authority (CA) certificate PEM format file |
| `remote.gs.cipherSuite` | `<cipher suite string>` | value of [sslConfig]/cipherSuite in server.conf | If set, uses the specified cipher string for the SSL connection. If not set, uses the default cipher string. |
| `remote.gs.encryption` | `gcp-sse-c | gcp-sse-kms | gcp-sse-gcp` | gcp-sse-gcp | The encryption scheme to use for index buckets while stored on GCS (data-at-rest). gcp-sse-c: Maps to GCP customer-supplied encryption keys. |
| `remote.gs.gcp_kms.locations` | `<string>` | none. | Required if 'remote.gs.encryption' is set to gcp-sse-c or gcp-sse-kms. Specifies the geographical regions where KMS key rings and keys are stored for access. |
| `remote.gs.gcp_kms.key_ring` | `<string>` | none. | Required if 'remote.gs.encryption' is set to gcp-sse-c or gcp-sse-kms. Specifies the name of the key ring used for encryption when uploading data to GCS. |
| `remote.gs.gcp_kms.key` | `<string>` | none. | Required if 'remote.gs.encryption' is set to gcp-sse-c or gcp-sse-kms. Specifies the name of the encryption key used for uploading data to GCS. |
| `remote.gs.data_integrity_validation` | `disabled | sha256` | disabled | Specifies the signature algorithm that SmartStore uses to generate file A value of "disabled" means that SmartStore ignores existing file signatures A value of "sha256" means SmartStore uses the SHA-256 encryption algorithm This setting is optional. |
| `remote.azure.use_delimiter` | `<boolean>` | true | Specifies whether a delimiter (currently "guidSplunk") should be A delimiter groups objects that have the same delimiter value |
| `remote.azure.sslVersions` | `tls1.0|tls1.1|tls1.2` | tls1.2 | Specifies the minimum SSL/TLS version to use for outgoing connections. |
| `remote.azure.sslVerifyServerCert` | `<boolean>` | false. | If set to true, the indexer cache manager authenticates the certificate of |
| `remote.azure.sslVerifyServerName` | `<boolean>` | false | Whether or not splunkd, as a client, performs a TLS hostname validation check A TLS hostname validation check ensures that a client Specifically, the validation check forces splunkd to verify that either For this setting to have any effect, the 'sslVerifyServerCert' setting must A value of "true" for this setting... |
| `remote.azure.httpKeepAlive` | `<boolean>` | true. | If set to true, All successful requests to the Microsoft Azure Storage API |
| `remote.azure.access_key` | `<string>` | (none) | Specifies the access key (storage account name) to use when authenticating If a value is not specified for the 'remote.azure.endpoint' setting, the |
| `remote.azure.secret_key` | `<string>` | (none) | Specifies the secret key to use when authenticating with the remote storage |
| `remote.azure.tenant_id` | `<string>` | (none) | Specifies the ID of the tenant, which is an instance of an Azure AD This setting is required only for client token and workload identity If this setting is not configured, the system checks the |
| `remote.azure.client_id` | `<string>` | (none) | Specifies the ID of the client, also known as the application ID. This setting is required only for client token and workload identity This setting is optional for managed identity authentication. |
| `remote.azure.client_secret` | `<string>` | (none) | Specifies the secret key to use when authenticating using the client_id. You Needed only for client token-based authentication. |
| `remote.azure.federated_token_file` | `<path>` | (none) | Specifies the full path to the service account token file. This setting is required only when using Azure workload identity If this setting is not configured, the system checks the |
| `remote.azure.authority_host` | `<string>` | (none) | Specifies the Azure Active Directory (AAD) endpoint URL. This setting is not valid for managed identity authentication. |
| `remote.azure.sslRootCAPath` | `<path>` | value of [sslConfig]/caCertFile in server.conf | Full path to the Certificate Authority (CA) certificate PEM format file |
| `remote.azure.cipherSuite` | `<cipher suite string>` | value of [sslConfig]/cipherSuite in server.conf | If set, uses the specified cipher string for the SSL connection. If not set, uses the default cipher string. |
| `remote.azure.encryption` | `azure-sse-kv | azure-sse-ms | azure-sse-c` | azure-sse-ms | The encryption scheme to use for containers that are currently being stored. azure-sse-kv: Maps to Azure customer-managed keys in a key vault. |
| `remote.azure.azure_kv.endpoint` | `<string>` | (none) | The URL of the Microsoft Azure Key Vault endpoint. The value of this setting must reference an Azure Key Vault location where the keys are stored. |
| `remote.azure.azure_kv.key_name` | `<string>` | (none) | Specifies the Azure Key Vault Key name for key encryption and decryption. Required if 'remote.azure.encryption' has a value of "azure-sse-c". |
| `remote.azure.azure_kv.key_vault_tenant_id` | `<string>` | the value of the 'remote.azure.tenant_id' setting. | Specifies the ID of the Azure Active Directory tenant for This setting is required only for client token and workload identity If this setting and the 'remote.azure.tenant_id' setting are not You do not need to configure this setting if both of the following You have configured the 'remote.azure.tenant_id' setting... |
| `remote.azure.azure_kv.key_vault_client_id` | `<string>` | the value of the 'remote.azure.client_id' setting. | Specifies the ID of the client, also known as the application ID. This setting is required only for client token and workload identity This setting is optional for managed identity authentication. |
| `remote.azure.azure_kv.federated_token_file` | `<path>` | the value of the 'remote.azure.federated_token_file' setting. | Specifies the full path to the service account token file. This setting is required only when using Azure workload identity If this setting and the 'remote.azure.federated_token_file' setting are You do not need to configure this setting if both of the following You have configured the... |
| `remote.azure.azure_kv.authority_host` | `<url>` | the value of the 'remote.azure.authority_host' setting. | Specifies the Azure Active Directory (AAD) endpoint URL. This setting is not valid for managed identity authentication. |
| `remote.azure.azure_kv.key_vault_client_secret` | `<string>` | the value of the 'remote.azure.client_secret' setting. | Specifies the secret key to use when authenticating the Key Vault using the client_id. Required only for client token-based authentication. |
| `remote.azure.supports_versioning` | `<boolean>` | true | Specifies whether the remote storage supports versioning. Versioning is a means of keeping multiple variants of an object This setting determines how the indexer cache manager removes data from |
| `remote.azure.endpoint` | `<URL>` | — | The URL of the Microsoft Azure Storage endpoint supporting the Azure The scheme, http or https, can be used to enable or disable SSL The value of this setting must point to an Azure Blob storage location, not a Example: https://<account-name>.blob.core.windows.net/ |
| `remote.azure.container_name` | `<string>` | — | Specifies the Azure container to use complying with Microsoft Azure |
| `remote.azure.upload.chunk_size` | `<unsigned integer>` | 78643200 (75MB) | Specifies the maximum size for file chunks in a parallel upload. Specify as bytes |
| `remote.azure.upload.concurrency` | `<unsigned integer>` | 5 | Specifies the number of threads used for a single parallel upload operation. |
| `remote.azure.download.chunk_size` | `<unsigned integer>` | 78643200 (75MB) | Specifies the maximum size for file chunks in a parallel download. Specify as bytes |
| `remote.azure.download.concurrency` | `<unsigned integer>` | 5 | Specifies the number of threads used for a single parallel download operation. |
| `remote.azure.max_download_batch_size` | `<unsigned integer>` | 50 | The maximum number of objects that can be downloaded in a single batch |
| `remote.azure.max_listing_page_size` | `<unsigned integer>` | 1000 | The maximum number of blobs returned in a single list query operation. |
| `remote.azure.retry_policy` | `max_count` | max_count | Sets the retry policy to use for remote file operations. A retry policy specifies whether and how to retry file operations that fail Retry policies: |
| `remote.azure.max_count.max_retries_in_total` | `<unsigned integer>` | 3 | When the remote.azure.retry_policy setting is max_count, sets the maximum The count is maintained for each file as a whole. Optional. |
| `remote.azure.backoff.initial_delay_ms` | `<unsigned integer>` | 4000 (4s) | If retries are enabled, a backoff interval is used to perform This setting specifies the delay between each retry, in milliseconds. |
| `remote.azure.backoff.max_retry_delay_ms` | `<unsigned integer>` | 2 * 60 * 1000 (120s) | If retries are enabled, a backoff interval is used to perform This setting specifies the maximum delay before the next retry, in |
| `remote.azure.data_integrity_validation` | `disabled | sha256` | disabled | Specifies the signature algorithm that SmartStore uses to generate file A value of "disabled" means that SmartStore ignores existing file signatures A value of "sha256" means SmartStore uses the SHA-256 encryption algorithm This setting is optional. |
| `remote.azure.tsidx_compression` | `<boolean>` | false | DEPRECATED; use 'remote.azure.compression' instead. Whether the indexer compresses tsidx files before it uploads them to Azure. |
| `remote.azure.compression` | `<boolean>` | false | Whether or not the indexer compresses files before it uploads them to Azure. A value of "true" means the indexer compresses files before it uploads Ensure that all indexers run Splunk Enterprise version 9.4.0 or This feature is not backward compatible. |
| `remote.azure.compression_extension_list` | `<comma-separated list>` | tsidx | A list of extensions of the files to be compressed when 'remote.azure.compression' |
