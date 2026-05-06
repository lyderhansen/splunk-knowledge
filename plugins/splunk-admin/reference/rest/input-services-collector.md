# /services/services/collector

Send events to HTTP Event Collector using the Splunk platform JSON event protocol.

**Category:** Input

**Related REST paths in this file:** `/services/services/collector`, `/services/services/collector/ack`, `/services/services/collector/event`, `/services/services/collector/event/1.0`, `/services/services/collector/health`, `/services/services/collector/health/1.0`, `/services/services/collector/mint`, `/services/services/collector/mint/1.0`, `/services/services/collector/raw`, `/services/services/collector/raw/1.0`, `/services/services/collector/s2s`


## /services/services/collector

Send events to HTTP Event Collector using the Splunk platform JSON event protocol.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## POST `/services/services/collector`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| channel | See description | Varies | — | Required if`useAck` is enabled. Pass in the channel GUID as a string parameter or using the`"x-splunk-request-channel"` header. |
| event | string | Varies | — | string |
| fields | JSON object | Varies | — | JSON object |
| host | string | Varies | — | Host name. Specify with the host query string parameter. Sets a default for all events in the request. The default host name can be overridden. |
| index | string | Varies | — | Index name. Specify with the index query string parameter. Sets a default for all events in the request. The default index name can be overridden. |
| source | string | Varies | — | User-defined event source. Specify with the source query string parameter. Sets a default for all events in the request. The default source can be overridden. |
| sourcetype | string | Varies | — | User-defined event sourcetype. Specify with the sourcetype query string parameter. Sets a default for all events in the request. The default sourcetype can be overridden. |
| time | string or unsigned integer | Varies | — | Epoch-formatted time. Specify with the time query string parameter. Sets a default for all events in the request. The default time can be overridden. For more information about formatting, see [Format events for HTTP Event Collector](https://docs.splunk.com/?resourceId=Splunk_Data_FormateventsforHTTPEventCollector). |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Required. Event payload key-value. Value can be a string or a JSON object.

JSON example:`{"event": {"message":"Access log test message"}}`

String example:`"event": "Access log test message."`

Fields for indexing that do not occur in the event payload itself. You can use this parameter when you do not want particular fields to be included in the event data, but you need additional metadata for indexing and searching.

Specify one or more additional fields to include for indexing with the event payload. For each field, use a key to specify the name and include one or more values. Specify multiple values in an array.

In the following example, the`"severity"` field gets the value`"INFO"` and the`"category"` key gets both`"foo"` and`"bar"` values.

-d {"event": "something happened", "fields": {"severity": "INFO", "category": ["foo", "bar"]}}

-d {"event": "something happened", "fields": {"severity": "INFO", "category": ["foo", "bar"]}}

### Returned values

| Name | Type | Description |
|------|------|-------------|
| text | varies | Human readable status, same value as code. |
| code | varies | Machine format status, same value as text. |
| invalid-event-number | varies | When errors occur, indicates the zero-based index of first invalid event in an event sequence. |
| ackId | varies | If`useACK` is enabled for the token, indicates the`ackId` to use for checking an indexer acknowledgement. |


**Additional returned-field documentation:**

Response status codes

Several HTTP status codes have particular meaning for all HTTP Event Collector endpoints. See [Possible error codes](https://docs.splunk.com/Documentation/Splunk/9.4.2/Data/TroubleshootHTTPEventCollector#Possible_error_codes).

Success:

{"text":"Success","code":0}

{"text":"Success","code":0}

Failure:

{"text":"Incorrect data format","code":5,"invalid-event-number":0}

{"text":"Incorrect data format","code":5,"invalid-event-number":0}

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/services/collector'
```


## /services/services/collector/ack

Query event indexing status.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/ack` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## GET `/services/services/collector/ack`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| channel | See description | Varies | — | Required. Pass in the channel GUID as the channel string parameter or using the`x-splunk-request-channel` header. |
| `"acks"` | JSON object | Varies | — | Required. JSON object with an array of ack ID values. Include in the request payload. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| acks | varies | — |


**Additional returned-field documentation:**

Contains the key/value pairs for each ACK ID requested. For each key in the`"acks"` object, a`true` value means the ACK ID's events were indexed. A`false` value means that indexing status is unknown. For example, an event may have an indexing delay long enough that it is no longer tracked.

Here is an example response.

`{"acks" : { "0" : true, "1" : false, "2" : true, "3" : false}} `

Response status codes

Several HTTP status codes have particular meaning for all HTTP Event Collector endpoints. See [Possible error codes](https://docs.splunk.com/Documentation/Splunk/9.4.2/Data/TroubleshootHTTPEventCollector#Possible_error_codes).

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/services/collector/ack?output_mode=json'
```


## /services/services/collector/event

Splunk REST endpoint.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/event` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## Methods

*See official Splunk REST Reference for supported HTTP methods.*


## /services/services/collector/event/1.0

Splunk REST endpoint.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/event/1.0` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## Methods

*See official Splunk REST Reference for supported HTTP methods.*


## /services/services/collector/health

This endpoint checks if HEC is healthy and able to accept new data from a load balancer.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/health` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## Methods

*See official Splunk REST Reference for supported HTTP methods.*


## /services/services/collector/health/1.0

This endpoint checks if HEC is healthy and able to accept new data from a load balancer. HEC health is determined if there is space available in the queue.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/health/1.0` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## Methods

*See official Splunk REST Reference for supported HTTP methods.*


## /services/services/collector/mint

Post MINT formatted data to the HTTP Event Collector. The authorization header contains the authorization scheme and application token. The HTTP POST body contains event data in the MINT payload format.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/mint` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## POST `/services/services/collector/mint`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| host | String | Varies | — | Host name. Specify with the host query string parameter. Sets a default for all events in the request. Can be overridden. |
| index | String | Varies | — | Index name. Specify with the index query string parameter. Sets a default for all events in the request. Can be overridden. |
| source | String | Varies | — | User-defined event source. Specify with the source query string parameter. Sets a default for all events in the request. The default source can be overridden. |
| sourcetype | string | Varies | — | User-defined event sourcetype. Specify with the sourcetype query string parameter. Sets a default for all events in the request. The default sourcetype can be overridden. |
| time | string or unsigned integer | Varies | — | Epoch-formatted time. Specify with the time query string parameter. Sets a default for all events in the request. The default time can be overridden. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/services/collector/mint'
```


## /services/services/collector/mint/1.0

Splunk REST endpoint.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/mint/1.0` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## Methods

*See official Splunk REST Reference for supported HTTP methods.*


## /services/services/collector/raw

Send raw data directly to the HTTP Event Collector. This endpoint allows one or more raw events to be sent in a single request. Events are parsed using regex or JSON extraction. JSON field extraction works at index time.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/raw` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## POST `/services/services/collector/raw`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| channel | See description. | Varies | — | Required. Pass in the channel GUID as the channel string parameter or using the`x-splunk-request-channel` header. |
| host | String | Varies | — | Host name. Specify with the host query string parameter. Sets a default for all events in the request. Can be overridden. |
| index | String | Varies | — | Index name. Specify with the index query string parameter. Sets a default for all events in the request. Can be overridden. |
| source | String | Varies | — | User-defined event source. Specify with the source query string parameter. Sets a default for all events in the request. The default source can be overridden. |
| sourcetype | string | Varies | — | User-defined event sourcetype. Specify with the sourcetype query string parameter. Sets a default for all events in the request. The default sourcetype can be overridden. |
| time | string or unsigned integer | Varies | — | Epoch-formatted time. Specify with the time query string parameter. Sets a default for all events in the request. The default time can be overridden. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/services/collector/raw'
```


## /services/services/collector/raw/1.0

Splunk REST endpoint.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/raw/1.0` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## Methods

*See official Splunk REST Reference for supported HTTP methods.*


## /services/services/collector/s2s

This endpoint receives Splunk TCP data over HTTP from the Splunk Universal Forwarder. Compatible with Splunk 8.1.0 and later.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/services/collector/s2s` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## Methods

*See official Splunk REST Reference for supported HTTP methods.*

