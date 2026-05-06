# Search time parser

Resolve time modifiers into concrete earliest/latest bounds.

## `/services/search/timeparser`

Get time argument parsing.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/search/timeparser` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/search/timeparser`

Get a lookup table of time arguments to absolute timestamps.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| now | String | No |  | The time to use as current time for relative time identifiers. Can itself either be a relative time (from the real "now" time) or an absolute time in the format specified by time_format . |
| output_time_format | String | No | %FT%T.%Q%:z | Used to format a UTC time. Defaults to the value of time_format . |
| time | String | Yes |  | The time argument to parse. Acceptable inputs are either a relative time identifier or an absolute time. Multiple time arguments can be passed by specifying multiple time parameters. |
| time_format | String | No | %FT%T.%Q%:z | The format ( strftime ) of the absolute time format passed in time. This field is not used if a relative time identifier is provided. For absolute times, the default value is the ISO-8601 format. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | XML Request |
| *(notes)* | text | XML Response |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/search/timeparser --get -d time=-12h -d time=-24h
```



---
