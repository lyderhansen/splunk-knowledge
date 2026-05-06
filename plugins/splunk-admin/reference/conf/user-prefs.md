# user-prefs.conf

Describes settings that configure Splunk Web UI preferences on a per-user basis. Defaults ship under `$SPLUNK_HOME/etc/apps/user-prefs/default/`; customize in `$SPLUNK_HOME/etc/apps/user-prefs/local/` or under `$SPLUNK_HOME/etc/users/<username>/user-prefs/local/` when users save preferences interactively.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/user-prefs/local/` (global defaults); per-user files under `$SPLUNK_HOME/etc/users/<username>/user-prefs/local/` |
| Pipeline phase | N/A |
| Restart required | No (reload) |
| Related files | web.conf, authorize.conf |

## Stanzas and settings

### `[general]`

Per-user Splunk Web preferences resolved at user and `user-prefs` app scope; role-level defaults in `authorize.conf` apply at lower precedence.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `default_namespace` | `<app name>` | `launcher` (via default authorize.conf) | Short app name shown after login (e.g. `launcher`, `search`). |
| `tz` | `<timezone>` | No default | Per-user timezone; canonical names such as `America/Los_Angeles`. |
| `lang` | `<string>` | `en-US` when required | Comma-separated language tags (`Accept-Language` style); fuzzy matching supported; optional quality values (e.g. `en-US,en;q=0.8`). |
| `restart_background_jobs` | `<boolean>` | `false` | Whether queued background searches restart automatically after splunkd restart. |
| `install_source_checksum` | `<string>` | — | Checksum of tarball used when installing private user configs (mirrors app.conf `install_source_checksum`). |
| `search_syntax_highlighting` | `[default-system-theme\|light\|dark]` | `default-system-theme` | Search editor highlighting theme; dashboards ignore this. |
| `search_use_advanced_editor` | `<boolean>` | `true` | Use advanced vs plain search bar; when false, forces related search UX flags off. |
| `search_assistant` | `[full\|compact\|none]` | `compact` | Search assistant mode. |
| `theme` | `[default_system_theme\|light\|dark]` | `default_system_theme` | Preferred UI theme where apps support it. |
| `app_bar_cache_timeout_min` | `<integer>` | `1440` | Minutes before app bar cache is regenerated. |
| `search_auto_format` | `<boolean>` | `false` | Enable auto-format in the search input. |
| `search_line_numbers` | `<boolean>` | `false` | Show line numbers in the search editor. |
| `dismissedInstrumentationOptInVersion` | `<integer>` | — | Set by splunk_instrumentation when opt-in modal dismissed. |
| `hideInstrumentationOptInModal` | `<boolean>` | — | Set when instrumentation opt-in modal is dismissed. |

### `[default]`

Placeholder stanza for additional UI-managed preferences.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<setting>` | `<value>` | — | Arbitrary key/value pairs maintained by Splunk Web UI (not individually enumerated in spec). |

### `[general_default]`

Role-agnostic defaults that apply across apps/users unless overridden.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `appOrder` | `<string>` | — | App shown first in the Splunk Web app list. |
| `default_earliest_time` | `<string>` | — | Global default earliest bound for Search when not otherwise set. |
| `default_latest_time` | `<string>` | — | Global default latest bound for Search when not otherwise set. |
| `notification_python_3_impact` | `<string>` | `true` | Enable/disable/snooze Python 3 impact notification. |
| `notification_python_2_removal` | `<string>` | `false` | Enable/disable/snooze Python 2 removal notification. |
| `notification_noah_upgrade` | `<string>` | `true` | Enable/disable/snooze Noah upgrade notification. |
| `showWhatsNew` | `<boolean>` | — | **Removed**; no effect. |

### `[role_]`

Prefix pattern `role_<roleName>` for role-scoped defaults (example shows `[role_power]`, `[role_user]`).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<name>` | `<value>` | — | Any `[general]`-compatible preference key scoped to users holding that role (spec illustrates `tz`, `lang`). |
