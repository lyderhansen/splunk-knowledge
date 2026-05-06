---
name: sa-conf-files
description: "Splunk configuration file reference — gotchas, precedence rules, and per-conf-file settings index. Load BEFORE writing or editing any Splunk .conf file. Covers all ~60 configuration files with traps ranked by frequency, data pipeline mapping, restart-vs-reload matrix, and a complete index pointing to reference/conf/<name>.md for every stanza and setting."
---

# Splunk configuration files (`sa-conf-files`)

## 1. How to use

- Scan this skill **before** writing or editing any `.conf` file.
- Check **silent-fail traps** for the syntax you are about to use (comments inline with settings, duplicate stanzas, invalid keys, and similar mistakes bite constantly).
- Use the **conf file index** (Section 6) to pick the correct file for the task instead of guessing.
- For full stanza names and setting semantics, read the matching doc under `reference/conf/<name>.md` in the `splunk-admin` plugin.

## 2. Silent-fail traps (ranked by frequency)

### 1. Editing `default/` instead of `local/` — changes get overwritten silently on upgrade

- **Wrong:** Edit `$SPLUNK_HOME/etc/system/default/props.conf`
- **Right:** Create or edit `$SPLUNK_HOME/etc/system/local/props.conf`, or ship overrides under an app’s `default/` (never Splunk-shipped `system/default`).
- **Why:** Splunk upgrades overwrite files under `system/default/`. Durable overrides live under `local/` and app layers Splunk does not replace wholesale.

### 2. Duplicate stanzas in the same file — last stanza wins

- **Wrong:** Two `[my_sourcetype]` stanzas in the same `props.conf`
- **Right:** Merge all settings under a single `[my_sourcetype]` stanza
- **Why:** Earlier duplicate stanzas are effectively ignored for conflicting keys. AppInspect also rejects duplicate stanza headers in the same file.

### 3. Comments on the same line as settings

- **Wrong:** `MAX_TIMESTAMP_LOOKAHEAD = 32 # bytes`
- **Right:** Put the comment on its own line above the setting
- **Why:** The parser treats the whole right-hand side as the value; you get the literal string `32 # bytes`, not `32`.

### 4. Missing backslash continuation in multi-line SPL

- **Wrong:**

  ```ini
  search = index=main sourcetype=foo
  | stats count
  ```

- **Right:**

  ```ini
  search = index=main sourcetype=foo \
  | stats count
  ```

