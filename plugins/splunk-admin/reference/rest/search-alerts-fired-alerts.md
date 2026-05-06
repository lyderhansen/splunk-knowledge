# Fired alerts

Inspect or remove fired alert instances.

## `/services/alerts/fired_alerts`

Access fired alerts.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/alerts/fired_alerts` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/alerts/fired_alerts`

Access a fired alerts summary.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Pagination and filtering parameters can be used with this method. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| triggered_alert_count | varies | Trigger count for this alert. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/-/alerts/fired_alerts
```



---

## `/services/alerts/fired_alerts/{name}`

Access or delete the {name} triggered alert.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/alerts/fired_alerts/{name}` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/alerts/fired_alerts/{name}`

List unexpired triggered instances of this alert.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | None |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| actions | varies | Any additional alert actions triggered by this alert. |
| alert_type | varies | Indicates if the alert was historical or real-time. |
| digest_mode | varies |  |
| expiration_time_rendered | varies |  |
| savedsearch_name | varies | Name of the saved search that triggered the alert. |
| severity | varies | Indicates the severity level of an alert. Severity level ranges from Info, Low, Medium, High, and Critical. Default is Medium. Severity levels are informational in purpose and have no additional functionality. |
| sid | varies | The search ID of the search that triggered the alert. |
| trigger_time | varies | The time the alert was triggered. |
| trigger_time_rendered | varies |  |
| triggered_alerts | varies |  |
| *(notes)* | text | Application usage |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/alerts/fired_alerts/MyAlert
```


### DELETE `/services/alerts/fired_alerts/{name}`

Delete the record of this triggered alert.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Response keys |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/alerts/fired_alerts/scheduler__admin__search_aGF2ZV9ldmVudHM_at_1310437740_5d3dfde563194ffd_1310437749
```



---
