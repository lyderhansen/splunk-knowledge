# /services/authentication/providers/oauth2

Manage OAuth provider configurations.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/oauth2` |
| Auth required | Yes |
| Capability | `list_oauth_configs (GET); edit_oauth_configs (POST/DELETE)` |

## GET /services/authentication/providers/oauth2

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| (response) | — | A list of all configured OAuth provider configurations, each with fields as described in the POST returned values. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/authentication/providers/oauth2?output_mode=json
```

## POST /services/authentication/providers/oauth2

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | string | No | — | Configuration name/identifier. |
| jwks_uri | string | No | — | OIDC provider's public keys endpoint. |
| audience | string | No | — | Expected token audience. |
| groupsClaim | string | No | — | JWT claim containing user groups. |
| issuer | string | No | — | Token issuer URL. |
| clientIdClaim | string | No | — | JWT claim containing client ID. |
| clientFullNameClaim | string | No | — | Optional. JWT claim containing human-readable client name. |

### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/authentication/providers/oauth2 \
  -d name=my_oidc_provider \
  -d issuer=https://idp.example.com \
  -d jwks_uri=https://idp.example.com/oauth2/v1/keys \
  -d audience=splunk_aud \
  -d groupsClaim=groups \
  -d clientIdClaim=sub \
  -d clientFullNameClaim=name
```

### Returned values

| Name | Type | Description |
|---|---|---|
| name | string | Configuration name/identifier. |
| jwks_uri | string | OIDC provider's public keys endpoint. |
| audience | string | Expected token audience. |
| groupsClaim | string | JWT claim containing user groups. |
| issuer | string | Token issuer URL. |
| clientIdClaim | string | JWT claim containing client ID. |
| clientFullNameClaim | string | Optional. JWT claim containing human-readable client name. |


---

# /services/authentication/providers/oauth2/{name}

Access and manage a specific`{name}` OAuth 2.0 provider configuration.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/oauth2/{name}` |
| Auth required | Yes |
| Capability | `list_oauth_configs (GET); edit_oauth_configs (POST/DELETE)` |

## GET /services/authentication/providers/oauth2/{name}

### Request parameters

No request parameters.

### Returned values

Returns the details of the specified OAuth provider configuration.

### Example

```
curl -k -u admin:changeme -X GET https://<your_splunk_host>:8089/services/authentication/providers/oauth2/okta_provider
```

## POST /services/authentication/providers/oauth2/{name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `jwks_uri` | String | No | — | Optional. The OIDC provider's public keys endpoint URL. |
| `audience` | String | No | — | Optional. The expected audience (`aud`) claim in the JWT. |
| `groupsClaim` | String | No | — | Optional. The name of the JWT claim that contains user groups. |
| `clientIdClaim` | String | No | — | Optional. The name of the JWT claim that contains the client ID. |
| `clientFullNameClaim` | String | No | — | Optional. The name of the JWT claim containing a human-readable client name. |
| `disabled` | Boolean | No | — | Optional. Set to`true` to disable the configuration. Defaults to`false`. |

### Returned values

Returns the updated details of the OAuth provider configuration.

### Example

```
curl -k -u admin:changeme -X POST \
https://<your_splunk_host>:8089/services/authentication/providers/oauth2/okta_provider \
-d audience="new_splunk_api" \
-d disabled=true
```

## DELETE /services/authentication/providers/oauth2/{name}

### Request parameters

No request parameters.

### Returned values

Returns a success message on successful deletion.

### Example

```
curl -k -u admin:changeme -X DELETE https://<your_splunk_host>:8089/services/authentication/providers/oauth2/okta_provider
```


---

# /services/admin/metrics-reload/_reload

Use this endpoint to reload the metrics processor after updating a metrics-related configuration.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/metrics-reload/_reload` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## POST /services/admin/metrics-reload/_reload

### Request parameters

See Splunk documentation for this operation.

### Example

```
curl -k -u admin:changeme https://localhost:8089/services/admin/metrics-reload/_reload
```


---

# /services/admin/oauth2-groups

Manages mappings between IdP groups and Splunk roles for OAuth 2.0 configurations.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/oauth2-groups` |
| Auth required | Yes |
| Capability | `list_oauth_config_role_mappings` (GET); `edit_oauth_config_role_mappings` (POST/DELETE) |

## GET /services/admin/oauth2-groups

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `config` | String | No | — | Optional. The name of an OAuth configuration to filter the results. If omitted, mappings for all configurations are returned. |

### Returned values

Returns a list of group-role mappings.

### Example

```
curl -k -u admin:changeme -X GET https://<your_splunk_host>:8089/services/admin/oauth2-groups
```

## POST /services/admin/oauth2-groups

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | String | Yes | — | Required. The group name from the Identity Provider. |
| `config` | String | Yes | — | Required. The name of the OAuth configuration this mapping belongs to. |
| `roles` | String | Yes | — | Required. The Splunk role to assign to the group. Supply this parameter for each role you want to assign. |

### Returned values

Returns the details of the newly created group-role mapping.

### Example

```
curl -k -u admin:changeme -X POST \
https://<your_splunk_host>:8089/services/admin/oauth2-groups \
-d name="idpgroup1" \
-d config="okta_provider" \
-d roles="admin" \
-d roles="user"
```


---

# /oauth2/v1/token

Exchanges an Identity Provider (IdP) token for a Splunk access token.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/oauth2/v1/token` |
| Auth required | No |
| Capability | `None (public endpoint; validates JWT in request)` |

## POST /oauth2/v1/token

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `grant_type` | String | Yes | — | Required. Must be set to`client_credentials`. |
| `client_id` | String | Yes | — | Required. The client ID of the OAuth application. This must match the corresponding claim in the IdP token. |
| `client_assertion_type` | String | Yes | — | Required. Must be set to`urn:ietf:params:oauth:client-assertion-type:jwt-bearer`. |
| `client_assertion` | String | Yes | — | Required. The JWT access token obtained from the Identity Provider. |

### Returned values

Returns a Splunk access token upon successful validation and exchange. The response for this endpoint is in JSON format, which is standard for OAuth 2.0 token exchanges.

### Example

```
curl -k -X POST https://<your_splunk_host>:8089/oauth2/v1/token \
-d grant_type="client_credentials" \
-d client_id="d7f3a8b4-5a1e-47a9-80fd-1c3d14e1b746" \
-d client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
-d client_assertion="<IdP_JWT_token>"
```


---
