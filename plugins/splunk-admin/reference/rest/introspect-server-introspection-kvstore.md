# REST bundle: `server/introspection/kvstore`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/server/introspection/kvstore`

Access app KV store resources.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/kvstore` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/kvstore?output_mode=json'
```

---

# `/services/server/introspection/kvstore/collectionstats`

Get storage statistics for a collection.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/kvstore/collectionstats` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| data | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/kvstore/collectionstats?output_mode=json'
```

---

# `/services/server/introspection/kvstore/replicasetstats`

Get the status of the replica set from the point of view of the current server.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/kvstore/replicasetstats` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(see JSON/Atom response)* | — | Inspect keys with output_mode=json. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/kvstore/replicasetstats?output_mode=json'
```

---

# `/services/server/introspection/kvstore/serverstatus`

Get an overview of the database process state.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/introspection/kvstore/serverstatus` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| data | string |  |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/introspection/kvstore/serverstatus?output_mode=json'
```

---

