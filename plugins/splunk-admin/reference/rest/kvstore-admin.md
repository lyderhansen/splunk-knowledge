# /services/kvstore/backup/create

Splunk REST endpoint.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/kvstore/backup/create` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## POST /services/kvstore/backup/create
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| archiveName | String | No | — | Specify a file name for the backup. |
| appName | String | No | — | Specify a target app for backup, rather than all of the KV Store. Only available if pointInTime is not set to true. |
| collectionName | String | No | — | Specify a target collection for backup, rather than all of the KV Store. Only available if pointInTime is not set to true. |
| pointInTime | Boolean | No | — | Defaults to false. To take a consistent backup, set it to true. Only available for single-instance deployments. |
| cancel | Boolean | No | — | Defaults to false. Set it to true to cancel an in-progress backup. Only available if pointInTime is set to true. |
| parallelCollections | Number | No | — | Defaults to 1. Raise the number to increase the number of collections to back up in parallel. Only available if pointInTime is set to true. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| status | Various | Code`200` for success, and code`404` for failure. |

### Example
```
curl -k -u admin:changed -X POST https://localhost:8089/services/kvstore/backup/create -d 'archiveName=sampleArchive&appName=search&collectionName=testcollection'
```

---

# /services/kvstore/backup/restore

Splunk REST endpoint.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/kvstore/backup/restore` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## POST /services/kvstore/backup/restore
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| archiveName | String | Yes | — | Required. Specifies the name of the backup file. |
| appName | String | No | — | Specify a target app for backup, rather than all of the KV Store. Only available if pointInTime is not set to true. |
| collectionName | String | No | — | Specify a target collection for backup, rather than all of the KV Store. Only available if pointInTime is not set to true. |
| pointInTime | Boolean | No | — | Defaults to false. To restore from a backup taken with consistency, set it to true. |
| cancel | Boolean | No | — | Defaults to false. Set it to true to cancel an in-progress restore. Only available if pointInTime set to true. |
| parallelCollections | Number | No | — | Defaults to 1. Raise the number to increase the number of collections to restore in parallel, which speeds up the store. Only available if pointInTime set to true. |
| insertionsWorkersPerCollection | Number | No | — | Defaults to 1. Raise to increase the number of insertion workers per collection, which speeds up the restore. Only available if pointInTime set to true. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| status | Various | Code`200` for success, and code`404` for failure. |

### Example
```
curl -k -u admin:changed -X POST https://localhost:8089/services/kvstore/backup/restore -d 'archiveName=kvdump.tar.gz&appName=search&collectionName=testcollection'
```

---

# /services/kvstore/control/maintenance

Access KV store maintenance mode for standalone deployments.

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/kvstore/control/maintenance` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## POST /services/kvstore/control/maintenance
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| mode | Boolean | Yes | — | Required. Type true to enter maintenance mode. To exit, type false. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -ku admin:changeme -X POST https://localhost:8089/services/kvstore/control/maintenance -d 'mode=false'
```

---

# /services/kvstore/status

Access KV store status information for standalone or search head clustering (SHC) deployments. For SHC deployments, provides information on SHC members where KV Store is enabled and used for replication. See also the following KV Store i...

**Category:** KV Store

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/kvstore/status` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/kvstore/status
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | No | — | No request parameters documented for this endpoint. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| current.backupRestoreStatus | String | Backup/restore lifecycle: Busy \| Failed \| Ready \| Shutdown. |
| current.replicationStatus | String | Standalone: typically KV Store captain. SHC: Startup \| KV Store captain \| Non-captain KV Store member \| Recovering \| Initial Sync \| Unknown status \| Down \| Rollback \| Removed. |
| current.status | String | KV Store lifecycle: unknown \| disabled \| starting \| ready \| failed \| shuttingdown. |
| current.guid | String | Instance GUID for this member. |
| current.hostAndPort | String | Replication/listening endpoint for KV Store (SHC). |
| current.port | Number | Listening port (example excerpt). |
| current.disabled | Number | Whether KV Store is disabled on this node (0/1). |
| current.date / dateSec | String / Number | Human-readable epoch time pair for status snapshot. |
| current.oplogStartTimestamp* | String / Number | Operation log start timestamps (when present). |
| current.oplogEndTimestamp* | String / Number | Operation log end timestamps (when present). |
| current.replicaSet | String | Replica set identifier for the member. |
| current.standalone | Number | Indicates standalone deployment when 1. |
| members.<id>.hostAndPort | String | Peer replication endpoint. |
| members.<id>.replicationStatus | String | Replication role/state for that peer. |
| members.<id>.uptime | Number | Seconds since peer KV Store reported up. |
| members.<id>.configVersion | Number | Configuration generation seen on peer. |
| members.<id>.electionDate* | String / Number | Captain election timing metadata. |
| members.<id>.optimeDate* | String / Number | Replication optime markers. |
| eai:acl | Object | Standard Splunk entity ACL metadata on the status entry. |

### Example
```
curl -k -u admin:changed https://localhost:8089/services/kvstore/status
```
