# /services/data/transforms/metric-schema

Use this endpoint to configure ingest-time log-to-metrics transformations. Identify measurements and blacklist dimensions. Design transformations that target specific event schemas within a log.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/transforms/metric-schema` |
| Auth required | Yes |
| Capability | edit_metric_schema |

## GET /services/data/transforms/metric-schema
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:ch@ngeme -X GET https://localhost:8089/services/data/transforms/metric-schema/splunk_metrics
```

## POST /services/data/transforms/metric-schema
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | Yes | — | Required. Name of the`metric-schema` stanza in`transforms.conf`. |
| required | String | No | — | Comma-separated list of measure fields to be extracted from a log line. |
| optional | String | No | — | Comma-separated list of dimension fields to be omitted when log events are converted to metric data points. |
| optional | String | No | — | Used when the events in a log have more than one schema, meaning that they have differing sets of measure fields and blacklist dimension fields. Takes the value of a field that is shared by all events in the log, and whose values correspond to the different event schemas. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:ch@ngeme -X POST https://localhost:8089/services/data/transforms/metric-schema -d "name=splunk_metrics" -d "metric_name_prefix=queue" -d "field_names=max_size_kb,current_size_kb,current_size,largest_size,smallest_size" -d "blacklist_dimensions=location,corp"
```

## DELETE /services/data/transforms/metric-schema
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:ch@ngeme -X DELETE https://localhost:8089/services/data/transforms/metric-schema/splunk_metrics
```
