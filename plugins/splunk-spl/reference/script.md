# script — invoke a custom external search command

Source: Splunk Search Reference 10.2.0. Alias: `run`.

> **CAUTION:** This command is considered risky by Splunk. It triggers SPL safeguards in Splunk Web. Scripts run with Splunk's OS permissions — only deploy trusted, reviewed code.

## Syntax

    | script <script-name> [<script-arg>...] [maxinputs=<int>]

`| script commandname` is equivalent to `| commandname` when the command is registered in `commands.conf`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `script-name` | Yes | — | Name of the custom search command as declared in `commands.conf` |
| `script-arg` | No | — | One or more arguments passed to the script; delimit with spaces |
| `maxinputs` | No | 50000 | Max results passed to the script per invocation; the command loops until all results are processed |

## Usage

- Scripts must be declared in `commands.conf` and placed in `$SPLUNK_HOME/etc/apps/<app_name>/bin/`.
- The explicit `python` or `perl` type argument (from earlier Splunk versions) is **ignored in 10.2** — language is determined by `commands.conf`.
- The `etc/searchscripts/` directory is no longer supported; commands must live in an app's `bin/` directory.
- In Splunk Cloud Platform, scripts must be in a private app; contact your Splunk representative if you need help.

## Examples

### Run a custom script with arguments

    ... | script myscript myarg1 myarg2
    | sendemail to=analyst@example.com

### Call a registered command directly (equivalent form)

    ... | myscript myarg1 myarg2

### Control batch size for memory-sensitive scripts

    index=large_data | script heavyprocessor maxinputs=1000

## Gotchas

- **Must be pre-configured in `commands.conf`** — calling an unregistered script name returns an error, not a helpful message about where to register it.
- **Python/Perl type argument is ignored** — `| script python myscript` is the same as `| script myscript` in 10.2; the language is set in `commands.conf` only.
- **SPL safeguards** — Splunk Web will warn users before running `script`; this is intentional security behavior.
- **`maxinputs` is batched** — the script is called repeatedly with up to `maxinputs` rows at a time; ensure your script handles partial inputs correctly.
- **Prefer custom search commands** — for new development, use the Splunk SDK to create a proper custom search command rather than relying on the `script` wrapper.

## See also

- `eval.md` — built-in computation functions (no external script needed)
- `sendemail.md` — common post-script action
