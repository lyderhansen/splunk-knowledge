# Common error patterns — quick catalog

Doc-sourced log fragments and practical interpretation across ingestion, indexing, forwarding, and KV/index maintenance.

## Overview

Use this table as a **hint router**: match substrings in `splunkd.log`, `metrics.log`, or Archive processor lines, then jump to the deeper topic file.

## Key concepts

- Always capture **host**, **role**, and **UTC timestamp** when opening Splunk Support cases — Support routinely requests `splunkd.log` + `metrics.log`.
- Pair filesystem grep with `index=_internal` once indexing lag allows.

## Diagnostic steps

1. `grep -E 'ERROR|WARN|blocked=true'` across latest rotated logs on suspect instance.
2. Identify subsystem token (`TailingProcessor`, `TcpOutputProc`, `DeploymentClient`, `ArchiveProcessor`, `DatabasePartitionPolicy`).
3. Open specialized reference (`ts-*`) from table below.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| `INFO TailingProcessor - Could not send data to output queue (parsingQueue), retrying...` | UF/LWF queue stall — commonly thruput limit | Adjust `[thruput] maxKBps`; confirm parsing load |
| `Metrics - group=thruput` lines pegged near configured KBps cap | Forwarder hitting throughput ceiling | Raise/remove limit with operational caution |
| `Metrics - group=queue ... blocked=true` (many consecutive) | Queue cannot drain — stalled pipeline | Investigate downstream indexer saturation/network (`ts-metrics-log.md`) |
| `ArchiveProcessor - handling file=*.gz` | Compressed archive being processed serially | Expect delays; prefer uncompressed tail if backlog hurts (`ts-data-not-indexing.md`) |
| `DatabasePartitionPolicy` / `Throttling indexer, too many tsidx files in bucket` | Optimize backlog / hot bucket pressure | Storage & merger throughput; MetaData DEBUG per Splunk indexing docs |
| `noop` / DEBUG channel floods after diagnostics | Expected temporary verbosity | Revert channel levels; dynamic UI logging resets on restart |

## Useful SPL queries

```spl
index=_internal sourcetype=splunkd "*Could not send data to output queue*"
| stats count BY host
```

```spl
index=_internal source=*metrics.log* blocked=true
| stats count BY name
```

```spl
index=_internal sourcetype=splunkd ArchiveProcessor
| sort - _time
| head 50
```

## Related

- [ts-splunkd-log.md](ts-splunkd-log.md)
- [ts-metrics-log.md](ts-metrics-log.md)
- [ts-forwarding.md](ts-forwarding.md)
- [ts-data-not-indexing.md](ts-data-not-indexing.md)

## Official documentation

- [Event indexing delay](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Troubleshootingeventsindexingdelay)
- [About metrics.log — queues](https://docs.splunk.com/Documentation/Splunk/9.3.1/Troubleshooting/Aboutmetricslog)
- [Identify and triage indexing performance problems](https://docs.splunk.com/Documentation/Splunk/9.3.2/Troubleshooting/Troubleshootindexingperformance)
