# splunk forward-server

Configure **forwarding** tier outputs—Splunk forwarders sending parsed/raw streams to receiving indexers/heavy forwarders.

**Runs on:** **Universal Forwarder**, **Heavy Forwarder**, or any node acting as forwarder.

**Splunk Cloud:** Customer-managed forwarders use these commands locally against Cloud ingress endpoints (often combined with **Splunk Cloud Setup App** guidance).

**Restart:** Many forwarding changes require **`splunk restart`**—confirm with `./splunk help add forward-server`.

---

## splunk add forward-server

Adds a receiving indexer or intermediate tier (`outputs.conf` semantics).

### Syntax

```bash
./splunk add forward-server <host>:<port> [options]
```

### Options

See `./splunk help add forward-server` for TLS (`-method ssl`), credential indexes, cloning, and weighted routing flags.

| Flag family | Description | Default |
|-------------|-------------|---------|
| `-auth` | Acting credentials | Prompt |
| TLS / cert flags | Pin certificates / SSL passwords when using encrypted forwarding | Plain TCP unless configured |

### Example

```bash
./splunk add forward-server idx01.example.com:9997
```

---

## splunk remove forward-server

Removes a forwarding target entry.

### Syntax

```bash
./splunk remove forward-server <host>:<port>
```

---

## splunk list forward-server

Lists configured forwarding destinations and statuses where exposed.

### Syntax

```bash
./splunk list forward-server
```

---

**Documentation:** Splunk **Forwarding Data** manual, `./splunk help forwarding`, [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
