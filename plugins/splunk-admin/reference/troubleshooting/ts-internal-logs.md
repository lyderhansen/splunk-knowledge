# Splunk internal log files (`$SPLUNK_HOME/var/log/splunk/`)

Reference for Splunk internal logs under `var/log/splunk`, how they map to `_internal` / `_audit` / `_configtracker`, and how to search them.

## Overview

Use these logs when you need to trace ingestion, configuration, scheduling, REST/UI access, licensing, or Python-heavy components. Most paths are tailed into `_internal` by default; forwarders send a subset to indexers. Pair filesystem reads with `index=_internal` searches when you need correlation across the deployment.

**Roles:** All Splunk Enterprise roles (full instance, heavy forwarder, universal forwarder subset).

## Key concepts

- **Location:** `$SPLUNK_HOME/var/log/splunk` → `_internal` (default tailing).
- **Introspection:** `$SPLUNK_HOME/var/log/introspection` → `_introspection` (host/process/disk metrics — see `ts-resource-usage.md`).
- **Search artifacts:** `$SPLUNK_HOME/var/run/splunk/dispatch/` — not indexed by default; dispatch/search performance detail lives here.
- **Rotation:** Typically five files × ~25 MB; tune via `$SPLUNK_HOME/etc/log.cfg` with overrides in `log-local.cfg` (overrides survive upgrades).
- **Levels:** `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` (most → least verbose). Debug is off by default.

## Diagnostic steps

1. Confirm you can search internals: `index=_internal` (Admin role / explicit index permission).
2. Broad health: `index=_internal (log_level=error OR log_level=warn*)`.
3. Narrow by component using `source`, `component`, `logger`, or file-derived fields after indexing.
4. On disk, use `tail -f splunkd.log` during reproduction; compare timestamps with metrics (`metrics.log`) forqueues/throughput.
5. For configuration drift: `index=_configtracker` (`.conf` change tracker).

## Log file catalog

| File | Purpose |
|------|---------|
| `splunkd.log` | Primary server log; Support often requests this. Scripted inputs/commands stderr often lands here. |
| `splunkd_stderr.log` / `splunkd_stdout.log` | Unix stderr/stdout for splunkd; startup/shutdown and low-level errors. |
| `splunkd_access.log` | REST access via UI/CLI; POST/GET to endpoints; response timing; search artifact sizes in responses. |
| `splunkd_ui_access.log` | Much of what older `web_access.log` covered (6.2+). |
| `web_access.log` | Splunk Web requests (Apache-style); partly superseded by `splunkd_ui_access.log`. |
| `web_service.log` | splunkweb actions (uses `WARNING` not `WARN` for second level). |
| `audit.log` | Security-relevant actions; **only** internal log indexed to `_audit`. |
| `metrics.log` | ~30s samples: pipelines, queues, throughput, tcpout, regex CPU (optional). See `ts-metrics-log.md`. |
| `scheduler.log` | Scheduled searches/alerts — successes and failures. |
| `remote_searches.log` | Streamed search channel on indexers (peer-side participation). |
| `search_messages.log` | Digest of critical messages from dispatched searches’ `info.csv` (DispatchReaper). |
| `searches.log` | Deprecated; use `| history` instead. |
| `python.log` | Python (REST, modular/scripted inputs, PDF server, email alerts, UI). **Unmanaged rotation** — use external log management. Uses `WARNING` not `WARN`. |
| `conf.log` | Search Head Cluster configuration replication. |
| `configuration_change.log` / `_configtracker` | Tracked `.conf` writes (see server.conf `config_change_tracker`). |
| `btool.log` | `btool` merge/debug activity. |
| `mongod.log` / `kvstore.log` | KV Store / Mongo runtime and metrics. |
| `license_usage.log` | Indexed volume by pool/index/source/sourcetype/host (**license manager** only). |
| `license_usage_summary.log` | Daily summary per pool/stack/host (**license manager**); indexed to `_telemetry`. |
| `http_event_collector_metrics.log` | HEC self-metrics. |
| `export_metrics.log` | Hadoop Connect export metrics. |
| `migration.log` | Upgrade/migration — files touched. |
| `first_install.log` | Install-time version marker. |
| `splunkd-utility.log` | Utilities (`clone-prep-clear-config`, `validatedb`, `check-license`, `check-transforms-keys`, `rest` CLI offline). |

Some files appear only when the feature is in use.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Many `ERROR` lines in `splunkd.log` for one component | Narrow component failure | Raise logging for that channel (UI or `log.cfg`), grep by `component=` |
| No expected log file | Feature inactive or not yet used | Enable feature or reproduce traffic |
| Cannot search `_internal` | RBAC | Grant index access or run as admin-equivalent role |

## Useful SPL queries

```spl
index=_internal sourcetype=splunkd (log_level=error OR log_level=warn*)
| stats count by component, log_level
```

```spl
index=_internal source=*metrics.log* group=queue
| stats latest(current_size) AS current_size BY name
| sort - current_size
```

```spl
index=_internal source=*splunkd.log* TailingProcessor
| head 500
```

## Related

- [ts-splunkd-log.md](ts-splunkd-log.md)
- [ts-metrics-log.md](ts-metrics-log.md)
- [ts-audit-log.md](ts-audit-log.md)
- [ts-spl-diagnostics.md](ts-spl-diagnostics.md)

## Official documentation

- [What Splunk software logs about itself](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/WhatSplunklogsaboutitself)
- [What does platform instrumentation log?](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Whatdatagetslogged)
