# Scheduled views

Operate scheduled dashboards/views similarly to saved searches.

## `/services/scheduled/views`

Access views scheduled for PDF delivery. Scheduled views are dummy noop scheduled saved searches that email a PDF of a dashboard.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/scheduled/views` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/scheduled/views`

List all scheduled view objects.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Pagination and filtering parameters |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.email | varies | Indicates the state of the email action. |
| action.email.pdfview | varies | Name of the view to send as a PDF. |
| action.email.sendpdf | varies | Indicates whether to create and send the results as a PDF. |
| action.email.sendresults | varies | Indicates whether the search results are included in the email. The results can be attached or inline. |
| action.email.to | varies | List of recipient email addresses. Required if the email alert action is enabled. |
| action.email.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |
| cron_schedule | varies | The cron schedule to use for delivering the view. Scheduled views are dummy/noop scheduled saved searches that email a pdf version of a view For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. |
| description | varies | Description of this scheduled view object. |
| disabled | varies | Indicates if the scheduled view is disabled. |
| is_scheduled | varies | Indicates if PDF delivery of this view is scheduled. |
| next_scheduled_time | varies | The next time when the view is delivered. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/scheduled/views
```



---

## `/services/scheduled/views/{name}`

Manage the {name} scheduled view.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/scheduled/views/{name}` |
| Auth required | Yes |
| Capability | `search` |

### DELETE `/services/scheduled/views/{name}`

Delete a scheduled view.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass --request DELETE https://localhost:8089/servicesNS/admin/search/scheduled/views/MyView
```


### GET `/services/scheduled/views/{name}`

Access a scheduled view.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.email | varies | Indicates the sate of the email action. |
| action.email.auth_password | varies | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here and it is encrypted on the next restart. Defaults to empty string. |
| action.email.auth_username | varies | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |
| action.email.bcc | varies | "BCC email address to use if action.email is enabled. |
| action.email.cc | varies | CC email address to use if action.email is enabled. |
| action.email.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.email.format | varies | Specify the format of text in the email. This value also applies to any attachments.< Valid values: (plain \| html \| raw \| csv) |
| action.email.from | varies | Email address from which the email action originates. Defaults to splunk@$LOCALHOST or whatever value is set in alert_actions.conf. |
| action.email.hostname | varies | Sets the hostname used in the web link (url) sent in email actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) When this value is a simple hostname, the protocol and port which are configured within splunk are used to construct the base of the url. When this value begins with ' http://' , it is used verbatim. NOTE: This means the correct port must be specified if it is not the default port for http or https. This is useful in cases when the Splunk server is not aware of how to construct a url that can be externally referenced, such as SSO environments, other proxies, or when the server hostname is not generally resolvable. Defaults to current hostname provided by the operating system, or if that fails "localhost". When set to empty, default behavior is used. |
| action.email.inline | varies | Indicates whether the search results are contained in the body of the email. Results can be either inline or attached to an email. See action.email.sendresults. |
| action.email.mailserver | varies | Set the address of the MTA server to be used to send the emails. Defaults to <LOCALHOST> (or whatever is set in alert_actions.conf). |
| action.email.maxresults | varies | Sets the global maximum number of search results to send when email.action is enabled. |
| action.email.maxtime | varies | Specifies the maximum amount of time the execution of an email action takes before the action is aborted. |
| action.email.pdfview | varies | The name of the view to deliver if sendpdf is enabled. |
| action.email.preprocess_results | varies | Search string to preprocess results before emailing them. Defaults to empty string (no preprocessing). Usually the preprocessing consists of filtering out unwanted internal fields. |
| action.email.reportPaperOrientation | varies | Specifies the paper orientation: portrait or landscape. |
| action.email.reportPaperSize | varies | Specifies the paper size for PDFs. Defaults to letter. Valid values: (letter \| legal \| ledger \| a2 \| a3 \| a4 \| a5) |
| action.email.sendpdf | varies | Indicates whether to create and send the results as a PDF. |
| action.email.sendresults | varies | Indicates whether to attach the search results in the email. Results can be either attached or inline. See action.email.inline. |
| action.email.subject | varies | Specifies the email subject. Defaults to SplunkAlert-<savedsearchname>. |
| action.email.to | varies | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |
| action.email.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.email.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |
| action.email.use_ssl | varies | Indicates whether to use SSL when communicating with the SMTP server |
| action.email.use_tls | varies | Indicates whether to use TLS (transport layer security) when communicating with the SMTP server (starttls). |
| cron_schedule | varies | The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. Valid values: cron string |
| description | varies | Description of this saved search for this view. |
| disabled | varies | Indicates if the saved search for this view is disabled. |
| is_scheduled | varies | Indicates if this search is to be run on a schedule. |
| next_scheduled_time | varies | The next time when the view is delivered. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/scheduled/views/MyView
```


