# `metrics.log` — pipeline, queues, throughput

How Splunk samples internal telemetry every ~30 seconds: pipelines, queues, throughput breakouts, forwarding sockets, and what to graph first.

## Overview

`metrics.log` answers “where is CPU/indexing time going?”, “are queues blocked?”, and “which host/sourcetype/index is hot?”. **Components:** indexers, forwarders (partial — UF/LWF may not forward `metrics.log` by default), search heads when relevant metrics exist.

## Key concepts

- **Sampling:** ~30 second intervals; **top N series per group** (default 10) → busy datasets hide tail hosts. Increase `maxseries` under `[metrics]` in `limits.conf` only with care (more chatter → larger `_internal`).
- **Structure:** `INFO Metrics - group=<name>, ...` — always INFO severity for metric lines.
- **Thrput vs tcpout:** Thruput reflects raw indexing pipeline size; `tcpout_connections` counts bytes handed to TCP/OpenSSL stack (includes framing/metadata).
- **`eps` caveat:** Splunk documents accuracy issues — **do not rely on `eps` alone** for precise rates.

## Diagnostic steps

1. **Indexing load:** Look for `group=thruput name=index_thruput` — prefer `instantaneous_kbps` over time.
2. **Hot hosts/sourcetypes:** `per_host_thruput`, `per_sourcetype_thruput`, `per_index_thruput`, `per_source_thruput`.
3. **Bottleneck queues:** `group=queue` — watch `current_size` sustained near `max_size`; **`blocked=true`** means full queue rejected an enqueue (occasional OK on busy systems; sustained chains imply stalls).
4. **Pipeline CPU:** `group=pipeline` — compare `cpu_seconds` and `executes` per `processor` (e.g., aggregator stuck merging multiline).
5. **Forwarder ↔ indexer throughput:** `group=tcpout_connections` fields `_tcp_KBps`, `_tcp_avg_thruput`, `_tcp_Kprocessed`.
6. **Regex cost (optional):** If `regex_cpu_profiling` enabled in `limits.conf`, groups `per_*_regex_cpu`.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| `group=queue ... blocked=true` repeating many times | Persistent flow-control / blockage | Investigate downstream pipeline, disk I/O, or receiving side |
| `current_size` ~ `max_size` sustained | Queue saturation | Scale indexer, reduce ingest burst, fix slow storage |
| High `cpu_seconds` on `aggregator` vs low downstream executes | Multiline aggregation cost | Review LINE_BREAKER / MUST_BREAK_AFTER / event breaking |
| UF thruput lines pegged near limit | `maxKBps` limiting forwarder | Raise or remove `[thruput] maxKBps` with care |

## Useful SPL queries

```spl
index=_internal source=*metrics.log* group=thruput name=index_thruput
| timechart avg(instantaneous_kbps) AS indexing_kbps
```

```spl
index=_internal source=*metrics.log* group=queue NOT blocked
| stats avg(current_size) AS avg_fill BY name
| sort - avg_fill
```

```spl
index=_internal metrics group=per_sourcetype_thruput NOT debug NOT sourcetype=splunk_web_access
| timechart span=1h sum(kb) AS totalKB
```

```spl
index=_internal source=*metrics.log* group=tcpout_connections
| stats latest(_tcp_KBps) AS kbps BY destIp
```

## Related

- [ts-internal-logs.md](ts-internal-logs.md)
- [ts-forwarding.md](ts-forwarding.md)
- [ts-data-not-indexing.md](ts-data-not-indexing.md)
- [ts-spl-diagnostics.md](ts-spl-diagnostics.md)

## Official documentation

- [About metrics.log](https://docs.splunk.com/Documentation/Splunk/9.3.1/Troubleshooting/Aboutmetricslog)
- [Troubleshoot inputs with metrics.log](https://docs.splunk.com/Documentation/Splunk/9.3.1/Troubleshooting/metricslog)
