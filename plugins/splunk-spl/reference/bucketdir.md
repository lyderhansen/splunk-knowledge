# bucketdir — roll up file paths to directory-level groupings

Source: Splunk Search Reference 10.2.0.

## Syntax

    | bucketdir pathfield=<field> sizefield=<field> [maxcount=<int>] [countfield=<field>] [sep=<char>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `pathfield` | Yes | — | Field containing file or directory paths (e.g., `source`) |
| `sizefield` | Yes | — | Numeric field defining the "size" of each path entry (used to prefer directories with many files) |
| `maxcount` | No | 20 | Maximum number of output rows (directories) to return |
| `countfield` | No | `totalCount` | Numeric field describing the count of events per entry |
| `sep` | No | `/` or `\\` (OS-dependent) | Path separator character |

## Usage

`bucketdir` replaces individual file paths with their parent directory paths, grouping multiple file paths into their common directories. It prefers directories that contain many files but few events — this produces a compact summary of where data resides.

Typical use: after `top source` or similar, reduce hundreds of individual source paths to a manageable set of directories.

## Examples

### Return top 10 source directories

    ... | top source
    | bucketdir pathfield=source sizefield=count maxcount=10

### Summarize event distribution by directory

    index=main
    | stats count BY source
    | bucketdir pathfield=source sizefield=count maxcount=20
    | sort -count

### Windows path separator

    index=wineventlog
    | stats count BY source
    | bucketdir pathfield=source sizefield=count sep="\\"

## Gotchas

- **Both `pathfield` and `sizefield` are required** — omitting either causes an error; the 8.x syntax that used a positional field argument is no longer valid in 10.2.
- **`maxcount` limits output, not input** — all input events are processed; only the top `maxcount` directory groups are returned.
- **Separator auto-detection is OS-dependent** — if your paths use a non-default separator (e.g., Windows paths on a Linux search head), specify `sep="\\"` explicitly.
- **Streaming command** — runs on indexers by default but can be forced to run centrally via `commands.conf`.

## See also

- `folderize.md` — similar path-grouping approach
- `cluster.md` — text-based event grouping
- `top.md` — get top values before passing to `bucketdir`
