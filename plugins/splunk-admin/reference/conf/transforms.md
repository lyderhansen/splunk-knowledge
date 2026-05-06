# transforms.conf

> Version 10.2.0
> 
> This file contains settings and values that you can use to configure
> data transformations.
> 
> Transforms.conf is commonly used for:
> * Configuring host and source type overrides that are based on regular
> expressions.
> * Anonymizing certain types of sensitive incoming data, such as credit
> card or social security numbers.
> * Routing specific events to a particular index, when you have multiple
> indexes.
> * Creating new index-time field extractions. NOTE: We do not recommend
> adding to the set of fields that are extracted at index time unless it
> is absolutely necessary because there are negative performance
> implications.
> * Creating advanced search-time field extractions that involve one or more
> of the following:
> * Reuse of the same field-extracting regular expression across multiple
> sources, source types, or hosts.
> * Application of more than one regular expression to the same source,
> source type, or host.
> * Using a regular expression to extract one or more values from the values
> of another field.
> * Delimiter-based field extractions, such as extractions where the
> field-value pairs are separated by commas, colons, semicolons, bars, or
> something similar.
> * Extraction of multiple values for the same field.
> * Extraction of fields with names that begin with numbers or
> underscores.
> * NOTE: Less complex search-time field extractions can be set up
> entirely in props.conf.
> * Setting up lookup tables that look up fields from external sources.
> 
> All of the above actions require corresponding settings in props.conf.
> 
> You can find more information on these topics by searching the Splunk
> documentation (http://docs.splunk.com/Documentation).
> 
> There is a transforms.conf file in $SPLUNK_HOME/etc/system/default/. To
> set custom configurations, place a transforms.conf file in
> $SPLUNK_HOME/etc/system/local/.
> 
> For examples of transforms.conf configurations, see the
> transforms.conf.example file.
> 
> You can enable configuration changes made to transforms.conf by running this
> search in Splunk Web:
> 
> | extract reload=t
> 
> To learn more about configuration files (including precedence) please see
> the documentation located at
> http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Parsing, Indexing, Search |
| Restart required | Reload via `debug/refresh` |
| Related files | props.conf, fields.conf |

## Stanzas and settings

Transform stanzas use arbitrary names `[<unique_transform_stanza_name>]` referenced from props.conf (for example `REPORT-<class>`).

### GLOBAL SETTINGS

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| REGEX | `<regular expression>` | `empty string` | Enter a regular expression to operate on your data. NOTE: This setting is valid for index-time and search-time field extraction. REGEX is required for all search-time transforms unless you are setting up REGEX is required for all index-time transforms. REGEX and the FORMAT setting: FORMAT must be used in conjunction with REGEX for index-time transforms. Name-capturing groups in the REGEX are extracted directly to fields. If the REGEX for a field extraction configuration does not have the The REGEX must have at least one capturing group, even if the FORMAT does If the REGEX extracts both the... |
| FORMAT | `<string>` | — | NOTE: This option is valid for both index-time and search-time field This setting specifies the format of the event, including any field names or FORMAT is required for index-time extractions: Use $n (for example $1, $2, etc) to specify the output of each REGEX If REGEX does not have n groups, the matching fails. The special identifier $0 represents what was in the DEST_KEY before the At index time only, you can use FORMAT to create concatenated fields: Example: FORMAT = ipaddress::$1.$2.$3.$4 When you create concatenated fields with FORMAT, "$" is the only special "FORMAT = foo$1" yields "... |
| MATCH_LIMIT | `<integer>` | `100000` | Only set in transforms.conf for REPORT and TRANSFORMS field extractions. Optional. Limits the amount of resources that are spent by PCRE Use this to set an upper bound on how many times PCRE calls an internal |
| DEPTH_LIMIT | `<integer>` | `1000` | Only set in transforms.conf for REPORT and TRANSFORMS field extractions. Optional. Limits the amount of resources that are spent by PCRE Use this to limit the depth of nested backtracking in an internal PCRE |
| CLONE_SOURCETYPE | `<string>` | — | This name is wrong; a transform with this setting actually clones and If CLONE_SOURCETYPE is used as part of a transform, the transform creates a Use this setting when you need to store both the original and a modified A typical example would be to retain sensitive information according to Specifically, for each event handled by this transform, a near-exact copy The <string> used for CLONE_SOURCETYPE selects the source type that is used The new source type MUST differ from the the original source type. If the The duplicated events receive index-time transformations & sed This means that pro... |
| LOOKAHEAD | `<integer>` | `4096` | NOTE: This option is valid for all index time transforms, such as Optional. Specifies how many characters to search into an event. You may want to increase this value if you have event line lengths that |
| WRITE_META | `<boolean>` | `false` | Whether or not the Splunk platform writes REGEX values to the _meta 'DEST_KEY'. When the Splunk platform writes REGEX values to metadata, those REGEX values This setting is required for all index-time field extractions except for Where applicable, set "WRITE_META = true" instead of setting "DEST_KEY = A value of "true" means that the Splunk platform writes REGEX values to A value of "false" means that the Splunk platform does not write |
| DEST_KEY | `<KEY>` | — | Specifies where Splunk software stores the expanded FORMAT results in NOTE: This setting is only valid for index-time field extractions. Required for index-time field extractions where WRITE_META = false or is For index-time extractions, DEST_KEY can be set to a number of values If DEST_KEY = _meta (not recommended) you should also add $0 to the The $0 value is in no way derived *from* the REGEX match. (It KEY names are case-sensitive, and should be used exactly as they appear in |
| DEFAULT_VALUE | `<string>` | `empty string` | NOTE: This setting is only valid for index-time field extractions. Optional. The Splunk software writes the DEFAULT_VALUE to DEST_KEY if the |
| SOURCE_KEY | `<string>` | `_raw` | NOTE: This setting is valid for both index-time and search-time field Optional. Defines the KEY that Splunk software applies the REGEX to. For search time extractions, you can use this setting to extract one or For index-time extractions use the KEYs described at the bottom of this KEYs are case-sensitive, and should be used exactly as they appear in If <string> starts with "field:" or "fields:" the meaning is changed. SOURCE_KEY is typically used in conjunction with REPEAT_MATCH in This means it is applied to the raw, unprocessed text of all events. |
| REPEAT_MATCH | `<boolean>` | `false` | NOTE: This setting is only valid for index-time field extractions. Optional. When set to true, Splunk software runs the REGEX multiple REPEAT_MATCH starts wherever the last match stopped, and continues until |
| INGEST_EVAL | `<comma-separated list of evaluator expressions>` | `empty` | NOTE: This setting is only valid for index-time field extractions. When you set INGEST_EVAL, this setting overrides all but one of other The expression takes a similar format to the search-time "\|eval" command. Keys which are commonly used with DEST_KEY or SOURCE_KEY (like When INGEST_EVAL accesses the "_time" variable, subsecond information is By default, other variable names refer to index-time fields which are You can force a variable to be treated as a direct KEY name by When writing to a _meta field, the default behavior is to add a new NOTE: Replacing index-time fields is slower than ... |
| DELIMS | `<quoted string list>` | `""` | NOTE: This setting is only valid for search-time field extractions. IMPORTANT: If a value may contain an embedded unescaped double quote Optional. Use DELIMS in place of REGEX when you are working with ASCII-only Sets delimiter characters, first to separate data into field/value pairs, Each individual ASCII character in the delimiter string is used as a Delimiters must be specified within double quotes (eg. DELIMS="\|,;"). When the event contains full delimiter-separated field/value pairs, you The first set of quoted delimiters extracts the field/value pairs. The second set of quoted delimit... |
| FIELDS | `<quoted string list>` | `""` | NOTE: This setting is only valid for search-time field extractions. Used in conjunction with DELIMS when you are performing delimiter-based FIELDS enables you to provide field names for the extracted field values, NOTE: If field names contain spaces or commas they must be quoted with " " The following example is a delimiter-based field extraction where three |
| MV_ADD | `<boolean>` | `false` | NOTE: This setting is only valid for search-time field extractions. Optional. Controls what the extractor does when it finds a field which If set to true, the extractor makes the field a multivalued field and |
| CLEAN_KEYS | `<boolean>` | `true` | NOTE: This setting is only valid for search-time field extractions. Optional. Controls whether Splunk software "cleans" the keys (field names) it Add CLEAN_KEYS = false to your transform if you need to extract field |
| KEEP_EMPTY_VALS | `<boolean>` | `false` | NOTE: This setting is only valid for search-time field extractions. Optional. Controls whether Splunk software keeps field/value pairs when This option does not apply to field/value pairs that are generated by |
| CAN_OPTIMIZE | `<boolean>` | `true` | NOTE: This setting is only valid for search-time field extractions. Optional. Controls whether Splunk software can optimize this extraction out You might use this if you are running searches under a Search Mode setting Splunk software only disables an extraction if it can determine that none of NOTE: This option should be rarely set to false. |
| STOP_PROCESSING_IF | `<evaluator expression>` | `empty string` | An evaluator expression that the regexreplacement processor uses to determine If you set STOP_PROCESSING_IF, and the regexreplacement processor evaluates the When you set STOP_PROCESSING_IF, like INGEST_EVAL, this setting overrides The processor treats the return value for <evaluator expression> as a boolean value. If this setting appears in multiple rules, then the processor applies the settings All TRANSFORMS, alphabetically All RULESETs, alphabetically Within a single rule set class, where they appear in the rule set class Optional. NOTE: This setting is only valid for index-time field e... |

### Lookup tables

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| filename | `<string>` | `empty string` | Name of static lookup file. File should be in $SPLUNK_HOME/etc/system/lookups/, or in If file is in multiple 'lookups' directories, no layering is done. Standard conf file precedence is used to disambiguate. Only file names are supported. Paths are explicitly not supported. If you Splunk software then looks for this filename in |
| collection | `<string>` | `empty string (in which case the name of the stanza is used).` | Name of the collection to use for this lookup. Collection should be defined in $SPLUNK_HOME/etc/apps/<app_name>/local/collections.conf If collection is in multiple collections.conf file, no layering is done. Standard conf file precedence is used to disambiguate. |
| max_matches | `<integer>` | `100 matches if the time_field setting is not specified for the` | The maximum number of possible matches for each input lookup value If the lookup is non-temporal (not time-bound, meaning the time_field If the lookup is temporal, Splunk software uses the first <integer> entries |
| min_matches | `<integer>` | `Default = 0 for both temporal and non-temporal lookups, which means that` | Minimum number of possible matches for each input lookup value. However, if min_matches > 0, and Splunk software gets less than min_matches, |
| default_match | `<string>` | `empty string.` | If min_matches > 0 and Splunk software has less than min_matches for any |
| max_duplicates | `<integer>` | `0` | The maximum number of duplicates that a lookup can have across all fields. This setting determines the memory, in bytes, that can be used for each processing batch for this lookup. This setting should have value greater than the 'max_matches' setting. Only applicable for file-based lookups that are greater than the 'max_memtable_bytes' setting, NOTE: Do not change this setting unless instructed to do so by Splunk Support. Value 0 means this setting has no effect. There is no maximum. |
| case_sensitive_match | `<boolean>` | `true` | If set to true, Splunk software performs case sensitive matching for all If set to false, Splunk software performs case insensitive matching for all NOTE: For KV Store lookups, a setting of 'case_sensitive_match=false' is For case sensitive field matching in reverse lookups see |
| reverse_lookup_honor_case_sensitive_match | `<boolean>` | `true` | Determines whether field matching for a reverse lookup is case sensitive or When set to true, and 'case_sensitive_match' is true Splunk software performs When set to true, and 'case_sensitive_match' is false Splunk software When set to false, Splunk software performs case-insensitive matching for NOTE: This setting does not apply to KV Store lookups. |
| match_type | `<string>` | `EXACT` | A comma and space-delimited list of <match_type>(<field_name>) The available match_type values are WILDCARD, CIDR, and EXACT. Only fields |
| external_cmd | `<string>` | `empty string` | Provides the command and arguments to invoke to perform a lookup. Use this This string is parsed like a shell command. The first argument is expected to be a python script (or executable file) Presence of this field indicates that the lookup is external and command |
| fields_list | `<string>` | — | A comma- and space-delimited list of all fields that are supported by the |
| index_fields_list | `<string>` | `all fields that are defined in the .csv lookup file header.` | A comma- and space-delimited list of fields that need to be indexed The other fields are not indexed and not searchable. Restricting the fields enables better lookup performance. |
| external_type | `[python\|executable\|kvstore\|geo\|geo_hex]` | `python` | This setting describes the external lookup type. Use 'python' for external lookups that use a python script. Use 'executable' for external lookups that use a binary executable, such as a Use 'kvstore' for KV store lookups. Use 'geo' for geospatial lookups. 'geo_hex' is reserved for the geo_hex H3 lookup. |
| python.version | `{default\|python\|python2\|python3\|python3.7\|python3.9\|latest}` | `Not set; uses the system-wide Python version.` | DEPRECATED. Use 'python.required' instead to specify which Python versions the For Python scripts only, selects which Python version to use. Set to either "default" or "python" to use the system-wide default Python Set to "python3" or "python3.7" to use the Python 3.7 version. Set to "python3.9" to use the Python 3.9 version. In the context of configuring apps, the "latest" value is not currently Optional. |
| python.required | `<comma-separated list>` | `Not set; uses 'python.version' if that setting has a value.` | For Python scripts only, the versions of Python that the script supports. This setting takes precedence over the 'python.version' setting if both The Splunk platform selects the highest version of Python that is The following values are supported: "3.9": The script supports Python version 3.9. "3.13": The script supports Python version 3.13. "latest": The script uses the latest Python interpreter available. Where possible, use a specific version string rather than "latest". NOTE: The "latest" value is an internal value that is related to NOTE: Use this setting instead of the deprecated 'pyt... |
| time_field | `<string>` | `empty string` | Used for temporal (time-bound) lookups. Specifies the name of the field This means that lookups are not temporal by default. |
| time_format | `<string>` | `%s.%Q (seconds from unix epoch in UTC and optional milliseconds)` | For temporal lookups this specifies the 'strptime' format of the timestamp You can include subseconds but Splunk software ignores them. |
| max_offset_secs | `<integer>` | `2000000000, or the offset in seconds from 0:00 UTC Jan 1, 1970.` | For temporal lookups, this is the maximum time (in seconds) that the event |
| min_offset_secs | `<integer>` | `0` | For temporal lookups, this is the minimum time (in seconds) that the event |
| batch_index_query | `<boolean>` | `true` | For large file-based lookups, batch_index_query determines whether queries |
| allow_caching | `<boolean>` | `true` | Allow output from lookup scripts to be cached |
| cache_size | `<integer>` | `10000` | Cache size to be used for a particular lookup. If a previously looked up The cache size represents the number of input values for which to cache Do not change this value unless you are advised to do so by Splunk Support or |
| max_ext_batch | `<integer>` | `300` | The maximum size of external batch (range 1 - 1000). This setting applies only to KV Store lookup configurations. |
| filter | `<string>` | — | Filter results from the lookup table before returning data. Create this filter For KV Store lookups, filtering is done when data is initially retrieved to For CSV lookups, filtering is done in memory. |
| feature_id_element | `<string>` | `/Placemark/name` | If the lookup file is a kmz file, this field can be used to specify the xml This setting applies only to geospatial lookup configurations. |
| check_permission | `<boolean>` | `false` | Specifies whether the system can verify that a user has write permission to a The check_permission setting is only respected when you set You can set lookup table file permissions in the .meta file for each lookup This setting applies only to CSV lookup configurations. |
| replicate | `<boolean>` | `true` | Indicates whether to replicate CSV lookups to indexers. When false, the CSV lookup is replicated only to search heads in a search When true, the CSV lookup is replicated to both indexers and search heads. Only for CSV lookup files. Note that replicate=true works only if it is included in the replication |

### Metrics

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| REGEX | `<regular expression>` | — | Splunk software supports a named capturing group extraction format to provide |
| REMOVE_DIMS_FROM_METRIC_NAME | `<boolean>` | `true` | If set to false, the matched dimension values from the REGEX above would also If true, the matched dimension values would not be a part of metric name. |
| METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix> | `(_ALLNUMS_ \| (_NUMS_EXCEPT_ )? <field1>, <field2>,... )` | `empty string` | Optional. <unique_metric_name_prefix> should match the value of a field extracted from If this setting is exactly equal to _ALLNUMS_, the Splunk software treats If this setting starts with _NUMS_EXCEPT_, the Splunk software treats all NOTE: a space is required between the '_NUMS_EXCEPT_' prefix and '<field1>'. Otherwise, the Splunk software treats all fields that are listed and which If the value of the 'metric_name' index-time extraction matches with the Creates a metric with a new metric_name for each measure field where the Saves the corresponding numeric value for each measure field as ... |
| METRIC-SCHEMA-BLACKLIST-DIMS-<unique_metric_name_prefix> | `<dimension_field1>,` | — | — |
| METRIC-SCHEMA-WHITELIST-DIMS-<unique_metric_name_prefix> | `<dimension_field1>,` | — | — |
| METRIC-SCHEMA-MEASURES | `(_ALLNUMS_ \| (_NUMS_EXCEPT_ )? <field1>, <field2>,... )` | `empty string` | Optional. This configuration has a lower precedence over METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix> When no prefix can be identified, this configuration is active The Splunk platform saves the remaining index-time field extractions as Use the wildcard character ("*") to match multiple similar <field> |
| METRIC-SCHEMA-BLACKLIST-DIMS | `<dimension_field1>, <dimension_field2>,...` | `empty string` | Optional. This deny list configuration allows the Splunk platform to omit unnecessary Use this configuration in conjunction with a corresponding <dimension_field> should match the name of a field in the log event that is Use the wildcard character ("*") to match multiple similar <dimension_field> The Splunk platform applies the following evaluation logic when you use the If a dimension is in the deny list (METRIC-SCHEMA-BLACKLIST-DIMS), it will If a dimension is not in the allow list, it will not be present in the |
| METRIC-SCHEMA-WHITELIST-DIMS | `<dimension_field1>, <dimension_field2>,...` | `empty string` | Optional. This allow list configuration allows the Splunk platform to include only a Use this configuration in conjunction with a corresponding <dimension_field> should match the name of a field in the log event that is Use the wildcard character ("*") to match multiple similar <dimension_field> The Splunk platform applies the following evaluation logic when you use the If a dimension is in the deny list (METRIC-SCHEMA-BLACKLIST-DIMS), it will If a dimension is not in the allow list, it will not be present in the When the allow list is empty it behaves as if it contains all fields. |

### KEYS:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| <name> | `<key>` | `not set` | Modifies the list of valid SOURCE_KEY and DEST_KEY values. Splunk software Add entries to [accepted_keys] to provide valid keys for specific The 'name' element disambiguates entries, similar to -class entries in The 'name' element can be anything you choose, including a description of The entire stanza defaults to not being present, causing all keys not |
| metrics.disabled | `<boolean>` | `true` | Determines whether data for transform rule metrics is collected. |
| metrics.report_interval | `<interval>` | `30s` | Specifies how often to generate the per transform rule metrics logs. The interval can be specified as a string for seconds, minutes, hours, days. It will be rounded to integer times of the interval value defined under |
| metrics.rule_filter | `<string>` | `empty string` | Per transform rule metrics will be collected only for rule names that match Wildcards (*) are supported. Multiple rules shall be seperated by commas, If set to the default, metrics data will be collected for all transform |
