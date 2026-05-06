# Forwarding and receiving — TCP, queues, certificates

Diagnose universal/heavy forwarders not delivering cooked data: sockets, `metrics.log` tcpout/tcpin, parsing queues, and TLS alignment.

## Overview

Forwarding issues manifest as missing data, lag (`_indextime`), or `metrics.log` tcp queues trending full. Trace **sender tcpout** and **receiver tcpin** together.

**Roles:** Universal forwarder, heavy forwarder, indexer (receiver); optionally intermediate HF.

## Key concepts

- **`outputs.conf` → `[tcpout]`** determines destinations; multiple parallel queues possible — metrics lines include stanza-derived `name=` keys.
- **`metrics.log`:**  
  - **`group=tcpout_connections`** — per active socket throughput (`_tcp_KBps`, `_tcp_avg_thruput`, `_tcp_Kprocessed`, …). SSL counts bytes post-OpenSSL when enabled.  
  - **`group=tcpin_connections`** — receiver-side inbound metering (Monitoring Console / `_internal`).  
  - **`group=queue ... tcpout`** — persistence before wire write — sustained fill implies downstream/network issue.
- **Logs:** Forwarder `splunkd.log` may log **`Connected to idx=`** when connections establish; indexer side enable **`TcpInputConn`** logging (INFO) per Splunk “I can’t find my data!” guidance for socket acceptance visibility.

## Diagnostic steps

1. From search head: confirm inbound IPs hitting indexer receivers:

```spl
index=_internal source=*metrics.log* tcpin_connections | stats count BY sourceIp
```

2. Inspect tcpout stanza activity:

```spl
index=_internal source=*metrics.log* group=queue tcpout
| stats avg(current_size) BY name
```

3. Map destinations:

```spl
index=_internal source=*metrics.log* destHost
| dedup destHost
```

   (CLI variant documented by Splunk uses `$SPLUNK_HOME/bin/splunk search ...`.)

4. If TLS enabled: verify certificate chain, hostname verification settings, and cipher overlap between forwarder `outputs.conf` and indexer `inputs.conf` `[splunktcp-ssl:*]` stanzas — errors typically surface in `splunkd.log` on both ends.

5. Compare lag searches — if **all** `_internal` lag equals customer lag, prioritize network/forward path.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| `Could not send data to output queue (parsingQueue), retrying...` | Forwarder-side queue blocked / thruput limited | Adjust `[thruput]`; investigate parsing load |
| tcpout queue `current_size` high | Cannot flush to socket fast enough | Network, indexer saturation, or TLS handshake stalls |
| No `tcpin_connections` from expected IP | Routing/firewall/wrong receiver port | Network ACL / DNS / wrong `server` list |

## Useful SPL queries

```spl
index=_internal source=*metrics.log* group=tcpout_connections
| stats latest(_tcp_KBps) AS kbps latest(destIp) BY sourceHost
```

```spl
index=_internal source=*splunkd.log* TcpInput
| sort - _time
| head 100
```

```spl
index=_internal source=*metrics.log* tcpin_connections
| timechart span=5m sum(eval(if(sourceIp=="10.0.0.1",1,0))) AS hits_example_ip
```

## Related

- [ts-metrics-log.md](ts-metrics-log.md)
- [ts-data-not-indexing.md](ts-data-not-indexing.md)
- [ts-common-errors.md](ts-common-errors.md)

## Official documentation

- [I can't find my data!](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Cantfinddata) — forwarding searches subsection
- [About metrics.log — Tcpout Connections](https://docs.splunk.com/Documentation/Splunk/9.3.1/Troubleshooting/Aboutmetricslog)
