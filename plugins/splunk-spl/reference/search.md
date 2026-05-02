# search — retrieve events from indexes or filter pipeline results

Source: Splunk Search Reference 8.2.12, page 492.

## Syntax

    search <logical-expression>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<logical-expression>` | Yes | — | Keywords, field=value pairs, boolean operators, wildcards, time modifiers, or combinations thereof |
| `index=<string>` | No | default index | Restrict to a named index |
| `sourcetype=<string>` | No | (all) | Restrict to a sourcetype |
| `host=<string>` | No | (all) | Restrict to a host |
| `earliest=<time>` | No | (picker) | Start of time range; overrides the Time Range Picker |
| `latest=<time>` | No | (picker) | End of time range; overrides the Time Range Picker |

`AND` is implied between adjacent terms. `OR` and `NOT` must be explicit and uppercase.

## Variants

### Generating mode (first command)

When `search` opens a pipeline it retrieves events from indexes:

    index=myindex sourcetype=cisco:asa action=deny

The keyword `search` at the very start of a query is optional — Splunk implies it.

### Filter mode (mid-pipeline)

When used after a pipe, `search` filters the result set of the previous command using the same keyword/field syntax:

    index=myindex sourcetype=web_access
    | stats count by status
    | search status>=400

### IN operator (multi-value comparison)

    index=web status IN (400, 401, 403, 404, 500)
    | search user IN ("alice", "bob", "carol")

Wildcards work inside `IN`: `status IN (4*)` matches any 4xx status.

## Examples

### Basic: keyword + field-value with boolean

    index=security sourcetype="linux_secure" "failed password"
    | search src_ip!=10.0.0.0/8
    | stats count by src_ip
    | sort 0 -count

### Time-bounded subsearch filter

    index=firewall earliest=-24h latest=now
    | search action=deny dest_port IN (22, 3389, 445)
    | stats count by src_ip, dest_port
    | sort 0 -count

### Mid-pipeline filter after stats

    index=web sourcetype=access_combined
    | stats sum(bytes) AS total_bytes by host
    | search total_bytes > 1000000

## Gotchas

- **`!=` does NOT exclude nulls** — `search status!=200` returns events where `status` is missing too. Use `| where isnotnull(status) AND status!=200` instead.

- **`search` vs `where` wildcards differ** — in `search` use `*` (e.g. `url=*/api/*`); in `where` use `%` inside `like()` (e.g. `like(url, "%/api/%")`). Mixing them is the most common filter mistake.

- **String equality is exact and case-sensitive** — `status=200` does not match `status=200.0`. Use comparison operators `>=` `<=` for numeric ranges.

- **`search` is distributable streaming** — it runs on indexers when placed before any transforming command, making it significantly faster than `where` for simple filters on raw events.

## See also

- `where.md` — eval-based filtering; supports functions, field-vs-field comparison, and `<`, `>`, `<=`, `>=`
- `regex.md` — regex-based filtering on `_raw` or a field
- `stats.md` — aggregate after filtering
