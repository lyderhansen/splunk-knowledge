# Slow searches — SPL shape, concurrency, and indexing contention

Practical tuning path: minimize scanned data, postpone non-streaming commands, and separate search-time cost from indexer saturation.

## Overview

Search latency comes from **data volume scanned**, **SPL shape** (streaming vs non-streaming), **concurrent search load**, and **indexer/IO health**. Use Job Inspector plus indexing-health signals to avoid optimizing SPL while indexers are saturated.

**Roles:** Search heads (or standalone search); indexers when diagnosing contention.

## Key concepts

- **Event retrieval vs transforming:** Narrow early with **indexed/default fields** (`index`, `host`, `source`, `sourcetype`).
- **Non-streaming commands** (`stats`, `sort`, `dedup`, `transaction`, …) force partial merge to search head — **push them late** in the pipeline.
- **Dense vs sparse searches:** Rare-term searches over huge indexes are inherently expensive — partition indexes / use summaries.
- **`tstats` / accelerations:** Data Model acceleration or metrics indexes shift cost off raw scans.
- **Field discovery:** Verbose Smart modes extract more — disable unnecessary discovery or use `fields` command.
- **Concurrency / skipping:** Overlapping schedules + user concurrency → skipped searches — check `scheduler.log`, workload rules, `server/status/limits/search-concurrency` introspection.

## Diagnostic steps

1. Run problematic search → **Job Inspector** → identify dominating phases (search + remote vs local processing).
2. If remote scan dominates: tighten filters, shrink time window, reduce indexes in union, add summaries.
3. If non-streaming stage dominates: reorder SPL; reduce cardinality before `stats`; consider `chunk_size` tweaks with high-cardinality `BY`.
4. Check indexer pressure simultaneously: Monitoring Console indexing views OR `server/introspection/indexer` — states include normal / saturated / throttled / blocked per Splunk indexing performance docs.
5. For skipped/disabled scheduled searches: inspect `scheduler.log`, priority settings in Reporting Manual.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Job Inspector shows large **rewriteStats** / remote timeline skew | Expensive remote fetch | Filter earlier; reduce indexes |
| High aggregator CPU in `metrics.log` pipeline lines | Multiline/heavy parsing while searching raw | Fix parsing; summarize |
| Saturated event-processing queues while searches run | Indexing vs search I/O contention | Scale IO / separate roles / workload management |

## Useful SPL queries

```spl
index=_internal source=*scheduler.log* WARN OR ERROR
| stats count BY component
```

```spl
index=_audit action=search
| stats avg(total_run_time) BY savedsearch_name
```

(Job Inspector still authoritative — `_audit` coverage depends on deployment.)

```spl
| history | head 20
```

Example efficient pattern from Splunk docs:

```spl
sourcetype=access_* (status=4* OR status=5*)
| stats count BY status
```

## Related

- [ts-metrics-log.md](ts-metrics-log.md)
- [ts-data-not-indexing.md](ts-data-not-indexing.md)
- [ts-resource-usage.md](ts-resource-usage.md)
- [ts-spl-diagnostics.md](ts-spl-diagnostics.md)

## Official documentation

- [Write better searches](https://docs.splunk.com/Documentation/Splunk/9.4.2/Search/Writebettersearches)
- [Identify and triage indexing performance problems](https://docs.splunk.com/Documentation/Splunk/9.3.2/Troubleshooting/Troubleshootindexingperformance)
