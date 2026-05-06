# inputs.conf

> Version 10.2.0
>

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Input |
| Restart required | Restart required for most settings |
| Related files | props.conf, outputs.conf, server.conf |

## Stanzas and settings


### GLOBAL SETTINGS

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| host | `<string>` | `"$decideOnStartup"` | Sets the host key/field to a static value for this input stanza. The input uses this field during parsing and indexing. It also uses this As a convenience, the input prepends the chosen string with 'host::'. When set to '$decideOnStartup', sets the field to the hostname of executing If you run multiple instances of the software on the same machine (hardware Do not put the <string> value in quotes. Use host=foo, not host="foo". When 'host' is set to "$decideOnStartup", you can further control how splunkd For example, if you want splunkd to use the fully qualified domain More information on h... |
| run_only_one | `<boolean>` | `true` | Determines if a scripted or modular inputs runs on one search head Currently not supported. This setting is related to a feature that is |
| index | `<string>` | `main (or whatever you have set as your default index)` | Sets the index to store events from this input. Primarily used to specify the index to store events that come in through |
| source | `<string>` | `the input file path` | Sets the source key/field for events from this input. Detail: Sets the source key initial value. The key is used during As a convenience, the chosen string is prepended with 'source::'. Avoid overriding the source key. The input layer provides a more accurate Do not put the <string> value in quotes: Use source=foo, |
| sourcetype | `<string>` | — | Sets the sourcetype key/field for events from this input. Explicitly declares the source type for this input instead of letting Sets the sourcetype key initial value. The key is used during As a convenience, the chosen string is prepended with 'sourcetype::'. Do not put the <string> value in quotes: Use sourcetype=foo, If not set, the indexer analyzes the data and chooses a source type. No default. |
| queue | `[parsingQueue\|indexQueue]` | `parsingQueue` | Sets the queue where the input processor deposits the events it reads. Set to "parsingQueue" to apply the props.conf file and other parsing rules to Set to "indexQueue" to send your data directly into the index. |
| queue | `<value>` | — | — |
| _raw | `<value>` | — | — |
| _meta | `<value>` | — | — |
| _time | `<value>` | — | Inputs have special support for mapping host, source, sourcetype, and index Defaulting these values is not recommended, and is Defaulting these keys in most cases overrides the default behavior of Values defaulted here, as with all values provided by inputs, can be |
| _TCP_ROUTING | `<comma-separated list>` | `The groups specified in 'defaultGroup' in [tcpout] stanza in` | A comma-separated list of tcpout group names. This setting lets you selectively forward data to one or more specific indexers. Specify the tcpout group that the forwarder uses when forwarding the data. To forward data to all tcpout group names that have been defined in To forward data from the "_internal" index, you must explicitly set |
| _SYSLOG_ROUTING | `<comma-separated list>` | `The groups specified in 'defaultGroup' in the [syslog] stanza in` | A comma-separated list of syslog group names. Use this setting to selectively forward the data to specific destinations as Specify the syslog group to use when forwarding the data. The destination host must be configured in outputs.conf, using This setting does not work on a universal forwarder. |
| _INDEX_AND_FORWARD_ROUTING | `<string>` | `not set` | If set for any input stanza, causes all data coming from that input When 'selectiveIndexing' is in use on a forwarder: Data without this label will not be indexed by that forwarder. Data with this label will be indexed in addition to any forwarding. This setting does not actually cause data to be forwarded or not forwarded in Only has effect if you use the 'selectiveIndexing' feature in outputs.conf. |

### MONITOR:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| host_regex | `<regular expression>` | — | If specified, <regular expression> extracts host from the path to the file Detail: This feature examines the source key; if source is set Specifically, the first group of the regular expression (regex) is used If the regex fails to match, the input uses the default 'host' setting. If 'host_regex' and 'host_segment' are both set, the input ignores 'host_regex'. No default. |
| host_segment | `<integer>` | — | If set to N, the Splunk platform sets the Nth "/"-separated segment of the path For example, if you set "host_segment = 3" and the path is If the value is not an integer or is less than 1, the default 'host' On Windows machines, the drive letter and colon before the backslash *does not* For example, if you set "host_segment = 3" and the monitor path is No default. |
| whitelist | `<regular expression>` | — | If set, files from this input are monitored only if their path matches the Takes precedence over the deprecated '_whitelist' setting, which functions No default. |
| blacklist | `<regular expression>` | — | If set, files from this input are NOT monitored if their path matches the Takes precedence over the deprecated '_blacklist' setting, which functions If a file matches the regexes in both the deny list and allow list settings, No default. |
| crcSalt | `<string>` | `empty string` | Use this setting to force the input to consume files that have matching CRCs, By default, the input only performs CRC checks against the first 256 If set, <string> is added to the CRC. If set to the literal string "<SOURCE>" (including the angle brackets), the Be cautious about using this setting with rolling log files; it could lead In many situations, 'initCrcLength' can be used to achieve the same goals. |
| initCrcLength | `<integer>` | `256 (bytes)` | How much of a file, in bytes, that the input reads before trying to You might want to adjust this if you have many files with common Cannot be less than 256 or more than 1048576. CAUTION: Improper use of this setting causes data to be re-indexed. You |
| ignoreOlderThan | `<non-negative integer>[s\|m\|h\|d]` | — | The monitor input compares the modification time on files it encounters Files on the ignore list are not checked again until the Splunk Reconfigurations occur when changes are made to monitor or batch Use 'ignoreOlderThan' to increase file monitoring performance when Do NOT select a time that files you want to read could reach in Suggested value: 14d, which means 2 weeks For example, a time window in significant numbers of days or small If you need a time window in small numbers of days or hours, NOTE: Most modern Windows file access APIs do not update file Value must be: <number><unit>. Fo... |
| followTail | `<boolean>` | `0` | Whether or not the input should skip past current data in a monitored file This setting lets you skip over data in files, and immediately begin indexing If you set to "1", monitoring starts at the end of the file (like nix 'tail -f'). The input does not read any data that exists in If you set to "0", monitoring starts at the beginning of the file. This is an advanced setting. Contact Splunk Support before using it. Best practice for using this setting: Enable this setting and start the Splunk instance. Wait enough time for the input to identify the related files. Disable the setting and res... |
| alwaysOpenFile | `<boolean>` | `0` | Whether or not an input opens a file to check whether it has already Only useful for files that do not update modification time or size. Only known to be needed when monitoring files on Windows, mostly for Configuring this setting to "1" can increase load and slow indexing. Use it |
| time_before_close | `<integer>` | `3` | The amount of time, in seconds, that the file monitor must wait for Tells the input not to close files that have been updated in the |
| multiline_event_extra_waittime | `<boolean>` | `false` | Whether or not the file monitor input delays sending an event delimiter when By default, the file monitor sends an event delimiter when: It reaches EOF of a file it monitors and The last character it reads is a newline. In some cases, it takes time for all lines of a multiple-line event to Set to "true" to delay sending an event delimiter until the time that the |
| recursive | `<boolean>` | `true` | Whether or not the input monitors subdirectories that it finds within a A value of "true" means the input monitors sub-directories. A value of "false" means the input does not monitor sub-directories. |
| followSymlink | `<boolean>` | `true` | Whether or not the input follows any symbolic links within a monitored directory. A value of "true" means the input follows symbolic links Additionally, any allow lists or deny lists that the input stanza defines A value of "false" means the input ignores symbolic links |
| _whitelist | `...` | — | DEPRECATED. This setting is valid unless the 'whitelist' setting also exists. |
| _blacklist | `...` | — | DEPRECATED. This setting is valid unless the 'blacklist' setting also exists. |

### BATCH ("Upload a file" in Splunk Web):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| move_policy | `sinkhole` | — | This setting is required. You *must* include "move_policy = sinkhole" This setting causes the input to load the file destructively. CAUTION: Do not use the 'batch' input type for files you do not want to The 'move_policy' setting exists for historical reasons, but remains as a |
| host_regex | `see the definition in the MONITOR section.` | — | — |
| host_segment | `see the definition in the MONITOR section.` | — | — |
| crcSalt | `see the definition in the MONITOR section.` | — | — |
| time_before_close | `see the definition in the MONITOR section.` | — | — |
| log_on_completion | `<boolean>` | `true` | Whether or not the Splunk platform writes an entry into the When set to "false", this setting prevents the Splunk platform from |
| followSymlink | `<boolean>` | — | Works similarly to the same setting for monitor, but does not delete files |
| host_regex | `<regular expression>` | — | — |
| host_segment | `<integer>` | — | — |
| crcSalt | `<string>` | — | — |
| recursive | `<boolean>` | — | — |
| whitelist | `<regular expression>` | — | — |
| blacklist | `<regular expression>` | — | — |
| initCrcLength | `<integer>` | — | — |
| time_before_close | `<integer>` | — | — |

### TCP: Transport Control Protocol (TCP) network inputs

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| connection_host | `[ip\|dns\|none]` | `dns` | How the network input sets the host field for the events it generates. A value of "ip" sets the host to the IP address of the system sending the data. A value of "dns" sets the host to the reverse DNS entry for the IP address of A value of "none" leaves the host as specified in inputs.conf, typically the |
| queueSize | `<integer>[KB\|MB\|GB]` | `500KB` | The maximum size of the in-memory input queue. Configure this setting only if you have also configured 'persistentQueueSize'. In the case where none of the [tcp://] stanzas has an explicit 'queueSize' set, This logic applies to all inputs that use in-memory input queues. If you configure multiple [tcp://] stanzas, and do not want to set |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | `0 (no persistent queue)` | The maximum size of the persistent queue file. Persistent queues can help prevent loss of transient data. For information on If you set this to a value other than 0, then 'persistentQueueSize' must |
| requireHeader | `<boolean>` | `false` | Whether or not to require a header be present at the beginning of every This header can be used to override indexing settings. |
| listenOnIPv6 | `[no\|yes\|only]` | `The setting in the [general] stanza of the server.conf file` | Whether or not the input listens on IPv4, IPv6, or both protocols. Set to "yes" to listen on both IPv4 and IPv6 protocols. Set to "only" to listen on only the IPv6 protocol. |
| acceptFrom | `<comma- or space-separated list>` | `* (accept from anywhere)` | A list of TCP networks or addresses to accept connections from. Use commas or spaces to separate multiple network rules. The accepted formats for network and address rules are: A prefix of '!' for an entry sets a rule to deny and reject connections. The ACL |
| rawTcpDoneTimeout | `<seconds>` | `10` | The amount of time, in seconds, that a network connection can remain idle If a connection over this port remains idle for more than |
| connection_host | `[ip\|dns\|none]` | — | — |
| queueSize | `<integer>[KB\|MB\|GB]` | — | — |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | — | — |
| requireHeader | `<boolean>` | — | — |
| listenOnIPv6 | `[no\|yes\|only]` | — | — |
| acceptFrom | `<comma- or space-separated list>` | — | — |
| rawTcpDoneTimeout | `<integer>` | — | — |

### Data distribution:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| route | `[has_key\|absent_key:<key>:<queueName>;...]` | — | Settings for the light forwarder. The receiver sets these parameters automatically -- you do not need to set The property route is composed of rules delimited by ';' (semicolon). The receiver checks each incoming data payload through the cooked TCP port If a matching rule is found, the receiver sends the payload to the specified If no matching rule is found, the receiver sends the payload to the default |
| enableS2SHeartbeat | `<boolean>` | `true (heartbeat monitoring enabled)` | Specifies the global keepalive setting for all splunktcp ports. This option is used to detect forwarders which might have become unavailable The receiver monitors each connection for presence of a heartbeat, and if the |
| s2sHeartbeatTimeout | `<integer>` | `600 (10 minutes)` | The amount of time, in seconds, that a receiver waits for heartbeats from The receiver closes a forwarder connection if it does not receive |
| inputShutdownTimeout | `<integer>` | — | The amount of time, in seconds, that a receiver waits before shutting down Used during shutdown to minimize data loss when forwarders are connected to a During shutdown, the TCP input processor waits for 'inputShutdownTimeout' If all connections close before the end of the timeout period, |
| stopAcceptorAfterQBlock | `<integer>` | `300 (5 minutes)` | The amount of time, in seconds, to wait before closing the splunktcp port. If the receiver is unable to insert received data into the configured queue This action prevents forwarders from establishing new connections to this Forwarders that have an existing connection will notice the port is closed After the queue unblocks, and the TCP input can continue processing data, the This setting should not be adjusted lightly as extreme values can interact NOTE: If there are multiple tcp/splunktcp listener ports configured, |
| listenOnIPv6 | `no\|yes\|only` | — | See the description for this setting in the [tcp://<remote server>:<port>] |
| acceptFrom | `<comma- or space-separated list>` | — | See the description for this setting in the [tcp://<remote server>:<port>] |
| negotiateProtocolLevel | `<unsigned integer>` | `0` | If set, lets forwarders that connect to this receiver (or specific port) If set to a value that is lower than the default, denies the use |
| negotiateNewProtocol | `<boolean>` | `true` | DEPRECATED. Use the 'negotiateProtocolLevel' setting instead. Controls the default configuration of the 'negotiateProtocolLevel' setting. |
| concurrentChannelLimit | `<unsigned integer>` | `300` | The number of unique channel codes that are available for forwarders to Each forwarder that connects to this indexer may use up to In other words, each forwarder may have up to 'concurrentChannelLimit' The receiver closes a forwarder connection if a forwarder attempts to This setting only applies when the new forwarder protocol is in use. |
| logRetireOldS2S | `<boolean>` | `true` | Whether or not the Splunk platform logs the usage of old versions of Splunk-to-Splunk (S2S) The old S2S protocol retirement logs provide visibility into customers' usage A value of "true" means that splunkd generates warning logs for the old S2S protocol See the 'logRetireOldS2SRepeatFrequency' setting for additional constraints on |
| logRetireOldS2SMaxCache | `<unsigned integer>` | `10000` | The size of the cache for tracking forwarders that use old S2S protocols. The cache keeps track of unique forwarders that use the old S2S protocol. When a If the cache fills before the 'logRetireOldS2SRepeatFrequency' period elapses, Update this setting as per the number of forwarders that currently use the old S2S When you restart Splunk Enterprise, the cache resets and the timer starts over. This setting takes effect only when 'logRetireOldS2S' has a value of "true". |
| logRetireOldS2SRepeatFrequency | `<timespan>` | `1d` | The interval between writing repeat entries into the retire old S2S warning log This setting helps reduce retire old S2S log size by providing control over how When a forwarder uses the old S2S protocol version to communicate with splunkd, splunkd The Splunk platform enforces this setting as long as the size of the cache When you restart Splunk Enterprise, the cache resets and the timer starts over. This setting takes effect only when 'logRetireOldS2S' has a value of "true". A value of "0" means that the platform logs old S2S protocol warning entries every time |
| connection_host | `[ip\|dns\|none]` | `ip` | For splunktcp, the 'host' or 'connection_host' is be used if the remote "ip" sets the host to the IP address of the system sending the data. "dns" sets the host to the reverse DNS entry for IP address of the system "none" leaves the host as specified in inputs.conf, typically the Splunk |
| compressed | `<boolean>` | `false` | Whether or not the receiver communicates with the forwarder in Applies only to receiving data over standard network channels. A value of "true" means the receiver communicates with the forwarder in If set to "true", there is no longer a requirement to also set |
| enableS2SHeartbeat | `<boolean>` | `true (heartbeat monitoring enabled)` | Specifies the keepalive setting for the splunktcp port. This option is used to detect forwarders which might have become unavailable The receiver monitors the connection for presence of a heartbeat, and if it This overrides the default value specified at the global [splunktcp] stanza. |
| s2sHeartbeatTimeout | `<integer>` | `600 (10 minutes)` | The amount of time, in seconds, that a receiver waits for heartbeats from The receiver closes the forwarder connection if it does not see a heartbeat This overrides the default value specified at the global [splunktcp] stanza. |
| queueSize | `<integer>[KB\|MB\|GB]` | `500KB` | The maximum size of the in-memory input queue. See the description of 'queueSize' under the [tcp://] stanza If there are multiple [splunktcp://] stanzas, and you do not want to set |
| negotiateProtocolLevel | `<unsigned integer>` | — | See the description for this setting in the [splunktcp] stanza. |
| negotiateNewProtocol | `<boolean>` | — | See the description for this setting in the [splunktcp] stanza. |
| concurrentChannelLimit | `<unsigned integer>` | — | See the description for this setting in the [splunktcp] stanza. |
| connection_host | `[ip\|dns\|none]` | — | — |
| compressed | `<boolean>` | — | — |
| enableS2SHeartbeat | `<boolean>` | — | — |
| s2sHeartbeatTimeout | `<integer>` | — | — |
| queueSize | `<integer>[KB\|MB\|GB]` | — | — |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | — | — |
| negotiateProtocolLevel | `<unsigned integer>` | — | — |
| negotiateNewProtocol | `<boolean>` | — | — |
| concurrentChannelLimit | `<unsigned integer>` | — | — |
| token | `<string>` | — | The value of the token. Must be in the format NNNNNNNN-NNNN-NNNN-NNNN-NNNNNNNNNNNN. Failure to |
| connection_host | `[ip\|dns\|none]` | `ip` | See the description for this setting in the [splunktcp:<port>] stanza. |
| compressed | `<boolean>` | — | See the description for this setting in the [splunktcp:<port>] stanza. |
| enableS2SHeartbeat | `<boolean>` | — | See the description for this setting in the [splunktcp:<port>] stanza. |
| s2sHeartbeatTimeout | `<seconds>` | — | See the description for this setting in the [splunktcp:<port>] stanza. |
| listenOnIPv6 | `[no\|yes\|only]` | `The setting in the [general] stanza of the server.conf file` | Select whether this receiver listens on IPv4, IPv6, or both protocols. Set to "yes" to listen on both IPv4 and IPv6 protocols. Set to "only" to listen on only the IPv6 protocol. |
| acceptFrom | `<comma- or space-separated list>` | — | See the description for this setting in the [tcp://<remote server>:<port>] |
| negotiateProtocolLevel | `<unsigned integer>` | — | See the description for this setting in the [splunktcp] stanza. |
| negotiateNewProtocol | `<boolean>` | — | See the description for this setting in the [splunktcp] stanza. |
| concurrentChannelLimit | `<unsigned integer>` | — | See the description for this setting in the [splunktcp] stanza. |
| serverCert | `<string>` | — | — |
| sslPassword | `<string>` | — | — |
| requireClientCert | `<boolean>` | — | — |
| sslVersions | `<string>` | — | — |
| cipherSuite | `<string>` | — | — |
| ecdhCurves | `<comma separated list>` | — | — |
| dhFile | `<string>` | — | — |
| allowSslRenegotiation | `<boolean>` | — | — |
| sslQuietShutdown | `<boolean>` | — | — |
| sslCommonNameToCheck | `<comma-separated list>` | — | — |
| sslAltNameToCheck | `<comma-separated list>` | — | — |
| useSSLCompression | `<boolean>` | — | — |
| listenOnIPv6 | `[no\|yes\|only]` | — | Select whether the receiver listens on IPv4, IPv6, or both protocols. Set to "yes" to listen on both IPv4 and IPv6 protocols. Set to "only" to listen on only the IPv6 protocol. If not present, the receiver uses the setting in the [general] stanza |
| acceptFrom | `<comma- or space-separated list>` | `"*" (accept from anywhere)` | See the description for this setting in the [tcp://<remote server>:<port>] |
| serverCert | `<string>` | — | — |
| sslPassword | `<string>` | — | — |
| requireClientCert | `<boolean>` | — | — |
| sslVersions | `<string>` | — | — |
| cipherSuite | `<string>` | — | — |
| ecdhCurves | `<comma separated list>` | — | — |
| dhFile | `<string>` | — | — |
| allowSslRenegotiation | `<boolean>` | — | — |
| sslQuietShutdown | `<boolean>` | — | — |
| sslCommonNameToCheck | `<comma-separated list>` | — | — |
| sslAltNameToCheck | `<comma-separated list>` | — | — |
| useSSLCompression | `<boolean>` | — | — |

### SSL:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| serverCert | `<string>` | — | The full path to the server certificate. The Splunk daemon auto-generates certificates when you start Splunk Where applicable, replace the default certificate with a certificate For more information about certificates, and how to obtain, create, The certificate must be in privacy-enhanced mail (PEM) format. No default. |
| sslPassword | `<string>` | — | The password for the server certificate, if you created one. Configure this setting to a plain-text value initially. Upon first use, the input encrypts and rewrites the password to No default. |
| password | `<string>` | — | DEPRECATED. Use the 'sslPassword' setting instead. |
| rootCA | `<string>` | — | DEPRECATED. Use 'server.conf:[sslConfig]/sslRootCAPath' instead. |
| requireClientCert | `<boolean>` | `Default (if using the default certificates; overrides the existing` | Whether or not an HTTPS client which connects to a splunkd Multiple services can use this setting, including but not Splunk platform indexers must use this setting to connect to Deployment clients must present certificates to deployment A value of "true" means that a client can connect only if it A value of "false" means that there is no certificate requirement |
| sslVersions | `<comma-separated list>` | — | The list of TLS/SSL versions to support for incoming connections. The versions available are "tls1.0", "tls1.1", and "tls1.2". The special version "*" selects all supported versions. If you prefix a version with "-", it means to exclude that version SSL versions 2 and 3 are always disabled. "-ssl2" and "-ssl3" are accepted The default can vary. See the 'sslVersions' setting in |
| supportSSLV3Only | `<boolean>` | — | DEPRECATED. Use 'sslVersions' instead. |
| cipherSuite | `<string>` | — | A list of cipher suites for splunkd to use. If set, the input processor uses the specified cipher string. If not set, the input process uses the default cipher string that If you want to use any Diffie-Hellman ciphers, you must use the The default can vary. See the 'cipherSuite' setting in |
| ecdhCurveName | `<string>` | — | — |
| ecdhCurveName | `<string>` | `empty string` | DEPRECATED. Use the 'ecdhCurves' setting instead. |
| ecdhCurves | `<comma-separated list>` | — | A list of elliptic curves to use for the Elliptic-curve Diffie-Hellman The client sends elliptic curves as part of the Client Hello Specify elliptic curves in the order that you prefer them. The server supports only the curves specified in the list. Splunk software only supports named curves that you specify You can get the list of valid named curves by their short and long names Example configuration: "ecdhCurves = prime256v1,secp384r1,secp521r1" The default can vary. See the 'ecdhCurves' setting in |
| dhFile | `<string>` | — | The location of the Diffie-Hellman (DH) parameter file. This file must be in PEM format. The DH group size, which determines the strength of the key that the You must specify this file to enable any Diffie-Hellman ciphers. No default. |
| dhfile | `<string>` | — | DEPRECATED. Use the 'dhFile' setting (with a capital F) instead. Yes, the setting name is case-sensitive. |
| allowSslRenegotiation | `<boolean>` | `true` | Whether or not the server lets clients request renegotiation of In the TLS protocol, a client can request renegotiation of the A value of "true" means that the server lets clients request the A value of "false" causes the server to reject all renegotiation This limits the amount of CPU a single TCP connection can use, |
| sslQuietShutdown | `<boolean>` | `false` | Whether or not quiet SSL shutdown mode is turned on. When a client is finished with a TLS connection, it can shut that A normal SSL shutdown between a local node, in this case the client, When a local node sends this message, the peer node returns the same message A "quiet" SSL shutdown means that neither node sends this message when it A value of "true" means that the client uses quiet SSL shutdown mode to A value of "false" means that the client shuts down TLS connections using the |
| logCertificateData | `<boolean>` | `true` | Whether or not the Splunk platform logs certificate data for The certificate data logs provide visibility into the certificates A value of "true" means that splunkd generates logs for TLS certificates. Refer to the 'certLogRepeatFrequency' setting for additional constraints on |
| certLogMaxCacheEntries | `<integer>` | `10000` | The size of the cache for tracking certificate entries. The cache keeps track of the certificates for a time period of If the cache fills before the 'certLogRepeatFrequency' period elapses, the Update this setting as per the number of forwarders that are When you restart Splunk Enterprise, the cache resets and the timer starts over. This setting takes effect only when 'logCertificateData' has a value of 'true'. |
| certLogRepeatFrequency | `<timespan>` | `1d` | The interval between writing repeat entries into the certificate data This setting helps reduce certificate data log size by providing control When the Splunk platform receives a certificate the first time in a TLS The Splunk platform enforces this setting as long as the size of the cache When you restart Splunk Enterprise, the cache resets and the timer starts over. This setting takes effect only when 'logCertificateData' has a value of 'true'. A value of "0" means that the platform logs certificate data every time |
| sslCommonNameToCheck | `<comma-separated list>` | — | One or more X.509 standard Common Names of the server certificate which splunkd, The Common Name (CN) is an X.509 standard field in a certificate that identifies the The CN can be a short host name or a fully qualified domain name. For example, If the client cannot match the CN in the certificate that the server presents, For this setting to have any affect, the 'sslVerifyServerCert' setting must have This setting is optional. No default (no common name checking) |
| sslAltNameToCheck | `<comma-separated list>` | — | One or more Subject Alternative Names of the server certificate which splunkd, The Subject Alternative Name (SAN) is an extension to the X.509 standard that If the client cannot match the SAN in the certificate that the server presents, The client does not validate any names in this list against the Common Name. For this setting to have any affect, the 'sslVerifyServerCert' setting must have This setting is optional. No default (no alternative name checking). |
| useSSLCompression | `<boolean>` | `The value of 'server.conf:[sslConfig]/allowSslCompression'` | Whether or not the server lets forwarders that connect to it negotiate TLS- A value of "true" means the server lets forwarders negotiate |
| sslServerHandshakeTimeout | `<integer>` | `60` | The timeout, in seconds, for a TLS handshake to complete between If the TCP input processor does not receive a "Client Hello" from the forwarder |

### UDP (User Datagram Protocol network input):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| connection_host | `[ip\|dns\|none]` | `ip` | "ip" sets the host to the IP address of the system sending the data. "dns" sets the host to the reverse DNS entry for IP address of the system "none" leaves the host as specified in inputs.conf, typically the Splunk If the input is configured with a 'sourcetype' that has a transform that |
| _rcvbuf | `<integer>` | `1572864` | The receive buffer, in bytes, for the UDP port. If you set the value to 0 or a negative number, the input ignores the value. If the default value is too large for an OS, the instance tries to set |
| no_priority_stripping | `<boolean>` | `false` | Whether or not the input strips <priority> syslog fields from events it A value of "true" means the instance does NOT strip the <priority> NOTE: Do NOT set this setting if you want to strip <priority>. |
| no_appending_timestamp | `<boolean>` | `false` | Whether or not to append a timestamp and host to received events. A value of "true" means the instance does NOT append a timestamp NOTE: Do NOT set this setting if you want to append timestamp and host |
| queueSize | `<integer>[KB\|MB\|GB]` | `500KB` | The maximum size of the in-memory input queue. See the description of 'queueSize' under the [tcp://] stanza If you configure multiple [udp://] stanzas, and do not want to set |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | `0 (no persistent queue)` | The maximum size of the persistent queue file. Persistent queues can help prevent loss of transient data. For information on If you set this to a value other than 0, then 'persistentQueueSize' must |
| listenOnIPv6 | `[no\|yes\|only]` | — | Select whether the instance listens on the IPv4, IPv6, or both protocols. Set this to 'yes' to listen on both IPv4 and IPv6 protocols. Set to 'only' to listen on only the IPv6 protocol. If not present, the input uses the setting in the [general] stanza |
| acceptFrom | `<comma- or space-separated list>` | `"*" (accept from anywhere)` | See the description for this setting in the [tcp://<remote server>:<port>] |
| connection_host | `[ip\|dns\|none]` | — | — |
| _rcvbuf | `<integer>` | — | — |
| no_priority_stripping | `<boolean>` | — | — |
| no_appending_timestamp | `<boolean>` | — | — |
| queueSize | `<integer>[KB\|MB\|GB]` | — | — |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | — | — |
| listenOnIPv6 | `<no \| yes \| only>` | — | — |
| acceptFrom | `<comma- or space-separated list>` | — | — |

### FIFO (First In, First Out queue):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| queueSize | `<integer>[KB\|MB\|GB]` | `500KB` | The maximum size of the in-memory input queue. If you configure multiple [fifo://] stanzas, and do not want to set |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | `0 (no persistent queue)` | Maximum size of the persistent queue file. Persistent queues can help prevent loss of transient data. For information on If you set this to a value other than 0, then 'persistentQueueSize' must |

### Scripted Input:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| interval | `[<decimal>\|<cron schedule>]` | `60.0` | How often, in seconds, to run the specified command, or a valid "cron" If you specify the interval as a number, it may have a fractional To specify a cron schedule, use the following format: "<minute> <hour> <day of month> <month> <day of week>" Cron special characters are acceptable. You can use combinations of "*", The cron implementation for data inputs does not currently support names The special value "0" forces this scripted input to be run continuously. The special value "-1" causes the scripted input to run once on start-up. NOTE: when you specify a cron schedule, the input does not... |
| passAuth | `<string>` | — | The user to run the script as. If you provide a username, the instance generates an auth token for that No default. |
| python.version | `[default\|python\|python2\|python3\|python3.7\|python3.9\|latest]` | `Not set; uses the system-wide Python version.` | DEPRECATED. Use 'python.required' instead to specify which Python versions the For Python scripts only, selects which Python version to use. Set to either "default" or "python" to use the system-wide default Python Set to "python3" or "python3.7" to use the Python 3.7 version. Set to "python3.9" to use the Python 3.9 version. In the context of configuring apps, the "latest" value is not currently Optional. |
| python.required | `<comma-separated list>` | `Not set; uses 'python.version' if that setting has a value.` | For Python scripts only, the versions of Python that the script supports. This setting takes precedence over the 'python.version' setting if both The Splunk platform selects the highest version of Python that is The following values are supported: "3.9": The script supports Python version 3.9. "3.13": The script supports Python version 3.13. "latest": The script uses the latest Python interpreter available. Where possible, use a specific version string rather than "latest". NOTE: The "latest" value is an internal value that is related to NOTE: Use this setting instead of the deprecated 'pyt... |
| queueSize | `<integer>[KB\|MB\|GB]` | `500KB` | The maximum size of the in-memory input queue. See the description of 'queueSize' under the [tcp://] stanza If you configure multiple [script://] stanzas, and do not want to set |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | `0 (no persistent queue)` | Maximum size of the persistent queue file. Persistent queues can help prevent loss of transient data. For information on If you set this to a value other than 0, then 'persistentQueueSize' must |
| index | `<string>` | — | The index where the scripted input sends the data. The script passes this parameter as a command-line argument to <cmd> in If you do not specify an index, the script uses the default index. |
| send_index_as_argument_for_path | `<boolean>` | `true` | Whether or not to pass the index as an argument when specified for A value of "true" means the script passes the argument as To avoid passing the index as a command line argument, set this to "false". |
| start_by_shell | `<boolean>` | `false` | Whether or not to run the specified command through the operating system A value of "true" means the host operating system runs the A value of "false" means the input runs the program directly You might want to explicitly set a value of "false" for scripts |

### File system change monitor (fschange monitor)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| disabled | `<boolean>` | `false` | Whether or not the file system change monitor input is active. Set a value of "true" to disable the input, and "false" to enable it. |
| index | `<string>` | `(in all other cases): the default index` | The index where the input sends the data. |
| signedaudit | `<boolean>` | `false` | Whether or not to send cryptographically signed add/update/delete events. A value of "true" means the input does the following to Puts the events in the _audit index. Sets the event sourcetype to 'audittrail' A value of "false" means the input: Places events in the default index. Sets the sourcetype to whatever you specify (or "fs_notification" You must set 'signedaudit' to "false" if you want to set the index for You must also enable auditing by using the audit.conf file. |
| filters | `<comma-separated list>` | — | The fschange input applies each filter, left to right, for each file See the "File System Monitoring Filters" section later in this file |
| recurse | `<boolean>` | `true` | Whether or not the fschange input should look through all sub-directories A value of "true" means the input searches recursively through |
| followLinks | `<boolean>` | `false` | Whether or not the fschange input follows any symbolic A value of "true" means the input follows symbolic links. CAUTION: Do not set this setting to "true" unless you can confirm that |
| pollPeriod | `<integer>` | `3600 (1 hour)` | How often, in seconds, to check a directory for changes. |
| hashMaxSize | `<integer>` | `-1 (disabled)` | The maximum size, in bytes, that a file can be for the fschange input to Tells the fschange input to calculate a SHA256 hash for every file that The input uses this hash as an additional method for detecting changes to the |
| fullEvent | `<boolean>` | `false` | Whether or not to send the full event if the input detects an add or Set to "true" to send the full event if an add or update change is detected. Further qualified by the 'sendEventMaxSize' setting. |
| sendEventMaxSize | `<integer>` | `-1 (unlimited)` | The maximum size, in bytes, that an fschange event can be for the input to Limits the size of event data that the fschange input sends. This also limits the size of indexed file data. |
| sourcetype | `<string>` | `fs_notification` | Sets the source type for events from this input. The input automatically prepends "sourcetype=" to <string>. |
| host | `<string>` | `whatever host sent the event` | Sets the host name for events from this input. |
| filesPerDelay | `<integer>` | `10` | The number of files that the fschange input processes between processing After a delay of 'delayInMills' milliseconds, the fschange input processes This setting helps throttle file system monitoring so it consumes less CPU. |
| delayInMills | `<integer>` | `100` | The delay, in milliseconds, that the fschange input waits between After a delay of 'delayInMills' milliseconds, the fschange input processes This setting helps throttle file system monitoring so it consumes less CPU. |

### File system monitoring filters:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| regex<integer> | `<regular expression>` | — | Deny list and allow list filters can include a set of regular expressions. The name of each regular expression MUST be 'regex<integer>', meaning the The input applies each regular expression in numeric order: |

### http: (HTTP Event Collector)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| port | `<positive integer>` | `8088` | The event collector data endpoint server port. |
| disabled | `<boolean>` | `1 (disabled)` | Whether or not the event collector input is active. Give this setting a value of "1" to disable the input, and "0" to enable it. |
| outputgroup | `<string>` | `empty string` | The name of the output group to which the event collector forwards data. There is no support for using this setting to send data over HTTP with a heavy forwarder. |
| useDeploymentServer | `<boolean>` | `0 (disabled)` | Whether or not the HTTP event collector input writes its When you enable this setting, the input writes its You must copy the full contents of the splunk_httpinput app directory When enabled, only the tokens defined in the splunk_httpinput app in this When disabled, the input writes its configuration to |
| index | `<string>` | `the "default" index` | The default index to use. |
| sourcetype | `<string>` | — | The default source type for the events that the input generates. If you do not specify a sourcetype, the input does not set a sourcetype |
| enableSSL | `<boolean>` | `true` | Whether or not the HTTP Event Collector uses TLS. HEC shares TLS settings with the Splunk management server and cannot have |
| backpressureState | `[disabled\|warn_at_80]` | `disabled` | The level of backpressuring for the HTTP Event Collector (HEC) and HEC Backpressuring is the adding of notifications to HTTP responses that HEC This notification process includes the following changes in how HEC Sending a warning with the HTTP response when HEC queues Sending warnings when HEC ACK channels exceed 80% of capacity. Sending the "HTTP 429 Too Many Requests" instead of the The HEC ACK Health Check now fails when all channels are full, instead Currently, HEC and HEC ACK backpressuring can be turned off with a value When you configure this setting, do not put its value within quot... |
| headerEnforcementMode | `[off\|warn\|block]` | `off` | How an HTTP Event Collector (HEC) input enforces load balancer cookie markers The 'ackRequiredAnyCookie' setting defines the cookie markers A value of "off" means the input performs no enforcement. A value of "warn" means that if the expected cookie markers are missing, A value of "block" means that if the expected cookie markers are missing, NOTE: Do not change this setting unless instructed to do so by Splunk Support. |
| ackRequiredAnyCookie | `<comma-separated list>` | `AWSELB,AWSALB,AWSALBCORS,AWSELBCORS` | The cookie markers to search for in the "Cookie" request Values for this setting are not case-sensitive. If this setting has no value, the Splunk platform performs no enforcement, Example: AWSELB,AWSALB,AWSALBCORS,AWSELBCORS |
| dedicatedIoThreads | `<non-negative integer>` | `0 (The input uses a single thread)` | The number of dedicated input/output threads in the event collector |
| replyHeader.<name> | `<string>` | — | Adds a static header to all HTTP responses that this server generates. For example, "replyHeader.My-Header = value" causes the No default. |
| maxSockets | `<integer>` | `0` | The number of HTTP connections that the HTTP event collector input Set this setting to constrain resource usage. If you set this setting to 0, the input automatically sets it to If this value is less than 50, the input sets it to 50. If this value If set to a negative value, the input does not enforce a limit on |
| maxThreads | `<integer>` | `0` | The number of threads that can be used by active HTTP transactions. Set this to constrain resource usage. If you set this setting to 0, the input automatically sets the limit to If this value is less than 20, the input sets it to 20. If this value is If the 'maxSockets' setting has a positive value and 'maxThreads' If set to a negative value, the input does not enforce a limit on threads. |
| rollingRestartReturnServerBusy | `<boolean>` | `true` | Whether or not HTTP Event Collector endpoints return HTTP errors 404 (not found) or 503 (server busy) This setting applies to instances on the Classic Experience only. NOTE: Do not change this setting unless instructed to do so by Splunk Support. |
| keepAliveIdleTimeout | `<integer>` | `7200` | How long, in seconds, that the HTTP Event Collector input lets a keep-alive If this value is less than 7200, the input sets it to 7200. |
| busyKeepAliveIdleTimeout | `<integer>` | `12` | How long, in seconds, that the HTTP Event Collector lets a keep-alive CAUTION: Setting this to a value that is too large If this value is less than 12, the input sets it to 12. |
| serverCert | `<string>` | `$SPLUNK_HOME/etc/auth/server.pem` | See the description of 'serverCert' under the [SSL] stanza |
| sslKeysfile | `<string>` | `server.pem` | DEPRECATED. Use the 'serverCert' setting instead. |
| sslPassword | `<string>` | `password` | See the description of 'sslPassword' under the [SSL] stanza |
| sslKeysfilePassword | `<string>` | — | DEPRECATED. Use the 'sslPassword' setting instead. |
| caCertFile | `<string>` | `cacert.pem` | DEPRECATED. Use the 'server.conf:[sslConfig]/sslRootCAPath' setting instead. If you have not given the 'sslRootCAPath' setting a value, |
| caPath | `<string>` | `$SPLUNK_HOME/etc/auth` | DEPRECATED. Use absolute paths for all certificate files. If you do not specify absolute paths for certificate files in other settings |
| sslVersions | `<comma-separated list>` | `tls1.2` | The list of TLS versions to support. The versions available are "tls1.0", "tls1.1", and "tls1.2". The special version "*" selects all supported versions. If you prefix a version with "-", it means to exclude that version SSL versions 2 and 3 are always disabled. "-ssl2" and "-ssl3" are accepted |
| cipherSuite | `<string>` | — | The cipher string to use for the HTTP Event Collector input. Use this setting to ensure that the server does not accept connections using If you configure this setting, the input uses the specified cipher string for The default can vary. See the 'cipherSuite' setting in |
| sslServerHandshakeTimeout | `<integer>` | `60` | The timeout, in seconds, for an SSL handshake to complete between an If the HEC server does not receive a "Client Hello" from the HEC client within |
| listenOnIPv6 | `[no\|yes\|only]` | `The setting in the [general] stanza of the server.conf file` | Whether or not this input listens on IPv4, IPv6, or both. Set to "no" to make the input listen only on the IPv4 protocol. Set to "yes" to make the input listen on both IPv4 and IPv6 protocols. Set to "only" to make the input listen on only the IPv6 protocol. |
| acceptFrom | `<comma- or space-separated list>` | `"*" (accept from anywhere)` | See the description for this setting in the [tcp://<remote server>:<port>] |
| requireClientCert | `<boolean>` | `false` | Whether or not a client which connects to the HEC HEC uses the certificate that you specify in the If you do not specify a certificate with that setting, it uses A value of "true" means that a client can connect to HEC only if it A value of "false" means that there is no certificate requirement |
| ecdhCurveName | `<string>` | `empty string` | DEPRECATED. Use the 'ecdhCurves' setting instead. |
| ecdhCurves | `<comma-separated list>` | `empty string` | A list of elliptic curves to use for the Elliptic-curve Diffie-Hellman The client sends elliptic curves as part of the Client Hello Specify elliptic curves in the order that you prefer them. The server supports only the curves specified in the list. Splunk software only supports named curves that you specify You can get the list of valid named curves by their short and long names Example configuration: "ecdhCurves = prime256v1,secp384r1,secp521r1" |
| crossOriginSharingPolicy | `<origin_acl> ...` | `empty string` | A list of the HTTP Origins for which to return Access-Control-Allow-* These headers tell browsers that web applications at those sites The origin is passed as a URL without a path component (for example This setting can take a list of acceptable origins, separated Each origin can also contain wildcards for any part.  Examples: *://app.example.com:*  (either HTTP or HTTPS on any port) https://*.example.com  (any host under example.com, including An address can be prefixed with a '!' to negate the match, with "!*://evil.example.com:* *://*.example.com:*" to not avoid "*" matches all origins. |
| crossOriginSharingHeaders | `<string>` | `empty string` | A list of the HTTP headers to which splunkd sets The "Access-Control-Allow-Headers" header is used in response to A CORS preflight request is a CORS request that checks to see if This setting can take a list of acceptable HTTP headers, separated A single "*" can also be used to match all headers. |
| forceHttp10 | `[auto\|never\|always]` | `auto` | Whether or not the REST HTTP server forces clients that connect When set to "always", the REST HTTP server does not use some When set to "auto", it does this only if the client did not send When set to "never" it always allows HTTP 1.1, even to |
| sslCommonNameToCheck | `<comma-separated list>` | `empty string (no common name checking)` | One or more X.509 standard Common Names of the server certificate which splunkd, The Common Name (CN) is an X.509 standard field in a certificate that identifies the The CN can be a short host name or a fully qualified domain name. For example, If the client cannot match the CN in the certificate that the server presents, For this setting to have any affect, the 'sslVerifyServerCert' setting must have The most important scenario to use this setting is distributed search. This feature does not work with the deployment server and client This setting is optional. |
| sslAltNameToCheck | `<comma-separated list>` | `empty string (no alternate name checking)` | One or more Subject Alternative Names of the server certificate which splunkd, The Subject Alternative Name (SAN) is an extension to the X.509 standard that Subject Alternative Names are effectively extended descriptive If the client cannot match the SAN in the certificate that the server presents, The client does not validate any names in this list against the Common Name. For this setting to have any affect, the 'sslVerifyServerCert' setting must have This feature does not work with the deployment server and client This setting is optional. |
| sendStrictTransportSecurityHeader | `<boolean>` | — | — |
| allowSslCompression | `<boolean>` | `true` | Whether or not the server lets clients negotiate compression at A value of "true" means the server lets clients negotiate A value of "false" means the server does not let clients negotiate |
| allowSslRenegotiation | `<boolean>` | `true` | Whether or not the server lets clients request renegotiation of In the TLS protocol, a client can request renegotiation of the A value of "true" means that the server lets clients request the A value of "false" causes the server to reject all renegotiation This limits the amount of CPU a single TCP connection can use, |
| ackIdleCleanup | `<boolean>` | `true` | Whether or not to remove ACK channels that have been idle after a period A value of "true" means the server removes the ACK channels that are idle |
| maxIdleTime | `<integer>` | `600 (10 minutes)` | The maximum amount of time, in seconds, that ACK channels can be idle If 'ackIdleCleanup' is "true", the system removes ACK channels that have |
| channel_cookie | `<string>` | `empty string (no cookie)` | The name of the cookie to use when sending data with a specified channel ID. The value of the cookie is the channel sent. For example, if you have If no channel ID is present in the request, then no cookie is returned. This setting is to be used for load balancers (for example, AWS ELB) that can If no value is set (the default), then no cookie is returned. |
| maxEventSize | `<positive integer>[KB\|MB\|GB]` | `5MB` | The maximum size of a single HEC (HTTP Event Collector) event. HEC disregards and triggers a parsing error for events whose size is |
| maxMemoryUsagePct | `<positive integer>` | `100` | The maximum percentage of memory that the Splunk platform instance When the host-wide memory usage surpasses this threshold, the The maximum legal value is 100. |
| route | `[has_key\|absent_key:<key>:<queueName>;...]` | — | See 'route' in the "[splunktcp]" stanza for |

### HTTP Event Collector (HEC) - Local stanza for each token

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| token | `<string>` | — | The value of the HEC token. HEC uses this token to authenticate inbound connections. Your application No default. |
| disabled | `<boolean>` | `0 (enabled)` | Whether or not this token is active. |
| description | `<string>` | `empty string` | A human-readable description of this token. |
| indexes | `<comma-separated list>` | — | The indexes that events for this token can go to. If you do not specify this value, the index list is empty, and any index Separate multiple indexes with commas. The Splunk platform accepts and indexes events without a specified No default. |
| s2s_indexes_validation | `[ disabled \| disabled_for_internal \| enabled_for_all ]` | `disabled_for_internal` | The method of index validation for Splunk-to-Splunk (S2S) events for this A value of "disabled" means the Splunk platform doesn't validate the A value of "disabled_for_internal" means the Splunk platform doesn't A value of "enabled_for_all" means the platform validates all indexes The platform silently drops rejected events. |
| index | `<string>` | `the default index` | The default index to use for this token. |
| sourcetype | `<string>` | `empty string` | The default sourcetype to use if it is not specified in an event. |
| outputgroup | `<string>` | `empty string` | The name of the forwarding output group to send data to. There is no support for using this setting to send data over HTTP with a heavy forwarder. |
| queueSize | `<integer>[KB\|MB\|GB]` | `500KB` | The maximum size of the in-memory input queue. See the description of 'queueSize' under the [tcp://] stanza Unlike with other inputs that use in-memory queues, the logic for Splunkd still sorts all HEC input stanzas in alphanumeric order. The first HEC input stanza that defines the token contained within Splunkd uses the value defined for 'queueSize' in that stanza. If you configure multiple [http://] stanzas, and do not want to set |
| persistentQueueSize | `<integer>[KB\|MB\|GB\|TB]` | `0 (no persistent queue)` | Maximum size of the persistent queue file. Persistent queues can help prevent loss of transient data. For information on If you set this to a value other than 0, then 'persistentQueueSize' must |
| connection_host | `[ip\|dns\|proxied_ip\|none]` | — | Specifies the host if an event doesn't have a host set. "ip" sets the host to the IP address of the system sending the data. "dns" sets the host to the reverse DNS entry for IP address of the system "proxied_ip" checks whether an X-Forwarded-For header was sent "none" leaves the host as specified in the HTTP header. No default. |
| useACK | `<boolean>` | `false` | When set to "true", acknowledgment (ACK) is enabled. Events in a request When set to false, acknowledgment is not enabled. This setting can be set at the stanza level. |
| allowQueryStringAuth | `<boolean>` | `false` | Enables or disables sending authorization tokens with a query string. This is a token level configuration. It may only be set for To use this feature, set to "true" and configure the client application to If a token is sent in both the query string and an HTTP header, the token in NOTE: Query strings may be observed in transit and/or logged in cleartext. Before using this in production, consult security personnel in your At a minimum, always use HTTPS when you enable this feature. Check your Give minimal access permissions to the token in HEC and restrict the |

### Performance Monitor

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| object | `<string>` | — | A valid Performance Monitor object as defined within Performance You can specify a single valid Performance Monitor object or use a This setting is required, and the input does not run if the setting is No default. |
| counters | `<semicolon-separated list>` | — | This can be a single counter, or multiple valid Performance Monitor This setting is required, and the input does not run if the setting is "*" is equivalent to all available counters for a given Performance No default. |
| nonmetric_counters | `<semicolon-separated list>` | — | A list of performance counters on which the performance monitor input When the input retrieves the value for a counter that is in this list, Add counters to this setting in cases where the values that the input As an example, the "ID Process" counter works better as a non metric counter No default. |
| instances | `<semicolon-separated list>` | — | One or more multiple valid Performance Monitor instances. "*" is equivalent to all available instances for a given Performance Monitor If applicable instances are available for a counter and this setting is not If there are no applicable instances for a counter, then you can omit No default. |
| interval | `<integer>` | `300` | How often, in seconds, to poll for new data. This setting is required, and the input does not run if the setting is The recommended setting depends on the Performance Monitor object, Objects with numerous instantaneous or per-second counters, such Less volatile counters such as "Terminal Services", "Paging File", |
| mode | `[single\|multikv]` | `single` | Specifies how the performance monitor input generates events. Set to "single" to print each event individually. Set to "multikv" to print events in multikv (formatted multiple |
| samplingInterval | `<positive integer>` | — | How often, in milliseconds, to poll for new data. This is an advanced setting. Enables high-frequency performance sampling. The input collects The minimum legal value is 100, and the maximum legal value must be less If not set, high-frequency sampling does not occur. No default (disabled). |
| stats | `<average;count;dev;min;max>` | — | Reports statistics for high-frequency performance sampling. This is an advanced setting. Setting a 'samplingInterval' is required to use 'stats'. Acceptable values are: average, count, dev, min, max. You can specify multiple values by separating them with semicolons. Adds new fields that append the stats function name. No default. (disabled) |
| disabled | `<boolean>` | `0 (enabled)` | Specifies whether or not the input is enabled. Set to 1 to disable the input, and 0 to enable it. |
| showZeroValue | `<boolean>` | `0 (ignore zero value event data)` | Specifies whether or not the input collects zero-value event data. Set to 1 to capture zero value event data, and 0 to ignore such data. |
| useEnglishOnly | `<boolean>` | `false` | Controls which Windows Performance Monitor API the input uses. If set to "true", the input uses PdhAddEnglishCounter() to add the If set to "false", the input uses PdhAddCounter() to add the counter string. NOTE: if you set this setting to true, the 'object' setting does not |
| useWinApiProcStats | `<boolean>` | `false` | Whether or not the Performance Monitor input uses process kernel mode and A problem was found in the PDH APIs that causes Performance Monitor inputs When you configure this setting to "true", the input uses the Processor Time User Time Privileged Time This means that, if a process uses 5 of 8 cores on an 8-core machine, that When you configure the setting to "false", the input uses the standard Performance monitor inputs use the PDH APIs for all other Performance NOTE: If the Windows machine uses a non-English system locale, and you |
| formatString | `<string>` | `%.20g` | Controls the print format for double-precision statistic counters. Do not use quotes when specifying this string. |
| usePDHFmtNoCap100 | `<boolean>` | `true` | Whether or not performance counter values that are greater than 100 (for example, If set to "true", the counter values can exceed 100. If set to "false", the input resets counter values to 100 if the |

### Direct Access File Monitor

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| disabled | `<boolean>` | `0 (enabled)` | Whether or not the input is enabled. |
| index | `<string>` | `the default index` | Specifies the index where this input sends the data. This setting is optional. |

### Windows Event Log Monitor

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| start_from | `<string>` | `oldest` | How the Event Log input is to chronologically read the Event Log channels. A value of "oldest" means that the input reads Windows event logs A value of "newest" means that the input reads Windows event logs If you set this setting to "newest", and at the same time give the Do not set this setting to "newest" and at the same time give the |
| use_old_eventlog_api | `<boolean>` | `false (Use the API that is specific to the OS)` | Whether or not to read Event Log events with the Event Logging API. This is an advanced setting. Contact Splunk Support before you change it. A value of "true" means the input uses the Event Logging API (instead of the |
| use_threads | `<integer>` | `0` | Specifies the number of threads, in addition to the default writer thread, This is an advanced setting. Contact Splunk Support before you change it. The maximum number of threads is 15. |
| thread_wait_time_msec | `<integer>` | `5000` | The interval, in milliseconds, between attempts to re-read Event Log files This is an advanced setting. Contact Splunk Support before you change it. |
| suppress_checkpoint | `<boolean>` | `false` | Whether or not the Event Log strictly follows the 'checkpointInterval' This is an advanced setting. Contact Splunk Support before you change it. By default, the Event Log input saves a checkpoint from between zero |
| suppress_sourcename | `<boolean>` | `false` | Whether or not to exclude the 'sourcename' field from events. This is an advanced setting. Contact Splunk Support before you change it. When set to true, the input excludes the 'sourcename' field from events |
| suppress_keywords | `<boolean>` | `false` | Whether or not to exclude the 'keywords' field from events. This is an advanced setting. Contact Splunk Support before you change it. When set to true, the input excludes the 'keywords' field from events and |
| suppress_type | `<boolean>` | `false` | Whether or not to exclude the 'type' field from events. This is an advanced setting. Contact Splunk Support before you change it. When set to true, the input excludes the 'type' field from events and |
| suppress_task | `<boolean>` | `false` | Whether or not to exclude the 'task' field from events. This is an advanced setting. Contact Splunk Support before you change it. When set to true, the input excludes the 'task' field from events and |
| suppress_opcode | `<boolean>` | `false` | Whether or not to exclude the 'opcode' field from events. This is an advanced setting. Contact Splunk Support before you change it. |
| current_only | `<boolean>` | `false (Gather stored events with higher event IDs first before` | Whether or not to acquire only events that arrive while the instance is A value of "true" means the input only acquires events that arrive A value of "false" means the input first gets all existing events If you set this setting to "false", and at the same time set the Do not set this setting to "true" and at the same time set the |
| batch_size | `<integer>` | `10` | How many Windows Event Log items to read per request. If troubleshooting identifies that the Event Log input is a bottleneck in NOTE: Splunk Support has seen cases where large values can result in a In local and customer acceptance testing, a value of 10 was acceptable |
| checkpointInterval | `<integer>` | `0` | How often, in seconds, that the Windows Event Log input saves a checkpoint. Checkpoints store the eventID of acquired events. This lets the input |
| checkpointSync | `<boolean>` | `false` | Determines whether the input processor forces writing a checkpoint file to disk A value of "true" means the input processor triggers writing of a checkpoint |
| channel_wait_time | `<integer>` | `0` | How long, in seconds, that the Windows Event Log input waits for an Event Log Some Event Log channels, like the Windows Defender channel, become If the Event Log input is unable to collect event logs from a certain The maximum wait time is 180 (3 minutes). |
| disabled | `<boolean>` | `0 (enabled)` | Whether or not the input is enabled. Set to 1 to disable the input, and 0 to enable it. |
| evt_resolve_ad_obj | `<boolean>` | `false (disabled) for all channels` | How the input should interact with Active Directory while indexing Windows If you set this setting to true, the input resolves the Active If you enable the setting, the rate at which the input reads events When you set this setting to true, you can optionally specify the domain If you set this setting to false, the input does not attempt any resolution. |
| evt_skip_GUID_resolution | `<comma-separated list>` | `none` | A list of Windows Event Codes for which the Splunk platform does not contact Separate multiple event IDs or event ID ranges with commas. If the event code matches an event, The Splunk platform does not contact This setting only takes effect if 'evt_resolve_ad_obj' has a value of "true". If 'evt_resolve_ad_obj' has a value of "false", this setting has no effect. This setting has no effect on SID resolution. See 'Event ID list format' later in this file for the proper |
| evt_dc_name | `<string>` | — | Which Active Directory domain controller to bind to for AD object If you prefix a dollar sign to a value (for example, $my_domain_controller), This setting is optional. This setting can be set to the NetBIOS name of the domain controller "FTW-DC-01" "\\FTW-DC-01" "FTW-DC-01.splunk.com" "\\FTW-DC-01.splunk.com" $my_domain_controller |
| evt_dns_name | `<string>` | — | The fully-qualified DNS name of the domain that the input should bind to for This setting is optional. |
| evt_resolve_ad_ds | `[auto\|PDC]` | `auto (let Windows determine the domain controller to use)` | How the input should choose the domain controller to bind for This setting is optional. If set to PDC, the input only contacts the primary domain controller If set to auto, the input lets Windows chose the best domain controller. If you set the 'evt_dc_name' setting, the input ignores this setting. |
| evt_ad_cache_disabled | `<boolean>` | `false (enabled)` | Enables or disables the AD object cache. |
| evt_ad_cache_exp | `<integer>` | `3600 (1 hour)` | The expiration time, in seconds, for AD object cache entries. This setting is optional. |
| evt_ad_cache_exp_neg | `<integer>` | `10` | The expiration time, in seconds, for negative AD object cache entries. This setting is optional. |
| evt_ad_cache_max_entries | `<integer>` | `1000` | The maximum number of AD object cache entries. This setting is optional. |
| evt_exclude_fields | `<comma-separated list>` | — | A list of valid Windows Event Log fields to exclude from Windows Specify fields that you want excluded from each event report. Do not exclude fields that you have also added to allow lists or This setting is similar to, but operates differently than, the Does not effect event report if 'renderXML' is set to "true". The 'evt_exclude_fields' setting is valid for all Windows Event Log fields. No default. |
| evt_sid_cache_disabled | `<boolean>` | `0` | Enables or disables account Security IDentifier (SID) cache. This setting is global. It affects all Windows Event Log stanzas. |
| evt_sid_cache_exp | `<unsigned integer>` | `3600` | The expiration time, in seconds, for account SID cache entries. This setting is global. It affects all Windows Event Log stanzas. This setting is optional. |
| evt_sid_cache_exp_neg | `<unsigned integer>` | `10` | The expiration time, in seconds, for negative account SID cache entries. This setting is optional. This setting is global. It affects all Windows Event Log stanzas. |
| evt_sid_cache_max_entries | `<unsigned integer>` | `10` | The maximum number of account SID cache entries. This setting is global. It affects all Windows Event Log stanzas. This setting is optional. |
| wec_event_format | `[raw_event\|rendered_event]` | `raw_event` | The content format of the events that the Splunk platform expects to receive This setting helps associate incoming WEC event formats with the Splunk If the WEC subscription that targets this channel has its 'content Format' If the WEC subscription that targets this channel has its 'content Format' If multiple WEC subscriptions share the same value for the 'destination log' You can update the WEC subscriptions so that they share the same values for Or you can create custom ForwardedEvents channels for each WEC If Windows Event Collector does not forward these events, this setting is NOTE: Yo... |
| index | `<string>` | `The default index` | Specifies the index that this input should send the data to. This setting is optional. |

### Event Log filtering

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| whitelist | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist1 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist2 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist3 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist4 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist5 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist6 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist7 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist8 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| whitelist9 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist1 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist2 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist3 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist4 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist5 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist6 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist7 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist8 | `<comma-separated list> \| key=regex [key=regex]` | — | — |
| blacklist9 | `<comma-separated list> \| key=regex [key=regex]` | — | These settings are optional. Both numbered and unnumbered allow lists and deny lists support two formats: A comma-separated list of event IDs. A list of key=regular expression pairs. You cannot combine these formats. You can use either format on a specific Numbered allow list settings are permitted from 1 to 9, so whitelist1 through If no allow list or deny  list rules are present, the input reads all events. |

### Event Log allow list and deny list formats

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| suppress_text | `<boolean>` | `false` | Whether or not to include the description of the event text for a This setting is optional. Set this setting to true to suppress the inclusion of the event Set this value to false to include the event text description. |
| renderXml | `<boolean>` | `false` | Whether or not the input returns the event data in XML (eXtensible Markup A value of "true" means that the input renders events in XML format. A value of "false" means that the input renders events in plain text. If you give this setting a value of "true", you should also give the A value of "true" also changes the method by which you create allow- Search the Splunk platform Getting Data In Manual for "Filter data in XML format |

### Active Directory Monitor

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| targetDc | `<string>` | `The DC that the local host used to connect to AD. The` | The fully qualified domain name of a valid, network-accessible This setting is case sensitive. Do not use 'targetdc' or 'targetDC', |
| adsUseSSL | `<boolean>` | `false` | Whether or not the Splunk platform instance uses TLS to A value of "true" means that the instance uses the NOTE: For encrypted connections to work, you must have A value of "false" means that the instance does not attempt |
| startingNode | `<string>` | `the root of the directory tree` | Where in the Active Directory directory tree to start monitoring. The user that you configure Splunk software to run as at |
| monitorSubtree | `<boolean>` | `1 (monitor subtrees of a given directory tree path)` | Whether or not to monitor the subtree(s) of a given Active Set this to 1 to monitor subtrees of a given directory tree |
| disabled | `<boolean>` | `0 (enabled)` | Whether or not the input is enabled. Set this to 1 to disable the input and 0 to enable it. |
| index | `<string>` | `the default index` | The index to store incoming data into for this input. This setting is optional. |
| printSchema | `<boolean>` | `1 (print the Active Directory schema)` | Whether or not to print the Active Directory schema. Set this to 1 to print the schema and 0 to not print |
| baseline | `<boolean>` | `0 (do not query baseline objects)` | Whether or not to query baseline objects. Baseline objects are objects which currently reside in Active Directory. Baseline objects also include previously deleted objects. Set this to 1 to query baseline objects, and 0 to not query |

### Windows Registry Monitor

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| proc | `<string>` | `.* (match all processes)` | The processes this input should monitor for Registry access. If set, matches against the process name which performed the Registry The input includes events from processes that match the regular expression The input filters out events for processes that do not match the |
| hive | `<string>` | — | The Registry hive(s) that this input should monitor for Registry access. If set, matches against the Registry key that was accessed. The input includes events from Registry hives that match the The input filters out events for Registry hives that do not match the No default. |
| type | `<string>` | — | A regular expression that specifies the type(s) of Registry event(s) No default. |
| baseline | `<boolean>` | `0 (do not capture a baseline for the specified hive` | Whether or not the input should get a baseline of Registry events If you set this to 1, the input captures a baseline for |
| baseline_interval | `<integer>` | `86400 (1 day)` | Selects how much downtime in continuous registry monitoring should trigger In detail: Sets the minimum time interval, in seconds, between baselines. At startup, a WinRegMon input does not generate a baseline if less time In normal operation, checkpoints are updated frequently as data is If baseline is set to 0 (disabled), the setting has no effect. |
| disabled | `<boolean>` | `0 (enabled)` | Whether or not the input is enabled. Set this to 1 to disable the input, or 0 to enable it. |
| index | `<string>` | `the default index` | The index that this input should send the data to. This setting is optional. |

### Windows Host Monitoring

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| type | `<semicolon-separated list>` | — | An expression that specifies the type(s) of host inputs Type can be (case insensitive): No default. |
| interval | `<integer>` | — | The interval, in seconds, between when the input runs to gather See 'interval' in the Scripted input section for more information. |
| disabled | `<boolean>` | `0 (enabled)` | Whether or not the input is enabled. Set this to 1 to disable the input, or 0 to enable it. |
| index | `<string>` | `the default index` | The index that this input should send the data to. This setting is optional. |
| type | `<semicolon-separated list>` | — | An expression that specifies the type(s) of print inputs Type can be (case insensitive): No default. |
| interval | `<integer>` | — | The interval, in seconds, between when the input runs to gather See 'interval' in the Scripted input section for more information. |
| baseline | `<boolean>` | `0 (do not capture a baseline)` | Whether or not to capture a baseline of print objects when the If you set this setting to 1, the input captures a baseline of |
| disabled | `<boolean>` | `0 (enabled)` | Whether or not the input is enabled. Set to 1 to disable the input, or 0 to enable it. |
| index | `<string>` | `the default index` | The index that this input should send the data to. This setting is optional. |
| remoteAddress | `<regular expression>` | — | A regular expression that represents the remote IP address of a This setting accepts a regular expression that matches against The input includes events for remote IP addresses that match The input filters out events for remote IP addresses that do not No default (include all remote address events). |
| process | `<regular expression>` | — | A regular expression that represents the process or application that The input includes events for processes that match the The input filters out events for processes that do not match the No default (include all processes and application events). |
| user | `<regular expression>` | — | A regular expression that represents the Windows user name that The input includes events for user names that match the The input filters out events for user names that do not match the No default (include all user name events). |
| addressFamily | `[ipv4];[ipv6]` | — | Determines the events to include by network address family. Setting "ipv4" alone includes only IPv4 packets, while "ipv6" alone To specify both families, separate them with a semicolon. No default (include events with both address families). |
| packetType | `[connect];[accept];[transport]` | — | Determines the events to include by network packet type. To specify multiple packet types, separate them with a semicolon. No default (include events with any packet type). |
| direction | `[inbound];[outbound]` | — | Determines the events to include by network transport direction. To specify multiple directions, separate them with a semicolon. No default (include events with any direction). |
| protocol | `[tcp];[udp]` | — | Determines the events to include by network protocol. To specify multiple protocols, separate them with a semicolon. For more information about protocols, see No default (include events with all protocols) |
| readInterval | `<integer>` | `100` | How often, in milliseconds, that the input should read the network Advanced option. Use the default value unless there is a problem Set this to adjust the frequency of calls into the network kernel driver. Choosing lower values (higher frequencies) can reduce network The minimum allowed value is 10 and the maximum allowed value is 1000. |
| driverBufferSize | `<integer>` | `32768` | The maximum number of packets that the network kernel driver retains Set to adjust the maximum number of network packets retained in Advanced option. Use the default value unless there is a problem Configuring this setting to lower values can result in event loss, while The minimum allowed value is 128 and the maximum allowed value is 32768. |
| userBufferSize | `<integer>` | `20` | The maximum size, in megabytes, of the user mode event buffer. Controls amount of packets cached in the the user mode. Advanced option. Use the default value unless there is a problem Configuring this setting to lower values can result in event loss, while The minimum allowed value is 20 and the maximum allowed value is 500. |
| mode | `[single\|multikv]` | `single` | Specifies how the network monitor input generates events. Set to "single" to generate one event per packet. Set to "multikv" to generate combined events of many packets in |
| multikvMaxEventCount | `<integer>` | `100` | The maximum number of packets to combine in multikv format when you set Has no effect when 'mode' is set to "single". Advanced option. The minimum allowed value is 10 and the maximum allowed value is 500. |
| multikvMaxTimeMs | `<integer>` | `1000` | The maximum amount of time, in milliseconds, to accumulate packet data to Has no effect when 'mode' is set to 'single'. Advanced option. The minimum allowed value is 100 and the maximum allowed value is 5000. |
| sid_cache_disabled | `[0\|1]` | `0` | Enables or disables account Security IDentifier (SID) cache. This setting is global. It affects all Windows Network Monitor stanzas. |
| sid_cache_exp | `<integer>` | `3600` | The expiration time, in seconds, for account SID cache entries. Optional. This setting is global. It affects all Windows Network Monitor stanzas. |
| sid_cache_exp_neg | `<integer>` | `10` | The expiration time, in seconds, for negative account SID cache entries. Optional. This setting is global. It affects all Windows Network Monitor stanzas. |
| sid_cache_max_entries | `<integer>` | `10` | The maximum number of account SID cache entries. Optional. This setting is global. It affects all Windows Network Monitor stanzas. |
| disabled | `<boolean>` | `0 (enabled)` | Whether or not the input is enabled. Set to 1 to disable the input, and 0 to enable it. |
| index | `<string>` | `the default index` | The index where this input sends the data. Optional. |
| io_threads | `<integer>` | — | The number of threads that Splunk software spawns to run PowerShell scripts If you specify a value that is less than or equal to 0, Splunk software The default can vary. Splunk software autotunes the number of threads |
| serialization_threads | `<integer>` | — | The number of threads that Splunk software spawns for serialization of This serialization, or conversion of objects, occurs according to the If you specify a value that is less than or equal to 0, Splunk software The default can vary. Splunk software autotunes the number of threads |
| event_serialization_format | `[kv\|json]` | `kv` | The event format into which Powershell objects are serialized. The supported event formats are "kv" and "json". For example, given the following PowerShell object: |
| process_completion_check_interval | `<integer>` | `200` | The interval, in milliseconds, between which the Splunk platform checks |
| script | `<string>` | — | A PowerShell command-line script or .ps1 script file that the input No default. |
| schedule | `[<positive integer>\|<cron schedule>]` | `The command or script runs once, when the instance starts.` | How often to run the specified PowerShell command or script. There are two options available for how to run the command You can specify a number, which represents how often, in seconds, You can specify a "cron" style schedule, which lets you determine Regardless of which option you choose, the command or script |
| io_threads | `<integer>` | — | The number of threads that Splunk software spawns to run PowerShell scripts If you specify a value that is less than or equal to 0, Splunk software The default can vary. Splunk software autotunes the number of threads |
| event_serialization_format | `[ kv \| json ]` | `kv` | The event format into which Powershell objects are serialized. The supported event formats are "kv" and "json". For example, given the following PowerShell object: |
| process_completion_check_interval | `<integer>` | `Default = 200` | The interval, in milliseconds, between which the Splunk platform checks |
| script | `<string>` | — | A PowerShell command-line script or .ps1 script file that the input No default. |
| schedule | `<string>` | `Runs the command or script once, at startup.` | How often to run the specified PowerShell command or script. You can provide a valid cron schedule. |

### Remote Queue Monitor

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| remote_queue.* | `<string>` | — | Optional. This section explains possible settings for configuring a remote queue. With remote queues, the splunk indexer might require additional configuration, This setting is optional. No default. |
| disabled | `<boolean>` | `false` | Whether the remote queue input is active. A value of "true" means the remote queue input is inactive. A value of "false" means the remote queue input is active. |
| remote_queue.type | `[sqs_smartbus\|asq\|gcs_smartbus]` | — | The remote queue type. This type can be one of the following: "sqs_smartbus" (Amazon Web Services (AWS) Simple Queue Service Smartbus) "asq" (Azure Storage Queue (ASQ)) "gcs_smartbus" (Google Publisher/Subscriber) If you specify this setting, you must configure it with a valid This setting is only applicable if Splunk indexer clustering is turned No default. |
| remote_queue.large_message_store.supports_versioning | `<boolean>` | `true` | Specifies whether or not the remote storage supports versioning. Versioning is a means of keeping multiple variants of an object This setting is optional. |
| compressed | `<boolean>` | — | See the description for TCPOUT ATTRIBUTES in outputs.conf.spec. |
| negotiateProtocolLevel | `<unsigned integer>` | — | See the description for TCPOUT ATTRIBUTES in outputs.conf.spec. |
| channelReapInterval | `<integer>` | — | See the description for TCPOUT ATTRIBUTES in outputs.conf.spec. |
| channelTTL | `<integer>` | — | See the description for TCPOUT ATTRIBUTES in outputs.conf.spec. |
| channelReapLowater | `<integer>` | — | See the description for TCPOUT ATTRIBUTES in outputs.conf.spec. |
| concurrentChannelLimit | `<unsigned integer>` | — | See the description for [splunktcp]. |

### Simple Queue Service Smartbus (SQS Smartbus) specific settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| remote_queue.sqs_smartbus.access_key | `<string>` | — | The access key to use when authenticating with the remote queue If not specified, the indexer looks for these environment variables: This setting is optional. No default. |
| remote_queue.sqs_smartbus.secret_key | `<string>` | — | The secret key to use when authenticating with the remote queue If not specified, the indexer looks for these environment variables: This setting is optional. No default. |
| remote_queue.sqs_smartbus.auth_region | `<string>` | — | The authentication region to use when signing the requests when interacting If not specified and the indexer is running on EC2, the auth_region is This setting is optional. No default. |
| remote_queue.sqs_smartbus.endpoint | `<string>` | — | The URL of the remote queue system supporting the SQS API. The scheme, http or https, can be used to enable or disable SSL connectivity If not specified, the endpoint is constructed automatically based on the If specified, the endpoint must match the effective auth_region, which is Example: https://sqs.us-west-2.amazonaws.com/ This setting is optional. No default. |
| remote_queue.sqs_smartbus.max_connections | `<unsigned integer>` | `8` | The maximum number of HTTP connections that can be simultaneously in progress for A value of 0 means unlimited. |
| remote_queue.sqs_smartbus.message_group_id | `<string>` | — | Currently not supported. This setting is related to a feature that is The Message Group ID for Amazon Web Services Simple Queue Service Setting a Message Group ID controls how messages within an AWS SQS queue are For information on SQS FIFO queues and how messages in those queues are If you configure this setting, Splunk software assumes that the SQS queue is Otherwise, Splunk software assumes that the SQS queue is a standard queue. Can be between 1-128 alphanumeric or punctuation characters. NOTE: FIFO queues must have Content-Based Deduplication enabled. This setting is optional. No default. |
| remote_queue.sqs_smartbus.retry_policy | `[max_count\|none]` | `"max_count"` | The retry policy to use for remote queue operations. A retry policy specifies whether and how to retry file operations that fail Retry policies: This setting is optional. |
| remote_queue.sqs_smartbus.max_count.max_retries_per_part | `<unsigned integer>` | `3` | When 'remote_queue.sqs_smartbus.retry_policy' is set to "max_count", sets the This setting is optional. |
| remote_queue.sqs_smartbus.timeout.connect | `<unsigned integer>` | `5` | The connection timeout, in seconds, when interacting with This setting is optional. |
| remote_queue.sqs_smartbus.timeout.read | `<unsigned integer>` | `60` | The read timeout, in seconds, when interacting with SQS for This setting is optional. |
| remote_queue.sqs_smartbus.timeout.write | `<unsigned integer>` | `60` | The write timeout, in seconds, when interacting with SQS for This setting is optional. |
| remote_queue.sqs_smartbus.timeout.receive_message | `<unsigned integer>` | `20` | The receive message wait time, in seconds, when interacting with SQS for When set to greater than 0, enables "long polling." If there are no messages When 0, disables long polling. When not set, uses the value configured for the queue via the AWS SQS Maximum value: 20 This setting is optional. |
| remote_queue.sqs_smartbus.timeout.visibility | `<unsigned integer>` | `300` | The default "visibility timeout," in seconds, to use when NOTE: Changing the value of 'remote_queue.sqs.timeout.visibility' This setting is optional. |
| remote_queue.sqs_smartbus.buffer.visibility | `<unsigned integer>` | `15` | The default time, in seconds, before This setting is optional. |
| remote_queue.sqs_smartbus.executor_max_workers_count | `<positive integer>` | `4` | The maximum number of worker threads that can be used by A value of 0 is equivalent to 1. |
| remote_queue.sqs_smartbus.min_pending_messages | `<unsigned integer>` | `10` | The default "minimum number of pending messages" to use before This setting is optional. |
| remote_queue.sqs_smartbus.renew_retries | `<unsigned integer>` | `50` | The number of retries for a particular message on a given indexer after |
| remote_queue.sqs_smartbus.large_message_store.endpoint | `<string>` | — | The URL of the remote storage system supporting the S3 API. The scheme, http or https, can be used to enable or disable SSL connectivity If not specified, the endpoint is constructed automatically based on the If specified, the endpoint must match the effective auth_region, which is Example: https://s3.us-west-2.amazonaws.com/ This setting is optional. No default. |
| remote_queue.sqs_smartbus.large_message_store.path | `<string>` | — | The remote storage location where messages that are larger than the The format for this attribute is: <scheme>://<remote-location-specifier> The "scheme" identifies a supported external storage system type. The "remote-location-specifier" is an external system-specific string for These external systems are supported: If not specified, messages exceeding the underlying queue's maximum message This setting is optional. No default. |
| remote_queue.sqs_smartbus.large_message_store.sslVerifyServerCert | `<boolean>` | `false` | If set to true, the Splunk platform verifies the certificate presented by the S3 |
| remote_queue.sqs_smartbus.large_message_store.sslVersions | `<comma-separated list>` | `tls1.2` | The list of TLS versions to use to connect to 'remote.sqs_smartbus.large_message_store.endpoint'. The versions available are "tls1.0", "tls1.1", and "tls1.2". The special version "*" selects all supported versions.  The version "tls" If a version is prefixed with "-" it is removed from the list. SSL versions 2 and 3 are always disabled. "-ssl2" and "-ssl3" are accepted |
| remote_queue.sqs_smartbus.large_message_store.sslCommonNameToCheck | `<commonName1>, <commonName2>, ..` | `not set` | If this value is set, and 'remote_queue.sqs_smartbus.large_message_store.sslVerifyServerCert' is set to true, |
| remote_queue.sqs_smartbus.large_message_store.sslAltNameToCheck | `<alternateName1>, <alternateName2>, ..` | `not set` | If this value is set, and 'remote_queue.sqs_smartbus.large_message_store.sslVerifyServerCert' is set to true, |
| remote_queue.sqs_smartbus.large_message_store.sslRootCAPath | `<path>` | `[sslConfig/caCertFile] in server.conf` | Full path to the Certificate Authority (CA) certificate PEM format file |
| remote_queue.sqs_smartbus.large_message_store.cipherSuite | `<cipher suite string>` | `TLSv1+HIGH:TLSv1.2+HIGH:@STRENGTH` | If set, uses the specified cipher string for the SSL connection. If not set, uses the default cipher string. Must specify 'dhFile' to enable any Diffie-Hellman ciphers. |
| remote_queue.sqs_smartbus.large_message_store.ecdhCurves | `<comma-separated list>` | `not set` | ECDH curves to use for ECDH key negotiation. Specify the curves in the order of preference. The client sends these curves as a part of Client Hello. Splunk software only supports named curves specified The list of valid named curves by their short/long names can be obtained e.g. ecdhCurves = prime256v1,secp384r1,secp521r1 |
| remote_queue.sqs_smartbus.large_message_store.dhFile | `<path>` | `not set` | PEM format Diffie-Hellman parameter file name. DH group size must be no less than 2048bits. This file is required in order to enable any Diffie-Hellman ciphers. Optional |
| remote_queue.sqs_smartbus.dead_letter_queue.name | `<string>` | — | The name of the dead letter queue. |
| remote_queue.sqs_smartbus.dead_letter_queue.process_interval | `<number><unit>` | `1d` | The frequency of processing messages that have landed in the dead letter queue. Examples: 30s, 6h |
| remote_queue.sqs_smartbus.large_message_store.encryption_scheme | `[sse-s3\|sse-c\|none]` | `none.` | The encryption scheme used by remote storage |
| remote_queue.sqs_smartbus.large_message_store.kms_endpoint | `<string>` | — | The endpoint to connect to for generating KMS keys. This setting is required if 'large_message_store.encryption_scheme' is Examples: https://kms.us-east-2.amazonaws.com No default. |
| remote_queue.sqs_smartbus.large_message_store.key_id | `<string>` | — | The ID for the primary key that KMS uses to generate a data key pair. The This setting is required if 'large_message_store.encryption_scheme' is Examples: alias/sqsssekeytrial, 23456789-abcd-1234-11aa-c50f99011223 No default. |
| remote_queue.sqs_smartbus.large_message_store.key_refresh_interval | `<string>` | `24h` | The time interval to refresh primary key. |

### Azure Storage Queue (ASQ) specific settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| remote_queue.asq.access_key | `<string>` | — | The access key to use when authenticating with the remote queue No default. |
| remote_queue.asq.secret_key | `<string>` | — | The secret key to use when authenticating with the remote queue No default. |
| remote_queue.asq.endpoint | `<string>` | — | The URL of the remote queue system supporting the ASQ API. Example: https://somestorage.queue.core.windows.net/ No default. |
| remote_queue.asq.retry_policy | `[max_count\|none]` | `"max_count"` | The retry policy to use for remote queue operations. A retry policy specifies whether and how to retry file operations that fail Retry policies: This setting is optional. |
| remote_queue.asq.max_count.max_retries_in_total | `<unsigned integer>` | `3` | When 'remote_queue.asq.retry_policy' is set to "max_count", sets the This setting is optional. |
| remote_queue.asq.renew_retries | `<unsigned integer>` | `50` | The number of retries for a particular message on a given indexer after |
| remote.asq.backoff.initial_delay | `<unsigned integer><unit>` | `4000ms (4s)` | Currently not supported. This setting is related to a feature that is If retries are enabled, a backoff interval is used to perform This setting specifies the delay between each retry. If "ms", "s", or "m" is not specified, the default unit is seconds. |
| remote.asq.backoff.max_retry_delay | `<unsigned integer><unit>` | `2*60*1000ms (120s)` | Currently not supported. This setting is related to a feature that is If retries are enabled, a backoff interval is used to perform This setting specifies the maximum delay before the next retry. If "ms", "s", or "m" is not specified, the default unit is seconds. |
| remote_queue.asq.message_receive_max_count | `<unsigned integer>` | `32` | The maximum number of messages, that are received from the This setting is optional. |
| remote_queue.asq.timeout.connect | `<unsigned integer>` | `5` | The connection timeout, in seconds, when interacting with This setting is optional. |
| remote_queue.asq.timeout.read | `<unsigned integer>` | `60` | Currently not supported. This setting is related to a feature that is The read timeout, in seconds, when interacting with ASQ for This setting is optional. |
| remote_queue.asq.timeout.write | `<unsigned integer>` | `60` | The write timeout, in seconds, when interacting with ASQ for This setting is optional. |
| remote_queue.asq.timeout.visibility | `<unsigned integer>` | `60` | The timeout, in seconds, to use when explicitly changing This setting is optional. |
| remote_queue.asq.executor_max_workers_count | `<positive integer>` | `4` | The maximum number of worker threads that can be used by A value of 0 is equivalent to 1. |
| remote_queue.asq.large_message_store.endpoint | `<string>` | — | The URL of the remote storage system supporting the Azure API. Example: https://somestorage.blob.core.windows.net/ No default. |
| remote_queue.asq.large_message_store.path | `<string>` | — | The remote storage location where messages that are larger than the If not specified, messages exceeding the underlying queue's maximum message For Microsoft Azure Blob storage, this is specified No default. |
| remote_queue.asq.large_message_store.container_name | `<string>` | — | Specifies the Azure container to use complying with Microsoft Azure This setting is optional. No default. |
| remote_queue.asq.large_message_store.sslVerifyServerCert | `<boolean>` | `false` | If set to true, the Splunk platform verifies the certificate |
| remote_queue.asq.large_message_store.sslVersions | `<comma-separated list>` | `tls1.2` | The list of TLS versions to use to connect to The versions available are "tls1.0", "tls1.1", and "tls1.2". The special version "*" selects all supported versions.  The version "tls" If a version is prefixed with "-" it is removed from the list. SSL versions 2 and 3 are always disabled. "-ssl2" and "-ssl3" are accepted |
| remote_queue.asq.large_message_store.sslRootCAPath | `<path>` | `[sslConfig/caCertFile] in server.conf` | Full path to the Certificate Authority (CA) certificate PEM format file |
| remote_queue.asq.large_message_store.cipherSuite | `<cipher suite string>` | `TLSv1+HIGH:TLSv1.2+HIGH:@STRENGTH` | If set, uses the specified cipher string for the SSL connection. If not set, uses the default cipher string. |
| remote_queue.asq.large_message_store.encryption_scheme | `azure-sse-kv \| azure-sse-ms \| azure-sse-c` | `azure-sse-ms` | The encryption scheme to use for containers that are currently being stored. azure-sse-kv: Maps to the Azure customer-managed keys in a key vault. azure-sse-ms: Maps to the Azure Microsoft-managed keys in Microsoft key store. azure-sse-c: Maps to the Azure customer-provided encryption keys in a Key Vault. |
| remote_queue.asq.large_message_store.azure-sse-kv.encryptionScope | `<string>` | — | Required if remote_queue.asq.large_message_store.encryption_scheme = azure-sse-kv Specifies the key used for encrypting blobs within the scope of this index. No default. |
| remote_queue.asq.large_message_store.azure-sse-c.key_type | `azure_kv` | `azure_kv` | The mechanism that a Splunk platform indexer uses to generate the key for Affects the 'azure-sse-c' encryption scheme only. The only valid value is "azure_kv", which indicates the Azure Key Vault You must also specify the required KMS settings: |
| remote_queue.asq.large_message_store.azure-sse-c.azure_kv.key_name | `<string>` | — | The Azure Key Vault key name for key encryption and decryption. Required if 'remote_queue.asq.large_message_store.encryption_scheme' has No default. |
| remote_queue.asq.large_message_store.azure-sse-c.azure_kv.endpoint | `<string>` | — | The Azure Key Vault endpoint. Required if 'remote_queue.asq.large_message_store.encryption_scheme' has Example: "https://<key-vault-name>.vault.azure.net/" No default. |
| remote_queue.asq.large_message_store.azure-sse-c.azure_kv.key_vault_tenant_id | `<string>` | — | The ID of the Azure Active Directory tenant for authenticating For more details about the tenant ID, check your Azure Active Directory subscription. Required only for client token-based authentication. No default. |
| remote_queue.asq.large_message_store.azure-sse-c.azure_kv.key_vault_client_id | `<string>` | — | Specifies the ID of the client, also called the application ID, which is the unique You can obtain the client ID for an application from the Azure Portal in the Required only for client token-based authentication. Optional for managed identity authentication. No default. |
| remote_queue.asq.large_message_store.azure-sse-c.azure_kv.key_vault_client_secret | `<string>` | — | Specifies the secret key to use when authenticating the Key Vault using the client_id. You generate the secret key through the Azure Portal. Required only for client token-based authentication. No default. |
| remote_queue.asq.fail_threshold_for_dlq | `<unsigned integer>` | `5` | This number denotes the number of times a message has to fail |

### Google publisher/subscriber (Pub/Sub) smartbus specific settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| remote_queue.gcs_smartbus.project_id | `<string>` | `not set` | The Google Cloud project ID where the Pub/Sub topic resides and This is required to authenticate and interact with the Pub/Sub API. |
| remote_queue.gcs_smartbus.large_message_store.path | `<string>` | `not set` | The path to the large message store. |
| remote_queue.gcs_smartbus.credential_file | `<string>` | — | Specifies the credential file that is used for Pub/Sub and large This file contains the service account credentials in JSON format. The service account must have the following roles: Pub/Sub Publisher Pub/Sub Subscriber Storage Object Admin This file must be located in $SPLUNK_HOME/etc/auth/ Example: credentials.json No default |
| remote_queue.gcs_smartbus.large_message_store.connectUsingIpVersion | `auto\|4-only\|6-only` | `auto` | Controls whether Splunk software makes outbound connections to the Connections to literal IPv4 or IPv6 addresses are unaffected by this A value of "4-only" means that splunkd only attempts to connect to the A value of "6-only" means that splunkd only attempts to connect to the A value of "auto" means: If '[general]/listenOnIPv6' in server.conf has a value of "only", Otherwise, this setting defaults to "4-only". |
| remote_queue.gcs_smartbus.large_message_store.sslVersionsForClient | `tls1.0\|tls1.1\|tls1.2` | — | — |
| remote_queue.gcs_smartbus.large_message_store.sslVersionsForClient | `tls1.0\|tls1.1\|tls1.2` | `tls1.2` | Defines the minimum SSL/TLS version to use for outgoing connections. |
| remote_queue.gcs_smartbus.large_message_store.sslVerifyServerCert | `<boolean>` | `false` | A value of "true" means that splunkd authenticates the certificate of |
| remote_queue.gcs_smartbus.large_message_store.sslVerifyServerName | `<boolean>` | `false` | Controls whether splunkd, as a client, performs a TLS hostname validation A TLS hostname validation check ensures that a client communicates with Specifically, the validation check forces splunkd to verify that the For this setting to have any effect, the 'sslVerifyServerCert' setting A value of "true" for this setting means that splunkd performs a TLS A value of "false" for this setting means that splunkd does not perform |
| remote_queue.gcs_smartbus.large_message_store.sslRootCAPath | `<path>` | `[sslConfig/caCertFile] in server.conf` | Full path to the Certificate Authority (CA) certificate PEM format file |
| remote_queue.gcs_smartbus.large_message_store.cipherSuite | `<cipher suite string>` | `TLSv1+HIGH:TLSv1.2+HIGH:@STRENGTH` | Uses the specified cipher string for the SSL connection. If this setting is not configured, splunkd uses the default cipher |
| remote_queue.gcs_smartbus.large_message_store.encryption | `gcp-sse-c\|gcp-sse-kms\|gcp-sse-gcp` | `gcp-sse-gcp` | The encryption scheme to use for index buckets while stored on Google A value of "gcp-sse-c" maps to Google Cloud Platform (GCP) A value of "gcp-sse-kms" maps to GCP customer-managed encryption keys. A value of "gcp-sse-gcp" maps to GCP Google-managed encryption keys. Google Cloud always encrypts the incoming data on the server side. For the "gcp-sse-kms" scheme, you must grant your Cloud Storage service |
| remote_queue.gcs_smartbus.large_message_store.gcp_kms.locations | `<string>` | — | Required if 'remote_queue.gcs_smartbus.large_message_store.encryption' Specifies the geographical regions where Key Management Service (KMS) Google Cloud offers three types of locations: regional locations such For best performance, choose a key ring and a key in the same location No default. |
| remote_queue.gcs_smartbus.large_message_store.gcp_kms.key_ring | `<string>` | — | Required if 'remote_queue.gcs_smartbus.large_message_store.encryption' Specifies the name of the key ring used for encryption when uploading In Google Cloud, a key ring is a grouping of keys for organizational No default. |
| remote_queue.gcs_smartbus.large_message_store.gcp_kms.key | `<string>` | — | Required if 'remote_queue.gcs_smartbus.large_message_store.encryption' Specifies the name of the encryption key used for uploading data to No default. |
| remote_queue.gcs_smartbus.large_message_store.encryption.gcp-sse-c.key_type | `gcp_kms` | `gcp_kms` | Affects only the "gcp-sse-c" encryption scheme. Identifies the mechanism the indexer uses to generate the key for The only valid value is "gcp_kms", which indicates Google Cloud Key You must also specify the following required Key Management Service (KMS) 'remote_queue.gcs_smartbus.large_message_store.gcp_kms.locations' 'remote_queue.gcs_smartbus.large_message_store.gcp_kms.key_ring' 'remote_queue.gcs_smartbus.large_message_store.gcp_kms.key' If you do not specify these settings, the indexer cannot start while |
| remote_queue.gcs_smartbus.large_message_store.encryption.gcp-sse-c.key_refresh_interval | `<unsigned integer>` | `86400` | Specifies the interval, in seconds, for generating a new key that is |
| remote_queue.gcs_smartbus.max_hold_time_option | `<number><unit>` | `10ms` | The maximum time that the publisher holds a message before it flushes If you do not provide a <unit> for this setting value, the Splunk Example: 1m (1 minute), 30s (30 seconds), 50ms (50 milliseconds), 10 (10 seconds) |
| remote_queue.gcs_smartbus.max_deadline_time_option | `<number><unit>` | `600` | The maximum amount of time that the subscriber can take to acknowledge a message. If the subscriber does not acknowledge the message before this time, the message If you do not provide a <unit> for this setting value, the Splunk Example: 1m (1 minute), 30s (30 seconds), 50ms (50 milliseconds), 10 (10 seconds) |
| remote_queue.gcs_smartbus.max_outstanding_messages_option | `<integer>` | `0 (unlimited)` | The maximum number of outstanding messages for the subscriber. |
| remote_queue.gcs_smartbus.max_concurrency_option | `<integer>` | `4` | The maximum number of gcs_smartbus Pub/Sub operations that can |
| remote_queue.gcs_smartbus.dead_letter_queue.name | `<string>` | — | The name of the subscription to the dead letter queue. Google Cloud Services Pub/Sub delivers messages that subscribers can't acknowledge |
| remote_queue.gcs_smartbus.dead_letter_queue.process_interval | `<number><unit>` | `1d` | The interval between processing of messages that have landed in the dead letter queue. If you do not provide a <unit> for this setting value, the Splunk Examples: 30s, 6h |

### Modular Inputs

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| python.version | `[default\|python\|python2\|python3\|python3.7\|python3.9\|latest]` | `Not set; uses the system-wide Python version.` | DEPRECATED. Use 'python.required' instead to specify which Python versions the For Python scripts only, selects which Python version to use. Either "default" or "python" select the system-wide default Python version. Set to "python3" or "python3.7" to use the Python 3.7 version. Set to "python3.9" to use the Python 3.9 version. In the context of configuring apps, the "latest" value is not currently Optional. |
| python.required | `<comma-separated list>` | `Not set.` | For Python scripts only, the versions of Python that the script supports. This setting takes precedence over the 'python.version' setting if both The Splunk platform selects the highest version of Python that is The following values are supported: "3.9": The script supports Python version 3.9. "3.13": The script supports Python version 3.13. "latest": The script uses the latest Python interpreter available. NOTE: The "latest" value is an internal value that is related to Splunk software runs modular input scripts in two phases: introspection During the introspection phase: If the stanza tha... |
| run_introspection | `<boolean>` | `true` | Whether or not Splunk software runs introspection on a modular input This setting applies only for modular inputs. It takes effect only if you A default stanza of a modular input scheme begins with the notation If set to "true", Splunk software runs introspection on a modular input If set to "false", Splunk software does not run introspection on a modular If introspection does not run for a scheme, then Splunk software does not Use the 'disabled' setting to enable or disable individual modular input scripts. For example, to turn introspection off for the modular input scheme "myScheme": |

### LOGD (logd input for macOS)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| logd-backtrace | `<boolean>` | `false` | Whether or not the logd input includes backtraces. A value of “true” means that the logd input includes backtraces |
| logd-debug | `<boolean>` | `false` | Whether or not the logd input includes "Debug" events. A value of “true” means that the logd input includes “Debug” level |
| logd-info | `<boolean>` | `true` | Whether or not the logd input includes "Info" events. A value of “true” means that the logd input includes “Info” |
| logd-loss | `<boolean>` | `false` | Whether or not the logd input includes message loss events. A value of “true” means that the logd input includes message loss events. |
| logd-signpost | `<boolean>` | `false` | Whether or not the logd input includes signposts. A value of “true” means that the logd input includes signpost events. |
| logd-predicate | `<string>` | `none` | Filters messages using the provided predicate, or filter expression, The input supports a single predicate, but the predicate can be a |
| logd-process | `<comma-separated list>` | `none` | The process ID on which to operate. You can supply multiple process IDs with commas, for example "220,221,223". |
| logd-source | `<boolean>` | `false` | Whether or not to include symbol names and source line numbers for |
| logd-include-fields | `<comma-separated list>` | `all` | The fields to retrieve from a logD record. |
| logd-exclude-fields | `<comma-separated list>` | `formatString,timestamp,timezoneName` | The fields to ignore when parsing a logD record Example setting: logd-exclude-fields = bootUUID,formatString |
| logd-interval | `<unsigned integer>` | `30` | How often, in seconds, that the input is to query logd for events, |
| logd-starttime | `<string>` | — | The earliest acceptable time for the input to query logd for events. Use the format "YYYY-MM-DD HH:MM:SS" to specify the timestamp. No default. |
| logd-freetext | `<string>` | — | reserved for future use |

### JOURNALD (journald input for Linux)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| journalctl-include-fields | `<string>` | `PRIORITY,_SYSTEMD_UNIT,_SYSTEMD_CGROUP,_TRANSPORT,_PID,_UID,` | This setting and the "journalctl-exclude-fields" setting control the fields The input selects most of the fields if they are in The exceptions are MESSAGE, CURSOR, and _REALTIME_TIMESTAMP. The system An empty 'journalctl-include-fields' value means to output all fields. If you want all fields except XYZ, leave 'journalctl-include-fields' empty, The input always retrieves the MESSAGE, __REALTIME_TIMESTAMP, and __CURSOR Fields __MONOTONIC_TIMESTAMP and __SOURCE_REALTIME_TIMESTAMP should always |
| journalctl-exclude-fields | `<comma-separated list>` | `__MONOTONIC_TIMESTAMP,__SOURCE_REALTIME_TIMESTAMP` | The fields to exclude. use this setting to filter which fields This filter is more computationally expensive than journalctl-output-fields, |
| journalctl-filter | `<string>` | `none` | These settings map directly to the arguments for the journalctl command. |
| journalctl-unit | `<string>` | `none` | Equivalent to ‘-u’ parameter of journalctl; show messages for the |
| journalctl-identifier | `<string>` | `none` | Equivalent to ‘-t’ parameter of journalctl; show messages for the |
| journalctl-priority | `<string>` | `7` | equivalent to ‘-p’ parameter of journalctl; filter output by message |
| journalctl-boot | `<string>` | `none` | Equivalent to ‘-b’ parameter of journalctl; messages from a specific boot |
| journalctl-facility | `<string>` | `none` | Equivalent to ‘--facility’ parameter of journalctl, syslog facility |
| journalctl-grep | `<string>` | `none` | Equivalent to ‘-g’ parameter of journalctl; filter output to entries |
| journalctl-user-unit | `<string>` | `none` | Equivalent to ‘--user-unit’ parameter of journalctl; show messages |
| journalctl-dmesg | `<boolean>` | `false` | Equivalent to ‘-k’ parameter of journalctl; show only kernel messages. |
| journalctl-quiet | `<boolean>` | `false` | Equivalent to ‘-q’ parameter of journalctl; suppress all informational |
| journalctl-freetext | `<string>` | — | reserved for future use |
