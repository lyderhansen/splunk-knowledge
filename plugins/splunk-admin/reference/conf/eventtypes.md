# eventtypes.conf

Use `eventtypes.conf` to define event types: named buckets of events that match a search string. Event types power categorization, navigation, workflow actions, and CIM tagging when paired with `tags.conf`. Splunk Web creates user-scoped definitions under each user’s `local/eventtypes.conf`.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | tags.conf, props.conf |

## Stanzas and settings

### `[default]`

Stanza precedence follows standard Splunk configuration merging: at most one logical `[default]`; global attributes merge and the last wins; stanza-level settings override globals. The shipped spec does not define additional `[default]` keys beyond those universal merge notes.

### `[<$EVENTTYPE>]`

`<$EVENTTYPE>` is the event type name. Names may embed `%field%` tokens so Splunk substitutes matching field values into the displayed label (for example `[cisco-%code%]` with `code=432` becomes `cisco-432`).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `[1\|0]` | _(unset)_ | Toggles the event type off (`1`) or on (`0`). |
| `search` | `<string>` | _(required)_ | Search terms defining membership for this event type (no pipes, subsearches, or saved-report references). |
| `priority` | `<integer, 1 through 10>` | _(unset)_ | Sort order when multiple eventtypes match an event; `1` is highest priority and `10` lowest. |
| `description` | `<string>` | _(unset)_ | Optional human-readable description. |
| `tags` | `<string>` | _(unset)_ | **DEPRECATED** — use `tags.conf` instead. |
| `color` | `<string>` | _(unset)_ | UI color token (`none`, `et_blue`, `et_green`, `et_magenta`, `et_orange`, `et_purple`, `et_red`, `et_sky`, `et_teal`, `et_yellow`). |
