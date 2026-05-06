# /services/data/federated/index

List and create federated indexes mapping local `federated:*` names to remote Splunk datasets or AWS Glue tables (Amazon S3 providers on Splunk Cloud only). Named-resource and `/disable`/`/enable` paths operate on one index at a time.

**Category:** Federated Search

**Canonical URL:** Single-index operations use `/services/data/federated/index/{federated_index_name}`. (Some Splunk doc snapshots incorrectly showed `.../federated/provider/{federated_index_name}`; examples and IDs use `/federated/index/`.)

---

## `/services/data/federated/index`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/index` |
| Auth required | Yes |
| Capability | Federated REST overview: `admin_all_objects` and `edit_indexes`. POST explicitly documents `admin_all_objects` and `indexes_edit`. |

### GET /services/data/federated/index

Returns federated index definitions as Atom feed entries.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters. Standard Splunk REST pagination and filtering parameters apply. |

#### Returned values

Documentation emphasizes federated-specific keys; Splunk Enterprise responses may also include broader index settings documented under `/services/data/indexes`.

| Name | Type | Description |
|------|------|-------------|
| name | String | Federated index name using syntax `federated:<localIndexSuffix>`. |
| federated.provider | String | Federated provider stanza name hosting the remote dataset. |
| federated.dataset | String | Remote dataset mapping `datasetType:datasetName` (Splunk: `index`, `metricindex`, `savedsearch`, `lastjob`, `datamodel`; Amazon S3: type must be `aws_glue_table`). |
| federated.timefield | String | Field behaving like event time for AWS Glue tables (Amazon S3 indexes). |
| federated.timeformat | String | `strptime()`-compatible format matching `federated.timefield` (Amazon S3). |
| federated.unixtimefield | String | Alias field exposing UNIX time derived from `federated.timefield`; defaults to `_time` and must differ from `federated.timefield` when that equals `_time`. |
| federated.partition.time.fields | String | Comma-delimited partition key fields for hierarchical time partitions (Amazon S3); omit for Splunk-type providers. |
| federated.partition.time.formats | String | Comma-delimited formats aligned positionally with partition time fields (`%w` and `%JT` unsupported). |
| federated.partition.time.types | String | Comma-delimited types aligned with partition fields (`String`, `Integer`, `Date`). |
| federated.partition.time.tz | String | Canonical timezone for partition time fields (for example `America/Los_Angeles`). |
| disabled | Boolean | Index disabled state when present in responses. |
| eai:acl | Object | Splunk ACL metadata (app, owner, sharing, permissions). |
| *(additional index keys)* | various | On Splunk Enterprise, many standard index configuration keys may appear (frozen paths, sizing, tsidx, metrics, etc.); see `/services/data/indexes` reference. |

#### Example

```
curl -k -u admin:pass https://localhost:8089/services/data/federated/index?output_mode=json
```

---

### POST /services/data/federated/index

Creates a federated index definition.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Unique federated index name `federated:<suffix>`; lowercase letters, digits, underscore, hyphen; start alphanumeric; max length 2048; cannot contain substring `kvstore`. |
| federated.provider | String | Yes | — | Provider containing the remote dataset. |
| federated.dataset | String | Yes | — | Remote dataset selector `type:name`; Splunk provider types include `index`, `metricindex`, `savedsearch`, `lastjob`, `datamodel` (default type when unspecified is `index`). Amazon S3 providers require `aws_glue_table:<glueTableName>` listed on the provider. |
| federated.timefield | String | No | — | Amazon S3: acts like `_time` for that Glue table; supply when you need time-oriented search behavior on remote S3 data. |
| federated.timeformat | String | No | — | Amazon S3: format string for `federated.timefield`; required whenever `federated.timefield` is set. |
| federated.unixtimefield | String | No | `_time` | Amazon S3: UNIX time alias; cannot equal `federated.timefield` when that field is `_time`. |
| federated.partition.time.fields | String | No | — | Amazon S3 partition fields list; do not set when provider `type=splunk`. Quote fields containing commas. |
| federated.partition.time.formats | String | No | — | Required when partition fields are set; omit otherwise. |
| federated.partition.time.types | String | No | — | Required when partition fields are set; allowed values `string`, `integer`, `date`. |
| federated.partition.time.tz | String | No | *(user tz)* | Canonical timezone for partition fields when set; if omitted while partition fields exist, Splunk uses user-prefs `tz`. |

