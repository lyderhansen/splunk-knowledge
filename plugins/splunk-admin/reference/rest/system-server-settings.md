# REST bundle: `server/settings`

**Category:** System

Grouped Splunk REST Reference endpoints.

---

# `/services/server/settings`

Access server configuration information for a Splunk platform instance. For additional information about your Splunk platform instance, see the [server/info](https://docs.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/introspection-endpoints/introspection-endpoint-descriptions#fa5a47d5_4cfd_478d_a3de_7d2f09135c86--en__server.2Finfo) endpoint.

**Category:** System

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/server/settings` |
| Auth required | Yes |
| Capability | `Role-dependent (see Splunk REST ACL / authorize.conf)` |

## GET

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| *(pagination)* | — | No | — | Standard Splunk pagination/filtering parameters apply. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| SPLUNK_DB | string | Absolute filepath to the default index for this deployment. |
| SPLUNK_HOME | string | Absolute filepath to the local installation of this deployment. |
| enableSplunkWebSSL | string | Indicates if HTTPS and SSL are enabled for Splunk Web. |
| host | string | The default hostname to use for data inputs that do not override this setting. |
| httpport | string | Defaults to 8000. If using SSL, set to the HTTPS port number. |
| mgmtHostPort | string | The port on which Splunk Web listens for management operations. Defaults to 8089. |
| minFreeSpace | string |  |
| pass4SymmKey | string | Password string prefixed to the Splunk platform symmetric key, generating the final key to sign all traffic between master/slave licenser. |
| serverName | string | Name identifying this instance for features such as distributed search. |
| sessionTimeout | string |  |
| startwebserver | string | Indicates whether Splunk Web is configured to start by default. |
| trustedIP | string | Disabled by default. Normal value is '127.0.0.1' |

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/server/settings?output_mode=json'
```

---

