# sendalert — invoke a custom alert action

Source: Splunk Search Reference 8.2.12, page 507.

## Syntax

    | sendalert <alert-action-name> [param.<key>=<value>]...

## Examples

```spl
index=main action=deny | stats count by src | where count > 100
| sendalert slack_notify param.channel="#security" param.message="High deny count"
```

## See also

- `sendemail.md` — email alert
