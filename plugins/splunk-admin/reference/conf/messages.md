# messages.conf

Externalizes Splunk Web bulletin strings so administrators can override severity, capability gates, recommended actions, printf-style tokens, documentation links, and rendering targets without patching binaries.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | `web.conf` |

## Stanzas and settings

### `[<COMPONENT>]`

Declares the component namespace so Splunk Web can prefix grouped bulletins consistently.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `name` | `<string>` | _(required)_ | Human-readable component title applied as a prefix for every child message stanza under this component. |

### `[<COMPONENT>:<MESSAGE_KEY>]`

Message keys follow Splunk’s printf annotation convention (`__D_LU_S`, etc.) documented in the shipped spec.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `message` | `<string>` | _(required)_ | Primary bulletin body supporting printf tokens, Splunk wiki links, `$t` timestamps, and UI macros described in the default spec commentary. |
| `message_alternate` | `<string>` | empty | Static replacement text that ignores runtime printf arguments when present. |
| `action` | `<string>` | empty | Follow-up guidance such as deep links, sales contacts (`$CONTACT_SPLUNK_SALES_TEXT$`), or operational instructions paired with the message. |
| `severity` | `critical\|error\|warn\|info\|debug` | `warn` | Controls styling and logging priority when the bulletin renders or mirrors into logs. |
| `capabilities` | `<comma-separated list>` | empty | Splunk capabilities required before Splunk Web exposes the message (ignored when `roles` overrides visibility). |
| `roles` | `<comma-separated list>` | _(unset)_ | If set, membership in any listed role grants visibility regardless of `capabilities`. |
| `help` | `<string>` | _(unset)_ | Documentation locator consumed by contextual help widgets inside Splunk Web. |
| `target` | `[auto\|ui\|log\|ui,log\|none]` | `auto` | Chooses whether messages surface in UI bulletins, splunkd logs, both, remain contextual (`auto`), or are suppressed entirely (`none`). |
