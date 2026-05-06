# server.conf

This file contains settings and values to configure server options in server.conf. Each stanza controls different search commands settings. There is a server.conf file in the $SPLUNK_HOME/etc/system/default/ directory. Never change or copy the configuration files in the default directory. The files in the default directory must remain intact and in their original location. To set custom configurations, create a new file with the name server.conf in the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings that you want to customize to the local configuration file. For...

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | N/A (system configuration) |
| Restart required | Yes (most settings) |
| Related files | web.conf, inputs.conf, outputs.conf, authentication.conf |

## Stanzas and settings

### `[default]`

Documented in Splunk docs section *GLOBAL SETTINGS*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[general]`

Documented in Splunk docs section *General Server Configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `serverName` | `<ASCII string>` | $HOSTNAME | The name that identifies this Splunk software instance for features such as Cannot be an empty string. Can contain environment variables. |
| `hostnameOption` | `[ fullyqualifiedname | clustername | shortname ]` | shortname | The type of information to use to determine how splunkd sets the 'host' This setting applies only to machines that run Windows, and only for Valid values are "fullyqualifiedname", "clustername", and "shortname". The value returned for the 'host' field depends on Windows DNS, NETBIOS, 'fullyqualifiedname' uses... |
| `sessionTimeout` | `<nonnegative integer>[s|m|h|d]` | "1" (1 hour) | The amount of time before a user session times out, expressed as a Examples include "24h" (24 hours), "3d" (3 days), |
| `invalidateSessionTokensOnLogout` | `<boolean>` | false | A value of "true" means the SHC invalidates any tokens associated with a logged-out session This setting has an effect only if search head clustering and App Key Value store are enabled. Splunkd on each node tries to keep the logout information in sync with other nodes in the |
| `logoutCacheRefreshInterval` | `<nonnegative integer>[s|m|h|d]` | 30s | This setting controls how often splunkd on a given node updates its local cache from the This setting has no effect when 'invalidateSessionTokensOnLogout' is disabled. In normal scenarios, maximum time for changes to propogate across the cluster can be upto There is no guarantee that this sync will always happen... |
| `trustedIP` | `<IP address>` | — | Only a single IP address is allowed. All logins from specified IP addresses are trusted. |
| `allowRemoteLogin` | `always|never|requireSetPassword` | requireSetPassword | Controls remote management by restricting general login. Note that this When set to "always", all remote login attempts are allowed. |
| `tar_format` | `gnutar|ustar` | gnutar | Sets the default TAR format. |
| `access_logging_for_phonehome` | `<boolean>` | true (logging enabled) | Enables/disables logging to the splunkd_access.log file for client phonehomes. |
| `hangup_after_phonehome` | `<boolean>` | false (persistent connections for phonehome) | Controls whether or not the deployment server hangs up the connection By default, persistent HTTP 1.1 connections are used with the server to If you have more than the maximum recommended concurrent TCP connection |
| `pass4SymmKey` | `<string>` | — | Authenticates traffic between: A license manager and its license peers. Members of a cluster. |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' can be for a particular stanza. When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |
| `unbiasLanguageForLogging` | `<boolean>` | false | Specifies whether to replace the old language terms such as "master" and "slave" |
| `listenOnIPv6` | `no|yes|only` | — | By default, splunkd listens for incoming connections (both REST and When you set this value to "yes", splunkd simultaneously listens for To disable IPv4 entirely, set listenOnIPv6 to "only". This causes splunkd Any setting of SPLUNK_BINDIP in your environment or the |
| `connectUsingIpVersion` | `auto|4-first|6-first|4-only|6-only` | auto (the Splunk server selects a reasonable | When making outbound TCP connections for forwarding event data, making Connections to literal addresses are unaffected by this setting. For A value of "auto" means the following: If 'listenOnIPv6' is set to "no", the Splunk server follows the If 'listenOnIPv6' is set to "yes", the Splunk server follows "6-first" If... |
| `guid` | `<globally unique identifier for this instance>` | — | This setting (as of version 5.0) belongs in the [general] stanza of |
| `useHTTPServerCompression` | `<boolean>` | true | Specifies whether the splunkd HTTP server should support gzip content |
| `defaultHTTPServerCompressionLevel` | `<integer>` | 6 (This is appropriate for most environments) | If the useHTTPServerCompression setting is enabled (it is enabled This number must be between 1 and 9. Higher numbers produce smaller compressed results but require more CPU |
| `skipHTTPCompressionAcl` | `<comma- or space-separated list>` | localhost addresses | Lists a set of networks or addresses to skip data compression. Note that the server might still respond with compressed data if it These rules are separated by commas or spaces. |
| `legacyCiphers` | `decryptOnly|disabled` | decryptOnly | This setting controls how Splunk software handles support for If set to "decryptOnly", Splunk software supports decryption of If set to "disabled", Splunk software neither encrypts nor decrypts |
| `site` | `<string>` | — | Specifies the site that this Splunk instance belongs to when multisite is Valid values for site-id include site0 to site63 The special value "site0" can be set only on search heads or on forwarders For a search head, "site0" disables search affinity. For a forwarder participating in indexer discovery, "site0"... |
| `useHTTPClientCompression` | `true|false|on-http|on-https` | true | Specifies whether gzip compression should be supported when splunkd acts If the connection is being made over https and |
| `embedSecret` | `<string>` | — | When using report embedding, normally the generated URLs can only If "embedSecret" is set, then the token in the URL is encrypted This is needed if you want to use report embedding across multiple |
| `parallelIngestionPipelines` | `<integer>` | 1 | The number of discrete data ingestion pipeline sets to create for this A pipeline set handles the processing of data, from receiving streams An indexer that operates multiple pipeline sets can achieve improved For most installations, the default setting of "1" is optimal. Use caution when changing this setting. |
| `pipelineSetAutoScale` | `<boolean>` | false | Whether or not splunkd automatically scales up the number of A value of "true" means splunkd automatically scales up pipeline sets See the 'pipelineSetSelectionPolicy' setting for more A value of "true" also means that intermediate forwarders scale If a workload management pool exists, then: Splunk instance scales... |
| `pipelineSetSelectionPolicy` | `round_robin|weighted_random|blocked_queue_count` | round_robin | Specifies the pipeline set selection policy to use while selecting pipeline A value of "round_robin" means that splunkd assigns incoming inputs to A value of "weighted_random" means that splunkd assigns the incoming inputs The "weighted_random" value is valid only when 'parallelIngestionPipelines' A value of... |
| `pipelineSetWeightsUpdatePeriod` | `<integer>` | 30 | The interval, in seconds, when pipeline set weights are recalculated for the Reducing this interval causes pipeline set weights to be re-evaluated more Increasing this interval causes pipeline set weights to be re-evaluated less |
| `pipelineSetNumTrackingPeriods` | `<integer>` | 5 | The number of look-back periods, of interval pipelineSetWeightsUpdatePeriod, This information is used as a heuristic to calculate the pipeline set weights |
| `pipelineSetChannelSetCacheSize` | `<integer>` | 12 | Maximum number of inactive channels to be stored in the per-pipeline set Currently only affects ingestion via the HTTP Event Collector. Increasing this setting should reduce the number of created channels |
| `instanceType` | `<string>` | download | Should not be modified by users. Informs components (such as the Splunk Web Manager section) which |
| `requireBootPassphrase` | `<boolean>` | — | Prompt the user for a boot passphrase when starting splunkd. Splunkd uses this passphrase to grant itself access to platform-provided For more information about secret storage, see the [secrets] stanza in Default (if Common Criteria mode is enabled): true Default (if Common Criteria mode is disabled): false |
| `numThreadsForIndexInitExecutor` | `<positive integer>` | 16 | Number of threads that can be used by the index init thread pool. Maximum accepted value for this setting is 32. |
| `remoteStorageRecreateIndexesInStandalone` | `<boolean>` | true | Controls re-creation of remote storage enabled indexes in standalone mode. |
| `cleanRemoteStorageByDefault` | `<boolean>` | false | Allows 'splunk clean eventdata' to clean the remote indexes when set to true. |
| `is_remote_queue_accounting_batched` | `<boolean>` | false | Allows indexer to maintain a batched count of events that have been uploaded to This count is subsequently used to delete corresponding messages from remote queue. |
| `recreate_index_fetch_bucket_batch_size` | `<positive integer>` | 500 | Controls the maximum number of bucket IDs to fetch from remote storage Only valid for standalone mode. |
| `recreate_bucket_fetch_manifest_batch_size` | `<positive integer>` | 100 | Controls the maximum number of bucket manifests to fetch in parallel Only valid for standalone mode. |
| `splunkd_stop_timeout` | `<positive integer>` | 360 (6 minutes) | The maximum time, in seconds, that splunkd waits for a graceful shutdown to |
| `decommission_search_jobs_wait_secs` | `<unsigned integer>` | 0 | The maximum time, in seconds, that splunkd waits for running searches to complete To trigger this type of shutdown, post to If set to 0, splunkd does not wait, and all searches in progress will fail. If this search head is a member of a search head cluster, use |
| `decommission_search_jobs_min_wait_ratio` | `<decimal>` | 0.15 | Fraction of the decommission_search_jobs_wait_secs that splunkd will always This wait is not contingent on whether or not there are any actively running searches Once this minimum wait time has elapsed, splunkd will wait the remainder of |
| `python.version` | `python3|python3.9|force_python3|unspecified` | force_python3 | DEPRECATED. Use 'python.required' in individual configuration files For Python scripts only, sets the default Python version to use. |
| `python.not_compatible` | `<comma-separated list>` | <empty> | The list of features that are not compatible with the The previously-supported value "openssl3.0" is no longer supported. Currently, there are no supported values for this setting. |
| `roll_and_wait_for_uploads_at_shutdown_secs` | `<non-negative integer>` | 0 (disabled) | Currently not supported. This setting is related to a feature that is |
| `preShutdownCleanup` | `<boolean>` | true | Currently not supported. This setting is related to a feature that is Specifies if indexer waits to complete any indexing activities before |
| `reset_manifests_on_startup` | `<boolean>` | true | Whether or not the Splunk platform instance regenerates size retention Configuring this setting lets the platform instance have the most When set to true, the size retention information for summaries stored When set to false, manifest.csv files are not reset during startup. |
| `percent_manifests_to_reset` | `<integer>` | 10 | In order to minimize the cost of resetting all manifest.csv files at once This percentage defines how many manifest.csv files each group will reset. For example, a setting of 20 means each group resets 20% of all manifests The minimum of one manifest.csv file will be processed per group. |
| `regex_cache_hiwater` | `<integer>` | 2500 | A threshold for the number of entries in the regex cache. If the regex cache When set to a negative value, no purge occurs, no matter how large |
| `enable_search_process_long_lifespan` | `<boolean>` | true | Controls whether the search process can have a long lifespan. Configuring a long lifespan on a search process can optimize performance When set to "true": Splunk software does the following: Suppresses increases in the configuration generation. |
| `conf_generation_include.<conf_file_name>` | `<boolean>` | false | Controls whether conf generation bumps at a property change in a particular In general, do not bump when a property change needs to restart Splunk server If set properly, Splunk server skips unnecessary generation increments to Has no effect if 'enable_search_process_long_lifespan' is set to "false". |
| `encrypt_fields` | `<comma-separated list>` | a default list of fields containing passwords, secret keys, and identifiers: | A list of the fields that need to be re-encrypted when a search head Provide each field as a three-element entry. Separate each field element with Do not include brackets when you specify a stanza-prefix. |
| `conf_cache_memory_optimization` | `<boolean>` | true | Turns on or off memory optimization for configuration file caches for all A value of "true" turns on memory optimization for configuration files. A value of "false" turns off memory optimization for configuration files. |
| `conf_cache_rebuild_stanzas_optimization` | `<boolean>` | true | Turns on or off per stanza configuration cache rebuild for all A value of "true" turns on per stanza configuration cache rebuild. A value of "false" turns off per stanza configuration cache rebuild. |
| `cgroup_location` | `<string>` | auto | Specifies the location of the cgroup hierarchy for the splunkd, search, and This setting requires a Linux system with systemd. A value of "auto" turns on automatic detection, which is based on the An empty string indicates the setting is off. |
| `allowed_unarchive_commands` | `<comma-separated list>` | Empty string ('unarchive_cmd' can use any shell command.) | A list of *nix shell commands that the 'unarchive_cmd' setting This setting is only applicable when 'unarchive_cmd_start_mode' |

### `[config_change_tracker]`

Documented in Splunk docs section *Configuration Change Tracker*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Whether or not splunkd writes configuration changes to the If set to "false", configuration changes are captured in If set to "true", configuration changes are not captured |
| `mode` | `[auto|diff|track-only]` | auto | Determines the method used by 'config_change_tracker' to track and record A value of "auto" or "diff" means splunkd logs all configuration changes made to A value of "track-only" means splunkd logs .conf file changes, but excludes Splunkd tracks all .conf files under the following directories:... |
| `denylist` | `<regular expression>` | (none) | If set, splunkd does not monitor files for configuration change tracker if |
| `log_throttling_disabled` | `<boolean>` | true | Describes whether or not splunkd logs config changes to a .conf file A value of "false" means that splunkd logs all changes to a conf file within A value of "true" means that splunkd logs all changes individually as This setting requires a Linux system with the "inotify" API for Do not change this setting without... |
| `log_throttling_threshold_ms` | `<positive integer>` | 10000 | The span of time, in milliseconds, during which splunkd logs multiple If multiple changes are made to a conf file within the time span |
| `exclude_fields` | `<comma-separated list>` | (none) | One or more stanza keys that splunkd is to exclude when it writes The format for each entry is '<conf-file>:<stanza>:<key>'. Separate multiple To exclude all keys under a stanza, use the '<conf-file>:<stanza>:*' format. |

### `[deployment]`

Documented in Splunk docs section *Deployment Configuration details*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pass4SymmKey` | `<passphrase string>` | — | Authenticates traffic between the deployment server (DS) and its By default, DS-DCs passphrase authentication key is disabled. To enable If the key is not set in the [deployment] stanza, the key is looked |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' should be for a When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |

### `[sslConfig]`

