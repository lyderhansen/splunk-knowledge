# /services/shcluster/captain/kvmigrate/start

Start migration of the KV store storage engine.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/shcluster/captain/kvmigrate/start` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## POST /services/shcluster/captain/kvmigrate/start
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| storageEngine | String | Yes | — | Required. Name of target storage engine, wiredTiger or mmap. |
| isDryRun | Boolean | No | — | Type true to complete pre-flight checks and exit without migrating. Setting is false by default. |
| maxRetries | Number | No | — | Number of times to retry a failed migration, per member. |
| clusterPerc | Number | No | — | Percentage of peers to migrate. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme https://localhost:8099/services/shcluster/captain/kvmigrate/start -X POST -d storageEngine=wiredTiger -d clusterPerc=50
```

---

# /services/shcluster/captain/kvmigrate/status

Check the status of a KV store storage engine migration.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/shcluster/captain/kvmigrate/status` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/shcluster/captain/kvmigrate/status
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| clusterPerc | Various | Percentage of cluster members that have completed migration. |
| migrationID | Various | ID number for the migration. |
| migrationStartTime | Various | Timestamp that the migration began. |
| peerRetryCount | Various | Number of times that the peer failed to migrate and retried. |
| status | Various | Status of the migration. |
| storageEngine | Various | Target storage engine. |

### Example
```
curl -k -u admin:changeme https://localhost:8099/services/shcluster/captain/kvmigrate/status
```

---

# /services/shcluster/captain/kvmigrate/stop

Stop the migration of your KV store storage engine.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/shcluster/captain/kvmigrate/stop` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## POST /services/shcluster/captain/kvmigrate/stop
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:changeme -X POST https://localhost:8099/services/shcluster/captain/kvmigrate/stop
```
