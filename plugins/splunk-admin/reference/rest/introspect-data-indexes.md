# REST bundle: `data/indexes`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/data/indexes`

Create and manage data indexes.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/indexes` |
| Auth required | Yes |
| Capability | `indexes_list_all optional restriction per authorize.conf` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| datatype | String | No | event | Valid values: (all\|event\|metric). Specifies the type of index. |
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| assureUTF8 | string |  |
| blockSignSize | string |  |
| blockSignatureDatabase | string |  |
| coldPath | string | Filepath to the cold databases for the index. |
| coldPath_expanded | string | Absoute filepath to the cold databases. |
| coldToFrozenDir | string |  |
| coldToFrozenScript | string |  |
| compressRawdata | string | This value is ignored. splunkd process always compresses raw data. |
| currentDBSizeMB | string | Total size, in MB, of data stored in the index. The total incudes data in the home, cold and thawed paths. |
| datatype | string | The type of index (event\|metric). |
| defaultDatabase | string | If no index destination information is available in the input data, the index shown here is the destination of such data. |
| disabled | string | Indicates if the index is disabled. |
| enableRealtimeSearch | string |  |
| frozenTimePeriodInSecs | string |  |
| homePath | string | An absolute path that contains the hot and warm buckets for the index. |
| homePath_expanded | string | An absolute filepath to the hot and warm buckets for the index. |
| indexThreads | string |  |
| isInternal | string | Indicates if this is an internal index (for example, _internal, _audit). |
| isReady | string | Indicates if the index is properly initialized. |
| lastInitTime | string |  |
| maxConcurrentOptimizes | string |  |
| maxDataSize | string |  |
| maxHotBuckets | string |  |
| maxHotIdleSecs | string |  |
| maxHotSpanSecs | string |  |
| maxMemMB | string |  |
| maxMetaEntries | string |  |
| maxRunningProcessGroups | string |  |
| maxTime | string | ISO8601 timestamp of the newest event time in the index. |
| maxTotalDataSizeMB | string | The maximum size of an index, in MB. |
| maxWarmDBCount | string | The maximum number of warm buckets. If this number is exceeded, the warm bucket/s with the lowest value for their latest times are moved to cold. |
| memPoolMB | string |  |
| minRawFileSyncSecs | string |  |
| minTime | string | ISO8601 timestamp of the oldest event time in the index. |
| partialServiceMetaPeriod | string |  |
| quarantineFutureSecs | string |  |
| quarantinePastSecs | string |  |
| rawChunkSizeBytes | string |  |
| rotatePeriodInSecs | string |  |
| serviceMetaPeriod | string |  |
| summarize | string | If true, leaves out certain index details, which provides a faster response. |
| suppressBannerList | string |  |
| sync | string |  |
| syncMeta | string |  |
| thawedPath | string | An absolute path that contains the thawed (resurrected) databases for the index. |
| thawedPath_expanded | string | Absolute filepath to the thawed (resurrected) databases. |
| throttleCheckPeriod | string |  |
| totalEventCount | string | Total number of events in the index. |
| tsidxDedupPostingsListMaxTermsLimit | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/indexes?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| blockSignSize | Number | No | 0 |  |
| bucketRebuildMemoryHint | String | No | auto |  |
| coldPath | String | No |  |  |
| coldToFrozenDir | String | No |  |  |
| coldToFrozenScript | String | No |  |  |
| compressRawdata | Boolean | No | true | This parameter is ignored. The splunkd process always compresses raw data. |
| datatype | String | No | event | Valid values: (event\|metric). Specifies the type of index. |
| enableOnlineBucketRepair | Boolean | No | true |  |
| frozenTimePeriodInSecs | Number | No | 188697600 |  |
| homePath | String | No |  |  |
| maxBloomBackfillBucketAge | Number | No | 30d |  |
| maxConcurrentOptimizes | Number | No | 6 |  |
| maxDataSize | Number | No | auto |  |
| maxHotBuckets | Number | No | 3 |  |
| maxHotIdleSecs | Number | No | 0 |  |
| maxHotSpanSecs | Number | No | 7776000 |  |
| maxMemMB | Number | No | 5 |  |
| maxMetaEntries | Number | No | 1000000 |  |
| maxTimeUnreplicatedNoAcks | Number | No | 300 |  |
| maxTimeUnreplicatedWithAcks | Number | No | 60 |  |
| maxTotalDataSizeMB | Number | No | 500000 | The maximum size of an index (in MB). If an index grows larger than the maximum size, the oldest data is frozen. |
| maxWarmDBCount | Number | No | 300 | The maximum number of warm buckets. If this number is exceeded, the warm bucket/s with the lowest value for their latest times is moved to cold. |
| minRawFileSyncSecs | Number | No | disable |  |
| minStreamGroupQueueSize | Number | No | 2000 |  |
| required | String | No | The name of the index to create. |  |
| partialServiceMetaPeriod | Number | No | 0 |  |
| processTrackerServiceInterval | Number | No | 1 |  |
| quarantineFutureSecs | Number | No | 2592000 |  |
| quarantinePastSecs | Number | No | 77760000 |  |
| rawChunkSizeBytes | Number | No | 131072 |  |
| repFactor | String | No | 0 |  |
| rotatePeriodInSecs | Number | No | 60 | How frequently (in seconds) to check if a new hot bucket needs to be created. Also, how frequently to check if there are any warm/cold buckets that should be rolled/frozen. |
| serviceMetaPeriod | Number | No | 25 |  |
| syncMeta | Boolean | No | true |  |
| thawedPath | String | No |  |  |
| throttleCheckPeriod | Number | No | 15 |  |
| tstatsHomePath | String | No |  |  |
| warmToColdScript | String | No |  |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| assureUTF8 | string |  |
| blockSignSize | string |  |
| blockSignatureDatabase | string |  |
| bucketRebuildMemoryHint | string | Suggestion for the bucket rebuild process for the size of the time-series (tsidx) file to make. |
| coldPath | string | Filepath to the cold databases for the index. |
| coldPath_expanded | string | Absoute filepath to the cold databases. |
| coldToFrozenDir | string |  |
| coldToFrozenScript | string |  |
| compressRawdata | string | This value is ignored. splunkd process always compresses raw data. |
| currentDBSizeMB | string | Total size, in MB, of data stored in the index. The total incudes data in the home, cold and thawed paths. |
| datatype | string | The type of index (event\|metric). |
| defaultDatabase | string | If no index destination information is available in the input data, the index shown here is the destination of such data. |
| enableOnlineBucketRepair | string | Indicates whether to run asynchronous "online fsck" bucket repair, which runs in a process concurrently with Splunk software. |
| enableRealtimeSearch | string |  |
| frozenTimePeriodInSecs | string |  |
| homePath | string | An absolute path that contains the hot and warm buckets for the index. |
| homePath_expanded | string | An absolute filepath to the hot and warm buckets for the index. |
| indexThreads | string |  |
| isInternal | string | Indicates if this is an internal index (for example, _internal, _audit). |
| isReady | string | Indicates if an index is properly initialized. |
| lastInitTime | string |  |
| maxBloomBackfillBucketAge | string | If a bucket (warm or cold) is older than this, Splunk software does not create (or re-create) its bloom filter. |
| maxConcurrentOptimizes | string |  |
| maxDataSize | string |  |
| maxHotBuckets | string |  |
| maxHotIdleSecs | string |  |
| maxHotSpanSecs | string |  |
| maxMemMB | string |  |
| maxMetaEntries | string |  |
| maxTime | string | ISO8601 timestamp of the newest event time in the index. |
| maxTimeUnreplicatedNoAcks | string |  |
| maxTimeUnreplicatedWithAcks | string |  |
| maxTotalDataSizeMB | string | The maximum size of an index, in MB. |
| maxWarmDBCount | string | The maximum number of warm buckets. If this number is exceeded, the warm bucket/s with the lowest value for their latest times are moved to cold. |
| memPoolMB | string |  |
| minRawFileSyncSecs | string |  |
| minStreamGroupQueueSize | string | Minimum size of the queue that stores events in memory before committing them to a tsidx file. |
| minTime | string | ISO8601 timestamp of the oldest event time in the index. |
| partialServiceMetaPeriod | string |  |
| processTrackerServiceInterval | string | How often, in seconds, the indexer checks the status of the child OS processes it launched to see if it can launch new processes for queued requests. |
| quarantineFutureSecs | string |  |
| quarantinePastSecs | string |  |
| rawChunkSizeBytes | string |  |
| repFactor | string |  |
| rotatePeriodInSecs | string |  |
| serviceMetaPeriod | string |  |
| suppressBannerList | string |  |
| sync | string |  |
| syncMeta | string |  |
| thawedPath | string | Filepath to the thawed (resurrected) databases for the index. |
| thawedPath_expanded | string | Absolute filepath to the thawed (resurrected) databases. |
| throttleCheckPeriod | string |  |
| totalEventCount | string | Total number of events in the index. |
| tsidxDedupPostingsListMaxTermsLimit | string |  |
| tstatsHomePath | string | Location where datamodel acceleration TSIDX data for this index is stored. |
| warmToColdScript | string | Script to run when moving data from warm to cold. See input parameter description for details. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/indexes?output_mode=json'
```