Documented in Splunk docs section *TLS/SSL Configuration details*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enableSplunkdSSL` | `<boolean>` | true | Whether or not the Splunk daemon uses TLS/SSL on the management port A value of "true" means that splunkd runs TLS on the management A value of "false" means that splunkd does not run TLS on any port. Distributed search often performs better when you enable TLS. |
| `useClientSSLCompression` | `<boolean>` | false | Whether or not HTTP client compression is turned on. Server-side compression is turned on by default. |
| `useSplunkdClientSSLCompression` | `<boolean>` | true | Whether or not splunkd, as an HTTP client, uses TLS compression This setting is effective if, and only if, 'useClientSSLCompression' A value of "true" means that splunkd, as a client, uses TLS A value of "false" means that splunkd does not use TLS compression. |
| `sslVersions` | `<comma-separated list>` | — | The list of TLS versions to support for incoming connections. The versions available are "tls1.0", "tls1.1", and "tls1.2". |
| `sslVersionsForClient` | `<comma-separated list>` | — | The list of TLS/SSL versions to support for outgoing HTTP connections Configuring this setting is usually less critical than configuring the The syntax is the same as the 'sslVersions' setting. The default can vary. |
| `supportSSLV3Only` | `<boolean>` | — | DEPRECATED. Use 'sslVersions' or 'sslVersionsForClient' instead. |
| `sslVerifyServerCert` | `<boolean>` | false | Whether or not splunkd, as a client, validates the TLS certificate that a server presents This setting serves as an additional step for authenticating connections to other For distributed search, the client uses this setting when it makes a For distributed deployment, the client uses this setting when it polls A... |
| `sslCommonNameToCheck` | `<comma-separated list>` | — | One or more X.509 standard Common Names of the server certificate which splunkd, The Common Name (CN) is an X.509 standard field in a certificate that identifies the The CN can be a short host name or a fully qualified domain name. For example, If the client cannot match the CN in the certificate that the server... |
| `sslCommonNameList` | `<commonName1>, <commonName2>, ...` | — | DEPRECATED. Use the 'sslCommonNameToCheck' setting instead. |
| `sslAltNameToCheck` | `<comma-separated list>` | — | One or more Subject Alternative Names of the server certificate which splunkd, The Subject Alternative Name (SAN) is an extension to the X.509 standard that If the client cannot match the SAN in the certificate that the server presents, The client does not validate any names in this list against the Common Name.... |
| `requireClientCert` | `<boolean>` | false | Whether or not an HTTPS client which connects to a splunkd Multiple services can use this setting, including but not Splunk platform indexers must use this setting to connect to Deployment clients must present certificates to deployment A value of "true" means that a client can connect only if it A value of "false"... |
| `sslVerifyServerName` | `<boolean>` | false | Whether or not splunkd, as a client, performs a TLS hostname validation check A TLS hostname validation check ensures that a client Specifically, the validation check forces splunkd to verify that either For this setting to have any effect, the 'sslVerifyServerCert' setting must A value of "true" for this setting... |
| `caTrustStore` | `<[splunk],[OS]>` | splunk | The type of trust store that the Splunk platform accesses to validate The Splunk platform uses this setting to load certificate authority A value of "splunk" means the platform only uses the certificate authority A value of "OS" means the platform only uses the CA certificates in Splunk provides support for OS... |
| `caTrustStorePath` | `<string>` | (none) | The path to the location of the certificate authority trust store on Different Linux distributions use different locations for the CA If 'caTrustStore' has a value of "OS", but this setting has either Following are example trust store locations for popular |
| `cipherSuite` | `<string>` | — | A list of cipher suites for splunkd to use. If set, Splunk uses the specified cipher string for the HTTP server. |
| `ecdhCurveName` | `<string>` | empty string | DEPRECATED. Use the 'ecdhCurves' setting instead. |
| `ecdhCurves` | `<comma-separated list>` | — | A list of elliptic curves to use for the Elliptic-curve Diffie-Hellman The client sends elliptic curves as part of the Client Hello Specify elliptic curves in the order that you prefer them. The server supports only the curves specified in the list. |
| `serverCert` | `<path>` | $SPLUNK_HOME/etc/auth/server.pem | The full path to the server certificate. The Splunk daemon auto-generates certificates when you start Splunk Where applicable, replace the default certificate with a certificate For more information about certificates, and how to obtain, create, The certificate must be in privacy-enhanced mail (PEM) format. |
| `sslKeysfile` | `<string>` | server.pem | DEPRECATED. Use the 'serverCert' setting instead. |
| `sslPassword` | `<string>` | password | The password for the server certificate, if you created one. |
| `sslKeysfilePassword` | `<string>` | — | DEPRECATED. Use the 'sslPassword' setting instead. |
| `sslRootCAPath` | `<path>` | (none) | The path to the certificate authority (CA), or root The certificate store must be a file that contains one or more The certificates in the certificate store file must be If you run Splunk Enterprise in Common Criteria mode, then This setting is valid on Windows machines only if the |
| `sslRootCAPathHonoredOnWindows` | `<boolean>` | true | DEPRECATED. Whether or not the Splunk instance respects the 'sslRootCAPath' setting on This setting is valid only on Windows, and only if you have set A value of "true" means that the instance respects the 'sslRootCAPath' A value of "false" means that the instance does not respect the When the 'sslRootCAPath'... |
| `caCertFile` | `<string>` | cacert.pem | DEPRECATED. Use the 'sslRootCAPath' setting instead. |
| `dhFile` | `<path>` | (none) | The location of the Diffie-Hellman (DH) parameter file. This file must be in PEM format. |
| `caPath` | `<path>` | $SPLUNK_HOME/etc/auth | DEPRECATED. Use absolute paths for all certificate files. |
| `certCreateScript` | `<script name>` | (none) | The creation script for generating certificates when you start Splunk |
| `sendStrictTransportSecurityHeader` | `<boolean>` | false | Whether or not the REST interface sends a "Strict-Transport-Security" A value of "true" means the REST interface sends a "Strict-Transport- This can help to avoid a client being tricked later by a For example, if Splunk Web is in its default non-TLS mode, this A value of "false" means the REST interface does not send a |
| `allowSslCompression` | `<boolean>` | true | Whether or not the server lets clients negotiate compression at A value of "true" means the server lets clients negotiate A value of "false" means the server does not let clients negotiate The app key value store (KV Store) service observes and uses this setting. |
| `allowSslRenegotiation` | `<boolean>` | true | Whether or not the server lets clients request renegotiation of In the TLS protocol, a client can request renegotiation of the A value of "true" means that the server lets clients request the A value of "false" causes the server to reject all renegotiation This limits the amount of CPU a single TCP connection can use, |
| `sslClientSessionPath` | `<path>` | (none) | The path to the location where the Splunk platform stores Used if 'useSslClientSessionCache' has a value of "true". |
| `useSslClientSessionCache` | `<boolean>` | false | Whether or not the Splunk platform can re-use TLS client sessions. A value of "true" means the Splunk platform stores client A value of "false" means each TLS connection performs a full |
| `sslServerSessionTimeout` | `<integer>` | 300 (5 minutes) | The timeout, in seconds, for newly created TLS sessions. A value of 0 means that the Splunk platform disables The default server-side session cache for OpenSSL is |
| `sslServerHandshakeTimeout` | `<integer>` | 60 | The timeout, in seconds, for a TLS handshake to complete between an If the TLS server does not receive a "Client Hello" from the TLS client within |
| `certificateStatusValidationMethod` | `crl` | empty string (certificate status validation checks are off) | Specifies the certificate status validation method that splunkd is to use. Certificate status validation checks the status of a digital certificate When certificate status validation is active, it is active for any kind of Currently, the only acceptable value for this setting is "crl". |
| `cliVerifyServerName` | `<boolean>` | false | Whether or not the Splunk CLI must validate the host name in the splunkd The CLI performs transport layer security server certificate validation by Validation happens whether you connect to a local instance of splunkd or If the certificate doesn't contain the host name or IP address of the When the CLI performs... |

### `[dataplaneSslConfig]`

Documented in Splunk docs section *TLS/SSL Configuration details*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `serverCertDataplane` | `<string>` | $SPLUNK_HOME/etc/auth/server_dp.pem | The full path to the server data plane certificate. The server data plane certificate is used by the HTTP servers within Splunk helper processes run alongside the Splunk daemon and implement The Splunk daemon auto-generates all certificates when you start Splunk Where applicable, replace the default certificate... |
| `certDPCreateScript` | `<string>` | $SPLUNK_HOME/bin/splunk, createssl, server-cert-dp | The creation script for generating the server data plane certificate when |

### `[pythonSslClientConfig]`

Documented in Splunk docs section *Python TLS Client Configuration details*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sslVerifyServerCert` | `<boolean>` | false | See the description of 'sslVerifyServerCert' under the [sslConfig] stanza If you give this setting a value of "true", confirm that you have also set |
| `sslVerifyServerName` | `<boolean>` | false | See the description of 'sslVerifyServerName' under the [sslConfig] stanza |

### `[proxyConfig]`

Documented in Splunk docs section *Splunkd http proxy configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `http_proxy` | `<string>` | (none) | If set, splunkd sends all HTTP requests through the proxy server |
| `https_proxy` | `<string>` | (none) | If set, splunkd sends all HTTPS requests through the proxy server If not set, splunkd uses the 'http_proxy' setting instead. |
| `proxy_rules` | `<string>` | * | One or more host names or IP addresses for which splunkd is to route If set, splunkd uses the proxy server only for endpoints that match the Splunkd does not route requests to either the localhost or loopback addresses Separate multiple entries with commas. This setting accepts the following values: '*' (asterisk):... |
| `no_proxy` | `<string>` | localhost, 127.0.0.1, ::1 | One or more host names or IP addresses for which splunkd is to If set, splunkd does not route requests to matching host names and This setting overrides the 'proxy_rules' setting. If a host name or IP Splunkd does not route requests to either the localhost or loopback addresses Separate multiple entries with commas. |
| `enable_tls_proxy` | `<boolean>` | false | Whether or not the Splunk daemon (splunkd) launches a helper process to proxy The helper process, called splunk-tlsd, improves the overall availability of splunkd by Currently, splunk-tlsd handles connections over TLS to Splunk Telemetry When splunk-tlsd is active, splunkd routes network traffic for certain... |

### `[httpServer]`

