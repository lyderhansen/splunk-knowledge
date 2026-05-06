# macros.conf

Defines reusable SPL fragments invoked with backticks (`` `macro(args)` ``), including overloaded macros by arity, optional eval-mode expansions, and validation guards that enforce argument constraints before substitution occurs.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | savedsearches.conf |

## Stanzas and settings

### `[<macro>]`

`<macro>` is the macro name when it accepts zero arguments (example stanza `[foobar]`). Macros referenced without arguments use this stanza.

### `[<macro>(<numargs>)]`

When `<numargs>` is appended—such as `[foobar(2)]`—Splunk treats that arity as a distinct macro overload distinct from `[foobar]` or `[foobar(1)]`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `args` | `<string>,<string>,...` | _(ignored for zero-arg forms)_ | Comma-separated parameter names containing only alphanumeric characters, underscores, or hyphens; duplicates forbidden; ignored when the stanza name indicates zero arguments. |
| `definition` | `<string>` | _(required)_ | Expansion body where arguments appear as `$arg$`; Splunk replaces every `$arg$` globally unless `iseval=true`, which expects an eval expression returning the rendered string. |
| `validation` | `<string>` | _(optional)_ | Eval validation logic returning Boolean success/failure or a string error message when validation fails with Boolean guards. |
| `errormsg` | `<string>` | _(optional)_ | Message returned when Boolean `validation` evaluates false or NULL. |
| `iseval` | `true \| false` | `false` | When true, `definition` must be an eval expression whose string output becomes the macro text. |
| `description` | `<string>` | _(optional)_ | Short explanation surfaced in UI tooling for operators maintaining macros. |

Macros inside quoted literals do not expand.
