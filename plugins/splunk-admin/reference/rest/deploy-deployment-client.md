# REST bundle: `deployment/client`

**Category:** Deployment

Grouped Splunk REST Reference endpoints.

---

# `/services/deployment/client`

List deployment client configuration and status.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/client` |
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
| disabled | string | `1`= Disabled |
| serverClasses | string | List of member server classes for app download authorization. |
| targetUri | string | Host and port number (`: `). |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/client?output_mode=json'
```

---

# `/services/deployment/client/config`

Get deployment client configuration and status.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/client/config` |
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
| disabled | string | `1`= Disabled |
| serverClasses | string | List of member server classes for app download authorization. |
| targetUri | string | Host and port number (`: `). |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/client/config?output_mode=json'
```

---

# `/services/deployment/client/config/listIsDisabled`

Get deployment client status.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/client/config/listIsDisabled` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | string | `1`= Disabled |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/client/config/listIsDisabled?output_mode=json'
```

---

# `/services/deployment/client/config/reload`

Access information on reloading the named client.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/client/config/reload` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| 200 | HTTP status | Endpoint returned successfully. |
| 400 | HTTP status | Request error. See response body for details. |
| 401 | HTTP status | Authentication failure: must pass valid credentials with request. |
| 403 | HTTP status | Insufficient permissions to access resource. |
| 404 | HTTP status | Specified resoruce does not exist. |
| 409 | HTTP status | Request error: this operation is invalid for this item. See response body for details. |
| 500 | HTTP status | Internal server error. See response body for details. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/deployment/client/config/reload?output_mode=json'
```

---

# `/services/deployment/client/{name}/reload`

Restart and reload the`{name}` deployment client.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/client/{name}/reload` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | string | `1`= Disabled |
| serverClasses | string | List of member server classes for app download authorization. |
| targetUri | string | Host and port number (`: `). |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/deployment/client/YOUR_NAME/reload?output_mode=json'
```

---

