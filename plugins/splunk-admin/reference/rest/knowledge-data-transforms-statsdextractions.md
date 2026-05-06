# /services/data/transforms/statsdextractions

Use this endpoint to configure dimension extraction from StatsD metrics.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/transforms/statsdextractions` |
| Auth required | Yes |
| Capability | edit_statsd_transforms |

## POST /services/data/transforms/statsdextractions
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| unique_transforms_stanza_name | String | No | — | A unique name for this stanza. |
| REGEX = | String | No | — | A regular expression that defines how to match and extract dimensions from StatsD metrics data. Splunk supports a named capturing-group extraction format`(? group)(?dim2>group) ...` to provide dimension names for the corresponding values that are extracted. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/transforms/statsdextractions
```
