# /services/data/ingest/rulesets

Retrieve a list of your rulesets.

**Category:** Input

**Related REST paths in this file:** `/services/data/ingest/rulesets`, `/services/data/ingest/rulesets/{name}`, `/services/data/ingest/rulesets/publish`


## /services/data/ingest/rulesets

Retrieve a list of your rulesets.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/ingest/rulesets` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/ingest/rulesets`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Name | varies | The name of the retrieved ruleset. |
| Sourcetype | varies | The sourcetype of the deployed ruleset. |
| Rules | varies | The rules for your deployed ruleset. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/ingest/rulesets?output_mode=json'
```

## POST `/services/data/ingest/rulesets`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Name | string | Varies | — | The name of the retrieved ruleset. |
| Sourcetype | string | Varies | — | The sourcetype of the deployed ruleset. |
| Rules | string | Varies | — | The rules for your deployed ruleset. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Name | varies | The name of the retrieved ruleset. |
| Sourcetype | varies | The sourcetype of the deployed ruleset. |
| Rules | varies | The rules for your deployed ruleset. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/ingest/rulesets'
```


## /services/data/ingest/rulesets/{name}

Retrieve a particular ruleset.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/ingest/rulesets/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/ingest/rulesets/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Name | varies | The name of the retrieved ruleset. |
| Sourcetype | varies | The sourcetype of the deployed ruleset. |
| Rules | varies | The rules for your deployed ruleset. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/ingest/rulesets/{name}?output_mode=json'
```

## POST `/services/data/ingest/rulesets/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| Name | string | Varies | — | The name of the retrieved ruleset. |
| Match | string | Varies | — | What your deployed ruleset matches. |
| Action | string | Varies | — | The action that your deployed ruleset does. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Name | varies | The name of the retrieved ruleset. |
| Match | varies | What your deployed ruleset matches. |
| Action | varies | The action that your deployed ruleset does. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/ingest/rulesets/{name}'
```


## /services/data/ingest/rulesets/publish

Publish ruleset changes on the indexer cluster manager.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/ingest/rulesets/publish` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## POST `/services/data/ingest/rulesets/publish`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Name | varies | The name of the retrieved ruleset. |
| Match | varies | What your deployed ruleset matches. |
| Action | varies | The action that your deployed ruleset does. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/ingest/rulesets/publish'
```

