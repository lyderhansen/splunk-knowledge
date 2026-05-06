
# restmap.conf

Registers Splunk REST namespaces—global authentication quirks, generic endpoint templates, scripted handlers, Extensible Administration Interface (`admin`) bindings, validation hooks, bundle upload helpers, REST replay policies, and Splunkbase proxies.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` or app `local/` trees |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | web.conf, server.conf |

## Stanzas and settings

Splunk documents `[global]` merging semantics identical to other `.conf` files.

### `[global]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `allowGetAuth` | boolean | false | Permits passing credentials via GET to `/services/authorization/login` (logs secrets). |
| `allowRestReplay` | boolean | false | Internal-only POST/PUT/DELETE replay across cluster nodes. |
| `defaultRestReplayStanza` | string | `restreplayshc` | Baseline stanza guiding REST replay wiring. |
| `pythonHandlerPath` | path | `$SPLUNK_HOME/bin/rest_handler.py` | Location of the bootstrap Python REST dispatcher. |
| `v1APIBlockGETSearchLaunch` | boolean | false | Blocks launching searches via GET on legacy v1 export/parser endpoints. |

### `[<rest endpoint name>:<endpoint description string>]`

Template stanza describing defaults inherited by concrete REST endpoint declarations.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `match` | path | none | Relative URI segment mounted beneath `/services`. |
| `requireAuthentication` | boolean | true | Controls whether Splunk session auth is mandatory. |
| `authKeyStanza` | string | none | Comma/space separated `server.conf` stanzas supplying pass4SymmKey material. |
| `restReplay` | boolean | false | Opt-in REST replay for this endpoint cluster. |
| `restReplayStanza` | string | empty | Overrides `[global]/defaultRestReplayStanza` selectively. |
| `capability` | expression | none | Capability expression enforced for every HTTP verb. |
| `capability.<post|delete|get|put>` | expression | none | Verb-specific capability guard. |
| `acceptFrom` | network list | `*` | Ordered allow/deny matrix for remote callers. |
| `includeInAccessLog` | boolean | true | Writes hits to `splunkd_access.log`. |
| `maxConcurrent` | `positive integer` \| `unlimited` | unlimited | Per-user concurrency ceiling returning HTTP 429 when exceeded. |
| `max_content_length` | size | inherits server.conf | Upper bound on REST payload size per handler cluster. |

### `[script:<uniqueName>]`

Registers arbitrary Python or persistent-connection handlers.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `scripttype` | string | `python` | `persist` routes through `persistconn/appserver.py`; otherwise ephemeral scripts. |
| `python.version` | enum | unset | Deprecated interpreter selector—use `python.required`. |
| `python.required` | CSV list | unset | Preferred Python versions (`3.9`, `3.13`, `latest`). |
| `handler` | module.class | none | `Script.Class` implementing `splunk.rest.BaseRestHandler`. |
| `script` | path | none | Alternate executable when `scripttype=python` without subclassing. |
| `script.arg.<N>` | string | none | Arguments forwarded to persistent drivers. |
| `script.param` | string | none | Opaque payload passed to persistent drivers. |
| `output_modes` | CSV | `xml` | Supported serializers (`json`, `xml`). |
| `passSystemAuth` | boolean | false | Attaches system-level auth tokens on each request. |
| `driver` | path | `persistconn/appserver.py` | Executable launching persistent script hosts. |
| `driver.arg.<n>` | string | none | Extra argv tokens for `driver`. |
| `driver.env.<name>` | string | none | Environment exports for `driver`. |
| `passConf` | boolean | true | Serializes this stanza into the payload for persistent handlers. |
| `passPayload` | `true` \| `false` \| `base64` | false | Embeds POST bodies raw or base64 for persistent handlers. |
| `passSession` | boolean | true | Passes session metadata/authtokens for persistent handlers. |
| `passHttpHeaders` | boolean | false | Forwards raw HTTP headers when using persistent connections. |
| `passHttpCookies` | boolean | false | Forwards HTTP cookies for persistent handlers. |
| `stream` | boolean | false | Streams payloads chunk-wise instead of single blob. |

### `[admin:<uniqueName>]`

Splunk Manager handler clusters exposing native CRUD endpoints.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `match` | string | none | Partial URL hosting Admin Manager handlers. |
| `members` | CSV | none | Registered child handlers exposed beneath `match`. |
| `maxCacheTime` | interval | `0` | HTTP cache TTL for responses (`60s`, `1h`, etc.). |
| `capability` | expression | none | Capability gate applied to every verb. |
| `capability.<post|delete|get|put>` | expression | none | Verb-specific capability gate. |
| `maxRestResults` | unsigned integer | `0` | Hard cap on REST rows returned (`0` disables cap). |
| `streamlineXmlSerialization` | boolean | true | Streams XML rows one-by-one to reduce memory. |

### `[admin_external:<uniqueName>]`

Registers supplemental Python-based EAI handlers (`external` type).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `handlertype` | string | `python` | Only Python external handlers are supported today. |
| `python.version` | enum | unset | Deprecated interpreter selector. |
| `python.required` | CSV list | unset | Supported Python versions. |
| `handlerfile` | filename | none | Python module placed under `bin/`. |
| `handlerpersistentmode` | boolean | false | Keeps handler resident between requests. |
| `passHttpHeaders` | boolean | false | Preview-only HTTP header passthrough. |
| `handleractions` | CSV | none | Allowed EAI verbs (`create`, `edit`, `list`, `delete`, `_reload`). |

### `[validation:<handler-name>]`

Adds save-time validation expressions keyed by `<field>` names.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<field>` | validation-rule | none | `validate()` expression guarding saves for `<handler-name>`. |

### `[eai:<EAI handler name>]`

Internal knobs influencing directory-service exposure.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `showInDirSvc` | boolean | false | Lists configs via directory service UI. |
| `desc` | string | none | Friendly label shown in directory listings. |

### `[input:...]`

Reserved input endpoints—additional keys mirror `[script]` semantics per Splunk defaults.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dynamic` | boolean | false | Listen on socket versus reading POST bodies; shares undocumented `[script]` fields. |

### `[peerupload:...]`

Defines extraction targets for knowledge-bundle uploads from peers.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `path` | path | none | Directory scanned for uploaded bundles. |
| `untar` | boolean | none | Automatically expands tar payloads after upload. |

### `[proxybundleupload:...]`

Locates proxy bundles uploaded from federated search heads.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `path` | path | none | Directory scanned for uploaded bundles. |
| `untar` | boolean | none | Automatically expands tar payloads after upload. |

### `[proxybundleuploadrshcluster:...]`

Same as proxy bundle uploads but scoped to remote SH clusters.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `path` | path | none | Directory scanned for uploaded bundles. |
| `untar` | boolean | none | Automatically expands tar payloads after upload. |

### `[restreplayshc]`

Internal replay routing configuration for search-head clusters.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `methods` | CSV | none | Replay-eligible verbs (`POST`, `PUT`, etc.). |
| `nodelists` | CSV | none | Replay strategies (`shc`, `nodes`, `filternodes`). |
| `nodes` | URI list | none | Explicit management URIs targeted by `nodes` strategy. |
| `filternodes` | URI list | none | Explicit URIs excluded after other strategies. |

### `[proxy:appsbrowser]`

Hard-coded Splunkbase browsing proxy endpoint.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `destination` | URL | `https://splunkbase.splunk.com/api` | Splunkbase Apps Browser upstream. |