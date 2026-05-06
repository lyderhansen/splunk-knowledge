# searchbnf.conf

Feeds Splunk Web’s search assistant with grammar snippets, descriptions, examples, and usage classification for built-in or custom commands—typically shipped beside custom commands inside each app’s `default/` directory.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<appname>/default/` (custom additions) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | commands.conf |

## Syntax notation (from spec)

Adjacent grammar tokens imply no whitespace separation is permitted between them unless explicitly documented. Literals are case-insensitive; whitespace in patterns matches `\s+`. Reserved syntax characters (`<>()|?*+`) must be quoted with `\"` escaping quotes inside literals. Grouping follows regex idioms: `<term>` required, `(term)?` optional, `(term)*` zero-or-more, `(term)+` one-or-more. Named terms may include `:default` hints such as `<field:fromfield>`.

Description text collapses repeated whitespace when rendered as HTML; wrap extended prose lines with trailing `\` except the final line, use `\p\` for paragraph breaks, and `\i\` for indented newline breaks. `<terms>` italicize, while uppercase or quoted fragments render as monospace highlights.

## Stanzas and settings

### `[<command-name>-command]`

Each custom command exposes one stanza suffixed with `-command` (for example `[geocode-command]`).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `syntax` | `<string>` | _(required)_ | Full grammar string describing mandatory clauses, option groups, and literals following “Syntax formatting” rules above. |
| `simplesyntax` | `<string>` | _(optional)_ | Abbreviated grammar omitting rarely used branches for cleaner assistant UX. |
| `alias` | `<alias list>` | _(optional)_ | Alternate command spellings (discouraged because duplicate names confuse users). |
| `description` | `<string>` | _(required)_ | Long-form documentation honoring description formatting conventions; hidden behind “More” when `shortdesc` exists. |
| `shortdesc` | `<string>` | _(optional)_ | Single-sentence summary displayed in compact assistant mode. |
| `example<number>` | `<string>` | _(optional)_ | Demonstration SPL paired with the same-numbered `comment<number>`. |
| `comment<number>` | `<string>` | _(optional)_ | Explains the paired `example<number>` string for assistant tooltips. |
| `usage` | `public \| private \| deprecated` | _(required)_ | Controls assistant visibility—only `public` surfaces inside Splunk Web. |
| `tags` | `<tag list>` | _(optional)_ | Auxiliary keywords mapping user guesses (“graph”) to actual commands (“chart”). |
| `maintainer` | `<name>` | _(deprecated)_ | Historical ownership metadata ignored by the assistant UI. |
| `appears-in` | `<version>` | _(deprecated)_ | Historical version marker ignored by the assistant UI. |
| `related` | `<command list>` | _(optional)_ | Suggests additional SPL commands in full-detail assistant mode. |

### `[<option-group>]`

Nested option stanzas (for example `[geocode-options]`) describe reusable fragments referenced inside parent `syntax` strings.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `syntax` | `<string>` | _(required)_ | Defines alternate clauses or switches available within the parent command grammar. |
| `description` | `<string>` | _(required)_ | Documents each option cluster using the same multi-line formatting conventions as command descriptions. |

Nested groups may chain arbitrarily (options referencing additional option stanzas) mirroring complex command grammars.
