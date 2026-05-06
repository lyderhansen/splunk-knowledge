# Search typeahead

Retrieve typeahead suggestions for partial SPL.

## `/services/search/typeahead`

Get search string auto-complete suggestions.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/typeahead` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/typeahead`

Get a list of words or descriptions for possible auto-complete terms.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| count | Number | Yes |  | The number of items to return for this term. |
| max_servers | Number | No | 2 | Specifies the maximum number of indexer search peers that are used in addition to the search head for the purpose of providing typeahead functionality. When properly set, max_servers minimizes the workload impact of running typeahead search jobs in an indexer clustering deployment. If your target indexes are evenly distributed among search servers, use the default setting or a similarly low number. For load balancing, the choice of search peers for typeahead searches is random. A setting of 0 means "no limit": All available search peers are used for typeahead search jobs. |
| output_mode | String | No | csv | Specify output formatting. Select from: csv: CSV formatting xml: XML formatting json: JSON formatting |
| prefix | String | Yes |  | The term for which to return typeahead results. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | None |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/typeahead --get -d count=3 -d prefix=source -d output_mode=json max_servers=1
```



---
