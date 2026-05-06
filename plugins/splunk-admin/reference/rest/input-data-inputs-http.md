# /services/data/inputs/http

Access or update HTTP Event Collector global configuration tokens and application tokens.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/http`, `/services/data/inputs/http/{name}`, `/services/data/inputs/http/{name}/disable`, `/services/data/inputs/http/{name}/enable`, `/services/data/inputs/http/{name}/rotate`


## /services/data/inputs/http

Access or update HTTP Event Collector global configuration tokens and application tokens.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/http` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/http`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

See`data/inputs/http/{name}` for app-level response data keys.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/http?output_mode=json'
```

## POST `/services/data/inputs/http`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none documented)* | — | — |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/http'
```


## /services/data/inputs/http/{name}

Manage the {name} HTTP Event Collector token. HTTP , as in data/inputs/http/http , indicates global configuration.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/http/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## DELETE `/services/data/inputs/http/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/inputs/http/{name}'
```

## GET `/services/data/inputs/http/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| _rcvbuf | string | Varies | — | Socket receive buffer size (bytes). |
| dedicatedIoThreads | string | Varies | — | Number of threads for HTTP event collector server. |
| disabled | string | Varies | — | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| enableSSL | string | Varies | — | SSL enablement status. |
| host | string | Varies | — | Host from which the indexer gets data. |
| index | string | Varies | — | Index to store generated events. |
| port | string | Varies | — | HTTP data event collector IP port. |
| source | string | Varies | — | Source for events with this token. |
| sourcetype | string | Varies | — | Sourcetype for events with this token. |
| token | string | Varies | — | Token value for sending data to`collector/event` endpoint. |
| useDeploymentServer | — | — | — | — |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Global response data keys

Indicates whether the event collector input writes its configuration to a deployment server repository.

When this setting is set to`1`(enabled), the input writes its configuration to the directory specified as`repositoryLocation` in`serverclass.conf`.

Copy the full contents of the`splunk_httpinput` app directory to this directory for the configuration to work.

When enabled, only the tokens defined in the`splunk_httpinput` app in this repository are viewable and editable on the API and the Data Inputs page in Splunk Web.

When disabled, the input writes its configuration to`$SPLUNK_HOME/etc/apps` by default.

Defaults to 0 (disabled).

Application-level response data keys

XML Request

curl -u admin:pass https://localhost:8089//servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22/http/%252Fvar%252Flog

curl -u admin:pass https://localhost:8089//servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22/http/%252Fvar%252Flog

XML Response

... http https://localhost:8089/servicesNS/nobody/system/data/inputs/http 2015-01-26T23:01:34-08:00 Splunk ... opensearch elided ... http://%22myapp" https://localhost:8089/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22 2015-01-26T23:01:34-08:00 admin 1572864 0 ... eai:acl elided ... system ... eai:attributes elided ... nobody $decideOnStartup default 3DEA16E1-413A-46C2-A74F-E79DC3DF3CA2

...

<title>http</title>

<id>https://localhost:8089/servicesNS/nobody/system/data/inputs/http</id>

<updated>2015-01-26T23:01:34-08:00</updated>

<generator build="250128" version="20150120"/>

<author>

<name>Splunk</name>

</author>

<link href="/servicesNS/nobody/system/data/inputs/http/_new" rel="create"/>

<link href="/servicesNS/nobody/system/data/inputs/http/_reload" rel="_reload"/>

... opensearch elided ...

<s:messages/>

<entry>

<title>http://%22myapp"</title>

<id>https://localhost:8089/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22</id>

<updated>2015-01-26T23:01:34-08:00</updated>

<link href="/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22" rel="alternate"/>

<author>

<name>admin</name>

</author>

<link href="/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22" rel="list"/>

<link href="/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22/_reload" rel="_reload"/>

<link href="/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22" rel="edit"/>

<link href="/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22" rel="remove"/>

<link href="/servicesNS/nobody/system/data/inputs/http/http%3A%252F%252F%22myapp%22/disable" rel="disable"/>

