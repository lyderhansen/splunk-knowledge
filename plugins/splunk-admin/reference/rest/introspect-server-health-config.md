# REST bundle: `server/health-config`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/health-config`

Endpoint to configure the splunkd health report.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/health-config` |
| Auth required | Yes |
| Capability | `admin role or list_health` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/health-config?output_mode=json'
```

---

# `/services/server/health-config/{alert_action}`

Configure alert actions for the splunkd health report.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/health-config/{alert_action}` |
| Auth required | Yes |
| Capability | `admin role or edit_health` |

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  Specify the alert action name.` ` can be one of the following: |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/health-config/YOUR_ACTION?output_mode=json'
```

---

# `/services/server/health-config/{feature_name}`

Edit feature- and indicator-level settings for the splunkd health report.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/health-config/{feature_name}` |
| Auth required | Yes |
| Capability | `admin role or edit_health` |

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| alert.disabled \| Boolean \| Possible values are 0 or 1. A value of 1 disables alerting for this feature. If alerting is disabled in the [health_reporter] stanza, alerting for this feature is disabled, regardless of the value set here. If the value  |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/server/health-config/YOUR_FEATURE?output_mode=json'
```

---

