# script — run external script

Source: Splunk Search Reference 8.2.12, page 489. Alias: `run`.

## Syntax

    | script <script-type> <script-name> [<args>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| script-type | yes | — | `python` or `perl` |
| script-name | yes | — | Name of the script (must be configured in `commands.conf`) |

## Gotchas

- **Must be pre-configured:** Scripts must be registered in `commands.conf` before they can be called.
- **Security risk:** External commands run with Splunk's permissions. Only use trusted scripts.

## See also

- `eval.md` — built-in computation (preferred over external scripts)
