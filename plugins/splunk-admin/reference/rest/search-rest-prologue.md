# Search REST API — versioning and usage

High-level notes from the Splunk Search REST endpoint topic (not tied to a single `/services/...` path).

**Category:** Search


## Topic: Semantic API versioning

Beginning with Splunk Enterprise version 9.0.1 and Splunk Cloud Platform version 9.0.2208, some REST API endpoints are available in multiple versions. The v1 instances of some endpoints are deprecated and disabled, and v2 instances of these endpoints are available. Plan to migrate to the v2 instances of each of the following endpoints:

### Summary text

Beginning with Splunk Enterprise version 9.0.1 and Splunk Cloud Platform version 9.0.2208, some REST API endpoints are available in multiple versions. The v1 instances of some endpoints are deprecated and disabled, and v2 instances of these endpoints are available. Plan to migrate to the v2 instances of each of the following endpoints:
search/v2/jobs/export
search/v2/jobs/{search_id}/events
search/v2/jobs/{search_id}/results
search/v2/jobs/{search_id}/results_preview
search/v2/parser
You can address all original v1 endpoints either without a version number or with a v1 in the URI, but you can address v2 endpoints only with a v2 in the URI. Refer to the individual v2 endpoints for examples.
Legacy versioning deprecation
Beginning with Splunk Enterprise 9.0.1, the legacy versioning scheme from Splunk Enterprise 6.1 and lower is deprecated and will be removed in future versions of Splunk Enterprise. REST API endpoint behavior will not vary by Splunk Enterprise product version, but rather by API version only.
Do not include a Splunk Enterprise version number in URIs. Plan to migrate to the semantic versioning scheme with only v1 or v2 specified in URIs.
Avoid versioning endpoints like the following example:
CODE
Copy
https://localhost:8089/v6.1/services/search/jobs/export
https://localhost:8089/v6.1/services/search/jobs/export
Instead, refer to this v1 endpoint without any version or with v1 only, like the following example:
CODE
Copy
https://localhost:8089/services/search/jobs/export
https://localhost:8089/services/search/jobs/export
CODE
Copy
https://localhost:8089/services/search/v1/jobs/export
https://localhost:8089/services/search/v1/jobs/export
Refer to this v2 endpoint like the following example:
CODE
Copy
https://localhost:8089/services/search/v2/jobs/export
https://localhost:8089/services/search/v2/jobs/export
Locate the source of your deprecated REST calls
If any apps or users in your environment are still using deprecated REST API version 1.0 endpoints, you should identify the source of the calls and transition all apps and users to version 2 instances of those endpoints.
Identify which apps are making deprecated REST calls by running the following search, which lists the calls to each deprecated endpoint in use by any apps in your environment.
CODE
Copy
index=_internal source=*splunkd*.log "A REST call to the deprecated endpoint"
index=_internal source=*splunkd*.log "A REST call to the deprecated endpoint"
Once you have identified which apps are using the deprecated endpoints, update the apps to make sure that they call version 2 instances of those endpoints instead.
After you're sure that all apps in your environment have been upgraded to the version 2 REST API endpoints, check whether any users are still calling the deprecated endpoints. Run the following search, which lists the users and deprecated endpoints they are calling.
CODE
Copy
index=_internal (sourcetype=splunkd_access) method="GET"
| where 
    uri like "%/results_preview?search=%"
    OR uri like "%/results_preview?%&search=%"
  
    OR uri like "%/events?search=%"
    OR uri like "%/events?%&search=%"
  
    OR uri like "%/results?search=%"
    OR uri like "%/results?%&search=%"
  
    OR uri like "%/jobs/export?search=%"
    OR uri like "%/jobs/export?%&search=%"
    OR uri like "%/jobs/export%"
  
    OR uri like "%/parser%"
