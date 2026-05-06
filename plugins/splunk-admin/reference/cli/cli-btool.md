# splunk btool

Inspect and validate merged Splunk **`.conf`** configuration as Splunk software resolves **layered configuration** from multiple directories and apps—the primary CLI tool for answering “what value wins?” and “why won’t this stanza parse?”.

**Runs on:** Any Splunk Enterprise installation with `$SPLUNK_HOME/bin` (forwarders, indexers, search heads, deployers, cluster managers). Universal Forwarder includes `btool`.

**Splunk Cloud:** Not used on Splunk-operated Cloud search tiers; **customer-managed forwarders** use `btool` locally.

**Support status:** Official docs note **btool is unsupported** yet **highly relied upon** for troubleshooting; output is routinely collected in **diag** bundles.

**Restart:** `btool` reads **on-disk** configuration only. It shows pending edits immediately even when Splunk has **not** restarted—those edits may not yet be active in memory.

---

## Why btool matters

- Splunk merges many copies of the same file (`system/default`, `system/local`, `apps/*/default`, `apps/*/local`, users, cluster bundles, etc.). **`splunk btool <conf> list`** prints the **effective merged result** in precedence order.
- **`--debug`** annotates **which physical file** contributed each setting—essential for debugging precedence mistakes.
- **`splunk btool check`** catches many **`typo in stanza`** / structural problems surfaced during startup.

**Important limitation:** btool **does not display the `[default]` stanza** of **`inputs.conf`** per Splunk documentation.

---

## splunk btool \<conf\> list

Shows merged configuration for a single `.conf` **prefix** (filename without `.conf`), for example `inputs`, `props`, `server`, `indexes`.

### Syntax

```bash
./splunk btool [--app=<app_name>] [--user=<user_name>] [--dir=<DIR>] <conf_prefix> list [stanza_prefix] [--debug]
```

Equivalent forms (Windows):

```bash
splunk btool [--app=<app_name>] <conf_prefix> list [stanza_prefix]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--app=<SPLUNK_APP>` | Limit visibility to configuration visible from the specified **app context**. Does **not** fully emulate Splunk metadata inheritance; inherited-app settings can be **misreported**. | All apps merged globally |
| `--user=<SPLUNK_USER>` | Limit visibility to the specified **user** context. **Must** be paired with `--app`. Does **not** evaluate knowledge-object permissions. | Not set |
| `--dir=<DIR>` | Read configuration under an absolute path instead of `$SPLUNK_HOME/etc`. | `$SPLUNK_HOME/etc` |
| `--debug` | Print **file provenance** (which path supplied each setting) and extra diagnostic logging. | Off |
| `<conf_prefix>` | Configuration file name **without** `.conf` (`inputs`, `props`, `transforms`, `authorize`, …). | Required |
| `list` | Subcommand to emit merged configuration. | Required |
| `[stanza_prefix]` | Optional filter to stanzas whose names match the prefix (string match behavior per implementation—use with `grep`/`findstr` for precise filtering). | All stanzas |

### Examples

```bash
./splunk btool inputs list
./splunk btool --app=search props list
./splunk btool inputs list --debug
./splunk btool props list --app=search --debug
./splunk btool inputs list | grep splunktcp
splunk btool inputs list --debug | findstr splunktcp
```

### Notes

- Only **one** conf prefix per invocation—search across files with OS tools or multiple invocations.
- If the OS user **cannot read** a `.conf` path, those settings are **omitted** silently from output.
- Compare output to **running** behavior with REST or introspection when diagnosing **reload vs restart** issues.

---

## splunk btool check

Validates configuration files for errors such as malformed stanzas—often the fastest follow-up when Splunk logs **`typo in stanza`** during startup.

### Syntax

```bash
./splunk btool check [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--app=<SPLUNK_APP>` | Same meaning as `list` (app-scoped view). | Global |
| `--user=<SPLUNK_USER>` | Same constraints as `list` (**requires** `--app`). | Not set |
| `--dir=<DIR>` | Alternate configuration root. | `$SPLUNK_HOME/etc` |
| `--debug` | Extra diagnostics / logging. | Off |

### Example

```bash
./splunk btool check
./splunk btool check --debug
```

### Notes

- Fixes validated here still often require **`splunk restart`** or a targeted **`splunk reload`** (see inputs/index docs) to become active—`btool` does not reload anything.

---

## splunk btool \<conf\> add

Creates configuration via btool’s helper path (advanced; prefer normal `.conf` editors for routine work).

### Syntax

```bash
./splunk btool [--app=<app_name>] <conf_prefix> add
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--app=<app_name>` | Target app context for the write operation when applicable. | Not set |
| `<conf_prefix>` | Conf file prefix (`inputs`, `props`, …). | Required |

### Notes

- Prefer managing files under `etc/system/local` or app `local/` with version control; use `add` only when you understand side effects on your workflow.

---

## splunk btool delete

Deletes stanzas or attributes via btool (destructive—use with caution).

### Syntax

```bash
./splunk btool --app=<app_name> --user=<user_name> <conf_prefix> delete <stanza_name> [attribute_name]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--app=<app_name>` | **Required** context pairing when using `--user`, and required form for this subcommand’s documented usage. | Must be set per docs |
| `--user=<user_name>` | User scope for delete operations when specified. | Optional |
| `<conf_prefix>` | Conf prefix. | Required |
| `delete` | Subcommand. | Required |
| `<stanza_name>` | Stanza to delete. | Required |
| `[attribute_name]` | If provided, delete single attribute instead of entire stanza (behavior per version—confirm with `splunk help btool`). | Optional |

### Notes

- Take backups before destructive CLI edits.

---

## Practical troubleshooting workflows

1. **Find effective TCP input:** `./splunk btool inputs list --debug | grep -i splunktcp`
2. **Prove precedence for a sourcetype:** `./splunk btool props list --debug | grep -A2 "\[my_sourcetype\]"`
3. **Validate before restart after bulk edits:** `./splunk btool check`
4. **Capture evidence for Support:** include `btool` excerpts inside a **`splunk diag`** bundle.

---

## Related precedence reading

Layer merge rules (default vs local, app vs user, cluster bundle overlays) are documented under **Configuration file precedence**.

---

**Documentation:** [Use btool to troubleshoot configurations](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/Usebtooltotroubleshootconfigurations) (canonical; replaces retired `Aboutbtool` / `Btlolidx` URLs), [Command line tools for use with Support — btool](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/CommandlinetoolsforusewithSupport), [Configuration file precedence](https://docs.splunk.com/Documentation/Splunk/latest/Admin/Wheretofindtheconfigurationfiles).

**Alternate URLs attempted:** `…/Troubleshooting/Btlolidx` and `…/Admin/Aboutbtool` **404** as of fetch—use **`Usebtooltotroubleshootconfigurations`** instead.
