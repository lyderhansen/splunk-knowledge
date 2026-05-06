# REST bundle: `deployment/server/clients/metrics`

**Category:** Deployment

Grouped Splunk REST Reference endpoints.

---

# `/services/deployment/server/clients/countClients_by_machineType`

Access information about deployment clients to this server according to the machine type of the client.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/clients/countClients_by_machineType` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| counts | string | The list of machine types for this deployment client, showing the count of each machine type. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/clients/countClients_by_machineType?output_mode=json'
```

---

# `/services/deployment/server/clients/countRecentDownloads`

Access the count of the number of downloads from this client to the deployment server during the last specified time period.

**Category:** Deployment

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/deployment/server/clients/countRecentDownloads` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | Number | No | Age of the downloads to count, in seconds. |  |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| count | string | The number of recent downloads. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/deployment/server/clients/countRecentDownloads?output_mode=json'
```

---

