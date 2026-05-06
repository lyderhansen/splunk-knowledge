
# distsearch.conf

Controls distributed search topology, authentication timeouts, knowledge-bundle replication policies (classic, cascading, mounted, experimental RFS), bundle allow/deny lists, and optional server groups addressable through `splunk_server_group`.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (search heads typically) |
| Pipeline phase | Search |
| Restart required | Yes |
| Related files | server.conf, limits.conf |

## Stanzas and settings

Splunk documents generic `[default]` inheritance rules (single stanza, merge order); no extra keys are unique beyond those noted below.

### `[distributedSearch]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | boolean | false | Turns distributed search off when true. |
| `heartbeatMcastAddr` | IP address | DEPRECATED | Legacy multicast discovery control; unused. |
| `heartbeatPort` | port | DEPRECATED | Legacy heartbeat UDP port; unused. |
| `ttl` | integer | DEPRECATED | Legacy TTL for multicast heartbeats. |
| `heartbeatFrequency` | integer | DEPRECATED | Legacy heartbeat cadence. |
| `statusTimeout` | integer | 10 | Timeout seconds when hitting `/services/server/info` during peer status refreshes. |
| `removedTimedOutServers` | boolean | ignored | Obsolete flag retained for compatibility. |
| `checkTimedOutServersFrequency` | integer | ignored | Obsolete polling knob. |
| `autoAddServers` | boolean | DEPRECATED | Former auto-discovery toggle. |
| `bestEffortSearch` | boolean | false | Lets peers without bundles participate while skipping incompatible peers. |
| `skipOurselves` | boolean | DEPRECATED | Former loop-prevention flag. |
| `servers` | URI list | none | Initial explicit peer URIs (`scheme://host:port`). |
| `disabled_servers` | URI list | none | Peers excluded from monitoring and search. |
| `quarantined_servers` | URI list | none | Peers monitored but skipped unless explicitly targeted. |
| `useDisabledListAsBlacklist` | boolean | false | Treats `disabled_servers` as definitive deny entries. |
| `useSHPBundleReplication` | `true` \| `false` \| `always` | true | Coordinates bundle replication among pooled search heads. |
| `trySSLFirst` | boolean | ignored | Obsolete TLS negotiation hint. |
| `peerResolutionThreads` | integer | ignored | Obsolete resolver thread count. |
| `useIPAddrAsHost` | boolean | true | Caches DNS resolutions on the search head unless proxies or hostname verification forbid it. |
| `defaultUriScheme` | `http` \| `https` | https | Scheme applied when adding peers without explicit protocols. |
| `serverTimeout` | integer | ignored | Replaced by finer-grained timeout trio. |
| `connectionTimeout` | integer | 10 | Seconds to establish peer connections. |
| `sendTimeout` | integer | 30 | Seconds allowed for outbound writes to peers. |
| `receiveTimeout` | integer | 600 | Seconds allowed for inbound reads from peers. |
| `authTokenConnectionTimeout` | number | 5 | Seconds to connect when retrieving peer auth tokens (fractions allowed). |
| `authTokenSendTimeout` | number | 10 | Seconds to send auth-token HTTP requests. |
| `authTokenReceiveTimeout` | number | 10 | Seconds to read auth-token HTTP responses. |
| `bcs` | string | none | Reserved Bucket Catalog Service URL—unsupported preview hook. |
| `bcsPath` | path | `/bcs/v1/buckets` | Reserved BCS API path. |
| `parallelReduceBackwardCompatibility` | `cloud` \| `enterprise` | enterprise | Controls SID rewriting behavior during parallel reduce across Cloud vs Enterprise. |
| `searchableIndexMapping` | `enabled` \| `disabled` | enabled | Maintains peer→index maps on the search head; change only with Splunk Support. |

### `[tokenExchKeys]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `certDir` | directory | `$SPLUNK_HOME/etc/auth/distServerKeys` | Stores distributed search keypairs and trusted peers. |
| `publicKey` | filename | `trusted.pem` | Public half of this member’s dist-search keys. |
| `privateKey` | filename | `private.pem` | Private half of this member’s dist-search keys. |
| `genKeyScript` | command | `$SPLUNK_HOME/bin/splunk createssl audit-keys` | Executable invoked to mint keys. |
| `minKeyLength` | integer | none | Minimum RSA modulus accepted when verifying peer keys. |
| `legacyKeyLengthAuthPolicy` | `warn` \| `reject` | none | Warn vs reject when legacy peers fall below `minKeyLength`. |

