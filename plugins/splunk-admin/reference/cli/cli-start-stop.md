# splunk start | stop | restart | status

Control the Splunk Enterprise platform processes (`splunkd`, and optionally the legacy `splunkweb` object) and verify whether they are running.

**Runs on:** Any Splunk Enterprise instance where the CLI is installed (full instance, heavy forwarder, universal forwarder for applicable controls—UF has a reduced control surface).

**Splunk Cloud:** Customer-managed heavy/universal forwarders use these commands locally. Splunk-operated Cloud stack nodes are **not** administered with your local `./splunk` binary.

**Restart impact:** `restart` cycles Splunk processes; in-flight searches and indexing pause according to component role and deployment policies.

---

## splunk start

Starts Splunk Enterprise processes.

### Syntax

```bash
./splunk start [<object>] [options]
```

Common forms:

```bash
./splunk start
./splunk start splunkd
./splunk start splunkweb
```

### Options

| Flag / argument | Description | Default |
|-----------------|-------------|---------|
| `splunkd` | Start only the Splunk daemon (core server process). | If omitted, start behavior follows CLI/help defaults for your version (typically `splunkd`). |
| `splunkweb` | Legacy object for the old standalone Splunk Web process; modern Enterprise bundles Splunk Web into `splunkd`. Only relevant on architectures/releases where still documented. | N/A |
| `--accept-license` | Accept license on first start / scripted installs. | Not accepted until prompted or flagged. |
| `--answer-yes` | Auto-answer affirmative prompts (dangerous in production unless understood). | Prompt |
| `--no-prompt` | Non-interactive; combine with seed/password options only when documented for install bootstrap. | Interactive |
| `--seed-passwd <password>` | Set admin password at start (security-sensitive—history/process listing); prefer `user-seed.conf` or `HASHED_PASSWORD`. | None |
| `--gen-and-print-passwd` | Generate random admin password and print it at startup (security-sensitive). | Off |

Universal parameters may apply where documented (see `splunk help`); see also **cli-config** / **cli-misc** for boot-start.

### Example

```bash
cd $SPLUNK_HOME/bin
./splunk start
```

### Notes

- On **Windows**, run from an elevated prompt when installing services; starting/stopping can also use `NET START splunkd` / `NET STOP splunkd`.
- On **\*nix**, use `$SPLUNK_HOME/bin/splunk`. If **boot-start** or **systemd** is configured, prefer `splunkd service start` / `systemctl start Splunkd.service` so the correct service user is used.
- Current Splunk Enterprise releases normally run **one** primary service/process (`splunkd`) that serves Splunk Web; older docs referenced separate `splunkweb`.

---

## splunk stop

Stops Splunk Enterprise processes cleanly.

### Syntax

```bash
./splunk stop [<object>]
```

Examples:

```bash
./splunk stop
./splunk stop splunkd
./splunk stop splunkweb
```

### Options

| Flag / argument | Description | Default |
|-----------------|-------------|---------|
| `splunkd` | Stop the Splunk daemon. | Typical target |
| `splunkweb` | Stop legacy Splunk Web process where applicable. | N/A |

### Example

```bash
./splunk stop
```

### Notes

- Requires appropriate OS permissions for the Splunk service account.
- Scheduled searches, inputs, and indexing halt while stopped.

---

## splunk restart

Restarts Splunk Enterprise processes (stop then start).

### Syntax

```bash
./splunk restart [<object>]
```

Examples:

```bash
./splunk restart
./splunk restart splunkd
```

### Options

| Flag / argument | Description | Default |
|-----------------|-------------|---------|
| `splunkd` | Restart Splunk daemon. | Typical |
| `splunkweb` | Restart legacy Splunk Web where applicable. | N/A |
| Same non-interactive/license flags as `start` | Where applicable for scripted restarts. | Off |

### Example

```bash
./splunk restart
```

### Notes

- Also available from **Splunk Web**: **Settings → Server controls → Restart Splunk** (requires admin).
- Clustered deployments often prefer **rolling restart** patterns (`splunk rolling-restart …`) instead of simultaneous restarts across many peers.

---

## splunk status

Reports whether Splunk processes are running (prints PID information for `splunkd`).

### Syntax

```bash
./splunk status [<object>]
```

Examples:

```bash
./splunk status
./splunk status splunkd
./splunk status splunkweb
```

### Options

| Flag / argument | Description | Default |
|-----------------|-------------|---------|
| `splunkd` | Show status for Splunk daemon. | Typical |
| `splunkweb` | Show legacy Splunk Web status where applicable. | N/A |

### Example

```bash
./splunk status
```

### Notes

- Alternative checks: `ps aux | grep splunkd` (\*nix), `Get-Process splunkd` (Windows PowerShell).
- Does **not** replace HTTP(S) health checks for load balancers or KV store health—use monitoring or REST endpoints as appropriate.

---

**Documentation:** [Start and stop Splunk Enterprise](https://docs.splunk.com/Documentation/Splunk/latest/Admin/StartSplunk), [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands), [Get help with the CLI](https://docs.splunk.com/Documentation/Splunk/latest/Admin/GethelpwiththeCLI).
