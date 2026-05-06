# /services/properties

Manage `.conf` configuration indirectly via the **properties** REST interface: list configuration files, list stanzas, list keys within a stanza, read/write individual keys, and create empty files/stanzas. Paths under `/servicesNS/{owner}/{app}` scope visibility to an app/user namespace.

**Category:** Configuration

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/properties`, `/services/properties/{file}`, `/services/properties/{file}/{stanza}`, `/services/properties/{file}/{stanza}/{key}` |
| Auth required | Yes |
| Capability | **`admin_all_objects`** is required for **POST /services/properties** (create configuration file). Other operations are subject to normal REST authorization for configuration reads/writes. |

---

## GET /services/properties

List **all configuration files** (basename without `.conf`) visible at the requested endpoint scope (system and apps).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | **None** documented for this operation. |

### Returned values

Atom feed listing available configuration files:

| Name | Type | Description |
|------|------|-------------|
| `title` | String | Feed title (`properties`). |
| `id` | URI | Feed id URI for `/services/properties`. |
| `updated` | Timestamp | Feed updated timestamp. |
| `generator` | Element | Splunk generator metadata. |
| `author` | Element | Feed author metadata. |
| `entry` | Element (repeatable) | One entry per configuration file. |

**Per `entry`:**

| Name | Type | Description |
|------|------|-------------|
| `title` | String | Configuration file basename (for example `alert_actions`, `props`, `web`). |
| `id` | URI | REST URI for `/services/properties/{file}`. |
| `updated` | Timestamp | Entry updated timestamp. |
| `link` | Element | Typically `rel="alternate"` href pointing at the `{file}` endpoint. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/properties?output_mode=json
```

---

## POST /services/properties

Create a **new empty configuration file** at the namespace implied by the URL.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `__conf` | String | Yes | — | **Required.** Base name of the configuration file to create (note the **double-underscore** prefix). Namespace decides whether this lands under system/local versus `etc/apps/<app>/local`. |

### Returned values

Per Splunk REST Reference: **no response body**. Success is indicated by **`HTTP 201 Created`**.

### Example

```
curl -k -u admin:pass https://localhost:8089/services/properties -d __conf=myAppConfigFile
```

---

## GET /services/properties/{file}

List **stanzas** present in `{file}` for all configuration layers visible in the namespace.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | **None** documented for this operation. |

### Returned values

Atom feed of stanzas:

| Name | Type | Description |
|------|------|-------------|
| `title` | String | `{file}` title for the feed. |
| `id` | URI | Feed id for `/services/properties/{file}` in the current namespace. |
| `updated` | Timestamp | Feed updated timestamp. |
| `generator` | Element | Splunk generator metadata. |
| `author` | Element | Feed author metadata. |
| `entry` | Element (repeatable) | One entry per stanza name. |

**Per `entry`:**

| Name | Type | Description |
|------|------|-------------|
| `title` | String | Stanza name. |
| `id` | URI | REST URI for `/services/properties/{file}/{stanza}`. |
| `updated` | Timestamp | Entry updated timestamp. |
| `link` | Element | Typically `rel="alternate"` href pointing at the stanza endpoint. |

Splunk documentation notes this endpoint returns entries **for each stanza** and may include additional feed-level metadata consistent with standard Atom listings.

### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/search/properties/eventtypes?output_mode=json
```

---

## POST /services/properties/{file}

Add a **new stanza** to `{file}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `__stanza` | String | Yes | — | **Required.** Stanza name to add (note the **double-underscore** prefix). |

### Returned values

Per Splunk REST Reference: **no response body**. Success is indicated by **`HTTP 201 Created`**.

### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/search/properties/eventtypes -d __stanza=proxylogs
```

---

## GET /services/properties/{file}/{stanza}

List **every key** in `{stanza}` as separate Atom entries (each entry represents one setting).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | **None** documented for this operation. |

### Returned values

Atom feed where **each `entry` corresponds to one `{stanza}` key**:

| Name | Type | Description |
|------|------|-------------|
| `title` | String | Setting key name (for example `TRUNCATE`, `CHARSET`, `ANNOTATE_PUNCT`). |
| `id` | URI | REST URI for `/services/properties/{file}/{stanza}/{key}`. |
| `updated` | Timestamp | Entry updated timestamp. |
| `link` | Element | Typically `rel="alternate"` href pointing at the `{key}` endpoint. |
| `content` | Element | Text payload (`content type="text"`) containing the **current plaintext value** for that setting (may be empty when unset). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/properties/props/proxylogs?output_mode=json
```

---

## POST /services/properties/{file}/{stanza}

Add or update **one or more key/value pairs** within `{stanza}`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(POST fields)* | String | Yes | — | **Required:** one or more **`.conf` keys** as form fields with string values (for example `NO_BINARY_CHECK=true` and `CHARSET=UTF-8` in the documented example). |

### Returned values

XML response summarizing operation outcome:

| Name | Type | Description |
|------|------|-------------|
| `response` | Element | Root element. |
| `messages` | Element | Container for Splunk messages. |
| `msg` | Element | Message row; includes attributes such as `type` (for example `INFO`). Text content describes success/failure (example: number of keys modified). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/properties/props/proxylogs -d NO_BINARY_CHECK=true -d CHARSET=UTF-8
```

---

## GET /services/properties/{file}/{stanza}/{key}

Retrieve the **plaintext value** for a single configuration key.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | **None** documented for this operation. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(response body)* | Plain text | The raw setting value (example documented response: `True`). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/properties/props/proxylogs/SHOULD_LINEMERGE
```

---

## POST /services/properties/{file}/{stanza}/{key}

Update the **plaintext value** for a single configuration key.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | String | Yes | — | **Required.** New plaintext value for `{key}` (per Splunk documented example using `-d value=false`). |

### Returned values

XML response summarizing operation outcome:

| Name | Type | Description |
|------|------|-------------|
| `response` | Element | Root element. |
| `messages` | Element | Container for Splunk messages. |
| `msg` | Element | Message row; includes attributes such as `type` (example `INFO`). Text content describes success/failure (example: keys modified count). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/properties/props/proxylogs/SHOULD_LINEMERGE -d value=false
```
