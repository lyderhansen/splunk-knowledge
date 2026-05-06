# /services/data/outputs/tcp/default

Access to global tcpout properties.

**Category:** Output

**Related REST paths in this file:** `/services/data/outputs/tcp/default`, `/services/data/outputs/tcp/default/{name}`


## /services/data/outputs/tcp/default

Access to global tcpout properties.

**Category:** Output

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/outputs/tcp/default` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/outputs/tcp/default`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| autoLB | varies | Specifies whether Auto Load balance method is used. |
| defaultGroup | varies | — |
| disabled | varies | Indicates if tcpout settings are disabled. |
| forwardedindex.0.whitelist | varies | — |
| forwardedindex.1.blacklist | varies | Specifies 1st blacklist filter. forwardedindex..blacklist specifies index for which events are not forwarded. |
| forwardedindex.2.whitelist | varies | — |
| forwardedindex.filter.disable | varies | Specifies whether filtering of forwarded data based on index is diasbled. |
| indexAndForward | varies | — |
| maxQueueSize | varies | — |


**Additional returned-field documentation:**

Target group names. The forwarder sends all data to the specified groups.

Starting with 4.2, this attribute is no longer required.

Specifies 0th whitelist filter.

forwardedindex..whitelist decides which events get forwarded based on the indexes they belong to.

Specifies 2nd whitelist filter.

forwardedindex..whitelist decides which events get forwarded based on the indexes they belong to.

Specifies whether to index all data locally, in addition to forwarding it. Defaults to false.

This is known as an "index-and-forward" configuration. This attribute is only available for heavy forwarders. It is available only at the top level [tcpout] stanza in outputs.conf. It cannot be overridden in a target group.

Sets the maximum size of the forwarder output queue. It also sets the maximum size of the wait queue to 3x this value, if you have enabled indexer acknowledgment (useACK=true).

See the parmeter description for the POST operation for more information.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/outputs/tcp/default?output_mode=json'
```

## POST `/services/data/outputs/tcp/default`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| defaultGroup | String | Varies |  |  |
| disabled | Boolean | Varies | Disables default tcpout settings |  |
| dropEventsOnQueueFull | Number | Varies |  |  |
| heartbeatFrequency | Number | Varies |  |  |
| indexAndForward | Boolean | Varies |  |  |
| maxQueueSize | Number | Varies |  |  |
| required | String | Varies | Configuration to be edited. The only valid value is "tcpout". |  |
| sendCookedData | Boolean | Varies |  |  |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Comma-separated list of one or more target group names, specified later in [tcpout:] stanzas of outputs.conf.spec file.

The forwarder sends all data to the specified groups. If you do not want to forward data automatically, do not set this attribute. Can be overridden by an inputs.conf _TCP_ROUTING setting, which in turn can be overridden by a props.conf/transforms.conf modifier.

Starting with 4.2, this attribute is no longer required.

If set to a positive number, wait the specified number of seconds before throwing out all new events until the output queue has space. Defaults to -1 (do not drop events).

CAUTION: Do not set this value to a positive integer if you are monitoring files.

Setting this to -1 or 0 causes the output queue to block when it gets full, which causes further blocking up the processing chain. If any target group queue is blocked, no more data reaches any other target group.

Using auto load-balancing is the best way to minimize this condition, because, in that case, multiple receivers must be down (or jammed up) before queue blocking can occur.

How often (in seconds) to send a heartbeat packet to the receiving server.

Heartbeats are only sent if sendCookedData=true. Defaults to 30 seconds.

Specifies whether to index all data locally, in addition to forwarding it. Defaults to false.

This is known as an "index-and-forward" configuration. This attribute is only available for heavy forwarders. It is available only at the top level [tcpout] stanza in outputs.conf. It cannot be overridden in a target group.

Specify an integer or integer[KB|MB|GB].

Sets the maximum size of the forwarder output queue. It also sets the maximum size of the wait queue to 3x this value, if you have enabled indexer acknowledgment (useACK=true).

Although the wait queue and the output queues are both configured by this attribute, they are separate queues. The setting determines the maximum size of the queue in-memory (RAM) buffer.

For heavy forwarders sending parsed data, maxQueueSize is the maximum number of events. Since events are typically much shorter than data blocks, the memory consumed by the queue on a parsing forwarder is likely to be much smaller than on a non-parsing forwarder, if you use this version of the setting.

If specified as a lone integer (for example, maxQueueSize=100), maxQueueSize indicates the maximum number of queued events (for parsed data) or blocks of data (for unparsed data). A block of data is approximately 64KB. For non-parsing forwarders, such as universal forwarders, that send unparsed data, maxQueueSize is the maximum number of data blocks.

If specified as an integer followed by KB, MB, or GB (for example, maxQueueSize=100MB), maxQueueSize indicates the maximum RAM allocated to the queue buffer. Defaults to 500KB (which means a maximum size of 500KB for the output queue and 1500KB for the wait queue, if any).

name

If true, events are cooked (processed by Splunk software). If false, events are raw and untouched prior to sending. Defaults to true.

Set to false if you are sending to a third-party system.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/outputs/tcp/default'
```


