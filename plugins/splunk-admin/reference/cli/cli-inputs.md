# splunk inputs (monitor | tcp | udp | exec | oneshot)

CLI wrappers around **`inputs.conf`**-backed data collection—primary Splunk **forwarder** and **indexer ingestion** surface alongside UI configuration.

**Runs on:** **Forwarders** (UF/HF) and **indexers** / **standalone** accepting network inputs.

**Splunk Cloud:** Forwarders connecting to Cloud use these commands locally; Cloud ingest endpoints themselves are not configured via customer `./splunk` on SaaS nodes.

**Restart vs reload:** Many input mutations require **`splunk restart`**; some Windows-centric modules (`win-hostmon`, etc.) map to `splunk enable/disable perfmon|wmi|eventlog` per platform—see `./splunk help add`.

---

## splunk add monitor

Adds directory/file monitor stanza.

### Syntax

```bash
./splunk add monitor <path> [options]
```

### Example

```bash
./splunk add monitor /var/log/
```

### Options

See `./splunk help add monitor` for `-whitelist`, `-blacklist`, `-sourcetype`, `-index`, `-crcSalt`, `-recursive`, `-follow-only`, etc.

---

## splunk edit monitor

Adjusts existing monitor stanza.

### Syntax

```bash
./splunk edit monitor <path> [options]
```

### Example

```bash
./splunk edit monitor /var/log -follow-only true
```

---

## splunk list monitor | splunk remove monitor

```bash
./splunk list monitor
./splunk remove monitor <path>
```

---

## splunk add tcp | udp | splunk add tcp / udp variants

Network inputs (`splunktcp`, `splunktcp`, syslog UDP, etc.—depends on stanza choice).

### Syntax

```bash
./splunk add tcp <port>
./splunk add udp <port>
```

### Notes

- TLS forwarding listeners require additional flags (`-listen`, `-route` patterns)—consult `./splunk help add tcp`.

---

## splunk edit tcp | edit udp | list tcp | remove tcp ...

Symmetric patterns:

```bash
./splunk edit tcp <port> ...
./splunk list tcp
./splunk remove tcp <port>
```

---

## splunk add exec | edit exec | list exec | remove exec

Runs scripted inputs (`inputs.conf` `[script://]` semantics).

```bash
./splunk add exec ...
```

---

## splunk add oneshot

Indexes a single file once (useful for forensic replay).

### Syntax

```bash
./splunk add oneshot <filename> [options]
```

---

## splunk reload monitor | reload tcp | reload ...

Hot reload paths documented in Administrative CLI matrix:

```bash
./splunk reload monitor
./splunk reload tcp
./splunk reload udp
```

### Notes

- Reload availability depends on attribute—some changes still need restart.

---

## Platform-specific helpers

| Command | Purpose |
|---------|---------|
| `splunk enable perfmon` / `disable perfmon` | Windows performance monitors |
| `splunk enable eventlog` / `disable eventlog` | Windows Event Log collections |
| `splunk enable wmi` / `disable wmi` | WMI scripted inputs |
| `splunk list perfmon` / `list wmi` | Enumerate modules |

---

**Documentation:** Splunk **Getting Data In** manual, `./splunk help datastore`, `./splunk help forwarding`, [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
