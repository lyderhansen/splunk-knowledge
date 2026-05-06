# /services/apps/apptemplates

List installed app templates and retrieve a template descriptor by name; templates are used as the `template` argument when creating apps via POST to `/services/apps/local`.

**Category:** Apps

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/apps/apptemplates` and `/services/apps/apptemplates/{name}` |
| Auth required | Yes |
| Capability | Not enumerated; requires credentials that can read app template metadata (typically administrative roles). |

---

## GET /services/apps/apptemplates

List installed app templates. Each feed entry corresponds to one template (for example `barebones` and `sample_app` ship by default).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Standard pagination and filtering | — | No | — | Splunk REST pagination and filtering parameters may be used with this method (see Splunk REST API Reference, “Pagination and filtering parameters”). |

### Returned values

The Splunk documentation table lists no dedicated response keys beyond standard Atom feed structure. Each `<entry>` references one template and commonly includes:

| Name | Type | Description |
|------|------|-------------|
| title | String | Template identifier (template name). |
| id | String | Canonical REST URL for the template entry. |
| updated | String | Feed timestamp for the entry. |
| author | Object | Feed author metadata (`name`, etc.). |
| link | Array / Object | Alternate and list links for the template resource. |
| eai:acl | Object | ACL metadata (`app`, `can_list`, `can_write`, `owner`, `perms`, `modifiable`, `removable`, `sharing`). |
| content child keys | Various | Additional keys under `content` may appear depending on server response (documentation shows placeholder keys in samples). |

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/apps/apptemplates?output_mode=json"
```

## POST

Not documented for this collection endpoint.

## DELETE

Not documented for this collection endpoint.

---

## GET /services/apps/apptemplates/{name}

Return the `{name}` app template descriptor.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Standard pagination and filtering | — | No | — | Splunk REST pagination and filtering parameters may be used with this method (see Splunk REST API Reference, “Pagination and filtering parameters”). |

### Returned values

The Splunk documentation table lists no dedicated keys beyond the feed entry. Typical fields mirror the collection entry plus descriptor metadata:

| Name | Type | Description |
|------|------|-------------|
| title | String | Template name (`{name}`). |
| id | String | REST URL for this template. |
| updated | String | Entry update timestamp. |
| author | Object | Entry author metadata. |
| link | Array / Object | Resource links (`alternate`, `list`, etc.). |
| eai:acl | Object | ACL metadata for the template object. |
| eai:attributes | Object | EAI attribute metadata with `optionalFields`, `requiredFields`, and `wildcardFields` lists describing editable fields. |

### Example

```
curl -k -u admin:pass "https://localhost:8089/services/apps/apptemplates/sample_app?output_mode=json"
```

## POST

Not documented for `/services/apps/apptemplates/{name}`.

## DELETE

Not documented for `/services/apps/apptemplates/{name}`.
