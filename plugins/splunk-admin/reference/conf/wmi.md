# wmi.conf

Configures Splunk’s deprecated-but-supported WMI scripted inputs on Windows (event logs via WMI channels or arbitrary `Win32_*` WQL queries) including backoff schedules and advanced suppression knobs.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME\etc\system\local\` (Windows) |
| Pipeline phase | Input (Windows) |
| Restart required | Yes |
| Related files | `inputs.conf`, Windows firewall, performance counters |

## Stanzas and settings

### `[settings]` (global WMI transport tuning)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `initial_backoff` | `<integer>` | `5` | Seconds to wait before the first reconnect retry after WMI failures; doubles until `max_backoff`. |
| `max_backoff` | `<integer>` | `20` | Ceiling (seconds) for exponential backoff between WMI reconnect attempts. |
| `max_retries_at_max_backoff` | `<integer>` | `2` | After reaching `max_backoff`, number of additional attempts before stopping until Splunk restarts. |
| `checkpoint_sync_interval` | `<integer>` | `2` | Seconds between flushing Windows Event Log checkpoints to disk. |

### `[WMI:<name>]`

Exactly one of `event_log_file` or `wql` must be populated per stanza.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `server` | `<comma-separated hosts>` | local host | Remote WMI targets to poll in parallel from this forwarder. |
| `interval` | `<integer>` | — | Mandatory polling cadence in seconds between WMI queries. |
| `disabled` | `<boolean>` | `0` | Disables the stanza when true/non-zero. |
| `hostname` | `<string>` | auto | Overrides the host field for emitted events. |
| `current_only` | `<boolean>` | `0` | When `1`, tails only events occurring while Splunk runs (event logs) or expects notification-style WQL (requires proper `__Instance*` queries). |
| `use_old_eventlog_api` | `<boolean>` | `false` | Forces legacy Event Logging API reads—only change under Splunk guidance. |
| `use_threads` | `<integer>` | `0` | Additional worker threads for regex allow/deny filtering (max 15). |
| `thread_wait_time_msec` | `<integer>` | `5000` | Sleep between retries when Event Log reads transiently fail. |
| `suppress_checkpoint` | `<boolean>` | `false` | Forces strict checkpoint cadence vs adaptive flushing (advanced). |
| `suppress_sourcename` | `<boolean>` | `false` | Drops `sourcename` metadata for throughput tuning. |
| `suppress_keywords` | `<boolean>` | `false` | Drops `keywords` metadata for throughput tuning. |
| `suppress_type` | `<boolean>` | `false` | Drops `type` metadata for throughput tuning. |
| `suppress_task` | `<boolean>` | `false` | Drops `task` metadata for throughput tuning. |
| `suppress_opcode` | `<boolean>` | `false` | Drops `opcode` metadata for throughput tuning. |
| `batch_size` | `<integer>` | `10` | WMI batch fetch size per poll loop. |
| `checkpointInterval` | `<integer>` | `0` | Seconds between persisted checkpoints for Windows Event Log reads (`0` writes opportunistically). |
| `index` | `<index>` | default index | Target index for collected events. |
| `event_log_file` | `<channels>` | — | Comma-separated event log channel names (Application, Security, System, etc.). |
| `disable_hostname_normalization` | `<boolean>` | `false` | Prevents rewriting localhost aliases to `%COMPUTERNAME%`. |
| `wql` | `<string>` | — | Raw WMI Query Language string when not using `event_log_file`. |
| `namespace` | `<string>` | `root\cimv2` | WMI namespace hosting the queried providers (relative or UNC form per `.spec` rules). |
