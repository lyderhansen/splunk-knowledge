---
name: sa-rest-api
description: Splunk REST API reference — authentication, common parameters, every endpoint across 14 categories with full parameter and return-value documentation. Use when the user asks about querying Splunk via REST, curl examples, API operations, or programmatic Splunk management.
---

# Splunk REST API Reference

## How to use

- For general REST API usage (auth, pagination, output formats): read `reference/rest/00-rest-api-overview.md`
- For specific endpoint details: find the file in the index below and read it
- Group prefix tells you the category (access-, apps-, conf-, deploy-, federated-, input-, introspect-, knowledge-, kvstore-, license-, metrics-, output-, search-, system-, workloads-)

## Silent-fail traps

1. **output_mode not set** — Splunk defaults to XML; always pass `output_mode=json` for programmatic access
2. **POST without Content-Type** — POST requests MUST include `Content-Type: application/x-www-form-urlencoded` or Splunk returns 400
3. **Session token vs basic auth** — `curl -k -u admin:pass` is basic auth; for session tokens, first POST to `/services/auth/login` then use `Authorization: Splunk <sessionKey>`
4. **Bearer tokens** — Use `Authorization: Bearer <token>` (note: `Bearer`, not `Splunk`)
5. **Cloud endpoints differ** — Many config/deployment endpoints are NOT available on Splunk Cloud; check each reference file's notes
6. **Namespace paths** — `/services/` is global; `/servicesNS/{owner}/{app}/` scopes to a specific user/app context
7. **search/jobs is async** — POST to `search/jobs` returns a job SID; you must poll `search/jobs/{sid}` until `isDone=1` before fetching results
8. **Pagination trap** — Default `count=30`; use `count=0` to get all results, or paginate with `count` + `offset`
9. **DELETE returns 200** — Successful DELETE returns 200, not 204; check for `<msg type="INFO">` in response
10. **SSL verification** — Development: `curl -k`; Production: use proper CA bundle with `--cacert`
11. **Capabilities vs roles** — Endpoint access is controlled by capabilities assigned to roles, not roles directly; check `authorize.conf`
12. **EAI attributes** — Response envelopes include `eai:acl`, `eai:attributes` metadata; the actual data is in nested `content` object
13. **search/jobs POST exec_mode** — Default is `normal` (async); use `exec_mode=oneshot` for synchronous small queries (results returned inline, no SID)

## Authentication quick reference

### Basic auth

```
curl -k -u admin:changeme https://localhost:8089/services/server/info?output_mode=json
```

### Session token

```
# Get token
curl -k -d username=admin -d password=changeme https://localhost:8089/services/auth/login
# Use token
curl -k -H "Authorization: Splunk <sessionKey>" https://localhost:8089/services/server/info
```

### Bearer token (Splunk 7.3+)

```
curl -k -H "Authorization: Bearer <token>" https://localhost:8089/services/server/info
```

## Complete REST endpoint index

### General

| File | Endpoints |
|------|-----------|
| `00-rest-api-overview.md` | Authentication, pagination, `output_mode`, ACLs, Cloud vs Enterprise, errors, rate-limit guidance |
| `_template.md` | Internal scaffold for new REST topic pages (not live endpoint docs) |

### Access Control (access-*)

| File | Endpoints |
|------|-----------|
| `access-auth-login.md` | `/services/auth/login` |
| `access-authentication-users.md` | `/services/authentication/users` |
| `access-authorization-capabilities.md` | `/services/authorization/capabilities` |
| `access-authorization-fieldfilters.md` | `/services/authorization/fieldfilters` |
| `access-authorization-grantable-capabilities.md` | `/services/authorization/grantable_capabilities` |
| `access-authorization-roles.md` | `/services/authorization/roles` |
| `access-authorization-tokens.md` | `/services/authorization/tokens` |
| `access-current-context.md` | `/services/authentication/current-context` |
| `access-duo-mfa.md` | `/services/admin/Duo-MFA` |
| `access-httpauth-tokens.md` | `/services/authentication/httpauth-tokens` |
| `access-ldap.md` | `/services/admin/LDAP-groups` |
| `access-oauth2.md` | `/services/authentication/providers/oauth2` |
| `access-proxysso.md` | `/services/admin/ProxySSO-auth` |
| `access-rsa-mfa.md` | `/services/admin/Rsa-MFA` |
| `access-saml.md` | `/services/admin/replicate-SAML-certs` |
| `access-storage-passwords.md` | `/services/storage/passwords` |

### Apps (apps-*)

| File | Endpoints |
|------|-----------|
| `apps-appinstall.md` | `/services/apps/appinstall` |
| `apps-apptemplates.md` | `/services/apps/apptemplates` |
| `apps-local.md` | `/services/apps/local` |

### Configuration (conf-*)

| File | Endpoints |
|------|-----------|
| `conf-configs.md` | `/services/configs/conf-{file}` |
| `conf-properties.md` | `/services/properties` |

