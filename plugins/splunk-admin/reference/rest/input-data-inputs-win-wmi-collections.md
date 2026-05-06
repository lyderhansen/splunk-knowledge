# /services/data/inputs/win-wmi-collections

Access configured WMI collections.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/win-wmi-collections`, `/services/data/inputs/win-wmi-collections/{name}`


## /services/data/inputs/win-wmi-collections

Access configured WMI collections.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/win-wmi-collections` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/win-wmi-collections`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| class | varies | The WMI performance object class being monitored. |
| disabled | varies | Indicates whther the input is disbled. |
| fields | varies | The WMI performance counters being monitored. |
| index | varies | The index to which you are sending input data. |
| instances | varies | Instances of the WMI performance counter. |
| interval | varies | The interval, in seconds, at which the WMI provider(s) are queried. |
| name | varies | the name of the input. |
| server | varies | The server you are monitoring. |
| wql | varies | The actual WQL query for monitoring the performance object. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/win-wmi-collections?output_mode=json'
```

## POST `/services/data/inputs/win-wmi-collections`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| classes | String | Varies | — | Required. A valid WMI class name. |
| disabled | Number | Varies | — | Disables the given collection. |
| fields | String | Varies | — | `1. *` |
| index | String | Varies | — | The index in which to store the gathered data. |
| instances | String | Varies | — | `empty` |
| interval | Number | Varies | — | Required. The interval, in seconds, at which the WMI provider(s) is queried. |
| lookup_host | String | Varies | — | Required. This is the server from which we is gathering WMI data. If you need to gather data from more than one machine, additional servers can be specified in the 'server' parameter. |
| name | String | Varies | — | Required. This is the name of the collection. This name appears in configuration file, as well as the source and the sourcetype of the indexed data. |
| server | String | Varies | — | A comma-separated list of additional servers that you want to gather data from. Use this if you need to gather from more than a single machine. See also lookup_host. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Properties (fields) that you want to gather from the given class.

Specify each property as a separate argument to the POST operation.

Instances of a given class for which data is gathered.

Specify each instance as a separate argument to the POST operation.

### Returned values

| Name | Type | Description |
|------|------|-------------|
| classes | varies | A valid WMI class name. |
| disabled | varies | Indicates if the input is disabled. |
| fields | varies | Properties (fields) that you want to gather from the given class. |
| index | varies | The index in which to store the gathered data. |
| instances | varies | Instances of a given class for which data is gathered. |
| interval | varies | The interval, in seconds, at which the WMI provider(s) is queried. |
| lookup_host | varies | Host from which to monitor log events. |
| server | varies | Servers from which to gather data. Used if you need to gather from more than a single machine. See also lookup_host. |
| wql | varies | The actual WQL query for monitoring the performance object. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/win-wmi-collections'
```


## /services/data/inputs/win-wmi-collections/{name}

Manage the {name} WMI collection.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/win-wmi-collections/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/win-wmi-collections/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/win-wmi-collections/{name}'
```

## GET `/services/data/inputs/win-wmi-collections/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| classes | varies | A valid WMI class name. |
| disabled | varies | Indicates if the input is disabled. |
| fields | varies | Properties (fields) that you want to gather from the given class. |
| index | varies | The index in which to store the gathered data. |
| instances | varies | Instances of a given class for which data is gathered. |
| interval | varies | The interval, in seconds, at which the WMI provider(s) is queried. |
| lookup_host | varies | Host from which to monitor log events. |
| name | varies | Collection name. This name appears in a configuration file, as well as the source and the sourcetype of the indexed data. If the value is localhost, it uses native event log collection; otherwise, it uses WMI. |
| server | varies | Servers frpm which to gather data from. Used if you need to gather from more than a single machine. See also lookup_host. |
| wql | varies | The actual WQL query for monitoring the performance object. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/win-wmi-collections/{name}?output_mode=json'
```

## POST `/services/data/inputs/win-wmi-collections/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| classes | String | Varies | — | Required. A valid WMI class name. |
| disabled | Number | Varies | — | Disables the given collection. |
| fields | String | Varies | — | String |
| index | String | Varies | — | The index in which to store the gathered data. |
| instances | String | Varies | — | String |
| interval | Number | Varies | — | Required. The interval, in seconds, at which the WMI provider(s) is queried. |
| lookup_host | String | Varies | — | Required. This is the server from which we is gathering WMI data. If you need to gather data from more than one machine, additional servers can be specified in the 'server' parameter. |
| server | String | Varies | — | A comma-separated list of additional servers that you want to gather data from. Use this if you need to gather from more than a single machine. See also lookup_host parameter. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Properties (fields) that you want to gather from the given class.

Specify each property as a separate argument to the POST operation.

Instances of a given class for which data is gathered.

Specify each instance as a separate argument to the POST operation.

### Returned values

| Name | Type | Description |
|------|------|-------------|
| classes | varies | A valid WMI class name. |
| disabled | varies | Indicates if the input is disabled. |
| fields | varies | Properties (fields) that you want to gather from the given class. |
| index | varies | The index in which to store the gathered data. |
| instances | varies | Instances of a given class for which data is gathered. |
| interval | varies | The interval, in seconds, at which the WMI provider(s) are queried. |
| lookup_host | varies | Host from which to monitor log events. |
| name | varies | Collection name. This name appears in a configuration file, as well as the source and the sourcetype of the indexed data. If the value is localhost, it uses native event log collection; otherwise, it uses WMI. |
| server | varies | Servers from which to gather data. Used if you need to gather from more than a single machine. See also lookup_host. |
| wql | varies | The actual WQL query for monitoring the performance object. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/win-wmi-collections/{name}'
```

