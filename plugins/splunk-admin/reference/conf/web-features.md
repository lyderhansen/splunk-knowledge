# web-features.conf

Describes Splunk Web feature toggles replicated across search head cluster members. Override defaults in `$SPLUNK_HOME/etc/system/local/web-features.conf`.

**Source version:** Splunk Enterprise 10.2  
**Docs fetched from:** https://docs.splunk.com/Documentation/Splunk/latest/Admin/Web-featuresconf (`WebFeaturesconf` without hyphen returns 404)

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (plus defaults under `$SPLUNK_HOME/etc/system/default/`) |
| Pipeline phase | N/A |
| Restart required | Yes |
| Related files | web.conf |

## Stanzas and settings

### `[feature:search_v2_endpoint]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_search_v2_endpoint` | `<boolean>` | `true` | **Removed** — no effect; formerly selected Splunk Web search endpoint v2. |

### `[feature:quarantine_files]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_jQuery2` | `<boolean>` | `false` | **Deprecated.** Allow packaged jQuery 2 assets; do not change. |
| `enable_unsupported_hotlinked_imports` | `<boolean>` | `false` | Allow unsupported JS imports from Simple XML extensions; do not change. |

### `[feature:dashboards_csp]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_dashboards_external_content_restriction` | `<boolean>` | `true` | When true, Studio dashboards get CSP headers blocking external images outside DTDL; Classic dashboards warn when loading external URLs outside DTDL. |
| `enable_dashboards_redirection_restriction` | `<boolean>` | `true` | When true, warn before redirecting Studio/Classic dashboards to external URLs not in DTDL. |
| `dashboards_trusted_domain.<name>` | `<string>` | Not set | Trusted domains for image loads and redirects (Dashboards Trusted Domains List); prefix each entry with `dashboards_trusted_domain.`; max ~6500 chars total. |
| `internal.dashboards_trusted_domain.<name>` | `<string>` | Built-in Splunk list | Internal trusted domains merged with DTDL; do not modify. |

### `[feature:highcharts_accessibility]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disable_highcharts_accessibility` | `<boolean>` | `true` | **Deprecated.** Disable Highcharts accessibility module; do not change. |

### `[feature:dashboard_studio]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `activate_downsampling` | `<boolean>` | — | **Deprecated** — no effect; will be removed. |
| `activate_dsl_webworkers_for_visualizations` | `<boolean>` | `false` | Run Dynamic Options Syntax in WebWorkers; internal — do not modify. |
| `lazy_load_data_frames_for_visualizations` | `<boolean>` | `true` | Lazy-load visualization data frames during DOS execution; internal — do not modify. |
| `bypass_clonedeep_options_scope_for_visualizations` | `<boolean>` | `true` | Skip deep-cloning data sources during DOS; internal — do not modify. |
| `execute_chain_searches_with_tokens_in_search_process` | `<boolean>` | `false` | Run tokenized chain searches ahead of time in search process vs main splunkd. |
| `activate_o11y_dashboards` | `<boolean>` | `true` | Master toggle for Dashboard Studio observability features; internal — do not modify. |
| `activate_o11y_service_graph` | `<boolean>` | `true` | Service graph viz/data sources in Dashboard Studio; requires observability setup; internal — do not modify. |
| `activate_dashboard_publishing_and_view_without_login` | `<boolean>` | — | **Removed** — no effect. |
| `activate_link_to_dashboard_tab` | `<boolean>` | `true` | Allow Link-to-dashboard interactions targeting a specific tab; internal experimental removal. |
| `activate_save_to_dashboard_tab` | `<boolean>` | `true` | Allow saving reports to a specific dashboard tab; internal experimental removal. |
| `activate_custom_visualizations` | `<boolean>` | `true` | Allow custom visualizations in Dashboard Studio; internal — do not modify. |
| `activate_conditional_visibility` | `<boolean>` | `true` | Allow advanced conditional visibility UI; internal — do not modify. |
| `activate_spl2_datasources` | `<boolean>` | `true` | Expose SPL2 data sources in Dashboard Studio; internal — do not modify. |

### `[feature:pdfgen]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `activate_chromium_legacy_export` | `<boolean>` | — | **Removed** — no effect. |
| `activate_scheduled_export_upscaling` | `<boolean>` | `true` | Upscale scheduled Dashboard Studio exports for sharper large dashboards. |

### `[feature::windows_rce]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_acuif_pages` | `<boolean>` | `false` | Use Admin Config UI Framework for listed Windows input pages on Splunk Cloud. |

