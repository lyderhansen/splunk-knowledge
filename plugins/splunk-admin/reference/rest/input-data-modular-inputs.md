# /services/data/modular-inputs

Access currently defined modular inputs on the system.

**Category:** Input

**Related REST paths in this file:** `/services/data/modular-inputs`, `/services/data/modular-inputs/{name}`


## /services/data/modular-inputs

Access currently defined modular inputs on the system.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/modular-inputs` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/modular-inputs`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| description | varies | — |
| endpoint | varies | Contains one or more elements, which define the parameters to an endpoint. |
| streaming_mode | varies | Indicates the streaming mode for the modular input. Valid values are`xml` and`simple`. |
| title | varies | The label for a modular input script. The title appears on the Data inputs manager page. |


**Additional returned-field documentation:**

Provides descriptive text for title shown on the Data inputs manager page.

The description also appears on the Add new data inputs page.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/modular-inputs?output_mode=json'
```


## /services/data/modular-inputs/{name}

Get information about the {name} modular input.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/modular-inputs/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/modular-inputs/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| description | varies | — |
| endpoint | varies | Contains one or more elements, which define the parameters to an endpoint. |
| streaming_mode | varies | — |
| title | varies | The label for a modular input script. The label appears in the Data inputs manager page. |


**Additional returned-field documentation:**

The label for a modular input script.

The label appears in the Data inputs manager page.

Indicates the streaming mode for the modular input. Valid values are`xml` or`simple`(plain text).

Contains one or more elements, which define the parameters to an endpoint.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/modular-inputs/{name}?output_mode=json'
```

