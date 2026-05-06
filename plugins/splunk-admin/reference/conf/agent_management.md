# agent_management.conf

Tunes deployment-server agent management helpers: SPL polling cadence, splunkd HTTP pooling, deployment-settings synchronization, effective-configuration retention, and telemetry cadence feeding into broader instrumentation policies.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `server.conf`, `telemetry.conf` |

## Stanzas and settings

### `[general]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `fallback_to_deployment_server_ui` | `<boolean>` | _(removed)_ | Deprecated toggle retained only in commentary; Splunk ignores manual changes. |
| `log_level` | `<string>` | `INFO` | Verbosity for helper logs (`DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`). |
| `request_timeout` | `<string>` | `5m` | Global HTTP timeout applied to helper→splunkd interactions using `ms/s/m/h` suffixes. |

### `[search_client]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `polling_interval` | `<string>` | `500ms` | Delay between REST polls when streaming SPL-derived agent lists or summaries. |
| `query_agents_with_error` | `<string>` | _(factory SPL)_ | SPL returning agents whose latest actions ended in error states for dashboards. |
| `query_agents_offline` | `<string>` | _(factory SPL)_ | SPL identifying agents exceeding adaptive offline thresholds relative to phone-home cadence. |
| `query_agents_updated_config` | `<string>` | _(factory SPL)_ | SPL counting agents whose configuration packages recently changed successfully. |
| `query_agent_version` | `<string>` | _(factory SPL)_ | SPL projecting Splunk package/version tuples per agent identifier. |
| `query_app_summary` | `<string>` | _(factory SPL)_ | SPL summarizing application install/failure counts across the fleet. |

### `[splunkd_client]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `connection_pool_size` | `<integer>` | `10` | Concurrent outbound HTTP connections permitted between helper and local splunkd. |
| `request_timeout` | `<string>` | `285s` | Upper bound for individual splunkd REST transactions initiated by agent management. |
| `connection_keep_alive` | `<string>` | `11s` | Idle timeout before pooled connections drop; must remain lower than `busyKeepAliveIdleTimeout` under `[httpServer]` in `server.conf`. |

### `[settings_sync]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `polling_interval` | `<string>` | `5m` | Frequency for refreshing deployment-server configuration snapshots consumed by the helper. |

### `[effective_configuration]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `max_size` | `<positive integer>` | `16` | Maximum effective-configuration payload size (MB) accepted per universal forwarder before rejection. |
| `cleanup_threshold` | `<positive integer>` | `6144` | Aggregate disk budget (MB) across cached payloads triggering pruning jobs when exceeded. |
| `cleanup_schedule` | `<string>` | `0 3 * * *` | Cron controlling nightly cleanup (`disabled` turns jobs off) for stale configuration blobs. |

### `[telemetry]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | `<boolean>` | `true` | Enables agent-management telemetry collectors locally; still honors enterprise-wide consent in `telemetry.conf`. |
| `cron_schedule` | `<string>` | `15 3 * * *` | Cron window launching telemetry aggregation jobs (local timezone). |
| `collection_timeout` | `<string>` | `10m` | Ceiling for end-to-end telemetry harvest duration per scheduled pass (minimum `1s`). |
| `job_timeout` | `<string>` | `5m` | Maximum runtime budget for each atomic telemetry sub-job within the collection wave (minimum `1s`). |
