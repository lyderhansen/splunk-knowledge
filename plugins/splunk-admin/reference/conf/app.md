# app.conf

This file maintains the state of a given app in the Splunk platform. It can also be used to customize certain aspects of an app. An app.conf file can exist within each app on the Splunk platform. You must restart the Splunk platform to reload manual changes to app.conf. To learn more about configuration files (including precedence) please see the documentation located at http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | N/A (app metadata) |
| Restart required | Yes |
| Related files | default.meta |

## Stanzas and settings

### `[author=]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `email` | `<email-address>` | — | See Splunk documentation. |
| `company` | `<company-name>` | — | See Splunk documentation. |

### `[id]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `group` | `<group-name>` | — | See Splunk documentation. |
| `name` | `<app-name>` | — | See Splunk documentation. |
| `version` | `<version-number>` | — | See Splunk documentation. |

### `[launcher]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `remote_tab` | `<boolean>` | true | Determines whether the Launcher interface connects to apps.splunk.com This setting only applies to the Launcher app. Do not set it in any |
| `version` | `<string>` | — | Version numbers are a number followed by a sequence of dots and numbers. The best practice for version numbers for releases is to use three digits Pre-release versions can append a single-word suffix like "beta" or "preview" Version must not contain any spaces. |
| `description` | `<string>` | — | A short explanatory string that appears below the title of the app in Limit descriptions to 200 characters or less for user readability. |
| `author` | `<string>` | — | For apps that you intend to upload to Splunkbase, list the username of your For apps that are for internal use only, include your full name and/or contact |

### `[package]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `id` | `<string>` | — | Omit this setting for apps that are for internal use only and not intended id is required for all new apps that you upload to Splunkbase. Future versions of id must be the same as the folder name in which your app lives in id must adhere to these cross-platform folder name restrictions: must contain only letters,... |
| `check_for_updates` | `<boolean>` | true | Determines whether Splunk Enterprise checks Splunkbase for updates to this |
| `show_upgrade_notification` | `<boolean>` | false | Determines whether Splunk Enterprise shows an upgrade notification in Splunk |

### `[install]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `state` | `disabled | enabled` | enabled | Determines whether an app is disabled or enabled on the Splunk platform. If an app is disabled, its configurations are ignored. |
| `state_change_requires_restart` | `<boolean>` | false | Determines whether changing an app's state ALWAYS requires a restart of Splunk State changes include enabling or disabling an app. When set to true, changing an app's state always requires a restart. |
| `is_configured` | `<boolean>` | false | Stores an indication of whether the application's custom setup has been |
| `build` | `<integer>` | — | Required. Must be a positive integer. |
| `allows_disable` | `<boolean>` | true | Determines whether an app allows itself to be disabled. |
| `install_source_checksum` | `<string>` | — | Records a checksum of the tarball from which a given app was installed. Splunk Enterprise automatically populates this value upon install. |
| `install_source_local_checksum` | `<string>` | — | Records a checksum of the tarball from which a given app's local configuration Splunk Enterprise automatically populates this value upon install. Do not set this value explicitly within your app! |
| `python.version` | `{default|python|python2|python3|python3.7|python3.9|latest}` | Not set; uses the system-wide Python version. | DEPRECATED. Use 'python.required' instead to specify which Python versions the When 'installit.py' exists, selects which Python version to use. |
| `python.required` | `<comma-separated list>` | Not set; uses 'python.version' if that setting has a value. | When 'installit.py' exists, the versions of Python that the script supports. This setting takes precedence over the 'python.version' setting if both The Splunk platform selects the highest version of Python that is The following values are supported: "3.9": The script supports Python version 3.9. |

### `[triggers]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `reload.<conf_file_name>` | `[ simple | never | rest_endpoints | access_endpoints <handler_url> | http_get...` | — | Splunk Enterprise reloads app configuration after every app-state change: If your app does not use a custom config file (e.g.myconffile.conf) If your app uses a custom config file (e.g. myconffile.conf) and you want to If you do not include [triggers] settings and your app uses a custom config If set to "simple",... |
| `reload.<conf_file_name>.<conf_stanza_prefix>` | `[ simple | never | access_endpoints <handler_url> | http_get <handler_url> | ...` | — | Stanza-level reload triggers for indexer-cluster peers to reload only the With the stanza level reload triggers, we can have more granular control over Stanza level reload trigger values operate identically to conf-level reload For any stanza of <conf_file_name> that does NOT have a corresponding stanza-level |

