# workload_rules.conf

Defines workload classification predicates that route searches into cgroup pools, react to excessive runtime, and optionally filter or queue ad hoc workloads when admission control is enabled.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `workload_pools.conf`, `workload_policy.conf`, `authorize.conf` |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *standard merge semantics* | — | — | Splunk merges `[default]` duplicates using last-wins semantics as documented in the `.spec`. |

### `[general]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `numeric_search_time_range` | `<boolean>` | `false` | Allows predicates such as `search_time_range>7d` when true (may slow predicate evaluation). |

### `[workload_rule:<rule_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `predicate` | `<expression>` | — | Boolean expression combining `app`, `role`, `user`, `index`, `search_type`, `search_mode`, `search_time_range`, or `runtime` clauses. |
| `workload_pool` | `<pool>` | — | Target `[workload_pool:*]` defined in `workload_pools.conf` when the predicate matches. |
| `action` | `alert \| move \| abort` | — | Response when `runtime` thresholds trigger (notify, migrate pools, or terminate the search). |
| `schedule` | `always_on \| time_range \| every_day \| every_week \| every_month` | — | Optional activation calendar for the rule; blank means always active. |
| `start_time` | `<HH:00>` | `0` | Beginning hour or ISO timestamp window depending on `schedule`. |
| `end_time` | `<HH:00>` | `0` | Ending hour or ISO timestamp window depending on `schedule`. |
| `every_week_days` | `<csv 0-6>` | — | Required when `schedule=every_week` (Sunday=`0`). |
| `every_month_days` | `<csv 1-31>` | — | Required when `schedule=every_month`. |
| `start_date` | `<YYYY-MM-DD>` | — | Required when `schedule=time_range`. |
| `end_date` | `<YYYY-MM-DD>` | — | Required when `schedule=time_range`. |
| `user_message` | `<string<=140>` | — | Inspector message appended when the workload rule fires. |
| `disabled` | `<boolean>` | `false` | Soft-disables the rule without deleting its stanza. |

### `[workload_rules_order]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `rules` | `<comma-separated names>` | empty | Priority ordering list referencing `[workload_rule:<name>]` stanzas (left-most wins). |

### `[search_filter_rule:<rule_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `predicate` | `<expression>` | — | Same grammar as workload rules plus `adhoc_search_percentage` when filtering ad hoc saturation; `search_time_range` limited to `alltime` unless numeric mode enabled globally. |
| `action` | `filter \| queue` | — | `filter` drops matching searches; `queue` delays ad hoc searches when percentage predicates engage. |
| `schedule` | `always_on \| …` | — | Same scheduling keys as `[workload_rule]`. |
| `start_time` | `<string>` | `0` | Same meaning as workload rules. |
| `end_time` | `<string>` | `0` | Same meaning as workload rules. |
| `every_week_days` | `<csv>` | — | Same meaning as workload rules. |
| `every_month_days` | `<csv>` | — | Same meaning as workload rules. |
| `start_date` | `<YYYY-MM-DD>` | — | Same meaning as workload rules. |
| `end_date` | `<YYYY-MM-DD>` | — | Same meaning as workload rules. |
| `user_message` | `<string<=140>` | — | Message shown when searches are filtered/queued. |
| `disabled` | `<boolean>` | `false` | Temporarily disables this admission rule. |