Documented in Splunk docs section *Splunkd HTTP server configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `atomFeedStylesheet` | `<string>` | /static/atom.xsl | Defines the stylesheet relative URL to apply to default Atom feeds. Set to 'none' to stop writing out xsl-stylesheet directive. |
| `disableDefaultPort` | `<boolean>` | false | If set to "true", turns off listening on the splunkd management port, This is the general communication path to splunkd. If it is disabled, This means many command line splunk invocations cannot function, If you choose to disable the port anyway, understand that you are |
| `mgmtMode` | `none|auto|tcp` | auto | Sets the transport layer protocol mode for Splunk CLI management commands. A value of "none" means that only Splunk CLI commands that can be run A value of "auto" means that CLI commands execute over a Unix Domain Socket (UDS), If the OS does not support UDS, and if 'disableDefaultPort' has a value of "false", If... |
| `acceptFrom` | `<network_acl> ...` | "*" (accept from anywhere) | Lists a set of networks or addresses from which to accept connections. Separate multiple rules with commas or spaces. |
| `streamInWriteTimeout` | `<positive number>` | 5 | The timeout, in seconds, for uploading data to the http server. When uploading data to http server, if the http server is unable |
| `max_content_length` | `<integer>` | 2147483648 (2GB) | Maximum content length, in bytes. HTTP requests over the size specified are rejected. |
| `maxSockets` | `<integer>` | 0 | The number of simultaneous HTTP connections that Splunk Enterprise accepts If set to "0", Splunk Enterprise automatically sets maxSockets to If this number is less than 50, it is set to 50. If this number is greater than 400000, it is set to 400000. |
| `maxThreads` | `<integer>` | 0 | The number of threads that can be used by active HTTP transactions. If set to 0, Splunk Enterprise automatically sets the limit to If this number is less than 20, it is set to 20. |
| `keepAliveIdleTimeout` | `<integer>` | 7200 (120 minutes) | How long, in seconds, that the Splunkd HTTP server allows a keep-alive If this number is less than 7200, it is set to 7200. |
| `busyKeepAliveIdleTimeout` | `<integer>` | 12 | How long, in seconds, that the Splunkd HTTP server allows a keep-alive Use caution when configuring this setting as a value that is too large If this number is less than 12, it is set to 12. |
| `forceHttp10` | `auto|never|always` | auto | When set to "always", the REST HTTP server does not use some When set to "auto" it does this only if the client sent no When set to "never" it always allows HTTP 1.1, even to |
| `crossOriginSharingPolicy` | `<origin_acl> ...` | (none) | List of the HTTP Origins for which to return Access-Control-Allow-* (CORS) These headers tell browsers that web applications are trusted at those sites The origin is passed as a URL without a path component (for example This setting can take a list of acceptable origins, separated Each origin can also contain... |
| `crossOriginSharingHeaders` | `<string>` | Empty string. | A list of the HTTP headers to which splunkd sets The "Access-Control-Allow-Headers" header is used in response to A CORS preflight request is a CORS request that checks to see if This setting can take a list of acceptable HTTP headers, separated A single "*" can also be used to match all headers. |
| `x_frame_options_sameorigin` | `<boolean>` | true | Adds a X-Frame-Options header set to "SAMEORIGIN" to every response |
| `allowEmbedTokenAuth` | `<boolean>` | true | A value of "false" means splunkd does not allow any access to artifacts This effectively disables all use of the "embed" feature. |
| `cliLoginBanner` | `<string>` | (none) | Sets a message which is added to the HTTP reply headers This is printed by the Splunk CLI before it prompts If this string starts with a '"' character, it is treated as a |
| `allowBasicAuth` | `<boolean>` | true | Allows clients to make authenticated requests to the splunk This is useful for programmatic access to REST endpoints and |
| `allowWwwAuthHeader` | `<boolean>` | true | Describes whether or not Splunk Web can include a "www-authenticate" header When Splunk Web sends the "www-authenticate" header in response to such A value of "true" means that Splunk Web sends a "www-authenticate" header A value of "false" means that Splunk Web does not send the "www-authenticate" Giving this... |
| `basicAuthRealm` | `<string>` | /splunk | When using "HTTP Basic" authentication, the 'realm' is a This can be used to display a short message describing the |
| `allowCookieAuth` | `<boolean>` | true | Allows clients to request an HTTP cookie from the /services/auth/login |
| `cookieAuthHttpOnly` | `<boolean>` | true | When using cookie based authentication, mark returned cookies |
| `cookieSameSiteSecure` | `<boolean>` | false | DEPRECATED. Describes whether or not the Splunk REST server sets all Splunk cookies A value of "true" means that the Splunk REST server sets the "SameSite=None" A value of "false" means that the REST server does not set cookies with |
| `cookieAuthSecure` | `<boolean>` | true | When using cookie based authentication, mark returned cookies |
| `dedicatedIoThreads` | `[<integer>|auto]` | auto | The number of threads that splunkd dedicates to handling HTTP I/O requests. This setting controls thread usage for all HTTP requests through splunkd, If you set this to "0", splunkd uses the same thread that accepted the initial If you set this to a number other than "0", splunkd creates that number of If you set... |
| `dedicatedIoThreadsSelectionPolicy` | `<round_robin | weighted_random>` | round_robin | Specifies the I/O threads selection policy to use while selecting I/O thread If set to "round_robin", the incoming connections are assigned to I/O threads If set to "weighted_random", the connections are assigned to I/O threads using |
| `dedicatedIoThreadsWeightsUpdatePeriod` | `<number>` | 30 | The interval, in seconds, when I/O thread weights are recalculated for the Reducing this interval causes the weights to be re-evaluated more Increasing this interval causes the weights to be re-evaluated less |
| `replyHeader.<name>` | `<string>` | — | Add a static header to all HTTP responses this server generates For example, "replyHeader.My-Header = value" causes the |

### `[httpServerListener:<ip:><port>]`

Documented in Splunk docs section *Splunkd HTTPServer listener configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ssl` | `<boolean>` | true | Toggle whether this listening ip:port uses SSL or not. If the main REST port is SSL (the "enableSplunkdSSL" setting in this |
| `listenOnIPv6` | `no|yes|only` | — | Toggle whether this listening ip:port listens on IPv4, IPv6, or both. If not present, the setting in the [general] stanza is used |
| `acceptFrom` | `<network_acl> ...` | The setting in the [httpServer] stanza | Lists a set of networks or addresses from which to accept connections. Separate multiple rules with commas or spaces. |

### `[mimetype-extension-map]`

Documented in Splunk docs section *Static file handler MIME-type map*. Documented in Splunk docs section *Static file handler MIME-type map*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[stderr_log_rotation]`

Documented in Splunk docs section *Log rotation of splunkd_stderr.log & splunkd_stdout.log*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxFileSize` | `<bytes>` | 10000000 (10 si-megabytes) | When splunkd_stderr.log grows larger than this value, it is rotated. maxFileSize is expressed in bytes. |
| `BackupIndex` | `<non-negative integer>` | 2 | How many rolled copies to keep. For example, if this setting is 2, the splunkd_stderr.log.1 and You might want to increase this value if you are working on a problem You might want to reduce this to allocate less storage to this log category. |
| `checkFrequency` | `<seconds>` | 10 | How often. in seconds, to check the size of splunkd_stderr.log Larger values may result in larger rolled file sizes but take less resources. |

### `[stdout_log_rotation]`

Documented in Splunk docs section *Log rotation of splunkd_stderr.log & splunkd_stdout.log*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxFileSize` | `<bytes>` | — | See Splunk documentation. |
| `BackupIndex` | `<non-negative integer>` | — | See Splunk documentation. |
| `checkFrequency` | `<seconds>` | — | See Splunk documentation. |

### `[applicationsManagement]`

Documented in Splunk docs section *Remote applications configuration (e.g. SplunkBase)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `allowInternetAccess` | `<boolean>` | — | Lets the Splunk platform instance access the remote applications repository. |
| `url` | `<string>` | https://apps.splunk.com/api/apps | Applications repository URL. |
| `loginUrl` | `<string>` | https://apps.splunk.com/api/account:login/ | Applications repository login URL. |
| `detailsUrl` | `<string>` | https://apps.splunk.com/apps/id | Base URL for application information, keyed off of app ID. |
| `useragent` | `<splunk-version>-<splunk-build-num>-<platform>` | — | User-agent string to use when contacting applications repository. <platform> includes information like operating system and CPU architecture. |
| `updateHost` | `<string>` | — | Host section of URL to check for app updates, e.g. https://apps.splunk.com |
| `updatePath` | `<string>` | — | Path section of URL to check for app updates |
| `updateTimeout` | `<time range string>` | 24h | The minimum amount of time Splunk software waits between checks for Examples include '24h' (24 hours), '3d' (3 days), |
| `sslVersions` | `<comma-separated list>` | — | The list of TLS versions to use to connect to 'url'. The versions available are "tls1.0", "tls1.1", and "tls1.2". |
| `sslVerifyServerCert` | `<boolean>` | true | See the description of 'sslVerifyServerCert' under the [sslConfig] stanza |
| `sslVerifyServerName` | `<boolean>` | false | See the description of 'sslVerifyServerName' under the [sslConfig] stanza |
| `caCertFile` | `<path>` | — | DEPRECATED. Used for validating TLS certificate from the Splunkbase website. |
| `caTrustStore` | `<[splunk],[OS]>` | splunk | See the description of 'caTrustStore' under the [sslConfig] stanza |
| `caTrustStorePath` | `<string>` | (none) | See the description of 'caTrustStorePath' under the [sslConfig] stanza |
| `sslCommonNameToCheck` | `<commonName1>, <commonName2>, ...` | splunkbase.splunk.com, apps.splunk.com, cdn.apps.splunk.com | See the description of 'sslCommonNameToCheck' under the [sslConfig] stanza |
| `sslCommonNameList` | `<commonName1>, <commonName2>, ...` | — | DEPRECATED. Use the 'sslCommonNameToCheck' setting instead. |
| `sslAltNameToCheck` | `<alternateName1>, <alternateName2>, ...` | splunkbase.splunk.com, apps.splunk.com, cdn.apps.splunk.com | See the description of 'sslAltNametoCheck' under the [sslConfig] stanza |
| `splunkbaseAppsDumpUrl` | `<string>` | https://cdn.splunkbase.splunk.com/public/report/apps_dump.json | JSON file link with data on current Splunkbase apps. |
| `archivedSplunkbaseAppsDumpUrl` | `<string>` | https://cdn.splunkbase.splunk.com/public/report/archived_apps_dump.json | JSON file link with data on archived Splunkbase apps. |
| `cipherSuite` | `<string>` | — | See the description of 'cipherSuite' under the [sslConfig] stanza The default can vary. See the 'cipherSuite' setting in |
| `ecdhCurves` | `<comma separated list>` | — | See the description of 'ecdhCurves' under the [sslConfig] stanza The default can vary. See the 'ecdhCurves' setting in |

### `[scripts]`

Documented in Splunk docs section *Misc. configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `initialNumberOfScriptProcesses` | `<num>` | — | The number of pre-forked script processes that are launched when the and* search scripts are executed. |

### `[diskUsage]`

Documented in Splunk docs section *Disk usage settings (for the indexer, not for Splunk log files)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `minFreeSpace` | `<num>|<percentage>` | 5000 (approx 5GB) | Minimum free space for a partition. Specified as an integer that represents a size in binary If specified as a percentage, this is taken to be a percentage of Specifies a safe amount of space that must exist for splunkd to continue Note that this affects search and indexing For search: Before attempting to launch a... |
| `pollingFrequency` | `<num>` | 100000 | Specifies that after every 'pollingFrequency' events are indexed, |
| `pollingTimerFrequency` | `<num>` | 10 | Minimum time, in seconds, between two disk usage checks. |

### `[queue]`

Documented in Splunk docs section *Queue settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxSize` | `[<integer>|<integer>[KB|MB|GB]]` | 500KB | Specifies default capacity of a queue. If specified as a lone integer (for example, maxSize=1000), maxSize If specified as an integer followed by KB, MB, or GB (for example, |
| `cntr_1_lookback_time` | `[<integer>[s|m]]` | 60s | The lookback counters are used to track the size and count (number of Specifies how far into history should the size/count variation be tracked It must be an integer followed by [s\|m] which stands for seconds and |
| `cntr_2_lookback_time` | `[<integer>[s|m]]` | 600s (10 minutes) | Specifies how far into history should the size/count variation be tracked See the 'cntr_1_lookback_time' setting description for explanation and usage |
| `cntr_3_lookback_time` | `[<integer>[s|m]]` | 900s (15 minutes) | Specifies how far into history should the size/count variation be tracked See the 'cntr_1_lookback_time' setting description for explanation and usage |
| `sampling_interval` | `[<integer>[s|m]]` | 1s | The lookback counters described earlier collect the size and count Specify this value using integer followed by [s\|m] which stands for |
| `autoAdjustQueue` | `<boolean>` | false | Whether or not splunkd adjusts the value of the 'maxSize' setting A value of "true" means splunkd adjusts the value of `maxSize` A value of "false" means splunkd does not adjust the 'maxSize' |

### `[queue=<queueName>]`

Documented in Splunk docs section *Queue settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoAdjustQueue` | `<boolean>` | The value of `autoAdjustQueue` in the "[queue]" stanza. | Whether or not splunkd adjusts the value of the 'maxSize' setting See the description for 'autoAdjustQueue' earlier in this file for |
| `maxSize` | `[<integer>|<integer>[KB|MB|GB]]` | The default is inherited from the 'maxSize' value specified | Specifies the capacity of a queue. It overrides the default capacity If specified as a lone integer (for example, maxSize=1000), maxSize If specified as an integer followed by KB, MB, or GB (for example, |
| `cntr_1_lookback_time` | `[<integer>[s|m]]` | The default value is inherited from the 'cntr_1_lookback_time' | Same explanation as mentioned in the [queue] stanza. Specifies the lookback time for the specific queue for counter 1. |
| `cntr_2_lookback_time` | `[<integer>[s|m]]` | The default value is inherited from the 'cntr_2_lookback_time' | Specifies the lookback time for the specific queue for counter 2. |
| `cntr_3_lookback_time` | `[<integer>[s|m]]` | The default value is inherited from the 'cntr_3_lookback_time' value | Specifies the lookback time for the specific queue for counter 3. |
| `sampling_interval` | `[<integer>[s|m]]` | The default value is inherited from the 'sampling_interval' value | Specifies the sampling interval for the specific queue. |

### `[pubsubsvr-http]`

Documented in Splunk docs section *PubSub server settings for the http endpoint.*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | true | If disabled, then http endpoint is not registered. Set this value to |
| `stateIntervalInSecs` | `<seconds>` | 300 (5 minutes) | The number of seconds before a connection is flushed due to inactivity. |

### `[diag]`

Documented in Splunk docs section *Settings controlling the behavior of 'splunk diag', the diagnostic tool*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `components` | `<comma-separated list>` | All components except "rest" | Specifies which components of the diag should be gathered. This allows the disabling and enabling, categorically, of entire portions All of these components are further subject to the EXCLUDE-<class> setting Currently, with no configuration, all components except "rest" are enabled Available components are:... |
| `all_dumps` | `<boolean>` | — | This setting currently is not applicable on UNIX platforms. Affects the 'log' component of diag. |
| `index_files` | `[full|manifests]` | manifests | Selects a detail level for the 'index_files' component. Can be overridden with the --index-files command line flag. |
| `index_listing` | `[full|light]` | light | Selects a detail level for the 'index_listing' component. Can be overridden with the --index-listing command line flag. |
| `etc_filesize_limit` | `<non-negative integer>` | 10000 (10MB) | This filters the 'etc' component. Can be overridden with the --etc-filesize-limit command line flag This value is specified in kilobytes. |
| `log_age` | `<non-negative integer>` | 60 (or approximately 2 months) | This filters the 'log' component. Can be overridden with the --log-age command line flag This value is specified in days. |
| `upload_proto_host_port` | `<protocol://host:port>|disabled` | https://api.splunk.com | The URI base to use for uploading files/diags to Splunk support. If set to "disabled" (override in a local/server.conf file), effectively Modification can theoretically permit operations with some forms of The communication path with api.splunk.com is over a simple but not Do not upload using unencrypted HTTP... |

### `[license]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `master_uri` | `[self|<uri>]` | — | DEPRECATED. Use the 'manager_uri' setting instead. |
| `manager_uri` | `[self|<uri>]` | (none) | The URI of the license manager to which a license peer connects. A value of "self" means that the instance itself handles license A URI value means that the instance attempts to connect to the license A URI consists of the following string: <scheme>://<hostname>:<port>, where <scheme> is the URI scheme to use to... |
| `active_group` | `Enterprise|Trial|Forwarder|Free` | <empty> | If the instance is a license manager, the license type will be set in 'active_group'. |
| `connection_timeout` | `<integer>` | 30 | Maximum time, in seconds, to wait before sending data to the manager times out. This timeout applies only if 'manager_uri' is set. |
| `send_timeout` | `<integer>` | 30 | Maximum time, in seconds, to wait before sending data to the manager times out. This timeout applies only if 'manager_uri' is set. |
| `receive_timeout` | `<integer>` | 30 | Maximum time, in seconds, to wait before receiving data from the manager times out This timeout applies only if 'manager_uri' is set. |
| `squash_threshold` | `<positive integer>` | 2000 | Periodically the indexer must report to license manager This is an advanced setting. Set it only after consulting a Splunk This needs to be set on license peers as well as the license |
| `report_interval` | `<nonnegative integer>[s|m|h]` | 1m | Selects a time period for reporting in license usage to the license This value is intended for very large deployments (hundreds of indexers) The maximum permitted interval is 1 hour. The minimum permitted interval is 1 minute. |
| `license_warnings_update_interval` | `<nonnegative integer>` | 0 | Specifies a time period, in seconds, for license manager to update License manager checks at every second the last time it updated the Increase this value for very large deployments that contain very The minimum permitted interval is 10. The maximum permitted interval is 3600, equivalent to 1 hour. |
| `strict_pool_quota` | `<boolean>` | true | Toggles strict pool quota enforcement. A value of "true" means members of pools receive warnings for a given day if A value of "false" means members of pool only receive warnings if both pool |
| `pool_suggestion` | `<string>` | — | Suggest a pool to the manager for this peer. The manager uses this suggestion if the manager doesn't have an explicit If the pool name doesn't match any existing pool, it is ignored, no This setting is intended to give an alternative management option for |
| `lm_uri` | `<comma-separated list>` | (none) | A list of the URIs of license managers that this instance is to use when High Availability Redundancy mode lets you use multiple license managers Separate multiple entries with commas. If you give this setting a value, that value cannot be empty. |
| `lm_ping_interval` | `<positive integer>` | 86400 (once a day) | How often, in seconds, that license managers communicate with each other This setting is valid only when you enable High Availability Redundancy mode, |
| `request_full_license_info` | `<boolean>` | false | Controls the amount of license information that is synchronized between By default, only aggregated information from the license stack for add-ons, If an application requires detailed information about its license, |

### `[lmpool:auto_generated_pool_forwarder]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `description` | `<textual description of this license pool>` | — | See Splunk documentation. |
| `quota` | `MAX|<maximum amount allowed by this license>` | — | MAX indicates the total capacity of the license. You may have only 1 pool The quota can also be specified as a specific size eg. |
| `slaves` | `*|<slave list>` | — | DEPRECATED. Use the 'peers' setting instead. |
| `peers` | `*|<peer list>` | — | An asterisk(*) indicates that any peer can connect to this pool. You can also specify a comma separated peer GUID list. |
| `stack_id` | `forwarder` | — | The stack to which this pool belongs. |

### `[lmpool:auto_generated_pool_free]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[lmpool:auto_generated_pool_enterprise]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[lmpool:auto_generated_pool_fixed-sourcetype_<sha256 hash of srctypes>]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[lmpool:auto_generated_pool_download_trial]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[pooling]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `state` | `[enabled|disabled]` | — | UNSUPPORTED: This setting is no longer supported. |
| `storage` | `<path to shared storage>` | — | UNSUPPORTED: This setting is no longer supported. |
| `app_update_triggers` | `true|false|silent` | — | UNSUPPORTED: This setting is no longer supported. |
| `lock.timeout` | `<time range string>` | — | UNSUPPORTED: This setting is no longer supported. |
| `lock.logging` | `<boolean>` | — | UNSUPPORTED: This setting is no longer supported. |
| `poll.interval.rebuild` | `<time range string>` | — | UNSUPPORTED: This setting is no longer supported. |
| `poll.interval.check` | `<time range string>` | — | UNSUPPORTED: This setting is no longer supported. |
| `poll.blacklist.<name>` | `<regex>` | — | UNSUPPORTED: This setting is no longer supported. |

### `[imds]`

Documented in Splunk docs section *License manager settings for configuring the license pool(s)*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `imds_version` | `[v1|v2]` | v1 | Sets IMDS version for EC2 instances metadata endpoints. This setting is AWS specific. |

### `[clustering]`

Documented in Splunk docs section *High availability clustering configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mode` | `[manager|peer|searchhead|disabled]` | disabled | Sets operational mode for this cluster node. Only one manager may exist per cluster. |
| `master_uri` | `[<uri> | clustermanager:<cm-name1>, clustermanager:<cm-name2>, ...]` | — | DEPRECATED. Use the 'manager_uri' setting instead. |
| `manager_uri` | `[<uri> | clustermanager:<cm-name1>, clustermanager:<cm-name2>, ...]` | — | There are two uses for this setting, one for 'mode=peer' and 'mode=searchhead', For 'mode=peer' and 'mode=searchhead': Specify the URI of the cluster manager that the peer or search head An example of <uri>: <scheme>://<hostname>:<port> For 'mode=searchhead' only: If the search head belongs to multiple For... |
| `manager_switchover_mode` | `[disabled|auto|manual]` | disabled | Set the cluster manager redundancy operation mode. Only valid for 'mode=manager'. |
| `advertised_disk_capacity` | `<integer>` | 100 | Only valid for 'mode=peer'. Percentage to use when advertising disk capacity to the cluster manager. |
| `pass4SymmKey` | `<string>` | (none) | Secret shared among the nodes in the cluster to prevent any If 'pass4SymmKey' is not set in the [clustering] stanza, Splunk software Unencrypted passwords must not begin with "$1$", as Splunk software uses |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' should be for a When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |
| `service_interval` | `<zero or positive integer>` | 0 | Only valid when 'mode=manager'. How often, in seconds, that the manager runs its service In its service loop, the manager checks the state of the A special default value of 0 indicates an auto mode where the service Service interval is bounded by the values 1 and |
| `service_execution_threshold_ms` | `<zero or positive integer>` | 1500 | Only valid when 'mode=manager'. Specifies, in milliseconds, the maximum period for one execution This setting is useful for large clusters with large numbers of |
| `deferred_cluster_status_update` | `<boolean>` | true | Only valid when 'mode=manager'. A value of "true" means that SF/RF met (complete cluster state) checks are A value of "false" means that SF/RF met checks are performed relatively |
| `deferred_rest_api_update` | `<boolean>` | true | Only valid when 'mode=manager'. A value of "true" means the manager responds to a REST API call from a source A value of "false" means the manager finishes all work for a received REST API |
| `max_fixup_time_ms` | `<zero or positive integer>` | 1000 | Only valid for 'mode=manager'. How long, in milliseconds, each fixup level runs before This setting is useful for larger clusters that have lots of 0 denotes that there is no max fixup timer. |
| `max_delayed_updates_time_ms` | `<zero or positive integer>` | 1000 | Only valid for 'mode=manager'. How long, in milliseconds, the cluster manager can continuously This setting is useful for larger clusters that have a large number of Do not change this setting without first consulting with Splunk Support. |
| `primary_src_persist_secs` | `<zero or positive integer>` | 604800 (1 week, 60 * 60 * 24 * 7 seconds) | Only valid for 'mode=manager'. For a warm bucket, this setting specifies the interval after the bucket's For a hot bucket, a non-zero value causes the primary to always reside with the Do not change this setting without first consulting with Splunk Support. |
| `cm_heartbeat_period` | `<non-zero positive integer>` | 1 | Only valid for 'mode=manager' and 'manager_switchover_mode=auto\|manual'. Determines the frequency, in seconds, of cluster manager to cluster |
| `cm_max_hbmiss_count` | `<non-zero positive integer>` | 3 | Only valid for 'mode=manager' and 'manager_switchover_mode=auto\|manual'. The maximum number of consecutive heartbeat misses allowed before a cluster manager in standby state triggers the switchover sequence. |
| `cm_com_timeout` | `<integer>` | 10 | The timeout, in seconds, used in communications between cluster managers Only valid with 'mode=manager' and 'manager_switchover_mode=auto\|manual'. Depending on the type of message being exchanged, triggering a timeout can |
| `cxn_timeout` | `<integer>` | 60 | The low-level timeout, in seconds, for establishing connection between |
| `send_timeout` | `<integer>` | 60 | The low-level timeout, in seconds, for sending data between cluster nodes. |
| `rcv_timeout` | `<integer>` | 60 | The low-level timeout, in seconds, for receiving data between cluster nodes. |
| `rep_cxn_timeout` | `<integer>` | 60 | Valid only for 'mode=peer'. The low-level timeout, in seconds, for establishing connection for replicating |
| `rep_send_timeout` | `<integer>` | 60 | Only valid for 'mode=peer'. The low-level timeout, in seconds, for sending replication slice data between This is a soft timeout. |
| `rep_rcv_timeout` | `<integer>` | 60 | Only valid for 'mode=peer'. Lowlevel timeout, in seconds, for receiving acknowledgment data from peers. |
| `rep_max_send_timeout` | `<integer>` | 180 (3 minutes) | Only valid for 'mode=peer'. Maximum send timeout, in seconds, for sending replication slice On rep_send_timeout source peer determines if total send timeout has If cumulative 'rep_send_timeout' exceeds 'rep_max_send_timeout', For a standalone indexer, changes to this setting are dynamically reloadable For indexer... |
| `rep_max_rcv_timeout` | `<integer>` | 180 (3 minutes) | Only valid for 'mode=peer'. Maximum cumulative receive timeout, in seconds, for receiving On 'rep_rcv_timeout', the source peer determines if the total For a standalone indexer, changes to this setting are dynamically reloadable For indexer clusters, changes to this setting trigger a rolling restart |
| `search_files_retry_timeout` | `<integer>` | 600 (10 minutes) | Only valid for 'mode=peer'. Timeout, in seconds, after which request for search files from a To make a bucket searchable, search specific files are copied from |
| `re_add_on_bucket_request_error` | `<boolean>` | false | Valid only for 'mode=peer'. Whether or not a peer re-adds itself to the cluster manager if the manager A value of "true" means the peer re-adds itself to the cluster manager if A value of "false" means the peer doesn't re-add itself to the cluster manager. |
| `decommission_search_jobs_wait_secs` | `<unsigned integer>` | 180 (3 minutes) | Valid only for 'mode=peer'. The maximum time, in seconds, that a peer node waits for search You do not need to restart the cluster peer when making changes to |
| `decommission_node_force_timeout` | `<seconds>` | 300 seconds | Valid only for 'mode=peer' and during node offline operation. The maximum time, in seconds, that a peer node waits for searchable copy This period begins after the peer node receives a 'splunk offline' command This attribute is not applicable to the "--enforce-counts" version of the |
| `decommission_force_finish_idle_time` | `<zero or positive integer>` | 0 | Valid only for 'mode=manager'. The time, in minutes, that the manager waits before forcibly finishing the A value of zero (0) means that the manager does not forcibly finish |
| `rolling_restart` | `restart|shutdown|searchable|searchable_force` | restart | Only valid for 'mode=manager'. Determines whether indexer peers restart or shutdown during a rolling If set to "restart", each peer automatically restarts during a rolling If set to "shutdown", each peer is stopped during a rolling restart, If set to "searchable", the cluster attempts a best effort to maintain If... |
| `searchable_rolling_peer_state_delay_interval` | `<zero or positive integer>` | 60 | Only valid for 'mode=manager'. Specifies an extra time interval, in seconds, during which the peer remains Extending the amount of time the peer remains in the ReassigningPrimaries This also reduces the impact of incomplete searches and bucket corruption, |
| `searchable_rolling_site_down_policy` | `full|most|half` | half | Only valid for 'mode=manager' and is only used if 'multisite=true' and Sets the policy for calculating the maximum number of peers in a site allowed If set to 'full', the manager will allow an entire site to shutdown at once If set to 'most', the manager will maintain a few peers in a site to act as If set to... |
| `rolling_restart_condition` | `up|batch_adding|starting` | batch_adding | Only valid for 'mode=manager'. Determines the target peer status the manager waits for, when restarting If set to "up", the manager will wait for a restarting peer to reach the If set to "batch_adding", the manager will wait for a restarting peer to If set to "starting", the manager will wait for a restarting peer to |
| `site_by_site` | `<boolean>` | true | Only valid for 'mode=manager' and 'multisite=true'. Whether or not the manager limits peer restarts to one site at a time during A value of "true" means the manager restarts peers from one site at a time, A value of "false" means the manager randomly selects peers to restart, from |
| `decommission_force_timeout` | `<zero or positive integer>` | 180 (3 minutes) | Only valid for 'mode=manager'. Only valid for 'rolling_restart=searchable_force'. |
| `restart_inactivity_timeout` | `<zero or positive integer>` | 600 (10 minutes) | Only valid for 'mode=manager'. Only valid for 'rolling_restart=searchable_force'. |
| `rebalance_pipeline_batch_size` | `<integer>` | 60 | Valid only for 'mode=manager'. Valid only for 'searchable_rebalance=true'. |
| `rebalance_primary_failover_timeout` | `<zero or positive integer>` | 75 | Valid only for 'mode=manager'. Valid only for 'searchable_rebalance=true'. |
| `rebalance_newgen_propagation_timeout` | `<zero or positive integer>` | 60 (1 minute) | Valid only for 'mode=manager'. Valid only for 'searchable_rebalance=true'. |
| `rebalance_search_completion_timeout` | `<integer>` | 180 (3 minute) | Valid only for 'mode=manager'. Valid only for 'searchable_rebalance=true'. |
| `searchable_rebalance` | `<boolean>` | false | Valid only for 'mode=manager'. Controls whether searches can continue uninterrupted during data rebalancing. |
| `multisite` | `<boolean>` | false | Applicable in 'mode=manager' and 'mode=searchhead'. In 'mode=manager': Indicates if the cluster manager is operating in a multisite configuration. |
| `replication_factor` | `<positive integer>` | 3 | Only valid for 'mode=manager'. Determines how many copies of rawdata are created in the cluster. |
| `site_replication_factor` | `<comma-separated string>` | origin:2, total:3 | Only valid for 'mode=manager' and is only used if 'multisite=true'. This specifies the per-site replication policy for any given Currently specified globally and applies to buckets in all Each entry is of the form <site-id>:<positive integer> which Valid site-ids include two mandatory keywords and optionally The... |
| `search_factor` | `<positive integer>` | 2 | Only valid for 'mode=manager'. Determines how many buckets have index structures pre-built. |
| `site_search_factor` | `<comma-separated list>` | origin:1, total:2 | Only valid for 'mode=manager' and is only used if 'multisite=true'. This specifies the per-site policy for searchable copies for any This is similar to the 'site_replication_factor' setting. |
| `ack_factor` | `<positive integer>` | 0 | Sets the number of copies of incoming data that must be saved across For example, a value of 2 means that two copies of the incoming data Valid only if 'useACK=true' and 'mode=peer'. Supported values range from 0 to the replication factor. |
| `available_sites` | `<comma-separated list>` | an empty string | Only valid for 'mode=manager' and is only used if 'multisite=true'. This is a comma-separated list of all the sites in the cluster. |
| `forwarder_site_failover` | `<comma-separated list>` | an empty string | Only valid for 'mode=manager' and is only used if 'multisite=true'. This is a comma-separated list of pair of sites, "site1:site2", If 'multisite' is turned on 'forwarder_site_failover' must be |
| `site_mappings` | `<comma-separated list>` | an empty string | Only valid for 'mode=manager'. When you decommission a site, you must update this attribute so that the Used only if multisite is true and sites have been decommissioned. |
| `constrain_singlesite_buckets` | `<boolean>` | true | Only valid for 'mode=manager' and is only used if multisite is true. Specifies whether the cluster keeps single-site buckets within one site When this setting is "true", buckets in a single site cluster do not When this setting is "false", buckets previously created in |
| `heartbeat_timeout` | `<positive integer>` | 60 | Only valid for 'mode=manager'. Specifies, in seconds, when the manager considers a peer down. |
| `access_logging_for_heartbeats` | `<boolean>` | false (logging disabled) | Only valid for 'mode=manager'. Whether or not the manager logs peer heartbeats to the You do not have to restart the manager to set this config parameter. |
| `restart_timeout` | `<positive integer>` | 60 | Only valid for 'mode=manager'. The amount of time, in seconds, the manager waits for a peer More specifically, the amount of time that the manager waits for a Note that this only works with the offline command or if the peer You do not need to restart the cluster manager when making changes to |
| `streaming_replication_wait_secs` | `<positive integer>` | 60 | Only valid for 'mode=manager'. The amount of time, in seconds, that a peer node waits to restart after |
| `quiet_period` | `<positive integer>` | 60 | Only valid for 'mode=manager'. The amount of time, in seconds, that the manager is However, if peers are still registering themselves with the manager after During the quiet time, the manager does not initiate any actions. |
| `manager_switchover_quiet_period` | `<positive integer>` | 60 | Only valid for 'mode=manager' and 'manager_switchover_mode=auto\|manual'. This setting determines the amount of time, in seconds, that the manager is However, if peers are still registering themselves with the manager after During the quiet time, the manager does not initiate any actions. |
| `reporting_delay_period` | `<positive integer>` | 30 | Only valid for 'mode=manager'. The acceptable amount of delay, in seconds, for reporting both unmet This setting helps provide more reliable cluster status reporting You do not need to restart the cluster manager when making changes to |
| `generation_poll_interval` | `<positive integer>` | 5 | How often, in seconds, the search head polls the manager for This setting is valid only if 'mode=manager' or 'mode=searchhead'. This setting reloads automatically and does not require a restart. |
| `generation_max_staleness` | `<interval><unit>` | 60s | Search heads will ignore search generation information from a cluster This setting specifies how old a search head's own information can be before When search performance is compromised by cluster manager restarts, increase This setting is valid only when 'mode=searchhead'. |
| `max_peer_build_load` | `<integer>` | 2 | Only valid for 'mode=manager'. This is the maximum number of concurrent tasks to make buckets |
| `max_peer_rep_load` | `<integer>` | 5 | Only valid for 'mode=manager'. This is the maximum number of concurrent non-streaming |
| `max_peer_sum_rep_load` | `<integer>` | 5 | Only valid for 'mode=manager'. This is the maximum number of concurrent summary replications |
| `max_peer_truncate_load` | `<integer>` | 0 | Only valid for 'mode=manager'. The maximum number of concurrent truncations in which a peer can participate. |
| `max_nonhot_rep_kBps` | `<integer>` | 0 | Only valid for 'mode=peer'. The maximum throughput, in kilobytes per second, for warm/cold/summary Similar to forwarder's 'maxKBps' setting in the limits.conf file. |
| `max_replication_errors` | `<integer>` | 3 | Only valid for 'mode=peer'. This is the maximum number of consecutive replication errors The special value of 0 turns off this safeguard; so the source For a standalone indexer, changes to this setting are dynamically reloadable For indexer clusters, changes to this setting trigger a rolling restart |
| `searchable_targets` | `<boolean>` | true | Only valid for 'mode=manager'. Tells the manager to make some replication targets searchable |
| `searchable_target_sync_timeout` | `<integer>` | 60 | Only valid for 'mode=peer'. How long, in seconds, that a hot bucket replication connection can be Regular syncing - when the data is flowing through The special value of 0 turns off this timeout behavior. |
| `target_wait_time` | `<positive integer>` | 150 (2 minutes 30 seconds) | Only valid for 'mode=manager'. Specifies the time, in seconds, that the manager waits for the This setting is dynamically reloadable and does not require restart |
| `summary_wait_time` | `<positive integer>` | 660 (11 minutes) | Only valid when 'mode=manager' and 'summary_replication=true'. Specifies the time, in seconds, that the manager waits before |
| `commit_retry_time` | `<positive integer>` | 300 (5 minutes) | Only valid for 'mode=manager'. Specifies the interval, in seconds, after which, if the last |
| `percent_peers_to_restart` | `<integer between 0-100>` | 10 | Only valid for 'mode=manager'. Suggested percentage of maximum peers to restart for rolling-restart. |
| `percent_peers_to_reload` | `<integer between 0-100>` | 100 | Only valid for 'mode=manager'. Suggested percentage of maximum peers to reload for bundle push. |
| `max_peers_to_download_bundle` | `<positive integer>` | 5 | Only valid for 'mode=manager'. The maximum number of peers to simultaneously download the configuration bundle When a peer finishes the download, the next waiting peer, if any, begins If set to 0, all peers try to download at once. |
| `precompress_cluster_bundle` | `<boolean>` | true | Only valid for 'mode=manager'. Whether or not the manager compresses the configuration bundle files before A value of "true" means the manager compresses the configuration bundle, which Set this option to "true" only when SSL compression is off. |
| `auto_rebalance_primaries` | `<boolean>` | true | Only valid for 'mode=manager'. Specifies if the manager should automatically rebalance bucket |
| `rebalance_primaries_execution_limit` | `<non-negative integer>` | — | DEPRECATED. Use the 'rebalance_primaries_execution_limit_ms' setting instead. |
| `rebalance_primaries_execution_limit_ms` | `<non-negative integer>` | 0 | Only valid for 'mode=manager'. The maximum period, in milliseconds, for one execution This setting is useful for large clusters with large numbers of The default value of 0 signifies auto mode. |
| `commit_generation_execution_limit_ms` | `<non-negative integer>` | 0 | Only valid for 'mode=manager'. Specifies, in milliseconds, the maximum period for one execution This setting is useful for large clusters with large numbers of The default value of 0 signifies auto mode. |
| `idle_connections_pool_size` | `<integer>` | -1 | Only valid for 'mode=manager'. Specifies how many idle http(s) connections that should be kept Reusing connections improves the time it takes to send messages to peers -1 corresponds to "auto", letting the manager determine the |
| `use_batch_mask_changes` | `<boolean>` | true | Only valid for 'mode=manager'. Specifies if the manager should process bucket mask changes in Set to 'false' when there are version 6.1 peers in the cluster for You do not need to restart the cluster manager when making changes to |
| `service_jobs_msec` | `<positive integer>` | 100 (0.1 seconds) | Only valid for 'mode=manager'. The maximum time, in milliseconds, that the cluster manager spends in servicing You do not need to restart the cluster manager when making changes to |
| `summary_replication` | `true|false|disabled` | false (for both Cluster Manager and Peers) | Valid for both 'mode=manager' and 'mode=peer'. Cluster Manager: Peers: |
| `rebalance_threshold` | `<decimal>` | 0.90 | Only valid for 'mode=manager'. During rebalancing buckets amongst the cluster, this threshold is Valid values are between 0.10 and 1.00. |
| `max_auto_service_interval` | `<positive integer>` | 1 | Only valid for 'mode=manager'. Only valid when 'service_interval' is in auto mode. |
| `buckets_to_summarize` | `<primaries|primaries_and_hot|all>` | primaries | Only valid for 'mode=manager'. Determines which buckets are sent to '\| summarize' searches (searches that Set to "primaries" to apply only to primary buckets. |
| `maintenance_mode` | `<boolean>` | — | Only valid for 'mode=manager'. To preserve the maintenance mode setting in case of manager |
| `backup_and_restore_primaries_in_maintenance` | `<boolean>` | false | Only valid for 'mode=manager'. Determines whether the manager performs a backup/restore of bucket A value of "true" means, restoration of primaries occurs automatically when |
| `max_primary_backups_per_service` | `<zero or positive integer>` | 10 | Only valid for 'mode=manager'. For use with the 'backup_and_restore_primaries_in_maintenance' setting. |
| `allow_default_empty_p4symmkey` | `<boolean>` | false | Only valid for 'mode=manager'. Affects behavior of manager during start-up, if 'pass4SymmKey'resolves A value of "true" means the manager posts a warning but still launches. |
| `register_replication_address` | `<string>` | (none) | Only valid for 'mode=peer'. This is the address on which a peer is available for accepting This must be either an IP address or fully qualified machine/domain name. |
| `register_forwarder_address` | `<string>` | (none) | Only valid for 'mode=peer'. This is the address on which a peer is available for accepting This must be either an IP address or fully qualified machine/domain name. |
| `register_search_address` | `<string>` | (none) | Only valid for 'mode=peer'. This is the address that advertises the peer to search heads. |
| `executor_workers` | `<positive integer>` | 10 | Only valid if 'mode=manager' or 'mode=peer'. Number of threads that can be used by the clustering thread pool. |
| `local_executor_workers` | `<positive integer>` | — | DEPRECATED. |
| `manual_detention` | `on|on_ports_enabled|off` | off | Only valid for 'mode=peer'. Puts this peer node in manual detention. |
| `allowed_hbmiss_count` | `<positive integer>` | 3 | Only valid for 'mode=peer'. Sets the count of number of heartbeat failures before the peer node |
| `buckets_per_addpeer` | `<non-negative integer>` | 1000 | Only valid for 'mode=peer'. Controls the number of buckets for each add peer request. |
| `heartbeat_period` | `<non-zero positive integer>` | 1 | Controls the interval, in seconds, with which the peer attempts Only valid for 'mode=peer'. |
| `auto_fix_corrupt_buckets` | `<boolean>` | true | Only valid for 'mode=manager'. If set to "true", the manager performs automatic fixup of To fix a corrupted bucket, the manager fetches the current The manager's peer nodes must be running a version that supports This feature is available only for non-SmartStore buckets. |
| `bucketsize_mismatch_strategy` | `smallest|largest` | largest | Only valid for 'mode=manager'. This setting determines how the manager decides which target peer's bucket copy A value of "largest" means the largest copy of the bucket on any target A value of "smallest" means the smallest copy of the bucket on any target Do not alter this value without contacting Splunk Support. |
| `remote_storage_upload_timeout` | `<non-zero positive integer>` | 60 (1 minute) | Only valid for 'mode=peer'. For a remote storage enabled index, this setting specifies the interval For a standalone indexer, changes to this setting are dynamically reloadable For indexer clusters, changes to this setting trigger a rolling restart |
| `report_remote_storage_bucket_upload_to_targets` | `<boolean>` | false | Only valid for 'mode=peer' or 'mode=manager'. For a remote storage enabled index, this setting specifies whether Do not change the value from the default unless instructed by You do not need to restart the cluster manager when making changes to |
| `remote_storage_retention_period` | `<non-zero positive integer>` | 900 (15 minutes) | Only valid for 'mode=manager'. The interval, in seconds, after which the manager checks buckets This setting also determines the time that the manager waits For details on retention policies, examine the This setting is dynamically reloadable and does not require restart |
| `remote_storage_freeze_delay_period` | `<non-zero positive integer>` | 3600 (60 minutes) | Only valid for 'mode=manager'. The interval, in seconds, that the manager waits for any bucket |
| `recreate_bucket_attempts_from_remote_storage` | `<positive integer>` | 10 | Only valid for 'mode=manager'. Controls the number of attempts the manager makes to recreate the Manager detects that the bucket is not present on any peers. |
| `recreate_bucket_max_per_service` | `<positive integer>` | 20000 | Only valid for 'mode=manager'. Only applies when using remote storage enabled indexes. |
| `recreate_bucket_fetch_manifest_batch_size` | `<positive integer>` | 50 | Only valid for 'mode=manager'. Controls the maximum number of bucket IDs for which a peer The manager sends this setting to all the peers that are |
| `recreate_index_attempts_from_remote_storage` | `<positive integer>` | 10 | Only valid for 'mode=manager'. Controls the number of attempts the manager makes to recreate Re-creation of an index involves the following steps: If set to 0, disables the re-creation of the index. |
| `recreate_index_fetch_bucket_batch_size` | `<positive integer>` | 2000 | Only valid for 'mode=manager'. Controls the maximum number of bucket IDs that the manager |
| `use_batch_remote_rep_changes` | `<boolean> or <positive integer>` | 1000 | Only valid for 'mode=manager'. Specifies whether the manager processes bucket copy changes (to meet Also controls the maximum number of bucket replications that are processed in This is applicable to buckets belonging to Do not change this setting without consulting with Splunk Support. |
| `max_peer_batch_rep_load` | `<positive integer>` | 5 | Only valid for 'mode=manager'. This setting is applicable to buckets belonging to Only valid when 'use_batch_remote_rep_changes=true' This setting specifies the maximum number of concurrent batch replications |
| `enable_primary_fixup_during_maintenance` | `<boolean>` | true | Only valid for 'mode=manager'. Specifies whether the manager performs primary fixups during This setting is dynamically reloadable and does not require restart |
| `freeze_during_maintenance` | `<boolean>` | false | Only valid for 'mode=manager'. Specifies whether the manager will tell peers to freeze buckets during This setting is dynamically reloadable and does not require restart |
| `assign_primaries_to_all_sites` | `<boolean>` | false | Only valid for 'mode=manager' and 'multisite=true'. Controls how the manager assigns bucket primary copies on a If set to "true", the manager assigns a primary copy to each site If set to "false": The manager assigns a primary copy only to sites with a search head. |
| `log_bucket_during_addpeer` | `<boolean>` | false | Only valid for 'mode=manager'. Controls the log level for bucket information during add-peer activities. |
| `max_concurrent_peers_joining` | `<nonzero integer>` | 10 | Only valid for 'mode=manager'. Limits the number of peers that are allowed to join the cluster at one time. |
| `enable_parallel_add_peer` | `<boolean>` | true | Only valid for 'mode=manager'. Enables the cluster manager to accept and process multiple 'add peer' requests The upper limit of concurrent 'add peer' requests that the manager can handle is When this feature is enabled, the largest recommended value for This setting is useful for clusters with large numbers of buckets |
| `buckets_status_notification_batch_size` | `<positive integer>` | 1000 | Only valid for 'mode=peer'. Controls the number of existing buckets IDs that the peer |
| `notify_scan_period` | `<non-zero positive integer>` | 10 | Only valid for 'mode=peer'. Controls the frequency, in seconds, that the indexer handles |
| `notify_scan_min_period` | `<non-zero positive integer>` | 10 | Only valid for 'mode=peer'. Controls the highest frequency, in milliseconds, that the indexer |
| `notify_buckets_period` | `<non-zero positive integer>` | 10 | Only valid for 'mode=peer'. Controls the frequency, in milliseconds, that the indexer handles |
| `notify_buckets_usage_period` | `<interval>` | 1m (1 minute) | Only valid for 'mode=peer'. Controls the frequency that the indexer sends bucket usage If set to '0s' (0 seconds), indexers will not attempt to |
| `notify_buckets_usage_batch_size` | `<positive integer>` | 2048 | Only valid for 'mode=peer'. Controls the batch size of bucket usage notifications sent This setting specifies the maximum number of bucket usage notifications |
| `clustered_bucket_database_granularity` | `global | index` | global | Currently not supported. This setting is related to a feature that is Only valid for 'mode=peer'. |
| `max_usage_rebalance_retries` | `<positive integer>` | 3 | Only valid for 'mode=manager'. The maximum number of retry attemtps before the cluster manager gives up |
| `max_usage_rebalance_operations_per_service` | `<non-zero positive integer>` | 50 | Only valid for 'mode=manager'. The maximum number of operations which bucket usage rebalance will initiate |
| `bucket_usage_decay_half_life` | `<interval>` | 7d (7 days) | Only valid for 'mode=manager'. The interval after which a bucket usage record will The higher this parameter, the less weight is given to The interval can be specified as a string for seconds, Must be greater than 0s (0 seconds). |
| `usage_rebalance_bucket_movement_factor` | `<decimal>` | 0.01 | Only valid for 'mode=manager'. A number between 0 and 1, non-inclusive. |
| `summary_update_batch_size` | `<non-zero positive integer>` | 10 | Only valid for 'mode=peer'. Controls the number of summary updates the indexer sends per batch to |
| `summary_registration_batch_size` | `<non-zero positive integer>` | 1000 | Only valid for 'mode=peer'. Controls the number of summaries that get asynchronously registered Caution: Do not modify this setting without guidance from Splunk personnel. |
| `enableS2SHeartbeat` | `<boolean>` | true | Only valid for 'mode=peer'. Splunk software monitors each replication connection for |
| `s2sHeartbeatTimeout` | `<integer>` | 600 (10 minutes) | This specifies the global timeout value, in seconds, for monitoring Splunk software closes a replication connection if heartbeat is not seen Replication source sends heartbeats every 30 seconds. |
| `throwOnBucketBuildReadError` | `<boolean>` | false | Valid only for 'mode=peer'. A value of "true" means index clustering peer throws an exception if it A value of "false" means index clustering peer just logs the error and preserves |
| `cluster_label` | `<string>` | — | Only valid for 'mode=manager'. This specifies the label of the indexer cluster |
| `warm_bucket_replication_pre_upload` | `<boolean>` | false | Valid only for 'mode=peer'. This setting applies to remote storage enabled indexes only. |
| `bucketsize_upload_preference` | `largest | smallest` | largest | Valid only for 'mode=peer'. This setting applies to remote storage enabled indexes only. |
| `upload_rectifier_timeout_secs` | `<unsigned integer>` | 2 | Valid only for 'mode=peer'. This setting applies to remote storage enabled indexes only. |
| `localization_based_primary_selection` | `[disabled|auto]` | disabled | Only valid for 'mode=manager'. This setting determines the behavior of the cluster manager when If set to 'disabled' the localization flags of the buckets are not |
| `localization_update_batch_size` | `<non-zero positive integer>` | 1000 | Only valid for 'mode=peer'. Controls the number of bucket localization updates the peer sends |
| `corrupt_bucket_updates_batch_size` | `<non-zero positive integer>` | 100 | Only valid for 'mode=peer'. Controls the number of corrupt bucket updates the peer sends |
| `enable_encrypt_bundle` | `<boolean>` | true | Whether or not an indexer cluster manager encrypts sensitive fields from the A value of "true" means that indexer clustering bundle encryption is enabled. A value of "false" means that indexer clustering bundle encryption is disabled. |

### `[clustermanager:<cm-nameX>]`

Documented in Splunk docs section *High availability clustering configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `master_uri` | `<uri>` | — | DEPRECATED. Use the 'manager_uri' setting instead. |
| `manager_uri` | `<string>` | — | There are two uses for this setting, one for 'mode=searchhead', For 'mode=searchhead': This represents the URI of the cluster manager that this For 'mode=manager': Only valid if 'manager_switchover_mode=auto\|manual' This setting is the URI for the manager described by this stanza. Each cluster manager must include... |
| `pass4SymmKey` | `<string>` | (none) | Secret shared among the nodes in the cluster to prevent any If it is not present here, the key in the clustering stanza is used. Ignored when 'mode=manager' and 'manager_switchover_mode=auto\|manual'. |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' should be for a When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |
| `site` | `<site-id>` | — | Specifies the site this search head belongs to for this particular manager Valid values for site-id include site0 to site63. The special value "site0" disables site affinity for a search head in a Ignored when 'mode=manager' and 'manager_switchover_mode=auto\|manual'. |
| `multisite` | `<boolean>` | false | Turns on the multisite feature for this manager_uri for the search head. Make sure the manager has the multisite feature turned on. |

### `[replication_port://<port>]`

Documented in Splunk docs section *High availability clustering configuration*. Documented in Splunk docs section *search head clustering configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Set to true to disable this replication port stanza. |
| `listenOnIPv6` | `no|yes|only` | — | Toggle whether this listening port listens on IPv4, IPv6, or both. If not present, the setting in the [general] stanza is used. |
| `acceptFrom` | `<network_acl> ...` | "*" (accept from anywhere) | Lists a set of networks or addresses from which to accept connections. Separate multiple rules with commas or spaces. |
| `disabled` | `<boolean>` | false | Set to true to disable this replication port stanza. |
| `listenOnIPv6` | `no|yes|only` | — | Toggle whether this listening port listens on IPv4, IPv6, or both. If not present, the setting in the [general] stanza is used. |
| `acceptFrom` | `<network_acl> ...` | "*" (accept from anywhere) | Lists a set of networks or addresses from which to accept connections. Separate multiple rules with commas or spaces. |

### `[replication_port-ssl://<port>]`

Documented in Splunk docs section *High availability clustering configuration*. Documented in Splunk docs section *search head clustering configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Set to true to disable this replication port stanza. |
| `listenOnIPv6` | `no|yes|only` | — | Toggle whether this listening port listens on IPv4, IPv6, or both. If not present, the setting in the [general] stanza is used. |
| `acceptFrom` | `<string> ...` | — | This setting is the same as the setting in the [replication_port] stanza. |
| `serverCert` | `<string>` | (none) | Full path to file containing private key and server certificate. The <path> must refer to a PEM format file. |
| `sslPassword` | `<string>` | (none) | See the description of 'sslPassword' under the [sslConfig] stanza |
| `password` | `<string>` | — | DEPRECATED. Use 'sslPassword' instead. |
| `rootCA` | `<string>` | (none) | DEPRECATED. Use '[sslConfig]/sslRootCAPath' instead. |
| `cipherSuite` | `<string>` | — | See the description of 'cipherSuite' under the [sslConfig] stanza The default can vary. See the 'cipherSuite' setting in |
| `sslVersions` | `<comma-separated list>` | — | See the description of 'sslVersions' under the [sslConfig] stanza The default can vary. See the 'sslVersions' setting in |
| `ecdhCurves` | `<comma separated list>` | — | See the description of 'ecdhCurves' under the [sslConfig] stanza The default can vary. See the 'ecdhCurves' setting in |
| `dhFile` | `<string>` | (none) | See the description of 'dhFile' under the [sslConfig] stanza |
| `dhfile` | `<string>` | — | DEPRECATED. Use 'dhFile' (with a capital F) instead. |
| `supportSSLV3Only` | `<boolean>` | — | DEPRECATED. Use 'sslVersions' instead. |
| `useSSLCompression` | `<boolean>` | true | Whether or not the client performs data compression at the A value of "true" means that the client attempts to negotiate A value of "false" means that the client does not try to compress |
| `compressed` | `<boolean>` | — | DEPRECATED. Use 'useSSLCompression' instead. |
| `requireClientCert` | `<boolean>` | false | See the description of 'requireClientCert' under the [sslConfig] stanza |
| `allowSslRenegotiation` | `<boolean>` | true | See the description of 'allowSslRenegotiation' under the [sslConfig] stanza |
| `sslCommonNameToCheck` | `<comma-separated list>` | (none) | See the description of 'sslCommonNameToCheck' under the [sslConfig] stanza |
| `sslAltNameToCheck` | `<comma-separated list>` | (none) | See the description of 'sslAltNameToCheck' under the [sslConfig] stanza |
| `disabled` | `<boolean>` | false | Set to true to disable this replication port stanza. |
| `listenOnIPv6` | `no|yes|only` | The setting in the [general] stanza | Toggle whether this listening port listens on IPv4, IPv6, or both. |
| `acceptFrom` | `<network_acl> ...` | — | This setting is the same as the setting in the [replication_port] stanza. |
| `serverCert` | `<path>` | (none) | See the description of 'serverCert' under the [sslConfig] stanza |
| `sslPassword` | `<string>` | (none) | See the description of 'sslPassword' under the [sslConfig] stanza |
| `password` | `<string>` | — | DEPRECATED. Use 'sslPassword' instead. |
| `rootCA` | `<string>` | (none) | DEPRECATED. Use '[sslConfig]/sslRootCAPath' instead. |
| `cipherSuite` | `<string>` | — | See the description of 'cipherSuite' under the [sslConfig] stanza The default can vary. See the 'cipherSuite' setting in |
| `supportSSLV3Only` | `<boolean>` | — | DEPRECATED. Use 'sslVersions' instead. |
| `useSSLCompression` | `<boolean>` | false | See the description of 'useSSLCompression' under the [sslConfig] stanza |
| `compressed` | `<boolean>` | — | DEPRECATED. Use 'useSSLCompression' instead. |
| `requireClientCert` | `<boolean>` | false | See the description of 'requireClientCert' under the [sslConfig] stanza |
| `allowSslRenegotiation` | `<boolean>` | true | See the description of 'allowSslRenegotiation' under the [sslConfig] stanza |

### `[introspection:generator:disk_objects]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `acquireExtra_i_data` | `<boolean>` | false | If true, extra Disk Objects i-data is emitted; you can gain more insight Consult documentation for the list of regularly emitted Disk Objects |
| `collectionPeriodInSecs` | `<positive integer>` | 600 (10 minutes) | Controls frequency of Disk Objects i-data collection; higher frequency |

### `[introspection:generator:disk_objects__indexes]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[introspection:generator:disk_objects__volumes]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[introspection:generator:disk_objects__dispatch]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[introspection:generator:disk_objects__fishbucket]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[introspection:generator:disk_objects__bundle_replication]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[introspection:generator:disk_objects__partitions]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(none in this section)* | — | — | — |

### `[introspection:generator:disk_objects__summaries]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | — | If not specified, inherits the value from |
| `collectionPeriodInSecs` | `<positive integer>` | 1800 (30 minutes) | Controls frequency, in seconds, of Disk Objects - summaries If you enable summary collection, the first collection happens 5 minutes If 'collectionPeriodInSecs' is smaller than 5 * 60, it resets to Set to (N*300) seconds. Any remainder is ignored. |

### `[introspection:generator:resource_usage]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `acquireExtra_i_data` | `<boolean>` | false | A value of "true" means extra Resource Usage i-data is emitted; you can gain Consult the documentation for list of regularly emitted Resource Usage |
| `collectionPeriodInSecs` | `<positive integer>` | — | Controls frequency of Resource Usage i-data collection; higher frequency Default (on universal forwarders): 600 (10 minutes) Default (on all other Splunk platform instance types): 10 (1/6th of a minute) |
| `disabled` | `<boolean>` | — | Disables Resource Usage data collection. Default (on universal forwarders): true Default (on all other Splunk platform instance types): false |

### `[introspection:generator:resource_usage__iostats]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `collectionPeriodInSecs` | `<positive integer>` | 60 (1 minute) | Controls interval of IO Statistics i-data collection; higher intervals |
| `disabled` | `<boolean>` | — | Disables IO Statistics data collection. Default (on universal forwarders): true Default (on all other Splunk platform instance types): false |

### `[introspection:generator:kvstore]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `serverStatsCollectionPeriodInSecs` | `<positive integer>` | 27 | The frequency, in seconds, of KV Store server status collection. |
| `operationStatsCollectionPeriodInSecs` | `<positive integer>` | 60 seconds | The frequency, in seconds, of KV Store operation statistics collection (currentOp). |
| `collectionStatsCollectionPeriodInSecs` | `<positive integer>` | 600 (10 minutes) | The frequency, in seconds, of KV Store db statistics collection. |
| `profilingStatsCollectionPeriodInSecs` | `<positive integer>` | 5 seconds | The frequency, in seconds, of KV Store profiling data collection. |
| `rsStatsCollectionPeriodInSecs` | `<positive integer>` | 60 seconds | The frequency, in seconds, of KV Store replica set stats collection |

### `[introspection:distributed-indexes]`

Documented in Splunk docs section *Introspection settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | true | Whether or not collection of introspection information on distributed A value of "false" means information on distributed indexes is collected. This provides additional insight into index usage at the cost of greater |
| `collectionPeriodInSecs` | `<positive integer>` | 3600 (60 minutes) | The frequency, in seconds, of distributed index data collection. Must be set between 300 (5 minutes) and 86400 (24 hours). |
| `collectLocalIndexes` | `<boolean>` | false | This setting determines whether the search head retrieves index metadata, In single-instance configurations, where the instance serves as both search In distributed search deployments, with separate search heads and indexers, |

### `[commands:user_configurable]`

Documented in Splunk docs section *Settings used to control commands started by Splunk*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `prefix` | `<string>` | (none) | All non-internal commands started by splunkd are prefixed with this Should be only one word. In other words, commands are supported, but Applies to commands such as: search scripts, scripted inputs, SSL Does not apply to trusted/non-configurable command executions, such as: $SPLUNK_HOME is expanded. |

### `[app_backup]`

Documented in Splunk docs section *Settings used to control commands started by Splunk*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `backup_path` | `<string>` | $SPLUNK_HOME/var/backup | Full path to the directory that contains configuration backups created by For search head clusters, this directory resides on the deployer. |

### `[shclustering]`

Documented in Splunk docs section *search head clustering configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | true | Disables or enables search head clustering on this instance. When enabled, the captain needs to be selected via a When enabled, you must also specify the cluster member's own server |
| `mgmt_uri` | `[ mgmt-URI ]` | — | The management URI is used to identify the cluster member's own address to Either 'mgmt_uri' or 'servers_list' is necessary. The 'mgmt_uri' setting is simpler to author but is unique for each member. |
| `servers_list` | `[ <(GUID, mgmt-uri);>+ ]` | — | A semicolon separated list of instance GUIDs and management URIs. Each member uses its GUID to identify its own management URI. |
| `adhoc_searchhead` | `<boolean>` | false | This setting configures a member as an ad-hoc search head; i.e., the member Use the setting 'captain_is_adhoc_searchhead' to reduce compute load on the |
| `no_artifact_replications` | `<boolean>` | false | Prevent this Search Head Cluster member to be selected as a target for This is an advanced setting, and not to be changed without proper |
| `precompress_artifacts` | `<boolean>` | true | Determines whether this search head cluster member compresses the When set to "true", the search head compresses the artifacts Set this option to 'true' only when SSL compression is off on |
| `captain_is_adhoc_searchhead` | `<boolean>` | false | This setting prohibits the captain from running scheduled jobs. The captain is dedicated to controlling the activities of the cluster, |
| `preferred_captain` | `<boolean>` | true | The cluster tries to assign captaincy to a member with Note that it is not always possible to assign captaincy to a member with |
| `prevent_out_of_sync_captain` | `<boolean>` | true | This setting prevents a node that could not sync config changes to current This setting takes precedence over the preferred_captain setting. For example, This must be set to the same value on all members. |
| `replication_factor` | `<positive integer>` | 3 | Determines how many copies of search artifacts are created in the cluster. This must be set to the same value on all members. |
| `pass4SymmKey` | `<string>` | The 'changeme' from the [general] stanza in the default the | Secret shared among the members in the search head cluster to prevent any All members must use the same value. If set in the [shclustering] stanza, it takes precedence over any setting Unencrypted passwords must not begin with "$1$", as this is used by |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' should be for a When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |
| `async_replicate_on_proxy` | `<boolean>` | true | If the jobs/${sid} REST endpoint or its sub-resources (e.g. |
| `master_dump_service_periods` | `<integer>` | — | DEPRECATED. Use 'captain_dump_service_periods' instead. |
| `captain_dump_service_periods` | `<integer>` | 500 | If SHPMaster info is switched on in log.cfg, then captain statistics |
| `long_running_jobs_poll_period` | `<integer>` | 600 (10 minutes) | Long running delegated jobs are polled by the captain every |
| `scheduling_heuristic` | `<string>` | 'scheduler_load_based' | This setting configures the job distribution heuristic on the captain. There are currently two supported strategies: 'round_robin' or |
| `id` | `<string>` | Splunk software arranges for a unique value to be generated and | Unique identifier for this cluster as a whole, shared across all cluster |
| `cxn_timeout` | `<integer>` | 60 | Low-level timeout, in seconds, for establishing connection between |
| `send_timeout` | `<integer>` | 60 | Low-level timeout, in seconds, for sending data between search head |
| `rcv_timeout` | `<integer>` | 60 | Low-level timeout, in seconds, for receiving data between search head |
| `cxn_timeout_raft` | `<integer>` | 2 | Low-level timeout, in seconds, for establishing connection between search |
| `send_timeout_raft` | `<integer>` | 5 | Low-level timeout, in seconds, for sending data between search head |
| `rcv_timeout_raft` | `<integer>` | 5 | Low-level timeout, in seconds, for receiving data between search head |
| `rep_cxn_timeout` | `<integer>` | 60 | Low-level timeout, in seconds, for establishing connection for replicating |
| `rep_send_timeout` | `<integer>` | 60 | Low-level timeout, in seconds, for sending replication slice data This is a soft timeout. When this timeout is triggered on source peer, |
| `rep_rcv_timeout` | `<integer>` | 60 | Low-level timeout, in seconds, for receiving acknowledgement data from This is a soft timeout. When this timeout is triggered on source member, |
| `rep_max_send_timeout` | `<integer>` | 600 (10 minutes) | Maximum send timeout, in seconds, for sending replication slice data On 'rep_send_timeout' source peer determines if total send timeout has If cumulative rep_send_timeout exceeds 'rep_max_send_timeout', replication |
| `rep_max_rcv_timeout` | `<integer>` | 600 (10 minutes) | Maximum cumulative receive timeout, in seconds, for receiving acknowledgement On 'rep_rcv_timeout' source member determines if total receive timeout has |
| `log_heartbeat_append_entries` | `<boolean>` | false | If true, Splunk software logs the the low-level heartbeats between members in |
| `election_timeout_ms` | `<positive_integer>` | 60000 (1 minute) | The amount of time, in milliseconds, that a member waits before Note that modifying this value can alter the heartbeat period (See A very low value of election_timeout_ms can lead to unnecessary captain |
| `election_timeout_2_hb_ratio` | `<positive_integer>` | 12 (to keep the raft heartbeat period at 5 seconds) | The ratio between the election timeout, set in 'election_timeout_ms', and The raft heartbeat period is 'election_timeout_ms' / 'election_timeout_2_hb_ratio'. This ratio determines the number of heartbeat attempts that would fail A typical ratio between 5 - 20 is desirable. |
| `heartbeat_timeout` | `<positive integer>` | 60 (1 minute) | The amount of time, in seconds, that the captain considers a member down. This heartbeat exchanges data between the captain and members, which helps in Note that this heartbeat is different from the Raft heartbeat described |
| `raft_rpc_backoff_time_ms` | `<positive integer>` | 5000 (5 seconds) | Provides a delay, in milliseconds, should a raft RPC request fail. This avoids rapid connection requests being made to unreachable peers. |
| `access_logging_for_heartbeats` | `<boolean>` | false (logging disabled) | Only valid on captain. Enables/disables logging to the splunkd_access.log file for member heartbeats |
| `restart_timeout` | `<positive integer>` | — | This is the amount of time the captain waits for a member to come |
| `quiet_period` | `<positive integer>` | 60 | The amount of time, in seconds, for which a newly During this period the captain does not initiate any fixups |
| `max_peer_rep_load` | `<integer>` | 5 | This is the maximum number of concurrent replications that a |
| `target_wait_time` | `<positive integer>` | 150 | The amount of time, in seconds, that the captain waits for the target |
| `manual_detention` | `on|off` | off | This property toggles manual detention on member. When a node is in manual detention, it does not accept new search jobs, |
| `percent_peers_to_restart` | `<integer>` | — | The percentage of members to restart at one time during rolling restarts. Actual percentage may vary due to lack of granularity for smaller peer Valid values are between 0 and 100. |
| `rolling_restart_with_captaincy_exchange` | `<boolean>` | true | Whether or not the captain tries to exchange captaincy with another node A value of "true" means the captain tries to exchange captaincy A value of "false" means the captain restarts and captaincy transfers to some |
| `rolling_restart` | `restart|searchable|searchable_force` | restart (runs in classic rolling-restart mode) | Determines the rolling restart mode for a search head cluster. If set to "restart", a rolling restart runs in classic mode. |
| `decommission_search_jobs_wait_secs` | `<unsigned integer>` | 180 | The amount of time, in seconds, that a search head cluster member waits for Applies only when rolling restart is triggered in searchable or You do not have to restart search head members to configure this setting. |
| `register_replication_address` | `<string>` | — | This setting is the address on which a member is available for Can be an IP address, or a fully qualified machine/domain name. |
| `executor_workers` | `<positive integer>` | 50 | Number of threads that can be used by the search head clustering A value of 0 is interpreted as 1. |
| `heartbeat_period` | `<non-zero positive integer>` | 5 | The frequency, in seconds, with which the member attempts This heartbeat exchanges data between the captain and members, which |
| `enableS2SHeartbeat` | `<boolean>` | true | Whether or not Splunk software monitors each replication connection for A value of "true" means that Splunk software monitors the presence of a |
| `s2sHeartbeatTimeout` | `<integer>` | 600 (10 minutes) | The global timeout, in seconds, for monitoring heartbeats on replication Splunk software closes a replication connection if a heartbeat is not seen Replication source sends a heartbeat every 30 seconds. |
| `captain_uri` | `[ static-captain-URI ]` | — | The management URI of static captain is used to identify the cluster |
| `election` | `<boolean>` | — | This is used to classify a cluster as static or dynamic (RAFT based). If set to "false", a static captain, which is used for DR situation. |
| `mode` | `<member>` | — | Accepted values are captain and member, mode is used to identify Setting mode as captain assumes it to function as both captain and a member. |
| `sid_proxying` | `<boolean>` | true | Enable or disable search artifact proxying. Changing this affects the proxying of search results, and jobs feed Only for internal/expert use. |
| `ss_proxying` | `<boolean>` | true | Enable or disable saved search proxying to captain. Changing this affects the behavior of Searches and Reports page Only for internal/expert use. |
| `ra_proxying` | `<boolean>` | true | Enable or disable saved report acceleration summaries proxying to captain. Changing this affects the behavior of report acceleration summaries Only for internal/expert use. |
| `alert_proxying` | `<boolean>` | true | Enable or disable alerts proxying to captain. Changing this impacts the behavior of alerts, and essentially make them Only for internal/expert use. |
| `csv_journal_rows_per_hb` | `<integer>` | 10000 | How many rows of CSV from the delta-journal are sent per hb Used for both alerts and suppressions Do not alter this value without contacting Splunk Support. |
| `conf_replication_period` | `<integer>` | 5 | How often, in seconds, a cluster member replicates A value of 0 disables automatic replication of configuration changes. |
| `conf_replication_max_pull_count` | `<integer>` | 1000 | The maximum number of configuration changes a member A value of 0 disables any size limits. |
| `conf_replication_max_push_count` | `<integer>` | 100 | The maximum number of configuration changes a member A value of 0 disables any size limits. |
| `conf_replication_max_json_value_size` | `[<integer>|<integer>[KB|MB|GB]]` | 15MB | The maximum size of a JSON string element at any nested If a knowledge object created on a member has some string element If you do not specify a unit for the value, the unit defaults to bytes. The lower limit of this setting is 512KB. |
| `conf_replication_include.<conf_file_name>` | `<boolean>` | false | Whether Splunk replicates changes to a particular type of *.conf |
| `conf_replication_summary.whitelist.<name>` | `<whitelist_pattern>` | — | DEPRECATED. Use 'conf_replication_summary.includelist.<name>' instead. |
| `conf_replication_summary.includelist.<name>` | `<includelist_pattern>` | — | Files to be included in configuration replication summaries. |
| `conf_replication_summary.blacklist.<name>` | `<blacklist_pattern>` | — | DEPRECATED. Use 'conf_replication_summary.excludelist.<name>' instead. |
| `conf_replication_summary.excludelist.<name>` | `<excludelist_pattern>` | — | Files to be excluded from configuration replication summaries. |
| `conf_replication_summary.concerning_file_size` | `<integer>` | 50 | Any individual file within a configuration replication summary that is |
| `conf_replication_summary.period` | `<timespan>` | 1m (1 minute) | How often configuration replication summaries are created. |
| `conf_replication_purge.eligibile_count` | `<integer>` | 20000 | How many configuration changes must be present before any become In other words: controls the minimum number of configuration changes |
| `conf_replication_purge.eligibile_age` | `<timespan>` | 1d (1 day). | How old a configuration change must be before it is eligible for |
| `conf_replication_purge.period` | `<timespan>` | 1h (1 hour) | How often configuration changes are purged. |
| `conf_replication_find_baseline.use_bloomfilter_only` | `<boolean>` | false | Whether or not a search head cluster only uses bloom filters to Set to "true" to only use bloom filters in baseline determination during Set to "false" to first attempt a standard method, where the search head |
| `conf_replication_quarantine_large_lookups` | `<boolean>` | true | Determines whether or not a search head cluster quarantines and excludes from A value of "true" means that the cluster quarantines and does not replicate Conf replication quarantine can prevent cluster out of sync issues caused by Lookup replication resumes when a change occurs to the lookup file that |
| `conf_replication_max_csv_lookup_size_bytes` | `<integer>` | 5000000000 | Specifies the maximum size of a CSV lookup file, in bytes, that can be A value of "5000000000" means that the cluster quarantines and does not Lookup replication resumes when a change occurs to the lookup file that This setting is not reloadable. You must restart Splunk software for |
| `conf_deploy_repository` | `<path>` | — | Full path to directory containing configurations to deploy to cluster |
| `conf_deploy_staging` | `<path>` | — | Full path to directory where preprocessed configurations may be written |
| `conf_deploy_concerning_file_size` | `<integer>` | 50 | Any individual file within <conf_deploy_repository> that is larger than |
| `conf_deploy_precompress_bundles` | `<boolean>` | true | Determines whether or not the deployer compresses the configuration bundle Set this option to "true" only when SSL compression is off. Otherwise, the |
| `conf_deploy_fetch_url` | `<URL>` | (none) | Specifies the location of the deployer from which members fetch the This value must be set to a <URL> in order for the configuration bundle to |
| `conf_deploy_fetch_mode` | `auto|replace|none` | replace | Controls configuration bundle fetching behavior when the member starts up. When set to "replace", a member checks for a new configuration bundle on When set to "none", a member does not fetch the configuration bundle on Regarding "auto": If no configuration bundle has yet been fetched, "auto" is equivalent If the... |
| `artifact_status_fields` | `<comma-separated list>` | user, eai:acl.app , label | Give a comma separated fields to pick up values from status.csv and These fields are shown in the CLI/REST endpoint splunk list |
| `encrypt_fields` | `<comma-separated list>` | — | DEPRECATED. Use the setting in the '[general]' stanza instead. |
| `enable_jobs_data_lite` | `<boolean>` | — | DEPRECATED. Use the 'jobs_data_lite.enabled' instead. |
| `jobs_data_lite.enabled` | `<boolean>` | true | Enable memory optimizations for sharing search job status within search head |
| `jobs_data_lite.exclude_fields` | `<comma separated list>` | (none) | List of job status fields to be excluded from truncation when Fields to exclude must be in a comma separated list. |
| `jobs_data_lite.search_field_len` | `<non-negative integer>` | 100 | Maximum length for any search-based field in the search job status when Any field larger than this size will be truncated unless configured in the Search fields include: remote_search, normalized_search, optimized_search, |
| `jobs_data_lite.default_field_len` | `<non-negative integer>` | 1000000 | Maximum length for any nonsearch-based field in the search job status Any field larger than this size will be truncated unless configured in the |
| `jobs_data_lite.max_status_size_per_hb` | `<non-negative integer>` | 700 | The maximum size, in megabyte, of status.csv status.csv tracks job statuses and is sent between the captain and each cluster Recommended range: 500-1000 Absolute range: 100-1500 |
| `shcluster_label` | `<string>` | — | This specifies the label of the search head cluster. |
| `retry_autosummarize_or_data_model_acceleration_jobs` | `<boolean>` | true | Whether or not the captain tries a second time to delegate an |
| `deployerPushThreads` | `<positive integer>|auto` | 1 | The maximum number of threads to use when performing a deployer bundle push If set to "auto", the deployer auto-tunes the number of threads it uses |
| `remote_job_retry_attempts` | `<positive integer>` | 2 | Defines the maximum number of re-run attempts for a failing search job Note that this setting only applies to jobs that either failed to be The upper limit of the number of job re-run attempts is constrained by |
| `member_add_use_artifact_status_cache` | `<boolean>` | true | Whether or not search head cluster members use cached artifact status This option improves the performance of the search head cluster member A value of "true" means cluster members use cached artifact status during A value of "false" means cluster members do not use cached artifact status |
| `member_add_decouple_artifact_reporting` | `<boolean>` | true | Turns on or off an optimization for search head cluster member addition This option can improve the performance of the search head cluster member A value of "true" means artifact reporting is decoupled from the cluster A value of "false" means artifact reporting is not decoupled from the |
| `allow_concurrent_dispatch_savedsearch` | `<boolean>` | true | The search head cluster captain might dispatch multiple saved searches to a member This option controls whether the member processes the dispatched REST calls If true, the member processes the REST calls concurrently. If false, the member processes the REST calls sequentially. |

### `[kvstore]`

Documented in Splunk docs section *App Key Value Store (KV Store) configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Set to true to disable the KV Store process on the current server. To |
| `port` | `<integer>` | 8191 | Port to connect to the KV Store server. |
| `replicaset` | `<string>` | splunkrs | Replica set name. |
| `distributedLookupTimeout` | `<integer>` | — | This setting has been removed, as it is no longer needed. |
| `shutdownTimeout` | `<integer>` | 100 | Time, in seconds, to wait for a clean shutdown of the KV Store. If this time |
| `initAttempts` | `<integer>` | 300 | The maximum number of attempts to initialize the KV Store when starting |
| `replication_host` | `<string>` | — | The host name to access the KV Store. This setting has no effect on a single Splunk platform instance. |
| `verbose` | `<boolean>` | false | Whether or not verbose logging for KV Store is enabled. Set to "true" to enable verbose logging. |
| `verboseLevel` | `<nonnegative integer>` | 2 | When verbose logging is enabled, specifies the level of verbosity for logging |
| `dbPath` | `<string>` | $SPLUNK_DB/kvstore | Path where KV Store data is stored. Changing this directory after initial startup does not move existing data. |
| `storageEngine` | `wiredTiger` | wiredTiger | The storage engine that KV Store uses to manage its data. "mmapv1" is no longer supported for KV Store. |
| `storageEngineMigration` | `<boolean>` | — | DEPRECATED. |
| `oplogSize` | `<integer>` | 1000 (1GB) | The size of the replication operation log, in megabytes, for environments After the KV Store has created the oplog for the first time, changing this Do not change this setting without first consulting with Splunk Support. |
| `minSnapshotHistoryWindow` | `<integer>` | 5 | The minimum time window, in seconds, that the storage engine keeps the Do not change this setting without first consulting with Splunk Support. |
| `replicationWriteTimeout` | `<integer>` | 1800 (30 minutes) | The time to wait, in seconds, for replication to complete while saving KV Used for replication environments (search head clustering or search |
| `clientConnectionTimeout` | `<positive integer>` | 10 | The time, in seconds, to wait while attempting a connection to the KV Store |
| `clientSocketTimeout` | `<positive integer>` | 300 (5 minutes) | The time, in seconds, to wait while attempting to send or receive on a |
| `dbCursorOperationTimeout` | `<positive integer>` | 300 (5 minutes) | Specifies a cumulative time limit in seconds for processing operations |
| `clientConnectionPoolSize` | `<positive integer>` | 500 | The maximum number of active client connections to the KV Store. When the number of active connections exceeds this value, KV Store will Do not change this setting without first consulting with Splunk Support. |
| `caCertFile` | `<string>` | $SPLUNK_HOME/etc/auth/cacert.pem | DEPRECATED. Use '[sslConfig]/sslRootCAPath' instead. |
| `caCertPath` | `<string>` | — | DEPRECATED. Use '[sslConfig]/sslRootCAPath' instead. |
| `serverCert` | `<string>` | (none) | See the description of 'serverCert' under the [sslConfig] stanza |
| `sslVerifyServerCert` | `<boolean>` | — | See the description of 'sslVerifyServerCert' under the [sslConfig] stanza If you have enabled FIPS (by setting SPLUNK_FIPS=1), splunkd always verifies Default (if you have not enabled FIPS): false |
| `sslVerifyServerName` | `<boolean>` | false | See the description of 'sslVerifyServerName' under the [sslConfig] stanza |
| `sslKeysPath` | `<string>` | — | DEPRECATED. Use 'serverCert' instead. |
| `sslPassword` | `<string>` | (none) | See the description of 'sslPassword' under the [sslConfig] stanza Splunk Enterprise uses this setting only if you have turned on FIPS If you have turned on FIPS mode in Splunk Enterprise, then |
| `sslKeysPassword` | `<string>` | — | DEPRECATED. Use 'sslPassword' instead. |
| `sslCRLPath` | `<string>` | empty string (no revocation list) | The path to the Certificate Revocation List (CRL) file. A CRL is a list of digital certificates that have been revoked by Splunkd uses the CRL file only in the following cases: When the Splunk platform instance is in Common Criteria mode When you have enabled certificate status validation checks by configuring the... |
| `modificationsReadIntervalMillisec` | `<integer>` | 1000 (1 second) | How often, in milliseconds, to check for modifications to |
| `modificationsMaxReadSec` | `<integer>` | 30 | Maximum time interval KVStore can spend while checking for modifications |
| `initialSyncMaxFetcherRestarts` | `<positive integer>` | 0 | Specifies the maximum number of query restarts an oplog fetcher can perform Increasing this value might help in dynamic deployments with very large |
| `max_backup_restore_threads` | `<positive integer>` | 4 | Specifies the number of parallel threads to run when backing up and |
| `max_backup_restore_jobs` | `<positive integer>` | 10 | Specifies the number of jobs that can be queued at a given time on a thread |
| `defaultKVStoreType` | `local | cohosted` | local | When set to "local", Splunk Enterprise uses a local KV store instance. |
| `delayShutdownOnBackupRestoreInProgress` | `<boolean>` | false | Whether or not splunkd should delay a shutdown if a KV Store backup or restore If set to "true", splunkd waits until either the running backup/restore operation |
| `percRAMForCache` | `<positive integer>` | 15 | The percentage of total system memory that KV store can use. Value can range from 5 to 50, inclusive. |
| `kvstoreUpgradeCheckInterval` | `<integer>` | 5 seconds | How often, in seconds, to check the status of the KV store version upgrade. |
| `kvstoreUpgradeOnStartupEnabled` | `<boolean>` | true | Controls whether the KV store version upgrade should be initiated |
| `kvstoreUpgradeOnStartupRetries` | `<positive int>` | 2 | The number of times to retry the KV store version upgrade. |
| `kvstoreUpgradeOnStartupDelay` | `<positive int>` | 60 seconds | How long, in seconds, to delay the startup of the KV store version upgrade |
| `defaultCidrPrefixLength` | `<positive int>[0-32]|disabled` | disabled | The default prefix length added to IPs without such prefix in CIDR match type When this setting is enabled it must have the inclusive range 0-32. Set this setting to "disabled" to explicitly turn it off. |
| `ocspValidation` | `<boolean>` | true | OCSP (Online Certificate Status Protocol) checks for certificate revocation. A value of "true" means OSCP validation is turned on, which eliminates the A value of "false" means OSCP validation is turned off. |

### `[indexer_discovery]`

Documented in Splunk docs section *Indexer Discovery configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pass4SymmKey` | `<string>` | — | Security key shared between manager node and forwarders. If specified here, the same value must also be specified on all forwarders Unencrypted passwords must not begin with "$1$", as this is used by |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' should be for a When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |
| `polling_rate` | `<integer>` | 10 | A value between 1 to 10. This value affects the forwarder polling The formula used to determine effective polling interval, |
| `indexerWeightByDiskCapacity` | `<boolean>` | false | A value of "true" means it instructs the forwarders to use weighted load The traffic sent to each indexer is based on the ratio of: |

### `[cascading_replication]`

Documented in Splunk docs section *Cascading Replication Configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pass4SymmKey` | `<string>` | None | Security key shared between indexers participating in cascading replication. The same value must be specified on all indexers participating in cascading Unencrypted passwords must not begin with "$1$", as this is used by Empty passwords will not be accepted. |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' should be for a When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |
| `max_replication_threads` | `<integer>` | auto | Maximum threads used for replicating metadata and payload to search peers. If set to "auto", the peer auto-tunes the number of threads it uses for If the peer has 3 or fewer CPUs, it allocates 2 threads. |
| `max_replication_jobs` | `<integer>` | 5 | Maximum jobs used for replicating metadata and payload to search peers. |
| `cascade_replication_plan_reap_interval` | `<interval>` | 1h | The interval at which the cascade replication plans are reaped. The interval can be specified as a string for minutes, seconds, hours, days. |
| `cascade_replication_plan_age` | `<interval>` | 8h | The age of the cascade replication plan when it gets reaped. The interval can be specified as a string for minutes, seconds, hours, or days. |
| `cascade_replication_plan_fanout` | `auto|<positive integer>` | auto | Number of receivers that each sender replicates to at a time. If set to auto, Splunk automatically calculates an optimal fanout, based on If set to an integer, the integer must be no greater than the number of cluster |
| `cascade_replication_plan_topology` | `size_balanced` | size_balanced | Topology used for building a cascading plan. When set to size_balanced, receivers are evenly distributed among senders. |
| `cascade_replication_plan_select_policy` | `random` | random | Policy for deciding which receivers the senders pick. When set to random, receivers are randomly picked. |

### `[node_auth]`

Documented in Splunk docs section *Node level authentication*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `signatureVersion` | `<comma-separated list>` | v1,v2 | A list of authentication protocol versions that nodes of a Splunk Each version of node authentication protocol implements an algorithm Nodes may only communicate using the same authentication protocol version. For example, if you set "signatureVersion = v1,v2" on one node, that For higher levels of security, set... |

### `[cachemanager]`

Documented in Splunk docs section *Cache Manager Configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `max_concurrent_downloads` | `<unsigned integer>` | 8 | The maximum number of buckets that can be downloaded simultaneously from |
| `max_concurrent_uploads` | `<unsigned integer>` | 8 | The maximum number of buckets that can be uploaded simultaneously to external |
| `eviction_policy` | `<string>` | lru | The name of the eviction policy to use. Current options: lru, clock, random, lrlt, noevict, lruk Do not change the value from the default unless instructed by |
| `enable_eviction_priorities` | `<boolean>` | true | When requesting buckets, search peers can give hints to the Cache Manager When enabled, the Cache Manager takes the hints into consideration; when |
| `eviction_padding` | `<positive integer>` | 5120 (~5GB) | Specifies the additional space, in megabytes, beyond 'minFreeSpace' that the If free space on a partition falls below |
| `max_cache_size` | `<positive integer>` | 0 | Specifies the maximum space, in megabytes, per partition, that the cache can A value of 0 means this setting is not used to control cache eviction. |
| `persist_pending_upload_from_external` | `<boolean>` | true | Currently not supported. This setting is related to a feature that is Specifies whether the information of the buckets that have been uploaded When set to true, this information is serialized to disk and Otherwise, the bucket is deemed to be not on remote storage and |
| `persistent_id_set_remove_min_sync_secs` | `<unsigned integer>` | 5 | Currently not supported. This setting is related to a feature that is Cache manager persists the set of objects that are This setting controls the interval from the last persist time that |
| `local_delete_summary_metadata_ttl` | `<unsigned integer>` | 0 | Currently not supported. This setting is related to a feature that is The local copy of a bucket needs to be synced with the copy in remote However in certain experimental modes of operation the delete journals Similarly, accelerated summaries in remote storage could be updated without This setting is meant for use... |
| `hotlist_recency_secs` | `<unsigned integer>` | 86400 (24 hours) | When a bucket is older than this value, it becomes eligible for eviction. For the purpose of determining recency, the age of a bucket is calculated by For example, if the current time (expressed in UTC epoch time) is 1567891234 and Ensure that the cache is of sufficient size to handle the value of this setting. |
| `hotlist_bloom_filter_recency_hours` | `<unsigned integer>` | 360 (15 days) | When a bucket's non-journal and non-tsidx files (such as bloomfilter files) The recency of a bloomfilter file is based on its bucket's recency and is This setting works in concert with 'hotlist_recency_secs' which is designed to be This setting can be overridden on a per-index basis in indexes.conf. |
| `evict_on_stable` | `<boolean>` | false | When the source peer completes upload of a bucket to remote storage, it When set to true, each target peer evicts its local copy, if any, upon such When set to false, each target peer continues to store its local copy, if any, |
| `max_file_exists_retry_count` | `<unsigned integer>` | 5 | The cache manager retries its check on whether the file exists on |
| `access_logging` | `<boolean>` | false | Enables/disables logging to the splunkd_access.log file for cachemanager requests. |
| `cache_usage_collection_interval_minutes` | `<positive integer>` | 10 | Currently not supported. This setting is related to a feature that is Interval at which cache usage information is reported to metrics.log. |
| `cache_usage_collection_time_bins` | `<comma-separated list>` | 1, 3, 7, 15, 30, 60, 90 | Currently not supported. This setting is related to a feature that is This setting is used when 'cache_usage_collection_interval_minutes' is This comma-separated list of integers, representing days, are boundaries For example, using the default "1, 3, 7, 14, 30, 60, 90", cache usage will |
| `cache_usage_collection_per_index` | `<boolean>` | false | Currently not supported. This setting is related to a feature that is Enables the reporting cache usage information by index. |
| `batch_registration` | `<boolean>` | true | This setting enables/disables batch registration of buckets upon indexer startup. If this setting is disabled, then when an indexer starts up, its cache manager The size of each batch of buckets is set with 'batch_registration_size'. |
| `batch_registration_size` | `<unsigned integer>` | 5000 | This setting specifies the size of each batch of buckets that are This setting is used when 'batch_registration' is enabled. Use the default value unless instructed otherwise by Splunk Support. |
| `cache_upload_backoff_sleep_secs` | `<unsigned_integer>` | 60 | This setting specifies the interval, in seconds, that the cache manager waits to A value of 0 causes the cache manager to continue retrying the upload without |
| `cache_upload_bucket_has_priority` | `<boolean>` | false | This setting when enabled will prioritize bucket upload over DMA and RA uploads. |
| `max_known_remote_absent_summaries` | `<unsigned_integer>` | 200000 (200K) | This setting specifies the maximum number of frozen (absent) summaries that the The list of frozen summaries helps the cache manager to avoid making calls to the When this value is reached, the cache manager deletes the oldest frozen |

### `[raft_statemachine]`

Documented in Splunk docs section *Raft Statemachine configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | true | Set to true to disable the raft statemachine. This feature requires search head clustering to be enabled. |
| `replicate_search_peers` | `<boolean>` | — | Add/remove search-server request is applied on all members Requires a healthy search head cluster with a captain. |

### `[watchdog]`

Documented in Splunk docs section *Raft Statemachine configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false. | Disables thread monitoring functionality. Any thread that has been blocked for more than 'responseTimeout' milliseconds |
| `responseTimeout` | `<decimal>` | 8 | Maximum time, in seconds, that a thread can take to respond before the The minimum value for 'responseTimeout' is 0.1. If you set 'responseTimeout' to lower than 0.1, the setting uses the minimum |
| `actions` | `<comma-separated list>` | empty list (no action executed) | A comma-separated list of actions that execute sequentially when a blocked The following actions can be included in the list: 'pstacks', 'script', and 'pstacks' enables call stack generation for a blocked thread. Call stack generation gives the user immediate information on the The watchdog saves each call stack in... |
| `actionsInterval` | `<decimal>` | 1 | The interval, in seconds, that the watchdog uses while tracing a blocked The minimum value for 'actionsInterval' is 0.01. If you set 'actionsInterval' to lower than 0.01, the setting uses the minimum |
| `pstacksEndpoint` | `<boolean>` | true | Enables pstacks endpoint at /services/server/pstacks Endpoint allows ad-hoc pstacks generation of all running threads. This setting is ignored if 'watchdog' is not enabled. |
| `usePreloadedPstacks` | `<boolean>` | true | Use preloaded wrapper to enable pstacks. |

### `[watchdog:<threadname>]`

Documented in Splunk docs section *Raft Statemachine configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false. | Disables thread monitoring for the specified thread. If the thread has been blocked for more than 'responseTimeout' milliseconds |
| `responseTimeout` | `<decimal>` | 8 | Maximum time, in seconds, that this thread can take to respond before the The minimum value for 'responseTimeout' is 0.1. If you set 'responseTimeout' to lower than 0.1, the setting uses the minimum |
| `actions` | `<comma-separated list>` | empty list (no action executed) | The actions that are to execute sequentially when this The following actions can be included in the list: 'pstacks', 'script', and 'pstacks' enables call stack generation for the blocked thread. Call stack generation gives the user immediate information on the The watchdog saves each call stack in a separate file... |
| `actionsInterval` | `<decimal>` | 1 | The interval, in seconds, that the watchdog uses while tracing this blocked The minimum value for 'actionsInterval' is 0.01. If you set 'actionsInterval' to lower than 0.01, the setting uses the minimum |

### `[watchdogaction:pstacks]`

Documented in Splunk docs section *Raft Statemachine configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dumpAllThreads` | `<boolean>` | true | Determines whether or not the watchdog saves stacks of all monitored threads If you set 'dumpAllThreads' to true, the watchdog generates call stacks for |
| `stacksBufferSizeOrder` | `<unsigned integer>` | 14 | The maximum number of call stacks an internal queue can hold. The watchdog uses the internal queue to temporarily store a call stack between Increase the value of this setting if you see gaps in stack files due to high This number must be in the range 1 to 16. |
| `maxStacksPerBlock` | `<unsigned integer>` | 60 | Maximum number of stacks that the watchdog can generate for a blocked thread. If you set 'dumpAllThreads' to true, the watchdog generates call stacks for If the blocked thread starts responding again, the count of stacks that the If another thread blockage occurs, the watchdog begins generating stacks When set to... |
| `batchStacksThreshold` | `<unsigned integer>|auto` | auto | The timeout, in milliseconds, after which the watchdog generates a new call This setting controls the batching up of call stacks when saving them to files, When set to 0, batching is disabled. When set to 'auto', Splunk Enterprise determines the best frequency to create |

### `[watchdogaction:script]`

Documented in Splunk docs section *Raft Statemachine configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `path` | `<string>` | (none) | The path to the script to execute when the watchdog triggers the action. If you do not set 'path', the watchdog ignores the action. |
| `useShell` | `<boolean>` | false | A value of "true" means the script runs from the OS shell A value of "false" means the program will be run directly without attempting to |
| `forceStop` | `<boolean>` | false | Whether or not the watchdog forcefully stops an active watchdog action script Use this setting when, for example, the watchdog script has internal logic |
| `forceStopOnShutdown` | `<boolean>` | true | If you set this setting to "true", the watchdog forcefully stops active |

### `[parallelreduce]`

Documented in Splunk docs section *Parallel Reduce Configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pass4SymmKey` | `<string>` | — | DEPRECATED. The setting is no longer required. |
| `pass4SymmKey_minLength` | `<integer>` | 12 | The minimum length, in characters, that a 'pass4SymmKey' should be for a When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what |

### `[search_artifact_remote_storage]`

Documented in Splunk docs section *Remote Storage of Search Artifacts Configuration*. Documented in Splunk docs section *S3 specific settings*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | true | Currently not supported. This setting is related to a feature that is Optional. |
| `path` | `<path on server>` | (none) | The path setting points to the remote storage location where The format for this setting is: <scheme>://<remote-location-specifier> The "scheme" identifies a supported external storage system type. The "remote-location-specifier" is an external system-specific string for These external systems are supported: Object... |
| `upload_archive_format` | `[none|tar.lz4]` | — | Creates a tarball so that the entire artifact can be stored as a single object This can reduce time to upload and artifact when the remote storage has a high Default : none |
| `remote.s3.header.<http-method-name>.<header-field-name>` | `<String>` | — | Enable server-specific features, such as reduced redundancy, encryption, The <http-method-name> can be any valid HTTP method. For example, GET, Optional. |
| `remote.s3.access_key` | `<String>` | (none) | Specifies the access key to use when authenticating with the remote storage If not specified, the indexer looks for these environment variables: If the environment variables are not set and the indexer is running on EC2, Optional. |
| `remote.s3.secret_key` | `<String>` | (none) | Specifies the secret key to use when authenticating with the remote storage If not specified, the indexer looks for these environment variables: If the environment variables are not set and the indexer is running on EC2, Optional. |
| `remote.s3.list_objects_version` | `v1|v2` | v1 | The AWS S3 Get Bucket (List Objects) Version to use. See AWS S3 documentation "GET Bucket (List Objects) Version 2" for details. |
| `remote.s3.signature_version` | `v2|v4` | v4 | The signature version to use when authenticating with the remote storage For 'sse-kms' server-side encryption scheme, you must use Optional. |
| `remote.s3.auth_region` | `<String>` | (none) | The authentication region to use for signing requests when interacting with Used with v4 signatures only. If unset and the endpoint (either automatically constructed or explicitly If unset and an authentication region cannot be determined, the request Optional. |
| `remote.s3.use_delimiter` | `<boolean>` | true | Specifies whether a delimiter (currently "guidSplunk") should be A delimiter groups objects that have the same delimiter value Optional. |
| `remote.s3.supports_versioning` | `<boolean>` | true | Specifies whether the remote storage supports versioning. Versioning is a means of keeping multiple variants of an object This setting determines how splunkd removes data from remote storage. |
| `remote.s3.endpoint` | `<URL>` | — | The URL of the remote storage system supporting the S3 API. The scheme, http or https, can be used to enable or disable SSL connectivity If not specified and the indexer is running on EC2, the endpoint is Optional. |
| `remote.s3.multipart_download.part_size` | `<unsigned integer>` | 134217728 (128 MB) | Sets the download size of parts during a multipart download. This setting uses HTTP/1.1 Range Requests (RFC 7233) to improve throughput A value of 0 disables downloading in multiple parts, i.e., files are always Do not change this value unless that value has been proven to improve Minimum value: 5242880 (5 MB)... |
| `remote.s3.multipart_upload.part_size` | `<unsigned integer>` | 134217728 (128 MB) | Sets the upload size of parts during a multipart upload. Minimum value: 5242880 (5 MB) Optional. |
| `remote.s3.multipart_max_connections` | `<unsigned integer>` | 8 | Specifies the maximum number of HTTP connections to have in progress for A value of 0 means unlimited. |
| `remote.s3.retry_policy` | `max_count` | max_count | Sets the retry policy to use for remote file operations. A retry policy specifies whether and how to retry file operations that fail Retry policies: Optional. |
| `remote.s3.max_count.max_retries_per_part` | `<unsigned integer>` | 1 | When the remote.s3.retry_policy setting is max_count, sets the maximum number The count is maintained separately for each file part in a multipart download Optional. |
| `remote.s3.max_count.max_retries_in_total` | `<unsigned integer>` | 1 | When the remote.s3.retry_policy setting is max_count, sets the maximum number The count is maintained for each file as a whole. Optional. |
| `remote.s3.timeout.connect` | `<unsigned integer>` | 5000 (5 seconds) | Set the connection timeout, in milliseconds, to use when interacting with Optional. |
| `remote.s3.timeout.read` | `<unsigned integer>` | 60000 (60 seconds) | Set the read timeout, in milliseconds, to use when interacting with S3 Optional. |
| `remote.s3.timeout.write` | `<unsigned integer>` | 60000 (60 seconds) | Set the write timeout, in milliseconds, to use when interacting with S3 Optional. |
| `remote.s3.sslVerifyServerCert` | `<boolean>` | false | If this is set to true, Splunk verifies certificate presented by S3 Optional. |
| `remote.s3.sslVersions` | `<comma-separated list>` | tls1.2 | The list of TLS versions to use to connect to 'remote.s3.endpoint'. The versions available are "tls1.0", "tls1.1", and "tls1.2". |
| `remote.s3.sslCommonNameToCheck` | `<commonName1>, <commonName2>, ..` | (none) | If this value is set, and 'remote.s3.sslVerifyServerCert' is set to |
| `remote.s3.sslAltNameToCheck` | `<alternateName1>, <alternateName2>, ..` | (none) | If this value is set, and 'remote.s3.sslVerifyServerCert' is set to true, |
| `remote.s3.sslRootCAPath` | `<path>` | [sslConfig/caCertFile] in the server.conf file | Full path to the Certificate Authority (CA) certificate PEM format file Optional. |
| `remote.s3.cipherSuite` | `<cipher suite string>` | TLSv1+HIGH:TLSv1.2+HIGH:@STRENGTH | If set, uses the specified cipher string for the SSL connection. If not set, uses the default cipher string. |
| `remote.s3.ecdhCurves` | `<comma separated list>` | (none) | ECDH curves to use for ECDH key negotiation. The curves should be specified in the order of preference. |
| `remote.s3.dhFile` | `<path>` | (none) | PEM format Diffie-Hellman parameter file name. DH group size should be no less than 2048bits. |
| `remote.s3.encryption` | `sse-s3 | sse-kms | sse-c | none` | none | Specifies the scheme to use for Server-side Encryption (SSE) for sse-s3: Check http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingServerSideEncryption.html sse-kms: Check http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingKMSEncryption.html sse-c: Check... |
| `remote.s3.kms.key_id` | `<string>` | (none) | Required if remote.s3.encryption = sse-c \| sse-kms Specifies the identifier for Customer Master Key (CMK) on KMS. It can be the Examples: |
| `remote.s3.kms.access_key` | `<string>` | (none) | Similar to 'remote.s3.access_key'. If not specified, KMS access uses 'remote.s3.access_key'. |
| `remote.s3.kms.secret_key` | `<string>` | (none) | Optional. Similar to 'remote.s3.secret_key'. |
| `remote.s3.kms.auth_region` | `<string>` | (none) | Required if 'remote.s3.auth_region' is not set and Splunk can not Similar to 'remote.s3.auth_region'. If not specified, KMS access uses 'remote.s3.auth_region'. |
| `remote.s3.kms.max_concurrent_requests` | `<unsigned integer>` | 10 | Limits maximum concurrent requests to KMS from this Splunk instance. Optional. |
| `remote.s3.kms.<ssl_settings>` | `<...>` | — | Check the descriptions of the SSL settings for remote.s3.<ssl_settings> Valid ssl_settings are sslVerifyServerCert, sslVersions, sslRootCAPath, All of these are optional and fall back to same defaults as |

### `[s3_client_threads]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pool_size` | `<positive integer> | per_client` | 1 | Thread pool size for asynchronous S3 client transactions. If a positive integer value is specified, a single thread pool is shared If the "per_client" value is specified, the thread pool size for each |
| `enable_for_sync_transactions` | `<boolean>` | false | Whether or not the thread pool for synchronous S3 client transactions is Depending on the context, this setting can help improve search performance A value of "true" means that the thread pool will be used for synchronous S3 A value of "false" means that the thread pool won't be used for synchronous S3 |

### `[s3_client_threads:<component>]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pool_size` | `<positive integer>` | — | Thread pool size for asynchronous S3 client transactions This setting takes effect only if the 'pool_size' setting in the |

### `[hot_bucket_streaming]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `slices_list_executor_workers` | `<unsigned integer>` | 4 | Currently not supported. This setting is related to a feature that is Number of workers that do list operations to discover slices during bucket recovery. |
| `slices_download_executor_workers` | `<unsigned integer>` | 10 | Currently not supported. This setting is related to a feature that is Number of workers that download slices during bucket recovery. |
| `slices_build_executor_workers` | `<unsigned integer>` | 4 | Currently not supported. This setting is related to a feature that is Maximum number of parallel bucket rebuilds during bucket recovery. |
| `slices_removal_executor_workers` | `<unsigned integer>` | 2 | Currently not supported. This setting is related to a feature that is Number of workers that remove slices after a bucket rolls to warm or is rebuilt. |
| `slices_upload_executor_workers` | `<unsigned integer>` | 10 | Currently not supported. This setting is related to a feature that is Number of workers that upload slices from hot buckets. |
| `slices_upload_executor_capacity` | `<unsigned integer>` | 10 | Currently not supported. This setting is related to a feature that is Maximum number of queued slices to be uploaded. |
| `slices_upload_send_interval` | `<interval><unit>` | 5s | Currently not supported. This setting is related to a feature that is Periodic send interval, in seconds, for the slices to be uploaded. |
| `slices_upload_size_threshold` | `<unsigned integer>[B|KB|MB]` | 1MB | Currently not supported. This setting is related to a feature that is Slice size threshold. |
| `slices_upload_retry_pending` | `<unsigned integer>` | 25 | Currently not supported. This setting is related to a feature that is Maximum number of upload slices that could be pending retry due to failure to enqueue Must not be greater than 1000 |

### `[federated_search]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Set this flag to 'false' to enable the data federation functionality on this |
| `transparent_mode` | `<boolean>` | true | A setting of 'true' means federated search transparent mode is enabled on this |
| `whole_search_execution_optimization` | `<boolean>` | false | A setting of 'true' means federated searches that involve only a single When set to 'true', this setting can improve federated search performance This setting is dynamically set to 'true' for federated searches involving A setting of 'false' means that federated searches that involve only a single |
| `sendsDeltaBundle` | `<boolean>` | true | Set this flag to 'false' on a federated search head to disable it from sending Set this flag to 'false' on a federated remote provider to disable it from sending delta knowledge object bundles |
| `receivesDeltaBundle` | `<boolean>` | true | Specifies whether federated providers can receive delta knowledge object When set to 'false' for a federated provider, the federated provider can't The federated provider continues to receive full knowledge bundles from |
| `syncProxyBundleToClusterMembers` | `<boolean>` | true | If you set up a load balancer in front of a search head cluster as a A setting of 'false' means that the federated provider will not sync the Change this setting from its default only when instructed to do so by Splunk |

### `[distributed_leases]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sslVerifyServerCert` | `<boolean>` | false | See the description of 'sslVerifyServerCert' under the [sslConfig] stanza |
| `sslVerifyServerName` | `<boolean>` | false | See the description of 'sslVerifyServerName' under the [sslConfig] stanza |
| `disabled` | `<boolean>` | true | Determines whether or not the distributed lease manager is enabled. |
| `provider` | `[AWS|KVstore]` | AWS | The type of provider that the Distributed Leases feature for modular The feature can use either the Amazon Web Services (AWS) or app key A value of "AWS" means Distributed Leases uses a DynamoDB table to achieve consensus A value of "KVstore" means Distributed Leases uses a KV Store collection Do not change this... |

### `[search_state]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `alert_store` | `local` | local | Specifies location of alert state store |
| `suppression_store` | `local` | local | Specifies location of suppression state store |

### `[manager_pages]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sanitize_uri_param` | `<boolean>` | true | Determines whether the URI parameter received in the manager pages will be A value of 'true' means the URI parameter will be sanitized. A value of 'false' means the URI parameter will not be sanitized. |

### `[teleport_supervisor]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Determines whether or not splunkd launches the teleport supervisor process, A value of "true" means splunkd does not launch the teleport supervisor process. A value of "false" means splunkd launches the teleport supervisor process. |
| `enable_splunk_spotlight` | `<boolean>` | true | Whether or not to start the Splunk spotlight Open Telemetry (OTel) collector A value of "true" means the Splunk spotlight OTel collector is turned A value of "false" means the Splunk spotlight OTel collector is turned off |
| `enable_supervisor_admin_api` | `<boolean>` | true | Whether or not the supervisor enables the admin API endpoints, You must restart Splunk software after you make changes to this setting. A value of "true" means the admin API endpoints are enabled by the supervisor. |
| `sslVerifyServerCert` | `<boolean>` | Not set | Whether or not the Splunk supervisor and the sidecar processes See the 'sslVerifyServerCert' setting under the No value for this setting means that the supervisor and its |

### `[spotlight]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_otlp_traces` | `<boolean>` | false | Determines whether or not OpenTelemetry (OTel) trace A value of "false" means that OTel trace collection is disabled. A value of "true" means that OTel trace collection is enabled. |
| `enable_otlp_metrics` | `<boolean>` | false | Whether or not OTel metrics collection is activated for the Spotlight sidecar. A value of "false" means that Splunk software deactivates OTel metrics A value of "true" means that Splunk software activates OTel metrics You must restart the Splunk software after you make changes to this setting. |
| `enable_otlp_metrics_export` | `<boolean>` | true | Whether or not OTel metrics are exported to the Spotlight sidecar. This setting takes effect only if 'enable_otlp_metrics' has a value of "true". |
| `traces_head_sampling_rate` | `<decimal>` | 0.0 | Specifies the head sampling rate for trace data collected by the Spotlight sidecar. A value of 1.0 means that all traces are sampled. |

### `[spotlight:splunkd]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_otlp_traces` | `<boolean>` | false | Changes whether OpenTelemetry (OTel) trace collection is disabled or enabled in splunkd for the A value of "false" means that OTel trace collection in splunkd is disabled. A value of "true" means that OTel trace collection in splunkd is enabled. |
| `enable_otlp_metrics` | `<boolean>` | false | Whether or not OTel metrics collection is activated in splunkd for the A value of "false" means that OTel metrics collection in splunkd is A value of "true" means that OTel metrics collection in splunkd is activated. You must restart the Splunk software after you make changes to this setting. |
| `enable_otlp_metrics_export` | `<boolean>` | true | Determines whether or not OTel metrics are exported This setting takes effect only if 'enable_otlp_metrics' has a value of "true". A value of "false" means that OTel metrics are not exported to the Spotlight sidecar. |
| `traces_head_sampling_rate` | `<decimal>` | 0.0 | Changes the head sampling rate for trace data collected by the Spotlight sidecar in splunkd by A value of 1.0 means that all traces from splunkd are sampled. A value of 0.0 means that no traces from splunkd are sampled. |

### `[localProxy]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `allocated_max_threads_percentage` | `<integer>` | 20 | Specifies the percentage of maxThreads that can be allocated to The maximum accepted value for this setting is "90". The minimum accepted value for this setting is "1". |
| `response_timeout_ms` | `<decimal>` | 600000 (10 minutes) | The maximum time, in milliseconds, to wait for the proxy destination to complete a Maximum accepted value for this setting is "3600000" milliseconds (1 hour). Minimum accepted value for this setting is "100" milliseconds. |

### `[localWebSocketProxy]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Determines whether splunkd is able to proxy WebSocket requests to a A value of "false" means splunkd is able to proxy WebSocket requests A value of "true" means splunkd is not able to proxy WebSocket requests |

### `[spl2]`

Documented in Splunk docs section *S3 Client Thread Pools*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `run_as_owner_enabled` | `<boolean>` | false | Specifies whether or not a user can run searches as if the user was the owner of the searches when permitted. A value of "true" means run-as-owner searches are allowed. |

### `[version_control]`

Documented in Splunk docs section *Version Control configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Whether or not the Version Control feature is turned on or off. The Version Control feature lets you track and manage A value of "true" means that the Version Control feature is turned off. |
| `repoDir` | `<path>` | $SPLUNK_HOME/var/vcs | The full path to the directory where the Version Control metadata is stored. |

### `[version_control:compression]`

Documented in Splunk docs section *Version Control configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | true | Whether or not the automated compression job for the Version Control repository is turned on. The compression job reduces the on-disk footprint of the Version Control metadata by A value of "true" means that compression is turned off. |
| `interval` | `<interval><unit>` | 1d (1 day) | How often the Splunk platform runs the Version Control compression job. Use the standard Splunk interval syntax for seconds, minutes, hours, days, etc. |

### `[postgres]`

Documented in Splunk docs section *PostgreSQL configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Determines whether or not PostgresSQL is disabled. |
| `enable_clustered_mode` | `<boolean>` | — | See Splunk documentation. |

### `[ipc_broker]`

Documented in Splunk docs section *Inter-process Communication (IPC) Broker configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `port` | `<integer>` | 8194 | The TCP/IP network port that the IPC broker process uses to serve incoming requests. Required. |

### `[cluster_state_server]`

Documented in Splunk docs section *Cluster state server configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Whether or not the cluster state server is turned off. A value of "true" means the state server is turned off. |
| `http_port` | `<integer>` | 8600 | The TCP/IP network port that the cluster state server helper This setting is optional. The lowest valid value is 1025 and the highest is 65535. |
| `helper_process_read_timeout_secs` | `<unsigned integer>` | 5 (five seconds) | The maximum time, in seconds, that splunkd waits for the cluster state |
| `etcd_backup_interval` | `<unsigned integer>` | 5 | The interval, in minutes, at which the cluster state server periodically Reduce the value if you prioritize minimization of data loss during restore. Increase the value if reducing backup overhead is a higher priority. |
| `max_peerdown_time` | `<unsigned integer>` | 30 | The maximum wait time, in minutes, for a downed search head to rejoin Reduce the value if you want fast reconfiguration when a node is down. Increase the value if nodes might be slow to return and you want to |

### `[data_management]`

Documented in Splunk docs section *Data Management configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `edge_processor_enabled` | `<boolean>` | false | Specifies whether or not the Edge Processor solution is enabled or disabled. The Edge Processor solution is disabled by default. |
| `otel_collector_management_enabled` | `<boolean>` | false | Specifies whether or not the management of If you modify this setting, you must restart Splunk software. |

### `[opamp_binary_edge]`

Documented in Splunk docs section *Open Agent Management Protocol (OpAMP) configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `name` | `<string>` | not set | The name of the opamp_binary_edge file to be installed onto a remote host. This file is the edge processor binary. |
| `url` | `<string>` | not set | The URL of the opamp_binary_edge file to be installed onto a remote host. Do not include the host or protocol in the URL. |
| `signature` | `<string>` | not set | The base64-encoded PGP signature of the opamp_binary_edge file Encode the signature as a single line, base64-encoded string. |
| `version` | `<positive integer>.<positive integer>.<positive integer>` | not set | The version of the opamp_binary_edge file to be installed onto a remote host. The version should be in the format <major>.<minor>.<patch> |

### `[opamp_binary_splunk_edge]`

Documented in Splunk docs section *Open Agent Management Protocol (OpAMP) configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `name` | `<string>` | not set | The name of the opamp_binary_splunk_edge to be installed onto a remote host. This file is a splunk supervisor which communicates with OpAMP server, |
| `url` | `<string>` | not set | The URL of the opamp_binary_splunk_edge file to be installed onto a remote host. Do not include the host or protocol in the URL. |
| `signature` | `<string>` | not set | The base64-encoded PGP signature of the opamp_binary_splunk_edge file Encode the signature as a single line, base64-encoded string. |
| `version` | `<positive integer>.<positive integer>.<positive integer>` | not set | The version of the opamp_binary_splunk_edge file to be installed onto a remote host. The version should be in the format <major>.<minor>.<patch> |

### `[data_orchestrator]`

Documented in Splunk docs section *Data Orchestrator configuration*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | false | Whether or not the data orchestrator component is turned on. This component is what lets SPL2 function. |

### `[heap_profiler]`

Documented in Splunk docs section *Heap Profiler*.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | true | Whether or not the splunkd server periodically writes files with diagnostic This functionality is available only on Linux platform. If set to "false", Splunk platform generates files with the filename prefix If set to "true", Splunk platform does not generate these files. |
| `period` | `<interval>` | 1m | Interval at which the splunkd server writes files with the heap diagnostic Use <integer><unit> to specify a duration. If <integer> is not specified, Specify one of the following units: s, sec, second, secs, seconds, m, min, For example: 60s = 60 seconds, 5m = 5 minutes. |
| `output_prefix` | `<string>` | /tmp/heap_data | Output prefix for the files with heap diagnostic information. Splunk platform names the generated files according to the following pattern: For example: /tmp/heap_data.1234.1m1.heap If the directory to store these files is missing, Splunk platform creates it |
| `min_free_space` | `<unsigned integer>[MB|GB|TB]` | 256MB | Determines the minimum free space for the heap dump generation. If the filesystem free space is lower than the specified threshold, Splunk You must specify both an integer and a unit. |
