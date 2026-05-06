# splunk app lifecycle (install | remove | package | display | enable | disable | create | edit)

Install, package, inspect, and toggle Splunk **apps** and **add-ons** from the CLI—mirrors common REST operations without `curl`.

**Runs on:** Any instance with writable `$SPLUNK_HOME/etc/apps` (typically **search heads**, **standalone**, **heavy forwarders with local apps**, **deployment server** staging—follow deployment architecture).

**Splunk Cloud:** App installation is constrained by Cloud vetting/upload workflows; arbitrary `./splunk install app` on Cloud SaaS hosts generally **does not apply**.

**Restart:** Many app changes require **`splunk restart`** or reload endpoints—especially Python modular inputs or modular alerts.

---

## splunk install app

Installs an app from **`.tar`**, **`.tgz`**, **`.spl`**, or Splunk bundle format per CLI/help.

### Syntax

```bash
./splunk install app <path_or_url> [options]
```

### Options

Run `./splunk help install app` for flags such as:

| Flag | Description | Default |
|------|-------------|---------|
| `-auth`, `-uri`, `-owner`, `-app` | Universal / namespace controls | Local defaults |
| `-update` / `-overwrite` style flags | Replace existing app versions when supported | Per help |
| Flags updating **prefix / NA** options | Enterprise changes between releases | See help |

### Example

```bash
./splunk install app /tmp/foo.tgz
./splunk install app foo.tar
```

---

## splunk remove app

Removes an installed application directory/metadata.

### Syntax

```bash
./splunk remove app <app_name>
```

### Example

```bash
./splunk remove app unix
```

### Notes

- Removing active TAs can break data flows—verify inputs first.

---

## splunk package app

Exports an app subtree into an installable archive—essential for **Splunkbase packaging** and migration.

### Syntax

```bash
./splunk package app <app_name> [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-merge-local-meta true` | Merge `local.meta` into `default.meta` before packaging | `false` |
| `-exclude-local-meta true` | Exclude `local.meta` from bundle | `false` |

### Example

```bash
./splunk package app stubby
./splunk package app stubby -merge-local-meta true
./splunk package app stubby -exclude-local-meta true
```

### Notes

- Shipping **`local.meta`** can fail **AppInspect**—prefer documented meta merge/exclude flags.

---

## splunk display app

Shows enabled/disabled status and metadata for installed apps.

### Syntax

```bash
./splunk display app [app_name]
```

### Example

```bash
./splunk display app
./splunk display app unix
```

---

## splunk enable app | splunk disable app

Toggle whether Splunk loads an app at startup/reload.

### Syntax

```bash
./splunk enable app <app_name>
./splunk disable app <app_name>
```

### Notes

- Distinct from OS-level permissions—this is Splunk’s internal disabled flag in `app.conf` mechanics.

---

## splunk create app

Creates a new app skeleton from a template.

### Syntax

```bash
./splunk create app <app_name> -template <template_name>
```

### Example

```bash
./splunk create app myNewApp -template sample_app
```

---

## splunk edit app

Modifies app-level configuration objects exposed via CLI (see `./splunk help edit app`).

### Syntax

```bash
./splunk edit app <app_name> [options]
```

---

**Documentation:** [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands), Splunk Developer docs for app packaging.
