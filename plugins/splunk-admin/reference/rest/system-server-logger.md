# REST bundle: `server/logger`

**Category:** System

Grouped Splunk REST Reference endpoints.

---

# `/services/server/logger`

Access`splunkd` logging categories specified in code or in`$SPLUNK_HOME/etc/log.cfg`.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/logger` |
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
| level | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/logger?output_mode=json'
```

---

# `/services/server/logger/{name}`

Manage the`{name}` logging category.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/logger/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| level | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/logger/YOUR_NAME?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  Required. The desired logging level for this category. One of the following valid values. [FATAL \| WARN \| INFO \| DEBUG] \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| level \| Enum \| |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/logger/YOUR_NAME?output_mode=json'
```

---

