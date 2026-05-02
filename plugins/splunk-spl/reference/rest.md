# rest — access Splunk REST API endpoints

Source: Splunk Search Reference 8.2.12, page 475.

## Syntax

    | rest <uri-path> [splunk_server=<string>] [count=<int>] [timeout=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| uri-path | yes | — | REST endpoint path (e.g., `/services/server/info`) |
| splunk_server | no | local | Target server for distributed environments |
| count | no | 0 (unlimited) | Max results |
| timeout | no | 60 | Request timeout in seconds |

## Examples

### Server info

```spl
| rest /services/server/info | table splunk_server, version, os_name
```

### List all apps

```spl
| rest /services/apps/local | table label, version, disabled
```

## Gotchas

- **Blocked on Splunk Cloud:** The `rest` command is restricted on Splunk Cloud. MCP `splunk_list_apps` may return "Forbidden command found: rest".
- **Generating command:** Must be first in the pipeline.

## See also

- `metadata.md` — index metadata (no REST needed)
- `dbinspect.md` — index info (no REST needed)
