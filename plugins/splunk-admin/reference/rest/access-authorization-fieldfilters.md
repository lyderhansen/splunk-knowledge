# /services/authorization/fieldfilters

Create a field filter or get a list of field filters. See [Protect PII, PHI, and other sensitive data with field filters](https://help.splunk.com/?resourceId=Splunk_Security_fieldfilters) in Securing Splunk Platform.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/fieldfilters` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authorization/fieldfilters

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| (response) | — | The name of the field filter. Field filter names can contain only alphanumeric characters and underscores ( _ ). Spaces and special symbols are not allowed. |
| action.field | String | The name of the field to filter for this action. |
| (response) | — | action.operator |
| (response) | — | Stores a description of the field filter. |
| (response) | — | Specifies an index name or a list of comma-separated index names of the target indexes you want to search that contain the data you want to protect. If an index is not specified, all indexes are searched. |
| limit.key | String | The key for the field filter limit, which limits the field filter to events with a specific target host, source, or sourcetype. You can specify only one value. If the limit key is empty, the field filter doesn't apply to events with a specific host, source, or sourcetype. Limit statements that include wildcards or the following operators are not supported: AND, OR. |
| limit.value | String | The value for the limit, which is a sequence of characters enclosed in double quotation marks ( " ) that represents the name of the hosts, the sources, or the source types. The limit value can be a value or a list of comma-separated values for the specified limit. |
| (response) | — | A list of field filters from which each role is exempt. If a role is exempt from a field filter, the field filter is not run at search time for any users holding this role. Roles inherit all field filter exemptions from imported roles. You can't remove inherited field filter exemptions. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/authorization/fieldfilters?output_mode=json
```

## POST /services/authorization/fieldfilters

### Request parameters

No request parameters.

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme https://localhost:8106/servicesNS/nobody/system/authorization/fieldfilters/ -d name=demo_hash_filter -d action=\"fieldName\"=sha256\(\)
```


---

# /services/authorization/fieldfilters/{name}

Access, create, or delete properties for the {name} field filter. See [Protect PII, PHI, and other sensitive data with field filters](https://help.splunk.com/?resourceId=Splunk_Security_fieldfilters) in Securing Splunk Platform.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authorization/fieldfilters/{name}` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authorization/fieldfilters/{name}

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| (response) | — | The name of the field filter. Field filter names can contain only alphanumeric characters and underscores ( _ ). Spaces and special symbols are not allowed. |
| action.field | String | The name of the field to filter for this action. |
| (response) | — | action.operator |
| (response) | — | Stores a description of the field filter. |
| (response) | — | Specifies an index name or a list of comma-separated index names of the target indexes you want to search that contain the data you want to protect. If an index is not specified, all indexes are searched. |
| limit.key | String | The key for the field filter limit, which limits the field filter to events with a specific target host, source, or sourcetype. You can specify only one value. If the limit key is empty, the field filter doesn't apply to events with a specific host, source, or sourcetype. Limit statements that include wildcards or the following operators are not supported: AND, OR. |
| limit.value | String | The value for the limit, which is a sequence of characters enclosed in double quotation marks ( " ) that represents the name of one or more hosts, sources, or source types. The limit value can be a value or a list of comma-separated values for the specified limit. |
| (response) | — | A list of field filters from which each role is exempt. If a role is exempt from a field filter, the field filter is not run at search time for any users holding this role. Roles inherit all field filter exemptions from imported roles. You can't remove inherited field filter exemptions. |

### Example

```
curl -k -u admin:changeme https://localhost:8106/services/authorization/fieldfilters/demo_hash_filter
```

## POST /services/authorization/fieldfilters/{name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| action.field | String | No | — | The name of the field to filter for this action. Only one field can be specified per request. |
| action.operator | — | No | — | — |
| description = | String | No | — | Stores a description of the field filter. |
| Specifies an index name or a list of comma-separated index names of the target indexes you want to search that contain the data you want to protect. If an index is not specified, all indexes are searched. | — | No | — | — |
| limit.key | String | No | — | The key for the field filter limit, which limits the field filter to events with a specific target host, source, or sourcetype. You can specify only one value. If the limit key is empty, the field filter doesn't apply to events with a specific host, source, or sourcetype. Limit statements that include wildcards or the following operators are not supported: AND, OR. |
| limit.value | String | No | — | The value for the limit, which is a sequence of characters enclosed in double quotation marks ( " ) that represents the name of one or more hosts, sources, or source types. The limit value can be a value or a list of comma-separated values for the specified limit. |
| A list of field filters from which each role is exempt. If a role is exempt from a field filter, the field filter is not run at search time for any users holding this role. Roles inherit all field filter exemptions from imported roles. You can't remove inherited field filter exemptions. | — | No | — | — |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme https://localhost:8106/services/authorization/fieldfilters/demo_hash_filter -d limit=host::abc
```

## DELETE /services/authorization/fieldfilters/{name}

### Request parameters

No request parameters.

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme --request DELETE https://localhost:8106/services/authorization/fieldfilters/demo_hash_filter
```


---
