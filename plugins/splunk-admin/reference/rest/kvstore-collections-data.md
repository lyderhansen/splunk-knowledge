# /servicesNS/{owner}/{app}/storage/collections/data/{collection}

Access and manage items of a collection. Note: The| rest SPL command does not return any results for this endpoint. This is because the KV store/data/ endpoints return data in JSON format, while the| rest command expectsXML.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{owner}/{app}/storage/collections/data/{collection}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /servicesNS/{owner}/{app}/storage/collections/data/{collection}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| query | JSON object | No | — | `query={"price":{"$gt":5}}`(Select all documents with`price` greater than`5`) |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA -X DELETE
```

## GET /servicesNS/{owner}/{app}/storage/collections/data/{collection}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| fields | String | No | — | `fields=address:0`(Include all fields except the`address` field) |
| shared | Boolean | No | — | Defaults to false. Set to true to return records for the specified user as well as records for the`nobody` user. |
| limit | Number | No | — | `limit=5`. |
| skip | Number | No | — | `skip=10`. |
| sort | String | No | — | `sort=surname:1,first name`(Sort by`surname`, ascending, after`firstname`, ascending |
| query | JSON object | No | — | `query={"price":{"$gt":5}}`(Select all documents with`price` greater than`5`) |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA -H "Content-Type: application/json" -d '{ "myKey": "abc", "myOtherKey": "abcdef"}'
```

## POST /servicesNS/{owner}/{app}/storage/collections/data/{collection}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA -H "Content-Type: application/json" -d '{ "myKey": "abc", "myOtherKey": "abcdef"}'
```

---

# /servicesNS/{owner}/{app}/storage/collections/data/{collection}/{key}

Access and manage a specific{key} item in a{collection}. Note: The| rest SPL command does not return any results for this endpoint. This is because the KV store/data/ endpoints return data in JSON format, while the| rest command expectsXML.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{owner}/{app}/storage/collections/data/{collection}/{key}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## DELETE /servicesNS/{owner}/{app}/storage/collections/data/{collection}/{key}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA/5410caf041ba15298e4624d6 -X DELETE
```

## GET /servicesNS/{owner}/{app}/storage/collections/data/{collection}/{key}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA/5410c8dc41ba15298e4624d5
```

## POST /servicesNS/{owner}/{app}/storage/collections/data/{collection}/{key}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA/5410c8dc41ba15298e4624d5 -H "Content-Type: application/json" -d '{ "myKey": "fizz"}'
```

---

# /servicesNS/storage/collections/data/{collection}/batch_find

Perform multiple queries in a batch.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/storage/collections/data/{collection}/batch_find` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## POST /servicesNS/storage/collections/data/{collection}/batch_find
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| fields | String | No | — | `fields=address:0`(Include all fields except the`address` field) |
| shared | Boolean | No | — | Defaults to false. Set to true to return records for the specified user as well as records for the`nobody` user. |
| limit | Number | No | — | `limit=5`. |
| skip | Number | No | — | `skip=10`. |
| sort | String | No | — | `sort=surname:1,first name`(Sort by`surname`, ascending, after`firstname`, ascending |
| query | JSON object | No | — | `query={"price":{"$gt":5}}`(Select all documents with`price` greater than`5`) |

### Returned values
| *(none documented)* | — | — |

### Example
```
queries='[' queries+='{"query": {"myKey": "def"}},' queries+='{"query": {"myKey": "abc"}},' queries+='{"query": {"myKey": "jkl"}},' queries+='{"shared": true, "fields": {"myKey": 1}, "sort": [{"myKey": 1}], "limit": 2}' queries+=']' curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA/batch_find -H "Content-Type: application/json" -d "$queries"
```

---

# /servicesNS/storage/collections/data/{collection}/batch_save

Perform multiple save operations in a batch.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/storage/collections/data/{collection}/batch_save` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## POST /servicesNS/storage/collections/data/{collection}/batch_save
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/collections/data/testCollectionA/batch_save -H "Content-Type: application/json" -d '[{ "_key": "5410c43241ba15298e4624d3", "name": "AAAAAAAA" },{ "name": "A" }]'
```
