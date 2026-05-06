# alert_actions.conf

Central template definitions Splunk merges with each scheduled alert/report action stanza in `savedsearches.conf`, covering transports (`sendemail`, `summaryindex`, `createrss`, modular alerts), artifact TTL/max runtime guards, and custom modular-alert executable hooks.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (override); packaged defaults under apps |
| Pipeline phase | Search |
| Restart required | No |
| Related files | `savedsearches.conf`, `commands.conf`, `alert_actions/` binaries |

## Stanzas and settings

### `[default]` (global defaults shared by modular alert stanzas)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxresults` | `<integer>` | `10000` | Caps rows forwarded into alert pipelines unless overridden per action. |
| `hostname` | `<protocol://host:port \| host>` | OS hostname/`localhost` | Canonical base hostname inserted into alert URLs/emails when templating `$results.url$` references. |
| `ttl` | `<integer>[p]` | `10p` (action-specific overrides documented inline) | Minimum lifetime for alert-triggered search artifacts (`p` counts scheduler periods). |
| `maxtime` | `<integer><suffix>` | `5m` (`rss` defaults `1m`) | Hard stop for alert-action execution latency (`s`,`m`,`h`,`d`). |
| `track_alert` | `<boolean>` | `0` | Marks whether firing this action should count toward Splunk’s alert tracking metrics/history. |
| `command` | `<string>` | — | SPL snippet Splunk wraps/substitutes (`$name$`, `$search$`, `$job*` tokens, etc.). |
| `is_custom` | `<boolean>` | — | Flags modular/custom alerts appearing inside Splunk Web’s picker when true. |
| `payload_format` | `xml \| json` | `xml` | Format streamed to scripted/modular alert stdin payloads. |
| `label` | `<string>` | stanza name | UI-visible friendly title for modular alerts. |
| `description` | `<string>` | — | Longer help text in Alert Actions Manager. |
| `icon_path` | `<string>` | — | Relative icon within `<app>/appserver/static`. |
| `forceCsvResults` | `auto \| true \| false` | `auto` | Controls CSV serialization vs SRS when handing results to commands expecting `$results.file$`. |
| `alert.execute.cmd` | `<string>` | — | Executable/JVM/script Splunk launches for modular alerts (supports `.path` pointer files). |
| `alert.execute.cmd.arg.<n>` | `<string>` | — | Ordered CLI arguments appended after `alert.execute.cmd`. |
| `python.version` | `default \| python \| python2 \| python3 \| python3.7 \| python3.9 \| latest` | — | Deprecated interpreter selector—prefer `python.required`. |
| `python.required` | `<csv>` | — | Lists acceptable interpreters (`3.9`,`3.13`,`latest`, …); Splunk picks newest compatible runtime. |

