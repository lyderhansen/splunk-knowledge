# /services/data/inputs/all

Access all inputs to the Splunk deployment. This includes any modular inputs that may be defined on the system.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/all`, `/services/data/inputs/all/{name}`


## /services/data/inputs/all

Access all inputs to the Splunk deployment. This includes any modular inputs that may be defined on the system.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/all` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/all`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| common | Boolean | Varies | — | Boolean |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Indicates whether to return only attributes common to all inputs. The common attributes are as follows.

- `app`

- `disabled`

- `host`

- `index`

- `owner`

- `source`

- `sourcetype`

- `title`

- `updated`

### Returned values

Returns an` ` element for each input, listing attributes specific to the input. See the following example for more details.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/all?output_mode=json'
```


## /services/data/inputs/all/{name}

Get information about the {name} input source.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/all/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/all/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| common | Boolean | Varies | — | Boolean |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Indicates whether to return only attributes common to all inputs. These common attributes are as follows.

- `app`

- `disabled`

- `host`

- `index`

- `owner`

- `source`

- `sourcetype`

- `title`

- `updated`

### Returned values

The response lists attributes for the`{name}` input. See the following example for details.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/all/{name}?output_mode=json'
```

