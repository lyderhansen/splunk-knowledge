# ctable — alias for contingency

Source: Splunk Search Reference 10.2.0

`ctable` is an exact alias for the `contingency` command. Every argument and option available on `contingency` is available on `ctable`. The two commands produce identical results.

## Syntax

    contingency [maxrows=<int>] [maxcols=<int>] [usetotal=<bool>] <field1> <field2>

## When to use the alias

Use `ctable` when you prefer a shorter name for muscle memory or habit. Prefer `contingency` in production code for readability.

## Example

    sourcetype=access_combined | ctable status host

is exactly equivalent to:

    sourcetype=access_combined | contingency status host

## See also

- `contingency.md` — full syntax, parameters, and examples
- `associate.md` — identifies correlations between fields
- `correlate.md` — calculates the correlation between different fields
