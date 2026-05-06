# Audit trail: `audit.log` and `_audit`

What Splunk records for security and operations auditing, how it relates to saved searches and dispatch, and compliance-oriented search patterns.

## Overview

`audit.log` captures user-driven actions (logins, configuration changes, lookups, searches). It is the **only** log file from `$SPLUNK_HOME/var/log/splunk/` indexed into **`_audit`**. Use it to correlate a saved search name with `search_id` and then pivot to dispatch directories or `scheduler.log`.

**Roles:** Search heads and instances where REST/UI actions occur; indexers for forwarded audit depending on deployment.

## Key concepts

- **Index:** Always search explicitly: `index=_audit`.
- **Correlation:** `audit.log` ties **`savedsearch_name`** ↔ **`search_id`** ↔ user/time — use `search_id` when digging into `$SPLUNK_HOME/var/run/splunk/dispatch/<sid>/`.
- **Splunk Cloud / Enterprise 9.0+:** The SPL `audit` command is **deprecated** (disabled in Splunk Cloud 8.2.2203 and Enterprise 9.0.0+); prefer searching `_audit` directly rather than relying on `| audit`.
- **Signing / tamper detection:** Legacy `audit` command documentation mentions validating signed audit trails — for modern deployments follow current Securing Splunk guidance for audit features enabled in your version.

## Diagnostic steps

1. Confirm role can search `_audit`.
2. Locate authentication failures or privilege changes before broader incidents.
3. For “scheduled search didn’t run”: filter `action=search` (or equivalent audit fields in your version) and inspect `savedsearch_name`, `user`, `search_id`.
4. Cross-check `scheduler.log` on the search head for the same window.

## Common patterns / errors

| Pattern | Meaning | Fix |
|---------|---------|-----|
| Repeated login failures for one user | Credential lockout / scripted auth failure | Verify IdP/password; check `authentication.conf` / proxy |
| Missing expected audit events | Forwarding/filtering of `_audit` or logging level | Ensure `_audit` not excluded; verify SH is generating audit |

## Useful SPL queries

```spl
index=_audit action=search NOT debug
| stats count by user, app, savedsearch_name
```

```spl
index=_audit (fail* OR error OR denied)
| sort - _time
| head 100
```

```spl
index=_audit savedsearch_name="*" search_id=*
| sort - _time
| head 50
```

## Related

- [ts-internal-logs.md](ts-internal-logs.md)
- [ts-splunkd-log.md](ts-splunkd-log.md)
- [ts-search-performance.md](ts-search-performance.md)
- [ts-spl-diagnostics.md](ts-spl-diagnostics.md)

## Official documentation

- [What Splunk software logs about itself](https://docs.splunk.com/Documentation/Splunk/latest/Troubleshooting/WhatSplunklogsaboutitself) (audit.log row)
- [audit command](https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Audit) — deprecated; read header warning