### Deployment (deploy-*)

| File | Endpoints |
|------|-----------|
| `deploy-deployment-client.md` | `deployment/client` bundle |
| `deploy-deployment-server-applications.md` | `deployment/server/applications` bundle |
| `deploy-deployment-server-clients-metrics.md` | `deployment/server/clients/metrics` bundle |
| `deploy-deployment-server-clients.md` | `deployment/server/clients` bundle |
| `deploy-deployment-server-config.md` | `deployment/server/config` bundle |
| `deploy-deployment-server-serverclasses.md` | `deployment/server/serverclasses` bundle |

### Federated Search (federated-*)

| File | Endpoints |
|------|-----------|
| `federated-index.md` | `/services/data/federated/index` |
| `federated-provider.md` | `/services/data/federated/provider` |
| `federated-settings-general.md` | `/services/data/federated/settings/general` |

### Input (input-*)

| File | Endpoints |
|------|-----------|
| `input-data-ingest-rfsdestinations.md` | `/services/data/ingest/rfsdestinations` |
| `input-data-ingest-rulesets.md` | `/services/data/ingest/rulesets` |
| `input-data-inputs-ad.md` | `/services/data/inputs/ad` |
| `input-data-inputs-all.md` | `/services/data/inputs/all` |
| `input-data-inputs-http.md` | `/services/data/inputs/http` |
| `input-data-inputs-monitor.md` | `/services/data/inputs/monitor` |
| `input-data-inputs-oneshot.md` | `/services/data/inputs/oneshot` |
| `input-data-inputs-registry.md` | `/services/data/inputs/registry` |
| `input-data-inputs-script.md` | `/services/data/inputs/script` |
| `input-data-inputs-tcp-cooked.md` | `/services/data/inputs/tcp/cooked` |
| `input-data-inputs-tcp-raw.md` | `/services/data/inputs/tcp/raw` |
| `input-data-inputs-tcp-splunktcptoken.md` | `/services/data/inputs/tcp/splunktcptoken` |
| `input-data-inputs-tcp-ssl.md` | `/services/data/inputs/tcp/ssl` |
| `input-data-inputs-udp.md` | `/services/data/inputs/udp` |
| `input-data-inputs-win-event-log-collections.md` | `/services/data/inputs/win-event-log-collections` |
| `input-data-inputs-win-perfmon.md` | `/services/data/inputs/win-perfmon` |
| `input-data-inputs-win-wmi-collections.md` | `/services/data/inputs/win-wmi-collections` |
| `input-data-modular-inputs.md` | `/services/data/modular-inputs` |
| `input-indexing-preview.md` | `/services/indexing/preview` |
| `input-receivers-simple.md` | `/services/receivers/simple` |
| `input-receivers-stream.md` | `/services/receivers/stream` |
| `input-server-pipelinesets.md` | `/services/server/pipelinesets` |
| `input-services-collector.md` | `/services/services/collector` |

### Introspection (introspect-*)

| File | Endpoints |
|------|-----------|
| `introspect-data-index-volumes.md` | `data/index-volumes` bundle |
| `introspect-data-indexes-extended.md` | `data/indexes-extended` bundle |
| `introspect-data-indexes.md` | `data/indexes` bundle |
| `introspect-data-summaries.md` | `data/summaries` bundle |
| `introspect-server-health-config.md` | `server/health-config` bundle |
| `introspect-server-health-deployment.md` | `server/health/deployment` bundle |
| `introspect-server-health-splunkd.md` | `server/health/splunkd` bundle |
| `introspect-server-info.md` | `server/info` bundle |
| `introspect-server-introspection-indexer.md` | `server/introspection/indexer` bundle |
| `introspect-server-introspection-kvstore.md` | `server/introspection/kvstore` bundle |
| `introspect-server-introspection-search.md` | `server/introspection/search` bundle |
| `introspect-server-introspection.md` | `server/introspection` bundle |
| `introspect-server-status-resource-usage.md` | `server/status/resource-usage` bundle |
| `introspect-server-status.md` | `server/status` bundle |
| `introspect-server-sysinfo.md` | `server/sysinfo` bundle |
| `introspect-services-saved-bookmarks-monitoring_console.md` | `services/saved/bookmarks/monitoring_console` bundle |

### Knowledge (knowledge-*)

