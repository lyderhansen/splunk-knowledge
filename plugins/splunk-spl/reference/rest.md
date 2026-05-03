# rest — access Splunk REST API endpoints

Source: Splunk Search Reference 10.2.0

## Syntax

    | rest <rest-uri>
           [count=<int>]
           [strict=<bool>]
           [splunk_server=<wc-string>]
           [splunk_server_group=<wc-string>]...
           [timeout=<int>]
           [<get-arg-name>=<get-arg-value>]...

`rest` is a generating command — it must appear at the start of the pipeline (leading `|`).
Authentication uses the identity of the user running the command.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `rest-uri` | Yes | — | URI path to the REST endpoint, e.g. `/services/server/info` |
| `count` | No | 0 (unlimited) | Max results per REST call; multiplied across peers in distributed environments |
| `splunk_server` | No | all peers | Target a specific server; wildcards allowed (`peer*`); use `local` for search head |
| `splunk_server_group` | No | — | Limit to one or more named server groups; wildcards allowed |
| `strict` | No | false | When `true`, any REST error fails the entire search rather than emitting a warning |
| `timeout` | No | 60 | Seconds to wait for the endpoint to respond; `0` = no limit |
| `<get-arg-name>=<get-arg-value>` | No | — | Endpoint-specific GET parameters; see the REST API Reference for each endpoint |

## Examples

### Server info

```spl
| rest /services/server/info | table splunk_server, version, os_name, build
```

### List all apps on local search head

```spl
| rest /services/apps/local splunk_server=local | table label, version, disabled
```

### Find saved searches referencing a specific sourcetype

```spl
| rest /services/saved/searches splunk_server=local
| rename search AS saved_search
| fields author, title, saved_search
| search saved_search=*firewall*
```

### List currently running jobs (local only)

```spl
| rest /services/search/jobs count=0 splunk_server=local
| search isSaved=1
| table label, runDuration, published
```

### Get current authenticated user

```spl
| rest splunk_server=local /services/authentication/current-context
| rename username AS current_user
| fields current_user
```

## Gotchas

- **Generating command — must be first:** `rest` cannot follow another command in the
  pipeline. It always uses a leading `|`. Placing it mid-pipeline causes a syntax error.

- **Blocked on Splunk Cloud by default:** Many `/services/` endpoints are restricted on
  Splunk Cloud Platform and return a "Forbidden command" or 403 error. Use MCP tools or
  the Splunk Cloud REST API via approved methods instead.

- **Multiplied `count` in distributed environments:** `count` applies per peer, not in
  total. With 5 indexers and `count=1000`, you get up to 5,000 rows. Use `count=0` to
  avoid silent truncation.

- **`strict=false` can silently swallow errors:** The default allows REST errors to be
  emitted as warnings. In automation, set `strict=true` so search failures are visible.

- **Large endpoint responses are slow:** Some endpoints like `/services/search/jobs`
  return all open jobs across all peers. Add filters via GET args (e.g. `search=...`)
  or pipe to `| search` to reduce output.

## Tips

- Use `splunk_server=local` whenever you only want data from the search head to avoid
  querying all indexer peers unnecessarily.
- Check the Splunk REST API Reference Manual for per-endpoint GET parameters that can
  filter results server-side before they reach the pipeline.

## See also

- `metadata.md` — index metadata without REST
- `dbinspect.md` — index bucket info without REST
