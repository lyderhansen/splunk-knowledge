# splunk set | splunk show | splunk validate

View and persist core Splunk **runtime configuration knobs** (ports, server names, datastore paths) and run validation helpers.

**Runs on:** Any Splunk Enterprise instance; **cluster bundle validation** targets **manager / deployer** roles.

**Splunk Cloud:** Limited—customer-managed forwarders only for local `set/show`.

**Restart:** Changing ports or server identity commonly requires **`splunk restart`**—called out per setting in Splunk docs/help.

---

## splunk set

Writes persisted settings for named objects (subset from Administrative CLI reference).

### Syntax

```bash
./splunk set <object> <value | flags...>
```

### Objects (Admin CLI table)

| Object | Purpose |
|--------|---------|
| `datastore-dir` | KV/index datastore directory adjustments per CLI/help |
| `deploy-poll` | Deployment client polling target (**also documented under cli-deploy**) |
| `default-hostname` | Default host field value contexts per help |
| `default-index` | Default index for generated events |
| `indexing-ready` | Administrative readiness bit (`splunk set indexing-ready`) |
| `minfreemb` | Minimum free MB guard behaviors per help |
| `servername` | Splunk server name (`server.conf`) |
| `server-type` | Role hints where applicable |
| `splunkd-port` | Management port |
| `web-port` | Splunk Web port |
| `kvstore-port` | KV Store listener port |

### Example

```bash
./splunk set servername idx01.example.com
./splunk set splunkd-port 8089
./splunk set web-port 8000
./splunk set deploy-poll ds.example.com:8089
./splunk set indexing-ready
```

### Notes

- Many settings mirror **REST** endpoints documented in REST Reference Manual.

---

## splunk show

Displays current configuration values for objects.

### Syntax

```bash
./splunk show <object>
```

### Objects (Admin CLI table highlights)

| Object | Purpose |
|--------|---------|
| `config` | Summarized configuration/debug output per help |
| `cluster-bundle-status` | Indexer cluster bundle push status |
| `datastore-dir` | KV/index datastore directory |
| `deploy-poll` | Deployment client poll URI (**cli-deploy**) |
| `default-hostname` | Default hostname configuration |
| `default-index` | Default index selection |
| `jobs` | Running search jobs snapshot |
| `minfreemb` | Disk guard thresholds |
| `servername` | Configured server name |
| `splunkd-port` | Management port |
| `web-port` | Web port |
| `kvstore-port` | KV Store port |
| `kvstore-status` | KV Store health |
| `shcluster-kvmigration-status` | KV migration progress for SHC |

### Example

```bash
./splunk show deploy-poll
./splunk show servername
./splunk show cluster-bundle-status
```

---

## splunk validate files

Validates **Splunk installation file integrity** (separate from `btool check`).

### Syntax

```bash
./splunk validate files [options]
```

### Notes

- Referenced from Administrative CLI commands cross-link to **Check the integrity of your Splunk software files**.

---

## splunk validate cluster-bundle

Validates an indexer cluster configuration bundle prior to application.

### Syntax

```bash
./splunk validate cluster-bundle [options]
```

### Notes

- Operational counterpart to **`splunk apply cluster-bundle`**—see **cli-cluster**.

---

## splunk validate index

Documented in **cli-index** (`splunk validate index <name>`).

---

**Documentation:** [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands), [Get help with the CLI](https://docs.splunk.com/Documentation/Splunk/latest/Admin/GethelpwiththeCLI).
