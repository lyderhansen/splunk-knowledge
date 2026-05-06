# splunk indexer clustering

CLI operations for **Splunk indexer clustering**—manager + peer coordination, bundle pushes, maintenance windows, and peer evacuation.

**Runs on:** **Cluster manager (CM)** for bundle/maintenance/rebalance commands; **peer nodes** for `offline`, `edit cluster-config`, etc.

**Splunk Cloud:** Not applicable to Splunk-operated indexer infrastructure.

**Restart:** Bundle pushes may trigger **rolling restarts**—plan search/quarantine windows.

---

## splunk apply cluster-bundle

Applies validated configuration/apps bundle to indexer cluster peers.

### Syntax

```bash
./splunk apply cluster-bundle [--skip-validation]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--skip-validation` | Skip bundle validation on manager/peers (dangerous—only when directed) | Validation enabled |

### Example

```bash
./splunk apply cluster-bundle
./splunk apply cluster-bundle --skip-validation
```

### Notes

- Manager-side command.

---

## splunk rollback cluster-bundle

Rolls back to the prior peer bundle snapshot.

### Syntax

```bash
./splunk rollback cluster-bundle
```

### Notes

- Invoke from **cluster manager** per Administrative CLI examples.

---

## splunk validate cluster-bundle

Validates bundle prior to apply—see **cli-config**.

---

## splunk show cluster-bundle-status

Shows bundle push progress/errors.

### Syntax

```bash
./splunk show cluster-bundle-status
```

---

## splunk rolling-restart cluster-peers

Performs indexer cluster **rolling restart** of peers per clustering guidance.

### Syntax

```bash
./splunk rolling-restart cluster-peers [options]
```

### Notes

- Confirm searchable rolling restart options in Managing Indexers manual for your release (`-searchable true` style flags appear in newer docs—verify via `./splunk help rolling-restart`).

---

## splunk enable maintenance-mode | splunk disable maintenance-mode

Places indexer peers into maintenance for administrative operations.

### Syntax

```bash
./splunk enable maintenance-mode
./splunk disable maintenance-mode
```

### Notes

- **Must run on cluster manager** per Administrative CLI topic.

---

## splunk offline

Peer evacuation—see **cli-index**.

---

## splunk rebalance cluster-data

Data rebalance—see **cli-index**.

---

## splunk cluster-manager-redundancy

High availability behaviors when redundant cluster managers are configured.

### Syntax examples

```bash
./splunk cluster-manager-redundancy -show-status
./splunk cluster-manager-redundancy -switch-mode active
./splunk cluster-manager-redundancy -switch-mode standby
```

### Options

| Flag | Description |
|------|-------------|
| `-show-status` | Display redundancy mode status |
| `-switch-mode active|standby` | Promote/demote HA role |

---

## splunk add cluster-manager | splunk remove cluster-manager

Registers or removes cluster manager URIs for search heads connecting to multi-site/manager lists.

### Syntax

```bash
./splunk add cluster-manager -secret <secret> -multisite false -uri https://127.0.0.1:8089
./splunk remove cluster-manager -secret <secret>
```

### Notes

- Coordinates with **pass4SymmKey** / security schemes documented in Distributed Search manual.

---

## splunk edit cluster-config | splunk list cluster-*

Peer/manager configuration introspection (`cluster-config`, `cluster-peers`, `cluster-generation`, `cluster-buckets`, `excess-buckets`, etc.—see `./splunk help clustering`).

### Examples

```bash
./splunk edit cluster-config -mode peer -site site2
./splunk list cluster-peers
```

---

**Documentation:** Splunk **Managing Indexers and Clusters of Indexers** manual, `./splunk help clustering`, [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
