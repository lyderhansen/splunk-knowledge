# /services/admin/Duo-MFA

Configure Duo Multifactor authentication.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/Duo-MFA` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/Duo-MFA

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| name | String | Configuration stanza name |
| integrationKey | String | Duo integration key for Splunk. Must be of size = 20. |
| secretKey | String | Shared secret key between Splunk and Duo. |
| apiHostname | String | Duo REST API endpoint used by Splunk for multifactor authentication |
| appSecretKey | String | Splunk application specific secret key. Must be a random generated hex of length 40 or more. |
| failOpen | String | Boolean indicating whether Splunk should bypass the Duo service if it is unavailable. Defaults to`false`. |
| timeout | String | Positive integer indicating the Duo connection timeout, in seconds, for declaring the Duo service unavailable. Defaults to 15 seconds. |
| sslVersions | String | SSL version to use for accessing the Duo REST API. Defaults to Splunkd`sslVersion`. |
| cipherSuite | String | Cipher suite to use for accessing the Duo REST API. Defaults to Splunkd`cipherSuite`. |
| ecdhCurves | String | ECDH curve value to use for accessing the Duo REST API. Defaults to Splunkd`ecdhCurves`. |
| sslVerifyServerCert | String | Boolean indicating if Duo server certificate verification is required. Defaults to`false`. |
| sslRootCAPath | String | Full path of the certificate to be used for certificate verification if sslVerifyServerCert is`true`. |
| sslCommonNameToCheck | String | Common name to verify if sslVerifyServerCert is`true`. |
| sslAltNameToCheck | String | Alternate name to verify if sslVerifyServerCert is`true`. |
| useClientSSLCompression | String | Boolean indicating if client side SSL compression is enabled. Defaults to Splunkd`useClientSSLCompression`. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/admin/Duo-MFA?output_mode=json
```

## POST /services/admin/Duo-MFA

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | Yes | — | Required. Configuration stanza name |
| integrationKey | See description | Yes | — | Required. Duo integration key for Splunk. Must be of size = 20. |
| secretKey | See description | Yes | — | Required. Shared secret key between Splunk and Duo. |
| apiHostname | See description | Yes | — | Required. Duo REST API endpoint used by Splunk for multifactor authentication |
| appSecretKey | See description | Yes | — | Required. Splunk application specific secret key. Must be a random generated hex of length 40 or more. |
| failOpen | Boolean | No | — | Optional. Indicates whether Splunk should bypass the Duo service if it is unavailable. Defaults to`false`. |
| timeout | Positive integer | No | — | Optional. Positive integer indicating the Duo connection timeout, in seconds, for declaring the Duo service unavailable. Defaults to`15` seconds. |
| sslVersions | See description | No | — | Optional. SSL version to use for accessing the Duo REST API. Defaults to Splunkd`sslVersion`. |
| cipherSuite | See description | No | — | Optional. Cipher suite to use for accessing the Duo REST API. Defaults to Splunkd`cipherSuite`. |
| ecdhCurves | See description | No | — | Optional. ECDH curve value to use for accessing the Duo REST API. Defaults to Splunkd`ecdhCurves`. |
| sslVerifyServerCert | Boolean | No | — | Optional. Indicates if Duo server certificate verification is required. Defaults to`false`. If set to`true`, provide a sslRootCAPath to ensure successful certificate validation. |
| sslRootCAPath | See description | No | — | Optional. Full path of the certificate to be used for certificate verification. If sslVerifyServerCert is`true`, this path must be provided to ensure successful certificate validation. |
| sslCommonNameToCheck | See description | No | — | Optional. Common name to verify if sslVerifyServerCert is`true`. |
| sslAltNameToCheck | See description | No | — | Optional. Alternate name to verify if sslVerifyServerCert is`true`. |
| useClientSSLCompression | See description | No | — | Optional. Boolean indicating if client side SSL compression is enabled. Defaults to Splunkd`useClientSSLCompression`. |

### Returned values

