# <endpoint path>

<One paragraph purpose>

**Source version:** Splunk REST API Reference 10.2
**Category:** <Access/Apps/Configuration/Deployment/Federated/Input/Introspection/Knowledge/KV Store/License/Metrics/Output/Search/System/Workloads>

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/<path>` |
| Auth required | Yes — requires `<capability>` capability |
| Cloud support | <Yes/No/Partial — detail if partial> |
| API version | <v1/v2/both> |

## GET

<description of what GET returns>

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| param_name | string | No | `"default"` | What it does |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| field_name | string | What it contains |

### Example

```bash
curl -k -u admin:password "https://localhost:8089/services/<path>?output_mode=json"
```

## POST

<description of what POST does — create or update>

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| param_name | string | Yes | — | What it does |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| field_name | string | What it contains |

### Example

```bash
curl -k -u admin:password -X POST "https://localhost:8089/services/<path>" \
  -d output_mode=json \
  -d param_name=value
```

## DELETE

<description — if applicable>

### Example

```bash
curl -k -u admin:password -X DELETE "https://localhost:8089/services/<path>/<name>?output_mode=json"
```
