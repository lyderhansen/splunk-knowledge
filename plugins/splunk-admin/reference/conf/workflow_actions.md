# workflow_actions.conf

Defines contextual workflow actions shown beside events or fields in Splunk Web—either launching external HTTP links (GET/POST) or constructing follow-on searches—complete with field/eventtype gating, display placement, and tokenized substitutions wired to the active search job.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` or `$SPLUNK_HOME/etc/apps/<app>/local/` |
| Pipeline phase | Search |
| Restart required | No |
| Related files | — |

## Stanzas and settings

### `[default]`

Splunk merges `[default]` values before named workflow stanzas override individual keys. The shipped prose does not enumerate standalone `[default]` keys beyond Splunk’s universal merge semantics.

### `[<workflow_action_name>]`

Each stanza declares one workflow action surfaced in the UI.

#### Core settings (all action types)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `type` | `<string>` | _(unset)_ | Declares action implementation (`link`, `search`, etc.); Splunk skips undefined entries. |
| `label` | `<string>` | _(unset)_ | Menu text shown for the action; Splunk skips entries lacking labels. |
| `fields` | `<comma or space separated list>` | `*` | Required fields on the event; supports globs such as `host*` and `*` for every field menu; influences availability when `display_location` references field menus. |
| `eventtypes` | `<comma or space separated list>` | _(unset)_ | Required matching eventtypes before enabling the action; accepts trailing `*` globs. |
| `display_location` | `<string>` | `both` | Chooses `field_menu`, `event_menu`, or `both` for rendering placement. |
| `disabled` | `True \| False` | `False` | Disables the workflow action without deleting its stanza. |

#### Link-type settings (`type=link`)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `link.uri` | `<string>` | _(required)_ | Destination URI with `$field$` substitution and automatic URI encoding for substituted components. |
| `link.target` | `<string>` | `blank` | `blank` opens a new browser window; `self` navigates the current window. |
| `link.method` | `<string>` | `get` | HTTP verb (`get` or `post`) used when invoking `link.uri`. |
| `link.postargs.<int>.key` | `<string>` | _(POST only)_ | Defines POST parameter names for indexed POST arguments when `link.method=post`. |
| `link.postargs.<int>.value` | `<string>` | _(POST only)_ | Defines POST parameter values paired with the matching `.key` entry; duplicates allowed via distinct indexes. |

#### Search-type settings (`type=search`)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `search.search_string` | `<string>` | _(required)_ | SPL executed in the target view; honors `$field$` substitution without automatic quoting fixes. |
| `search.app` | `<string>` | current app | Application namespace hosting the follow-on search. |
| `search.view` | `<string>` | current view | Destination view containing the search workspace. |
| `search.target` | `<string>` | _(unspecified)_ | Mirrors `link.target` semantics (`blank`, `self`). |
| `search.earliest` | `<time>` | _(unset)_ | Earliest bound for the spawned search when not preserving the original window. |
| `search.latest` | `<time>` | _(unset)_ | Latest bound for the spawned search when not preserving the original window. |
| `search.preserve_timerange` | `<boolean>` | `false` | Reuses the parent search’s time bounds when neither explicit earliest/latest overrides are set. |

### Context substitution tokens

| Token | Applicability | Description |
|-------|---------------|-------------|
| `$<field>$` | Links & searches | Inserts the event’s field value (URI/HTML encoded where noted). |
| `$@field_name$` | Field menus only | Substitutes the clicked field’s name for generic actions. |
| `$@field_value$` | Field menus only | Substitutes the clicked field’s literal value. |
| `$@sid$` | Both | Current search job SID. |
| `$@offset$` | Both | Event offset within the result set. |
| `$@namespace$` | Both | App namespace owning the search. |
| `$@latest_time$` | Both | Latest `_time` for disambiguation when Splunk exposes it. |
