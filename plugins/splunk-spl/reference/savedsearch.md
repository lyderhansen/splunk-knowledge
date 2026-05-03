# savedsearch — run a saved search by name and return its results

Source: Splunk Search Reference 10.2.0.

## Syntax

    | savedsearch <savedsearch_name> [nosubstitution=<bool>] [<field>=<string>...]

`savedsearch` is a generating command — it must appear at the start of a search with a leading pipe.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `savedsearch_name` | Yes | — | Exact name of the saved search (report) to run |
| `nosubstitution` | No | `false` | If `true`, disable all `$placeholder$` string substitution in the saved search |
| `field=string` | No | — | Key-value pairs to substitute for `$field$` placeholders in the saved search |

## Usage

- `savedsearch` always runs a **new search** — it does not reuse cached results. Use `loadjob` to retrieve results from a previous run.
- Permissions are applied from the **calling user's role**, not the saved search owner's role — even if the saved search is set to run as the report owner.
- **Time range override**: if you select a specific time range in the picker, it overrides the time range saved with the search. If you select "All Time", the saved search's own time range is used.
- Supports Federated Search: use `federated:<provider>_<dataset>` as the name to run a federated search.

## Examples

### Run a saved search by name

    | savedsearch mysecurityquery

### Run with string substitution

    | savedsearch "Daily Report" region="us-west" env="prod"

### Disable substitution (run saved search literally)

    | savedsearch parameterized_report nosubstitution=true

### Chain results into further analysis

    | savedsearch "Top 100 IPs by Traffic"
    | where bytes > 1000000
    | sort -bytes

## Gotchas

- **Always runs a new search** — `savedsearch` re-executes the query; for scheduled reports, use `loadjob` to retrieve the last cached result without rerunning.
- **Permissions follow the caller** — even if the saved search owner has broader permissions, the search runs with the calling user's role restrictions.
- **Placeholder mismatch error** — if the saved search contains `$replace_me$` and you do not provide a replacement, Splunk returns "Error while replacing variable name".
- **Time range behavior** — selecting "All Time" uses the search's saved time range; any other picker value overrides it. This is a common source of unexpected results.
- **Generating command** — must be the first command in the search pipeline.

## See also

- `loadjob.md` — retrieve cached results from a previous search run
- `from.md` — alternative dataset access syntax
- `search.md` — run ad-hoc searches
