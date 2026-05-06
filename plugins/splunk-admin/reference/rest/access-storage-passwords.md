# /services/storage/passwords

Create or update user credentials, or list credentials for all users.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/storage/passwords` |
| Auth required | Yes |
| Capability | `list_storage_passwords (GET), edit_storage_passwords (POST)` |

## GET /services/storage/passwords

### Request parameters

[Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| [Pagination and filtering parameters](https://help.splunk.com/?resourceId=Splunk_RESTREF_RESTprolog) can be used with this method. | — | No | — | Splunk REST pagination and filtering parameters apply (REST API reference prolog). |

### Response keys

| Name | Type | Description |
|---|---|---|
| clear_password | String | Clear text password. |
| encr_password | String | Encrypted, stored password. |
| password | String | Password mask, always`********`. |
| realm | String | Realm in which credentials are valid. |
| username | String | User name associated with credentials. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/storage/passwords
```

## POST /services/storage/passwords

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | Yes | — | Required. Credentials username. |
| password | String | Yes | — | Required. Credentials user password. |
| realm | String | No | — | Credentials realm. |

### Response keys

| Name | Type | Description |
|---|---|---|
| encr_password | String | Encrypted, stored password. |
| password | String | Password mask, always`********`. |
| realm | String | Realm in which credentials are valid. |
| username | String | Username associated with credentials. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/passwords -d name=user1 -d password=changeme2
```


---

# /services/storage/passwords/{name}

Update, delete, or list credentials for the`{name}` user.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/storage/passwords/{name}` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/storage/passwords/{name}

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| clear_password | String | Clear text password. |
| encr_password | String | Encrypted, stored password. |
| password | String | Password mask, always`********`. |
| realm | String | Realm in which credentials are valid. |
| username | String | User name associated with credentials. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/passwords/user1
```

## POST /services/storage/passwords/{name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| password | String | No | — | User password credential. |

### Response keys

| Name | Type | Description |
|---|---|---|
| clear_password | String | Clear text password. |
| encr_password | String | Encrypted, stored password. |
| password | String | Password mask, always`********`. |
| realm | String | Realm in which credentials are valid. |
| username | String | User name associated with credentials. |

### Example

```
curl -k -u admin:changeme https://localhost:8089/servicesNS/nobody/search/storage/passwords/splunker -d password=changemeAgain
```

## DELETE /services/storage/passwords/{name}

### Request parameters

No request parameters.

### Response keys

Returns a list of the remaining credentials in the {name} namespace.

### Example

```
curl -k -u admin:changeme --request DELETE https://localhost:8089/servicesNS/nobody/search/storage/passwords/:user1:
```


---
