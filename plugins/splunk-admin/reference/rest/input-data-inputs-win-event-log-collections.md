# /services/data/inputs/win-event-log-collections

Provides access to all configured event log collections.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/win-event-log-collections`, `/services/data/inputs/win-event-log-collections/{name}`


## /services/data/inputs/win-event-log-collections

Provides access to all configured event log collections.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/win-event-log-collections` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/win-event-log-collections`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| lookup_host | String | Varies | — | For internal use. Used by the UI when editing the initial host from which we gather event log data. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates if the input is disabled. |
| hosts | varies | Hosts you are monitoring. |
| index | varies | — |
| logs | varies | List of event log channels to monitor. |


**Additional returned-field documentation:**

Index to store data.

If not specified defaults to the default index.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/win-event-log-collections?output_mode=json'
```

## POST `/services/data/inputs/win-event-log-collections`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| hosts | String | Varies | — | A comma-separated list of additional hosts to be used for monitoring. The first host should be specified with "lookup_host", and the additional ones using this parameter. |
| index | String | Varies | — | The index in which to store the gathered data. |
| logs | String | Varies | — | String |
| lookup_host | String | Varies | — | Required. Host from which to monitor log events. To specify additional hosts to be monitored using WMI, use the "hosts" parameter. |
| name | String | Varies | — | Required. Collection name. This name appears in configuration file, as well as the source and the sourcetype of the indexed data. If the value is "localhost", it uses native event log collection; otherwise, it uses WMI. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

List of event log names from which to gather data:

WMI collection format (CSV) example:

Native event log collection format example:

- `logs=Application%2CSystem%2CSetup%2CSecurity`

- `logs=Application&logs=System&logs=Setup`

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates if the input is disabled. |
| hosts | varies | Monitored hosts. |
| index | varies | Index to store data. |
| logs | varies | List of event log channels to monitor. |
| lookup_host | varies | Host from which to monitor log events. |
| name | varies | The name of the collection. This name appears in a configuration file, as well as the source and the sourcetype of the indexed data. If the value is "localhost", it uses native event log collection; otherwise, it uses WMI |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/win-event-log-collections'
```


## /services/data/inputs/win-event-log-collections/{name}

Manage the {name} Windows event log.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/win-event-log-collections/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/win-event-log-collections/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/win-event-log-collections/{name}'
```

## GET `/services/data/inputs/win-event-log-collections/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| lookup_host | String | Varies | — | For internal use. Used by the UI when editing the initial host from which we gather event log data. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates if the input is disabled. |
| hosts | varies | Monitored hosts. |
| index | varies | — |
| logs | varies | List of event log channels to monitor. |
| lookup_host | varies | Host from which to monitor log events. |
| name | varies | The name of the collection. This name appears in a configuration file, as well as the source and the sourcetype of the indexed data. If the value is localhost, it uses native event log collection; otherwise, it uses WMI. |


**Additional returned-field documentation:**

Index to store data.

If not specified defaults to the default index.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/win-event-log-collections/{name}?output_mode=json'
```

## POST `/services/data/inputs/win-event-log-collections/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| hosts | String | Varies | — | A comma-separated list of additional hosts to be used for monitoring. The first host should be specified with "lookup_host", and the additional ones using this parameter. |
| index | String | Varies | — | The index in which to store the gathered data. |
| logs | String | Varies | — | A comma-separated list of event log names to gather data from. |
| lookup_host | String | Varies | — | Required. This is a host from which we monitor log events. To specify additional hosts to be monitored using WMI, use the "hosts" parameter. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates if the input is disabled. |
| hosts | varies | Monitored hosts. |
| index | varies | Index to store data. |
| logs | varies | List of event log channels to monitor. |
| lookup_host | varies | Host from which to monitor log events. |
| name | varies | The name of the collection. This name appears in a configuration file, as well as the source and the sourcetype of the indexed data. If the value is localhost, it uses native event log collection; otherwise, it uses WMI. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/win-event-log-collections/{name}'
```

