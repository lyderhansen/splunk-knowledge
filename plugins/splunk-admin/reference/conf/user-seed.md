# user-seed.conf

Allows configuration of Splunk’s initial username and password; only one user may be configured in this file. Place `user-seed.conf` in `$SPLUNK_HOME/etc/system/local`; if `$SPLUNK_HOME/etc/passwd` exists, these settings are ignored.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | Yes (first boot only) |
| Related files | authentication.conf |

## Stanzas and settings

### `[user_info]`

Defines the initial Splunk administrator identity used before `passwd` exists.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `USERNAME` | `<string>` | `Admin` | Username to associate with the configured password or hash. |
| `PASSWORD` | `<password>` | — | Clear-text password for that user (not recommended); must meet complexity rules. If the last character is `\`, follow it with a space so the value parses correctly. |
| `HASHED_PASSWORD` | `<password hash>` | — | Output of `splunk hash-passwd`; preferred over clear-text `PASSWORD`. |
