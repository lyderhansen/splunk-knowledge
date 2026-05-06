# Search scheduler

Access scheduler status for queued searches.

## `/services/search/scheduler`

Get current search scheduler enablement status.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/scheduler` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/scheduler`

Get current search scheduler enablement status.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | None |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| saved_searches_disabled | Boolean | 0 or 1 |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/search/scheduler
```



---

## `/services/search/scheduler/status`

Enable or disable the search scheduler.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/scheduler/status` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/search/scheduler/status`

Enable or disable the search scheduler.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | No |  | Indicates whether to disable the search scheduler. 0 enables the search scheduler. 1 disables the search scheduler. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | XML Request |
| *(notes)* | text | XML Response |

#### Example

```
curl -ku admin:pass -XPOST https://localhost:8089/services/search/scheduler/status -d disabled=1
```



---
