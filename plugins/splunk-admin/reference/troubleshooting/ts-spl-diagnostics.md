# Diagnostic SPL cookbook (`_internal`, `_audit`, `_introspection`, REST)

Copy-paste searches for Splunk admins: health, queues, forwarding, scheduling, auditing, and introspection — with role notes.

## Overview

These queries assume an admin-equivalent role with explicit access to **`_internal`**, **`_audit`**, **`_configtracker`**, and **`_introspection`**. Replace `splunk_server`, indexes, and time ranges to suit your deployment.

## Key concepts

- **Indexer vs SH vs UF:** Forwarding/tcpin/tcpout queries run best **on indexers** (or search across peers). UF may not forward all internal logs by default.
- **Sampling:** `metrics.log` samples top series — absence ≠ zero traffic.
- **REST vs index:** Some health/config answers only appear via `| rest`.

## Diagnostic steps

1. Pick a symptom bucket (ingest, search, auth, disk).
2. Run the narrowest query first (avoid all-time All index).
3. Correlate timestamps with filesystem logs if `_internal` retention is short.

## Cookbook — 25 queries

**1. Error/warn totals by component (SH/indexer)**

```spl
index=_internal sourcetype=splunkd (log_level=error OR log_level=warn*)
| stats count BY component, log_level
```

**2. Recent splunkd errors with host**

```spl
index=_internal sourcetype=splunkd log_level=error
| sort - _time
| head 100
```

**3. Metrics queue backlog snapshot**

```spl
index=_internal source=*metrics.log* group=queue
| stats latest(current_size) AS sz BY host, name
| sort - sz
```

**4. Blocked queues frequency**

```spl
index=_internal source=*metrics.log* blocked=true
| stats count BY host, name
```

**5. Indexing thrput trend**

```spl
index=_internal source=*metrics.log* group=thruput name=index_thruput
| timechart avg(instantaneous_kbps) BY splunk_server
```

**6. Top sourcetypes by volume (sample)**

```spl
index=_internal metrics group=per_sourcetype_thruput
| stats sum(kb) AS KB BY series
| sort - KB
| head 20
```

**7. Top indexes by volume (sample)**

```spl
index=_internal metrics group=per_index_thruput
| stats sum(kb) AS KB BY series
| sort - KB
| head 20
```

**8. TCP receivers by source IP**

```spl
index=_internal source=*metrics.log* tcpin_connections
| stats count BY sourceIp
```

**9. TCP out destinations**

```spl
index=_internal source=*metrics.log* destIp destPort
| stats count BY destIp, destPort
```

**10. tcpout queue stanza pressure**

```spl
index=_internal source=*metrics.log* group=queue tcpout
| timechart avg(current_size) BY name
```

**11. Pipeline CPU seconds — merging stage**

```spl
index=_internal source=*metrics.log* group=pipeline name=merging
| stats sum(cpu_seconds) BY processor
```

**12. Internal lag sanity (_indextime vs _time)**

```spl
index=_internal source=*splunkd.log*
| eval lag=_indextime-_time
| timechart avg(lag) p95(lag) BY host
```

**13. License skew check via saved searches (admin)**

```spl
index=_internal source=*license_usage.log*
| head 20
```

**14. Scheduler warnings/errors**

```spl
index=_internal source=*scheduler.log* (log_level=error OR log_level=warn* OR WARN)
| stats count BY host
```

**15. DeploymentClient noise**

```spl
index=_internal source=*splunkd.log* DeploymentClient
| stats count BY log_level
```

**16. HEC metrics presence**

```spl
index=_internal source=*http_event_collector_metrics.log*
| head 50
```

**17. Audit — searches by user**

```spl
index=_audit action=search
| stats count BY user, app
```

**18. Audit — failures / denial keywords**

```spl
index=_audit (fail* OR denied OR error)
| sort - _time
| head 100
```

**19. Config tracker — recent changes**

```spl
index=_configtracker *
| sort - _time
| head 50
```

**20. Search peer introspection (requires distributed search)**

```spl
| rest /services/search/distributed/peers
| table peerName, status
```

**21. splunkd health — JSON**

```spl
| rest splunk_server=local /services/server/health/splunkd
```

**22. splunkd health details**

```spl
| rest splunk_server=local /services/server/health/splunkd/details
```

**23. Distributed deployment health**

```spl
| rest splunk_server=local /services/server/health/deployment
```

**24. Host partition space snapshot**

```spl
| rest splunk_server=local /services/server/status/partitions-space
```

**25. Search concurrency limits**

```spl
| rest splunk_server=local /services/server/status/limits/search-concurrency
```

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Query returns no `_internal` events | RBAC / wrong indexer | Run as admin; search `splunk_server=*` |
| REST 403 | Capability missing | Grant `rest*` powers / admin role |

## Related

- [ts-internal-logs.md](ts-internal-logs.md)
- [ts-metrics-log.md](ts-metrics-log.md)
- [ts-health-check.md](ts-health-check.md)
- [ts-resource-usage.md](ts-resource-usage.md)

## Official documentation

- [What Splunk software logs about itself](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/WhatSplunklogsaboutitself)
- [I can't find my data!](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Cantfinddata)
- [REST endpoints reference](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/9.3/introduction/endpoints-reference-list)
