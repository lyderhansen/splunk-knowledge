# REST bundle: `deployment/server/applications`

**Category:** Deployment

Grouped Splunk REST Reference endpoints.

---

# `/services/deployment/server/applications`

List distributed apps.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/applications` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| clientId | String | No | Select apps that match clientId. |  |
| hasDeploymentError | Boolean | No | `1`= Include apps with a deployment fault indication. |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| archive | string | Disk location of the archived version of the app. |
| clientId | string | Deployment client ID associated with the app, an MD5 hash value of serialized (catenated) client attributes. |
| hasDeploymentError | string | `1`= Include apps with a deployment fault indication. |
| loadtime | string | Last deployment server app loaded or reloaded date and time. An application not mapped to serverclasses is not loaded so loadtime is`0`. |
| restartSplunkWeb | string | `1`= Restart Splunk Web. |
| restartSplunkd | string | `1`= Restart splunkd. |
| serverclasses | string | List of server classes associated with the application. |
| size | string | Size on disk of the compressed app (bundle), in bytes. |
| stateOnClient | string | `1`= Enabled. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/applications?output_mode=json'
```

---

# `/services/deployment/server/applications/{name}`

Get or update distribution information for`{name}` app.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/applications/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| archive | string | Disk location of archived version of the app. |
| clientId | string | Deployment client ID associated with the app, an MD5 hash value of serialized (catenated) client attributes. |
| hasDeploymentError | string | `1`= Include apps with a deployment fault indication. |
| loadtime | string | Last deployment server app loaded or reloaded date and time. An application not mapped to serverclasses is not loaded so loadtime is`0`. |
| restartSplunkWeb | string | `1`= Restart Splunk Web. |
| restartSplunkd | string | `1`= Restart splunkd. |
| serverclasses | string | List of server classes associated with the application. |
| size | string | Size on disk of the compressed app (bundle), in bytes. |
| stateOnClient | string | `1`= Enabled. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/applications/YOUR_NAME?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| blacklist.* | String | No | List of hosts to exclude when mapping application to a server class. For each blacklist, replace the wildcard (*) with an ordinal number to specify additional blacklists. Filter ordinals must start at 0 and be consecutive. |  |
| continueMatching | Boolean | No | `false`= Use the first match, only. |  |
| deinstall | Boolean | No | `false`= Do not remove mapping of {name}. |  |
| filterType | Enum | No | `blacklist`= Blacklist filters are applied before whitelist filters. |  |
| machineTypesFilter | String | No |  |  |
| repositoryLocation | String | No |  |  |
| restartSplunkWeb | Boolean | No |  |  |
| restartSplunkd | Boolean | No |  |  |
| serverclass | String | No |  |  |
| stateOnClient | Enum | No |  |  |
| targetRepositoryLocation | String | No |  |  |
| tmpFolder | String | No |  |  |
| unmap | Boolean | No | Indicates whether to remove the mapping of the application to the specified server class. |  |
| whitelist.* | String | No |  |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| archive | string | Specifies the location of the compressed version (bundle) of the app. |
| blacklist.* | string |  |
| continueMatching | string | If true, configuration lookups continue matching server classes, beyond the first match. If false, only the first match is used. |
| filterType | string |  |
| loadtime | string |  |
| machineTypesFilter | string | List of filters to be used in Boolean and logic with whitelist and blacklist filters. |
| repositoryLocation | string | The location on the deployment server to store the content that is to be deployed for this server class. |
| restartSplunkWeb | string | Indicates whether to restart Splunk Web. |
| restartSplunkd | string | Indicates whether to restart splunkd. |
| serverclass | string | The name of the server class to which the application is mapped. |
| serverclasses | string | List of server classes associated with the application. |
| size | string | Indicates in bytes the size on disk of the compressed version (bundle) of the application. |
| stateOnClient | string | Specifies whether the deployment client is enabled or disabled. |
| targetRepositoryLocation | string |  |
| tmpFolder | string | Working folder used by deployment server. |
| whitelist.* | string |  |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/deployment/server/applications/YOUR_NAME?output_mode=json'
```

---

