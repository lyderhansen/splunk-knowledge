# workload_policy.conf

Central toggle for Splunk workload-management admission rules so searches can be pre-filtered according to definitions in `workload_rules.conf`.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `workload_rules.conf`, `workload_pools.conf`, Splunk Web workload UI |

## Stanzas and settings

### `[search_admission_control]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `admission_rules_enabled` | `<boolean>` | `0` | Enables enforcement of admission predicates declared via workload rules before searches dispatch. |
