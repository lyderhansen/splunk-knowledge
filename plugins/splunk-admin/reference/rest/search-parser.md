# Search parser endpoints

Parse SPL into semantic structures (legacy endpoint deprecated in favor of v2).

## `/services/search/parser`

Get search language parsing.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/parser` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/parser`

Parses Splunk search language and returns semantic map.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| enable_lookups | Boolean | No | false | If true , reverse lookups are done to expand the search expression. |
| output_mode | String | No | xml | Specify output formatting. Select from either: xml: XML formatting json: JSON formatting |
| parse_only | Boolean | No | false | If true, disables expansion of search due evaluation of subsearches, time term expansion, lookups, tags, eventtypes, sourcetype alias. |
| q | String | Yes |  | The search string to parse. |
| reload_macros | Boolean | No | true | If true, reload macro definitions from macros.conf. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/parser --get -d output_mode=json -d q="search index=os sourcetype=cpu"
```



---

## `/services/search/v2/parser`

Access search language parsing.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/v2/parser` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/search/v2/parser`

Parses Splunk search language and returns semantic map.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| enable_lookups | Boolean | No | false | If true , reverse lookups are done to expand the search expression. |
| output_mode | String | No | xml | Specify output formatting. Select from either: xml: XML formatting json: JSON formatting |
| parse_only | Boolean | No | false | If true, disables expansion of search due evaluation of subsearches, time term expansion, lookups, tags, eventtypes, sourcetype alias. |
| q | String | Yes |  | The search string to parse. |
| reload_macros | Boolean | No | true | If true, reload macro definitions from macros.conf. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/v2/parser -d output_mode=json -d q="search index=os sourcetype=cpu"
```



---
