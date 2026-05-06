# authorize.conf

Defines Splunk roles, inherited capabilities, search/index quotas, token auth defaults, and documents each built-in capability stanza.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | authentication.conf |

## Stanzas and settings

### `[default]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `srchFilterSelecting` | `<boolean>` | — | Determines whether a role's search filters are used for selecting or eliminating during role inheritance. If "true", the search filters are used for selecting. The filters are joined with an OR clause when combined. If "false", the search filters are used for eliminating. The filters are joined with an AND clause when combined. Example: role1 srchFilter = sourcetype!=ex1 with selecting=true role2 srchFilter = sourcetype=ex2 with selecting = false role3 srchFilter = sourcet... |

### `[capability::]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | DO NOT edit, remove, or add capability stanzas. The existing capabilities the Splunk platform adds all of its capabilities this way. For the default list of capabilities and assignments, see authorize.conf Only alphanumeric characters and "_" (underscore) are allowed in edit_visualizations view_license1 Descriptions of specific capabilities are listed below. |

### `[role_]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<capability>` | `<enabled>` | — | A capability that is enabled for this role. You can list many capabilities for each role. NOTE: 'enabled' is the only accepted value here, as capabilities are disabled by default. Roles inherit all capabilities from imported roles, and you cannot disable inherited capabilities. Role names cannot have uppercase characters. Usernames, however, are case-insensitive. Role names cannot contain spaces, colons, semicolons, or forward slashes. |
| `importRoles` | `<semicolon-separated list>` | — | A list of other roles and their associated capabilities that the Splunk platform should import. Importing other roles also imports the other aspects of that role, such as allowed indexes to search. Default: A role imports no other roles |
| `grantableRoles` | `<semicolon-separated list>` | — | A list of roles that determines which users, roles, and capabilities that a user with a specific set of permissions can manage. This setting lets you limit the scope of user, role, and capability management that these users can perform. When you set 'grantableRoles', a user that holds a role with the 'edit_roles_grantable' and 'edit_user' capabilities can do only the following with regards to access control management for the Splunk Enterprise instance: They can edit only ... |
| `srchFilter` | `<string>` | — | A list of search filters for this role. Users who hold this role have their searches filtered by the expression provided by this setting. The value for this setting can contain one or more of the following terms: 'source=' 'host=' and host tags 'index=' and index names 'eventtype=' and event type tags 'sourcetype=' search fields wildcards You can use the AND and OR operators to include multiple terms or make searches more restrictive. The value for this setting can't be an... |
| `fieldFilterExemption` | `<comma-separated list>` | — | A list of field filters from which this role is exempt. If a role is exempt from a field filter, the field filter is not run at search time for any users with this role. Roles inherit all field filter exemptions from imported roles. You can't remove inherited field filter exemptions. No default. |
| `srchTimeWin` | `<integer>` | — | Maximum time range, in seconds, of a search. The Splunk platform applies this search time range limit backwards from the latest time specified for a search. If a user has multiple roles with distinct search time range limits, or has roles that inherit from roles with distinct search time range limits, the Splunk platform applies the least restrictive search time range limits to the role. For example, if user X has role A (srchTimeWin = 30s), role B (srchTimeWin = 60s), and... |
| `srchTimeEarliest` | `<integer>` | — | The earliest event time that can be searched, in seconds before the current wall clock time. If a user is a member of a role with a 'srchTimeEarliest' limit, or a role that inherits from other roles with 'srchTimeEarliest' limits, the Splunk platform applies the least restrictive time limit from the roles to the user. For example, if a user is a member of role A (srchTimeEarliest = 86400), and inherits role B (srchTimeEarliest = 3600) and role C (srchTimeEarliest = -1 (def... |
| `srchDiskQuota` | `<integer>` | — | The maximum amount of disk space, in megabytes, that can be used by search jobs for a specific user with this role. In search head clustering environments, this setting takes effect on a per-member basis. There is no cluster-wide accounting. The dispatch manager checks the quota at the dispatch time of a search. Additionally, the search process checks the quota at intervals that are defined in the 'disk_usage_update_period' setting in limits.conf as long as the search is a... |
| `srchJobsQuota` | `<integer>` | — | The maximum number of historical searches that a user who holds this role can run concurrently. A value of 0 means that there is no limit to the number of historical searches that a user who holds this role can run concurrently. If you give the 'enable_cumulative_quota' setting in the limits.conf file a value of "true", then the 'cumulativeSrchJobsQuota' setting in this file also has an effect on the number of concurrent searches that a user who holds this role can run. Fo... |
| `rtSrchJobsQuota` | `<integer>` | — | The maximum number of real-time searches that a user who holds this role can run concurrently. A value of 0 means that there is no limit to the number of real-time search jobs that a user who holds this role can run concurrently. If you give the 'enable_cumulative_quota' setting in the limits.conf file a value of "true", then the 'cumulativeSrchJobsQuota' setting in this file also has an effect on the number of concurrent searches that a user who holds this role can run. F... |
| `queuedSearchQuota` | `<integer>` | — | The maximum number of searches that a user who holds this role can queue concurrently. A value of 0 means that there is no limit to the number of searches that a user who holds this role can queue concurrently. If a user tries to run a search which would queue when they have already reached their queuedSearchQuota, the search will be rejected. Default: 0 |
| `srchMaxTime` | `<integer><unit>` | — | The maximum amount of time that search jobs from specific users with this role are allowed to run. After a search runs for this amount of time, it auto-finalizes. If the role inherits from other roles, the value of the 'srchMaxTime' setting is specified in the included roles. This maximum value does not apply to real-time searches. Examples: 1h, 10m, 2hours, 2h, 2hrs, 100s Default: 100days |
| `srchFederatedProvidersAllowed` | `<semicolon-separated list>` | — | A list of transparent mode federated providers that this role has permission to search. This list can use wildcards ("*") to match multiple federated providers. If a user does not have a role with a 'srchFederatedProvidersAllowed' value, that user's searches go to all available transparent mode federated providers. No default. |
| `srchFederatedProvidersDefault` | `<semicolon-separated list>` | — | The list of transparent mode federated providers that a search by this role runs over. This list can use wildcards ("*") to match multiple federated providers. 'srchFederatedProvidersAllowed' overrides this setting. As a result, if for this role you list a federated provider for 'srchFederatedProvidersDefault' that is not also listed for 'srchFederatedProvidersAllowed', searches by this user that do not list providers will not be sent to that federated provider. Therefore,... |
| `srchIndexesDefault` | `<semicolon-separated list>` | — | A list of indexes to search when no index is specified. These indexes can be wild-carded ("*"), with the exception that "*" does not match internal indexes. To match internal indexes, start with an underscore ("_"). All internal indexes are represented by "_*". The wildcard character "*" is limited to match either all the non-internal indexes or all the internal indexes, but not both at once. No default. |
| `srchIndexesAllowed` | `<semicolon-separated list>` | — | A list of indexes that this role is allowed to search. Follows the same wildcarding semantics as the 'srchIndexesDefault' setting. No default. |
| `srchIndexesDisallowed` | `<semicolon-separated list>` | — | A list of indexes that this role does not have permission to search on or delete. 'srchIndexesDisallowed' takes precedence over 'srchIndexesAllowed', 'srchIndexesDefault' and 'deleteIndexesAllowed'. If you specify indexes in both this setting and the other settings, users will be unable to search on or delete those indexes. Follows the same wildcarding semantics as the 'srchIndexesDefault' setting. If you make any changes in the "Indexes" Settings panel for a role in Splun... |
| `deleteIndexesAllowed` | `<semicolon-separated list>` | — | A list of indexes that this role is allowed to delete. This setting must be used in conjunction with the 'delete_by_keyword' capability. Follows the same wildcarding semantics as the 'srchIndexesDefault' setting. No default. |
| `cumulativeSrchJobsQuota` | `<integer>` | — | The total number of historical searches that can run concurrently across all users who hold this role. For this setting to take effect, you must give the 'enable_cumulative_quota' setting in the limits.conf file a value of "true". If a user holds multiple roles, that user's searches count against the role with the largest cumulative search quota. Once the quota for that role is consumed, the user's searches count against the role with the next largest quota, and so on. In ... |
| `cumulativeRTSrchJobsQuota` | `<integer>` | — | The total number of real-time searches that can run concurrently across all users who hold this role. For this setting to take effect, you must give the 'enable_cumulative_quota' setting in the limits.conf file a value of "true". If a user holds multiple roles, that user's searches count against the role with the largest cumulative search quota. After the quota for that role is consumed, the user's searches count against the role with the next largest quota, and so on. In ... |
| `kvstore_create.deny_list` | `<semicolon-separated list>` | — | A list of collections that this role doesn't have permission to perform create operations on. This setting can't be inherited from imported roles. No Default |
| `kvstore_create.implicit_deny_list` | `<semicolon-separated list>` | — | A list of collections that this role doesn't have permission to perform create operations on. This setting can be inherited from imported roles. No Default |
| `kvstore_update.deny_list` | `<semicolon-separated list>` | — | A list of collections that this role doesn't have permission to perform update operations on. This setting can't be inherited from imported roles. No Default |
| `kvstore_update.implicit_deny_list` | `<semicolon-separated list>` | — | A list of collections that this role doesn't have permission to perform update operations on. This setting can be inherited from imported roles. No Default |
| `kvstore_delete.deny_list` | `<semicolon-separated list>` | — | A list of collections that this role doesn't have permission to perform delete operations on. This setting can't be inherited from imported roles. No Default |
| `kvstore_delete.implicit_deny_list` | `<semicolon-separated list>` | — | A list of collections that this role doesn't have permission to perform delete operations on. This setting can be inherited from imported roles. No Default |

### `[tokens_auth]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | — | Whether or not Splunk token authorization is active. A value of "true" disables token authentication, and a value of "false" enables it. Default: false |
| `expiration` | `<relative-time-modifier>\|never` | — | The relative time when an authorization token expires. The syntax for using time modifiers is: [+]<time_integer><time_unit>@<time_unit> Where time_integer is an integer value and time_unit is relative time unit in seconds (s), minutes (m), hours (h) or days (d) etc. The steps to specify a relative time modifier are: Indicate the time offset from the current time. Define the time amount, which is a number and a unit. Specify a "snap to" time unit. The time unit indicates th... |
| `ephemeralExpiration` | `<relative-time-modifier>` | — | The relative time when an ephemeral authorization token expires. An ephemeral token is identical to a standard authorization token, with the following exceptions: The auth system does not keep the token in App Key Value Store. This means you cannot modify it after creating it. Ephemeral tokens must always expire, meaning they cannot be given an expiration of "never". Currently, ephemeral tokens can only be created using REST. The syntax for using time modifiers is: [+]<tim... |

### `[capability::accelerate_datamodel]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user enable or disable data model acceleration. |

### `[capability::accelerate_search]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user enable or disable acceleration for reports. The assigned role must also be granted the 'schedule_search' capability. |

### `[capability::admin_all_objects]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user access all objects in the system, such as user objects and Lets a user bypass any Access Control List (ACL) restrictions, similar the Splunk platform checks this capability when accessing manager pages and objects. |

### `[capability::edit_own_objects]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit the knowledge objects or entities for configuration endpoints |

### `[capability::list_all_objects]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list all configuration settings for the configuration endpoints. This capability prevents unauthorized access to configuration endpoints. |

### `[capability::list_all_users]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list all users by accessing the /services/authentication/users For full access to listing users, roles, and capabilities, the user must also |

### `[capability::list_all_roles]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list all roles and the capabilities that are assigned to For full access to listing users, roles, and capabilities, the user must also |

### `[capability::edit_tokens_settings]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user access all token auth settings in the system, such as turning the Splunk checks this capability when accessing manager pages and objects. |

### `[capability::change_authentication]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change authentication settings through the authentication endpoints. Lets the user reload authentication. |

### `[capability::change_audit]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change audit settings through the audit endpoints. Lets a user reload audit settings. |

### `[capability::change_own_password]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change their own password. You can remove this capability |

### `[capability::list_tokens_scs]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user retrieve a Splunk Cloud Services (SCS) token for an SCS service with which this |

### `[capability::delete_by_keyword]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user use the 'delete' command. NOTE: The 'delete' command does not actually delete the raw data on disk. |

### `[capability::edit_messages]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and delete system messages that appear in the Splunk Web navigation bar. |

### `[capability::edit_log_alert_event]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user log an event when an alert condition is met. Also lets the user |

### `[capability::dispatch_rest_to_indexers]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user dispatch the REST search command to indexers. |

### `[capability::edit_authentication_extensions]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change the authentication extensions through the |

### `[capability::edit_bookmarks_mc]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add bookmark URLs within the Monitoring Console. |

### `[capability::edit_certificates]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add, update, and remove certificate authority (CA) Specifically, lets a user modify the value of the 'sslRootCAPath' setting |

### `[capability::list_certificates]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user display server and CA certificates for various parts of the Splunk |

### `[capability::edit_deployment_client]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit the deployment client. Lets a user edit a deployment client admin endpoint. |

### `[capability::edit_deployment_server]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit the deployment server. Lets a user edit a deployment server admin endpoint. Lets a user change or create remote inputs that are pushed to the |

### `[capability::list_dist_peer]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list/read peers for distributed search. |

### `[capability::edit_dist_peer]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add and edit peers for distributed search. Supercedes list_dist_peer also allows list/read |

### `[capability::edit_encryption_key_provider]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view and edit keyprovider properties when using |

### `[capability::request_pstacks]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user trigger pstacks generation of the main splunkd process |

### `[capability::edit_watchdog]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user reconfigure watchdog settings using a REST endpoint. |

### `[capability::edit_forwarders]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit settings for forwarding data, including settings Also used by TCP and Syslog output admin handlers. |

### `[capability::edit_health]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user disable or enable health reporting for a feature in the splunkd |

### `[capability::edit_health_subset]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user disable or enable health reporting for a feature in the Actions are performed through the server/health-config/{feature_name} |

### `[capability::edit_httpauths]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit and end user sessions through the httpauth-tokens endpoint. |

### `[capability::edit_indexer_cluster]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit or manage indexer clusters. |

### `[capability::edit_indexerdiscovery]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit settings for indexer discovery, including settings Also used by Indexer Discovery admin handlers. |

### `[capability::edit_ingest_rulesets]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add, edit, and delete ingest action rule sets |

### `[capability::edit_input_defaults]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change the default hostname for input data through the server |

### `[capability::edit_local_apps]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit apps on the local Splunk instance through the For full access to app management, also add the 'install_apps' To enable enforcement of the "install_apps" capability, see the |

### `[capability::edit_monitor]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add inputs and edit settings for monitoring files. Also used by the standard inputs endpoint as well as the oneshot input |

### `[capability::edit_modinput_journald]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets the user add and edit journald inputs. This input is not available on Windows. |

### `[capability::edit_modinput_winhostmon]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add and edit inputs for monitoring Windows host data. |

### `[capability::edit_modinput_winnetmon]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add and edit inputs for monitoring Windows network data. |

### `[capability::edit_modinput_winprintmon]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add and edit inputs for monitoring Windows printer data. |

### `[capability::edit_modinput_perfmon]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add and edit inputs for monitoring Windows performance. |

### `[capability::edit_modinput_admon]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user add and edit inputs for monitoring Active Directory (AD). |

### `[capability::edit_roles]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit roles. Lets a user change the mappings from users to roles. Used by both user and role endpoints. |

### `[capability::edit_roles_grantable]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `grantableRoles` | `role1;role2;role3` | — | — |

### `[capability::edit_saved_search]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change the search string, description, earliest time, and latest time of a To change these fields for any saved search regardless of the access control NOTE: Assign this capability in lieu of the 'admin_all_objects' capability |

### `[capability::edit_saved_search_owner]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change the owner of a saved search that is visible to the user. To change the owner of any saved search regardless of the access control To let users change saved search owners in Splunk Web, combine this NOTE: Assign this capability in lieu of the 'admin_all_objects' capability |

### `[capability::edit_scripted]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and edit scripted inputs. |

### `[capability::edit_search_head_clustering]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit and manage search head clustering. |

### `[capability::edit_search_concurrency_all]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit settings related to maximum concurrency of searches. |

### `[capability::edit_search_concurrency_scheduled]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit settings related to concurrency of scheduled searches. |

### `[capability::edit_search_scheduler]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user disable and enable the search scheduler. |

### `[capability::edit_search_schedule_priority]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user assign a search a higher-than-normal schedule priority. |

### `[capability::edit_search_schedule_window]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit a search schedule window. Requires the 'schedule_search' capability. For more about the search scheduler, see the Knowledge Manager Manual. |

### `[capability::edit_search_server]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit general distributed search settings like timeouts, |

### `[capability::edit_server]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit general server and introspection settings, such This capability also inherits the ability to read general server |

### `[capability::edit_server_crl]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user reload Certificate Revocation Lists (CRLs) within Splunk. A CRL is a list of digital certificates that have been revoked by the |

### `[capability::edit_sourcetypes]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and edit sourcetypes. |

### `[capability::edit_splunktcp]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change settings for receiving TCP input from another Splunk |

### `[capability::edit_splunktcp_ssl]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view and edit SSL-specific settings for Splunk TCP input. |

### `[capability::edit_user_seed]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view and edit the user-seed.conf file used for initial username |

### `[capability::edit_splunktcp_token]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view or edit splunktcptokens. The tokens can be used on a |

### `[capability::edit_storage_passwords]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user read from (GET) and write to (POST) the /storage/passwords endpoint. |

### `[capability::edit_tcp]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change settings for receiving general TCP inputs. |

### `[capability::edit_telemetry_settings]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change settings for opting in and sending telemetry data. |

### `[capability::edit_token_http]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create, edit, display, and remove settings for HTTP token input. Enables the HTTP Events Collector feature, which is a way to send data to |

### `[capability::edit_tokens_all]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user issue tokens to all users. |

### `[capability::edit_tokens_own]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user issue tokens to themself. |

### `[capability::edit_udp]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change settings for UDP inputs. |

### `[capability::edit_user]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create, edit, or remove other users. Also lets a user manage certificates for distributed search. To edit the roles of a user, you must hold roles whose combined capabilities To let users grant additional roles, assign the Example: grantableRoles = role1;role2;role3 |

### `[capability::delete_saml_user]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user delete user accounts that were created through SAML authentication. |

### `[capability::edit_view_html]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create, edit, or otherwise modify HTML-based views. |

### `[capability::edit_web_settings]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change the settings for web.conf through the system settings |

### `[capability::export_results_is_visible]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user show or hide the Export button in Splunk Web. Disable this setting to hide the Export button and prevent users with |

### `[capability::get_diag]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets the user generate a diag on a remote instance through the |

### `[capability::get_metadata]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user use the metadata search processor. |

### `[capability::get_typeahead]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Enables typeahead for a user, both the typeahead endpoint and the |

### `[capability::indexes_edit]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user change any index settings such as file size and memory limits. |

### `[capability::input_file]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dispatch` | `t mode) and the inputlookup command.` | — | — |

### `[capability::install_apps]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user install, uninstall, create, and update apps on the local For full access to app management, also add the 'edit_local_apps' To enable enforcement of the "install_apps" capability, see the |

### `[capability::license_tab]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | DEPRECATED. Lets a user access and change the license. Replaced with the 'license_edit' capability. |

### `[capability::license_edit]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Users with this capability can access and change license attributes and related information. |

### `[capability::license_read]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Users with this capability can access license attributes and related information. |

### `[capability::license_view_warnings]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user see if they are exceeding limits or reaching the expiration License warnings are displayed on the system banner. |

### `[capability::list_accelerate_search]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | This capability is a subset of the 'accelerate_search' capability. This capability grants access to the summaries that are required to run accelerated reports. Users with this capability, but without the 'accelerate_search' capability, can run, |

### `[capability::list_deployment_client]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list the deployment clients. |

### `[capability::list_deployment_server]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list the deployment servers. |

### `[capability::list_pipeline_sets]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list information about pipeline sets. |

### `[capability::list_forwarders]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list settings for data forwarding. Used by TCP and Syslog output admin handlers. |

### `[capability::list_health]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user monitor the health of various Splunk features |

### `[capability::list_health_subset]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user monitor the health of a subset of Splunk features (such as search These features are more oriented towards the end user, rather than the Splunk |

### `[capability::list_httpauths]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list user sessions through the httpauth-tokens endpoint. |

### `[capability::list_indexer_cluster]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list indexer cluster objects such as buckets, peers, and so on. |

### `[capability::list_indexerdiscovery]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view settings for indexer discovery. Used by indexer discovery handlers. |

### `[capability::list_ingest_rulesets]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view the list of ingest action rule sets |

### `[capability::list_inputs]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view the list of inputs including files, TCP, UDP, scripts, the Windows |

### `[capability::list_introspection]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user read introspection settings and statistics for indexers, search, |

### `[capability::list_search_head_clustering]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list search head clustering objects such as artifacts, delegated |

### `[capability::list_search_scheduler]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list search scheduler settings. |

### `[capability::list_saved_searches]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user discover all of the saved searches on the instance. Consequently, lets a user see any active user that owns and any app Assign this capability only to roles that you intend to assign to |

### `[capability::list_settings]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list general server and introspection settings such as the server |

### `[capability::list_metrics_catalog]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list metrics catalog information such as the metric names, |

### `[capability::edit_metrics_rollup]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create/edit metrics rollup defined on metric indexes. |

### `[capability::list_storage_passwords]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user read from (GET) the /storage/passwords endpoint. You must add the 'edit_storage_passwords' capability to the role for the user to |

### `[capability::list_token_http]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user display settings for HTTP token input. |

### `[capability::list_tokens_all]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view all tokens. |

### `[capability::list_tokens_own]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view their own tokens. |

### `[capability::never_lockout]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Allows a user's account to never lockout. |

### `[capability::never_expire]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Allows a user's account to never expire. |

### `[capability::output_file]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dispatch` | `t mode) and the 'outputlookup' command.` | — | — |

### `[capability::pattern_detect]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Controls ability to see and use the Patterns tab in the Search view. |

### `[capability::request_remote_tok]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user get a remote authentication token. Used for distributing search to old 4.0.x Splunk instances. Also used for some distributed peer management and bundle replication. |

### `[capability::rest_apps_management]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit settings for entries and categories in the Python remote See restmap.conf.spec for more information. |

### `[capability::rest_apps_view]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list various properties in the Python remote apps handler. See restmap.conf.spec for more info |

### `[capability::rest_properties_get]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user get information from the services/properties endpoint. |

### `[capability::rest_properties_set]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit the services/properties endpoint. |

### `[capability::restart_splunkd]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user restart the Splunk platform through the server control handler. |

### `[capability::rtsearch]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run real-time searches. |

### `[capability::run_collect]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run the 'collect' command. |

### `[capability::run_dump]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run the 'dump' command. |

### `[capability::run_custom_command]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run custom search commands. |

### `[capability::run_mcollect]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run the 'mcollect' and 'meventcollect' commands. |

### `[capability::run_msearch]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run the 'mpreview' and 'msearch' commands. |

### `[capability::rest_access_server_endpoints]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run the 'rest' command and access 'services/server/' endpoints. |

### `[capability::run_sendalert]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run the 'sendalert' command. |

### `[capability::run_debug_commands]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run debugging commands, for example 'summarize'. |

### `[capability::run_walklex]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run the 'walklex' command even if they have a role with a search filter. |

### `[capability::run_commands_ignoring_field_filter]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | When field filters are in use, this capability lets users run searches This capability is required for a role to run the following commands that These commands can return sensitive indexed data that is protected by field |

### `[capability::schedule_rtsearch]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user schedule real-time saved searches. You must enable the 'scheduled_search' and 'rtsearch' capabilities for the role. |

### `[capability::schedule_search]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user schedule saved searches, create and update alerts, and |

### `[capability::metric_alerts]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and update the new metric alerts. |

### `[capability::search]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user run a search using Search Processing Language (SPL) |

### `[capability::search_process_config_refresh]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user manually flush idle search processes through the |

### `[capability::use_file_operator]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | DEPRECATED. This setting has been deprecated and has no effect. |

### `[capability::upload_lookup_files]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user upload files which can be used in conjunction with lookup definitions. |

### `[capability::upload_mmdb_files]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user upload mmdb files, which are used for iplocation searches. |

### `[capability::create_external_lookup]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create external lookup definitions. |

### `[capability::edit_external_lookup]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit or remove external lookup definitions. |

### `[capability::web_debug]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user access /_bump and /debug/** web debug endpoints. |

### `[capability::edit_field_filter]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user use an API to update field filter configurations. |

### `[capability::list_field_filter]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user use an API to list and view field filter configurations. |

### `[capability::edit_statsd_transforms]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user define regular expressions to extract manipulated dimensions out of For example, dimensions can be mashed inside a metric_name field like |

### `[capability::edit_metric_schema]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user define the schema of the log data that must be converted |

### `[capability::list_workload_pools]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list and view workload pool and workload status information through |

### `[capability::edit_workload_pools]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and edit workload pool and workload configuration information |

### `[capability::select_workload_pools]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user select a workload pool for a scheduled or ad-hoc search. |

### `[capability::list_workload_rules]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list and view workload rule information from the workloads/rules |

### `[capability::edit_workload_rules]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and edit workload rules through the workloads/rules endpoint. |

### `[capability::list_workload_policy]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view workload_policy.conf file settings through the workloads/policy endpoint. For now, it is used to view 'admission_rules_enabled' setting under admission_rules_enabled = 1 means the admission rules are enabled in |

### `[capability::edit_workload_policy]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit workload_policy.conf file settings through the workloads/policy endpoint. For now, it used to change 'admission_rules_enabled' setting under admission_rules_enabled = 1 means the admission rules are enabled in |

### `[capability::apps_restore]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user restore configurations from a backup archive through |

### `[capability::edit_global_banner]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user enable/edit a global banner visible to all users on every page. |

### `[capability::edit_kvstore]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user execute KV Store administrative commands through the KV Store REST endpoints. |

### `[capability::list_cascading_plans]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view the generated knowledge bundle replication plans if the chosen replication |

### `[capability::list_remote_output_queue]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view the configuration details of a configured remote output queue for Splunk Cloud |

### `[capability::list_remote_input_queue]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view the configuration details of a configured remote input queue for Splunk Cloud |

### `[capability::edit_manager_xml]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and edit XML views using the /data/ui/manager REST endpoint. |

### `[capability::merge_buckets]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user merge buckets using cluster-merge-buckets CLI for clustered environments |

### `[capability::edit_web_features]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user write to the '/web-features' REST endpoint. |

### `[capability::edit_spl2_module_permissions]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create and edit permissions to Search Processing Language version 2 (SPL2) items through the REST API. |

### `[capability::edit_published_dashboards]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user publish a dashboard, creating a unique URL that makes the dashboard viewable without |

### `[capability::list_spl2_modules]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user read and list SPL2 modules. |

### `[capability::edit_spl2_modules]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create, update and delete SPL2 modules. |

### `[capability::edit_spl2_datasets]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user create, update and delete datasets. |

### `[capability::edit_data_management_pipeline_job]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user deploy, update, and cancel the SPL2-based pipeline. |

### `[capability::edit_data_management_edgeprocessor]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user manage edge processors. |

### `[capability::provision_data_management_agent]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user register data management agents. |

### `[capability::edit_data_management_agent]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user manage data management agents. |

### `[capability::list_data_management_otelcollector]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user view a list of managed Open Telemetry collectors and their |

### `[capability::edit_data_management_otelcollector]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit a list of managed Open Telemetry collectors. |

### `[capability::delete_oauth_config_clients]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user delete Open Authorization (OAuth) app clients for an OAuth configuration. |

### `[capability::list_oauth_config_clients]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list OAuth app clients for an OAuth configuration. |

### `[capability::list_oauth_configs]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list the OAuth configurations for external identity providers. |

### `[capability::edit_oauth_configs]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit and delete the OAuth configurations for external identity providers. |

### `[capability::list_oauth_config_role_mappings]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list the role mappings for an OAuth configuration. |

### `[capability::edit_oauth_config_role_mappings]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit and delete the role mappings for an OAuth configuration. |

### `[capability::edit_internal_oauth_clients]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit OAuth internal clients. |

### `[capability::list_internal_oauth_clients]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user list existing OAuth internal clients. |

### `[capability::edit_storage_passwords_masking]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit the /storage/passwords cleartext password masking settings. |

### `[capability::create_bulk_data_move]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Allows a user to perform bulk data move operations on non-SmartStore |

### `[capability::edit_heap_profiler]`
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(stanza note)* | — | — | Lets a user edit the heap profiler configuration without restarting splunkd. |

