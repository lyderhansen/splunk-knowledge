# /services/indexing/preview

Preview events from a source file before you index the file.

**Category:** Input

**Related REST paths in this file:** `/services/indexing/preview`, `/services/indexing/preview/{job_id}`


## /services/indexing/preview

Preview events from a source file before you index the file.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/indexing/preview` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/indexing/preview`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/indexing/preview?output_mode=json'
```

## POST `/services/indexing/preview`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| input.path | String | Varies | — | Required. The absolute file path to a local file that you want to preview data returned from indexing. |
| props. | String | Varies | — | Define a new sourcetype in props.conf for preview data that you are indexing. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/indexing/preview'
```


## /services/indexing/preview/{job_id}

Get props.conf file settings for the {job_id} job.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/indexing/preview/{job_id}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/indexing/preview/{job_id}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/indexing/preview/{job_id}?output_mode=json'
```

