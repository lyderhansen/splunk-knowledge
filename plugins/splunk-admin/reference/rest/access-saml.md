> **Overview:** Splunk Enterprise users can configure SAML authentication for single sign-on (SSO). If you are using Splunk Cloud Platform, contact Support to request assistance.

# /services/admin/replicate-SAML-certs

Replicate SAML IdP certificates across a search head cluster.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/replicate-SAML-certs` |
| Auth required | Yes |
| Capability | `change_authentication` |

## POST /services/admin/replicate-SAML-certs

### Request parameters

See Splunk documentation for this operation.


---

# /services/admin/SAML-groups

Manage external groups in an IdP response to internal Splunk roles.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/SAML-groups` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/SAML-groups

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| roles | String | Corresponding internal role for the external group. |

### Example

```
curl -k -u admin:password https://localhost:8089/services/admin/SAML-groups
```

## POST /services/admin/SAML-groups

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | No | — | External group name. |
| roles | String | No | — | Equivalent internal role for the group. |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme  https://localhost:8089/services/admin/SAML-groups -d name=Splunk -d roles=user
```


---

# /services/admin/SAML-groups/{group_name}

Delete the`{group_name}` group.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/SAML-groups/{group_name}` |
| Auth required | Yes |
| Capability | `change_authentication` |

## DELETE /services/admin/SAML-groups/{group_name}

### Request parameters

No request parameters.

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:password --request DELETE https://localhost:8089/services/admin/SAML-groups/group_to_delete
```


---

# /services/admin/SAML-idp-metadata

Access IdP SAML metadata attributes.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/SAML-idp-metadata` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/SAML-idp-metadata

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| idpMetadataFile | File path. See description. | No | — | Full path of the metadata file location. File should be local to splunkd server. |

### Response keys

| Name | Type | Description |
|---|---|---|
| idpMetadataPayload | String | SAML IdP metadata in XML format. |

### Example

```
curl -k -u admin:changeme  https://localhost:8089/services/admin/SAML-idp-metadata
```


---

# /services/admin/SAML-sp-metadata

Access service provider SAML metadata attributes.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/SAML-sp-metadata` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/SAML-sp-metadata

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| spMetadataPayload | String | SAML service provider metadata in XML format. |

### Example

```
curl -k -u admin:changeme  https://localhost:8089/services/admin/SAML-sp-metadata
```


---

# /services/admin/SAML-user-role-map

Access or create SAML user and role information for saved searches if your IdP does not support Attribute Query Requests. To delete a username, see`admin/SAML-user-role-map/{name}`.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/SAML-user-role-map` |
| Auth required | Yes |
| Capability | `edit_user` |

## GET /services/admin/SAML-user-role-map

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| name | String | SAML username for running saved searches. |
| roles | String | Assigned roles for this user. |

### Example

```
curl -k -u admin:password https://localhost:8089/services/admin/SAML-user-role-map
```

## POST /services/admin/SAML-user-role-map

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | No | — | SAML username for running saved searches. |
| roles | String | No | — | Assigned roles for this user. |

### Response keys

| Name | Type | Description |
|---|---|---|
| name | String | SAML username for running saved searches. |
| roles | String | Assigned roles for this user. |

### Example

```
curl -k -u admin:password https://localhost:8089/services/admin/SAML-user-role-map -d name=samluser004@example.foo -d roles=user
```

## DELETE /services/admin/SAML-user-role-map

### Request parameters

See Splunk documentation for this operation.


---

# /services/admin/SAML-user-role-map/{name}

