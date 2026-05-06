# federated.conf

Defines federated providers (remote Splunk search heads or compatible endpoints) plus global federated-search behavior such as heartbeat health checks, optimization toggles, preview limits, and guardrails around unsupported SPL commands.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` or `$SPLUNK_HOME/etc/apps/<app>/local/` |
| Pipeline phase | Search |
| Restart required | Yes |
| Related files | distsearch.conf, server.conf, indexes.conf, authorize.conf, limits.conf |

## Stanzas and settings

### `[provider://<unique-federated-provider-name>]`

Each remote provider is an isolated stanza following Splunk’s `provider://name` convention (alphanumeric and underscores only).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| type | `splunk` | splunk | Identifies the remote platform type; only Splunk deployments are documented. |
| hostPort | host:port | none | Hostname or IP plus service port used for outbound federation connections. |
| serviceAccount | string | none | Remote user whose credentials authenticate federated searches. |
| password | string | none | Password paired with `serviceAccount`. |
| appContext | string | search | Remote knowledge-object namespace for standard-mode providers; ignored when `mode=transparent`. |
| useFSHKnowledgeObjects | boolean | false | Pull knowledge objects from the initiating federated search head instead of the remote head when transparent mode allows. |
| mode | `standard` \| `transparent` | standard | Chooses whether remote knowledge objects can be referenced (`standard`) or searches always run with local KO context (`transparent`). |

### `[general]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| needs_consent | boolean | true | Shows a legal acknowledgement checkbox in the federated provider UI. |
| heartbeatEnabled | boolean | true | Runs periodic probes that mark unreachable providers invalid until they recover. |
| heartbeatInterval | integer | 60 | Seconds between heartbeat cycles; Splunk Support must approve changes. |
| connectivityFailuresThreshold | integer | 3 | Consecutive heartbeat failures before flagging a provider unreachable. |
| controlCommandsMaxThreads | int | 5 | Parallel threads carrying pause/cancel actions to remote providers. |
| controlCommandsMaxTimeThreshold | int | 5 | Maximum seconds to wait for remote acknowledgement of control commands. |
| controlCommandsFeatureEnabled | boolean | true | Allows federated search heads to propagate pause/cancel RPCs. |
| allowLookupsToExistOnlyOnRshForStandardMode | boolean | true | Permits lookups that exist only on the remote search head for standard-mode searches. |
| allowedAndDefaultFederatedProvidersEnabled | boolean | true | Applies `authorize.conf` RBAC lists (`srchFederatedProvidersAllowed`, `srchFederatedProvidersDefault`). |
| allowCaseInsensitivityForFederatedProvider | boolean | true | Treats provider names case-insensitively for REST routing. |
| allowAstProjectionElim | boolean | false | Enables AST projection elimination optimizations on the federated search head. |
| allowAstPredicateMerge | boolean | false | Enables predicate-merge optimizations on the federated search head. |
| allowAstInsertRedistributeCommand | boolean | false | Allows AST rewrite that inserts `redistribute` on the federated search head. |
| allowAstReplaceChartCmdsWithTstats | boolean | false | Allows replacing chart commands with `tstats` equivalents. |
| allowAstReplaceDatamodelStatsCmdsWithTstats | boolean | false | Allows rewriting datamodel stats pipelines to `tstats`. |
| allowAstReplaceTableWithFields | boolean | false | Allows replacing `table` with `fields` during optimization. |
| allowAstReplaceSdselectWithSdsql | boolean | false | Allows substituting `sdselect` with `sdsql` optimizations. |
| previewOnRshEnabled | boolean | false | Controls whether remote search heads generate previews for federated searches. |
| proxyBundlesTTL | int | 172800 | Seconds to retain idle proxy bundles on remote heads. |
| remoteEventsDownloadRetryCountMax | integer | 20 | Retries when verbose federated searches stream raw events. |
| remoteEventsDownloadRetryTimeoutMs | int | 1000 | Milliseconds between failed verbose event download retries. |
| verbose_mode | boolean | true | Permits verbose federated searches; disabling restricts modes per Splunk guidance. |
| enable_streaming_optimization | boolean | false | Streams only necessary preview rows for qualifying searches. |
| max_preview_generation_duration | unsigned integer | 0 | Caps preview generation time (seconds); `0` means unlimited. |
| max_preview_generation_inputcount | unsigned integer | 0 | Caps preview row inputs; pairs with duration limits for ELB-friendly configs. |
| federated_search_remote_ttl | unsigned integer | 600 | Retention time for remote artifacts after completion. |
| s2s_standard_mode_local_only_commands | CSV list | `mcollect`, `outputlookup`, `sendalert`, `sendemail` | Commands forced to remain on the initiating search head in standard mode. |
| sal_api_base_url | URL | `https://ci.manage.security.cisco.com/` | Base URL for Cisco SAL integrations. |
| rsh_delta_write_timeout | unsigned integer | 0 | Adds slack to remote HTTP write timeouts; requires Splunk Support tuning. |
### `[s2s_standard_mode_unsupported_command:metadata]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) the `metadata` command remotely. |
### `[s2s_standard_mode_unsupported_command:metasearch]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) the `metasearch` command remotely. |
### `[s2s_transparent_mode_unsupported_command:makeresults]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Blocks remote `makeresults` unless overridden via allowlists. |
| allow_target | boolean | true | Permits targeted `makeresults` when paired with `splunk_server` arguments. |
### `[s2s_transparent_mode_unsupported_command:delete]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `delete`. |
### `[s2s_transparent_mode_unsupported_command:dump]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `dump`. |
### `[s2s_transparent_mode_unsupported_command:loadjob]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `loadjob`. |
### `[s2s_transparent_mode_unsupported_command:map]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `map`. |
### `[s2s_transparent_mode_unsupported_command:run]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `run`. |
### `[s2s_transparent_mode_unsupported_command:runshellscript]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `runshellscript`. |
### `[s2s_transparent_mode_unsupported_command:script]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `script`. |
### `[s2s_transparent_mode_unsupported_command:sendalert]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `sendalert`. |
### `[s2s_transparent_mode_unsupported_command:sendemail]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `sendemail`. |
### `[s2s_transparent_mode_unsupported_command:rest]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | false | Allows (`true`) or blocks (`false`) remote `rest`. |
### `[s2s_transparent_mode_unsupported_command:summarize]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | true | Controls transparent-mode `summarize`; legacy peers remain blocked via version gates. |
| rsh_min_version_cloud | string | `9.0.2303.100` | Minimum Splunk Cloud build supporting summarize remotely. |
| rsh_min_version_onprem | string | `9.1.0` | Minimum Splunk Enterprise version supporting summarize remotely. |
### `[s2s_transparent_mode_unsupported_command:tstats]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| active | boolean | true | Controls transparent-mode `tstats`; FROM-clause searches honor version gates. |
| rsh_min_version_cloud | string | `9.0.2303.100` | Minimum Cloud build for FROM-capable `tstats`. |
| rsh_min_version_onprem | string | `9.1.0` | Minimum Enterprise version for FROM-capable `tstats`. |
### `[s2s_unsupported_command:show_source]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| rsh_min_version_cloud | string | `10.0.2503.100` | Minimum Cloud build supporting federated Show Source. |
| rsh_min_version_onprem | string | `10.0.0` | Minimum Enterprise version supporting federated Show Source. |