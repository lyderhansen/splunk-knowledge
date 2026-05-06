# global-banner.conf

Configure a global banner shown at the top of every Splunk Web page, above the Splunk bar.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (override defaults under `$SPLUNK_HOME/etc/system/default/`) |
| Pipeline phase | N/A |
| Restart required | No (reload); spec text mentions restart for changes—task matrix uses reload |
| Related files | web.conf |

## Stanzas and settings

### `[BANNER_MESSAGE_SINGLETON]`

Only one global banner may be declared; this is the sole stanza Splunk Web reads.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `global_banner.visible` | `<bool>` | `false` | Whether the banner is shown. |
| `global_banner.message` | `<string>` | Sample banner notification text. Please replace with your own message. | Banner body text. |
| `global_banner.background_color` | `[green\|blue\|yellow\|orange\|red]` | `blue` | Preset background color for the banner. |
| `global_banner.hyperlink` | `[http://\<string\>\|https://\<string\>]` | none | Optional URL opened from the banner. |
| `global_banner.hyperlink_text` | `<string>` | none | Label for the hyperlink. |
