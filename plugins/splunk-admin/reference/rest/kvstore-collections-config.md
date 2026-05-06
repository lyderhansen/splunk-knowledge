# /servicesNS/{owner}/{app}/storage/collections/config

Access and create collections.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{owner}/{app}/storage/collections/config` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /servicesNS/{owner}/{app}/storage/collections/config
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| disabled | Various | Boolean indicating collection state. By default, the value is`false`, indicating that the collection is enabled. |
| profilingEnabled | Various | Boolean indicating profiling status of slow-running operations. By default, this value is`false`, meaning that profiling is disabled. |
| profilingThresholdMs | Various | Threshold for logging slow-running operations, in milliseconds. Applies only if profilingEnabled is`true`. |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/config
```

## POST /servicesNS/{owner}/{app}/storage/collections/config
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Required. Collection name |
| profilingEnabled | Boolean | No | — | A`collections.conf` file property that affects profilingThresholdMs. Defaults to`false`. Enable profiling of slow-running operations by setting profilingEnabled to`true`. |
| profilingThresholdMs | Number | No | — | Threshold for logging slow-running operations, in milliseconds. Applies only if profilingEnabled is`true`. Defaults to`100`. Set to`0` to log all slow-running operations. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| disabled | Various | Boolean indicating collection state. By default, the value is`false`, indicating that the collection is enabled. |
| profilingEnabled | Various | Profiling status of slow-running operations, profilingThresholdMs. Defaults to`false`. |
| profilingThresholdMs | Various | Threshold for logging slow-running operations, in milliseconds. Applies only if profilingEnabled is`true`. |

### Example
```
curl -k -u admin:changeme -d name=test1 https://localhost:8089/servicesNS/nobody/search/storage/collections/config
```

---

# /servicesNS/{owner}/{app}/storage/collections/config/{collection}

Access, delete, or update a specific{collection}.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{owner}/{app}/storage/collections/config/{collection}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /servicesNS/{owner}/{app}/storage/collections/config/{collection}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/config/test -X DELETE
```

## GET /servicesNS/{owner}/{app}/storage/collections/config/{collection}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| disabled | Various | Boolean indicating collection state. By default, the value is`0`, meaning that the collection is enabled. |
| field. | Various |  |
| accelerated_fields. | Various | Field acceleration name and JSON definition. |
| enforceTypes | Various | Boolean indicating if data types are enforced when inserting data into the collection. Defaults to`false`. |
| profilingEnabled | Various | Profiling status of slow-running operations, affecting profilingThresholdMs. By default, the value is`false`, meaning that profiling is disabled. If`true`, profiling is enabled. |
| profilingThresholdMs | Various | Threshold for logging slow-running operations, in milliseconds. Applies only if profilingEnabled is`true`. |
| replicate | Various | When`true`, this collection is replicated on indexers. |
| replication_dump_maximum_file_size | Various | KV Store does not pre-calculate the size of the records that will be written to disk, so the size of the resulting files can be affected by the`max_rows_in_memory_per_dump` setting in the`limits.conf` file. |
| replication_dump_strategy | Various |  |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/config/test
```

## POST /servicesNS/{owner}/{app}/storage/collections/config/{collection}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| accelerated_fields. | String, JSON (see description) | No | — | The name of a field acceleration (string) and its definition, in JSON key value format. For example,`accelerated_fields.my_accel = {"id": 1}` |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| disabled | Various | `false`= [Default] enabled. |
| field. | Various |  |
| accelerated_fields. | Various | The name of a field acceleration (string) and its definition, in JSON key value format. For example,`accelerated_fields.my_accel = {"id": 1}` |
| profilingEnabled | Various | Profiling status of slow-running operations, affecting profilingThresholdMs. By default, the value is`false`, meaning that profiling is disabled. If`true`, profiling is enabled. |
| profilingThresholdMs | Various | Threshold for logging slow-running operations, in milliseconds. Applies only if profilingEnabled is`true`. |
| replicate | Various | When`true`, this collection is replicated on indexers. |
| replication_dump_maximum_file_size | Various | KV Store does not pre-calculate the size of the records that will be written to disk, so the size of the resulting files can be affected by the`max_rows_in_memory_per_dump` setting in the`limits.conf` file. |
| replication_dump_strategy | Various |  |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/config/test -d 'accelerated_fields.foo={"a": 1}' -d 'accelerated_fields.bar={"b": -1}' -d "field.a=number" -d "field.b=cidr"
```
