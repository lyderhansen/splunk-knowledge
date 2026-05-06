
# serverclass.conf

Defines deployment-server classes, filters that determine membership (whitelist/blacklist, CSV imports, machine/package/updater gates), repository paths, restart semantics, and per-app overrides across `[global] → [serverClass:<name>] → [serverClass:<name>:app:<app>]`.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` on deployment servers |
| Pipeline phase | N/A |
| Restart required | Yes (`splunk reload deploy-server` or restart) |
| Related files | deploymentclient.conf |

## Stanzas and settings

Splunk explicitly forbids using `[default]`—only `[global]` supplies inherited defaults.

### `[global]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | boolean | false | Disables deployment-server functionality entirely when true. |
| `crossServerChecksum` | boolean | false | Forces identical app hashes across DS peers behind load balancers. |
| `excludeFromUpdate` | CSV paths | none | Comma-separated `$app_root$/…` paths excluded from overwrite during upgrades. |
| `repositoryLocation` | path | `$SPLUNK_HOME/etc/deployment-apps` | Filesystem containing staged deployment apps on the server. |
| `syncMode` | `none` \| `sharedDir` | none | Enables shared deployment-app directories plus `_splunk_ds_info` coordination. |
| `maxConcurrentDownloads` | positive integer | `0` | Concurrent bundle downloads allowed; zero means unlimited. |
| `reloadCheckInterval` | integer | `60` | Polling cadence for reload detection while using shared directories. |
| `targetRepositoryLocation` | path | `$SPLUNK_HOME/etc/apps` | Client-side install path advertised unless overridden. |
| `tmpFolder` | path | `$SPLUNK_HOME/var/run/tmp` | Temporary workspace used while assembling bundles. |
| `continueMatching` | boolean | true | Keeps evaluating subsequent classes after the first match when true. |
| `endpoint` | URL template | `$deploymentServerUri$/services/streams/deployment?name=$tenantName$:$serverClassName$:$appName$` | REST/stream URI template handed to clients. |
| `filterType` | `whitelist` \| `blacklist` | whitelist | Chooses default deny versus default allow semantics. |
| `whitelist.<n>` | pattern | none | Positive filter clauses referencing clientName, IP, hostname, or instance GUID. |
| `blacklist.<n>` | pattern | none | Negative filter clauses evaluated alongside whitelist entries. |
| `whitelist.from_pathname` | path | none | Imports plaintext or CSV allow entries relative to `$SPLUNK_HOME`. |
| `blacklist.from_pathname` | path | none | Imports plaintext or CSV deny entries relative to `$SPLUNK_HOME`. |
| `whitelist.select_field` | field \| integer | none | CSV column (name or 1-based index) supplying allow values. |
| `blacklist.select_field` | field \| integer | none | CSV column supplying deny values. |
| `whitelist.where_field` | field \| integer | none | CSV column tested against `whitelist.where_equals`. |
| `blacklist.where_field` | field \| integer | none | CSV column tested against `blacklist.where_equals`. |
| `whitelist.where_equals` | CSV regex list | none | Allow-row predicates applied with `whitelist.where_field`. |
| `blacklist.where_equals` | CSV regex list | none | Deny-row predicates applied with `blacklist.where_field`. |
| `restartSplunkWeb` | boolean | false | Restarts Splunk Web after relevant pushes. |
| `restartSplunkd` | boolean | false | Restarts splunkd after pushes. |
| `issueReload` | boolean | false | Triggers configuration reload instead of restart. |
| `restartIfNeeded` | boolean | false | For ≥6.4 forwarders, restarts when reload fails. |
| `stateOnClient` | `enabled` \| `disabled` \| `noop` | enabled | Forces enable/disable state independent of server. |
| `precompressBundles` | boolean | true | Precomputes gzip bundles when SSL compression is off but HTTP compression on. |

### `[serverClass:<serverClassName>]`

