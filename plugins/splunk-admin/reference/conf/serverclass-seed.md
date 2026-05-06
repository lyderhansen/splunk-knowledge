# serverclass.seed.xml.conf

XML seed consumed by the deployment client during first-time bootstrap (placed under `deploymentclient.conf`’s `workingDir`). It mirrors deployment-server XML payloads so peers can preload apps before fully enrolling.

**Source version:** Splunk Enterprise 10.2

**Documentation note:** Splunk publishes this page as `Serverclassseedxmlconf`. Earlier `Serverclassseedconf` URLs 404.

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/var/run` working directory (per `deploymentclient.conf`) unless relocated |
| Pipeline phase | N/A |
| Restart required | Yes (first boot / seeding path) |
| Related files | serverclass.conf, deploymentclient.conf |

## Document structure and settings

XML comments in the official spec describe behavior; the actionable nodes are summarized below.

### Root `<deployment>`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `name` attribute | string | none | Logical name for this seeded deployment descriptor. |

### Child `<endpoint>` (deployment-wide)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| body text | URL template | `$deploymentServerUri$/services/streams/deployment?name=$serviceClassName$:$appName$` | Default download URI template for every app unless overridden deeper in the tree. |

### Child `<repositoryLocation>` (deployment-wide)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| body text | path | `$SPLUNK_HOME/etc/apps` | Filesystem location where downloaded apps are expanded on the client. |

### `<serviceClass>` (spec) / `<serverClass>` (examples)

The specification snippet labels this node `<serviceClass name="...">`, while shipped examples use `<serverClass name="...">`; treat them as equivalent deployment-class containers.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `name` attribute | string | none | Identifier for this server class block inside the seed file. |
| `<order>` body | integer string | none | Relative ordering used when processing multiple classes. |
| `<repositoryLocation>` body | path | inherits deployment default | Overrides install directory for apps tied to this class. |
| `<endpoint>` body | URL template | inherits deployment default | Overrides download URI template for this class’s apps. |
| `<continueMatching>` body | boolean string | true | Mirrors `serverclass.conf` semantics controlling layered class evaluation. |
| `<restartSplunkWeb>` body | boolean string | false | Mirrors serverclass restart directives after deployment. |
| `<restartSplunkd>` body | boolean string | false | Mirrors whether splunkd restarts after delivery. |
| `<stateOnClient>` body | enabled \| disabled \| noop | enabled | Forces enabled/disabled state or leaves it untouched (`noop`). |

### Nested `<app>` under each class

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `name` attribute | string | none | Target application name matching deployment payloads. |
| `<endpoint>` body | URL template | inherits parent | Optional per-app download URI overriding class-level templates. |
| `<repositoryLocation>` body | path | inherits parent | Example files show per-app install roots when non-standard layouts are required. |