### `[shclustering]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `deployer_lookups_push_mode` | `preserve_lookups | always_preserve | always_overwrite | overwrite_on_change` | always_preserve | Determines the deployer_lookups_push_mode for the 'splunk apply If set to "preserve_lookups", the 'splunk apply shcluster-bundle' command If set to "always_preserve", the 'splunk apply shcluster-bundle' command ignores If set to "always_overwrite", the 'splunk apply shcluster-bundle' command If set to... |
| `deployer_push_mode` | `full | merge_to_default | local_only | default_only` | — | How the deployer pushes the configuration bundle to search head cluster If set to "full": Bundles all of the app's contents located in default/, If set to "merge_to_default": Merges the local and default folders into If set to "local_only": This option bundles the app's local directory (and its If set to... |

### `[ui]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `is_visible` | `<boolean>` | — | Indicates if this app is visible/navigable as an app in Splunk Web. Apps require at least one view to be available in Splunk Web. |
| `show_in_nav` | `<boolean>` | — | Determines whether this app appears in the global app dropdown. |
| `is_manageable` | `<boolean>` | — | Support for this setting has been removed. It no longer has any effect. |
| `label` | `<string>` | — | Defines the name of the app shown in Splunk Web and Launcher. Recommended length between 5 and 80 characters. |
| `docs_section_override` | `<string>` | — | Defines override for auto-generated app-specific documentation links. If not specified, app-specific documentation link includes If specified, app-specific documentation link includes This setting only applies to apps with documentation on the Splunk |
| `attribution_link` | `<string>` | — | URL that users can visit to find third-party software credits and attributions External links must start with http:// or https://. Values that do not start with http:// or https:// get interpreted as Quickdraw |
| `setup_view` | `<string>` | — | Optional. Defines custom setup view found within the /data/ui/views REST endpoint. |
| `supported_themes` | `<comma-separated list>` | (none) | A comma-separated list of themes supported by the app. Supported values are "dark" and "light". |

### `[credentials_settings]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `verify_script` | `<string>` | — | Optional setting. Command line to invoke to verify credentials used for this app. |
| `python.version` | `{default|python|python2|python3|python3.7|python3.9|latest}` | Not set; uses the system-wide Python version. | DEPRECATED. Use 'python.required' instead to specify which Python versions the For Python scripts only, selects which Python version to use. |
| `python.required` | `<comma-separated list>` | Not set; uses 'python.version' if that setting has a value. | For Python scripts only, the versions of Python that the script supports. The Splunk platform uses this setting only when the 'verify_script' This setting takes precedence over the 'python.version' setting if both The Splunk platform selects the highest version of Python that is The following values are supported:... |

### `[credential::]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `password` | `<string>` | — | Password that corresponds to the given username for the given realm. Realm is optional. |

### `[diag]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `extension_script` | `<filename>` | not set (no app-specific data collection will occur). | Setting this variable declares that this app puts additional information Must be a python script. Must be a simple filename, with no directory separators. |
| `data_limit` | `<positive integer>[b|kb|MB|GB]` | 100MB | Defines a soft ceiling for the amount of uncompressed data that can be Large diags damage the main functionality of the tool by creating data blobs Use this setting to ensure that your extension script does not accidentally After data produced by this app extension reaches the limit, diag does not add After diag... |
| `default_gather_lookups` | `<filename> [, <filename> ...]` | not set | Set this variable to declare that the app contains lookups that diag must Essentially, if there are lookups which are useful for troubleshooting an Any files in lookup directories that are not listed here are not gathered by This setting is new in Splunk Enterprise/Light version 6.5. Older versions This does not... |

### `[data_management]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `plugin_enabled` | `<boolean>` | false | Set this variable to true to declare that the app contains a Data Management plugin |
