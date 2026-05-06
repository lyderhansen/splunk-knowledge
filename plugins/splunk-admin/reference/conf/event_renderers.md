# event_renderers.conf

Maps `eventtypes.conf` entries to optional Mako/HTML templates and CSS class suffixes so legacy Splunk Web views could customize raw event rendering; customization via event renderers is unsupported from Splunk Enterprise 6.0 onward, but the configuration remains for compatibility.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` or `$SPLUNK_HOME/etc/apps/<app>/local/` |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | `eventtypes.conf`, app `appserver/event_renderers/`, `application.css` |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *Standard global merge semantics* | — | — | At most one `[default]` stanza should exist; duplicates merge with last-wins semantics per Splunk `.conf` rules. |

### `[<unique_renderer_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `eventtype` | `<string>` | — | Name of the eventtype (from `eventtypes.conf`) whose events should use this renderer pipeline. |
| `priority` | `<positive integer>` | — | When multiple renderers match, the highest numeric priority wins. |
| `template` | `<Mako template>` | — | Template file under `$APP/appserver/event_renderers/` used to format matching events. |
| `css_class` | `<string>` | — | Suffix appended after `splunkEvent-` on the wrapper element so CSS rules in `application.css` can style the row. |
