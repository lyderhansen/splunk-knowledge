# loadjob — load results from a previous search job

Source: Splunk Search Reference 8.2.12, page 372.

## Syntax

    | loadjob <sid> | loadjob savedsearch="<owner>:<app>:<name>" [events=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| sid | option 1 | — | Search job ID |
| savedsearch | option 2 | — | Saved search reference as `owner:app:name` |
| events | no | false | If true, load raw events instead of results |

## Examples

```spl
| loadjob savedsearch="admin:search:Daily Report"
```

## See also

- `savedsearch.md` — run a saved search live
- `diff.md` — compare with previous results
