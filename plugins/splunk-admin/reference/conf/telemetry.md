# telemetry.conf

Provides per-app knobs for Splunk instrumentation consent, scheduling, buffering, endpoints, and hashed payloads so usage telemetry respects deployment privacy choices while still honoring cluster replication edge cases.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | Per-app `$SPLUNK_HOME/etc/apps/<app>/local/` (no global default file) |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `server.conf` |

## Stanzas and settings

### `[general]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `optInVersion` | `<number>` | _(managed)_ | Internal schema version describing which telemetry bundle Splunk collects; increments automatically when datasets change and should not be hand-edited. |
| `optInVersionAcknowledged` | `<number>` | _(unset)_ | Tracks the newest `optInVersion` acknowledged via UI; until matched, eligible users see instrumentation prompts at login. |
| `sendLicenseUsage` | `true\|false` | `true` | Allows forwarding summarized license usage metrics associated with the app context. |
| `sendAnonymizedUsage` | `true\|false` | `true` | Sends anonymized infrastructure/utilization telemetry about Splunk/app usage to Splunk, Inc. |
| `sendSupportUsage` | `true\|false` | `false` | Sends richer support-oriented telemetry batches when explicitly enabled. |
| `sendAnonymizedWebAnalytics` | `true\|false` | `true` | Enables Splunk Web interaction analytics (`swajs`) according to consent policies. |
| `precheckSendLicenseUsage` | `true\|false` | `true` | Default checkbox state for license usage sharing inside the instrumentation modal. |
| `precheckSendAnonymizedUsage` | `true\|false` | `true` | Default checkbox state for anonymized telemetry within the modal workflow. |
| `precheckSendSupportUsage` | `true\|false` | `true` | Default checkbox state for optional support telemetry paths in the modal UI. |
| `showOptInModal` | `true\|false` | `true` | Deprecated flag superseded by `optInVersion*` pairing; Splunk auto-manages modal visibility after consent. |
| `deploymentID` | `<string>` | _(generated)_ | UUID correlating telemetry batches from the same deployment once sharing is approved. |
| `deprecatedConfig` | `true\|false` | `false` | Signals whether the deployment/app diverges from Splunk best-practice baselines for instrumentation dashboards. |
| `retryTransaction` | `<string>` | empty | Internal serialized retry payload used when forwarding instrumentation updates to the cluster manager fails. |
| `swaEndpoint` | `<string>` | empty | Overrides the Splunk MINT CDS endpoint for browser analytics; blank keeps factory routing. |
| `telemetrySalt` | `<string>` | _(generated)_ | UUID salt hashing sensitive fields prior to transmission on startup. |
| `scheduledHour` | `<number>` | `3` | Hour-of-day (24h clock) when scripted telemetry collection kicks off on the primary instance. |
| `scheduledDay` | `<string>` | `*` | Cron-style weekday selector (`0`=Monday) restricting telemetry jobs; `*` runs daily. |
| `reportStartDate` | `<string>` | empty | `YYYY-MM-DD` gate delaying the next telemetry collection cycle until that calendar day. |
| `bufferFlushTimeout` | `<number>` | `600` | Seconds before buffered telemetry events flush even if batch thresholds are unmet. |
| `onCloudInstance` | `true\|false` | `false` | Marks whether the deployment should apply Splunk Cloud telemetry routing assumptions. |
