# tags.conf

Use `tags.conf` to enable or disable data-model routing tags on specific indexed or extracted field values (for example `host=emailbox`). Each stanza targets exactly one `field=value` pair and lists tags Splunk applies for searches and acceleration hints.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | eventtypes.conf |

## Stanzas and settings

### `[<field>=<value>]`

The stanza name is the field name and value to tag (for example `host=localhost`). URL-encode values when they contain `\n`, `=`, or `[]` to avoid parser errors.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<tag>` | `enabled \| disabled` | _(per line)_ | Each line assigns one tag name as enabled or disabled for this field/value pair; exactly one tag per line—lists are not allowed. |

Do not quote tag names on the left-hand side (use `foo=enabled`, not `"foo"=enabled`).
