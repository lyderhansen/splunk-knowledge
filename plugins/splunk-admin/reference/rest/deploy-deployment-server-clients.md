# REST bundle: `deployment/server/clients`

**Category:** Deployment

Grouped Splunk REST Reference endpoints.

---

# `/services/deployment/server/clients`

Provides access to information about clients to a deployment server.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/clients` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action | String | No |  |  |
| application | String | No | Lists clients to the deployment server that have attempted to download the named application. |  |
| hasDeploymentError | Boolean | No | False | Indicates whether to list only clients that have a deployment error. |
| maxPhonehome_latency_to_avgInterval_ratio | Number | No | List clients to the deployment server when the ratio of the phone home latency to the average phone home interval is less than the value supplied to this parameter. |  |
| minLatestPhonehomeTime | Number | No |  |  |
| minPhonehome_latency_to_avgInterval_ratio | Number | No | List clients to the deployment server when the ratio of the phone home latency to the average phone home interval is greater than the value supplied with this parameter. |  |
| serverclasses | String | No |  |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| applications | string | List of applications deployed to the deployment client. |
| averagePhoneHomeInterval | string | The average phone home interval, in seconds. |
| build | string | The build number for the Splunk instance on the deployment client. |
| dns | string | The DNS lookup name of the deployment client server. |
| guid | string | Identifier for the deployment server client. |
| hasDeploymentError | string | Specifies whether to check for clients with a deployment error. |
| hostname | string | The host name of the deployment client server. |
| id | string | ID for the client based on client name and IP address. |
| ip | string | The IP address of the client to the deployment server. |
| lastPhoneHomeTime | string | The last time the deployment client phones home to the deployment server, in epoch time. |
| mgmt | string | The managment port for the deployment client. |
| minLatestPhonehomeTime | string | Specifies in epoch seconds the minimum latency for a client to contact the deployment server. |
| minPhonehome_latency_to_avgInterval_ratio | string | The minimum value specified for the ratio of the phone home latency to the average phone home interval. |
| name | string | The name of the deployment client server. |
| serverclasses | string | List of server classes for the deployment client. |
| utsname | string | Machine type for the deployment server client. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/clients?output_mode=json'
```

---

# `/services/deployment/server/clients/{name}`

Get client information or remove a client.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/clients/{name}` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## DELETE

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/deployment/server/clients/YOUR_NAME?output_mode=json'
```

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| application | String | No | Lists information about this client with respect to the named application. |  |
| hasDeploymentError | Boolean | No | Indicates whether to list this client if has a deployment error. |  |
| maxPhonehome_latency_to_avgInterval_ratio | Number | No | List clients to the deployment server when the ratio of the phone home latency to the average phone home interval is less than the value supplied to this parameter. |  |
| minLatestPhonehomeTime | Number | No | Specifies in epoch seconds the minimum latency for a client to contact the deployment server. This endpoint lists information about the named client if it has a latency equal to or greater than specified by this parameter. |  |
| minPhonehome_latency_to_avgInterval_ratio | Number | No | List information about the named client to the deployment server when the ratio of the phone home latency to the average phone home interval is greater than the value supplied with this parameter. |  |
| serverclasses | String | No | Comma-separated list of serverclasses. Lists information about this client if it is configured to send an application to a listed serverclass. |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| application | string | The name of the application specified to filter the results of this call. |
| applications | string | List of applications deployed to the deployment client. |
| averagePhoneHomeInterval | string | The average phone home interval, in seconds. |
| build | string | The build number for the Splunk instance on the deployment client. |
| dns | string | The DNS lookup name of the deployment client server. |
| guid | string | Identifier for the deployment server client. |
| hasDeploymentError | string | Specifies whether to check for clients with a deployment error. |
| hostname | string | The host name of the deployment client server. |
| id | string | ID for the client based on client name and IP address. |
| ip | string | The IP address of the client to the deployment server. |
| lastPhoneHomeTime | string | The last time the deployment client phones home to the deployment server, in epoch time. |
| maxPhonehome_latency_to_avgInterval_ratio | string | The maximum value specified for the ratio of the phone home latency to the average phone home interval. |
| mgmt | string | The managment port for the deployment client. |
| minLatestPhonehomeTime | string | Specifies in epoch seconds the minimum latency for a client to contact the deployment server. |
| minPhonehome_latency_to_avgInterval_ratio | string | The minimum value specified for the ratio of the phone home latency to the average phone home interval. |
| name | string | The name of the deployment client server. |
| serverClasses | string | The list of server classes to which the client belongs. |
| serverclasses | string | List of server classes for the deployment client. |
| utsname | string | Machine type for the deployment server client. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/clients/YOUR_NAME?output_mode=json'
```

---