Delete SAML user and role information for saved searches if your IdP does not support Attribute Query Requests.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/SAML-user-role-map/{name}` |
| Auth required | Yes |
| Capability | `edit_user` |

## DELETE /services/admin/SAML-user-role-map/{name}

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| name | String | SAML username for running saved searches. |
| roles | String | Assigned roles for this user. |

### Example

```
curl -k -u admin:password --request DELETE https://localhost:8089/services/admin/SAML-user-role-map/samluser004@example.com
```


---

# /services/authentication/providers/SAML

Access and create SAML configurations.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/SAML` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/authentication/providers/SAML

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| allowSslCompression | String | Indicates whether ssl data compression is enabled. |
| assertionConsumerServiceUrl | String | Endpoint where SAML assertions are posted by the IdP. |
| attributeAliasMail | String | Specifies which SAML attribute is mapped to 'email'. Defaults to 'email'. |
| attributeAliasRealName | String | Specifies which SAML attribute maps to 'realName'. Defaults to`realName`. |
| attributeAliasRole | String | Specifies which SAML attribute maps to`role`. Defaults to`role`. |
| attributeQueryRequestSigned | String | Indicates whether Attribute Queries should be signed. |
| attributeQueryResponseSigned | String | Indicates whether Attribute Query responses should be signed. |
| attributeQuerySoapPassword | String | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQuerySoapUsername | String | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQueryTTL | String | ttl (time to live) for the Attribute Query credentials cache. |
| blacklistedAutoMappedRoles | String | Comma separated list of Splunk roles that should be blacklisted from being auto-mapped from the IDP Response. |
| blacklistedUsers | String | Comma separated list of user names from the IDP response to be blacklisted by Splunk software. |
| caCertFile | String | File path for CA certificate. For example, /home/user123/saml-install/etc/auth/server.pem |
| cipherSuite | String | Ciphersuite for making Attribute Queries using ssl. For example,`TLSv1+HIGH:@STRENGTH`. |
| defaultRoleIfMissing | String | Default role to use if no role is returned in a SAML response. |
| ecdhCurves | String | EC curves for ECDH/ECDHE key exchange - ssl setting. |
| entityId | String | Unique id preconfigured by the IdP. |
| errorUrL | String | URL to display for a SAML error. Errors may be due to incorrect or incomplete configuration in either the IDP or Splunk deployment. |
| errorUrlLabel | String | Label or title of the content to which errorUrl points. Defaults to`Click here to resolve SAML error.`. |
| fqdn | String | Load balancer url. |
| idpAttributeQueryUrl | String | IdP attribute query url where SAML attribute queries are sent. |
| idpCertPath | String | Path for IdP certificate. |
| idpSLOUrl | String | IdP sso url where SAML SSO requests are sent. |
| idpSSOUrl | String | IdP SSO url where SAML SLO requests are sent. |
| maxAttributeQueryQueueSize | String | Maximum number of Attribute jobs to queue. |
| maxAttributeQueryThreads | String | Maximum number of threads for asynchronous Attribute Queries. |
| name | String | Configuration stanza name. |
| (response) | — | nameIdFormat |
| redirectAfterLogoutToUrl | String | Redirect URL after user logout If no SLO URL is configured. |
| (response) | — | redirectPort |
| signAuthnRequest | String | Indicates whether to sign authentication requests. |
| (response) | — | signatureAlgorithm |
| signedAssertion | String | Indicates whether to sign SAML assertions. |
| singleLogoutServiceUrl | String | URL where the IdP posts SAML Single Logout responses. |
| skipAttributeQueryRequestForUsers | String | Used in conjunction with`defaultRoleIFMissing`. Indicates whether to skip Attribute Queries for some users. |
| sloBinding | String | Binding used when making a logout request or sending a logout response to complete the logout workflow. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |
| spCertPath | String | Service provider certificate path. |
| sslAltNameToCheck | String | Alternate name to check in the peer certificate. |
| sslCommonNameToCheck | String | Common name to check in the peer certificate. |
| sslKeysfile | String | Location of service provider private key. |
| sslKeysfilePassword | String | SSL password. |
| sslVerifyServerCert | String | Indicates whether to verify peer certificate. |
| sslVersions | String | SSL versions. |
| ssoBinding | String | Binding used when making a SP-initiated SAML request. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |
| uiStatusPage | String | Splunk Web page for redirecting users in case of errors. |

### Example

```
curl -u admin:pass -k -X GET  https://localhost:8089/services/authentication/providers/SAML
```

