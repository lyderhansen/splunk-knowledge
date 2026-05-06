# REST bundle: `server/httpsettings/proxysettings`

**Category:** System

Grouped Splunk REST Reference endpoints.

---

# `/services/server/httpsettings/proxysettings`

Create an HTTP Proxy Server configuration for splunkd.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/httpsettings/proxysettings` |
| Auth required | Yes |
| Capability | `edit_server` |

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| name \| String \| Required. Use`"proxyConfig"` to name the configuration stanza. \| |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/httpsettings/proxysettings?output_mode=json'
```

---

# `/services/server/httpsettings/proxysettings/proxyConfig`

Access, update, or delete the HTTP Proxy Server configurations for splunkd including`http_proxy`,`https_proxy` and`no_proxy`.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/httpsettings/proxysettings/proxyConfig` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| http_proxy \| String \| Identifies the server proxy. When set, splunkd sends all HTTP requests through the proxy server defined in`http_proxy` on the proxy. The default value is unset. \| \| https_proxy \| String \| Identifies the server proxy. When set |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/httpsettings/proxysettings/proxyConfig?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| http_proxy \| String \| Identifies the server proxy. When set, splunkd sends all HTTP requests through the proxy server defined in`http_proxy` on the proxy. The default value is unset. \| \| https_proxy \| String \| Identifies the server proxy. When set |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/httpsettings/proxysettings/proxyConfig?output_mode=json'
```

## DELETE

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/server/httpsettings/proxysettings/proxyConfig?output_mode=json'
```

---

