# convert — convert field values using predefined conversion functions

Source: Splunk Search Reference 8.2.12, page 248.

## Syntax

    | convert [timeformat=<string>] (<convert-func>(<field>) [AS <new-field>])...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `timeformat=<string>` | no | `%m/%d/%Y %H:%M:%S` | strftime format string used by `mktime()` to parse string timestamps. |
| `<convert-func>` | yes | — | One of the conversion functions listed below. |
| `<field>` | yes | — | The field to convert. |
| `AS <new-field>` | no | overwrites `<field>` | Output field name. Without `AS`, the original field is overwritten. |

## Conversion functions

| Function | Input → Output | Description |
|---|---|---|
| `auto()` | string → number or epoch | Auto-detects and converts. Tries numeric, then timestamp. |
| `ctime(X)` | epoch → string | Epoch seconds to human-readable local time string. |
| `dur2sec(X)` | duration string → seconds | Converts `HH:MM:SS` or `D+HH:MM:SS` to integer seconds. |
| `memk(X)` | memory string → kilobytes | Converts values like `4096m`, `2g`, `512k` to kilobytes. |
| `mktime(X)` | timestamp string → epoch | Parses a timestamp string using `timeformat` into epoch seconds. |
| `mstime(X)` | `MM:SS.ms` string → seconds | Converts millisecond-precision time to seconds. |
| `none(X)` | any → unchanged | No conversion; useful to cancel an automatic field conversion. |
| `num(X)` | string → number | Extracts numeric portion from a string. `"4.5 MB"` → `4.5`. |
| `rmcomma(X)` | string → number | Removes commas from formatted numbers. `"1,234"` → `1234`. |
| `rmunit(X)` | string → number | Strips trailing unit characters. `"42 ms"` → `42`. |

## Usage

`convert` is a **distributable streaming command**. It applies named conversion functions to
fields, producing cleaner numeric or epoch values. It is commonly used to prepare data from
mixed-format logs before `stats` aggregation.

`ctime()` and `mktime()` are complementary — `ctime()` turns epoch into readable strings,
`mktime()` parses strings back to epoch. The `timeformat` parameter applies only to `mktime()`.

## Examples

### Convert epoch to readable string

    ... | convert ctime(_time) AS readable_time

### Parse a custom timestamp string to epoch

    ... | convert timeformat="%Y-%m-%d %H:%M:%S" mktime(log_timestamp) AS event_epoch

### Strip commas from formatted numbers for math

    ... | convert rmcomma(revenue) | stats sum(revenue) AS total

### Convert memory string to kilobytes

    ... | convert memk(mem_used) | eval mem_gb = mem_used / 1048576

### Convert duration string to seconds for stats

    ... | convert dur2sec(response_time) | stats avg(response_time) AS avg_sec

### Chain multiple conversions

    ... | convert num(bytes) rmcomma(total_cost) ctime(_time) AS display_time

## Gotchas

- **`auto()` can misidentify strings** — if a string looks numeric but represents a category
  (e.g., a product code `"1234"`), `auto()` will silently convert it to a number. Be explicit
  with the appropriate function.

- **`ctime()` output is locale-dependent** — the formatted string varies by server locale and
  timezone. For consistent cross-environment output use `eval strftime(_time, "%Y-%m-%d %H:%M:%S")`
  instead.

- **`mktime()` requires exact format match** — if the timestamp string does not match
  `timeformat`, the result is NULL with no error. Verify your format string carefully.

- **`rmcomma()` does not handle currency symbols** — `"$1,234"` → `NULL`, not `1234`. Strip
  non-numeric prefixes first with `eval replace(field, "[$€£]", "")` before `rmcomma()`.

## See also

- `eval.md` — `strftime()`, `strptime()`, `tonumber()`, `tostring()` for eval-based conversion
- `reltime.md` — convert epoch to a relative time display string
- `fieldformat.md` — format display without changing values