## /services/data/outputs/tcp/default/{name}

Manage forwarder settings.

**Category:** Output

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/outputs/tcp/default/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/outputs/tcp/default/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/outputs/tcp/default/{name}'
```

## GET `/services/data/outputs/tcp/default/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/outputs/tcp/default/{name}?output_mode=json'
```

## POST `/services/data/outputs/tcp/default/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| defaultGroup | String | Varies |  |  |
| disabled | Boolean | Varies | Disables default tcpout settings |  |
| dropEventsOnQueueFull | Number | Varies |  |  |
| heartbeatFrequency | Number | Varies |  |  |
| indexAndForward | Boolean | Varies |  |  |
| maxQueueSize | Number | Varies |  |  |
| sendCookedData | Boolean | Varies |  |  |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Comma-separated list of one or more target group names, specified later in [tcpout:] stanzas of outputs.conf.spec file.

The forwarder sends all data to the specified groups. If you do not want to forward data automatically, do not set this attribute. Can be overridden by an inputs.conf _TCP_ROUTING setting, which in turn can be overridden by a props.conf/transforms.conf modifier.

Starting with 4.2, this attribute is no longer required.

If set to a positive number, wait the specified number of seconds before throwing out all new events until the output queue has space. Defaults to -1 (do not drop events).

Caution: Do not set this value to a positive integer if you are monitoring files.

Setting this to -1 or 0 causes the output queue to block when it gets full, which causes further blocking up the processing chain. If any target group queue is blocked, no more data reaches any other target group.

Using auto load-balancing is the best way to minimize this condition, because, in that case, multiple receivers must be down (or jammed up) before queue blocking can occur.

How often (in seconds) to send a heartbeat packet to the receiving server.

Heartbeats are only sent if sendCookedData=true. Defaults to 30 seconds.

Specifies whether to index all data locally, in addition to forwarding it. Defaults to false.

This is known as an "index-and-forward" configuration. This attribute is only available for heavy forwarders. It is available only at the top level [tcpout] stanza in outputs.conf. It cannot be overridden in a target group.

Specify an integer or integer[KB|MB|GB].

Sets the maximum size of the forwarder output queue. It also sets the maximum size of the wait queue to 3x this value, if you have enabled indexer acknowledgment (useACK=true).

Although the wait queue and the output queues are both configured by this attribute, they are separate queues. The setting determines the maximum size of the queue in-memory (RAM) buffer.

For heavy forwarders sending parsed data, maxQueueSize is the maximum number of events. Since events are typically much shorter than data blocks, the memory consumed by the queue on a parsing forwarder is likely to be much smaller than on a non-parsing forwarder, if you use this version of the setting.

If specified as a lone integer (for example, maxQueueSize=100), maxQueueSize indicates the maximum number of queued events (for parsed data) or blocks of data (for unparsed data). A block of data is approximately 64KB. For non-parsing forwarders, such as universal forwarders, that send unparsed data, maxQueueSize is the maximum number of data blocks.

If specified as an integer followed by KB, MB, or GB (for example, maxQueueSize=100MB), maxQueueSize indicates the maximum RAM allocated to the queue buffer. Defaults to 500KB (which means a maximum size of 500KB for the output queue and 1500KB for the wait queue, if any).

If true, events are cooked (processed by Splunk software). If false, events are raw and untouched prior to sending. Defaults to true.

Set to false if you are sending to a third-party system.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/outputs/tcp/default/{name}'
```

