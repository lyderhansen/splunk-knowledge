# /services/data/outputs/tcp/syslog

Access the configuration of a forwarded server configured to provide data in standard syslog format.

**Category:** Output

**Related REST paths in this file:** `/services/data/outputs/tcp/syslog`, `/services/data/outputs/tcp/syslog/{name}`


## /services/data/outputs/tcp/syslog

Access the configuration of a forwarded server configured to provide data in standard syslog format.

**Category:** Output

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/outputs/tcp/syslog` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/outputs/tcp/syslog`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Specifies whether global syslog configuration is disabled. |
| server | varies | Specifies server:port where data is forwarded. |
| type | varies | Specifies whether tcp or udp is used to forward data. If unspecified, udp is used. Valid values : (tcp |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/outputs/tcp/syslog?output_mode=json'
```

## POST `/services/data/outputs/tcp/syslog`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | If true, disables global syslog settings. |  |
| required | String | Varies | Name of the syslog output group. This is name used when creating syslog configuration in`outputs.conf`. |  |
| priority | Number | Varies |  |  |
| server | String | Varies | host:port of the server where syslog data should be sent |  |
| syslogSourceType | String | Varies |  |  |
| timestampformat | String | Varies |  |  |
| type | String | Varies | Protocol to use to send syslog data. Valid values: (tcp | udp ). |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

name

Sets syslog priority value.

The priority value should specified as an integer. See $SPLUNK_HOME/etc/system/README/outputs.conf.spec for details.

Specifies a rule for handling data in addition to that provided by the "syslog" sourcetype. By default, there is no value for syslogSourceType.

This string is used as a substring match against the sourcetype key. For example, if the string is set to 'syslog', then all source types containing the string "syslog" receives this special treatment.

To match a source type explicitly, use the pattern "sourcetype::sourcetype_name." For example

syslogSourcetype = sourcetype::apache_common

Data that is "syslog" or matches this setting is assumed to already be in syslog format.

Data that does not match the rules has a header, potentially a timestamp, and a hostname added to the front of the event. This is how Splunk software causes arbitrary log data to match syslog expectations.

Format of timestamp to add at start of the events to be forwarded.

The format is a strftime-style timestamp formatting string. See $SPLUNK_HOME/etc/system/README/outputs.conf.spec for details.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/outputs/tcp/syslog'
```


## /services/data/outputs/tcp/syslog/{name}

Manage configuration for the {name} forwarder.

**Category:** Output

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/outputs/tcp/syslog/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/outputs/tcp/syslog/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/outputs/tcp/syslog/{name}'
```

## GET `/services/data/outputs/tcp/syslog/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | varies | Specifies whether global syslog configuration is disabled. |
| server | varies | Specifies server:port where data is forwarded. |
| type | varies | Specifies whether tcp or udp is used to forward data. If unspecified, udp is used. Valid values : (tcp |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/outputs/tcp/syslog/{name}?output_mode=json'
```

## POST `/services/data/outputs/tcp/syslog/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | If true, disables global syslog settings. |  |
| priority | Number | Varies |  |  |
| server | String | Varies | host:port of the server where syslog data should be sent |  |
| syslogSourceType | String | Varies |  |  |
| timestampformat | String | Varies |  |  |
| type | String | Varies | Protocol to use to send syslog data. Valid values: (tcp | udp ). |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Sets syslog priority value.

The priority value should specified as an integer. See $SPLUNK_HOME/etc/system/README/outputs.conf.spec for details.

Specifies a rule for handling data in addition to that provided by the "syslog" sourcetype. By default, there is no value for syslogSourceType.

This string is used as a substring match against the sourcetype key. For example, if the string is set to 'syslog', then all source types containing the string "syslog" receives this special treatment.

To match a source type explicitly, use the pattern "sourcetype::sourcetype_name." For example

syslogSourcetype = sourcetype::apache_common

Data that is "syslog" or matches this setting is assumed to already be in syslog format.

Data that does not match the rules has a header, potentially a timestamp, and a hostname added to the front of the event. This is how Splunk software causes arbitrary log data to match syslog expectations.

Format of timestamp to add at start of the events to be forwarded.

The format is a strftime-style timestamp formatting string. See $SPLUNK_HOME/etc/system/README/outputs.conf.spec for details.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/outputs/tcp/syslog/{name}'
```

