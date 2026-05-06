# /services/data/ui/global-banner

View or create a global banner.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/ui/global-banner` |
| Auth required | Yes |
| Capability | edit_global_banner |

## GET /services/data/ui/global-banner
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| background_color | Various | Indicates the color of the banner. |
| hyperlink | Various | The link included in the banner. |
| hyperlink_text | Various | Display text for the link in the banner. |
| message | Various | Banner notification text. |
| visible | Various | Boolean value indicating whether the banner is visible. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/nobody/system/data/ui/global-banner/BANNER_MESSAGE_SINGLETON
```

## POST /services/data/ui/global-banner
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | blue |
| optional | String | No | — | The link included in the banner. The link must begin with`http://` or`https://`. |
| optional | String | No | — | Display text for the link in the banner. |
| required | String | No | sample text | Banner notification text. |
| required | Boolean | No | false | Indicates whether the banner is visible. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| background_color | Various | Indicates the color of the banner. |
| hyperlink | Various | The link included in the banner. |
| hyperlink_text | Various | Display text for the link in the banner. |
| message | Various | Banner notification text. |
| visible | Various | Boolean value indicating whether the banner is visible. |

### Example
```
curl -X POST -k -u admin:pass https://localhost:8089/servicesNS/nobody/system/data/ui/global-banner/BANNER_MESSAGE_SINGLETON -d global_banner.message="example banner message"
```

---

# /servicesNS/{user}/{app_name}/data/ui/panels

View, add, or edit dashboard panels.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{user}/{app_name}/data/ui/panels` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /servicesNS/{user}/{app_name}/data/ui/panels
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | App context for the panel. |
| eai:data | String | XML definition for the panel. |
| eai:userName | String | User who created the panel. |
| label | Various | Panel label. |
| panel.title | Various | Panel title. |
| rootNode | Various | XML root node. |

### Example
```
curl --get -k -u username:password https://localhost:8089/servicesNS/admin/search/data/ui/panels
```

## POST /servicesNS/{user}/{app_name}/data/ui/panels
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | No | — | Panel name. |
| eai:data | XML document | No | — | Panel XML definition. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | App context for the panel. |
| eai:data | String | XML definition for the panel. |
| eai:userName | String | User who created the panel. |
| label | Various | Panel label. |
| panel.title | Various | Panel title. |
| rootNode | Various | XML root node. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/ui/panels -d "name=new_panel&eai:data= the_new_label "
```

---

# /servicesNS/{user}/{app_name}/data/ui/views

View or create a dashboard source XML definition.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{user}/{app_name}/data/ui/views` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /servicesNS/{user}/{app_name}/data/ui/views
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | App context for the dashboard. |
| eai:data | String | XML definition for the dashboard. |
| eai:type | String | User interface type. For dashboards, this type is`view`. |
| eai:userName | String | User who created the dashboard. |
| isDashboard | Various | Boolean value indicating whether the knowledge object is a dashboard. |
| isVisible | Various | Boolean value indicating whether the dashboard is visible. |
| label | Various | Dashboard label. |
| rootNode | Various | XML root node. |

### Example
```
curl --get -k -u username:password https://localhost:8089/servicesNS/admin/search/data/ui/views
```

## POST /servicesNS/{user}/{app_name}/data/ui/views
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | No | — | Dashboard name. |
| eai:data | XML document | No | — | Dashboard XML definition. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | App context for the dashboard. |
| eai:data | String | XML definition for the dashboard. |
| eai:type | String | User interface type. For dashboards, this type is`view`. |
| eai:userName | String | User who created the dashboard. |
| isDashboard | Various | Boolean value indicating whether the knowledge object is a dashboard. |
| isVisible | Various | Boolean value indicating whether the dashboard is visible. |
| label | Various | Dashboard label. |
| rootNode | Various | XML root node. |

### Example
```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/data/ui/views -d "name=new_dashboard&eai:data= the_new_label "
```

---

# /servicesNS/{user}/{app_name}/data/ui/views/{name}

Access or update source XML for an existing dashboard.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{user}/{app_name}/data/ui/views/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /servicesNS/{user}/{app_name}/data/ui/views/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | App context for the dashboard. |
| eai:data | String | XML definition for the dashboard. |
| eai:type | String | User interface type. For dashboards, this type is`view`. |
| eai:userName | String | User who created the dashboard. |
| isDashboard | Various | Boolean value indicating whether the knowledge object is a dashboard. |
| isVisible | Various | Boolean value indicating whether the dashboard is visible. |
| label | Various | Dashboard label. |
| rootNode | Various | XML root node. |

### Example
```
curl -k -u username:password https://localhost:8089/servicesNS/admin/search/data/ui/views/my_dashboard
```

## POST /servicesNS/{user}/{app_name}/data/ui/views/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| optional | string | No | — | Enables to specify a revision message when modifying a dashboard. The message appears in the response from the`data/ui/views/{name}/history` endpoint. |
| eai:data | XML document | No | — | Dashboard XML definition. |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| eai:appName | String | App context for the dashboard. |
| eai:data | String | XML definition for the dashboard. |
| eai:type | String | User interface type. For dashboards, this type is`view`. |
| eai:userName | String | User who created the dashboard. |
| isDashboard | Various | Boolean value indicating whether the knowledge object is a dashboard. |
| isVisible | Various | Boolean value indicating whether the dashboard is visible. |
| label | Various | Dashboard label. |
| rootNode | Various | XML root node. |

### Example
```
curl -X POST -u username:password -k "https://localhost:8106/servicesNS/admin/search/data/ui/views/my_dashboard?output_mode=json" \ > -d eai:data=" new label " \ > -d eai:changelog="Second version"
```

## DELETE /servicesNS/{user}/{app_name}/data/ui/views/{name}
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| optional | string | No | — | Enables to specify a message when deleting a dashboard. |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -X DELETE -u username:password -k "https://localhost:8106/servicesNS/admin/search/data/ui/views/my_dashboard?output_mode=json" \ > -d eai:changelog="Removed as agreed on Sep. 15"
```

---

# /servicesNS/{user}/{app_name}/data/ui/views/{name}/history

View the revision history of a {name} dashboard.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{user}/{app_name}/data/ui/views/{name}/history` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /servicesNS/{user}/{app_name}/data/ui/views/{name}/history
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| optional | String | No | — | . |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -X GET -u admin:changeme -k "https://localhost:8106/servicesNS/admin/search//data/ui/views/my_dashboard/history?output_mode=json"
```

---

# /servicesNS/{user}/{app_name}/data/ui/views/{name}/revision

View a specific revision of a {name} dashboard.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/servicesNS/{user}/{app_name}/data/ui/views/{name}/revision` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /servicesNS/{user}/{app_name}/data/ui/views/{name}/revision
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| required | String | No | — | . |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -X GET -u admin:changeme -k "https://localhost:8106/servicesNS/admin/search/data/ui/views/my_dashboard/revision?output_mode=json" -d revision_id=2e5ec14d8c59e466eb019836f494dc86e3a6b34f"
```
