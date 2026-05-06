# /services/data/federated/provider

List and create federated provider definitions for Federated Search for Splunk and Federated Search for Amazon S3 (S3 available on Splunk Cloud Platform only). Child paths address batch shutdown, a named provider, and per-provider disable/enable.

**Category:** Federated Search

**Deployment note:** The federated provider REST endpoints ignore user and app namespace context and write provider stanzas under `etc/system/local/federated.conf`.

---

## `/services/data/federated/provider`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/provider` |
| Auth required | Yes |
| Capability | `admin_all_objects` (POST explicitly documented). |

### GET /services/data/federated/provider

Returns a feed listing federated provider definitions.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | String | No | *(none)* | Filter providers by type. Splunk Enterprise: `splunk` only. Splunk Cloud: `splunk` or `aws_s3`. |
| *(pagination/filtering)* | varies | No | — | Standard Splunk REST [pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) apply. |

#### Returned values

Response entries include Atom/metadata links (`alternate`, `list`, `_reload`, `edit`, `remove`, `enable`/`disable` where applicable) and a content dictionary. Provider-specific keys:

| Name | Type | Description |
|------|------|-------------|
| name | String | Federated provider name (also carried in the Atom entry `title`). |
| type | String | `splunk` (Splunk-to-Splunk) or `aws_s3` (Amazon S3 on Splunk Cloud). Defaults to `splunk` when applicable. |
| mode | String | `standard` or `transparent` (Federated Search for Splunk providers only). Defaults to `standard`. |
| appContext | String | Remote app context for standard mode Splunk providers (ignored in transparent mode). Defaults to `search`. |
| useFSHKnowledgeObjects | Boolean | Interpretation follows provider mode: standard behaves as false-like blending behavior; transparent behaves as true (FSH knowledge objects only). |
| connectivityStatus | String | `valid`, `invalid`, or `unknown` diagnostic connectivity state from last check toward the local deployment; user-read-only. |
| aws_account_id | String | 12-digit AWS account ID (Amazon S3 providers). |
| aws_glue_tables_allowlist | String | Comma-separated AWS Glue tables for schema/metadata (Amazon S3). |
| aws_kms_keys_arn_allowlist | String | Comma-separated KMS key ARNs for SSE-KMS encrypted S3 data (Amazon S3). |
| aws_region | String | AWS region for the Splunk Cloud deployment (determined automatically by Splunk). |
| aws_s3_paths_allowlist | String | Comma-separated searchable S3 location paths (Amazon S3). |
| database | String | AWS Glue Data Catalog database name (Amazon S3). |
| data_catalog | String | Glue Data Catalog ARN-style identifier (Amazon S3). |
| hostPort | String | Host and management connection target for Splunk providers, typically `host:port`. |
| serviceAccount | String | Service account user name on the federated Splunk provider. |
| disabled | Boolean | Whether the provider is disabled (`true`) so it cannot return federated search results. |
| eai:acl | Object | Splunk ACL metadata for the entity. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/data/federated/provider?output_mode=json
```

---

### POST /services/data/federated/provider

Creates a new federated provider definition.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Unique provider name. |
| type | String | Yes | `splunk` | Splunk Enterprise: must be `splunk`. Splunk Cloud: `splunk` or `aws_s3`. |
| mode | String | Yes | `standard` | `standard` or `transparent` for Splunk providers (follow Federated Search docs on homogeneous modes per deployment). |
| appContext | String | Conditional | `Search` | Remote app folder for standard mode; unnecessary for transparent mode. |
| aws_account_id | Number/String | Yes for aws_s3 | — | 12-digit AWS account for Amazon S3 providers. |
| aws_glue_tables_allowlist | String | Yes for aws_s3 | — | Comma-separated Glue tables; each table belongs to the `database` and references paths allowed in `aws_s3_paths_allowlist`. |
| aws_kms_keys_arn_allowlist | String | Conditional | — | Required when SSE-KMS applies; customer-managed keys only; ARNs must belong to `aws_account_id`. |
| aws_s3_paths_allowlist | String | Yes for aws_s3 | — | Comma-separated S3 paths permitted for Federated Search for Amazon S3. |
| database | String | Yes for aws_s3 | — | Glue Data Catalog database containing provider tables. |
| hostPort | String | Yes for splunk | — | Federated Splunk provider endpoint such as `host:8089`. |
| password | String | Yes for splunk | — | Password for the service account on the provider (see Federated Search security documentation). |
| serviceAccount | String | Yes for splunk | — | Username for the service account on the provider. |

#### Returned values

Same key set as GET list responses for the created provider entry (`name`, `type`, mode-specific fields, `connectivityStatus` where applicable, `disabled`, `eai:acl`, etc.).

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/provider \
  -d name=provider-1 -d type=splunk -d mode=standard \
  -d hostPort=10.225.131.242:8089 -d serviceAccount=admin -d password=Chang3d!
```

