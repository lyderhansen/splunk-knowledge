# audit.conf

Configures how Splunk emits auditing telemetry—either directly onto the indexing queue or solely via log tailing—plus selectable legacy versus enriched JSONL formatting during migrations.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `server.conf` |

## Stanzas and settings

### `[auditTrail]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `queueing` | `<boolean>` | `true` | When true, audit events enqueue through `indexQueue`; false forces administrators to tail filesystem audit logs via dedicated inputs instead. |
| `logging_format` | `v1\|v2\|both` | `v1` | Selects legacy `Audit:[...]` payloads (`v1`), enriched JSONL (`v2`), or dual emission (`both`) while transitioning observability pipelines. |
