# REST bundle: `services/saved/bookmarks/monitoring_console`

**Category:** Introspection

Grouped Splunk REST Reference endpoints.

---

# `/services/services/saved/bookmarks/monitoring_console`

Add URLs that link to monitoring consoles of your other deployments. For example, if you're admin overseeing multiple separate Splunk deployments for different teams.

**Category:** Introspection

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/services/saved/bookmarks/monitoring_console` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  Optional request parameters: \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| count \| Number \| Number of bookmark URLs to list. \| \| offset \| Number \| Lists bookmark URLs, offset from the first bookmark. \| \| search \| String \| Items to search for, must be valid as SPL. \| \| sort_dir \| Enum \| asc or |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/services/saved/bookmarks/monitoring_console?output_mode=json'
```

## POST

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(see Splunk docs)* | — | * | — |  \| Name \| Type \| Description \| \| --- \| --- \| --- \| \| name \| String \| Name of the deployment bookmark. \| \| url \| string \| Full URL to the monitoring console of a different Splunk deployment. \| |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/services/saved/bookmarks/monitoring_console?output_mode=json'
```

## DELETE

### Request parameters

| *(none)* | — | No | — | No parameters for this request. |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/services/saved/bookmarks/monitoring_console?output_mode=json'
```

---

