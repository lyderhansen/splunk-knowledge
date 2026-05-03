# ctable — alias for contingency

Source: Splunk Search Reference 10.2.0

`ctable` is an exact alias for the `contingency` command. Every argument, option, and
behavior available on `contingency` is available identically on `ctable`. The two commands
produce identical results and are interchangeable.

## Syntax

    | ctable [maxrows=<int>] [maxcols=<int>] [usetotal=<bool>] <field1> <field2>

(Same syntax as `contingency`.)

## When to use the alias

`ctable` is slightly shorter. Use it for interactive exploration or if your team has an
existing convention. Prefer `contingency` in production searches, saved alerts, and
dashboards for readability — reviewers unfamiliar with the alias may not recognize it.

## Example

    sourcetype=access_combined | ctable status host

is exactly equivalent to:

    sourcetype=access_combined | contingency status host

## Gotchas

- **Not a separate command** — `ctable` has no independent documentation page in the
  Splunk reference. All parameters, defaults, and limits are documented under `contingency`.
- **Team readability** — `ctable` is uncommon enough that it can confuse reviewers. If code
  clarity matters, always use the full name `contingency`.

## See also

- `contingency.md` — full syntax, parameters, examples, and gotchas
- `associate.md` — identifies field correlations
- `correlate.md` — calculates correlation coefficients between fields
