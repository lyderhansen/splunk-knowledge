# /services/receivers/stream

Open a socket to receive streaming data.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/receivers/stream` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## POST `/services/receivers/stream`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
|  | String | Varies | — | Required. Raw event text. This does not need to be presented as a complete HTTP request, but can be streamed in as data is available. |
| host | String | Varies | — | The value to populate in the host field for events from this data input. |
| host_regex | String | Varies | — | A regular expression used to extract the host value from each event. |
| index | String | Varies | — | The index to send events from this input to. |
| source | String | Varies | — | The source value to fill in the metadata for this input's events. |
| sourcetype | String | Varies | — | The sourcetype to apply to events from this input. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/receivers/stream'
```