### POST `/services/scheduled/views/{name}`

Update a scheduled view.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action.email.to | String | Yes |  | Comma or semicolon separated list of email addresses to send the view to |
| action.email* | String | No |  | Wildcard argument that accepts any email action. |
| cron_schedule | String | Yes |  | The cron schedule to use for delivering the view. Scheduled views are dummy/noop scheduled saved searches that email a pdf version of a view. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. |
| description | String | No |  | User readable description of this scheduled view object |
| disabled | Boolean | No | 0 | Whether this object is enabled or disabled |
| is_scheduled | Boolean | Yes |  | Whether this pdf delivery should be scheduled |
| next_scheduled_time | String | No |  | The next time when the view is delivered. Ignored on edit, here only for backwards compatability. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.email | varies | Indicates the status of the email action. |
| action.email.auth_password | varies | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here that is encrypted on the next restart. Defaults to empty string. |
| action.email.auth_username | varies | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |
| action.email.bcc | varies | BCC email address to use if action.email is enabled. |
| action.email.cc | varies | CC email address to use if action.email is enabled. |
| action.email.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.email.format | varies | Specify the format of text in the email. This value also applies to any attachments.< Valid values: (plain \| html \| raw \| csv) |
| action.email.from | varies | Email address from which the email action originates |
| action.email.hostname | varies | Sets the hostname used in the web link (url) sent in email actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) When this value is a simple hostname, the protocol and port which are configured within splunk are used to construct the base of the url. When this value begins with ' http://' , it is used verbatim. NOTE: This means the correct port must be specified if it is not the default port for http or https. This is useful in cases when the Splunk server is not aware of how to construct an externally referencable url, such as SSO environments, other proxies, or when the server hostname is not generally resolvable. Defaults to current hostname provided by the operating system, or if that fails "localhost". When set to empty, default behavior is used. |
| action.email.inline | varies | Indicates whether the search results are contained in the body of the email. Results can be either inline or attached to an email. See action.email.sendresults. |
| action.email.mailserver | varies | Set the address of the MTA server to be used to send the emails. Defaults to <LOCALHOST> (or whatever is set in alert_actions.conf). |
| action.email.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.email.maxtime | varies | Specifies the maximum amount of time the execution of an email action takes before the action is aborted. |
| action.email.pdfview | varies | The name of the view to deliver if sendpdf is enabled. |
| action.email.preprocess_results | varies | Search string to preprocess results before emailing them. Defaults to empty string (no preprocessing). Usually the preprocessing consists of filtering out unwanted internal fields. |
| action.email.reportPaperOrientation | varies | Specifies the paper orientation: portrait or landscape. |
| action.email.reportPaperSize | varies | Specifies the paper size for PDFs. Defaults to letter. Valid values: (letter \| legal \| ledger \| a2 \| a3 \| a4 \| a5) |
| action.email.sendpdf | varies | Indicates whether to create and send the results as a PDF. |
| action.email.sendresults | varies | Indicates whether to attach the search results in the email. Results can be either attached or inline. See action.email.inline. |
| action.email.subject | varies | Specifies an email subject. Defaults to SplunkAlert-<savedsearchname>. |
| action.email.to | varies | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |
| action.email.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.email.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |
| action.email.use_ssl | varies | Indicates whether to use SSL when communicating with the SMTP server. |
| action.email.use_tls | varies | Indicates whether to use TLS (transport layer security) when communicating with the SMTP server (starttls). |
| cron_schedule | varies | The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. Valid values: cron string |
| description | varies | Description of the saved search for this view. |
| disabled | varies | Indicates if the saved search for this view is disabled. |
| is_scheduled | varies | Indicates if this search is to be run on a schedule. |
| next_scheduled_time | varies | The next time when the view is delivered. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/scheduled/views/MyVew -d action.email.to="info@example.com" -d cron_schedule="0 * * * *" -d is_scheduled=1 -d description="New description"
```



---

## `/services/scheduled/views/{name}/dispatch`

Dispatch the scheduled search associated with the {name} scheduled view.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/scheduled/views/{name}/dispatch` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/scheduled/views/{name}/dispatch`

Dispatch the scheduled search associated with the {name} scheduled view.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| args.* | String | No |  | Wildcard argument that accepts any saved search template argument, such as arg.username=foobar when the search is search $username$. |
| dispatch.* | String | No |  | Wildcard argument that accepts any dispatch related argument. |
| dispatch.now | Boolean | No |  | Dispatch the search as if the specified time for this parameter was the current time. |
| force_dispatch | Boolean | No |  | Indicates whether to start a new search even if another instance of this search is already running. |
| now | String | No |  | [Deprecated] Use dispatch.now . |
| trigger_actions | Boolean | No |  | Indicates whether to trigger alert actions |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/scheduled/views/MyView/dispatch -d trigger_actions=1
```