- **Why:** Continued lines that start with `|` without a preceding `\` on the prior line often produce **Cannot parse into key-value pair** errors in `.conf` parsers.

### 5. `KV_MODE = none` on sourcetypes needing auto-extraction

- **Wrong:** Set `KV_MODE = none` then reference raw-body fields in `EVAL-user = coalesce(username, src_user)` without explicit extraction
- **Right:** Match `KV_MODE` to the event shape — JSON → `KV_MODE = json`; CEF / syslog-style key=value → `auto`; binary or proprietary → `none` **plus** explicit `EXTRACT` / `REPORT` for every field you reference
- **Why:** If Splunk never extracts the underlying fields, dependent `EVAL`, `FIELDALIAS`, and `LOOKUP` resolutions collapse to null at search time.

### 6. `match_type = EXACT` in transforms.conf

- **Wrong:** `match_type = EXACT`
- **Right:** Omit `match_type` entirely for exact matching (the default)
- **Why:** `EXACT` is not a valid Splunk keyword and has triggered C++ `basic_string`-class failures. Only `WILDCARD(<field>)` and `CIDR(<field>)` forms are valid when you need non-default matching.

### 7. Wrong `TIME_FORMAT` strptime directives

- **Wrong:** `TIME_FORMAT = %B/%d/%Y` when months arrive as `Jan`
- **Right:** `TIME_FORMAT = %b/%d/%Y` for abbreviated English months
- **Why:** `%b` = abbreviated (`Jan`), `%B` = full (`January`), `%m` = numeric (`01`). A mismatched directive silently yields wrong timestamps or fails `_time` assignment without an obvious UI error.

### 8. Missing `SHOULD_LINEMERGE = false`

- **Wrong:** Assume defaults are safe for JSON, NDJSON, or CSV-style payloads
- **Right:** Set `SHOULD_LINEMERGE = false` explicitly for structured, one-record-per-line sources
- **Why:** Default line merging can glue adjacent physical lines into one broken event, silently destroying structure.

### 9. Case-sensitive setting names

- **Wrong:** `should_linemerge = false`
- **Right:** `SHOULD_LINEMERGE = false`
- **Why:** Keys are case-sensitive; the mis-cased name is ignored as unknown configuration.

### 10. Precedence confusion

- **Wrong:** Assume a `local` stanza replaces the entire matching `default` stanza wholesale
- **Right:** Think **attribute-level** merging — each key wins independently per layer
- **Why:** Effective configuration merges keys from `system/default` → app `default` → app `local` → user `local` (and deployment overlays). Unmentioned keys keep flowing through from lower layers.

### 11. Invalid savedsearches.conf keys

- **Wrong:** `is_scheduled = 1`, `alert_type = number of events`, `alert_comparator = greater than`, `alert_threshold = 0`
- **Right:** `enableSched = 1`, `counttype = number of events`, `relation = greater than`, `quantity = 0`
- **Why:** The wrong spellings are not configuration keys Splunk recognizes — they cause **Invalid key in stanza** startup errors.

### 12. File path in lookup `filename`

- **Wrong:** `filename = lookups/my_data.csv`
- **Right:** `filename = my_data.csv` with the CSV physically under `<app>/lookups/`
- **Why:** Splunk expects the basename only; embedded paths are stripped or mishandled. Wrong placement breaks lookups at search time.

## 3. Configuration file precedence

Splunk merges configuration from multiple layers; **lower layers supply defaults**, **higher layers override individual attributes**.

Read ordering is broadly:

1. **`$SPLUNK_HOME/etc/system/default/`** — vendor-shipped defaults. **Never edit** — upgrades replace these files.
2. **`$SPLUNK_HOME/etc/apps/<app>/default/`** — application defaults shipped with an app package.
3. **`$SPLUNK_HOME/etc/apps/<app>/local/`** — application-local overrides (persistent across upgrades for that installation).
4. **`$SPLUNK_HOME/etc/system/local/`** — global overrides affecting all apps where not superseded.
5. **`$SPLUNK_HOME/etc/users/<user>/<app>/local/`** — per-user overrides inside an app context.

Key rules:

- **Merging is per-attribute**, not per whole stanza. If `local` sets two keys, every other key from `default` that remains legal still applies.
- **`export = system`** in `metadata/default.meta` exposes saved objects (knowledge, views, etc.) beyond the owning app boundary — it does not replace `.conf` precedence but controls knowledge-object visibility.
- **App context** determines which app directories participate when Splunk resolves configuration through `merge_to_default`. Changing context can surface different effective settings even when files exist on disk.

## 4. Data pipeline mapping

| Phase | Conf files | What happens |
|-------|-----------|--------------|
| Input | `inputs.conf`, `props.conf` (`CHARSET`, sourcetype assignment) | Data enters Splunk from files, network listeners, APIs, scripts |
| Parsing | `props.conf` (`LINE_BREAKER`, `TIME_*`, `SHOULD_LINEMERGE`, `TRANSFORMS-*`), `transforms.conf` | Raw streams become discrete events; timestamps are recognized |
| Indexing | `props.conf` (`SEGMENTATION`), `indexes.conf`, `segmenters.conf` | Events land on disk / remote storage with segmentation rules applied |
| Search | `props.conf` (`EXTRACT-*`, `REPORT-*`, `LOOKUP-*`, `FIELDALIAS-*`, `EVAL-*`), `transforms.conf`, `savedsearches.conf`, `eventtypes.conf`, `tags.conf`, `macros.conf`, `fields.conf` | Late-bound fields, lookups, macros, and scheduled knowledge execute |

## 5. Restart vs reload matrix

| Change type | Restart required? | How to reload |
|-------------|-------------------|---------------|
| `props.conf` search-time extractions | No | Effective per search; optionally `\| extract reload=T` |
| `props.conf` index-time settings | Usually no on search head; **indexers may need restart** for some paths | `debug/refresh` (`debug/refresh?entity=props` pattern) where applicable |
| `transforms.conf` field extractions | No | `debug/refresh` (`entity=transforms`) |
| `savedsearches.conf` | No | UI / REST picks up definitions on schedule save |
| `eventtypes.conf`, `tags.conf` | No | Reloaded as part of search metadata resolution |
| `inputs.conf` (most settings) | **Yes** | — |
| `outputs.conf` | **Yes** | — |
| `server.conf`, `web.conf` | **Yes** | — |
| `authentication.conf`, `authorize.conf` | **Yes** | — |
| `indexes.conf` | **Yes** | — |
| Lookup CSV files | No | Read when lookup executes |
| `macros.conf` | No | Evaluated when referenced |

## 6. Complete conf file index

Reference docs live under `plugins/splunk-admin/reference/conf/` as `<name>.md` (regenerate the authoritative list with `ls -1 plugins/splunk-admin/reference/conf/*.md | grep -v _template`).

| File | Purpose | Pipeline phase | Reference |
|------|---------|---------------|-----------|
| agent_management | Configure the Agent Management feature | N/A | `reference/conf/agent_management.md` |
| alert_actions | Configure alert actions (email, script, webhook) | Search | `reference/conf/alert_actions.md` |
| app | App metadata (label, version, author, visibility) | N/A | `reference/conf/app.md` |
| audit | Configure auditing and event hashing | N/A | `reference/conf/audit.md` |
| authentication | Toggle between Splunk built-in auth, LDAP, or SAML | N/A | `reference/conf/authentication.md` |
| authorize | Configure roles and granular access controls | N/A | `reference/conf/authorize.md` |
| bookmarks | Bookmark monitoring console URLs | N/A | `reference/conf/bookmarks.md` |
| checklist | Customize monitoring console health checks | N/A | `reference/conf/checklist.md` |
| collections | Configure KV Store collections | Search | `reference/conf/collections.md` |
| commands | Register custom search commands | Search | `reference/conf/commands.md` |
| datamodels | Configure data model acceleration and attributes | Search | `reference/conf/datamodels.md` |
| default-meta | Set permissions for objects in a Splunk app | N/A | `reference/conf/default-meta.md` |
| deploymentclient | Configure deployment client behavior | N/A | `reference/conf/deploymentclient.md` |
| distsearch | Configure distributed search | Search | `reference/conf/distsearch.md` |
| event_renderers | Configure event rendering properties | N/A | `reference/conf/event_renderers.md` |
| eventtypes | Define event type classifications | Search | `reference/conf/eventtypes.md` |
| federated | Search data outside your Splunk deployment | Search | `reference/conf/federated.md` |
| fields | Create multivalue fields, add indexed field search capability | Search | `reference/conf/fields.md` |
| global-banner | Display a global banner on all Splunk Web pages | N/A | `reference/conf/global-banner.md` |
| health | Set thresholds for proactive component monitoring | N/A | `reference/conf/health.md` |
| indexes | Manage index settings (paths, sizes, retention, SmartStore) | Indexing | `reference/conf/indexes.md` |
| inputs | Configure data inputs (monitor, TCP, UDP, scripted, HTTP) | Input | `reference/conf/inputs.md` |
| instance-cfg | Instance identification and management | N/A | `reference/conf/instance-cfg.md` |
| limits | Set search and system limits (result sizes, concurrency) | Search | `reference/conf/limits.md` |
| literals | Customize Splunk Web text strings | N/A | `reference/conf/literals.md` |
| macros | Define search macros | Search | `reference/conf/macros.md` |
| messages | Customize Splunk Web messages | N/A | `reference/conf/messages.md` |
| metric_rollups | Configure metric rollup policies | Indexing | `reference/conf/metric_rollups.md` |
| multikv | Configure extraction for table-like events (ps, netstat) | Search | `reference/conf/multikv.md` |
| outputs | Configure forwarding behavior (TCP, syslog, HTTP) | Output | `reference/conf/outputs.md` |
| passwords | Maintain app credential information | N/A | `reference/conf/passwords.md` |
| procmon-filters | Monitor Windows process data | Input | `reference/conf/procmon-filters.md` |
| props | Indexing/search properties: timestamp, line breaking, field extraction, source type rules | Input/Parsing/Search | `reference/conf/props.md` |
| pubsub | Define custom deployment server clients | N/A | `reference/conf/pubsub.md` |
| restmap | Create custom REST endpoints | N/A | `reference/conf/restmap.md` |
| rolling_upgrade | Configure automated rolling upgrades | N/A | `reference/conf/rolling_upgrade.md` |
| savedsearches | Define reports, scheduled searches, and alerts | Search | `reference/conf/savedsearches.md` |
| searchbnf | Configure search assistant syntax definitions | Search | `reference/conf/searchbnf.md` |
| segmenters | Configure event segmentation | Indexing/Search | `reference/conf/segmenters.md` |
| server | System configuration: SSL, clustering, KV store, license | N/A | `reference/conf/server.md` |
| serverclass | Define deployment server classes | N/A | `reference/conf/serverclass.md` |
| serverclass-seed | Configure deployment client app seeding at startup | N/A | `reference/conf/serverclass-seed.md` |
| source-classifier | Terms to ignore when classifying source types | Parsing | `reference/conf/source-classifier.md` |
| sourcetypes | Machine-generated source type learning rules | Parsing | `reference/conf/sourcetypes.md` |
| tags | Configure tags for fields and event types | Search | `reference/conf/tags.md` |
| telemetry | Configure telemetry data collection | N/A | `reference/conf/telemetry.md` |
| times | Define custom time ranges for the time picker | Search | `reference/conf/times.md` |
| transactiontypes | Define transaction types for transaction search | Search | `reference/conf/transactiontypes.md` |
| transforms | Regex transforms, lookup definitions, routing rules | Parsing/Search | `reference/conf/transforms.md` |
| ui-prefs | Configure UI preferences per view | N/A | `reference/conf/ui-prefs.md` |
| user-prefs | Per-user Splunk Web preferences | N/A | `reference/conf/user-prefs.md` |
| user-seed | Set default user and password | N/A | `reference/conf/user-seed.md` |
| viewstates | Configure UI view states (chart settings) | N/A | `reference/conf/viewstates.md` |
| visualizations | Register app visualizations with the system | N/A | `reference/conf/visualizations.md` |
| web | Configure Splunk Web (HTTP, HTTPS, certificates) | N/A | `reference/conf/web.md` |
| web-features | Configure Splunk Web feature flags | N/A | `reference/conf/web-features.md` |
| wmi | Configure WMI inputs (Windows only) | Input | `reference/conf/wmi.md` |
| workflow_actions | Configure workflow actions in event viewers | N/A | `reference/conf/workflow_actions.md` |
| workload_policy | Enable/disable workload management admission rules | N/A | `reference/conf/workload_policy.md` |
| workload_pools | Configure workload pools (resource groups) | N/A | `reference/conf/workload_pools.md` |
| workload_rules | Configure workload rules for pool access and priority | N/A | `reference/conf/workload_rules.md` |
