# Splunk health report and REST endpoints

Proactive monitoring of `splunkd` features via yellow/red indicators, Splunk Web views, and REST — plus distributed aggregation endpoints.

## Overview

The **splunkd health report** exposes a **tree** of feature categories → features → **indicators** with configurable thresholds. Status rolls up “least healthy wins”. Use it for continuous operational visibility without running heavy searches.

**Roles:** All Splunk Enterprise nodes expose **local** health; **distributed** view aggregates from connected instances on designated central roles.

## Key concepts

- **States:** Green (OK), Yellow (degraded), Red (severe), Grey (disabled/snoozed).
- **Local vs distributed:** Local reflects the instance you are on; distributed aggregates topology-wide from central instances (**search heads, SHC members, cluster managers** in Enterprise — per Splunk docs).
- **REST — splunkd instance:**  
  - `GET /services/server/health/splunkd` — overall tree / rollup  
  - `GET /services/server/health/splunkd/details` — per-feature detail  
- **REST — distributed deployment:**  
  - `GET /services/server/health/deployment` — overall distributed status  
  - `GET /services/server/health/deployment/details` — per-feature remote contributors  
- **Configuration / alerting:** `server/health-config` family edits thresholds and alert actions; feature lists & thresholds documented under “Configure the splunkd health report”.
- **Other health endpoints (REST catalog):** `cluster/manager/health`, `shcluster/status`, `replication/configuration/health`, `services/collector/health` (HEC load balancer probe).

## Diagnostic steps

1. Open **Splunk Web → Monitoring / Health** (exact menu label varies by version) — inspect local tree first.
2. If on a supported central instance, switch to **distributed health** view when diagnosing peers.
3. Pull JSON programmatically with authenticated REST GET to `server/health/splunkd` or `server/health/deployment`.
4. When indicator flips yellow/red, follow Splunk’s **“Investigate feature health status changes”** workflow (same manual section family) — often correlates with `splunkd.log`, `metrics.log`, or Monitoring Console views.
5. Optionally tail **`health.log`** on filesystem when documenting flip timelines (per Splunk health troubleshooting guides on help.splunk.com).

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Feature stuck Red — indexing queues | Saturated pipelines | Follow indexing triage in `ts-data-not-indexing.md` |
| Feature Yellow — search scheduler lag | Over-subscribed concurrency | Inspect skipped searches / workload limits |
| Distributed grey entries | Feature reporting disabled | Re-enable in health configuration |

## Useful SPL queries

Health report is primarily **REST/UI-driven**. Use `rest` from Search to snapshot JSON:

```spl
| rest splunk_server=local /services/server/health/splunkd
```

```spl
| rest splunk_server=local /services/server/health/splunkd/details
```

Pair with generic error scans on the same host while incidents occur:

```spl
index=_internal sourcetype=splunkd (log_level=error OR log_level=warn*)
| stats count BY component
```

## Related

- [ts-resource-usage.md](ts-resource-usage.md)
- [ts-search-performance.md](ts-search-performance.md)
- [ts-deployment.md](ts-deployment.md)

## Official documentation

- [About proactive Splunk component monitoring](https://help.splunk.com/en/splunk-enterprise/administer/monitor/10.2/proactive-splunk-component-monitoring-with-the-splunkd-health-report/about-proactive-splunk-component-monitoring)
- REST endpoint matrix: [Endpoints reference list — introspection / health entries](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/9.3/introduction/endpoints-reference-list)
