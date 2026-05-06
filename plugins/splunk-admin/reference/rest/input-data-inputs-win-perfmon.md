# /services/data/inputs/win-perfmon

Access and manage performance monitoring configurations. This input allows you to poll Windows performance monitor counters.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/win-perfmon`, `/services/data/inputs/win-perfmon/{name}`


## /services/data/inputs/win-perfmon

Access and manage performance monitoring configurations. This input allows you to poll Windows performance monitor counters.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/win-perfmon` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/win-perfmon`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| counters | varies | List of valid Performance Monitor counters. |
| disabled | varies | Indicates whether the input is disabled. |
| index | varies | — |
| instances | varies | List of valid instances for a Performance Monitor counter. |
| interval | varies | How often, in seconds, to poll for new data. |
| nonmetric_counters | varies | List of valid Performance Monitor counters. |
| object | varies | A valid Performance Monitor object as defined within Performance Monitor. |


**Additional returned-field documentation:**

The index that this input should send data to.

If no value is present, send data to the default index.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/win-perfmon?output_mode=json'
```

## POST `/services/data/inputs/win-perfmon`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| counters | String | Varies | — | String |
| host | String | Varies | — | Name of the host for the Windows Performance Monitor. |
| index | String | Varies | — | The index in which to store the gathered data. |
| instances | String | Varies | — | String |
| interval | Number | Varies | — | How frequently, in seconds, to poll for new data. |
| required | String | Varies | — | This is the name of the collection. This name appears in configuration file, as well as the source and the sourcetype of the indexed data. |
| object | String | Varies | — | A valid performance monitor object (for example, 'Process,' 'Server,' 'PhysicalDisk.') |
| source | String | Varies | — | Source for inputs. |
| sourcetype | String | Varies | — | Source type of input. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

A set of counters to monitor. A '*' is equivalent to all counters.

Specify each counter as a separate argument to the POST operation.

A set of counter instances to monitor. A '*' is equivalent to all instances.

Specify each instance as a separate argument to the POST operation.

name

### Returned values

| Name | Type | Description |
|------|------|-------------|
| counters | varies | List of valid Performance Monitor counters. |
| disabled | varies | Indicates whether the input is disabled. |
| host | varies | Name of the host for the Windows Performance Monitor. |
| index | varies | — |
| instances | varies | List of valid instances for a Performance Monitor counter. |
| interval | varies | How frequently, in seconds, to poll for new data. |
| nonmetric_counters | varies | List of valid Performance Monitor counters. |
| object | varies | A valid Performance Monitor object as defined within Performance Monitor. |
| source | varies | Source for inputs. |
| sourcetype | varies | Source type of the input. |


**Additional returned-field documentation:**

The index that this input should send data to.

If no value is present, send data to the default index.

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/win-perfmon'
```


## /services/data/inputs/win-perfmon/{name}

Manage the {name} performance monitoring stanza.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/win-perfmon/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/win-perfmon/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/win-perfmon/{name}'
```

## GET `/services/data/inputs/win-perfmon/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| counters | varies | List of valid Performance Monitor counters. |
| disabled | varies | Indicates whether the input is disabled. |
| index | varies | — |
| instances | varies | List of valid instances for a Performance Monitor counter. |
| interval | varies | How often, in seconds, to poll for new data. |
| nonmetric_counters | varies | List of valid Performance Monitor counters. |
| object | varies | A valid Performance Monitor object as defined within Performance Monitor. |


**Additional returned-field documentation:**

The index that this input should send data to.

If no value is present, send data to the default index.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/win-perfmon/{name}?output_mode=json'
```

## POST `/services/data/inputs/win-perfmon/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| counters | String | Varies | — | String |
| host | String | Varies | — | Name of the host for the Windows Performance Monitor. |
| index | String | Varies | — | The index in which to store the gathered data. |
| instances | String | Varies | — | String |
| interval | Number | Varies | — | How frequently, in seconds, to poll for new data. |
| object | String | Varies | — | A valid performance monitor object (for example, 'Process,' 'Server,' 'PhysicalDisk.') |
| source | String | Varies | — | Source for inputs. |
| sourcetype | String | Varies | — | Source type of input. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

A set of counters to monitor. A '*' is equivalent to all counters.

Specify each counter as a separate argument to the POST operation.

A set of counter instances to monitor. A '*' is equivalent to all instances.

Specify each instance as a separate argument to the POST operation.

### Returned values

| Name | Type | Description |
|------|------|-------------|
| counters | varies | List of valid Performance Monitor counters. |
| disabled | varies | Indicates whether the input is disabled. |
| host | varies | Name of the host for the Windows Performance Monitor. |
| index | varies | — |
| instances | varies | List of valid instances for a Performance Monitor counter. |
| interval | varies | How frequently, in seconds, to poll for new data. |
| nonmetric_counters | varies | List of valid Performance Monitor counters. |
| object | varies | A valid Performance Monitor object as defined within Performance Monitor, |
| source | varies | Source for inputs. |
| sourcetype | varies | Source type of the input. |


**Additional returned-field documentation:**

The index that this input should send data to.

If no value is present, send data to the default index.

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/win-perfmon/{name}'
```