| File | Endpoints |
|------|-----------|
| `knowledge-admin-summarization.md` | `/services/admin/summarization` |
| `knowledge-data-lookup-table-files.md` | `/services/data/lookup-table-files` |
| `knowledge-data-props-calcfields.md` | `/services/data/props/calcfields` |
| `knowledge-data-props-extractions.md` | `/services/data/props/extractions` |
| `knowledge-data-props-fieldaliases.md` | `/services/data/props/fieldaliases` |
| `knowledge-data-props-lookups.md` | `/services/data/props/lookups` |
| `knowledge-data-props-sourcetype-rename.md` | `/services/data/props/sourcetype-rename` |
| `knowledge-data-transforms-extractions.md` | `/services/data/transforms/extractions` |
| `knowledge-data-transforms-lookups.md` | `/services/data/transforms/lookups` |
| `knowledge-data-transforms-metric-schema.md` | `/services/data/transforms/metric-schema` |
| `knowledge-data-transforms-statsdextractions.md` | `/services/data/transforms/statsdextractions` |
| `knowledge-data-ui.md` | `/services/data/ui/global-banner` |
| `knowledge-datamodel.md` | `/services/datamodel/acceleration` |
| `knowledge-directory.md` | `/services/directory` |
| `knowledge-saved-bookmarks-monitoring-console.md` | `/services/saved/bookmarks/monitoring_console` |
| `knowledge-saved-eventtypes.md` | `/services/saved/eventtypes` |
| `knowledge-search-fields-tags.md` | `/services/search/fields` |

### KV Store (kvstore-*)

| File | Endpoints |
|------|-----------|
| `kvstore-admin.md` | `/services/kvstore/backup/create` and related admin |
| `kvstore-collections-config.md` | `/servicesNS/{owner}/{app}/storage/collections/config` |
| `kvstore-collections-data.md` | `/servicesNS/{owner}/{app}/storage/collections/data/{collection}` |
| `kvstore-shcluster-kvmigrate.md` | `/services/shcluster/captain/kvmigrate/start` |

### License (license-*)

| File | Endpoints |
|------|-----------|
| `license-licenser-groups.md` | `/services/licenser/groups` |
| `license-licenser-licenses.md` | `/services/licenser/licenses` |
| `license-licenser-localpeer.md` | `/services/licenser/localpeer` |
| `license-licenser-messages.md` | `/services/licenser/messages` |
| `license-licenser-peers.md` | `/services/licenser/peers` |
| `license-licenser-pools.md` | `/services/licenser/pools` |
| `license-licenser-stacks.md` | `/services/licenser/stacks` |
| `license-licenser-usage.md` | `/services/licenser/usage` |

### Metrics (metrics-*)

| File | Endpoints |
|------|-----------|
| `metrics-catalog-metricstore-dimensions.md` | `/services/catalog/metricstore/dimensions` |
| `metrics-catalog-metricstore-metrics.md` | `/services/catalog/metricstore/metrics` |
| `metrics-catalog-metricstore-rollup.md` | `/services/catalog/metricstore/rollup` |

### Output (output-*)

| File | Endpoints |
|------|-----------|
| `output-data-outputs-tcp-default.md` | `/services/data/outputs/tcp/default` |
| `output-data-outputs-tcp-group.md` | `/services/data/outputs/tcp/group` |
| `output-data-outputs-tcp-server.md` | `/services/data/outputs/tcp/server` |
| `output-data-outputs-tcp-syslog.md` | `/services/data/outputs/tcp/syslog` |

### Search (search-*)

| File | Endpoints |
|------|-----------|
| `search-alerts-alert-actions.md` | Alert actions |
| `search-alerts-fired-alerts.md` | Fired alerts |
| `search-alerts-metric-alerts.md` | Metric alerts |
| `search-concurrency-settings.md` | Search concurrency settings |
| `search-data-commands.md` | Search data commands |
| `search-jobs.md` | `/services/search/jobs` family |
| `search-parser.md` | Search parser endpoints |
| `search-rest-prologue.md` | Search REST API versioning and usage |
| `search-saved-searches.md` | Saved searches |
| `search-scheduled-views.md` | Scheduled views |
| `search-scheduler.md` | Search scheduler |
| `search-spl2-overview.md` | SPL2-related REST notes |
| `search-timeparser.md` | Search time parser |
| `search-typeahead.md` | Search typeahead |

### System (system-*)

| File | Endpoints |
|------|-----------|
| `system-messages.md` | `messages` bundle |
| `system-server-control.md` | `server/control` bundle |
| `system-server-httpsettings-proxysettings.md` | `server/httpsettings/proxysettings` bundle |
| `system-server-logger.md` | `server/logger` bundle |
| `system-server-roles.md` | `server/roles` bundle |
| `system-server-security-rotate-splunk-secret.md` | `server/security/rotate-splunk-secret` bundle |
| `system-server-settings.md` | `server/settings` bundle |

### Workloads (workloads-*)

| File | Endpoints |
|------|-----------|
| `workloads-categories.md` | `/services/workloads/categories` |
| `workloads-config.md` | `/services/workloads/config/*` |
| `workloads-policy-search-admission-control.md` | `/services/workloads/policy/search_admission_control` |
| `workloads-pools.md` | `/services/workloads/pools` |
| `workloads-rules.md` | `/services/workloads/rules` |
| `workloads-status.md` | `/services/workloads/status` |