---

## `/services/data/federated/provider/turnOffProvidersInBatch`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/provider/turnOffProvidersInBatch` |
| Auth required | Yes |
| Capability | `admin_all_objects` |

Disables many federated providers in one call; associated federated indexes become unavailable until providers are re-enabled individually via `/enable`.

### POST /services/data/federated/provider/turnOffProvidersInBatch

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | String | No | *(none)* | If omitted, turns off all providers. If `splunk`, turns off Splunk-type providers; if `aws_s3` (Splunk Cloud), turns off Amazon S3 providers. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(none specific)* | — | Splunk returns the federated-provider collection feed metadata (Atom/OpenSearch pagination fields, related collection links). |

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/provider/turnOffProvidersInBatch
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/provider/turnOffProvidersInBatch -d type=splunk
```

---

## `/services/data/federated/provider/{federated_provider_name}`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/provider/{federated_provider_name}` |
| Auth required | Yes |
| Capability | `admin_all_objects` for POST and DELETE |

Retrieve, update, or delete one federated provider definition.

### GET /services/data/federated/provider/{federated_provider_name}

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| name | String | Provider name. |
| type | String | `splunk` or `aws_s3`. |
| mode | String | Standard or transparent mode (Splunk providers). |
| appContext | String | Remote app context for standard mode. |
| useFSHKnowledgeObjects | Boolean | Effective interpretation per provider mode as described in product documentation. |
| connectivityStatus | String | `valid`, `invalid`, or `unknown` diagnostic field (read-only). |
| aws_account_id | String | AWS account ID (Amazon S3). |
| aws_glue_tables_allowlist | String | Glue tables allowlist (Amazon S3). |
| aws_kms_keys_arn_allowlist | String | KMS ARN allowlist (Amazon S3). |
| aws_region | String | AWS region (Amazon S3). |
| aws_s3_paths_allowlist | String | S3 paths allowlist (Amazon S3). |
| database | String | Glue database name (Amazon S3). |
| data_catalog | String | Glue Data Catalog ARN identifier (Amazon S3). |
| hostPort | String | Splunk provider host:port. |
| serviceAccount | String | Service account username (Splunk providers). |
| disabled | Boolean | Provider disabled flag. |
| eai:acl | Object | ACL metadata. |
| eai:attributes | Object | Optional/required/wildcard field hints where returned. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/data/federated/provider/my_federated_provider?output_mode=json
```

---

### POST /services/data/federated/provider/{federated_provider_name}

Updates a provider; at least one updatable argument is required.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| appContext | String | No | `Search` | Standard-mode remote application folder name. |
| aws_account_id | Number/String | No | — | AWS account ID when updating Amazon S3 providers. |
| aws_glue_tables_allowlist | String | No | — | Updated Glue tables list. |
| aws_kms_keys_arn_allowlist | String | No | — | Updated KMS ARNs list for SSE-KMS data. |
| aws_s3_paths_allowlist | String | No | — | Updated S3 paths allowlist. |
| hostPort | String | No | — | Updated Splunk provider endpoint. |
| password | String | No | — | Updated service account password (Splunk providers). |
| serviceAccount | String | No | — | Updated service account username (Splunk providers). |

#### Returned values

Same schema as GET for the updated provider.

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/provider/my_federated_provider \
  -d serviceAccount=eagle01
```

---

### DELETE /services/data/federated/provider/{federated_provider_name}

Deletes the `[provider://{name}]` stanza from `federated.conf`.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(none specific)* | — | Returns the federated-provider collection feed confirming deletion context per Splunk REST Atom response. |

#### Example

```
curl -k -u admin:pass -X DELETE https://localhost:8089/services/data/federated/provider/my_federated_provider
```

---

## `/services/data/federated/provider/{federated_provider_name}/disable`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/provider/{federated_provider_name}/disable` |
| Auth required | Yes |
| Capability | `admin_all_objects` |

Turns off one federated provider; its federated indexes are not searchable until re-enabled.

### POST /services/data/federated/provider/{federated_provider_name}/disable

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(none specific)* | — | Feed-level acknowledgement per Splunk REST (collection metadata). |

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/provider/aws_s3_provider/disable
```

---

## `/services/data/federated/provider/{federated_provider_name}/enable`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/provider/{federated_provider_name}/enable` |
| Auth required | Yes |
| Capability | `admin_all_objects` |

Re-enables a provider after batch or individual disable operations.

### POST /services/data/federated/provider/{federated_provider_name}/enable

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(none specific)* | — | Feed-level acknowledgement per Splunk REST (collection metadata). |

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/provider/aws_s3_provider/enable
```
