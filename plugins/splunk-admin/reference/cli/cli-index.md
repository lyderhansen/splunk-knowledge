# splunk clean | rebuild | fsck | check-integrity | reload index | validate index | offline | rebalance cluster-data

Operate on **indexes**, **bucket integrity**, and **indexer maintenance** actions exposed via the Splunk CLI.

**Runs on:** Primarily **indexers** (standalone or clustered peers). Some commands require **cluster manager** context—called out per section.

**Splunk Cloud:** Core indexer administration is Splunk-operated; customer-facing CLI for indexes generally **does not apply** to Cloud SaaS indexer tiers—confirm Support guidance.

**Restart:** Many index/data operations require **`splunk restart`** or cluster rolling operations after completion—see notes.

---

## splunk clean

Removes classes of data or Splunk artifacts per object.

### Syntax

```bash
./splunk clean <object> [options]
```

### Objects & behavior

| Object | Description |
|--------|-------------|
| `all` | Broad destructive reset—use only with extreme caution (see `splunk help clean`). |
| `eventdata` | Removes indexed **event data** from disk for targeted contexts per CLI/help. |
| `globaldata` | Host/tags/source-type alias style **global knowledge** artifacts per Splunk terminology in Admin CLI topic. |
| `inputdata` | Input state/history artifacts per CLI/help (fishbucket-related mechanics may apply—confirm version-specific help). |
| `userdata` | User/account related local artifacts per CLI/help (destructive). |
| `kvstore` | KV Store data cleanup contexts per CLI/help (destructive). |

### Options

Run `./splunk help clean` for authoritative flags per object (common patterns include `-index`, confirmation switches, and `-f` style force depending on version).

### Example

```bash
./splunk clean eventdata
./splunk clean globaldata
```

### Notes

- **Irreversible**—take filesystem backups / snapshots first.
- On **indexer clusters**, coordinate with cluster manager procedures—avoid rogue peer-only wipes.

---

## splunk rebuild

Rebuilds index buckets or internal structures per CLI/help (version-specific).

### Syntax

```bash
./splunk rebuild [options]
```

### Options

See `./splunk help rebuild` for bucket paths, index selectors, and `-verify` / parallelism flags.

### Notes

- IO intensive—perform during maintenance windows.
- Often requires **splunk stopped** or **bucket offline** procedures per Splunk documentation for your release.

---

## splunk fsck

Filesystem consistency tooling for bucket repair operations (`repair`, `scan`, `clear-bloomfilter` objects per Administrative CLI table).

### Syntax

```bash
./splunk fsck [object] [options]
```

### Objects (per Splunk Admin CLI reference)

| Object | Purpose |
|--------|---------|
| `repair` | Repair damaged buckets / metadata inconsistencies per help output. |
| `scan` | Scan for problems without repair (mode dependent). |
| `clear-bloomfilter` | Clear bloom filters when troubleshooting specific bucket issues per enterprise guidance. |

### Options

See `./splunk help fsck` for bucket path arguments, index flags, and destructive confirmations.

### Notes

- Misuse can **destroy buckets**—coordinate with Splunk Support for production incidents.

---

## splunk check-integrity

Verifies integrity of an **index** or an explicit **bucket path**.

### Syntax

```bash
./splunk check-integrity -index <path_or_index> [options]
./splunk check-integrity -bucketPath <path_to_bucket> [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-index` | Index directory or configured index identifier per CLI/help | Required if not using `-bucketPath` |
| `-bucketPath` | Explicit bucket directory path | Alternative to `-index` |
| `-verbose` | More detailed integrity reporting | Off |

### Example

```bash
./splunk check-integrity -index $SPLUNK_HOME/var/lib/splunk/defaultdb/
./splunk check-integrity -bucketPath $SPLUNK_HOME/var/lib/splunk/defaultdb/db/...
```

### Notes

- Heavy disk read workload.

---

## splunk reload index

Reloads **indexes.conf** definitions without full restart when supported.

### Syntax

```bash
./splunk reload index [index_name]
```

### Options

| Argument | Description | Default |
|----------|-------------|---------|
| `[index_name]` | Specific index to reload | Omit to reload **all** indexes per Admin CLI examples |

### Example

```bash
./splunk reload index
./splunk reload index my_index
```

### Notes

- Not every index attribute is reloadable—some changes still require restart.

---

## splunk validate index

Validates index configuration and paths referenced by **indexes.conf**.

### Syntax

```bash
./splunk validate index <index_name>
```

### Example

```bash
./splunk validate index main
```

### Notes

- Complements `btool indexes list` reviews.

---

## splunk offline

Gracefully takes an **indexer peer** offline in clustered deployments.

### Syntax

```bash
./splunk offline [--enforce-counts]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--enforce-counts` | Wait until cluster satisfies replication/searchable counts before completing peer shutdown | Off |

### Example

```bash
./splunk offline
./splunk offline --enforce-counts
```

### Notes

- Run from the **peer**; cluster manager orchestrates primaries.
- Distinct from **`splunk stop`** on non-clustered hosts.

---

## splunk rebalance cluster-data

Starts or manages indexer cluster **data rebalance** operations.

### Syntax

```bash
./splunk rebalance cluster-data -action start [-index <idx>] [-max_runtime <minutes>]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-action` | Operation (e.g., `start`) | Required |
| `-index` | Limit rebalance to one index | All indexes |
| `-max_runtime` | Cap activity duration (minutes in Admin CLI examples) | Uncapped |

### Example

```bash
./splunk rebalance cluster-data -action start
./splunk rebalance cluster-data -action start -index _internal
./splunk rebalance cluster-data -action start -max_runtime 5
```

### Notes

- Invoke on **cluster manager** context per clustering manual.

---

**Documentation:** [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands), Splunk Manuals → **Managing Indexes and Clusters** (cluster specifics).
