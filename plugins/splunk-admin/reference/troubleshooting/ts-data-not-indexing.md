# Data missing from indexes — systematic diagnosis

Checklist for “no results”, wrong index, lagging `_indextime`, timestamp skew, input channels, and archive-induced stalls.

## Overview

Use this path when events exist upstream but Search returns nothing, dashboards show gaps, or data appears only after long delays. Combine **permissions**, **time picker**, **forwarding**, **thruput limits**, **timestamp extraction**, and **indexing saturation** hypotheses.

**Roles:** Forwarders, indexers, search heads (queries); deployment-wide.

## Key concepts

- **`_time` vs `_indextime`:** Lag metrics compare event timestamp vs index receipt — forwarding vs input vs parsing issues split differently.
- **`inputs.conf` edits:** On file-only edits, Splunk may scan for new stanzas on up-to-**24h** cadence from prior restart — prefer UI/CLI or restart after manual edits.
- **Inactive input channels / recycling:** Memory-pressure trade-offs governed by `limits.conf [input_channels]` (`max_inactive`, `lowater_inactive`, `inactive_eligibility_age_seconds`, `max_inactive=auto`).
- **Fishbucket / tail status:** REST `services/admin/inputstatus/TailingProcessor:FileStatus` shows tail positions without shell access.

## Diagnostic steps

1. **Wrong index / RBAC:** Confirm index list & role allowed indexes (many TA apps write to dedicated indexes like `os`).
2. **Time range:** Widen window; try **All time** on narrow filters to surface **future-dated** mis-parsed timestamps.
3. **Forward path:** Run connectivity searches from “I can’t find my data!” (below).
4. **Measure lag:** Use `_indextime - _time` eval pattern from Event indexing delay docs.
5. **UF thruput:** On forwarder `splunk cmd btool limits list thruput --debug`; check `metrics.log` / `splunkd.log` for queue retry signature documented by Splunk.
6. **/archives:** If only `.gz` ingestion path, expect serialized ArchiveProcessor handling — large backlog delays other files.
7. **Indexing saturation:** If **all** internal + customer data lag equally, treat as indexer/forwarding pipeline issue per **Identify and triage indexing performance problems**.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Visible in RT but not historical | Future `_time` mis-assignment | Fix TIME_PREFIX/TIME_FORMAT/timezone; validate with Data Preview |
| `Could not send data to output queue (parsingQueue), retrying...` | UF hitting `[thruput] maxKBps` | Raise `maxKBps` or remove cap |
| ArchiveProcessor handling `.gz` backlog | Serialized archive reads | Prefer uncompressed monitoring when possible |
| None of relevant hosts in `metadata` | Inputs not running / blocked network | Validate inputs + routing |

## Useful SPL queries

```spl
index=_internal source=*metrics.log* tcpin_connections
| stats count BY sourceIp
```

```spl
index=_internal source=*metrics.log* group=queue tcpout
| stats count BY name
```

```spl
metadata type=hosts index=YOUR_INDEX
| eval lag_sec=now()-recentTime
| where lag_sec > 600
| sort lag_sec
```

```spl
YOUR_BASE_SEARCH
| eval lag_min=(_indextime-_time)/60
| timechart min(lag_min) avg(lag_min) max(lag_min) BY host
```

```spl
index=_internal source=*splunkd.log*
| eval delay_sec=_indextime-_time
| timechart min(delay_sec) avg(delay_sec) max(delay_sec) BY host
```

## Related

- [ts-metrics-log.md](ts-metrics-log.md)
- [ts-forwarding.md](ts-forwarding.md)
- [ts-search-performance.md](ts-search-performance.md)
- [ts-splunkd-log.md](ts-splunkd-log.md)

## Official documentation

- [I can't find my data!](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Cantfinddata)
- [Troubleshoot the input process](https://docs.splunk.com/Documentation/Splunk/9.2.5/Data/Troubleshoottheinputprocess)
- [Event indexing delay](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Troubleshootingeventsindexingdelay)
- [Identify and triage indexing performance problems](https://docs.splunk.com/Documentation/Splunk/9.3.2/Troubleshooting/Troubleshootindexingperformance)
