# /services/configs/conf-{file}

Access `.conf` configuration files by REST using the `conf-` prefix convention (for example `conf-props` for `props.conf`, `conf-inputs` for `inputs.conf`, `conf-outputs` for `outputs.conf`). Namespace (`/services` vs `/servicesNS/{owner}/{app}`) selects which layered copy of the file is read or updated.

**Category:** Configuration

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/configs/conf-{file}` and `/services/configs/conf-{file}/{stanza}` |
| Auth required | Yes |
| Capability | Read/write effective permissions follow stanza ACLs and role capabilities; **POST** on `/services/configs/conf-{file}` to add a stanza requires **`admin_all_objects`** (per Splunk REST Reference). |

---

## GET /services/configs/conf-{file}

List every stanza in the `{file}` configuration file that is visible in the request namespace (merged view across default/local precedence).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination and filtering)* | various | No | — | Splunk REST **pagination and filtering** parameters apply to this endpoint (for example `count`, `offset`, search/filter expressions). See [Using the REST API Reference — Pagination and filtering parameters](https://docs.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference). |
| `output_mode` | String | No | `xml` | Response format; use `json` for JSON output. |

### Returned values

Responses use the Atom syndication format (unless `output_mode=json`). **Feed-level** elements:

| Name | Type | Description |
|------|------|-------------|
| `title` | String | Human-readable collection title (typically the conf binding name, e.g. `conf-props`). |
| `id` | URI | Canonical URI for this configuration collection. |
| `updated` | Timestamp | Last updated time for the feed metadata. |
| `generator` | Element | Splunk build/version metadata for the REST generator. |
| `author` | Element | Feed author metadata (commonly `Splunk`). |
| `link` | Element (repeatable) | Relation links for this collection; typical `rel` values include `create` pointing at `.../conf-{file}/_new`, `_reload` pointing at `.../conf-{file}/_reload`, and OpenSearch pagination links when applicable. |
| `opensearch:totalResults` | Number | Total matching entries when OpenSearch metadata is present. |
| `opensearch:itemsPerPage` | Number | Page size when OpenSearch metadata is present. |
| `opensearch:startIndex` | Number | Start index when OpenSearch metadata is present. |
| `s:messages` | Element | Splunk REST messages container (warnings/errors). |
| `entry` | Element (repeatable) | One Atom entry per stanza in the configuration file. |

**Per-entry (`entry`) elements:**

| Name | Type | Description |
|------|------|-------------|
| `title` | String | Stanza name (section header in the `.conf` file). |
| `id` | URI | Unique REST identifier for this stanza (URL-encoded stanza name in path). |
| `updated` | Timestamp | Last updated metadata for the entry. |
| `author` | Element | Entry author metadata (often the object owner). |
| `link` | Element (repeatable) | Typical `rel` values: `alternate`, `list`, `edit`, `remove`, `disable`, `move`, `_reload` for stanza-scoped operations. |
| `content` | Element | Payload describing stanza settings; for XML, `content` is often `type="text/xml"` with an `s:dict` of keys. |

**Inside `content/s:dict` (representative keys—actual keys depend on the stanza and conf file):**

| Name | Type | Description |
|------|------|-------------|
| `eai:acl` | Object/dict | Splunk entity ACL metadata (`app`, `owner`, `perms`, sharing flags, modifiable/removable flags). |
| `eai:appName` | String | App context name associated with the stanza. |
| `eai:userName` | String | User context associated with the stanza. |
| `eai:attributes` | Object/dict | Optional metadata describing optional/required/wildcard fields for the stanza (structure varies by endpoint/stanza type). |
| `disabled` | String/boolean-like | Whether the stanza is disabled (`0`/`1` or similar string representation). |
| *(all other `s:key` names)* | String | Stanza options from the underlying `.conf` file (names mirror ALL_CAPS or lowercase keys such as `CHARSET`, `TRUNCATE`, `SHOULD_LINEMERGE`, vendor-specific keys, etc.). Values are strings as stored in configuration. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/configs/conf-props?output_mode=json
```

---

## POST /services/configs/conf-{file}

Create a **new stanza** in the `{file}` configuration file within the request namespace.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | String | Yes | — | **Required.** Name of the new stanza to add to `{file}`. |
| *(additional POST fields)* | String | No | — | **Arbitrary key/value pairs** representing settings to set on the stanza at creation time (field names match `.conf` keys). |

### Returned values

Per Splunk REST Reference for this endpoint, explicit **response keys** are not enumerated; the server returns the Atom feed response describing the created or resulting configuration state (same general structures as **GET**).

### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/search/configs/conf-props -d name=myblog
```

---

## GET /services/configs/conf-{file}/{stanza}

Retrieve a single stanza from `{file}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | **None** documented for this operation. |

### Returned values

Same **feed/entry/content** shapes as **GET** `/services/configs/conf-{file}`, but the feed contains the matching `{stanza}` entry (and related metadata). Inner `s:dict` keys reflect that stanza’s settings (including `eai:*` metadata when present).

### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/search/configs/conf-eventtypes/splunkd_message
```

---

## POST /services/configs/conf-{file}/{stanza}

Update an existing stanza or **add/update properties** on that stanza.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(POST fields)* | String | Yes | — | **Required:** one or more **key/value pairs** to apply to `{stanza}` (keys correspond to `.conf` settings). |

### Returned values

Per Splunk REST Reference for this endpoint, explicit **response keys** are not enumerated; response follows standard Atom entry/feed conventions for the updated stanza.

### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/search/configs/conf-props/myweblogs -d SHOULD_LINEMERGE=true
```

---

## DELETE /services/configs/conf-{file}/{stanza}

Delete `{stanza}` from `{file}` in the request namespace.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | **None** documented for this operation. |

### Returned values

Per Splunk REST Reference for this endpoint, explicit **response keys** are not enumerated; response is typically a feed confirming collection state after deletion.

### Example

```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/nobody/search/configs/conf-props/myweblogs
```
