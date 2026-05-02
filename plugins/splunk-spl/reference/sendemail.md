# sendemail — email search results

Source: Splunk Search Reference 8.2.12, page 509.

## Syntax

    | sendemail to=<email> [cc=<email>] [bcc=<email>] [subject=<string>] [message=<string>] [sendresults=<bool>] [inline=<bool>] [format=<csv|table|raw>] [sendpdf=<bool>] [sendcsv=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| to | yes | — | Recipient email address(es) |
| subject | no | "Splunk Results" | Email subject |
| sendresults | no | false | Include results in email body |
| sendpdf | no | false | Attach results as PDF |
| sendcsv | no | false | Attach results as CSV |

## Examples

```spl
index=main | stats count by sourcetype
| sendemail to="admin@example.com" subject="Daily Report" sendcsv=true
```

## Gotchas

- **Requires email server config:** SMTP must be configured in `alert_actions.conf`.

## See also

- `sendalert.md` — custom alert actions
