# REST bundle: `data/index-volumes`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/data/index-volumes`

Get information about the volume (logical drives) in use by the Splunk deployment.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/index-volumes` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| max_size | string |  |
| name | string | Volume name |
| total_size | string | Total name volume capacity (MB). If max_size is`infinite`, this field is not listed. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/index-volumes?output_mode=json'
```

---

# `/services/data/index-volumes/{name}`

Get information about the`{name}` volume (logical drive).

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/index-volumes/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| max_size | string |  |
| name | string | Volume name. |
| total_size | string | Total name volume capacity (MB). If max_size is`infinite`, this field is not listed. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/index-volumes/YOUR_NAME?output_mode=json'
```

---