### `[email]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `from` | `<email>` | `splunk` | Sender address token Splunk’s mail processor substitutes before SMTP submission. |
| `to` | `<email list>` | — | Primary recipients for alert emails. |
| `cc` | `<email list>` | — | Courtesy-copy recipients. |
| `bcc` | `<email list>` | — | Blind-copy recipients. |
| `allowedDomainList` | `allow_all \| deny_all \| <domains>` | — | Restricts outbound domains for `sendemail`/alert email actions—unset implies permissive mode with security caveats. |
| `message.report` | `<string>` | — | Template body used for scheduled reports with substitution tokens. |
| `message.alert` | `<string>` | — | Template body used for triggered alerts. |
| `subject` | `<string>` | `Splunk Alert: $name$` | Subject template when namespaced subjects disabled. |
| `subject.alert` | `<string>` | `Splunk Alert: $name$` | Alert-specific subject override. |
| `subject.report` | `<string>` | `Splunk Report: $name$` | Report-specific subject override. |
| `useNSSubject` | `<boolean>` | `0` | Chooses between namespaced vs generic subject templates. |
| `escapeCSVNewline` | `<boolean>` | `true` | Escapes newline/tab characters embedded inside emailed CSV attachments. |
| `newLineValuesInCSV` | `<boolean>` | `false` | Separates multivalue fields with newline characters inside CSV mail payloads. |
| `footer.text` | `<string>` | Splunk boilerplate | Footer appended to HTML/text notifications. |
| `format` | `table \| raw \| csv` | `table` | Inline results formatting (`plain/html` legacy values collapse per `.spec`). |
| `include.results_link` | `<boolean>` | — | Adds job/results hyperlink blocks to outgoing emails. |
| `include.search` | `<boolean>` | — | Embeds the SPL string responsible for the alert/report. |
| `include.trigger` | `<boolean>` | — | Shows textual trigger/threshold explanation in email bodies. |
| `include.trigger_time` | `<boolean>` | — | Prints firing timestamps inside notifications. |
| `include.view_link` | `<boolean>` | — | Adds Splunk Web navigation links for editing the saved search. |
| `content_type` | `html \| plain` | — | Chooses MIME composition strategy for multipart emails. |
| `sendresults` | `<boolean>` | `0` | Whether search rows accompany the email (inline vs attachment governed by `inline`). |
| `inline` | `<boolean>` | `0` | Places CSV/table payloads directly inside email bodies vs attaching files. |
| `priority` | `1-5` | `3` | MIME priority hint forwarded to mail infrastructure (`1` highest). |
| `mailserver` | `<host[:port]>` | `localhost` | SMTP relay Splunk uses for outbound alert mail (requires separate SMTP infra). |
| `use_ssl` | `<boolean>` | `0` | Negotiates SMTP over implicit TLS (requires explicit port). |
| `use_tls` | `<boolean>` | `0` | Enables STARTTLS upgrades when supported by the MTA. |
| `auth_username` | `<string>` | `""` | SMTP AUTH username when relays demand credentials. |
| `oauth_client_id` | `<string>` | `""` | OAuth client identifier for modern SMTP AUTH flows. |
| `oauth_client_secret` | `<string>` | `""` | OAuth secret paired with `oauth_client_id`. |
| `oauth_url` | `<string>` | `""` | Token endpoint URL for OAuth-enabled SMTP providers. |
| `oauth_scope` | `<string>` | `""` | OAuth scope parameter forwarded during token exchange. |
| `auth_password` | `<password>` | `""` | Cleartext SMTP password encrypted at next restart once persisted. |
| `sendpdf` | `<boolean>` | `0` | Generates Integrated PDF Rendering attachments for dashboards named via `pdfview`. |
| `sendcsv` | `<boolean>` | `0` | Forces CSV attachments independent of `inline`. |
| `sendpng` | `<boolean>` | `0` | Sends Dashboard Studio PNG snapshots when compatible. |
| `allow_empty_attachment` | `<boolean>` | `true` | Allows CSV/PDF attachments even when triggering searches return zero rows. |
| `pdfview` | `<string>` | — | Names the Splunk view/dashboard rendered into PDF attachments. |
| `reportPaperSize` | `letter \| … \| a5` | `letter` | Paper geometry forwarded to the PDF renderer. |
| `reportPaperOrientation` | `portrait \| landscape` | `portrait` | Rotates printable PDF pages. |
| `reportIncludeSplunkLogo` | `<boolean>` | `1` | Controls bundled Splunk artwork on PDF headers/footers. |
| `reportCIDFontList` | `<space-separated>` | `gb cns jp kor` | Ordering of CID fonts loaded for CJK glyph coverage in PDF exports. |
| `reportFileName` | `<string>` | `$name$-$time:%Y-%m-%d$` | Attachment naming template for PDF/CSV outputs. |
| `width_sort_columns` | `<boolean>` | `true` | Sorts textual columns narrow→wide when producing ASCII-table emails (`format=text` legacy). |
| `preprocess_results` | `<search>` | `""` | SPL preprocessor trimming `_internal` fields before emailing results. |
| `pdf.footer_enabled` | `0 \| 1` | `1` | Toggles PDF footer chrome. |
| `pdf.header_enabled` | `0 \| 1` | `1` | Toggles PDF header chrome. |
| `pdf.logo_path` | `<app>:<path>` | — | Overrides default Splunk logo with customer artwork stored under `appserver/static`. |
| `pdf.header_left` | `<token>` | `none` | Chooses header slot contents (`logo`, `title`, `timestamp`, etc.). |
| `pdf.header_center` | `<token>` | `description` | Same semantics as `pdf.header_left`. |
| `pdf.header_right` | `<token>` | `none` | Same semantics as `pdf.header_left`. |
| `pdf.footer_left` | `<token>` | `logo` | Footer slot mapping helper. |
| `pdf.footer_center` | `<token>` | `title` | Footer slot mapping helper. |
| `pdf.footer_right` | `<token>` | `timestamp,pagination` | Footer slot mapping helper. |
| `pdf.html_image_rendering` | `<boolean>` | `true` | Enables `<img>` embedding logic inside PDF HTML pipelines; disable when troubleshooting renderer faults. |
| `sslVersions` | `<csv>` | see default file | TLS versions permitted when Splunk acts as SMTP/TLS client for alerts/`sendemail`. |
| `sslVerifyServerCert` | `<boolean>` | `false` | Validates remote SMTP certificates against trust stores (`sslRootCAPath`). |
| `sslVerifyServerName` | `<boolean>` | `false` | Adds hostname verification atop certificate validation when enabled. |
| `sslCommonNameToCheck` | `<csv>` | — | Optional pinned Common Names acceptable on SMTP certificates. |
| `sslAltNameToCheck` | `<csv>` | — | Optional Subject Alternative Names whitelist for SMTP endpoints. |
| `cipherSuite` | `<openssl string>` | — | Overrides OpenSSL cipher preference order for SMTP STARTTLS sessions. |