| Name | Type | Description |
|---|---|---|
| name | String | Configuration stanza name |
| integrationKey | String | Duo integration key for Splunk. Must be of size = 20. |
| secretKey | String | Shared secret key between Splunk and Duo. |
| apiHostname | String | Duo REST API endpoint used by Splunk for multifactor authentication |
| appSecretKey | String | Splunk application specific secret key. Must be a random generated hex of length 40 or more. |
| failOpen | String | Boolean indicating whether Splunk should bypass the Duo service if it is unavailable. Defaults to`false`. |
| timeout | String | Positive integer indicating the Duo connection timeout, in seconds, for declaring the Duo service unavailable. Defaults to`15` seconds. |
| sslVersions | String | SSL version to use for accessing the Duo REST API. Defaults to Splunkd`sslVersion`. |
| cipherSuite | String | Cipher suite to use for accessing the Duo REST API. Defaults to Splunkd`cipherSuite`. |
| ecdhCurves | String | ECDH curve value to use for accessing the Duo REST API. Defaults to Splunkd`ecdhCurves`. |
| sslVerifyServerCert | String | Boolean that indicates if Duo server certificate verification is required. Defaults to`false`. If set to`true`, provide a sslRootCAPath to ensure successful certificate validation. |
| sslRootCAPath | String | Full path of the certificate to be used for certificate verification. If sslVerifyServerCert is`true`, this path must be provided to ensure successful certificate validation. |
| sslCommonNameToCheck | String | Common name to verify if sslVerifyServerCert is`true`. |
| sslAltNameToCheck | String | Alternate name to verify if sslVerifyServerCert is`true`. |
| useClientSSLCompression | String | Boolean indicating if client side SSL compression is enabled. Defaults to Splunkd`useClientSSLCompression`. |

### Example

```
curl -k -u admin:changeme -X POST https://localhost:8089/services/admin/Duo-MFA/duo-mfa -d integrationKey=DIOXYOKGDJNK4JRRT0KT -d secretKey=DABZXYbRVW2yqvTM6fPVMkbgxBna0HTuYa9XuCQ2 -d appSecretKey=56a15e48ec796f3d6ee2763b088f8ca77109692c -d apiHostname=api-cc7a8eab.duosecurity.com -d failOpen=false -d timeout=10 -d sslVersions=tls1.2 -d sslCommonNameToCheck=*.duosecurity.com -d useClientSSLCompression=true -d sslVerifyServerCert=true -d sslRootCAPath=/home/user1/git/example/splunk/etc/auth/DigiCertHighAssuranceEVRootCA.pem
```


---

# /services/admin/Duo-MFA/{name}

Access and manage the`{name}` Duo Multifactor configuration.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/Duo-MFA/{name}` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/Duo-MFA/{name}

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| name | String | Configuration stanza name |
| integrationKey | String | Duo integration key for Splunk. Must be of size = 20. |
| secretKey | String | Shared secret key between Splunk and Duo. |
| apiHostname | String | Duo REST API endpoint used by Splunk for multifactor authentication |
| appSecretKey | String | Splunk application specific secret key. Must be a random generated hex of length 40 or more. |
| failOpen | String | Boolean indicating whether Splunk should bypass the Duo service if it is unavailable. Defaults to`false`. |
| timeout | String | Positive integer indicating the Duo connection timeout, in seconds, for declaring the Duo service unavailable. Defaults to 15 seconds. |
| sslVersions | String | SSL version to use for accessing the Duo REST API. Defaults to Splunkd`sslVersion`. |
| cipherSuite | String | Cipher suite to use for accessing the Duo REST API. Defaults to Splunkd`cipherSuite`. |
| ecdhCurves | String | ECDH curve value to use for accessing the Duo REST API. Defaults to Splunkd`ecdhCurves`. |
| sslVerifyServerCert | String | Boolean indicating if Duo server certificate verification is required. Defaults to`false`. |
| sslRootCAPath | String | Full path of the certificate to be used for certificate verification if sslVerifyServerCert is`true`. |
| sslCommonNameToCheck | String | Common name to verify if sslVerifyServerCert is`true`. |
| sslAltNameToCheck | String | Alternate name to verify if sslVerifyServerCert is`true`. |
| useClientSSLCompression | String | Boolean indicating if client side SSL compression is enabled. Defaults to Splunkd`useClientSSLCompression`. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/admin/Duo-MFA/{name}?output_mode=json
```

