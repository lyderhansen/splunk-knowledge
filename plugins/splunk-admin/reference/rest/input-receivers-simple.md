# /services/receivers/simple

Allows for sending events to Splunk in an HTTP request.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/receivers/simple` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## POST `/services/receivers/simple`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
|  | String | Varies | — | Required. Raw event text. This is the entirety of the HTTP request body. |
| host | String | Varies | — | The value to populate in the host field for events from this data input. |
| host_regex | String | Varies | — | A regular expression used to extract the host value from each event. |
| index | String | Varies | — | The destination index where events are sent. |
| source | String | Varies | — | The source value to fill in the metadata for this input's events. |
| sourcetype | String | Varies | — | The sourcetype to apply to events from this input. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/receivers/simple'
```
