# /services/server/pipelinesets

Provides information on the ingestion pipeline sets on an indexer.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/server/pipelinesets` |
| Auth required | Yes |
| Capability | `See Splunk documentation for this endpoint (role-based).` |

## GET `/services/server/pipelinesets`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| busiest_thread_name | varies | The name of the busiest pipeline thread within the pipeline set for past calculation period. |
| dutycycle_ratio | varies | The dutycycle ratio of the busiest pipeline thread within the pipeline set for past calculation period. |
| requests_last_period | varies | The number of ingestion requests processed by the pipeline set in the past calculation period. |
| share | varies | The relative probability of selection of the pipeline set for the past calculation period. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/pipelinesets?output_mode=json'
```
