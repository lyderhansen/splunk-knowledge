# REST bundle: `server/health/deployment`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/health/deployment`

Shows the overall health of a distributed deployment. The health of the deployment can be red, yellow, or green. The overall health of the deployment is based on the health of all features reporting to it.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/health/deployment` |
| Auth required | Yes |
| Capability | `admin role or list_health` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| health | String | Indicates the overall health of the deployment. Health status can be red, yellow, or green. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/health/deployment?output_mode=json'
```

---

# `/services/server/health/deployment/details`

Shows the overall health of the distributed deployment, as well as each feature node and its respective color.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/health/deployment/details` |
| Auth required | Yes |
| Capability | `admin role or list_health` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| health | String | Indicates the color of the feature: red, yellow or green. The color of mid-level features defaults to the worst health status color of all features reporting to it. |
| reason | String | Descriptive string that explains the reason the indicator is non-green. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/health/deployment/details?output_mode=json'
```

---