### `[replicationSettings]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `replicationPolicy` | `classic` \| `cascading` \| `rfs` \| `mounted` | classic | Strategy for shipping knowledge bundles to peers. |
| `connectionTimeout` | integer | 60 | Initial replication TCP timeout in classic mode. |
| `sendRcvTimeout` | integer | 60 | Replication payload transfer timeout. |
| `replicationThreads` | `positive integer` \| `auto` | auto | Parallel classic replication threads (max 16). |
| `maxMemoryBundleSize` | integer | UNSUPPORTED | Former memory bundle ceiling. |
| `maxBundleSize` | integer | `2048` MB | Hard stop when uncompressed bundles exceed this size. |
| `warnMaxBundleSizePerc` | integer | `75` | Percentage of `maxBundleSize` that triggers warnings. |
| `concerningReplicatedFileSize` | integer | `500` MB | Logs when individual bundle files exceed this size. |
| `excludeReplicatedLookupSize` | integer | `0` | Skip lookups larger than threshold megabytes from bundles. |
| `allowStreamUpload` | `auto` \| `true` \| `false` | UNSUPPORTED | Streaming replication toggle deprecated. |
| `allowSkipEncoding` | boolean | UNSUPPORTED | Deprecated replication compression shortcut. |
| `allowDeltaUpload` | boolean | true | Enables delta replication between bundle generations. |
| `useChecksumforDeltaCalculation` | boolean | false | Uses checksums to decide delta membership. |
| `preCompressKnowledgeBundlesClassicMode` | boolean | true | Compresses bundles before classic replication. |
| `preCompressKnowledgeBundlesCascadeMode` | boolean | false | Compresses bundles before cascading replication. |
| `sanitizeMetaFiles` | boolean | true | Filters benign `.meta` churn before replication. |
| `statusQueueSize` | integer | `5` | Buffered replication status snapshots. |
| `allowDeltaIndexing` | boolean | true | Allows indexer-side delta lookup indexing. |
| `cascade_replication_status_interval` | interval | `60s` | How often cascading replication status refreshes. |
| `cascade_replication_status_unchanged_threshold` | integer | `5` | Intervals stuck peers may linger before resend. |
| `cascade_plan_replication_retry_fast` | boolean | true | Retries cascading plans after burst failures. |
| `cascade_plan_replication_threshold_failures` | integer | `0` (auto 5%) | Failures tolerated before replanning. |
| `enableRFSMonitoring` | boolean | false | Peers poll remote storage for bundles—unsupported preview. |
| `rfsMonitoringPeriod` | unsigned integer | `60` | Polling cadence for RFS monitors. |
| `rfsSyncReplicationTimeout` | unsigned integer | `auto` | Search-head wait for synchronous RFS uploads. |
| `activeServerTimeout` | unsigned integer | `360` | Seconds before peers drop inactive SH uploads. |
| `path` | URI | none | `scheme://` destination for remote bundles. |
| `remote.s3.url_version` | `v1` \| `v2` | v1 | URL style for S3-compatible endpoints. |
| `remote.s3.endpoint` | URL | auto | Explicit S3 endpoint URL. |
| `remote.s3.bucket_name` | string | none | Bucket override when path omits bucket. |
| `remote.s3.encryption` | `sse-s3` \| `none` | none | Server-side encryption mode. |
| `remote.s3.supports_versioning` | boolean | false | Deletes all object versions when removing bundles. |
| `rfsMaxDeltaCountBetweenFull` | unsigned integer | `5` | Maximum delta bundles between full uploads. |
### `[searchhead:<searchhead-splunk-server-name>]`

`<searchhead-splunk-server-name>` matches `serverName` from `server.conf`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mounted_bundles` | boolean | false | Indicates bundles are NFS-mounted rather than replicated. |
| `bundles_location` | path | none | Mount path mirroring `$SPLUNK_HOME/etc` for the named search head. |

### `[replicationSettings:refineConf]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `replicate.<conf_file_name>` | boolean | false | Fine-grained toggle for whether `.conf` types replicate. |

### `[replicationSettings:fileSpecific]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<file_path>` | `allow` \| `deny` | none | Overrides allow/deny lists for explicit paths. |

### `[replicationWhitelist]`

Deprecated alias—use `[replicationAllowlist]`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Positive pattern (`refine.*` triggers `[replicationSettings:refineConf]` filtering). |

### `[replicationAllowlist]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Positive pattern (`refine.*` triggers `[replicationSettings:refineConf]` filtering). |

### `[replicationBlacklist]`

Deprecated alias—use `[replicationDenylist]`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Negative patterns overriding allows globally. |

### `[replicationDenylist]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Negative patterns overriding allows globally. |

### `[bundleEnforcerWhitelist]`

Deprecated alias—use `[bundleEnforcerAllowlist]`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Peer-side acceptance regex ensuring bundles contain only expected files. |

### `[bundleEnforcerAllowlist]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Peer-side acceptance regex ensuring bundles contain only expected files. |

### `[bundleEnforcerBlacklist]`

Deprecated alias—use `[bundleEnforcerDenylist]`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Peer-side deny regex rejecting bundles with forbidden paths. |

### `[bundleEnforcerDenylist]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | regex string | none | Peer-side deny regex rejecting bundles with forbidden paths. |

### `[distributedSearch:<splunk-server-group-name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `servers` | URI list | none | Peers belonging to this named server group. |
| `default` | boolean | false | Marks the group searched when `splunk_server_group` unspecified. |