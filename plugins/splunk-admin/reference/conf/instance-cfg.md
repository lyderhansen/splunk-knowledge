# instance.cfg

Splunk maintains a small instance-level bootstrap file that records this installation’s identity (for example a persistent GUID) and related machine-local metadata used during startup and licensing checks. You normally should not edit `instance.cfg`; it is created and updated by the Splunk software rather than treated like a typical admin `.conf` file.

**Source version:** Splunk Enterprise 10.2 (no public `.spec` — summarized from product behavior)

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/instance.cfg` |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `server.conf`, `splunk.license`, app/local configs |

## Stanzas and settings

### `[general]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `guid` | `<GUID>` | Installer-generated | Stable identifier for this Splunk Enterprise instance; used for internal bookkeeping and must remain consistent across upgrades unless Splunk Support directs otherwise. |
| `instance_type` | `<string>` | Varies | Describes the role or bundle characteristics of the instance as recorded at install time (values are product-internal). |

### Additional keys

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(other keys as present)* | varies | — | Splunk may add undocumented keys to `instance.cfg` for migration or licensing; treat unknown keys as read-only unless Splunk documentation or Support specifies otherwise. |
