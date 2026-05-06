# REST bundle: `deployment/server/config`

**Category:** Deployment

Grouped Splunk REST Reference endpoints.

---

# `/services/deployment/server/config`

Access server configuration information for deployment servers.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/config` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| currentDownloads | string | The number of current downloads for this deployment server. |
| disabled | string | Indicates whether the deployment server is disabled. |
| loadTime | string | The time, in epoch seconds, the serverclass for this server was loaded. |
| repositoryLocation | string | The location on the deployment server to store the content that is to be deployed. |
| whitelist.0 | string | Lists the contents of whitelist.0. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/deployment/server/config?output_mode=json'
```

---

# `/services/deployment/server/config/attributesUnsupportedInUI`

Access deployment server attributes that cannot be configured from Splunk Web.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/config/attributesUnsupportedInUI` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| property | string | The attribute that cannot be configured from Splunk Web. |
| reason | string | The reason an attribute cannot be configured from Splunk Web. |
| stanza | string | In Splunk Enterprise, the stanza in`serverclass.conf` that lists deployment server attributes that cannot be configured from Splunk Web. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/config/attributesUnsupportedInUI?output_mode=json'
```

---

# `/services/deployment/server/config/listIsDisabled`

Access deployment server enablement status.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/config/listIsDisabled` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/config/listIsDisabled?output_mode=json'
```

---

