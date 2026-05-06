# deploymentclient.conf

Controls how a Splunk deployment client registers with a deployment server, downloads apps and configuration bundles, and tunes TLS, timeouts, and repository policies. At minimum the `[deployment-client]` stanza must be present to enable deployment client behavior.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context); defaults ship under `$SPLUNK_HOME/etc/system/default/` |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | serverclass.conf |

## Stanzas and settings

### `[default]`

Splunk documents that you may define global defaults either at the top of the file outside any stanza or under a single `[default]` stanza; the last definition wins when duplicated. This file’s spec does not enumerate additional keys unique to `[default]` beyond that inheritance pattern.

### `[deployment-client]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| disabled | boolean | false | Disables the deployment client when true so the instance does not enroll with a deployment server. |
| clientName | string | deploymentClient | Logical client name the deployment server can filter on; overrides reliance on DNS hostname alone. |
| workingDir | path | `$SPLUNK_HOME/var/run` | Temporary directory the deployment client uses while downloading apps and configuration payloads. |
| repositoryLocation | path | `$SPLUNK_HOME/etc/apps` | Install location on the client where deployed apps must land to be recognized by Splunk. |
| serverRepositoryLocationPolicy | acceptSplunkHome \| acceptAlways \| rejectAlways | acceptSplunkHome | Controls whether the client accepts the repository path advertised by the server or keeps the local `repositoryLocation`. |
| endpoint | URL template | `$deploymentServerUri$/services/streams/deployment?name=$serverClassName$:$appName$` | HTTP endpoint template used to download deployment payloads; tokens expand deployment server URI, server class, and app names. |
| serverEndpointPolicy | acceptAlways \| rejectAlways | acceptAlways | Chooses between always trusting the server-supplied download endpoint or always using the locally configured `endpoint`. |
| phoneHomeIntervalInSecs | decimal | 60 | Interval in seconds between phone-home polls for new deployment content; fractional seconds allowed. |
| handshakeRetryIntervalInSecs | integer | phoneHomeIntervalInSecs / 5 | Retry cadence for deployment handshake attempts, useful when staggering initial connections. |
| handshakeReplySubscriptionRetry | integer | 10 | After this many failed handshakes the client retries subscribing to the handshake channel. |
| appEventsResyncIntervalInSecs | seconds | 10 × phoneHomeIntervalInSecs | How often the client reports application install state back to the deployment server. |
| reloadDSOnAppInstall | boolean | false | Forces the local deployment server component to reload whenever this deployment client installs an app—only for hierarchical DS layouts and advanced scenarios. |
| sslVersions | versions list | inherits server.conf `[sslConfig]` | TLS protocol list (`tls1.0`, `tls1.1`, `tls1.2`, `*`, `tls`, optional `-` removals) used when connecting to the deployment server. |
| sslVerifyServerCert | boolean | inherits server.conf `[sslConfig]` | Validates the deployment server certificate against trusted material when true. |
| sslVerifyServerName | boolean | false | Performs TLS hostname verification against the certificate CN/SAN when both this and `sslVerifyServerCert` are enabled. |
| caCertFile | path | inherits server.conf `[sslConfig]` | PEM file containing concatenated root CA certificates for validating the deployment server TLS chain. |
| sslCommonNameToCheck | CSV list | inherits server.conf `[sslConfig]` | Allowed certificate common names when `sslVerifyServerCert` is true. |
| sslAltNameToCheck | CSV list | inherits server.conf `[sslConfig]` | Allowed certificate subject alternative names when verifying the deployment server. |
| cipherSuite | cipher string | none | Optional explicit OpenSSL cipher string for outbound HTTPS connections to the deployment server. |
| ecdhCurves | CSV list | empty | Ordered list of ECDH curve short names offered during TLS handshakes to the deployment server. |
| connect_timeout | positive integer | 60 | Maximum seconds to wait while establishing a TCP/TLS connection to the deployment server. |
| send_timeout | positive integer | 60 | Maximum seconds allowed for sending request data to the deployment server. |
| recv_timeout | positive integer | 60 | Maximum seconds allowed while reading responses from the deployment server. |

### `[target-broker:deploymentServer]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| targetUri | string | none | Management URI (`scheme://host:port`) of the deployment server handling this client. |
| connect_timeout | positive integer | see `[deployment-client]` | Overrides connection establishment timeout for this broker stanza only. |
| send_timeout | positive integer | see `[deployment-client]` | Overrides send/write timeout for this broker stanza only. |
| recv_timeout | positive integer | see `[deployment-client]` | Overrides receive/read timeout for this broker stanza only. |