<content type="text/xml">

<s:dict>

<s:key name="_rcvbuf">1572864</s:key>

<s:key name="disabled">0</s:key>

... eai:acl elided ...

<s:key name="eai:appName">system</s:key>

... eai:attributes elided ...

<s:key name="eai:userName">nobody</s:key>

<s:key name="host">$decideOnStartup</s:key>

<s:key name="index">default</s:key>

<s:key name="token">3DEA16E1-413A-46C2-A74F-E79DC3DF3CA2</s:key>

</s:dict>

</content>

</entry>

### Returned values

| *(none documented)* | — | — |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/http/{name}?output_mode=json'
```

## POST `/services/data/inputs/http/{name}`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | Varies | — | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| host | String | Varies | — | Default host. |
| index | String | Varies | — | Index to store generated events. |
| indexes | String | Varies | — | Set of indexes allowed for events with this token. |
| name | String | Varies | — | Required. Token name (`inputs.conf` key) |
| source | String | Varies | — | Default source for events with this token. |
| sourcetype | String | Varies | — | Default sourcetype for events with this token. |
| useDeploymentServer | Boolean | Varies | — | `0`(disabled) |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

Indicates whether the event collector input writes its configuration to a deployment server repository.

When this setting is set to`1`(enabled), the input writes its configuration to the directory specified as`repositoryLocation` in`serverclass.conf`.

Copy the full contents of the`splunk_httpinput` app directory to this directory for the configuration to work.

When enabled, only the tokens defined in the`splunk_httpinput` app in this repository are viewable and editable on the API and the Data Inputs page in Splunk Web.

When disabled, the input writes its configuration to`$SPLUNK_HOME/etc/apps` by default.

Defaults to 0 (disabled).

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | Socket receive buffer size (bytes). |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| source | varies | Source for events with this token. |
| sourcetype | varies | Sourcetype for events with this token. |
| token | varies | Token value for sending data to`collector/event` endpoint. |
| useDeploymentServer | varies | — |


**Additional returned-field documentation:**

Indicates whether the event collector input writes its configuration to a deployment server repository.

When this setting is set to`1`(enabled), the input writes its configuration to the directory specified as`repositoryLocation` in`serverclass.conf`.

Copy the full contents of the`splunk_httpinput` app directory to this directory for the configuration to work.

When enabled, only the tokens defined in the`splunk_httpinput` app in this repository are viewable and editable on the API and the Data Inputs page in Splunk Web.

When disabled, the input writes its configuration to`$SPLUNK_HOME/etc/apps` by default.

Defaults to 0 (disabled).

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/http/{name}'
```


## /services/data/inputs/http/{name}/disable

Disable the {name} HTTP Event Collector token.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/http/{name}/disable` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## POST `/services/data/inputs/http/{name}/disable`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | Socket receive buffer size (bytes). |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| source | varies | Default source for events with this token. |
| sourcetype | varies | Default sourcetype for events with this token. |
| token | varies | Token value for sending data to`collector/event` endpoint. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/http/{name}/disable'
```


## /services/data/inputs/http/{name}/enable

Enable the {name} HTTP Event Collector token.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/http/{name}/enable` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## POST `/services/data/inputs/http/{name}/enable`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| _rcvbuf | varies | Socket receive buffer size (bytes). |
| disabled | varies | Input disabled indicator:`0`= Input Not disabled,`1`= Input disabled. |
| host | varies | Host from which the indexer gets data. |
| index | varies | Index to store generated events. |
| source | varies | Default source for events with this token. |
| sourcetype | varies | Default sourcetype for events with this token. |
| token | varies | Token value for sending data to`collector/event` endpoint. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/http/{name}/enable'
```


## /services/data/inputs/http/{name}/rotate

Regenerate the {name} token value.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/http/{name}/rotate` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## POST `/services/data/inputs/http/{name}/rotate`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| token | varies | Regenerated token value. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/http/{name}/rotate'
```

