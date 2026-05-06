# Deployment server, bundle delivery, and cluster caveats

Forwarder Management / deployment server basics: what it can deploy, what it **must not** manage, and how to debug stuck clients.

## Overview

The **deployment server** distributes apps/configuration updates to classes of instances (not initial installs or version upgrades). Troubleshooting focuses on **phone-home connectivity**, **serverclasses**, app staging permissions, and mistaken attempts to push configs directly to **cluster peers** or **SHC members**.

**Roles:** Deployment server; deployment clients (forwarders, standalone indexers/SH **outside** clustering).

## Key concepts

- **Allowed targets:** Forwarders, non-clustered indexers/search heads (per Splunk Updating manual warnings).
- **Forbidden:** Do **not** manage **indexer cluster peer** configs nor **search head cluster member** configs via deployment server — use **manager bundle** / **deployer** workflows instead.
- **Manager exception:** Deployment server **may** update the **cluster manager node**, which then bundles to peers.
- **UI:** Forwarder Management wraps deployment server APIs for bulk visibility.

## Diagnostic steps

1. On a client: verify `deploymentclient.conf` points to correct URI and `phoneHomeIntervalInSecs` is sane.
2. On deployment server: validate `serverclass.conf` maps expected hostnames/FQDNs to apps (DNS mismatches are a frequent cause of “missing classes”).
3. Inspect client `splunkd.log` **DeploymentClient** messages for download failures, SSL errors, or HTTP 40x from DS.
4. Confirm disk space & permissions on `$SPLUNK_HOME/etc/apps` staging paths on both DS and clients.
5. For indexer clusters: redirect troubleshooting to **manager bundle distribution**, **cluster bundle validate**, and peer restart cycles — not DS-to-peer pushes.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Client never phones home | Network/DNS/TLS to DS | Fix routing; align certificates |
| App checksum mismatch loops | Partial downloads / antivirus locks | Clear staged temp files; verify AV exclusions |
| Attempt to push SHC member config via DS | Unsupported architecture | Use deployer + rebalance operations |

## Useful SPL queries

When internal forwarding of DeploymentClient logs is enabled:

```spl
index=_internal sourcetype=splunkd DeploymentClient (log_level=error OR log_level=warn*)
| sort - _time
| head 200
```

```spl
index=_internal source=*splunkd.log* DeploymentServer
| stats count BY log_level
```

(Frequently easiest on filesystem `grep DeploymentClient splunkd.log` during reproduction.)

## Related

- [ts-forwarding.md](ts-forwarding.md)
- [ts-health-check.md](ts-health-check.md)
- [ts-common-errors.md](ts-common-errors.md)

## Official documentation

- [About deployment server and forwarder management](https://docs.splunk.com/Documentation/Splunk/9.3.2/Updating/Aboutdeploymentserver)
- Cluster integration caveats in same manual (Indexer clusters / Search head clusters sections)
