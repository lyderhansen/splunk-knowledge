# /services/data/inputs/ad

Access and configure the active directory monitoring input.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/ad`, `/services/data/inputs/ad/{name}`


## /services/data/inputs/ad

Access and configure the active directory monitoring input.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/ad` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/ad`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Indicates whether this input is disabled. |
| index | varies | — |
| monitorSubtree | varies | Indicates whether or not to monitor the subtrees of a given Active Directory tree path. |
| startingNode | varies | — |
| targetDc | varies | — |


**Additional returned-field documentation:**

The index in which to store the gathered data.

If no value is present, sends data to the default index.

Tells Splunk software where in the Active Directory directory tree to start monitoring.

If not specified, Splunk software attempts to start at the root of the directory tree.

The user as which you configure Splunk to run at installation determines where Splunk software starts monitoring.

Fully qualified domain name of a valid, network-accessible Active Directory domain controller.

If not specified, Splunk software obtains the local computer DC by default, and binds to its root Distinguished Name (DN).

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/ad?output_mode=json'
```

## POST `/services/data/inputs/ad`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| baseline | Boolean | Varies | — | Boolean |
| host | String | Varies | — | Host name for the Active Directory Monitor. |
| index | String | Varies | — | default |
| monitorSubtree | Number | Varies | — | Required. Whether or not to monitor the subtree(s) of a given directory tree path. 1 means yes, 0 means no. |
| name | String | Varies | — | Required. A unique name that represents a configuration or set of configurations for a specific domain controller. |
| printSchema | Boolean | Varies | — | Indicates whether to print the Active Directory schema. Defaults to true. |
| source | String | Varies | — | Source for data inputs. |
| sourcetype | String | Varies | — | Source type of data inputs. |
| startingNode | String | Varies | — | Where in the Active Directory directory tree to start monitoring. If not specified, attempts to start at the root of the directory tree. |
| targetDc | String | Varies | — | Specifies a fully qualified domain name of a valid, network-accessible domain controller. If not specified, Splunk software gets the local domain controller. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Indicates whether to query baseline objects. Defaults to true.

Baseline objects are objects which currently reside in Active Directory and include previously deleted objects.

The index in which to store the gathered data.

If not specified defaults to the default index.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/ad'
```


## /services/data/inputs/ad/{name}

Manage {name} active directory monitoring.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/ad/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/ad/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/ad/{name}'
```

## GET `/services/data/inputs/ad/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Attribute | varies | Description |
| disabled | varies | Indicates whether this input is disabled. |
| index | varies | — |
| monitorSubtree | varies | Indicates whether or not to monitor the subtrees of a given Active Directory tree path. |


**Additional returned-field documentation:**

The index in which to store the gathered data.

If no value is present, send data to the default index.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/ad/{name}?output_mode=json'
```

## POST `/services/data/inputs/ad/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| baseline | Boolean | Varies | — | Boolean |
| host | String | Varies | — | Host name for the Active Directory Monitor. |
| index | String | Varies | — | default |
| required | Number | Varies | — | Whether or not to monitor the subtree(s) of a given directory tree path. 1 means yes, 0 means no. |
| printSchema | Boolean | Varies | — | Indicates whether to print the Active Directory schema. Defaults to true. |
| source | String | Varies | — | Source for data inputs. |
| sourcetype | String | Varies | — | Source type of data inputs. |
| startingNode | String | Varies | — | Where in the Active Directory directory tree to start monitoring. If not specified, attempts to start at the root of the directory tree. |
| targetDc | String | Varies | — | Specifies a fully qualified domain name of a valid, network-accessible DC. If not specified, Splunk software gets the local computer's DC. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Indicates whether to query baseline objects. Defaults to true.

Baseline objects are objects which currently reside in Active Directory and include previously deleted objects.

The index in which to store the gathered data.

If not specified defaults to the default index.

monitorSubtree

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/ad/{name}'
```