---

# `/services/data/indexes/{name}`

Access, update, or delete the`{name}` index.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/indexes/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## DELETE

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/indexes/YOUR_NAME?output_mode=json'
```

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| summarize | Boolean | No | `false` |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| assureUTF8 | string |  |
| blockSignSize | string |  |
| blockSignatureDatabase | string |  |
| bloomfilterTotalSizeKB | string | Total size of all bloom filter files, in KB. |
| coldPath | string | Filepath to the cold databases for the index. |
| coldPath_expanded | string | Absoute filepath to the cold databases. |
| coldToFrozenDir | string |  |
| coldToFrozenScript | string |  |
| compressRawdata | string | This value is ignored. splunkd process always compresses raw data. |
| currentDBSizeMB | string | Total size, in MB, of data stored in the index. The total incudes data in the home, cold and thawed paths. |
| defaultDatabase | string | If no index destination information is available in the input data, the index shown here is the destination of such data. |
| disabled | string | Indicates if the index is disabled. |
| enableRealtimeSearch | string |  |
| frozenTimePeriodInSecs | string |  |
| homePath | string | An absolute path that contains the hot and warm buckets for the index. |
| homePath_expanded | string | An absolute filepath to the hot and warm buckets for the index. |
| indexThreads | string |  |
| isInternal | string | Indicates if this is an internal index (for example, _internal, _audit). |
| lastInitTime | string |  |
| maxConcurrentOptimizes | string |  |
| maxDataSize | string |  |
| maxHotBuckets | string |  |
| maxHotIdleSecs | string |  |
| maxHotSpanSecs | string |  |
| maxMemMB | string |  |
| maxMetaEntries | string |  |
| maxRunningProcessGroups | string |  |
| maxTime | string | UNIX timestamp of the newest event time in the index. |
| maxTotalDataSizeMB | string | The maximum size of an index, in MB. |
| maxWarmDBCount | string | Maximum number of warm buckets. |
| memPoolMB | string |  |
| minRawFileSyncSecs | string |  |
| minTime | string | UNIX timestamp of the oldest event time in the index. |
| numBloomfilters | string | The number of bloom filters created for this index. |
| numHotBuckets | string | The number of hot buckets created for this index. |
| numWarmBuckets | string | The number of warm buckets created for this index. |
| partialServiceMetaPeriod | string |  |
| quarantineFutureSecs | string |  |
| quarantinePastSecs | string |  |
| rawChunkSizeBytes | string |  |
| rotatePeriodInSecs | string |  |
| serviceMetaPeriod | string |  |
| summarize | string | If true, leaves out certain index details, which provides a faster response. |
| suppressBannerList | string |  |
| sync | string |  |
| syncMeta | string |  |
| thawedPath | string | An absolute path that contains the thawed (resurrected) databases for the index. |
| thawedPath_expanded | string | Absolute filepath to the thawed (resurrected) databases. |
| throttleCheckPeriod | string |  |
| totalEventCount | string | Total number of events in the index. |
| tsidxDedupPostingsListMaxTermsLimit | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/indexes/YOUR_NAME?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| blockSignSize | Number | No | 0 |  |
| bucketRebuildMemoryHint | String | No | auto |  |
| coldToFrozenDir | String | No |  |  |
| coldToFrozenScript | String | No |  |  |
| compressRawdata | Boolean | No | true | This parameter is ignored. The splunkd process always compresses raw data. |
| enableOnlineBucketRepair | Boolean | No | true |  |
| frozenTimePeriodInSecs | Number | No | 188697600 |  |
| maxBloomBackfillBucketAge | Number | No | 30d |  |
| maxConcurrentOptimizes | Number | No | 6 |  |
| maxDataSize | Number | No | auto |  |
| maxHotBuckets | Number | No | 3 |  |
| maxHotIdleSecs | Number | No | 0 |  |
| maxHotSpanSecs | Number | No | 7776000 |  |
| maxMemMB | Number | No | 5 |  |
| maxMetaEntries | Number | No | 1000000 |  |
| maxTimeUnreplicatedNoAcks | Number | No | 300 |  |
| maxTimeUnreplicatedWithAcks | Number | No | 60 |  |
| maxTotalDataSizeMB | Number | No | 500000 | The maximum size of an index (in MB). If an index grows larger than the maximum size, the oldest data is frozen. |
| maxWarmDBCount | Number | No | 300 | The maximum number of warm buckets. If this number is exceeded, the warm bucket/s with the lowest value for their latest times are moved to cold. |
| minRawFileSyncSecs | Number | No | disable |  |
| minStreamGroupQueueSize | Number | No | 2000 |  |
| partialServiceMetaPeriod | Number | No | 0 |  |
| processTrackerServiceInterval | Number | No | 1 |  |
| quarantineFutureSecs | Number | No | 2592000 |  |
| quarantinePastSecs | Number | No | 77760000 |  |
| rawChunkSizeBytes | Number | No | 131072 |  |
| repFactor | String | No | 0 |  |
| rotatePeriodInSecs | Number | No | 60 | How frequently (in seconds) to check if a new hot bucket needs to be created. Also, how frequently to check if there are any warm/cold buckets that should be rolled/frozen. |
| serviceMetaPeriod | Number | No | 25 |  |
| syncMeta | Boolean | No | true |  |
| throttleCheckPeriod | Number | No | 15 |  |
| tstatsHomePath | String | No |  |  |
| warmToColdScript | String | No |  |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| assureUTF8 | string |  |
| blockSignSize | string |  |
| blockSignatureDatabase | string |  |
| bucketRebuildMemoryHint | string | Suggestion for the bucket rebuild process for the size of the time-series (tsidx) file to make. |
| coldPath | string | Filepath to the cold databases for the index. |
| coldPath_expanded | string | Absoute filepath to the cold databases. |
| coldToFrozenDir | string |  |
| coldToFrozenScript | string |  |
| compressRawdata | string | This value is ignored. splunkd process always compresses raw data. |
| currentDBSizeMB | string | Total size, in MB, of data stored in the index. The total incudes data in the home, cold and thawed paths. |
| defaultDatabase | string | If no index destination information is available in the input data, the index shown here is the destination of such data. |
| enableOnlineBucketRepair | string | Indicates whether to run asynchronous "online fsck" bucket repair, which runs in a process concurrently with Splunk software. |
| enableRealtimeSearch | string |  |
| frozenTimePeriodInSecs | string |  |
| homePath | string | An absolute path that contains the hot and warm buckets for the index. |
| homePath_expanded | string | An absolute filepath to the hot and warm buckets for the index. |
| indexThreads | string |  |
| isInternal | string | Indicates if this is an internal index (for example, _internal, _audit). |
| lastInitTime | string |  |
| maxBloomBackfillBucketAge | string | If a bucket (warm or cold) is older than this, Splunk Enterprise does not create (or re-create) its bloom filter. |
| maxConcurrentOptimizes | string |  |
| maxDataSize | string |  |
| maxHotBuckets | string |  |
| maxHotIdleSecs | string |  |
| maxHotSpanSecs | string |  |
| maxMemMB | string |  |
| maxMetaEntries | string |  |
| maxTime | string | UNIX timestamp of the newest event time in the index. |
| maxTimeUnreplicatedNoAcks | string |  |
| maxTimeUnreplicatedWithAcks | string |  |
| maxTotalDataSizeMB | string | The maximum size of an index, in MB. |
| maxWarmDBCount | string | The maximum number of warm buckets. If this number is exceeded, the warm bucket/s with the lowest value for their latest times are moved to cold. |
| memPoolMB | string |  |
| minRawFileSyncSecs | string |  |
| minStreamGroupQueueSize | string | Minimum size of the queue that stores events in memory before committing them to a tsidx file. |
| minTime | string | UNIX timestamp of the oldest event time in the index. |
| partialServiceMetaPeriod | string |  |
| processTrackerServiceInterval | string | How often, in seconds, the indexer checks the status of the child OS processes it launched to see if it can launch new processes for queued requests. |
| quarantineFutureSecs | string |  |
| quarantinePastSecs | string |  |
| rawChunkSizeBytes | string |  |
| repFactor | string |  |
| rotatePeriodInSecs | string |  |
| serviceMetaPeriod | string |  |
| suppressBannerList | string |  |
| sync | string |  |
| syncMeta | string |  |
| thawedPath | string | Filepath to the thawed (resurrected) databases for the index. |
| thawedPath_expanded | string | Absolute filepath to the thawed (resurrected) databases. |
| throttleCheckPeriod | string |  |
| totalEventCount | string | Total number of events in the index. |
| tsidxDedupPostingsListMaxTermsLimit | string |  |
| tstatsHomePath | string | Location where datamodel acceleration TSIDX data for this index is stored. |
| warmToColdScript | string | Script to run when moving data from warm to cold. See input parameter description for details. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/indexes/YOUR_NAME?output_mode=json'
```

---

