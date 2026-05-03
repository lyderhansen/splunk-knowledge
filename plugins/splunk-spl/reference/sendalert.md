# sendalert — invoke a custom alert action from a search

Source: Splunk Search Reference 10.2.0

## Syntax

    | sendalert <alert_action_name>
        [results_link=<url>]
        [results_path=<path>]
        [param.<name>=<"value">]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `alert_action_name` | Yes | — | Name of the alert action as registered in `alert_actions.conf` |
| `results_link` | No | — | URL to the search results page to include in the alert payload |
| `results_path` | No | — | Filesystem path to the results file to hand to the alert script |
| `param.<name>` | No | — | Arbitrary key-value pairs passed through to the alert action script; e.g. `param.channel="#ops"` |

## Description

`sendalert` gathers configuration from `alert_actions.conf` and the current search context, performs token replacement, then executes the registered alert action script, handing the payload via STDIN. The alert script has a `maxtime` timeout (default 5 minutes) controlled by `alert_actions.conf`.

Results are stored as `results.csv.gz` in the dispatch directory before being passed to the script. The format is controlled by the `forceCsvResults` setting in `alert_actions.conf`.

**Capability required:** `run_sendalert`

## Examples

### Invoke a custom action with no extra parameters

    index=main action=deny
    | stats count by src
    | where count > 100
    | sendalert myaction

### Trigger a chat notification with custom parameters

    index=security sourcetype=ids
    | stats count by signature
    | where count > 50
    | sendalert hipchat param.room="SecOps" param.message="High IDS hit count detected"

### Send to ServiceNow with severity and assignment

    index=web sourcetype=access_combined status>=500
    | stats count by host
    | where count > 10
    | sendalert servicenow
        param.severity="3"
        param.assigned_to="WebOps"
        param.short_description="HTTP 5xx spike on $host$"

## Gotchas

- **RISKY command** — `sendalert` triggers SPL safeguards in Splunk. It may require explicit acknowledgment in the UI before running in ad hoc searches.
- **Multiple invocations in ad hoc searches** — when used in an ad hoc search, preview re-runs the pipeline on the Statistics tab. This causes `sendalert` to fire multiple times. Disable preview or test in a saved/scheduled search context.
- **Script timeout** — if the alert action script runs longer than the configured `maxtime` (default 5 min), Splunk terminates it. Ensure external integrations are responsive or increase `maxtime` in `alert_actions.conf`.
- **Results format** — the results file is CSV (not SRS binary). Alert scripts should parse CSV, not raw SRS format.

## Tips

- Test custom alert actions safely by first pointing to a mock/logging endpoint before wiring to production integrations.
- Use `param.*` keys that match the tokens defined in your `alert_actions.conf` `param.*` defaults to avoid undefined token surprises.

## See also

- `sendemail.md` — built-in email alert action
- `collect.md` — write results to a summary index instead of triggering an external action
