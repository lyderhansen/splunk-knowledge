# health.conf

Controls Splunk Enterprise Health Report defaults: indicator thresholds (yellow/red), aggregation timing for ingestion latency, distributed health reporter behavior, clustering checks, data-management checks, optional alert routing to actions, and per-feature indicator tuning.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `server.conf` |

## Stanzas and settings

### `[distributed_health_reporter]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | `0` | When `1`, this instance does not query connected search peers for distributed health report data; when `0`, peer health aggregation is enabled. |

### `[health_reporter]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `full_health_log_interval` | `<number>` | `30` | Seconds between `PeriodicHealthReporter=INFO` log entries summarizing health reporter activity. |
| `suppress_status_update_ms` | `<number>` | `300` | Minimum milliseconds between emitting health status changes for an indicator; quicker flips are suppressed. |
| `suppress_status_reason_update_s` | `<number>` | `10` | Minimum seconds between publishing reason-text changes for an indicator; quicker edits are suppressed. |
| `latency_tracker_log_interval` | `<number>` | `30` | Seconds between latency tracker log entries used by health diagnostics. |
| `aggregate_ingestion_latency_health` | `[0\|1]` | `1` | When `0`, disables aggregation for ingestion-latency health reporting; `1` keeps it enabled. |
| `ingestion_latency_send_interval` | `<integer>` | `30` | Seconds between attempts to ship ingestion latency with tcpout heartbeats; effective rate also depends on `heartbeatFrequency` in `outputs.conf`. |
| `ingestion_latency_send_interval_max` | `<number>` | `86400` | Upper bound (0–86400 seconds) on how long ingestion latency can wait before being sent with heartbeats. |
| `alert.disabled` | `[0\|1]` | `0` | When `1`, disables health-driven alerting for every feature regardless of lower-level toggles. |
| `alert.actions` | `<string>` | _(see spec)_ | Comma-separated or configured list of alert actions to invoke when health alerts fire. |
| `alert.min_duration_sec` | `<integer>` | `60` | Minimum seconds an indicator must stay at `alert.threshold_color` before an alert triggers. |
| `alert.threshold_color` | `[yellow\|red]` | `red` | Worst status color that qualifies for alerting (`yellow` includes yellow and red transitions). |
| `alert.suppress_period` | `<integer>[m\|s\|h\|d]` | `10m` | Minimum quiet period between firing duplicate alerts; bursts batch until the window elapses. |

### `[clustering]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `health_report_period` | `<number>` | `20` | Seconds between clustering health report evaluation passes. |
| `disabled` | `<boolean>` | `0` | When `1`, disables clustering-related health checks entirely. |

### `[data_management_health_reporter]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | `0` | When `1`, skips data-management health reporting logic. |
| `health_report_period` | `<number>` | `30` | Seconds between data-management health report runs. |

### `[tree_view:health_subset]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| _(stanza marker)_ | — | — | Declares a Monitoring Console tree view; users with `list_health_subset`/`edit_health_subset` interact with features mapped into this subset (no standalone keys in spec beyond stanza presence). |

### `[feature:*]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `suppress_status_update_ms` | `<number>` | `300` | Feature-level minimum milliseconds between indicator status changes before surfacing updates. |
| `suppress_status_reason_update_s` | `<number>` | `3` | Feature-level minimum seconds between reason-string churn before publishing updates. |
| `display_name` | `<string>` | _(unset)_ | Friendly label shown in Health Report UI for the feature stanza. |
| `distributed_disabled` | `<boolean>` | `0` | When true, hides the feature from distributed health report navigation while still allowing local telemetry/alerts. |
| `snooze_end_time` | `<number>` | `0` | Unix epoch seconds when snooze expires; `0` means snooze off and threshold colors apply normally. |
| `alert.disabled` | `<boolean>` | `0` | Feature-level kill-switch for alerts unless overridden per-indicator; still obeys global `[health_reporter] alert.disabled`. |
| `alert.min_duration_sec` | `<integer>` | _(inherits)_ | Minimum unhealthy dwell time before alerting for this feature unless an indicator overrides it. |
| `alert.threshold_color` | `[yellow\|red]` | `red` | Feature-level worst color that triggers alerts before indicator-specific overrides apply. |
| `friendly_description` | `<string>` | _(unset)_ | Narrative text explaining what workload the feature monitors for operators. |
| `indicator:<indicator name>:friendly_description` | `<string>` | _(unset)_ | Human-readable detail per indicator name inside the feature stanza. |
| `indicator:<indicator name>:description` | `<string>` | _(unset)_ | Operational guidance copy shown beside each indicator for tuning decisions. |
| `indicator:<indicator name>:yellow` | `<number>` | _(varies)_ | Numeric threshold crossing that drives yellow severity for the named indicator; adjust carefully to avoid masking faults. |
| `indicator:<indicator name>:red` | `<number>` | _(varies)_ | Numeric threshold crossing that drives red severity for the named indicator; should represent genuine outage risk. |
| `alert:<indicator name>.disabled` | `[0\|1]` | `0` | Disables alerting for a single indicator within the feature stanza even if feature alerts remain enabled. |
| `alert:<indicator name>.min_duration_sec` | `<integer>` | _(inherits)_ | Indicator-specific dwell time before firing alerts at the configured threshold color. |
| `alert:<indicator name>.threshold_color` | `[yellow\|red]` | _(inherits)_ | Indicator-specific alert sensitivity independent of feature defaults. |
| `tree_view:health_subset` | `[enabled \| disabled]` | _(unset)_ | Links the feature into the `health_subset` tree view for delegated administrators. |

### `[alert_action:*]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `[0\|1]` | `0` | When `1`, skips executing this named alert action integration for health alerts. |
| `action.<action parameter>` | `<string>` | _(action-specific)_ | Parameter bags consumed by the targeted alert action (`email`, `pagerduty`, etc.); names mirror each action’s documented schema. |
