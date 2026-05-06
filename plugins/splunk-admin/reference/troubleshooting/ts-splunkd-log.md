# `splunkd.log` deep dive

Primary Splunk daemon log: severity channels, how to increase verbosity, and patterns that usually precede ingestion or startup failures.

## Overview

`splunkd.log` is the first place to look for startup failures, pipeline blocks, input failures, SSL/TCP issues, and stderr from scripted components. **Component:** `splunkd` on all Splunk Enterprise instance types.

## Key concepts

- **Log channels:** Individual subsystems (e.g., `TailingProcessor`, `TcpInputProc`, `DeploymentClient`, `AggregatorMiningProcessor`) log under configurable channels.
- **Levels:** Platform order `DEBUG` → `INFO` → `WARN` → `ERROR` → `FATAL`.
- **Dynamic UI change:** **Settings → Server settings → Server logging** applies immediately but **does not persist across restart**.
- **Persistent debug:** Edit `$SPLUNK_HOME/etc/log.cfg` or prefer **`log-local.cfg`** for durable channel levels.
- **Per-search debug:** Use the `noop` command’s `log_*` options to raise verbosity for a single search job (Search Reference: `noop`).

## Diagnostic steps

1. Reproduce the issue; `tail -f $SPLUNK_HOME/var/log/splunk/splunkd.log` on the affected instance.
2. Note timestamp + `component=` / logger name; match with `index=_internal sourcetype=splunkd`.
3. If ingestion suspected, correlate with `metrics.log` (`group=queue`, `group=pipeline`) on the same host.
4. For startup failures after upgrade or CLI utility use, read **`splunkd-utility.log`** alongside `splunkd_stderr.log`.
5. For TCP forwarding/connectivity, Splunk documents checking forwarder `splunkd.log` for lines like `Connected to idx=` and indexer `TcpInputConn` at INFO when tuned.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| `INFO TailingProcessor - Could not send data to output queue (parsingQueue), retrying...` | Forwarder-side parsing queue back-pressure (often thruput limit) | Check `[thruput] maxKBps` on UF/LWF; see `ts-data-not-indexing.md` |
| `DatabasePartitionPolicy` / message containing `Throttling indexer, too many tsidx files in bucket` | Indexer waiting on `splunk_optimize` / `.tsidx` merge backlog | Storage/CPU for optimize; review hot bucket policy; consider MetaData DEBUG per docs |
| `ArchiveProcessor - handling file=` ... `.gz` | Serialized archive processing — large backlog can delay other files | Prefer uncompressed monitoring or stage archives differently |
| Repeated SSL/certificate exceptions (exact text varies by OpenSSL/JDK) | Mis-matched certs or hostname/SAN between forwarder and indexer | Align `server.conf`/`outputs.conf` SSL settings; verify CN/SAN and CA bundle |

## Useful SPL queries

```spl
index=_internal sourcetype=splunkd host=my_host NOT (log_level=info)
| bin _time span=1m
| stats count by _time, log_level, component
```

```spl
index=_internal sourcetype=splunkd TailingProcessor (log_level=error OR log_level=warn*)
| sort - _time
| head 200
```

```spl
index=_internal sourcetype=splunkd DeploymentClient
| stats count by log_level
```

## Related

- [ts-internal-logs.md](ts-internal-logs.md)
- [ts-forwarding.md](ts-forwarding.md)
- [ts-data-not-indexing.md](ts-data-not-indexing.md)
- [ts-common-errors.md](ts-common-errors.md)

## Official documentation

- [What Splunk software logs about itself](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/WhatSplunklogsaboutitself)
- [Enable debug logging](https://docs.splunk.com/en/splunk-enterprise/administer/troubleshoot/10.2/splunk-enterprise-log-files/enable-debug-logging) (linked from same manual family)
