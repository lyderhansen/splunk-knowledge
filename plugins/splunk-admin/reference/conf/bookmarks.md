# bookmarks.conf

Stores Monitoring Console bookmark shortcuts so Splunk administrators can jump between multiple deployments’ console URLs without manual navigation.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | — |

## Stanzas and settings

### `[bookmarks_mc:*]`

Each stanza suffix labels the bookmark shown in the Monitoring Console navigation pane.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `url` | `<string>` | _(unset)_ | Absolute `http://` or `https://` Monitoring Console URL containing `splunk_monitoring_console`; defines where the bookmark navigates. |
