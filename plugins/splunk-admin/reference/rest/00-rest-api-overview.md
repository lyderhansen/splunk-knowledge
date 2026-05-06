# Splunk REST API — general usage

This overview summarizes cross-cutting concepts for the Splunk platform REST API on **splunkd**’s management interface (default port **8089**, **HTTPS**). Endpoint-specific URLs, parameters, and capabilities are documented in the per-topic files under this directory.

**Official references**

- [Using the REST API reference](https://help.splunk.com/en/?resourceId=Splunk_RESTREF_RESTprolog) (REST API Reference — prologue)
- [Basic concepts about the Splunk platform REST API](https://docs.splunk.com/Documentation/Splunk/latest/RESTUM/RESTusing) (REST API User Manual)
- [Access requirements and limitations for the Splunk Cloud Platform REST API](https://help.splunk.com/?resourceId=Splunk_RESTTUT_RESTandCloud)
- [REST API Tutorials](https://help.splunk.com/?resourceId=Splunk_RESTTUT_RESTconfigurations)

---

## Base URLs and namespaces

- **Global context:** `https://<host>:8089/services/...`
- **App / user namespace:** `https://<host>:8089/servicesNS/{owner}/{app}/...` — scopes resources to an owner and application context (ownership, ACLs, and knowledge-object visibility depend on this path).

Always use **HTTPS** in production. Plain HTTP may only appear when `enableSplunkdSSL` is disabled (not recommended).

### Unsupported URI pattern

Splunk **does not support or document** REST paths containing **`/admin/`**. Use the documented public endpoints instead.

---

## Supported HTTP operations

Splunk REST handlers map to standard HTTP verbs (availability varies by endpoint):

| Verb | Typical use |
|------|-------------|
| **GET** | Read a resource or list members of a collection. |
| **POST** | Create entities, apply updates, enable/disable features. Body is usually **`application/x-www-form-urlencoded`**. |
| **DELETE** | Remove an entity where supported — Splunk often returns **HTTP 200** with a message payload rather than **204 No Content**. |

Some endpoints document capability requirements per operation; missing capability yields **403**.

---

## Authentication methods

### HTTP Basic authentication

Send credentials per RFC 1945 using `Authorization: Basic ...`, or use tools such as `curl -u user:password`.

```bash
curl -k -u admin:changeme "https://localhost:8089/services/server/info?output_mode=json"
```

### Session token (session key)

1. **POST** credentials to `/services/auth/login` (body: `username`, `password`; optional MFA fields as documented).
2. Read **`sessionKey`** from the response.
3. Send subsequent requests with:

```http
Authorization: Splunk <sessionKey>
```

(Session keys are distinct from **Bearer** tokens: the scheme keyword is **`Splunk`**, not `Bearer`.)

Cookie-based sessions are optional (`cookie=1` on login); most programmatic clients use the header form.

### Bearer tokens (Splunk 7.3+)

Splunk **authentication tokens** (configured under **Settings → Tokens** / `authorize.conf`) allow access without exchanging username/password on each session. Use:

```http
Authorization: Bearer <token>
```

Tokens must be valid, unexpired, and token auth must be enabled on the instance.

### Authorization model

Access to each endpoint is governed by **capabilities** granted through **roles**, not by role names alone. Missing capability yields **403 Forbidden**. Native Splunk auth, LDAP, SAML, and token configurations ultimately resolve to the same capability checks.

---

## Common request parameters (collections and many GET handlers)

Many **GET** operations on collections accept pagination, sorting, and filtering parameters in addition to endpoint-specific arguments.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **`count`** | Number | `30` | Maximum entries to return. Use **`0`** to request all available entries (be careful on large collections). |
| **`offset`** | Number | `0` | Zero-based index of the first item to return (pairs with `count`). |
| **`output_mode`** | String | *(implicit XML)* | Response encoding — see **Response formats**. For automation, prefer **`json`**. |
| **`f`** | String (repeatable) | — | Return only named fields; may use wildcards (e.g. `f=s*`). Specify multiple times for multiple fields. |
| **`search`** | String | — | Filter entries: substring match on fields, or restrict with `field_name%3Dfield_value` (URI-encoded `=`). |
| **`sort_key`** | String | `name` | Field used for ordering. |
| **`sort_dir`** | Enum | `asc` | `asc` or `desc`. |
| **`sort_mode`** | Enum | `auto` | Collation: `auto`, `alpha`, `alpha_case`, `num`. |
| **`summarize`** | Bool | `false` | `true` returns a faster summarized listing for some endpoints (may omit detail). |

Atom feed metadata mirrors pagination: **`opensearch:totalResults`**, **`opensearch:itemsPerPage`** (reflects `count`), **`opensearch:startIndex`** (reflects `offset`).

---

## `output_mode` and response formats

If **`output_mode`** is omitted, responses default to **XML** in the Atom-derived envelope used across most endpoints.

| `output_mode` | Typical use |
|---------------|-------------|
| **`xml`** | Default; Atom-style `<feed>` / `<entry>` structure. |
| **`json`** | Preferred for scripts and applications (nested JSON mirrors XML semantics). |
| **`csv`** | Tabular / flat exports where supported (often used with search **results** endpoints). |

**Best practice:** Always pass **`output_mode=json`** (or `csv` when exporting tabular results) in programmatic clients so behavior does not change if defaults shift.

---

## POST bodies and `Content-Type`

Most **POST** operations expect **`application/x-www-form-urlencoded`** bodies (`key=value` pairs), matching Splunk Web and `curl -d` usage.

- Omitting an appropriate **Content-Type** or sending an unexpected body type commonly yields **400 Bad Request**.
- Use **`--data-urlencode`** for values containing `=`, `&`, `%`, spaces, or SPL that might otherwise break parsing.

---

## Access Control Lists (ACLs)

REST resources enforce ownership and sharing via **`eai:acl`** metadata on entries:

| Concept | Meaning |
|---------|---------|
| **`owner`** | Owning user, `nobody`, or `system`. |
| **`app`** | App context (`system` or app id). |
| **`sharing`** | `user` (private), `app`, or `global`. |
| **`perms.read` / `perms.write`** | Role lists granted read/write. |
| **`can_write`**, **`modifiable`**, **`removable`** | Whether the current user may edit, change ACL, or delete. |
| **`can_share_*`** | Whether sharing level may be changed. |

Append **`/_acl`** to an entity URL to read or update ACL-related properties where supported.

Some endpoints (e.g. parts of **`/server/logger`**) are **not** ACL-controlled (`modifiable` may be false).

### `eai:attributes`

Responses often include **`eai:attributes`** describing **`requiredFields`**, **`optionalFields`**, and **`wildcardFields`** for configuration entities.

---

## Splunk Cloud Platform vs Splunk Enterprise

- **Splunk Cloud** exposes a **subset** of Enterprise REST endpoints. Deployment-server, many raw **inputs**, file-system monitoring paths, and other infra-level APIs may be **disabled**, **restricted**, or routed through Cloud tooling instead of customer-facing REST.
- Always verify an endpoint against **[Access requirements and limitations for the Splunk Cloud Platform REST API](https://help.splunk.com/?resourceId=Splunk_RESTTUT_RESTandCloud)** and your stack’s experience (`403`, **503**, or missing routes).
- Use your deployment’s **correct hostname** and management port or proxy path as provided by Splunk Cloud (not necessarily `localhost:8089`).

---

## HTTP status codes (common Splunk semantics)

Standard HTTP codes apply. Common cases:

| Code | Meaning |
|------|---------|
| **200** | Success (including many successful **DELETE** operations — Splunk often returns **200** with a body, not **204 No Content**). |
| **201** | Create succeeded. |
| **400** | Bad request (malformed parameters, missing required argument, wrong Content-Type). |
| **401** | Authentication failed. |
| **402** | Feature disabled by licensing. |
| **403** | Authenticated but insufficient capability / ACL. |
| **404** | Unknown endpoint or entity. |
| **409** | Conflict / invalid operation for resource state. |
| **500** | Internal error — inspect `<msg type="ERROR">` or JSON `messages`. |
| **503** | Service unavailable — endpoint disabled in configuration, overload, or maintenance. |

Endpoint docs call out codes that have **Splunk-specific** meaning beyond HTTP defaults.

---

## Error messages

Failures often return an Atom-like **`messages`** block:

```xml
<response>
  <messages>
    <msg type="ERROR">In handler 'example': The following required arguments are missing: sid.</msg>
  </messages>
</response>
```

In **`output_mode=json`**, inspect the **`messages`** array with analogous **`type`** and **`text`** fields.

---

## Rate limiting and operational best practices

- Splunk does **not** publish one global REST “QPS” limit for all endpoints; effective limits depend on **role**, **search concurrency**, **workload management**, and platform (**Cloud** may enforce stricter gateway policies).
- **Avoid** opening many parallel **`search/jobs`** without controlling concurrency — searches compete for the same scheduler and indexer resources.
- Prefer **`count` + `offset`** or **`count=0`** deliberately on **small** configuration collections rather than repeatedly scraping huge lists.
- On **503** or transient failures, use **exponential backoff** and reduce parallelism.
- **Rotate credentials and tokens**; respect **`sessionTimeout`** (`server.conf`) for interactive sessions.

---

## Pagination patterns

1. **Page through collections:** fixed **`count`** (e.g. 100), increment **`offset`** by **`count`** until fewer than **`count`** rows return or **`totalResults`** is reached.
2. **Retrieve all (small sets):** **`count=0`** returns all entries on endpoints that support it — **avoid on jobs lists or large indexes**.
3. **Search jobs:** listing **`/services/search/jobs`** paginates like other collections; **job results** use **`count`**, **`offset`**, and often **`output_mode`** on the **`.../results`** or export URLs documented under **search** references.

---

## Async search jobs (`/services/search/jobs`)

- **POST** creates a job and returns a **search ID (SID)** unless **`exec_mode=oneshot`** is used for small synchronous runs.
- Poll **`/services/search/jobs/{sid}`** until **`isDone`** is true (and check **`isFailed`** / **`messages`**).
- Fetch results via the documented **`results`**, **`events`**, **`summary`**, or export endpoints with appropriate **`output_mode`**.

---

## EAI response shape

Configuration endpoints return **`entry`** elements containing **`content`** — the actual key/value payload — alongside **`eai:acl`** and links (`rel="edit"`, `rel="remove"`, etc.). JSON output preserves the same logical nesting.

---

## TLS verification

- **Development:** `curl -k` skips TLS verification (convenient, insecure).
- **Production:** supply a proper CA bundle (`curl --cacert …`) or system trust store; pin hostname to your Splunk deployment.

---

## URI encoding

Path segments such as monitor paths (`/var/log`) and SPL-heavy parameters **must** be URI-encoded (`%2F`, `%3D`, …) or passed with `curl` quoting/`--data-urlencode` as described in the REST User Manual.
