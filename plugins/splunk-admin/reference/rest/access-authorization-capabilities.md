# /services/authorization/capabilities

Access system capabilities.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/capabilities` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authorization/capabilities

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Response keys

| Name | Type | Description |
|---|---|---|
| capabilities | String | List of capabilities assigned to role. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/authorization/capabilities
```


---