## POST /services/authentication/providers/SAML

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| allowSslCompression | String | No | — | Indicates whether ssl data compression is enabled. |
| attributeAliasMail | String | No | — | Specifies which SAML attribute is mapped to 'email'. Defaults to 'email'. |
| attributeAliasRealName | String | No | — | Specifies which SAML attribute maps to 'realName'. Defaults to`realName`. |
| attributeAliasRole | String | No | — | Specifies which SAML attribute maps to`role`. Defaults to`role`. |
| attributeQueryRequestSigned | String | No | — | Indicates whether Attribute Queries should be signed. |
| attributeQueryResponseSigned | String | No | — | Indicates whether Attribute Query responses should be signed. |
| attributeQuerySoapPassword | String | No | — | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQuerySoapUsername | String | No | — | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQueryTTL | String | No | — | ttl (time to live) for the Attribute Query credentials cache. |
| blacklistedAutoMappedRoles | String | No | — | Comma separated list of Splunk roles that should be blacklisted from being auto-mapped from the IDP Response. |
| blacklistedUsers | String | No | — | Comma separated list of user names from the IDP response to be blacklisted by Splunk software. |
| caCertFile | String | No | — | File path for CA certificate. For example, /home/user123/saml-install/etc/auth/server.pem |
| cipherSuite | String | No | — | Ciphersuite for making Attribute Queries using ssl. For example,`TLSv1+HIGH:@STRENGTH`. |
| defaultRoleIfMissing | String | No | — | Default role to use if no role is returned in a SAML response. |
| ecdhCurves | String | No | — | EC curves for ECDH/ECDHE key exchange - ssl setting. |
| entityId | String | Yes | — | Required. Unique id preconfigured by the IdP. |
| errorUrL | String | No | — | URL to display for a SAML error. Errors may be due to incorrect or incomplete configuration in either the IDP or the Splunk deployment. |
| errorUrlLabel | String | No | — | Label or title of the content to which errorUrl points. Defaults to`Click here to resolve SAML error.`. |
| fqdn | String | No | — | Load balancer url. |
| idpAttributeQueryUrl | String | No | — | IdP attribute query url where SAML attribute queries are sent. |
| idpCertPath | String | No | — | Path for IdP certificate. |
| idpMetadataFile | String | No | — | Full path to idpMetadata on disk. Used to retrieve IdP information such as idpSLOUrl, idpSSOUrl, and signing certificate. |
| idpSLOUrl | String | No | — | IdP sso url where SAML SSO requests are sent. |
| idpSSOUrl | String | Yes | — | Required. IdP SSO url where SAML SLO requests are sent. |
| name | String | Yes | — | Required. Configuration stanza name. |
| nameIdFormat | — | No | — | — |
| redirectAfterLogoutToUrl | String | No | — | Redirect URL after user logout If no SLO URL is configured. |
| redirectPort | — | No | — | — |
| signAuthnRequest | String | No | — | Indicates whether to sign authentication requests. |
| signatureAlgorithm | — | No | — | — |
| signedAssertion | String | No | — | Indicates whether to sign SAML assertions. |
| skipAttributeQueryRequestForUsers | String | No | — | Used in conjunction with`defaultRoleIFMissing`. Indicates whether to skip Attribute Queries for some users. |
| sloBinding | String | No | — | Binding used when making a logout request or sending a logout response to complete the logout workflow. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |
| sslAltNameToCheck | String | No | — | Alternate name to check in the peer certificate. |
| sslCommonNameToCheck | String | No | — | Common name to check in the peer certificate. |
| sslKeysfile | String | No | — | Location of service provider private key. |
| sslKeysfilePassword | String | No | — | SSL password. |
| sslVerifyServerCert | String | No | — | Indicates whether to verify peer certificate. |
| sslVersions | String | No | — | SSL versions. |
| ssoBinding | String | No | — | Binding used when making a SP-initiated SAML request. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed https://localhost:8089/services/authentication/providers/SAML -d "name=saml-test" -d "idpSSOUrl=https://saml-idp:9999/idp/SSO.saml2" -d "idpAttributeQueryUrl=https://saml-idp:9999/idp/attrsvc.ssaml2" -d "entityId=saml-test-entity" -d "attributeQuerySoapPassword=splunk" -d "attributeQuerySoapUsername=test_ping"
```


---

# /services/authentication/providers/SAML/{stanza_name}

See Splunk REST API Access Control reference.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/SAML/{stanza_name}` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## GET /services/authentication/providers/SAML/{stanza_name}

### Request parameters

No request parameters.

### Response keys

