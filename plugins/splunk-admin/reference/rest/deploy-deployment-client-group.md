# REST reference bundle: `deployment/client/_group`

**Category:** Deployment

This file groups related Splunk REST endpoints documented together.

---

# /services/deployment/client
List deployment client configuration and status.
**Category:** Deployment
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/deployment/client` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET `/services/deployment/client`
### Request parameters
| *(see Splunk docs)* | | | | [Pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a0... |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| disabled | string | `1`= Disabled |
| serverClasses | string | List of member server classes for app download authorization. |
| targetUri | string | Host and port number (`: `). |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/deployment/client?output_mode=json
```

---

# /services/deployment/client/config
Get deployment client configuration and status.
**Category:** Deployment
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/deployment/client/config` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET `/services/deployment/client/config`
### Request parameters
| *(see Splunk docs)* | | | | [Pagination and filtering parameters](https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introduction/using-the-rest-api-reference#ce82149e_1974_4789_99bc_ea02c1a0... |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| disabled | string | `1`= Disabled |
| serverClasses | string | List of member server classes for app download authorization. |
| targetUri | string | Host and port number (`: `). |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/deployment/client/config?output_mode=json
```

---

# /services/deployment/client/config/listIsDisabled
Get deployment client status.
**Category:** Deployment
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/deployment/client/config/listIsDisabled` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET `/services/deployment/client/config/listIsDisabled`
### Request parameters
| *(see Splunk docs)* | | | | None... |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| disabled | string | `1`= Disabled |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/deployment/client/config/listIsDisabled?output_mode=json
```

---

# /services/deployment/client/config/reload
Access information on reloading the named client.
**Category:** Deployment
## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/deployment/client/config/reload` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST `/services/deployment/client/config/reload`
### Request parameters
| *(see Splunk docs)* | | | | No parameters for this request.... |

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
curl -k -u admin:pass -X POST https://localhost:8089/services/deployment/client/config/reload?output_mode=json
```

---

