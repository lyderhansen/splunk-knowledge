# /services/datamodel/acceleration

Access information about data models that have acceleration enabled.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/datamodel/acceleration` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/datamodel/acceleration
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| *(none documented)* | — | — |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/datamodel/acceleration?output_mode=json
```

---

# /services/datamodel/acceleration/{name}

Get information about the {name} datamodel. Note: This endpoint is deprecated.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/datamodel/acceleration/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/datamodel/acceleration/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| acceleration | Various | Indicates if acceleration is enabled for this data model. |
| acceleration.earliest_time | Various | The earliest time to dispatch the search. |
| search | Various | Specifies the search to accelerate this data model. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/datamodel/acceleration/simpleMyAppModel
```

---

# /services/datamodel/model

Access or create data models.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/datamodel/model` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/datamodel/model
### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|

### Returned values
| Name | Type | Description |
|------|------|-------------|
| acceleration | Various | Indicates whether acceleration is enabled for the data model. |
| concise | Various | Indicates whether to list a concise JSON description of the data model. |
| description | Various | The JSON describing the data model. |
| displayName | Various | The name displayed for the data model in Splunk Web. |
| eai:appName | String | The Splunk app in which the data model was created. |
| eai:userName | String | The name of the user who created the data model. |

### Example
```
curl -k -u admin:pass https://localhost:8089/services/datamodel/model
```

---

# /services/datamodel/pivot/{name}

Access pivots that are based on named data models.

**Category:** Knowledge

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/datamodel/pivot/{name}` |
| Auth required | Yes |
| Capability | Role-based (Splunk REST authorization; entity ACLs) |

## GET /services/datamodel/pivot/{name}
### Request parameters
| *(none documented)* | — | No | — | — |

### Returned values
| Name | Type | Description |
|------|------|-------------|
| drilldown_search | Various | The search for running this pivot report using drilldown |
| open_in_search | Various | Equivalent to search parameter, but listed more simply. |
| pivot_json | Various | JSON specifying a pivot based on the named data model. |
| pivot_search | Various | A pivot search command based on the named data model. |
| search | Various | The search string for running the pivot report |
| tstats_search | Various | The search for running this pivot report using tstats |

### Example
```
curl -k -u admin:pass -G https://localhost:8089/services/datamodel/pivot/Authentication --data-urlencode pivot_search='| pivot Authentication Untagged_Authentication count(Untagged_Authentication) AS "Count of Untagged Authentication (S.o.S)"'
```