| Name | Type | Description |
|---|---|---|
| allowSslCompression | String | Indicates whether ssl data compression is enabled. |
| assertionConsumerServiceUrl | String | Endpoint where SAML assertions are posted by the IdP. |
| attributeAliasMail | String | Specifies which SAML attribute is mapped to 'email'. Defaults to 'email'. |
| attributeAliasRealName | String | Specifies which SAML attribute maps to 'realName'. Defaults to`realName`. |
| attributeAliasRole | String | Specifies which SAML attribute maps to`role`. Defaults to`role`. |
| attributeQueryRequestSigned | String | Indicates whether Attribute Queries should be signed. |
| attributeQueryResponseSigned | String | Indicates whether Attribute Query responses should be signed. |
| attributeQuerySoapPassword | String | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQuerySoapUsername | String | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQueryTTL | String | ttl (time to live) for the Attribute Query credentials cache. |
| blacklistedAutoMappedRoles | String | Comma separated list of Splunk roles that should be blacklisted from being auto-mapped from the IDP Response. |
| blacklistedUsers | String | Comma separated list of user names from the IDP response to be blacklisted by Splunk software. |
| caCertFile | String | File path for CA certificate. For example, /home/user123/saml-install/etc/auth/server.pem |
| cipherSuite | String | Ciphersuite for making Attribute Queries using ssl. For example,`TLSv1+HIGH:@STRENGTH`. |
| defaultRoleIfMissing | String | Default role to use if no role is returned in a SAML response. |
| ecdhCurves | String | EC curves for ECDH/ECDHE key exchange - ssl setting. |
| entityId | String | Unique id preconfigured by the IdP. |
| errorUrL | String | URL to display for a SAML error. Errors may be due to incorrect or incomplete configuration in either the IDP or Splunk deployment. |
| errorUrlLabel | String | Label or title of the content to which errorUrl points. Defaults to`Click here to resolve SAML error.`. |
| fqdn | String | Load balancer url. |
| idpAttributeQueryUrl | String | IdP attribute query url where SAML attribute queries are sent. |
| idpCertPath | String | Path for IdP certificate. |
| idpSLOUrl | String | IdP sso url where SAML SSO requests are sent. |
| idpSSOUrl | String | IdP SSO url where SAML SLO requests are sent. |
| maxAttributeQueryQueueSize | String | Maximum number of Attribute jobs to queue. |
| maxAttributeQueryThreads | String | Maximum number of threads for asynchronous Attribute Queries. |
| name | String | Configuration stanza name. |
| (response) | — | nameIdFormat |
| redirectAfterLogoutToUrl | String | Redirect URL after user logout If no SLO URL is configured. |
| (response) | — | redirectPort |
| signAuthnRequest | String | Indicates whether to sign authentication requests. |
| (response) | — | signatureAlgorithm |
| signedAssertion | String | Indicates whether to sign SAML assertions. |
| singleLogoutServiceUrl | String | URL where the IdP posts SAML Single Logout responses. |
| skipAttributeQueryRequestForUsers | String | Used in conjunction with`defaultRoleIFMissing`. Indicates whether to skip Attribute Queries for some users. |
| sloBinding | String | Binding used when making a logout request or sending a logout response to complete the logout workflow. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |
| spCertPath | String | Service provider certificate path. |
| sslAltNameToCheck | String | Alternate name to check in the peer certificate. |
| sslCommonNameToCheck | String | Common name to check in the peer certificate. |
| sslKeysfile | String | Location of service provider private key. |
| sslKeysfilePassword | String | SSL password. |
| sslVerifyServerCert | String | Indicates whether to verify peer certificate. |
| sslVersions | String | SSL versions. |
| ssoBinding | String | Binding used when making a SP-initiated SAML request. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |
| uiStatusPage | String | Splunk Web page for redirecting users in case of errors. |

### Example

```
curl -k -u admin:password https://localhost:8089/services/authentication/providers/SAML/saml_settings
```