| table uri, user, useragent
index=_internal (sourcetype=splunkd_access) method="GET"
| where 
    uri like "%/results_preview?search=%"
    OR uri like "%/results_preview?%&search=%"
  
    OR uri like "%/events?search=%"
    OR uri like "%/events?%&search=%"
  
    OR uri like "%/results?search=%"
    OR uri like "%/results?%&search=%"
  
    OR uri like "%/jobs/export?search=%"
    OR uri like "%/jobs/export?%&search=%"
    OR uri like "%/jobs/export%"
  
    OR uri like "%/parser%"
| table uri, user, useragent
Now that you know which users are calling deprecated endpoints, let them know that they must upgrade to version 2 instances of those endpoints.
Turn on deprecated endpoints
Deprecated REST API for search version 1.0 endpoints are turned off by default in Splunk Enterprise and Splunk Cloud. However, if your organization has business-critical apps that still need to use the deprecated endpoints, and you need more time before upgrading the apps to use the new endpoints, you can turn on the deprecated endpoints for a limited time. The endpoints will be removed in a future release, so turning them on should be considered only a temporary, short-term fix.
Splunk Cloud Platform
To turn on deprecated API version 1.0 endpoints in your environment, request help from Splunk Support. If you have a support contract, file a new case using the Splunk Support Portal at
Support and Services
. Otherwise, contact
Splunk Customer Support
.
Splunk Enterprise
To turn on deprecated API version 1.0 endpoints in your environment, follow these steps.
Prerequisites
Have the permissions to edit configuration files. Only users with file system access, such as system administrators, can edit configuration files.
Know how to edit configuration files. Review the steps in
How to edit a configuration file
in the
Splunk Enterprise Admin Manual
.
Decide which directory to store configuration file changes in. There can be configuration files with the same name in your default, local, and app directories. See
Where you can place (or find) your modified configuration files
in the
Splunk Enterprise Admin Manual
.
CAUTION:
Never change or copy the configuration files in the default directory. The files in the default directory must remain intact and in their original location. Make changes to the files in the local directory.
Steps
Open or create a local restmap.conf file at $SPLUNK_HOME/etc/system/local.
In the
[global]
stanza, set
v1APIBlockGETSearchLaunch
to
false
.
To make the changes to the restmap.conf file take effect, you can either restart all impacted search heads, or reload the restmap.conf file by running the following REST API endpoints on each search head:
/services/configs/conf-restmap/_reload
/services/server/control/restart_webui
/services/server/control/restart_webui_polite
When you are ready to turn off deprecated endpoints again, set
v1APIBlockGETSearchLaunch=true
.

## Topic: Usage details

To check Access Control List (ACL) properties for an endpoint, append /acl to the path. For more information see Access Control List in the REST API User Manual .

### Summary text

Review ACL information for an endpoint
To check Access Control List (ACL) properties for an endpoint, append
/acl
to the path. For more information see
Access Control List
in the
REST API User Manual
.
Authentication and Authorization
Username and password authentication is required for access to endpoints and REST operations.
Splunk users must have role and/or capability-based authorization to use REST endpoints. Users with an administrative role, such as
admin
, can access authorization information in Splunk Web. To view the roles assigned to a user, select
Settings
>
Access controls
and click
Users
. To determine the capabilities assigned to a role, select
Settings
>
Access controls
and click
Roles
.
App and user context
Typically, knowledge objects, such as saved searches or event types, have an app/user context that is the namespace. For more information about specifying a namespace, see
Namespace
in the
REST API User Manual
.
Splunk Cloud URL for REST API access
Splunk Cloud has a different host and management port syntax than Splunk Enterprise. Use the following URL for Splunk Cloud deployments. If necessary, submit a support case using the
Splunk Support Portal
to open port 8089 on your deployment.
CODE
Copy
https://<deployment-name>.splunkcloud.com:8089
https://<deployment-name>.splunkcloud.com:8089
Free trial Splunk Cloud accounts cannot access the REST API.
See
Using the REST API in Splunk Cloud
in the the
Splunk REST API Tutorials
for more information.
