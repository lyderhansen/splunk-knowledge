# tscollect — write results to tsidx for tstats (DEPRECATED)

Source: Splunk Search Reference 10.2.0

**Status: Deprecated since Splunk Enterprise 7.3.0.** The command continues to function in
10.2 but may be removed in a future release. Use **data model acceleration** (preferred) or
`collect` to summary indexes instead. See Accelerate data models in the Knowledge Manager Manual.

**Risky command:** requires the `indexes_edit` capability (admin role by default).

## Syntax

    | tscollect [namespace=<string>] [squashcase=<bool>] [keepresults=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `namespace` | No | job directory | Directory name under `$SPLUNK_DB/tsidxstats/` for the tsidx files. Persistent if set; ephemeral (job lifetime) if omitted. |
| `squashcase` | No | false | If true, lowercases all field::value tokens in the tsidx |
| `keepresults` | No | false | If true, passes input results through; if false, returns only a count (more efficient) |

## Usage

`tscollect` writes field-level tsidx (time-series index) files that `tstats` can query
instead of raw events, enabling faster statistical searches. A named namespace is written
persistently; without a namespace the tsidx lives only for the search job's lifetime.

The command can be called multiple times with the same namespace to append new data.

## Examples

### Write to a persistent namespace

    index=main | stats count by src, dest, action
    | tscollect namespace=net_summary

Query later with `tstats`:

    | tstats count FROM tsidx:net_summary BY src, dest, action

### Ephemeral tsidx (job lifetime only)

    index=main | fields src, dest, bytes | tscollect

### Keep results flowing through the pipeline

    index=main | fields src, dest | tscollect namespace=my_ns keepresults=true
    | stats count by src

## Gotchas

- **Deprecated — prefer data model acceleration** — `| datamodel ... search | tstats`
  with data model acceleration achieves the same goal with better tooling and support.
- **`indexes_edit` required** — standard `power` and `user` roles cannot run `tscollect`.
- **No namespace = no persistence** — tsidx files without a namespace are deleted when the
  job expires. Always specify `namespace` for reusable accelerated datasets.
- **Risky command** — may be blocked or sandboxed on Splunk Cloud. Check with your admin.

## See also

- `tstats.md` — query tsidx files created by `tscollect` or data model acceleration
- `collect.md` — write results to a summary index (different mechanism, not deprecated)
- `datamodel.md` — access data model objects; preferred replacement