## POST /services/authentication/providers/SAML/{stanza_name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| allowSslCompression | String | No | — | Indicates whether ssl data compression is enabled. |
| attributeAliasMail | String | No | — | Specifies which SAML attribute is mapped to 'email'. Defaults to 'email'. |
| attributeAliasRealName | String | No | — | Specifies which SAML attribute maps to 'realName'. Defaults to`realName`. |
| attributeAliasRole | String | No | — | Specifies which SAML attribute maps to`role`. Defaults to`role`. |
| attributeQueryRequestSigned | String | No | — | Indicates whether Attribute Queries should be signed. |
| attributeQueryResponseSigned | String | No | — | Indicates whether Attribute Query responses should be signed. |
| attributeQuerySoapPassword | String | No | — | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQuerySoapUsername | String | No | — | Credentials for making Attribute Query using SOAP over HTTP. |
| attributeQueryTTL | String | No | — | ttl (time to live) for the Attribute Query credentials cache. |
| blacklistedAutoMappedRoles | String | No | — | Comma separated list of Splunk roles that should be blacklisted from being auto-mapped from the IDP Response. |
| blacklistedUsers | String | No | — | Comma separated list of user names from the IDP response to be blacklisted by Splunk software. |
| caCertFile | String | No | — | File path for CA certificate. For example, /home/user123/saml-install/etc/auth/server.pem |
| cipherSuite | String | No | — | Ciphersuite for making Attribute Queries using ssl. For example,`TLSv1+HIGH:@STRENGTH`. |
| defaultRoleIfMissing | String | No | — | Default role to use if no role is returned in a SAML response. |
| ecdhCurves | String | No | — | EC curves for ECDH/ECDHE key exchange - ssl setting. |
| entityId | String | Yes | — | Required. Unique id preconfigured by the IdP. |
| errorUrL | String | No | — | URL to display for a SAML error. Errors may be due to incorrect or incomplete configuration in either the IDP or the Splunk deployment. |
| errorUrlLabel | String | No | — | Label or title of the content to which errorUrl points. Defaults to`Click here to resolve SAML error.`. |
| fqdn | String | No | — | Load balancer url. |
| idpAttributeQueryUrl | String | No | — | IdP attribute query url where SAML attribute queries are sent. |
| idpCertPath | String | No | — | Path for IdP certificate. |
| idpSLOUrl | String | No | — | IdP sso url where SAML SSO requests are sent. |
| idpSSOUrl | String | Yes | — | Required. IdP SSO url where SAML SLO requests are sent. |
| name | String | Yes | — | Required. Configuration stanza name. |
| nameIdFormat | — | No | — | — |
| redirectAfterLogoutToUrl | String | No | — | Redirect URL after user logout If no SLO URL is configured. |
| redirectPort | — | No | — | — |
| signAuthnRequest | String | No | — | Indicates whether to sign authentication requests. |
| signatureAlgorithm | — | No | — | — |
| signedAssertion | String | No | — | Indicates whether to sign SAML assertions. |
| skipAttributeQueryRequestForUsers | String | No | — | Used in conjunction with`defaultRoleIFMissing`. Indicates whether to skip Attribute Queries for some users. |
| sloBinding | String | No | — | Binding used when making a logout request or sending a logout response to complete the logout workflow. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |
| sslAltNameToCheck | String | No | — | Alternate name to check in the peer certificate. |
| sslCommonNameToCheck | String | No | — | Common name to check in the peer certificate. |
| sslKeysfile | String | No | — | Location of service provider private key. |
| sslKeysfilePassword | String | No | — | SSL password. |
| sslVerifyServerCert | String | No | — | Indicates whether to verify peer certificate. |
| sslVersions | String | No | — | SSL versions. |
| ssoBinding | String | No | — | Binding used when making a SP-initiated SAML request. Possible values are`HTTPPost`(default) and`HTTPRedirect`. This binding must match the binding configured on the IDP. |

### Response keys

No returned fields in the documentation.

### Example

```
curl -k -u admin:changed https://localhost:8089/services/authentication/providers/SAML/saml-test -d "entityId=someOtherEntityId"
```


---

# /services/authentication/providers/SAML/{stanza_name}/enable

See Splunk REST API Access Control reference.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/SAML/{stanza_name}/enable` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## POST /services/authentication/providers/SAML/{stanza_name}/enable

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:password -X POST https://localhost:8089/services/authentication/providers/SAML/my_strategy/enable
```


---

# /services/authentication/providers/SAML/{stanza_name}/disable

See Splunk REST API Access Control reference.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/SAML/{stanza_name}/disable` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## POST /services/authentication/providers/SAML/{stanza_name}/disable

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:password -X POST https://localhost:8089/services/authentication/providers/SAML/my_strategy/disable
```


---
