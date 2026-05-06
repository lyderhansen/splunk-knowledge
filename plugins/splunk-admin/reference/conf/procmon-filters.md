# procmon-filters.conf

**Deprecated.** Historically supplied regex-driven filters for legacy Windows process/registry monitoring configurations so Splunk could narrow which process image names and event types were captured.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or equivalent app paths) |
| Pipeline phase | Input |
| Restart required | Yes |
| Related files | Windows inputs, `inputs.conf` |

## Stanzas and settings

### `[<filter_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `proc` | `<regex>` | — | Regular expression selecting process image paths/names to monitor when this legacy filter is honored. |
| `type` | `<regex>` | — | Regular expression restricting which classes of process events (for example create/exit/image) pass the filter. |
| `hive` | `<regex>` | — | Must be supplied (often `.*`) for compatibility even though it is unused in this filtering context. |

### `[default]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `hive` | `<regex>` | `.*` | Baseline pattern inherited by other filter stanzas in examples; keeps parser expectations satisfied. |
