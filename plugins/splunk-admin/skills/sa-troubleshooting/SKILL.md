---
name: sa-troubleshooting
description: Splunk troubleshooting reference — internal logs, metrics.log interpretation, health checks, common error patterns, and diagnostic SPL queries. Use when the user asks about Splunk errors, data not indexing, slow searches, forwarding problems, resource usage, or any Splunk diagnostics and debugging.
---

# Splunk Troubleshooting Reference

## How to use
- Start with the symptom → find the matching reference file in the index below
- Each file includes diagnostic steps, common error patterns, and copy-paste SPL queries
- For a quick diagnostic SPL cookbook, go straight to `ts-spl-diagnostics.md`

## Triage decision tree

```
Data not appearing?
  → ts-data-not-indexing.md (inputs, parsing, routing)
  → ts-forwarding.md (if data comes from forwarders)

Searches slow or failing?
  → ts-search-performance.md (optimization, Job Inspector)
  → ts-resource-usage.md (CPU/memory/disk bottlenecks)

Errors in Splunk Web or logs?
  → ts-common-errors.md (error message catalog)
  → ts-splunkd-log.md (how to read and filter splunkd.log)

Cluster or deployment issues?
  → ts-deployment.md (deploy server, bundle replication)
  → reference/cli/cli-cluster.md (cluster CLI commands)

Need to understand what Splunk logs?
  → ts-internal-logs.md (complete log file catalog)
  → ts-metrics-log.md (pipeline and queue metrics)
  → ts-audit-log.md (user activity and compliance)

Health check alerts?
  → ts-health-check.md (health report framework)

General resource monitoring?
  → ts-resource-usage.md (_introspection, resource_usage.log)
```

## Silent-fail traps

1. **_internal vs _audit vs _introspection** — Three different indexes. `_internal` has splunkd operational logs. `_audit` has user activity (searches, logins, config changes). `_introspection` has resource usage telemetry. Searching the wrong one wastes time
2. **metrics.log group= field** — `metrics.log` entries have a `group` field that categorizes them (`pipeline`, `queue`, `thruput`, `per_index_thruput`, `tcpin_connections`). Always filter by `group=` first or you'll drown in noise
3. **Blocked queues vs slow queues** — A queue at 100% (`current_size_kb = max_size_kb`) is BLOCKED and causes data loss. A queue at 80% is just busy. Don't panic until it's sustained at 100%
4. **splunkd.log levels are per-channel** — Setting `log-level = DEBUG` in `log-local.cfg` for one component floods the log. Always scope: `[category:TailingProcessor]` not global
5. **Job Inspector is your first stop** — Before tweaking SPL, open Job Inspector (magnifying glass icon on search results). It shows wall clock time per component and exactly where time was spent
6. **_configtracker index** — Since Splunk 9.x, config changes are tracked in `_configtracker`. This is separate from `_audit`. Use it to find who changed what config and when
7. **Health check feature flags** — Individual health indicators can be disabled or have thresholds changed via `health.conf`. A green health status with disabled indicators is misleading
8. **Timestamp extraction failures are silent** — If Splunk can't parse a timestamp, it silently assigns the current time (`_indextime`). Data appears but with wrong `_time`. Check `index=_internal sourcetype=splunkd "timestamp" "Failed"`
9. **Forwarder queue sizes** — Universal Forwarders have small default queues (500KB). Heavy Forwarders have larger ones. Queue overflow means data loss, not just delay
10. **License warnings vs violations** — A single day over license is a WARNING (5 per 30-day window before violation). A VIOLATION triggers a search-blocking 14-day lockout on free/dev licenses
11. **REST /services/server/health/splunkd vs /details** — The base endpoint returns a summary tree. Append `/details` for feature-level indicators with thresholds and current values
12. **dispatch directory bloat** — Old search artifacts in `$SPLUNK_HOME/var/run/splunk/dispatch/` consume disk. If disk is full, new searches fail. Clean with `splunk clean userdata -f dispatch`

## First-response SPL queries

### Quick health check
```spl
index=_internal sourcetype=splunkd log_level=ERROR earliest=-1h
| stats count by component, log_level
| sort -count
```

### Data ingestion rate (last hour)
```spl
index=_internal sourcetype=splunkd source=*metrics.log group=per_index_thruput
| timechart span=5m sum(kb) AS kb_indexed BY series
```

### Forwarder connectivity
```spl
index=_internal sourcetype=splunkd source=*metrics.log group=tcpin_connections
| stats latest(connectionType) AS type, latest(kb) AS kb, latest(fwdType) AS fwdType BY hostname, sourceIp
| sort -kb
```

### Blocked queues (data loss risk)
```spl
index=_internal sourcetype=splunkd source=*metrics.log group=queue
| where current_size_kb >= max_size_kb
| stats count BY name, host
```

### Recent config changes
```spl
index=_configtracker earliest=-24h
| stats count BY user, action, object_type, stanza
| sort -count
```

## Complete troubleshooting reference index

### Log Files
| File | Covers |
|------|--------|
| `ts-internal-logs.md` | Complete catalog of all Splunk log files in `$SPLUNK_HOME/var/log/splunk/`, what each contains, rotation, and how to search them |
| `ts-splunkd-log.md` | Deep dive into `splunkd.log`: channels, log levels, verbosity, per-component filtering via `log-local.cfg` |
| `ts-metrics-log.md` | `metrics.log` interpretation: pipeline metrics, queue sizes, thruput, tcpout, sampling intervals |
| `ts-audit-log.md` | `audit.log` and `_audit` index: user activity, search tracking, compliance queries |

### Diagnostics
| File | Covers |
|------|--------|
| `ts-health-check.md` | Health report framework: REST endpoints, feature indicators, thresholds, green/yellow/red states |
| `ts-resource-usage.md` | CPU, memory, disk, IOPS monitoring via `_introspection` index and `resource_usage.log` |
| `ts-spl-diagnostics.md` | 25+ copy-paste diagnostic SPL queries for daily admin tasks |

### Common Problems
| File | Covers |
|------|--------|
| `ts-data-not-indexing.md` | Systematic diagnosis: missing data, timestamp issues, line breaking, truncation, routing |
| `ts-search-performance.md` | Slow search diagnosis: Job Inspector, optimization patterns, resource limits, skipped searches |
| `ts-forwarding.md` | Forwarder connectivity: tcpin/tcpout, certificates, blocked queues, UF vs HF issues |
| `ts-deployment.md` | Deployment server issues, bundle replication, cluster config propagation |
| `ts-common-errors.md` | Catalog of common Splunk error messages with meaning and fix |
