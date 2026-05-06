# times.conf

Defines reusable relative/epoch timerange presets and picker chrome toggles so Search & Reporting UI menus stay consistent while supporting localized labels and ordering metadata.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | Search |
| Restart required | No |
| Related files | — |

## Stanzas and settings

### `[<timerange_token>]`

ASCII stanza names identify timerange tokens usable via REST or CLI (`this_business_week`, `last_24h`, etc.).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `label` | `<string>` | _(required)_ | Primary label shown inside the time-range picker control. |
| `header_label` | `<string>` | mirrors `label` | Alternate wording inserted into search headers when referencing this preset; defaults to the stanza’s `label` with adapted casing if omitted. |
| `earliest_time` | `<string>` | _(unset)_ | Earliest bound expressed as relative modifiers (`-24h`) or UNIX epoch seconds; blank means unbounded past. |
| `latest_time` | `<string>` | _(unset)_ | Latest bound similar to `earliest_time`; blank leaves future-inclusive behavior documented in spec notes. |
| `order` | `<integer>` | `0` | Ascending sort key merged with alphabetical ordering for deterministic picker menus. |
| `disabled` | `<integer>` | `0` | Non-zero hides the preset without deleting configuration history. |
| `sub_menu` | `<submenu name>` | _(removed)_ | Legacy submenu linkage removed in current builds; ignored if present. |
| `is_sub_menu` | `<boolean>` | _(removed)_ | Legacy submenu flag removed in current builds; ignored if present. |

### `[settings]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `show_advanced` | `<boolean>` | `true` | Toggles whether advanced/custom panels remain visible in the picker UI. |
| `show_date_range` | `<boolean>` | `true` | Enables/disables the calendar-style Date Range panel. |
| `show_datetime_range` | `<boolean>` | `true` | Enables/disables Date & Time precision panels for operators needing clock granularity. |
| `show_presets` | `<boolean>` | `true` | Shows stanza-defined presets alongside factory defaults. |
| `show_realtime` | `<boolean>` | `true` | Exposes realtime window shortcuts (`rt`, etc.) when true. |
| `show_relative` | `<boolean>` | `true` | Displays relative offsets (`Last 15 minutes`) for analyst workflows. |
