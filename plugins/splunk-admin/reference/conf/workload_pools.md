# workload_pools.conf

Defines Splunk workload-management pools and category-level CPU/memory weights when Linux cgroups-based admission control is enabled; misconfiguration can starve searches or crash `splunkd`.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `workload_rules.conf`, `authorize.conf` roles, OS cgroup mounts |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *standard merge semantics* | — | — | Only one `[default]` stanza should exist; Splunk merges duplicates last-wins. |

### `[general]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | `<boolean>` | `false` | Master switch enabling Splunk workload management features backed by this file. |
| `default_pool` | `<string>` | — | Legacy compatibility pointer aligning with the default pool configured under `[workload_category:search]`. |
| `ingest_pool` | `<string>` | — | Legacy compatibility pointer aligning with the default ingest pool in cgroup deployments. |
| `workload_pool_base_dir_name` | `<string>` | `splunk` | Base cgroup directory name Splunk uses when constructing pool controllers on Linux. |

### `[workload_pool:<pool_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `cpu_weight` | `<number>` | — | Relative CPU share expressed within its workload category budget. |
| `mem_weight` | `<number>` | — | Relative RAM share within category budget (ignored when `threaded=true`). |
| `category` | `search \| ingest \| misc` | — | Associates the pool with the Splunk workload lane controlling CPU/mem envelopes. |
| `default_category_pool` | `<boolean>` | `0` | Marks which pool catches searches/users lacking explicit assignments inside that category. |
| `threaded` | `<boolean>` | `false` | Enables ingest threaded pooling on cgroup v2—requires precise naming aligned with Splunk helper threads; do not toggle without Splunk guidance. |

### `[workload_category:<category>]`

`<category>` ∈ {`search`, `ingest`, `misc`}.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `cpu_weight` | `<number>` | preset | Percent-style weight controlling how much cluster CPU this lane receives versus other categories. |
| `mem_weight` | `<number>` | preset | Percent-style memory budget split shared across pools inside the lane. |
