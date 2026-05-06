# viewstates.conf

Stores serialized UI module settings for Classic Splunk views (`[<module>:<state_id>]`), but Splunk Enterprise 10.x marks the mechanism as removed/no-op while retaining parser compatibility.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` or per-app `local/` |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | Classic Simple XML dashboards, `ui-prefs.conf` |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *standard merge semantics* | — | — | Follow Splunk global stanza merging conventions when present. |

### `[<view_or_module_prefix>:<viewstate_id>]`

The first segment is usually the URI-safe Splunk view name (use `*` for a global sticky state) but legacy modules also persisted stanza headers such as `[charting:<id>]`; `<viewstate_id>` may be `_current`, `_empty`, or a generated hash per the `.spec`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<module_id>.<setting_name>` | `<string>` | — | Persists an arbitrary UI module property identified by runtime module id plus dotted setting path (feature inactive in current releases). |