### `[feature:page_migration]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_triggered_alerts_vnext` | `<boolean>` | — | **Removed** — no effect. |
| `enable_home_vnext` | `<boolean>` | — | **Removed** — no effect. |
| `enable_datasets_vnext` | `<boolean>` | — | **Removed** — no effect. |
| `enable_job_manager_vnext` | `<boolean>` | `true` | **Deprecated.** Load new Job Manager page; do not modify. |
| `enable_authoverview_vnext` | `<boolean>` | `true` | Load React-based Authentication Methods page. |
| `enable_password_management_page_vnext` | `<boolean>` | — | Load React Password Management page vs Backbone (no default stated in spec excerpt). |
| `enable_authentication_providers_LDAP_vnext` | `<boolean>` | `true` | Load React LDAP configuration page. |
| `enable_admin_LDAP-groups_vnext` | `<boolean>` | `true` | Load React LDAP Groups page. |
| `enable_authorization_tokens_vnext` | `<boolean>` | — | Load React Tokens page vs Backbone (no default stated). |
| `enable_duo_mfa_vnext` | `<boolean>` | `false` | Load React Duo MFA page vs XML. |
| `enable_authorization_roles_vnext` | `<boolean>` | `true` | Load Roles UI using separate edit pages vs modals. |
| `enable_authentication_users_vnext` | `<boolean>` | `true` | Load Users UI using separate edit pages vs modals. |
| `enable_data_indexes_cloud_vnext` | `<boolean>` | `true` | Load modernized Splunk Cloud Indexes page. |
| `enable_data_indexes_vnext` | `<boolean>` | `true` | Load modernized Indexes page. |
| `enable_reports_vnext` | `<boolean>` | `true` | **Deprecated.** Load new Reports page; do not modify. |
| `enable_alerts_vnext` | `<boolean>` | — | **Deprecated** — no effect. |
| `enable_admin_alert_actions_vnext` | `<boolean>` | — | Load React Email Settings page vs Python/XML (no default stated). |
| `enable_saml_vnext` | `<boolean>` | `true` | Load React SAML configuration page. |
| `enable_admin_directory_vnext` | `<boolean>` | `true` | Load React All configurations page. |
| `enable_federation_page_vnext` | `<boolean>` | `false` | Show modernized Federation page vs legacy federated search UI. |

### `[feature:dashboard_inputs_localization]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_dashboard_inputs_localization` | `<boolean>` | `false` | Localize Classic dashboard input choices when true. |

### `[feature:share_job]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_share_job_control` | `<boolean>` | `true` | Allow Share Job in Search app; when false users see guidance to share queries instead. |

### `[feature:search_auto_format]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_autoformatted_comments` | `<boolean>` | `false` | **Deprecated.** Auto-format comments in search editor; do not change. |

### `[feature:ui_prefs_optimizations]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `optimize_ui_prefs_performance` | `<boolean>` | `true` | **Deprecated.** Optimize ui-prefs REST performance; do not change. |

### `[feature:splunk_web_optimizations]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_app_bar_performance_optimizations` | `<boolean>` | `true` | **Deprecated.** Optimize app bar generation; do not change. |
| `bypass_app_bar_performance_optimizations_apps` | `<comma-separated list>` | `""` | Apps excluded from app-bar optimizations; do not change. |
| `enable_search_bar_performance_optimizations` | `<boolean>` | `true` | **Deprecated.** Optimize search bar load; do not change. |
| `enable_saved_search_pageload_optimization` | `<boolean>` | `true` | **Deprecated.** Optimize saved-search detail fetch; do not change. |
| `enable_messages_list_performance_optimizations` | `<boolean>` | `true` | **Deprecated.** Optimize messages list rendering; do not change. |

### `[feature:spotlight_search]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_spotlight_search` | `<boolean>` | `true` | Show Spotlight Search in Settings menu. |

### `[feature:search_sidebar]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_sidebar_preview` | `<boolean>` | — | Show Events preview column/sidebar in Search & Reporting (spec lists behavior only). |

### `[feature:field_filters]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_field_filters_ui` | `<boolean>` | `true` | Surface field filters UI in Splunk Web. |

### `[feature:authentication_oauth]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_authentication_oauth_ui` | `<boolean>` | `true` | Show OAuth configuration in Authentication Methods workflow. |

### `[feature:identity_sidecar_scim]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | `<boolean>` | `true` | Show Automated User Management (SCIM) controls in SAML dialog. |

### `[feature:system_namespace_redirection]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_system_namespace_redirection` | `<boolean>` | `true` | Redirect system-namespace Splunk Web URLs; do not change. |

### `[feature:appserver]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `python.version` | `latest\|python3.9` | `latest` | **Deprecated.** Python runtime for app server; do not change. |
| `python.required` | `<comma-separated list>` | `latest` | Supported Python versions for Splunk Web app server; change only per Splunk Support. |

### `[feature:federated_search]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_ipv6_validations` | `<boolean>` | `true` | Accept IPv6 addresses/CIDRs in federated search forms when true. |

### `[feature:knowledge_object_favorites]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_dashboards_favorites` | `<boolean>` | `true` | Allow favoriting dashboards. |
| `enable_reports_favorites` | `<boolean>` | `true` | Allow favoriting reports. |

### `[feature:search_ai_assistant]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_search_ai_assistant` | `<boolean>` | `true` | Show Splunk AI Assistant for SPL in Search app. |

### `[feature:spl2]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_spl2` | `<boolean>` | `true` | Enable SPL2 features in Splunk Web. |