---

## `/services/scheduled/views/{name}/history`

List search jobs used to render the {name} scheduled view.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/scheduled/views/{name}/history` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/scheduled/views/{name}/history`

List search jobs used to render the {name} scheduled view.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(inline notes)* | text | No | — | Standard Splunk REST parameters apply where documented (for example pagination); see Splunk REST API Reference prolog. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(varies)* | mixed | Atom/JSON feed payload follows Splunk REST conventions for this resource. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/servicesNS/admin/search/scheduled/views/MyVew/history
```



---

## `/services/scheduled/views/{name}/reschedule`

Schedule the {name} view PDF delivery.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/scheduled/views/{name}/reschedule` |
| Auth required | Yes |
| Capability | `search` |

### POST `/services/scheduled/views/{name}/reschedule`

Schedule the {name} view PDF delivery.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| schedule_time | String | No |  | Absolute or relative schedule time. |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| *(notes)* | text | Application usage |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/scheduled/views/_ScheduledView__dashboard2/reschedule -d schedule_time=2013-02-15T14:11:01Z
```



---

## `/services/scheduled/views/{name}/scheduled_times`

Get scheduled view times.

### Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/scheduled/views/{name}/scheduled_times` |
| Auth required | Yes |
| Capability | `search` |

### GET `/services/scheduled/views/{name}/scheduled_times`

Get scheduled view times.

#### Request parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| earliest_time | String | No |  | Absolute or relative earliest time |
| latest_time | String | No |  | Absolute or relative latest time |

