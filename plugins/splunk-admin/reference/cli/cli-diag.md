# splunk diag | splunk anonymize

Produce **support diagnostics** (`diag` tarballs) and scrub sensitive samples (`anonymize`) before sharing logs outside your organization.

**Runs on:** Full Splunk Enterprise instances and heavy components; **Universal Forwarder:** remote diag collection **not supported**; **diag upload** **not supported** on UF per Splunk docs.

**Splunk Cloud:** Diag generation in Splunk Web targets permitted remote roles (MC / SH / clustered indexer / CM); Cloud SaaS restrictions apply—see Generate a diagnostic file topic.

**Restart:** Neither command requires restart; anonymize writes **new files** alongside sources.

---

## splunk diag

Collects configurations, logs, index metadata listings (not raw indexed events), REST snapshots (`rest` component), and platform introspection into **`diag-<timestamp>.tar.gz`** under **`$SPLUNK_HOME`**.

### Syntax

```bash
./splunk diag [options]
```

### Core options

| Flag | Description | Default |
|------|-------------|---------|
| `--exclude "<glob>"` | Exclude path patterns from archive; repeatable; recorded in `excluded_filelist.txt` | None |
| `--collect=<list>` | Comma-separated component list—**overrides** prior enable/disable choices | Built-in defaults |
| `--enable=<component>` | Add one component to gather list | Defaults |
| `--disable=<component>` | Remove one component from gather list | Defaults |
| `--include-lookups` | Include lookup CSV/dat files excluded since 6.5 defaults | Lookups excluded |
| `--etc-filesize-limit=<KB>` | Skip `etc` files larger than limit; `0` disables filter | 10240 (10 MB) per docs |
| `--index-files=<level>` | `manifests` or `full` (manifests + metadata files) | `manifests` |
| `--index-listing=<level>` | `light` (hot buckets only) or `full` (all buckets) | `light` |
| `--log-age=<days>` | Skip logs older than N days; `0` disables | `60` |
| `--all-dumps=<policy>` | Gather Windows `.dmp` crash dumps beyond default cap | Default gathers ≤3 dumps |
| `--log-filesize-limit=<size>` | Tail-capture threshold for huge logs | Default `1 GB` per docs |
| `--filter-searchstrings` | Redact search terms in `audit.log` / `remote_searches.log` | Default-on behavior tied to server.conf |
| `--no-filter-searchstrings` | Do not modify those logs | Opposite |
| `-uri "https://host:8089"` | Pull diag from **remote** Enterprise instance (prompts for creds); limited flag set | Local collection |

### Remote collection constraints

Per Splunk documentation, remote diag supports a reduced option surface—commonly **`--basename`**, **`--all-dumps`**, and **`--exclude`** when tuning component inclusion/exclusion remotely.

### Upload flags

| Flag | Description | Default |
|------|-------------|---------|
| `--upload` | Build diag then upload to Splunk Support case | Off |
| `--upload-file=<file.tar.gz>` | Upload existing artifact (≤ **5 GB**) | N/A |
| `--case-number=<id>` | Target case number (e.g. `200500`) | Prompt |
| `--upload-user=<splunkid_user>` | **splunk.com** username (**not** email—no `@domain`) | Prompt |
| `--upload-description="<text>"` | Upload memo visible to Support | Prompt |
| `--firstchunk=<n>` | Resume multi-part upload after failure | Auto |
| `--chunksize=<bytes>` | Chunk size (default **100000000** ≈ 100MB) | 100MB |

### Components (`--collect`, `--enable`, `--disable`)

| Component | Description |
|-----------|-------------|
| `conf_replication_summary` | SHC replication summary directory listing |
| `consensus` | SHC `_raft` consensus files |
| `dispatch` | Dispatch directories (can be large) |
| `etc` | Entire `$SPLUNK_HOME/etc` configuration tree |
| `file_validate` | Latest file integrity validation output |
| `index_files` | Bucket manifests / metadata (not raw events) |
| `index_listing` | Directory listings / sizing metadata recorded into `systeminfo.txt` |
| `kvstore` | KV Store filesystem listing |
| `log` | `$SPLUNK_HOME/var/log/**` |
| `openssl3` | FIPS / OpenSSL dual-mode configuration artifacts |
| `pool` | Legacy search-head pooling shared storage |
| `rest` | REST endpoint dumps into XML ( **off by default** ) |
| `searchpeers` | Search peer bundles replicated onto indexers |
| `app:<appname>` | Optional diag extensions shipped by apps |

### Examples

```bash
./splunk diag
./splunk diag --exclude "*/passwd"
./splunk diag --exclude "*/passwd" --exclude "*/dispatch/*"
./splunk diag --collect=log,etc
./splunk diag --disable=dispatch
./splunk diag --disable=dispatch --disable=pool
./splunk diag --upload --case-number=200500 --upload-user=mylogin --upload-description="Post-upgrade crash"
./splunk diag --uri https://splunkserver.example.com:8089
```

### Notes

- Requires OS permissions to read `$SPLUNK_HOME`.
- Override defaults persist via **`server.conf [diag]`** stanza (`EXCLUDE-<class>` patterns, etc.).
- Review tarball before upload—lookup tables may contain sensitive business data even when passwords are stripped.

---

## splunk anonymize file

Rewrites a sample log/event file to replace identifiers (IPs, emails, account tokens) with fictional tokens of similar shape.

### Syntax

```bash
./splunk anonymize file -source <filename> \
  [-public_terms <file>] \
  [-private_terms <file>] \
  [-name_terms <file>] \
  [-dictionary <file>] \
  [-timestamp_config <file>]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-source <filename>` | Input path | Required |
| `-public_terms <file>` | Words **never** scrubbed (local appendix to dictionary) | `$SPLUNK_HOME/etc/anonymizer/public-terms.txt` |
| `-private_terms <file>` | Words **always** scrubbed when encountered | `$SPLUNK_HOME/etc/anonymizer/private-terms.txt` |
| `-name_terms <file>` | Candidate personal names used as replacements | `$SPLUNK_HOME/etc/anonymizer/names.txt` |
| `-dictionary <file>` | Global dictionary of common safe words | `$SPLUNK_HOME/etc/anonymizer/dictionary.txt` |
| `-timestamp_config <file>` | Timestamp parsing rules | `$SPLUNK_HOME/etc/anonymizer/anonymizer-time.ini` |

### Outputs (same directory as `-source`)

| File | Purpose |
|------|---------|
| `ANON-<original>` | Scrubbed payload |
| `INFO-mapping.txt` | Replacement mapping audit trail |
| `INFO-suggestions.txt` | Terms you may want to add to public/private lists |

### Example

```bash
./splunk anonymize file -source /tmp/messages
./splunk anonymize file -source /tmp/messages -name_terms $SPLUNK_HOME/bin/Mynames.txt
```

### Notes

- Always copy inputs to `/tmp` (or Windows `%TEMP%`) first.

---

**Documentation:** [Generate a diagnostic file](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Generateadiag), [Anonymize data samples to send to Support](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/AnonymizedatasamplestosendtoSupport), [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
