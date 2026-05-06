> **Overview:** Splunk Enterprise users can configure RSA user authentication using the REST API.

# /services/admin/Rsa-MFA

Configure RSA multifactor authentication.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/Rsa-MFA` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/Rsa-MFA

### Request parameters

No request parameters.

### Returned values

| Name | Type | Description |
|---|---|---|
| name | String | Configuration stanza name |
| authManagerUrl | String | URL of REST endpoint of RSA Authentication Manager. |
| accessKey | String | Access key needed by Splunk to communicate with RSA Authentication Manager. Note that this value is hidden output. |
| clientId | String | Agent name created on RSA Authentication Manager is clientId. |
| failOpen | String | If true, allow login in case authentication server is unavailable. |
| timeout | String | It determines the connection timeout in seconds for the outbound HTTPS connection. |
| messageOnError | String | Message that will be shown to user in case of login failure. |
| enableMfaAuthRest | String | If true, enable authentication of REST calls. |
| caCertBundlePayload | String | SSL certificate chain return by RSA server. |
| replicateCertificates | String | If enabled, RSA certificate files are replicated across search head cluster setup. |

### Example

```
curl -k -u admin:changeme -X GET https://ronnie.sv.splunk.com:8130/services/admin/Rsa-MFA/rsa-mfa
```

## POST /services/admin/Rsa-MFA

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| name | String | Yes | — | Required. Name of RSA configuration stanza |
| authManagerUrl | String | Yes | — | Required. URL of REST endpoint of RSA Authentication Manager. |
| accessKey | String | Yes | — | Required. Access key needed by Splunk to communicate with RSA Authentication Manager. |
| clientId | String | Yes | — | Required. Agent name created on RSA Authentication Manager is clientId. |
| failOpen | Boolean | No | — | Optional. If true, allow login in case authentication server is unavailable. |
| timeout | Integer | No | — | Optional. It determines the connection timeout in seconds for the outbound HTTPS connection. |
| messageOnError | String | No | — | Optional. Message that will be shown to user in case of login failure. |
| enableMfaAuthRest | Boolean | No | — | Optional. If true, enable authentication of REST calls. |
| caCertBundlePayload | String | Yes | — | Required. SSL certificate chain return by RSA server. |
| replicateCertificates | Boolean | No | — | If enabled, RSA certificate files will be replicated across search head cluster setup. |

### Returned values

| Name | Type | Description |
|---|---|---|
| name | String | Configuration stanza name |
| authManagerUrl | String | URL of REST endpoint of RSA Authentication Manager. |
| accessKey | String | Access key needed by Splunk to communicate with RSA Authentication Manager. Note that this value is hidden output. |
| clientId | String | Agent name created on RSA Authentication Manager is clientId. |
| failOpen | String | If true, allow login in case authentication server is unavailable. |
| timeout | String | It determines the connection timeout in seconds for the outbound HTTPS connection. |
| messageOnError | String | Message that will be shown to user in case of login failure. |
| enableMfaAuthRest | String | If true, enable authentication of REST calls. |
| caCertBundlePayload | String | SSL certificate chain return by RSA server. |
| replicateCertificates | String | If enabled, RSA certificate files will be replicated across search head cluster setup. |

### Example

```
curl -k -u admin:Splunk_123 -X POST https://localhost:8092/services/admin/Rsa-MFA -d name=rsa-mfa  -d timeout=10 -d failOpen=true -d authManagerUrl=https://rsa-auth-manager.company.com:5555 -d  accessKey=sdrf23ri90jn00i -d  clientId=linux-vm -d  messageOnError=Please_contact_admin -d caCertBundlePayload=-----BEGIN%20CERTIFICATE-----%0AMIIF8jCCBNqgAwIBAgIQDmTF%2B8I2reFLFyrrQceMsDANBgkqhkiG9w0BAQsFADBw%0AMQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3%0Ad3cuZGlnaWNlcnQuY29tMS8wLQYDVQQDEyZEaWdpQ2VydCBTSEEyIEhpZ2ggQXNz%0AdXJhbmNlIFNlcnZlciBDQTAeFw0xNTExMDMwMDAwMDBaFw0xODExMjgxMjAwMDBa%0AMIGlMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEUMBIGA1UEBxML%0ATG9zIEFuZ2VsZXMxPDA6BgNVBAoTM0ludGVybmV0IENvcnBvcmF0aW9uIGZvciBB%0Ac3NpZ25lZCBOYW1lcyBhbmQgTnVtYmVyczETMBEGA1UECxMKVGVjaG5vbG9neTEY%0AMBYGA1UEAxMPd3d3LmV4YW1wbGUub3JnMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A%0AMIIBCgKCAQEAs0CWL2FjPiXBl61lRfvvE0KzLJmG9LWAC3bcBjgsH6NiVVo2dt6u%0AXfzi5bTm7F3K7srfUBYkLO78mraM9qizrHoIeyofrV%2Fn%2BpZZJauQsPjCPxMEJnRo%0AD8Z4KpWKX0LyDu1SputoI4nlQ%2FhtEhtiQnuoBfNZxF7WxcxGwEsZuS1KcXIkHl5V%0ARJOreKFHTaXcB1qcZ%2FQRaBIv0yhxvK1yBTwWddT4cli6GfHcCe3xGMaSL328Fgs3%0AjYrvG29PueB6VJi%2FtbbPu6qTfwp%2FH1brqdjh29U52Bhb0fJkM9DWxCP%2FCattcc7a%0Az8EXnCO%2BLK8vkhw%2FkAiJWPKx4RBvgy73nwIDAQABo4ICUDCCAkwwHwYDVR0jBBgw%0AFoAUUWj%2FkK8CB3U8zNllZGKiErhZcjswHQYDVR0OBBYEFKZPYB4fLdHn8SOgKpUW%0A5Oia6m5IMIGBBgNVHREEejB4gg93d3cuZXhhbXBsZS5vcmeCC2V4YW1wbGUuY29t%0AggtleGFtcGxlLmVkdYILZXhhbXBsZS5uZXSCC2V4YW1wbGUub3Jngg93d3cuZXhh%0AbXBsZS5jb22CD3d3dy5leGFtcGxlLmVkdYIPd3d3LmV4YW1wbGUubmV0MA4GA1Ud%0ADwEB%2FwQEAwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwdQYDVR0f%0ABG4wbDA0oDKgMIYuaHR0cDovL2NybDMuZGlnaWNlcnQuY29tL3NoYTItaGEtc2Vy%0AdmVyLWc0LmNybDA0oDKgMIYuaHR0cDovL2NybDQuZGlnaWNlcnQuY29tL3NoYTIt%0AaGEtc2VydmVyLWc0LmNybDBMBgNVHSAERTBDMDcGCWCGSAGG%2FWwBATAqMCgGCCsG%0AAQUFBwIBFhxodHRwczovL3d3dy5kaWdpY2VydC5jb20vQ1BTMAgGBmeBDAECAjCB%0AgwYIKwYBBQUHAQEEdzB1MCQGCCsGAQUFBzABhhhodHRwOi8vb2NzcC5kaWdpY2Vy%0AdC5jb20wTQYIKwYBBQUHMAKGQWh0dHA6Ly9jYWNlcnRzLmRpZ2ljZXJ0LmNvbS9E%0AaWdpQ2VydFNIQTJIaWdoQXNzdXJhbmNlU2VydmVyQ0EuY3J0MAwGA1UdEwEB%2FwQC%0AMAAwDQYJKoZIhvcNAQELBQADggEBAISomhGn2L0LJn5SJHuyVZ3qMIlRCIdvqe0Q%0A6ls%2BC8ctRwRO3UU3x8q8OH%2B2ahxlQmpzdC5al4XQzJLiLjiJ2Q1p%2Bhub8MFiMmVP%0APZjb2tZm2ipWVuMRM%2BzgpRVM6nVJ9F3vFfUSHOb4%2FJsEIUvPY%2Bd8%2FKrc%2BkPQwLvy%0AieqRbcuFjmqfyPmUv1U9QoI4TQikpw7TZU0zYZANP4C%2Fgj4Ry48%2FznmUaRvy2kvI%0Al7gRQ21qJTK5suoiYoYNo3J9T%2BpXPGU7Lydz%2FHwW%2Bw0DpArtAaukI8aNX4ohFUKS%0AwDSiIIWIWJiJGbEeIO0TIFwEVWTOnbNl%2FfaPXpk5IRXicapqiII%3D%0A-----END%20CERTIFICATE--
```

## DELETE /services/admin/Rsa-MFA

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:changeme -X DELETE https://ronnie.sv.splunk.com:8130/services/admin/Rsa-MFA/rsa-mfa
```


---

# /services/admin/Rsa-MFA-config-verify

Verify RSA multifactor authentication.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/Rsa-MFA-config-verify` |
| Auth required | Yes |
| Capability | `change_authentication` |

## POST /services/admin/Rsa-MFA-config-verify

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| username | String | No | — | Optional. RSA username. |
| passcode | String | Conditional | — | Optional. RSA passcode consists of PIN followed by tokencode. |

### Returned values

Information on whether RSA configuration is valid or not.

### Example

```
curl -k -u user1:Splunk_123 -X POST https://localhost:8201/services/admin/Rsa-MFA-config-verify/rsa-mfa
```


---
