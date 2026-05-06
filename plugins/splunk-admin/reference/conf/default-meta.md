# default.meta

Metadata files (`default.meta` in each app’s `metadata/` folder, plus optional `local.meta`) declare ownership, role-based access, and export visibility for Splunk knowledge objects (views, saved searches, lookups, and so on). Splunk evaluates access cumulatively across the containing app, the object category, and the specific object stanza.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<app>/metadata/default.meta` (and `local/` overrides) |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | `local.meta`, `.conf` files defining exported objects, `authorize.conf` |

## Stanzas and settings

### `[]` (application-wide defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `access` | `<ACL>` | `read : [ * ], write : [ admin, power ]` | Default permissions applied to the app unless overridden; controls who may read objects in the app and who may publish new shared objects into it. |
| `export` | `none \| system \| ...` | — | When set to `system`, makes the app’s exported objects visible outside the app context according to Splunk’s export rules; omit or set `none` to keep objects app-private where applicable. |

### `[<category>]` (category-wide defaults)

Examples: `[views]`, `[savedsearches]`, `[macros]`, `[transforms]`, `[nav]`, `[lookup_tables]` — exact categories match Splunk object types.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `access` | `<ACL>` | — | Role-based read/write policy for all objects of this category within the app unless a more specific stanza overrides it. |

### `[<category>/<object_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `access` | `<ACL>` | — | Fine-grained ACL for a single named object (for example `[views/my_dashboard]`). |
| `export` | `none \| system \| ...` | — | Overrides export behavior for this object so other apps can or cannot reuse it, depending on value and surrounding ACLs. |
| `owner` | `<username>` | — | Declares the Splunk user that owns the object for ACL inheritance and UI ownership display. |
