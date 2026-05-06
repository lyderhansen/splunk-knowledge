# /services/data/ingest/rfsdestinations

Create/configure, get, or delete an S3 destination for ingest action.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/ingest/rfsdestinations` |
| Auth required | Yes |
| Capability | `list_ingest_rulesets, edit_ingest_rulesets` |

## DELETE `/services/data/ingest/rfsdestinations`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | string | Varies | — | Name of the S3 destination to delete. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | varies | Name of the S3 destination. |
| path | varies | Path (bucket and folder) of the destination. |
| remote.s3.access_key | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.secret_key | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| description | varies | Description of the destination (optional). |
| remote.s3.endpoint | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.encryption | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.key_id: | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.auth_region | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.signature_version | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.supports_versioning | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.url_version | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| compression | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| dropEventsOnUploadError | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchTimeout | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchSizeThresholdKB | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| target | varies | When provided, the request will be proxied to the host specified here (optional). |

### Example

```
curl -k -u admin:pass -X DELETE 'https://localhost:8089/services/data/ingest/rfsdestinations'
```

## GET `/services/data/ingest/rfsdestinations`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | string | Varies | — | Name of the S3 destination. An empty name returns information for all S3 destinations. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | varies | Name of the S3 destination. |
| path | varies | Path (bucket and folder) of the destination. |
| remote.s3.access_key | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.secret_key | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| description | varies | Description of the destination (optional). |
| remote.s3.endpoint | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.encryption | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.key_id: | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.auth_region | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.signature_version | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.supports_versioning | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.url_version | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| compression | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| dropEventsOnUploadError | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchTimeout | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchSizeThresholdKB | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| target | varies | When provided, the request will be proxied to the host specified here (optional). |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/ingest/rfsdestinations?output_mode=json'
```

## POST `/services/data/ingest/rfsdestinations`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | string | Varies | — | (Required) Name of the S3 destination. |
| path | string | Varies | — | (Required) Path (bucket and folder) of the destination. |
| remote.s3.access_key | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.secret_key | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| description | string | Varies | — | (Optional) Description of the destination. |
| remote.s3.endpoint | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.encryption | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.key_id: | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.auth_region | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.signature_version | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.supports_versioning | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.url_version | string | Varies | — | (Optional) See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| compression | string | Varies | — | (Optional) See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| dropEventsOnUploadError | string | Varies | — | (Optional) See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchTimeout | string | Varies | — | (Optional) See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchSizeThresholdKB | string | Varies | — | (Optional) See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| target | string | Varies | — | (Optional) When provided, the request will be proxied to the host specified here. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | varies | Name of the S3 destination. |
| path | varies | Path (bucket and folder) of the destination. |
| remote.s3.access_key | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.secret_key | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| description | varies | Description of the destination. |
| remote.s3.endpoint | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.encryption | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.key_id: | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.kms.auth_region | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.signature_version | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.supports_versioning | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| remote.s3.url_version | varies | See [indexes.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Indexesconf). |
| compression | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| dropEventsOnUploadError | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchTimeout | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| batchSizeThresholdKB | varies | See [outputs.conf](https://docs.splunk.com/?resourceId=Splunk_Admin_Outputsconf). |
| target | varies | When provided, the request will be proxied to the host specified here (optional). |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/ingest/rfsdestinations'
```
