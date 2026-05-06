# /services/data/federated/settings/general

Read and update deployment-wide Federated Search for Splunk settings (not applicable to Federated Search for Amazon S3).

**Category:** Federated Search

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/settings/general` |
| Auth required | Yes |
| Capability | `admin_all_objects` |

**Notes:** Topic overview states federated search REST usage generally requires `admin_all_objects` and `edit_indexes`. This endpoint’s documented restrictions explicitly cite `admin_all_objects` for GET and POST. Append `/acl` to inspect ACL properties.

---

## GET /services/data/federated/settings/general

Returns the current general federated search settings for the deployment.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters. Standard Splunk REST [pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| disabled | Boolean | When `false`, federated search is enabled for the deployment; when `true`, it is disabled. Defaults to `false`. |
| transparent_mode | Boolean | When `true`, transparent mode is on (searches may use transparent and standard mode providers). When `false`, only standard mode providers apply. Defaults to `true`. |
| controlCommandsFeatureEnabled | Boolean | Whether a federated search head can send federated search actions such as search cancellation to federated providers (does not support pause). Defaults to `true`. |
| controlCommandsMaxThreads | Number | Maximum threads running a federated search action from the federated search head on providers. Defaults to `5`. |
| controlCommandsMaxTimeThreshold | Number | Maximum seconds the federated search head waits for completion of a federated search action such as cancellation. Defaults to `5`. |
| heartbeatEnabled | Boolean | Whether the federated search heartbeat mechanism monitors remote providers and can surface problems. Defaults to `true`. |
| max_preview_generation_duration | Number | Maximum seconds the search head spends generating previews for a federated search; `0` means unlimited. Defaults to `0`. |
| needs_consent | Boolean | When `true`, the UI shows a compliance acknowledgement checkbox for provider definitions and role index assignment; when `false`, it is hidden. Defaults to `true`. |
| proxyBundlesTTL | Number | Time to live in seconds for a proxy bundle on the remote search head after last use. Defaults to `172800` (2 days). |
| remoteEventsDownloadRetryCountMax | Number | In verbose mode, maximum event download retries before reporting failure. Defaults to `20`. |
| remoteEventsDownloadRetryTimeoutMs | Number | In verbose mode, milliseconds between retries of a failed event download. Defaults to `1000`. |
| verbose_mode | Boolean | Whether federated searches may run in verbose mode; `false` restricts verbose behavior per standard vs transparent mode rules in the product docs. Defaults to `true`. |
| eai:acl | Object | Splunk entity ACL metadata (app, owner, sharing, permissions, modifiable flags, etc.) as returned in REST responses. |
| eai:attributes | Object | Splunk entity attribute metadata (optionalFields, requiredFields, wildcardFields lists). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/data/federated/settings/general?output_mode=json
```

---

## POST /services/data/federated/settings/general

Updates general federated search settings, including enabling or disabling federated search for the deployment.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| disabled | Boolean | No | `false` | When `false`, federated search is on; when `true`, federated search is off for the deployment. |
| transparent_mode | Boolean | No | `true` | Controls transparent vs standard-only federated provider usage as described in Federated Search documentation. After changing this, you must reload federated configuration (see note below). |
| controlCommandsFeatureEnabled | Boolean | No | `true` | Change only when instructed by Splunk Support. |
| controlCommandsMaxThreads | Number | No | `5` | Change only when instructed by Splunk Support. |
| controlCommandsMaxTimeThreshold | Number | No | `5` | Change only when instructed by Splunk Support. |
| heartbeatEnabled | Boolean | No | `true` | Change only when instructed by Splunk Support. |
| max_preview_generation_duration | Number | No | `0` | Set above zero if previews hit timeouts from external components (e.g. load balancers). |
| needs_consent | Boolean | No | `true` | Change only when instructed by Splunk Support. |
| proxyBundlesTTL | Number | No | `172800` | Change only when instructed by Splunk Support. |
| remoteEventsDownloadRetryCountMax | Number | No | `20` | Change only when instructed by Splunk Support. |
| remoteEventsDownloadRetryTimeoutMs | Number | No | `1000` | Change only when instructed by Splunk Support. |
| verbose_mode | Boolean | No | `true` | Change only when instructed by Splunk Support. |

**Transparent mode reload:** After toggling `transparent_mode`, run:

```
curl -k -u admin:pass -X POST https://localhost:8089/services/configs/conf-federated/_reload
```

(or use your deployment’s host and management port) so the change takes effect.

### Returned values

Same fields as GET for the updated configuration, including `eai:acl` and `eai:attributes` as returned by Splunk REST.

### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/settings/general -d transparent_mode=false
```
