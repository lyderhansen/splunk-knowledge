# splunk miscellaneous CLI

Catch-all reference for **general-purpose** Splunk CLI verbs not covered in specialized topics—version/help, import/export, migrations, spool, andSupport-oriented **`splunk cmd`** utilities.

**Runs on:** Component-dependent—each subcommand locally relevant.

**Splunk Cloud:** Mostly **Enterprise forwarders / hybrid** only.

---

## splunk version

Prints Splunk build/version metadata.

### Syntax

```bash
./splunk version
```

### Notes

- Useful in scripted health checks alongside `$SPLUNK_HOME`.

---

## splunk help

Gateway to consolidated CLI documentation slices.

### Syntax

```bash
./splunk help
./splunk help commands
./splunk help clustering
./splunk help controls
./splunk help datastore
./splunk help index
./splunk help distributed
./splunk help forwarding
./splunk help search
./splunk help rtsearch
./splunk help search-commands
./splunk help search-fields
./splunk help search-modifiers
```

### Notes

- Multi-word topics use **dashes** (`search-commands`), not spaces.

---

## splunk login | logout

Credential cache—see **cli-user**.

---

## splunk find

If present in your build, provides filesystem/configuration discovery helpers (topic varies by version).

### Syntax

```bash
./splunk find [options]
```

### Notes

- Verify availability via `./splunk help find`—not enumerated in every Administrative CLI matrix snapshot.

---

## splunk validate (cross-reference)

- `splunk validate index` → **cli-index**
- `splunk validate files` → **cli-config**
- `splunk validate cluster-bundle` → **cli-config** / **cli-cluster**
- `splunk validate-passwd` → **cli-user**

---

## splunk export

Exports Splunk datasets for migration/support workflows.

### Syntax

```bash
./splunk export eventdata [options]
./splunk export userdata [options]
```

### Example (Administrative CLI topic)

```bash
./splunk export eventdata \
  -index my_apache_data \
  -dir /tmp/apache_raw_404_logs \
  -host localhost \
  -terms "404 html"
```

### Notes

- Heavy disk IO—plan capacity.

---

## splunk import userdata

Imports exported user objects.

### Syntax

```bash
./splunk import userdata -dir /tmp/export.dat
```

---

## splunk migrate kvstore-storage-engine

Migrates KV Store underlying storage engine (e.g., migration toward WiredTiger contexts).

### Syntax

```bash
./splunk migrate kvstore-storage-engine --target-engine wiredTiger
```

### Notes

- Often requires maintenance windows and backups.

---

## splunk start-shcluster-migration kvstore

KV Store migration orchestration for SHC:

```bash
./splunk start-shcluster-migration kvstore -storageEngine wiredTiger
./splunk start-shcluster-migration kvstore -storageEngine wiredTiger -isDryRun
```

---

## splunk spool

Filesystem spooling helper referenced in Administrative CLI matrix—see `./splunk help spool` for version semantics.

---

## splunk cmd \<utility\>

Runs binaries under `$SPLUNK_HOME/bin` with Splunk-provided environment (`splunk envvars` lists exports).

### Syntax

```bash
./splunk cmd /bin/ls
./splunk cmd locktest
./splunk cmd splunkd rest ...
```

### Bundled utilities (Administrative CLI matrix sample)

| Utility | Purpose |
|---------|---------|
| `btprobe` | Fishbucket / bucket probe tooling (**shutdown Splunk first** per docs) |
| `classify` | Classification experiments |
| `locktest` | Locking regression helper |
| `locktool` | Lock diagnostics |
| `pcregextest` | Regex validation |
| `searchtest` | Search pipeline testing harness |
| `signtool` | Signing helper |
| `toCsv` | Transform helper |
| `toSrs` | Transform helper |
| `tsidxprobe` | TSIDX inspection |
| `walklex` | Lexicon walking |

### Notes

- Splunk warns many **`splunk cmd`** tools require **Support guidance** before use.

---

**Documentation:** [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands), [Command line tools for use with Support](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/CommandlinetoolsforusewithSupport), [Get help with the CLI](https://docs.splunk.com/Documentation/Splunk/latest/Admin/GethelpwiththeCLI).