## POST /services/admin/Duo-MFA/{name}

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | No | — | Configuration stanza name |
| integrationKey | See description | No | — | Duo integration key for Splunk. Must be of size = 20. |
| secretKey | See description | No | — | Shared secret key between Splunk and Duo. |
| apiHostname | See description | No | — | Duo REST API endpoint used by Splunk for multifactor authentication |
| appSecretKey | See description | No | — | Splunk application specific secret key. Must be a random generated hex of length 40 or more. |
| failOpen | Boolean | No | — | Indicates whether Splunk should bypass the Duo service if it is unavailable. Defaults to`false`. |
| timeout | Positive integer | No | — | Optional. Positive integer indicating the Duo connection timeout, in seconds, for declaring the Duo service unavailable. Defaults to`15` seconds. |
| sslVersions | See description | No | — | Optional. SSL version to use for accessing the Duo REST API. Defaults to Splunkd`sslVersion`. |
| cipherSuite | See description | No | — | Optional. Cipher suite to use for accessing the Duo REST API. Defaults to Splunkd`cipherSuite`. |
| ecdhCurves | See description | No | — | Optional. ECDH curve value to use for accessing the Duo REST API. Defaults to Splunkd`ecdhCurves`. |
| sslVerifyServerCert | Boolean | No | — | Optional. Indicates if Duo server certificate verification is required. Defaults to`false`. If set to`true`, provide a sslRootCAPath to ensure successful certificate validation. |
| sslRootCAPath | See description | No | — | Optional. Full path of the certificate to be used for certificate verification. If sslVerifyServerCert is`true`, this path must be provided to ensure successful certificate validation. |
| sslCommonNameToCheck | See description | No | — | Optional. Common name to verify if sslVerifyServerCert is`true`. |
| sslAltNameToCheck | See description | No | — | Optional. Alternate name to verify if sslVerifyServerCert is`true`. |
| useClientSSLCompression | See description | No | — | Optional. Boolean indicating if client side SSL compression is enabled. Defaults to Splunkd`useClientSSLCompression`. |

### Returned values

| Name | Type | Description |
|---|---|---|
| name | String | Configuration stanza name |
| integrationKey | String | Duo integration key for Splunk. Must be of size = 20. |
| secretKey | String | Shared secret key between Splunk and Duo. |
| apiHostname | String | Duo REST API endpoint used by Splunk for multifactor authentication |
| appSecretKey | String | Splunk application specific secret key. Must be a random generated hex of length 40 or more. |
| failOpen | String | Boolean indicating whether Splunk should bypass the Duo service if it is unavailable. Defaults to`false`. |
| timeout | String | Positive integer indicating the Duo connection timeout, in seconds, for declaring the Duo service unavailable. Defaults to`15` seconds. |
| sslVersions | String | SSL version to use for accessing the Duo REST API. Defaults to Splunkd`sslVersion`. |
| cipherSuite | String | Cipher suite to use for accessing the Duo REST API. Defaults to Splunkd`cipherSuite`. |
| ecdhCurves | String | ECDH curve value to use for accessing the Duo REST API. Defaults to Splunkd`ecdhCurves`. |
| sslVerifyServerCert | String | Boolean that indicates if Duo server certificate verification is required. Defaults to`false`. If set to`true`, provide a sslRootCAPath to ensure successful certificate validation. |
| sslRootCAPath | String | Full path of the certificate to be used for certificate verification. If sslVerifyServerCert is`true`, this path must be provided to ensure successful certificate validation. |
| sslCommonNameToCheck | String | Common name to verify if sslVerifyServerCert is`true`. |
| sslAltNameToCheck | String | Alternate name to verify if sslVerifyServerCert is`true`. |
| useClientSSLCompression | String | Boolean indicating if client side SSL compression is enabled. Defaults to Splunkd`useClientSSLCompression`. |

### Example

```
curl -k -u admin:changed https://localhost:8089/services/admin/Duo-MFA/duo-mfa -d failOpen=0
```

## DELETE /services/admin/Duo-MFA/{name}

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme -X DELETE https://localhost:8089/services/admin/Duo-MFA/duo-mfa
```


---
