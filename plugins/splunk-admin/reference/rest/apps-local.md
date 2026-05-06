# /services/apps/local

Create apps, list installed applications and their properties, update or delete a specific app, package an app, read setup UI metadata, or fetch ACL-only metadata for updates.

**Category:** Apps

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/apps/local`, `/services/apps/local/{name}`, `/services/apps/local/{name}/package`, `/services/apps/local/{name}/setup`, `/services/apps/local/{name}/update` |
| Auth required | Yes |
| Capability | Depends on `[misc] enable_install_apps` in `limits.conf`. If `enable_install_apps=true`, both `install_apps` and `edit_local_apps` are required. If `enable_install_apps=false` (default), `admin_all_objects` is required. You may change `enable_install_apps` to tighten security. |

---

## GET /services/apps/local

List installed applications and their properties. Splunkbase can correlate installed apps with Splunkbase listings for update notifications.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Standard pagination and filtering | — | No | — | Splunk REST pagination and filtering parameters may be used (see Splunk REST API Reference, “Pagination and filtering parameters”). |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| author | String | Publisher metadata; for Splunkbase apps this is typically the Splunkbase account username. |
| check_for_updates | Boolean | When `true`, Splunk checks Splunkbase for app updates; when `false`, it does not. |
| configured | Boolean | When `true`, custom app setup completed; when `false`, setup is not marked complete. |
| core | Boolean | Present in responses for bundled/core apps (`1`/`0` in XML); indicates core Splunk app classification. |
| description | String | Short human-readable description of the app. |
| details | String | URL pointing to extended information about the app (for example a Splunkbase page). |
| disabled | Boolean | When `true`, the app is disabled; when `false`, it is enabled. |
| label | String | Display title shown in Splunk Web. |
| managed_by_deployment_client | Boolean | Indicates deployment client management flags as returned by the handler (`1`/`0` in samples). |
| name | String | Internal app directory name (present on create responses and individual entries). |
| show_in_nav | Boolean | Controls whether the app appears in Splunk Web navigation chrome when applicable. |
| state_change_requires_restart | Boolean | When `true`, changing certain app states requires a restart; when `false`, a restart might still be needed from other factors. |
| version | String | App version string from app metadata. |
| visible | Boolean | When `true`, the app is visible and navigable in Splunk Web; when `false`, it is hidden from normal navigation. |
| eai:acl | Object | ACL envelope (`app`, `can_change_perms`, `can_list`, `can_share_app`, `can_share_global`, `can_share_user`, `can_write`, `modifiable`, `owner`, `perms`, `removable`, `sharing`). |

Feed-level Atom/OpenSearch fields (`title`, `id`, `updated`, `generator`, `opensearch:*`, `entry` links such as `_reload`, `edit`, `remove`, `disable`, `enable`, `package`) follow standard Splunk REST list feeds.

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/apps/local?output_mode=json"
```

---

## POST /services/apps/local

Create a new app or install from template or archive. The app folder name must not contain spaces or special characters.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| auth | String | No | — | Splunkbase authentication token for Splunkbase-hosted installs or updates; use with `session` alternatives when pulling from Splunkbase. |
| author | String | No | — | For Splunkbase apps use your Splunk account username; for internal apps include contact details. |
| configured | Boolean | No | `false` | Marks whether custom setup steps are already complete (`true`) or still pending (`false`). |
| description | String | No | — | Short description displayed under the launcher title in Splunk Web. |
| explicit_appname | String | No | — | Overrides the installed folder name when installing from a file (`filename=true`). |
| filename | Boolean | No | `false` | When `false`, `name` is the literal new app name created from a template. When `true`, `name` is a path or URL to a `.tar`, `.tgz`, or `.spl` package (or Splunkbase URL with `auth`/`session`). |
| label | String | No | — | Friendly title shown in Splunk Web (roughly five to eighty characters; documentation warns against prefixing with `"Splunk for"`). |
| name | String | Yes | — | Either the literal app name (template mode) or the archive path/URL (file install mode), depending on `filename`. |
| session | String | No | — | Splunkbase session token for installs/updates; alternative to `auth`. |
| template | Enum | No | `barebones` | Template slug (`barebones` minimal scaffold or `sample_app` sample dashboards/searches) or any custom template registered on the instance. |
| update | Boolean | No | `false` | When `true` with `filename=true`, update an existing app from the supplied archive instead of creating anew. |
| version | String | No | — | Version metadata recorded for the new app. |
| visible | Boolean | No | `false` | When `true`, the app is visible/navigable in Splunk Web; when `false`, it stays hidden from normal navigation. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| author | String | Same semantics as GET list entries; Splunkbase username vs internal contact string. |
| check_for_updates | Boolean | Indicates Splunkbase update checks are enabled (`true`) or disabled (`false`). |
| configured | Boolean | Custom setup completeness flag. |
| description | String | Short Splunk Web description. |
| disabled | Boolean | Enabled/disabled flag for the new app. |
| label | String | Launcher-visible title. |
| name | String | Final installed app id (may differ from requested `name` when overrides apply). |
| state_change_requires_restart | Boolean | Indicates restart coupling for future state changes. |
| version | String | Recorded version string. |
| visible | Boolean | Navigation visibility flag. |
| eai:acl | Object | ACL metadata assigned to the created app. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/apps/local -d name=restDemo -d output_mode=json
```

## DELETE /services/apps/local

Not supported at the collection path.

---

## GET /services/apps/local/{name}

Retrieve metadata for a single installed app. Optionally reload dependent objects.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| refresh | Boolean | No | `false` | When `true`, reload objects associated with the app; when `false`, skip that reload. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| author | String | Splunkbase username or internal maintainer string. |
| check_for_updates | Boolean | Splunkbase update polling flag. |
| configured | Boolean | Whether first-run/custom setup completed. |
| description | String | Splunk Web subtitle/description text. |
| details | String | Optional URL describing the app. |
| disabled | Boolean | Enabled vs disabled flag. |
| label | String | Splunk Web display title (five–80 chars; avoid `"Splunk For"` prefix per docs). |
| state_change_requires_restart | Boolean | Indicates restart sensitivity on future edits. |
| version | String | Semantic/version string from metadata. |
| visible | Boolean | Splunk Web visibility/navigability flag. |
| eai:acl | Object | ACL metadata for the app namespace entry. |
| eai:attributes | Object | Lists optional/required/wildcard fields Splunk exposes for edits (`optionalFields`, `requiredFields`, `wildcardFields`). |

Standard Atom links (`_reload`, `edit`, `remove`, `disable`, `enable`, `package`) appear when permitted.

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/apps/local/dashboard_examples?output_mode=json"
```

