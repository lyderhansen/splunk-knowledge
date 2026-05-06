---
name: sa-cli
description: Splunk CLI command reference — every splunk subcommand with flags, syntax, and gotchas. Covers start/stop, btool, search, indexing, clustering, deployment, user management, and diagnostics. Use when the user asks about running splunk commands, CLI syntax, btool debugging, or any shell-level Splunk administration.
---

# Splunk CLI Reference

## How to use
- For specific command details: find the command group in the index below and read the reference file
- All commands assume `$SPLUNK_HOME/bin` is in PATH (or prefix with `$SPLUNK_HOME/bin/splunk`)
- Run `splunk help <command>` on your instance for build-specific flag availability

## Silent-fail traps

1. **btool list vs btool check** — `btool list` shows merged config; `btool check` validates syntax. They serve completely different purposes. Use `list` to see what Splunk sees, use `check` to find typos
2. **btool requires --debug** — Without `--debug`, btool shows values but NOT which file they came from. Always use `splunk btool <conf> list --debug` to trace precedence
3. **btool only reads filesystem** — btool reads .conf files on disk; it does NOT show runtime state, KV store lookups, or REST-modified settings. For runtime truth, use the REST API
4. **restart vs reload** — `splunk restart` restarts all of splunkd. For most conf changes, `splunk reload <object>` is sufficient and avoids downtime (e.g., `splunk reload deploy-server`)
5. **clean eventdata is destructive** — `splunk clean eventdata` permanently deletes ALL indexed data. There is no undo. Always specify `-index <name>` to scope it
6. **CLI user commands vs REST** — `splunk add user` creates local users only. For LDAP/SAML users, configure via authentication.conf or REST API
7. **apply cluster-bundle blocks** — `splunk apply cluster-bundle` on the cluster manager pushes config to all peers. If validation fails, the entire bundle is rejected. Always `--validate` first
8. **rolling-restart requires manager** — `splunk rolling-restart cluster-peers` must run on the cluster manager, not individual peers
9. **search from CLI is synchronous** — `splunk search "..."` blocks until complete and returns results to stdout. For long searches, use REST API with async dispatch instead
10. **diag captures sensitive data** — `splunk diag` includes conf files that may contain passwords. Use `splunk anonymize` before sharing with support
11. **Cloud CLI is limited** — Most CLI commands are unavailable on Splunk Cloud managed infrastructure. Use REST API or Splunk Web instead
12. **splunk validate then restart** — Always run `splunk btool check` BEFORE restart. A bad conf file can prevent splunkd from starting

## btool quick reference (most important debugging tool)

### See merged config for any .conf file
```bash
splunk btool props list --debug
splunk btool transforms list --debug
splunk btool inputs list --debug --app=my_app
```

### Check for syntax errors across all conf files
```bash
splunk btool check
```

### See effective value for a specific stanza
```bash
splunk btool props list my_sourcetype --debug
```

### Compare what two apps contribute
```bash
splunk btool props list --debug | grep -E '(my_app|other_app)'
```

### Common btool gotcha
btool reads from `$SPLUNK_HOME/etc/` — if you edited a file but haven't saved, btool won't see it. If you used REST to change a setting, it's in `local/` and btool WILL see it.

## Restart vs reload decision matrix

| Change type | Command | Downtime |
|-------------|---------|----------|
| props.conf, transforms.conf | `splunk reload <sourcetype>` or wait | None |
| inputs.conf (new input) | Restart required | Brief |
| outputs.conf | Restart required | Brief |
| server.conf | Restart required | Brief |
| savedsearches.conf | No restart needed | None |
| authorize.conf | `splunk reload auth` | None |
| authentication.conf | Restart required | Brief |
| deployment server apps | `splunk reload deploy-server` | None |
| Cluster bundle | `splunk apply cluster-bundle` | Rolling (peers) |
| SHC config | `splunk apply shcluster-bundle` | Rolling (members) |

## Complete CLI command index

### Start, Stop, Restart
| File | Commands |
|------|----------|
| `cli-start-stop.md` | `start`, `stop`, `restart`, `status` |

### Configuration Debugging
| File | Commands |
|------|----------|
| `cli-btool.md` | `btool list`, `btool check`, `btool list --debug`, `btool check --debug` |

### Search
| File | Commands |
|------|----------|
| `cli-search.md` | `search`, `dispatch` |

### Indexing
| File | Commands |
|------|----------|
| `cli-index.md` | `clean eventdata`, `clean userdata`, `clean all`, `rebuild`, `fsck`, `repair`, `export eventdata`, `import eventdata`, `train`, `creatediag` |

### User Management
| File | Commands |
|------|----------|
| `cli-user.md` | `add user`, `edit user`, `remove user`, `list user`, `change-password`, `add role`, `edit role`, `remove role`, `list role` |

### App Management
| File | Commands |
|------|----------|
| `cli-app.md` | `install app`, `remove app`, `package app`, `display app`, `enable app`, `disable app`, `list app` |

### Server Configuration
| File | Commands |
|------|----------|
| `cli-config.md` | `set servername`, `set default-hostname`, `set datastore-dir`, `show config`, `validate` |

### Forwarding
| File | Commands |
|------|----------|
| `cli-forward.md` | `add forward-server`, `remove forward-server`, `list forward-server` |

### Deployment
| File | Commands |
|------|----------|
| `cli-deploy.md` | `reload deploy-server`, `set deploy-poll`, `show deploy-poll`, `enable deploy-client` |

### Data Inputs
| File | Commands |
|------|----------|
| `cli-inputs.md` | `add monitor`, `add tcp`, `add udp`, `add exec`, `add oneshot`, `edit`, `remove`, `list`, `reload` for each input type |

### Licensing
| File | Commands |
|------|----------|
| `cli-license.md` | `add licenses`, `remove licenses`, `list licenses`, `edit licenser-localslave`, `list licenser-pools` |

### SSL/TLS
| File | Commands |
|------|----------|
| `cli-ssl.md` | `createssl server-cert`, `enable web-ssl`, `disable web-ssl` |

### Indexer Clustering
| File | Commands |
|------|----------|
| `cli-cluster.md` | `show cluster-status`, `apply cluster-bundle`, `validate cluster-bundle`, `rolling-restart cluster-peers`, `offline`, `enable maintenance-mode`, `disable maintenance-mode`, `show cluster-bundle-status`, `list cluster-config`, `edit cluster-config` |

### Search Head Clustering
| File | Commands |
|------|----------|
| `cli-shcluster.md` | `show shcluster-status`, `bootstrap shcluster-captain`, `apply shcluster-bundle`, `rolling-restart shcluster-members`, `resync shcluster-replicated-config`, `transfer shcluster-captain` |

### Diagnostics
| File | Commands |
|------|----------|
| `cli-diag.md` | `diag`, `anonymize` |

### Miscellaneous
| File | Commands |
|------|----------|
| `cli-misc.md` | `version`, `help`, `login`, `logout`, `find`, `spool`, `tcp`, `udp` and other utility commands |
