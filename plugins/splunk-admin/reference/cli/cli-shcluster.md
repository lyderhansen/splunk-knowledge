# splunk search head clustering (SHC)

CLI workflows for **Search Head Cluster** deployers and members—bundle pushes, captain bootstrap, replication recovery, and rolling restarts.

**Runs on:** **Deployer** for `apply shcluster-bundle`; **SHC members / captain** for `show shcluster-status`, `bootstrap`, `resync`, `rolling-restart`.

**Splunk Cloud:** Customer SHC patterns differ—confirm entitlement.

**Restart:** Bundle pushes may defer restart (`-action stage`, `-action send`)—rolling restart from captain completes activation.

---

## splunk show shcluster-status

Displays captain/member health flags (`service_ready_flag`, replication artifacts).

### Syntax

```bash
./splunk show shcluster-status [--verbose]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--verbose` | Extended replication detail | Off |

### Example

```bash
./splunk show shcluster-status --verbose
```

---

## splunk apply shcluster-bundle

Pushes deployer-staged configuration bundles to the cluster.

### Syntax

```bash
./splunk apply shcluster-bundle \
  -target <URI>:<management_port> \
  -auth <user>:<password> \
  [--answer-yes] \
  [--force true] \
  [-preserve-lookups true] \
  [-action stage|send|...]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-target` | Captain/member management URI target per docs | Required |
| `-auth` | Credentials with deploy rights | Required |
| `--answer-yes` | Skip interactive confirmation prompts | Prompt |
| `--force true` | Force push when conflicts detected (dangerous) | `false` |
| `-preserve-lookups true` | Preserve populated lookups during push when configured | App.conf deployer lookup push mode interacts |
| `-action stage` | Stage bundle without completing push lifecycle | Multi-phase workflows |
| `-action send` | Send staged bundle | Pair with `stage` |

### Examples

```bash
splunk apply shcluster-bundle -target https://shc-captain:8089 -auth admin:changeme
splunk apply shcluster-bundle --answer-yes -target https://shc-captain:8089 -auth admin:pass
splunk apply shcluster-bundle -target https://shc-captain:8089 -action stage && \
  splunk apply shcluster-bundle -target https://shc-captain:8089 -action send
splunk apply shcluster-bundle --answer-yes -force true -target https://shc-captain:8089 -auth admin:pass
splunk apply shcluster-bundle -target https://shc-captain:8089 -preserve-lookups true -auth admin:pass
```

### Notes

- After `stage && send`, if restart was deferred, members may need **`splunk rolling-restart shcluster-members`** from captain.

---

## splunk list shcluster-bundle

Lists bundle synchronization details from a member viewpoint.

### Syntax

```bash
./splunk list shcluster-bundle -member_uri <URI>:<port> -auth <user>:<pass>
```

---

## splunk rolling-restart shcluster-members

Executes SHC rolling restart (captain orchestration).

### Syntax

```bash
./splunk rolling-restart shcluster-members [options]
```

### Notes

- Run from **captain** per Distributed Search manual excerpts.

---

## splunk bootstrap shcluster-captain

Initializes captaincy / cluster baseline during SHC formation (exact flags vary—always confirm `./splunk help clustering`).

### Syntax

```bash
./splunk bootstrap shcluster-captain [options]
```

### Notes

- Typically includes secret keys and peer lists—follow Splunk SHC installation docs for your release.

---

## splunk resync shcluster-replicated-config

Forces configuration replication recovery when members drift.

### Syntax

```bash
./splunk resync shcluster-replicated-config [options]
```

### Notes

- Potentially disruptive—use during documented recovery scenarios.

---

## Related commands

- `splunk edit shcluster-config`, `splunk list shcluster-*` objects—see `./splunk help clustering`.

---

**Documentation:** [Deploy a configuration bundle (SHC)](https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/PropagateSHCconfigurationchanges), `./splunk help clustering`, [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
