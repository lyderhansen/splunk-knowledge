# splunk deployment server | deployment client

Manage **deployment server** reload operations and **deployment client** polling targets.

**Runs on:** **Deployment server** for `reload deploy-server`; **Deployment clients** (forwarders/universal forwarders/heavy forwarders) for `set deploy-poll` / `show deploy-poll`.

**Splunk Cloud:** Deployment Server patterns vary—many Cloud forwarder fleets use **Splunk Cloud Victoria Experience / Forwarder Setup** flows instead of classic DS—confirm architecture.

**Restart:** Class reload pushes usually avoid full restart; individual apps may still require restart based on content.

---

## splunk reload deploy-server

Reloads deployment server state so clients receive updated **serverclass** assignments.

### Syntax

```bash
./splunk reload deploy-server [-class <serverclass>]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-class <name>` | Reload only the specified **serverclass** | Reload **all** classes |

### Example

```bash
./splunk reload deploy-server
./splunk reload deploy-server -class my_serverclass
```

### Notes

- Run on the **deployment server** instance.

---

## splunk set deploy-poll

Points a deployment client at its deployment server URI.

### Syntax

```bash
./splunk set deploy-poll <host>:<management_port>
```

### Example

```bash
./splunk set deploy-poll bologna:1234
```

### Notes

- Uses management port of deployment server (not necessarily receiving port).

---

## splunk show deploy-poll

Displays which deployment server URI the client polls.

### Syntax

```bash
./splunk show deploy-poll
```

---

## splunk enable | disable deploy-client | deploy-server

Toggle deployment components per Administrative CLI command matrix.

### Syntax

```bash
./splunk enable deploy-client
./splunk disable deploy-client
./splunk enable deploy-server
./splunk disable deploy-server
```

### Notes

- Pair with `display deploy-client` / `display deploy-server` for status snapshots (`splunk help controls` family).

---

**Documentation:** Splunk **Updating Splunk Enterprise Instances** manual (deployment server), [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