---

## POST /services/apps/local/{name}

Update mutable metadata on `{name}`. To enable or disable the entire app, POST against `/services/apps/local/{name}/enable` or `/services/apps/local/{name}/disable` (see Splunk REST User Manual “Enable and disable endpoint”).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| author | String | No | — | Updated publisher/contact information. |
| check_for_updates | Boolean | No | — | Toggle Splunkbase polling (`true` checks, `false` skips). |
| configured | Boolean | No | — | Update whether setup completed (`true`/`false`). |
| description | String | No | — | Revised Splunk Web description. |
| label | String | No | — | Revised launcher title (follow documented length/prefix guidance). |
| version | String | No | — | New version string stored with the app. |
| visible | Boolean | No | — | Updated Splunk Web visibility flag (`true` visible, `false` hidden). |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| author | String | Confirmed author metadata after update. |
| check_for_updates | Boolean | Confirmed Splunkbase polling preference. |
| configured | Boolean | Confirmed setup-complete flag. |
| description | String | Confirmed description text. |
| disabled | Boolean | Reflects whether the app currently sits disabled. |
| label | String | Confirmed launcher label. |
| state_change_requires_restart | Boolean | Restart requirement hint after changes. |
| version | String | Confirmed version metadata. |
| visible | Boolean | Confirmed visibility flag. |
| eai:acl | Object | ACL metadata after mutation. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/apps/local/restDemo -d version=1.1 -d output_mode=json
```

---

## DELETE /services/apps/local/{name}

Remove the `{name}` application from the instance. After deletion, confirm removal with GET `/services/apps/local`. Manual filesystem cleanup may still be necessary per Splunk Admin Manual guidance.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | No query/body parameters documented. |

### Returned values

Responses use the standard feed envelope; informational messages (for example “Restart required by: …”) appear under `messages`. Attempting to delete a missing app yields `In handler 'localapps': Could not find object id=<app_name>.`

| Name | Type | Description |
|------|------|-------------|
| messages | Array | Splunk informational or error messages (restart guidance, handler errors). |
| opensearch:totalResults | Number | Collection counts within the feed wrapper (often `0` after delete). |

### Example

```
curl -k -u admin:pass --request DELETE "https://localhost:8089/services/apps/local/sample_app?output_mode=json"
```

---

## GET /services/apps/local/{name}/package

Archive `{name}` into a `.spl` under `$SPLUNK_HOME/etc/system/static/app-packages` and return download metadata. **Deprecated** according to Splunk documentation.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | No parameters documented. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | String | App id / folder name that was packaged. |
| path | String | Server-local filesystem path of the generated archive. |
| url | String | HTTPS URL (including host/port) where the packaged `.spl` can be downloaded (`/static/app-packages/{name}.spl`). |
| eai:acl | Object | ACL metadata included with the packaging feed entry. |

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/apps/local/restDemo/package?output_mode=json"
```

## POST /services/apps/local/{name}/package

Not documented.

## DELETE /services/apps/local/{name}/package

Not documented.

---

## GET /services/apps/local/{name}/setup

Return setup wizard metadata for apps that ship `setup.xml` under `$SPLUNK_HOME/etc/apps/{name}/default`. Apps without setup flows may return sparse dictionaries.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | No parameters documented. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| eai:setup | String (CDATA) | Embedded XML describing blocks, inputs, labels, and endpoints for the interactive setup experience. |
| Dynamic REST preference keys | String / Number / Boolean | Keys mirror REST paths for underlying entities (for example `/admin/script/.%2Fbin%2Fcpu.sh/enabled`, `/admin/script/.%2Fbin%2Fcpu.sh/interval`) populated from existing configuration. Splunk’s documentation labels additional columns as “TBD,” implying extensible child keys per app. |
| eai:acl | Object | ACL metadata associated with the setup resource entry. |
| eai:attributes | Object | Attribute metadata describing editable setup parameters when present. |

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/apps/local/unix/setup?output_mode=json"
```

## POST /services/apps/local/{name}/setup

Not documented in this reference section (apps may expose separate setup POST endpoints via linked `rel="edit"` targets).

## DELETE /services/apps/local/{name}/setup

Not documented.

---

## GET /services/apps/local/{name}/update

Return ACL-only metadata (`eai:acl`) for `{name}` as exposed through the update handler.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | No parameters documented. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| eai:acl | Object | ACL dictionary (`app`, `can_list`, `can_write`, `owner`, `perms`, `modifiable`, `removable`, `sharing`, etc.) describing permissions on the app object. |

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/apps/local/gettingstarted/update?output_mode=json"
```

## POST /services/apps/local/{name}/update

Not documented.

## DELETE /services/apps/local/{name}/update

Not documented.
