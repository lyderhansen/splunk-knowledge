# passwords.conf

This file maintains credential information for a given app in Splunk Enterprise. There is no global default file; `passwords.conf` is created when credentials are added or edited via the storage endpoint (from release 6.3.0 onward) and replicates on search head clusters.

**Source version:** Splunk Enterprise 10.2  
**Docs fetched from:** https://docs.splunk.com/Documentation/Splunk/10.2.0/Admin/Passwords (`…/latest/Admin/Passwordsconf` returns 404)

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<app>/local/passwords.conf` (created via REST `/storage/passwords`; no global default) |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | server.conf |

## Stanzas and settings

### `[credential:::]`

Stan naming follows Splunk’s credential stanza pattern for username and optional realm (see spec); stores encrypted passwords when saved through splunkd.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `password` | `<password>` | — | Password corresponding to the username for the given realm. Realm is optional. May be clear text in the file; splunkd encrypts it when saved through the storage endpoint. |
