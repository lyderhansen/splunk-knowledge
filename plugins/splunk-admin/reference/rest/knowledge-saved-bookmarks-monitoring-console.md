# /services/saved/bookmarks/monitoring_console

Add URLs that link to monitoring consoles of your other deployments. For example, if you're admin overseeing multiple separate Splunk deployments for different teams.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/saved/bookmarks/monitoring_console` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/saved/bookmarks/monitoring_console
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| count | Number | No | — | Number of bookmark URLs to list. |
| offset | Number | No | — | Lists bookmark URLs, offset from the first bookmark. |
| search | String | No | — | Items to search for, must be valid as SPL. |
| sort_dir | Enum | No | — | asc or desc; ascending or descending |
| sort_key | String | No | — | Key to sort on, must be existing key in the stanza |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/saved/bookmarks/monitoring_console
```

## POST /services/saved/bookmarks/monitoring_console
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | No | — | Name of the deployment bookmark. |
| url | string | No | — | Full URL to the monitoring console of a different Splunk deployment. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/saved/bookmarks/monitoring_console -d name=deployment-2 -d url=https://deployment-2-host:8000/en-US/app/splunk_monitoring_console
```

## DELETE /services/saved/bookmarks/monitoring_console
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass --request DELETE https://localhost:8089/services/saved/bookmarks/monitoring_console/{name}
```