### `[rss]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `items_count` | `<integer>` | `30` | Caps RSS entries emitted per alert (`<= maxresults`). |

*`ttl`, `maxtime`, and `command` keys inherit from global defaults unless overridden locally.*

### `[script]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `filename` | `<string>` | `""` | Names the executable/batch/py script under `$SPLUNK_HOME/bin/scripts/` invoked when alerts fire. |

### `[lookup]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `filename` | `<lookup>` | `""` | Destination CSV filename or KV Store lookup definition populated each scheduled run. |
| `append` | `<boolean>` | `0` | When true, merges rows instead of truncating prior lookup contents. |

### `[summary_index]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `inline` | `<boolean>` | `1` | Runs `summaryindex` inside the search process vs deferred follow-on actions for large results. |
| `_name` | `<index>` | `summary` | Destination summary index receiving stash events. |

### `[summary_metric_index]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `inline` | `<boolean>` | `1` | Controls whether `mcollect` executes inline similar to `[summary_index]`. |
| `_name` | `<index>` | `summary` | Target metrics index receiving summarized measurements. |

### `[populate_lookup]` *(deprecated)*

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dest` | `<lookup>` | — | Legacy transforms stanza or lookup-relative path populated by alert results—use `[lookup]` instead. |

### `[webhook]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `param.user_agent` | `<string>` | — | Custom HTTP User-Agent header Splunk uses when posting webhook payloads. |
| `enable_allowlist` | `<boolean>` | `false` | Forces webhook destinations to match regex entries below when true (must configure allowlist entries). |
| `allowlist.<name>` | `<regex>` | — | Ordered endpoint patterns permitted for webhook alert actions (paired with `alert_webhook` app docs). |

### `[<custom_alert_action>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *(inherits modular globals)* | — | — | Custom alert stanzas reuse `command`, `is_custom`, `alert.execute.cmd*`, `python.required`, `label`, `description`, `icon_path`, etc., identical to `[default]` semantics documented above. |
