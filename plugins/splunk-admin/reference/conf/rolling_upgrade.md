# rolling_upgrade.conf

Configures the optional `splunk-rolling-upgrade` app that orchestrates rolling Splunk Enterprise upgrades, including REST client retries, package download integrity, hooks for Linux installers, and indexer cluster orchestration pacing.

**Source version:** Splunk Enterprise 10.2

**Documentation note:** Splunk publishes this page as `Rollingupgradeconf` (no underscore). The on-disk file name remains `rolling_upgrade.conf`.

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/splunk-rolling-upgrade/local/` (typical) or another app context |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | server.conf |

## Stanzas and settings

### `[logging]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| log_level | DEBUG \| INFO \| WARN \| ERROR | INFO | Minimum severity written by the rolling-upgrade app; higher severities always emit when enabled. |

### `[requests]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| retries | positive integer | 2 | Maximum REST retry attempts before giving up on a deployment server call. |
| delay | non-negative integer | 1 | Initial backoff in seconds before retrying a failed REST request. |
| timeout | positive integer | 30 | REST response timeout in seconds after which the client aborts the request. |

### `[process_runner]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| timeout | positive integer | 600 | Maximum seconds to wait for internally spawned subprocesses before treating the upgrade as failed. |

### `[kvstore_retry]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| max_tries | positive integer | 10 | Number of KV Store readiness polls performed during startup gating. |
| initial_delay_after_each_retry | non-negative integer | 20 | Seconds to sleep between KV Store readiness checks. |

### `[cluster_retry]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| max_tries | positive integer | 10 | Attempts to verify search head clustering is ready (peers + captain) before proceeding. |
| initial_delay_after_each_retry | non-negative integer | 20 | Delay between SHC readiness polls in seconds. |

### `[shcluster_members_retry]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| max_tries | positive integer | 20 | Attempts to confirm historical searches have finished on SHC members. |
| initial_delay_after_each_retry | non-negative integer | 20 | Delay between checks for active historical searches. |

### `[downloader]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| package_path | URI string | none | URI (`file://`, `http://`, `https://`) pointing to the Splunk `.tgz`, `.rpm`, or `.deb` upgrade package. |
| sha256_checksum | hex string | none | Expected SHA-256 digest of the package; mismatch aborts installation. |
| md5_checksum | hex string | none | Deprecated checksum field—use `sha256_checksum` instead. |

### `[hook]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| install_script_path | path | `$SPLUNK_HOME/etc/apps/splunk-rolling-upgrade/hooks/install_tgz.sh` | Hook invoked to install the downloaded package (replace when using `.rpm`/`.deb` workflows). |

### `[orchestrator]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| upgrade_check_max_tries | positive integer | 30 | Poll attempts waiting for an indexer peer to return online mid-upgrade. |
| delay_after_each_upgrade_check | positive integer | 20 | Seconds between indexer peer status polls. |
| concurrency | positive integer | min(search factor − 1, ⌊(cluster size − 1)/2⌋) | Number of indexer peers upgraded concurrently; must not exceed search factor minus one. |
| enable_midpoint_status_check | boolean | true | Upgrades half of a single-site indexer cluster, runs a health check, then upgrades the remainder when enabled. |
| midpoint_check_max_tries | positive integer | 3 | Attempts for the midpoint cluster health validation to succeed. |
| midpoint_check_retry_delay | positive integer | 20 | Seconds between midpoint health check retries. |
