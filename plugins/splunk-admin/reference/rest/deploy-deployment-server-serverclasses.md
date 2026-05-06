# REST bundle: `deployment/server/serverclasses`

**Category:** Deployment

Grouped Splunk REST Reference endpoints.

---

# `/services/deployment/server/serverclasses`

Access information about server classes.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/serverclasses` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| blacklist-size | string | The number of entires in the blacklist for this serverclass. |
| clientId | string | ID of deployment client for this server class. |
| currentDownloads | string | Number of applications currently downloaded. |
| hasDeploymentError | string | Indicates whether the serverclass has at least one deployment error. |
| loadTime | string | The time, in epoch seconds, this serverclass was loaded. |
| machineTypesFilter | string | List of filters to be used in Boolean and logic with whitelist and blacklist filters. |
| repositoryList | string | List of applications stored at the location specified by repositoryLocation. |
| repositoryLocation | string | The location on the deployment server to store the content that is to be deployed for this server class. |
| restartSplunkWeb | string | Indicates whether to restart Splunk Web. |
| restartSplunkd | string | Indicates whether to restart splunkd. |
| stateOnClient | string | Indicates whether this server class is enabled or disabled. |
| whitelist-size | string | Specifies the number of entries in the whitelist for this server class. |
| whitelist.0 | string | List of servers for whitelist.0 for this server class. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/serverclasses?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | The name of the server class. |
| blacklist.* | String | No |  |  |
| continueMatching | Boolen | No |  |  |
| filterType | Enum | No |  |  |
| machineTypesFilter | String | No |  |  |
| repositoryLocation | String | No |  |  |
| restartSplunkWeb | Boolean | No |  |  |
| restartSplunkd | Boolean | No |  |  |
| stateOnClient | Enum | No |  |  |
| targetRepositoryLocation | String | No |  |  |
| tmpFolder | String | No |  |  |
| whitelist.* | String | No |  |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| blacklist-size | string | The number of entries in the blacklist for this serverclass. |
| blacklist.* | string |  |
| continueMatching | string | If true, configuration lookups continue matching server classes, beyond the first match. If false, only the first match is used. |
| currentDownloads | string | Number of applications currently downloaded. |
| filterType | string |  |
| loadTime | string | The time, in epoch seconds, this serverclass was loaded. |
| machineTypesFilter | string | List of filters to be used in Boolean and logic with whitelist and blacklist filters. |
| repositoryList | string | List of applications stored at the location specified by repositoryLocation. |
| repositoryLocation | string | The location on the deployment server to store the content that is to be deployed for this server class. |
| restartSplunkWeb | string | Indicates whether to restart Splunk Web. |
| restartSplunkd | string | Indicates whether to restart splunkd. |
| stateOnClient | string | Specifies whether the deployment client is enabled or disabled. |
| targetRepositoryLocation | string |  |
| tmpFolder | string |  |
| whitelist-size | string | Specifies the number of entries in the whitelist for this server class. |
| whitelist.* | string |  |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/deployment/server/serverclasses?output_mode=json'
```

---

# `/services/deployment/server/serverclasses/rename`

Rename a server class.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/serverclasses/rename` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| newName | String | Yes |  | The new name of the server class. |
| oldName | String | Yes |  | The current name of the server class. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/deployment/server/serverclasses/rename?output_mode=json'
```

---

# `/services/deployment/server/serverclasses/{name}`

Manage the`{name}` serverclass.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/serverclasses/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## DELETE

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/deployment/server/serverclasses/YOUR_NAME?output_mode=json'
```

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| clientId | String | No | GUID of a deployment client that is a member of the named server class. Lists information about the named server class with respect to this client. |  |
| hasDeploymentError | Boolean | No | Indicates whether to only list server classes that have a deployment error. |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| blacklist-size | string | Specifies the size of the blacklist for the named server class. |
| clientId | string | ID of deployment client for this server class. |
| currentDownloads | string | The number of entires in the blacklist for this serverclass. |
| hasDeploymentError | string | Indicates whether the serverclass has at least one deployment error. |
| loadTime | string | The time, in epoch seconds, this serverclass was loaded. |
| machineTypesFilter | string | List of filters to be used in Boolean and logic with whitelist and blacklist filters. |
| repositoryList | string | List of applications stored at the location specified by repositoryLocation. |
| repositoryLocation | string | The location on the deployment server to store the content that is to be deployed for this server class. |
| restartSplunkWeb | string | Indicates whether to restart Splunk Web. |
| restartSplunkd | string | Indicates whether to restart splunkd. |
| stateOnClient | string | Indicates whether this server class is enabled or disabled. |
| whitelist-size | string | Specifies the number of entries in the whitelist for this server class. |
| whitelist.0 | string | List of servers for whitelist.0 for this server class. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/serverclasses/YOUR_NAME?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| blacklist.* | String | No |  |  |
| continueMatching | Boolen | No |  |  |
| filterType | Enum | No |  |  |
| machineTypesFilter | String | No |  |  |
| repositoryLocation | String | No |  |  |
| restartSplunkWeb | Boolean | No |  |  |
| restartSplunkd | Boolean | No |  |  |
| stateOnClient | Enum | No |  |  |
| targetRepositoryLocation | String | No |  |  |
| tmpFolder | String | No |  |  |
| whitelist.* | String | No |  |  |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/deployment/server/serverclasses/YOUR_NAME?output_mode=json'
```

---

