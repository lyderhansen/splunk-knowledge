# /services/licenser/localpeer

Return license state and feature flags for this Splunk instance (local license peer).

**Category:** License

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/licenser/localpeer` |
| Auth required | Yes |
| Capability | `license_edit` (typical; append `/acl` for ACL-derived permissions) |

### Splunk Cloud Platform

License endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/licenser/localpeer

Get license state information for the Splunk instance.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| add_ons | Object | Add-ons resident on this instance and their parameters (nested structure). |
| connection_timeout | Number | Instance connection timeout in seconds. |
| features | Object | Map of Splunk feature names to status strings such as `ENABLED`, `DISABLED`, or `DISABLED_DUE_TO_LICENSE`. Documented feature keys include: Acceleration, AdvancedSearchCommands, AdvancedXML, Alerting, AllowDuplicateKeys, Auth, CanBeRemoteManager, CustomRoles, DeployClient, DeployServer, DistSearch, FwdData, GuestPass, KVStore, LDAPAuth, LocalSearch, MultisiteClustering, NontableLookups, RcvData, RcvSearch, ResetWarnings, RollingWindowAlerts, ScheduledAlerts, ScheduledReports, ScheduledSearch, SearchheadPooling, SigningProcessor, SplunkWeb, SyslogOutputProcessor, UnisiteClustering. |
| last_manager_contact_attempt_time | Number | Time of last attempt to contact the license manager. |
| last_manager_contact_success_time | Number | Time of last successful contact with the license manager. |
| last_trackerdb_service_time | Number | Time of last license servicing for the tracking persistent store. |
| license_keys | List | License keys (hashes) this instance is using. |
| manager_guid | String | Manager license GUID. |
| manager_uri | String | Manager license URI (`self` when acting as its own manager). |
| receive_timeout | Number | Network receive timeout for communication to the manager (seconds). |
| send_timeout | Number | Network send timeout for communication to the manager (seconds). |
| peer_id | String | This instance GUID. |
| peer_label | String | This instance server name/label. |
| squash_threshold | Number | Threshold that enables source/host squashing of usage rows sent to the manager periodically. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/licenser/localpeer?output_mode=json
```