`<serverClassName>` contains letters, numbers, spaces, underscores, dashes, dots, tildes, `@`; matching is case-sensitive.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `machineTypesFilter` | CSV regex list | none | Restricts clients by hardware architecture (`linux-x86_64`, etc.). |
| `packageTypesFilter` | CSV regex list | none | Restricts clients by deployment package identifiers. |
| `updaterRunningFilter` | boolean | none | Filters hosts based on whether Splunk’s self-updater process is running. |
| `continueMatching` | boolean | inherits `[global]` | Override layered matching beyond first hit. |
| `endpoint` | URL template | inherits `[global]` | Server-class scoped endpoint overrides. |
| `excludeFromUpdate` | CSV paths | inherits `[global]` | Adds exclusions atop inherited defaults. |
| `filterType` | `whitelist` \| `blacklist` | inherits `[global]` | Overrides filtering semantics. |
| `whitelist.<n>` | pattern | inherits `[global]` | Server-class scoped whitelist entries. |
| `blacklist.<n>` | pattern | inherits `[global]` | Server-class scoped blacklist entries. |
| `whitelist.from_pathname` | path | inherits `[global]` | Server-class scoped allow imports. |
| `blacklist.from_pathname` | path | inherits `[global]` | Server-class scoped deny imports. |
| `whitelist.select_field` | field \| integer | inherits `[global]` | CSV column metadata for allows. |
| `blacklist.select_field` | field \| integer | inherits `[global]` | CSV column metadata for denies. |
| `whitelist.where_field` | field \| integer | inherits `[global]` | CSV predicate column for allows. |
| `blacklist.where_field` | field \| integer | inherits `[global]` | CSV predicate column for denies. |
| `whitelist.where_equals` | CSV regex list | inherits `[global]` | CSV predicates paired with allow column. |
| `blacklist.where_equals` | CSV regex list | inherits `[global]` | CSV predicates paired with deny column. |
| `restartSplunkWeb` | boolean | inherits `[global]` | Restart Splunk Web after pushes affecting this class. |
| `restartSplunkd` | boolean | inherits `[global]` | Restart splunkd after pushes affecting this class. |
| `issueReload` | boolean | inherits `[global]` | Reload processors instead of restarting. |
| `restartIfNeeded` | boolean | inherits `[global]` | Auto-restart forwarders when reload fails. |
| `stateOnClient` | `enabled` \| `disabled` \| `noop` | inherits `[global]` | Forced client enablement. |
| `repositoryLocation` | path | inherits `[global]` | Alternate staged-app directory for this class. |
| `targetRepositoryLocation` | path | inherits `[global]` | Alternate live-app directory hint. |
| `cronSchedule` | cron string | none | Schedules automatic deployment reload jobs. |

### `[serverClass:<server class name>:app:<app name>]`

`<app name>` may be `*` for repository-wide membership or a concrete folder/tar name sharing the same character restrictions.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `appFile` | filename | none | Specifies tarball/tgz/directory name differing from stanza key. |
| `issueReload` | boolean | inherits parent | App-level reload preference. |
| `restartIfNeeded` | boolean | inherits parent | App-level restart-if-needed preference. |
| `excludeFromUpdate` | CSV paths | inherits parent | App-specific untouched directories. |
| `filterType` | `whitelist` \| `blacklist` | inherits parent | App-level filtering semantics (defaults changed in 9.4.3). |
| `whitelist.<n>` | pattern | inherits parent | App-level whitelist. |
| `blacklist.<n>` | pattern | inherits parent | App-level blacklist. |
| `whitelist.from_pathname` | path | inherits parent | App-level allow imports. |
| `blacklist.from_pathname` | path | inherits parent | App-level deny imports. |
| `whitelist.select_field` | field \| integer | inherits parent | CSV column metadata for allows. |
| `blacklist.select_field` | field \| integer | inherits parent | CSV column metadata for denies. |
| `whitelist.where_field` | field \| integer | inherits parent | CSV predicate column for allows. |
| `blacklist.where_field` | field \| integer | inherits parent | CSV predicate column for denies. |
| `whitelist.where_equals` | CSV regex list | inherits parent | CSV predicates paired with allow column. |
| `blacklist.where_equals` | CSV regex list | inherits parent | CSV predicates paired with deny column. |
| `machineTypesFilter` | CSV regex | inherits parent | Further restricts hosts receiving this app. |
| `packageTypesFilter` | CSV regex | inherits parent | Further restricts packaging types. |
| `updaterRunningFilter` | boolean | inherits parent | Further restricts updater presence. |
| `stateOnClient` | `enabled` \| `disabled` \| `noop` | inherits parent | App-specific forced enablement. |