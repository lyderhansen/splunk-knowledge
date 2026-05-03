# sendemail — email search results

Source: Splunk Search Reference 10.2.0

**Risky command:** triggers SPL safeguards. Requires `schedule_search` and `list_settings`
capabilities. An external SMTP server must be configured — Splunk does not include one.

## Syntax

    | sendemail to=<email_list>
        [from=<email_list>]
        [cc=<email_list>] [bcc=<email_list>]
        [subject=<string>] [message=<string>]
        [sendresults=<bool>] [inline=<bool>]
        [format=csv | table | raw]
        [sendcsv=<bool>] [sendpdf=<bool>] [sendpng=<bool>]
        [content_type=html | plain]
        [priority=highest | high | normal | low | lowest]
        [server=<host>[:<port>]] [use_ssl=<bool>] [use_tls=<bool>]
        [graceful=<bool>]
        [footer=<string>]
        [maxinputs=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `to` | Yes | — | Comma-separated recipient addresses (quoted) |
| `from` | No | `splunk@<hostname>` | Sender address |
| `subject` | No | `"Splunk Results"` | Email subject line |
| `message` | No | (auto) | Body text; depends on `sendresults` and attachment flags |
| `sendresults` | No | false | Include results in email |
| `inline` | No | false | Put results in body (true) vs. as attachment (false) |
| `format` | No | table | Format for inline results: `csv`, `table`, or `raw` |
| `sendcsv` | No | false | Attach results as CSV file |
| `sendpdf` | No | false | Attach results as PDF |
| `sendpng` | No | false | Attach Dashboard Studio PNG (Dashboard Studio only) |
| `content_type` | No | html | Email body format: `html` or `plain` |
| `server` | No | localhost | SMTP host and optional port |
| `use_ssl` | No | false | Use SSL; requires `server=<host>:<port>` |
| `use_tls` | No | false | Use STARTTLS |
| `graceful` | No | false | If true, suppress errors and continue pipeline on failure |
| `maxinputs` | No | 50000 | Max result rows sent per invocation |
| `priority` | No | normal | Email priority flag seen by client |

## Examples

### Send inline table results

    index=main | stats count by sourcetype
    | sendemail to="ops@example.com" subject="Daily sourcetype counts" sendresults=true

### Attach CSV, use external SMTP

    index=security | stats count by action, src
    | sendemail to="security@example.com,soc@example.com"
        subject="Security summary"
        server=mail.example.com
        sendcsv=true

### Dynamic recipient and message via eval

    | makeresults
    | eval dest="oncall@example.com"
    | eval msg="Alert triggered at " + strftime(now(), "%Y-%m-%d %H:%M")
    | sendemail to="$result.dest$" message="$result.msg$" sendresults=false

## Gotchas

- **SMTP must be pre-configured** — `alert_actions.conf` must have a valid `[email]` stanza.
  The `server=` argument overrides the config but must still resolve to a reachable host.
- **`use_ssl=true` requires explicit port** — write `server=mail.example.com:465`, not just
  the hostname. SSL and TLS are mutually exclusive; use one or the other.
- **Curly braces break token substitution** — rename fields that contain `{` or `}` before
  using them as `$result.fieldname$` tokens; `sendemail` cannot interpret them.
- **`allowed_domains` restricts recipients** — an admin-configured domain allowlist on the
  Email Settings page may silently block delivery to external addresses.
- **Risky command safeguard** — on some Splunk Cloud deployments the command is disabled
  or sandboxed. Check your deployment policy before relying on it in alerts.

## Tips

- Use `graceful=true` in scheduled searches so a transient SMTP failure does not kill the
  entire pipeline or suppress subsequent alert actions.
- `sendpng=true` is only meaningful when called from Dashboard Studio; it has no effect
  in standard search pipelines.

## See also

- `sendalert.md` — trigger custom alert action scripts
- `collect.md` — write results to a summary index instead of emailing