#### Returned values

Federated keys listed under GET plus any standard index configuration keys Splunk includes in the entry (see `/services/data/indexes` on Splunk Enterprise).

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/index \
  -d name=federated:airports-east -d federated.provider=FenrisAirNYC \
  -d federated.dataset=index:airports-east
```

---

## `/services/data/federated/index/{federated_index_name}`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/index/{federated_index_name}` |
| Auth required | Yes |
| Capability | POST and DELETE document `admin_all_objects` and `indexes_edit`. |

Retrieve, update, or delete one federated index. Path segment rules from Splunk docs:

- Federated Search for Splunk indexes: use `federated:{name}` (URL-encode `:` as `%3A` when needed).
- Federated Search for Amazon S3 examples sometimes use the bare `{federated_index_name}` suffix in URLs while titles remain `federated:...`.

### GET /services/data/federated/index/{federated_index_name}

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters beyond optional standard pagination or filtering where supported for this GET. |

#### Returned values

Same federated field catalog as collection GET (plus optional broader index keys from Splunk Enterprise responses).

#### Example

```
curl -k -u admin:pass "https://localhost:8089/services/data/federated/index/federated:remote_index_df_1?output_mode=json"
curl -k -u admin:pass https://localhost:8089/services/data/federated/index/fss3_index?output_mode=json
```

---

### POST /services/data/federated/index/{federated_index_name}

Updates an existing federated index.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| federated.dataset | String | No | — | Changes the remote dataset mapping (`type:name`) for this federated index when permitted by provider type. |
| federated.timefield | String | No | — | Amazon S3: timestamp-like Glue column name. |
| federated.timeformat | String | No | — | Amazon S3: required whenever setting or changing `federated.timefield` consistent with create rules. |
| federated.unixtimefield | String | No | `_time` | Amazon S3: UNIX alias; cannot duplicate `federated.timefield` when that field is `_time`. |
| federated.partition.time.fields | String | No | — | Amazon S3 partition fields; omit for Splunk providers. |
| federated.partition.time.formats | String | No | — | Required when partition fields are defined. |
| federated.partition.time.types | String | No | — | Required when partition fields are defined. |
| federated.partition.time.tz | String | No | *(user tz)* | Canonical timezone when partition fields exist. |

#### Returned values

Updated federated fields as GET, plus additional standard index keys when returned by Splunk.

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/index/federated:remote_index_df_1 \
  -d federated.dataset=index:index_df_1_new
```

---

### DELETE /services/data/federated/index/{federated_index_name}

Deletes the federated index definition.

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | No endpoint-specific parameters. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(none specific)* | — | Federated-index collection Atom feed metadata confirming operation context. |

#### Example

```
curl -k -u admin:pass -X DELETE https://localhost:8089/services/data/federated/index/federated:my_federated_index
```

---

## `/services/data/federated/index/{federated_index_name}/disable`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/index/{federated_index_name}/disable` |
| Auth required | Yes |
| Capability | `admin_all_objects` (per Splunk endpoint documentation for this path). |

Disables one federated index so it does not participate in federated searches.

### POST /services/data/federated/index/{federated_index_name}/disable

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | Use `federated:{name}` vs bare suffix consistently with the named index GET/POST examples. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(none specific)* | — | Splunk may return an updated entry whose content includes `disabled` and federated mapping keys. |

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/index/fss3_index/disable
```

---

## `/services/data/federated/index/{federated_index_name}/enable`

| Property | Value |
|----------|-------|
| URL | `/services/data/federated/index/{federated_index_name}/enable` |
| Auth required | Yes |
| Capability | `admin_all_objects` (per Splunk endpoint documentation for this path). |

Re-enables a previously disabled federated index.

### POST /services/data/federated/index/{federated_index_name}/enable

#### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(none specific)* | — | — | — | Path segment naming mirrors disable rules. |

#### Returned values

| Name | Type | Description |
|------|------|-------------|
| *(none specific)* | — | Splunk may return an updated entry whose content includes `disabled` and federated mapping keys. |

#### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/data/federated/index/fss3_index/enable
```
