# Resource usage — CPU, memory, disk, I/O, introspection REST

Platform instrumentation for Splunk processes and hosts: log locations, `_introspection` index, and REST endpoints used by admins and Monitoring Console.

## Overview

While `metrics.log` captures indexing pipeline economics, **`resource_usage.log`** (under `$SPLUNK_HOME/var/log/introspection`) plus **`_introspection`** expose OS-level CPU/memory paging for Splunk processes and rollups for entire hosts.

**Roles:** Any Splunk Enterprise instance generating instrumentation (forwarders may ship subset).

## Key concepts

- **Logs:** `$SPLUNK_HOME/var/log/introspection/resource_usage.log` (historical); related **`disk_objects.log`** for persisted-object snapshots.
- **Index:** `index=_introspection` (must be explicit; RBAC applies).
- **REST highlights (Splunk docs):**  
  - `server/status/resource-usage/splunk-processes` — per-process CPU/memory; search processes embed extra **`search_props`**.  
  - `server/status/resource-usage/hostwide` — dynamic CPU/paging host view.  
  - `server/status/resource-usage/iostats` — disk IO stats (latest snapshot endpoint; historical in logs).  
  - `server/status/partitions-space` — filesystem usage for Splunk partitions.  
  - `server/status/fishbucket` — fishbucket growth / file tracking DB signal.  
  - `server/status/dispatch-artifacts` — dispatch disk consumption footprint.  
  - `server/status/limits/search-concurrency` — concurrency caps (standalone introspection).

## Diagnostic steps

1. When GUI available: Monitoring Console → **Resource Usage: Machine / Process** dashboards mirror these signals.
2. REST pull for instantaneous snapshot:

```spl
| rest splunk_server=local /services/server/status/resource-usage/hostwide
```

3. Correlate CPU spikes on indexers with saturated queues (`metrics.log group=queue`).
4. Watch partition space before bucket rolling failures — combine `partitions-space` + OS tools.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Search processes RSS climbing without completion | Runaway regex / huge JOIN / massive MV expand | Tune SPL; kill job |
| Hostwide paging counters unhealthy | RAM undersized vs concurrency | Reduce concurrency; add RAM |
| Disk objects endpoint shows hot volume nearly full | Imminent indexing outage | Freeze buckets; expand volume |

## Useful SPL queries

```spl
index=_introspection component=Hostwide
| timechart avg(cpu_idle_pct)
```

(Process/component field names vary by version — validate with `| fieldsummary` after narrowing source.)

```spl
index=_introspection *
| head 5
```

Use REST for authoritative schema:

```spl
| rest splunk_server=local /services/server/status/resource-usage/splunk-processes
| head 20
```

## Related

- [ts-metrics-log.md](ts-metrics-log.md)
- [ts-search-performance.md](ts-search-performance.md)
- [ts-health-check.md](ts-health-check.md)
- [ts-spl-diagnostics.md](ts-spl-diagnostics.md)

## Official documentation

- [What does platform instrumentation log?](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Whatdatagetslogged)
