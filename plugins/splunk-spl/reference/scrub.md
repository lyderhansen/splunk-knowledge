# scrub — anonymize search results by replacing identifying data

Source: Splunk Search Reference 8.2.12, page 491.

## Syntax

    | scrub [public-terms=<filename>] [private-terms=<filename>] [name-terms=<filename>] [dictionary=<filename>] [timeconfig=<filename>] [namespace=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `public-terms` | No | built-in | File listing terms NOT to anonymize (public vocabulary to leave intact) |
| `private-terms` | No | built-in | File listing additional terms TO anonymize |
| `name-terms` | No | built-in | File listing names to anonymize |
| `dictionary` | No | built-in | File listing terms NOT to anonymize, unless also in `private-terms` |
| `timeconfig` | No | built-in | File listing time configuration patterns to anonymize |
| `namespace` | No | (built-in files) | App name containing alternative anonymizer config files at `$SPLUNK_HOME/etc/apps/<app>/anonymizer/` |

All configuration files live in `$SPLUNK_HOME/etc/anonymizer/` by default. Arguments correspond to settings in the `splunk anonymize` CLI command.

`scrub` anonymizes all attributes except those starting with `_` (except `_raw`) or `date_`, and also skips: `eventtype`, `linecount`, `punct`, `sourcetype`, `timeendpos`, `timestartpos`.

The command adheres to the default `maxresultrows` limit of 50,000 results.

## Examples

### Anonymize results using default files

    index=security sourcetype=linux_secure
    | head 100
    | scrub

### Anonymize using a custom private-terms file

    index=security sourcetype=linux_secure
    | scrub private-terms=abc_private_terms

Uses the `abc_private_terms` file located in `$SPLUNK_HOME/etc/anonymizer/`.

### Anonymize with a custom app namespace

    index=security
    | scrub namespace=my_anonymizer_app

Reads anonymizer config files from `$SPLUNK_HOME/etc/apps/my_anonymizer_app/anonymizer/`.

## Gotchas

- **`scrub` replaces values with fictional ones of the same length** — it does not simply redact (blank out) data. A username like `carol@adalberto.com` becomes something like `aname@mycompany.com`. The length and structure are preserved, which aids log sharing without revealing identity.

- **Does not anonymize all fields** — internal fields (`_time`, `_raw`, etc. with underscore prefix) and metadata fields (`sourcetype`, `eventtype`, `linecount`, `punct`) are left unchanged. Sensitive data in `sourcetype` names, for example, is not scrubbed.

- **Replacement is deterministic within a single search run** — the same input value maps to the same output value within one search execution, preserving referential consistency (e.g. the same IP will always map to the same fictional IP). Across separate searches, the mapping may differ.

## See also

- `rex.md` — manually mask specific patterns using sed mode: `rex field=msg mode=sed "s/\d{3}-\d{2}-\d{4}/XXX/g"`
- `replace.md` — replace specific field values with controlled substitutions
