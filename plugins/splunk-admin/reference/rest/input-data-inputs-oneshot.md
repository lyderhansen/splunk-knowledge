# /services/data/inputs/oneshot

Access oneshot inputs in progress or queue a file for immediate indexing.

**Category:** Input

**Related REST paths in this file:** `/services/data/inputs/oneshot`, `/services/data/inputs/oneshot/{name}`


## /services/data/inputs/oneshot

Access oneshot inputs in progress or queue a file for immediate indexing.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/oneshot` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/oneshot`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Bytes Indexed | varies | — |
| Offset | varies | — |
| Size | varies | — |
| Sources Indexed | varies | — |
| Spool Time | varies | Time that the request was made to read the source file. |


**Additional returned-field documentation:**

Total number of bytes read and sent to the pipeline for indexing during a oneshot input.

This total includes the uncompressed byte count from a source file that is compressed on disk.

Current position in the source file, indicating how much of the file is read. For compressed source files, this offset represents the position in the compressed format.

You can obtain the percentage of a source file read by calculating offset/size.

Size of the source file, in bytes.

You can obtain the percentage of a source file read by calculating offset/size.

Indicates the number of sources read from a file in a compressed format such as tar or zip.

A value of 0 indicates the source file was not compressed.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/oneshot?output_mode=json'
```

## POST `/services/data/inputs/oneshot`

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| host | String | Varies | — | The value of the`host` field to be applied to data from this file. |
| host_regex | String | Varies | — | String |
| host_segment | Number | Varies | — | Use the specified slash-separate segment of the path as the host field value. |
| index | String | Varies | — | The destination index for data processed from this file. |
| name | String | Varies | — | Required. The path to the file to be indexed. The file must be locally accessible by the server. |
| rename-source | String | Varies | — | The value of the`source` field to be applied to data from this file. |
| sourcetype | String | Varies | — | The value of the`sourcetype` field to be applied to data from this file. |


**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**

A regex to be used to extract a`host` field from the path.

If the path matches this regular expression, the captured value is used to populate the host field for events from this data input. The regular expression must have one capture group.

### Returned values

| *(none)* | — | No response body fields documented for this operation. |

### Example

```
curl -k -u admin:pass -X POST 'https://localhost:8089/services/data/inputs/oneshot'
```


## /services/data/inputs/oneshot/{name}

Get information about the {name} one-shot input.

**Category:** Input

## Endpoint details
| Property | Value |
|----------|-------|
| URL | `/services/data/inputs/oneshot/{name}` |
| Auth required | Yes |
| Capability | `See Splunk REST API User Manual (capabilities vary by deployment).` |

## GET `/services/data/inputs/oneshot/{name}`

### Request parameters

| *(none documented)* | — | — | — | — |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| Bytes Indexed | varies | — |
| Offset | varies | — |
| Size | varies | — |
| Sources Indexed | varies | — |
| Spool Time | varies | Time that the request was made to read the source file. |


**Additional returned-field documentation:**

Total number of bytes read and sent to the pipeline for indexing during a oneshot input.

This total includes the uncompressed byte count from a source file that is compressed on disk.

Current position in the source file, indicating how much of the file is read. For compressed source files, this offset represents the position in the compressed format.

You can obtain the percentage of a source file read by calculating offset/size.

Size of the source file, in bytes.

You can obtain the percentage of a source file read by calculating offset/size.

Indicates the number of sources read from a file in a compressed format such as tar or zip.

A value of 0 indicates the source file was not compressed.

### Example

```
curl -k -u admin:pass 'https://localhost:8089/services/data/inputs/oneshot/{name}?output_mode=json'
```