#### Returned values
| Name | Type | Description |
|------|------|-------------|
| action.email | varies | Indicates the state of the email action. |
| action.email.auth_password | varies | The password to use when authenticating with the SMTP server. Normally this value is set when editing the email settings, however you can set a clear text password here that is encrypted on the next restart. Defaults to empty string. |
| action.email.auth_username | varies | The username to use when authenticating with the SMTP server. If this is empty string, no authentication is attempted. Defaults to empty string. Note: Your SMTP server might reject unauthenticated emails. |
| action.email.bcc | varies | BCC email address to use if action.email is enabled. |
| action.email.cc | varies | CC email address to use if action.email is enabled. |
| action.email.command | varies | The search command (or pipeline) which is responsible for executing the action. Generally the command is a template search pipeline which is realized with values from the saved search. To reference saved search field values wrap them in $, for example to reference the savedsearch name use $name$, to reference the search use $search$. |
| action.email.format | varies | Specify the format of text in the email. This value also applies to any attachments.< Valid values: (plain \| html \| raw \| csv) |
| action.email.from | varies | Email address from which the email action originates. |
| action.email.hostname | varies | Sets the hostname used in the web link (url) sent in email actions. This value accepts two forms: hostname (for example, splunkserver, splunkserver.example.com) protocol://hostname:port (for example, http://splunkserver:8000 , https://splunkserver.example.com:443 ) When this value is a simple hostname, the protocol and port which are configured within splunk are used to construct the base of the url. When this value begins with ' http://' , it is used verbatim. NOTE: This means the correct port must be specified if it is not the default port for http or https. This is useful in cases when the Splunk server is not aware of how to construct a url that can be externally referenced, such as SSO environments, other proxies, or when the server hostname is not generally resolvable. Defaults to current hostname provided by the operating system, or if that fails "localhost". When set to empty, default behavior is used. |
| action.email.inline | varies | Indicates whether the search results are contained in the body of the email. Results can be either inline or attached to an email. See action.email.sendresults. |
| action.email.mailserver | varies | Set the address of the MTA server to be used to send the emails. Defaults to <LOCALHOST> (or whatever is set in alert_actions.conf). |
| action.email.maxresults | varies | Sets the maximum number of search results sent using alerts. |
| action.email.maxtime | varies | Specifies the maximum amount of time the execution of an email action takes before the action is aborted. |
| action.email.pdfview | varies | The name of the view to deliver if sendpdf is enabled. |
| action.email.preprocess_results | varies | Search string to preprocess results before emailing them. Defaults to empty string (no preprocessing). Usually the preprocessing consists of filtering out unwanted internal fields. |
| action.email.reportPaperOrientation | varies | Specifies the paper orientation: portrait or landscape. |
| action.email.reportPaperSize | varies | Specifies the paper size for PDFs. Defaults to letter. Valid values: (letter \| legal \| ledger \| a2 \| a3 \| a4 \| a5) |
| action.email.reportServerEnabled | varies | Not supported. |
| action.email.reportServerURL | varies | Not supported. |
| action.email.sendpdf | varies | Indicates whether to create and send the results as a PDF. |
| action.email.sendresults | varies | Indicates whether to attach the search results in the email. Results can be either attached or inline. See action.email.inline. |
| action.email.subject | varies | Specifies an email subject. Defaults to SplunkAlert-<savedsearchname>. |
| action.email.to | varies | List of recipient email addresses. Required if this search is scheduled and the email alert action is enabled. |
| action.email.track_alert | varies | Indicates whether the execution of this action signifies a trackable alert. |
| action.email.ttl | varies | Specifies the minimum time-to-live in seconds of the search artifacts if this action is triggered. If p follows <Integer>, int is the number of scheduled periods. Defaults to 86400 (24 hours). If no actions are triggered, the artifacts have their ttl determined by dispatch.ttl in savedsearches.conf. Valid values are Integer[p]. |
| action.email.use_ssl | varies | Indicates whether to use SSL when communicating with the SMTP server. |
| action.email.use_tls | varies | Indicates whether to use TLS (transport layer security) when communicating with the SMTP server (starttls). |
| action.email.width_sort_columns | varies | Indicates whether columns should be sorted from least wide to most wide, left to right. Only valid if format=text. |
| cron_schedule | varies | The cron schedule to execute this search. For example: */5 * * * * causes the search to execute every 5 minutes. cron lets you use standard cron notation to define your scheduled search interval. In particular, cron can accept this type of notation: 00,20,40 * * * *, which runs the search every hour at hh:00, hh:20, hh:40. Along the same lines, a cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43. Splunk recommends that you schedule your searches so that they are staggered over time. This reduces system load. Running all of them every 20 minutes (*/20) means they would all launch at hh:00 (20, 40) and might slow your system every 20 minutes. Valid values: cron string |
| description | varies | Description of the saved search for this view. |
| disabled | varies | Indicates if the saved search for this view is disabled. Disabled saved searches are not visible in Splunk Web. |
| is_scheduled | varies | Indicates if this search is to be run on a schedule. |
| next_scheduled_time | varies | The next time when the view is delivered. |
| *(notes)* | text | Application usage |

#### Example

```
curl -k -u admin:admin https://localhost:8089/services/scheduled/views/_ScheduledView__dashboard_live/scheduled_times --get -d earliest_time=-5h -d latest_time=-3h
```



---
