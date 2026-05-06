# REST bundle: `server/health/splunkd`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/health/splunkd`

Shows the overall health of`splunkd`. The health of` splunkd` can be red, yellow, or green. The health of`splunkd` is based on the health of all features reporting to it.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/health/splunkd` |
| Auth required | Yes |
| Capability | `admin role or list_health` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| health | String | Indicates the overall health of`splunkd`. Health status can be red, yellow, or green. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/health/splunkd?output_mode=json'
```

---

# `/services/server/health/splunkd/details`

Shows the overall health of the`splunkd` health status tree, as well as each feature node and its respective color. For unhealthy nodes (non-green), the output includes reasons, indicators, thresholds, messages, and so on.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/health/splunkd/details` |
| Auth required | Yes |
| Capability | `admin role or list_health` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| health | String | Indicate the color of the feature: red, yellow or green. The color of midlevel features is the worst color of all the features reporting to it. |
| messages | String | The last 50 messages from`splunkd.log` that might relate to the feature status change. Returned only if a feature color is not green. |
| reasons | String | Describes the indicator(s) that caused the feature's status to change to a non-green state. Returned only if a feature color is not green. |
| due_to_stanza | String | Indicates the stanza name in`health.conf` where the configuration for the non-green indicator exists. |
| due_to_threshold | String | Indicates the threshold because of which the color of the indicator is non-green. |
| due_to_threshold_value | Numeric | Indicates the value of the above threshold. |
| indicator | String | Name of the indicator because of which the feature is non-green. |
| reason | String | Descriptive string that explains the reason the indicator is non-green. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/health/splunkd/details?output_mode=json'
```

---

