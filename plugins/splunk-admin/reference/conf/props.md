# props.conf

> Version 10.2.0
> 
> This file contains possible setting/value pairs for configuring Splunk
> software's processing properties through props.conf.
> 
> Props.conf is commonly used for:
> 
> * Configuring line breaking for multi-line events.
> * Setting up character set encoding.
> * Allowing processing of binary files.
> * Configuring timestamp recognition.
> * Configuring event segmentation.
> * Overriding automated host and source type matching. You can use
> props.conf to:
> * Configure advanced (regular expression-based) host and source
> type overrides.
> * Override source type matching for data from a particular source.
> * Set up rule-based source type recognition.
> * Rename source types.
> * Anonymizing certain types of sensitive incoming data, such as credit
> card or social security numbers, using sed scripts.
> * Routing specific events to a particular index, when you have multiple
> indexes.
> * Creating new index-time field extractions, including header-based field
> extractions.
> NOTE: Do not add to the set of fields that are extracted
> at index time unless it is absolutely necessary because there are
> negative performance implications.
> * Defining new search-time field extractions. You can define basic
> search-time field extractions entirely through props.conf, but a
> transforms.conf component is required if you need to create search-time
> field extractions that involve one or more of the following:
> * Reuse of the same field-extracting regular expression across
> multiple sources, source types, or hosts.
> * Application of more than one regular expression (regex) to the
> same source, source type, or host.
> * Delimiter-based field extractions (they involve field-value pairs
> that are separated by commas, colons, semicolons, bars, or
> something similar).
> * Extraction of multiple values for the same field (multivalued
> field extraction).
> * Extraction of fields with names that begin with numbers or
> underscores.
> * Setting up lookup tables that look up fields from external sources.
> * Creating field aliases.
> 
> NOTE: Several of the above actions involve a corresponding transforms.conf
> configuration.
> 
> You can find more information on these topics by searching the Splunk
> documentation (http://docs.splunk.com/Documentation/Splunk).
> 
> There is a props.conf in $SPLUNK_HOME/etc/system/default/.  To set custom
> configurations, place a props.conf in $SPLUNK_HOME/etc/system/local/. For
> help, see props.conf.example.
> 
> You can enable configurations changes made to props.conf by typing the
> following search string in Splunk Web:
> 
> | extract reload=T
> 
> To learn more about configuration files (including precedence) see
> the documentation located at
> http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
> 
> For more information about using props.conf in conjunction with
> distributed Splunk deployments, see the Distributed Deployment Manual.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Parsing, Indexing, Search |
| Restart required | Reload via `| extract reload=T` or `debug/refresh` |
| Related files | transforms.conf, fields.conf, transactiontypes.conf |

## Stanzas and settings

Splunk documents most settings under logical sections; stanza patterns such as `[<spec>]`, `[host::...]`, `[source::...]`, `[rule::...]`, and `[delayedrule::...]` apply as described in the Introduction section.

### GLOBAL SETTINGS

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| priority | `<number>` | — | Overrides the default ASCII ordering of matching stanza names |
| CHARSET | `<string>` | `UTF-8` | When set, Splunk software assumes the input from the given [<spec>] is in Can only be used as the basis of [<sourcetype>] or [source::<spec>], A list of valid encodings can be retrieved using the command "iconv -l" on If an invalid encoding is specified, a warning is logged during initial If the source encoding is valid, but some characters from the [<spec>] are When set to "AUTO", Splunk software attempts to automatically determine the For a complete list of the character sets Splunk software automatically This setting applies at input time, when data is first read by Splunk |

### Line breaking

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| TRUNCATE | `<non-negative integer>` | `10000` | The default maximum line length, in bytes. Although this is in bytes, line length is rounded down when this would Set to 0 if you never want truncation (very long lines are, however, often |
| LINE_BREAKER | `<regular expression>` | `([\r\n]+) (Data is broken into an event for each line,` | Specifies a regex that determines how the raw text stream is broken into The regex must contain a capturing group -- a pair of parentheses which Wherever the regex matches, Splunk software considers the start of the first The contents of the first capturing group are discarded, and are not NOTE: You get a significant boost to processing speed when you use When using LINE_BREAKER to delimit events, SHOULD_LINEMERGE should be set Using LINE_BREAKER to delimit events is discussed in more detail in the Special considerations for LINE_BREAKER with branched expressions  ** |
| LINE_BREAKER_LOOKBEHIND | `<integer>` | `100` | The number of bytes before the end of the raw data chunk When there is leftover data from a previous raw chunk, You might want to increase this value from its default if you are |
| SHOULD_LINEMERGE | `<boolean>` | `true` | Whether or not to combine several lines of data into a single When you set this to "true", Splunk software combines several lines of data When you set this to "false", Splunk software does not combine lines of |
| BREAK_ONLY_BEFORE_DATE | `<boolean>` | `true` | Whether or not to create a new event if a new line with a date is encountered When you set this to "true", Splunk software creates a new event only if it NOTE: When using DATETIME_CONFIG = CURRENT or NONE, this setting is not |
| BREAK_ONLY_BEFORE | `<regular expression>` | `empty string` | When set, Splunk software creates a new event only if it encounters a new |
| MUST_BREAK_AFTER | `<regular expression>` | `empty string` | When set, Splunk software creates a new event for the next input line only It is possible for the software to break before the current line if |
| MUST_NOT_BREAK_AFTER | `<regular expression>` | `empty string` | When set, and the current line matches the regular expression, Splunk software |
| MUST_NOT_BREAK_BEFORE | `<regular expression>` | `empty string` | When set, and the current line matches the regular expression, Splunk |
| MAX_EVENTS | `<integer>` | `256` | The maximum number of input lines to add to any event. Splunk software breaks after it reads the specified number of lines. |
| MAX_EXPECTED_EVENT_LINES | `<integer>` | `7` | The number of expected input lines per event, on average. Splunk software optimizes memory allocation for this number of lines. Do not change this setting without contacting Splunk Support. |
| ROUTE_EVENTS_OLDER_THAN | `<non-negative integer>[s\|m\|h\|d]` | `no default` | If set, AggregatorProcessor routes events older than 'ROUTE_EVENTS_OLDER_THAN' |
| EVENT_BREAKER_ENABLE | `<boolean>` | `false` | Whether or not a universal forwarder (UF) uses the 'ChunkedLBProcessor' When set to true, a UF splits incoming data with a When set to false, a UF uses standard load-balancing methods to Use this setting on a UF to indicate that data This setting is only valid on universal forwarder instances. |
| EVENT_BREAKER | `<regular expression>` | `"([\r\n]+)"` | A regular expression that specifies the event boundary for a The regular expression must contain a capturing group When the UF finds a match, it considers the first capturing group At this point, the forwarder can then change the receiving indexer This setting is only active if you set 'EVENT_BREAKER_ENABLE' to |
| LB_CHUNK_BREAKER | `<regular expression>` | `([\r\n]+)` | DEPRECATED. Use 'EVENT_BREAKER' instead. A regular expression that specifies the event boundary for a The regular expression must contain a capturing group When the UF finds a match, it considers the first capturing group Splunk software discards the contents of the first capturing group. At this point, the forwarder can then change the receiving indexer This is only used if [httpout] is configured in outputs.conf |
| LB_CHUNK_BREAKER_TRUNCATE | `<non-negative integer>` | `2000000` | The maximum length, in bytes, of a chunk of data that a forwarder Although this is a byte value, the forwarder rounds down the length This setting is valid only if you configure an [httpout] stanza in the |

### Timestamp extraction configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| DATETIME_CONFIG | `[<filename relative to $SPLUNK_HOME> \| CURRENT \| NONE]` | `/etc/datetime.xml (for example, $SPLUNK_HOME/etc/datetime.xml).` | Specifies which file configures the timestamp extractor, which identifies This setting may also be set to "NONE" to prevent the timestamp "CURRENT" sets the time of the event to the time that the event was "NONE" leaves the event time set to whatever time was selected by For data sent by Splunk forwarders over the Splunk-to-Splunk protocol, For file-based inputs (monitor, batch) the time chosen is the For other inputs, the time chosen is the current system time when Both "CURRENT" and "NONE" explicitly disable the per-text timestamp For more information on 'DATETIME_CONFIG' and datetime.xml... |
| TIME_PREFIX | `<regular expression>` | `empty string` | If set, Splunk software scans the event text for a match for this regex The timestamping algorithm only looks for a timestamp in the text For example, if 'TIME_PREFIX' is set to "abc123", only text following the If the 'TIME_PREFIX' cannot be found in the event text, timestamp extraction |
| MAX_TIMESTAMP_LOOKAHEAD | `<integer>` | `128` | The number of characters into an event Splunk software should look This constraint to timestamp extraction is applied from the point of the For example, if 'TIME_PREFIX' positions a location 11 characters into the If set to 0 or -1, the length constraint for timestamp recognition is |
| TIME_FORMAT | `<strptime-style format>` | `empty string` | Specifies a "strptime" format string to extract the date. "strptime" is an industry standard for designating time formats. For more information on strptime, see "Configure timestamp recognition" in TIME_FORMAT starts reading after the TIME_PREFIX. If both are specified, For good results, the <strptime-style format> should describe the day of |
| DETERMINE_TIMESTAMP_DATE_WITH_SYSTEM_TIME | `<boolean>` | `false` | Whether or not the Splunk platform uses the current system time to If set to "true", the platform uses the system time to determine the If the future event has a timestamp that is less than three hours Otherwise, it presumes that the timestamp date is in the future, and If set to "false", the platform uses the last successfully-parsed |
| TZ | `<timezone identifier>` | `empty string` | The algorithm for determining the time zone for a particular event is as If the event has a timezone in its raw text (for example, UTC, -08:00), If TZ is set to a valid timezone string, use that. If the event was forwarded, and the forwarder-indexer connection uses Otherwise, use the timezone of the system that is running splunkd. |
| TZ_ALIAS | `<key=value>[,<key=value>]...` | `not set` | Provides Splunk software admin-level control over how timezone strings For example, EST can mean Eastern (US) Standard time, or Eastern There is no requirement to use 'TZ_ALIAS' if the traditional Splunk software Has no effect on the 'TZ' value. This only affects timezone strings from event The setting is a list of key=value pairs, separated by commas. The key is matched against the text of the timezone specifier of the The value is another TZ specifier which expresses the desired offset. Example: TZ_ALIAS = EST=GMT+10:00 (See props.conf.example for more/full |
| MAX_DAYS_AGO | `<integer>` | `2000 (5.48 years).` | The maximum number of days in the past, from the current date as Splunk software still indexes events with dates older than 'MAX_DAYS_AGO' If no such acceptable event exists, new events with timestamps older For example, if MAX_DAYS_AGO = 10, Splunk software applies the timestamp If your data is older than 2000 days, increase this setting. Highest legal value: 10951 (30 years). |
| MAX_DAYS_HENCE | `<integer>` | `2` | The maximum number of days in the future, from the current date as Splunk software still indexes events with dates more than 'MAX_DAYS_HENCE' If no such acceptable event exists, new events For example, if MAX_DAYS_HENCE = 3, Splunk software applies the timestamp of The default value includes dates from one day in the future. If your servers have the wrong date set or are in a timezone that is one NOTE: False positives are less likely with a smaller window. Change with Highest legal value: 10950 (30 years). |
| MAX_DIFF_SECS_AGO | `<integer>` | — | This setting prevents Splunk software from rejecting events with timestamps Do not use this setting to filter events. Splunk software uses Splunk software warns you if an event timestamp is more than After Splunk software throws the warning, it only rejects an event if it If your timestamps are wildly out of order, consider increasing NOTE: If the events contain time but not date (date determined another way, Highest legal value: 2147483646 (68.1 years). Defaults: 3600 (one hour). |
| MAX_DIFF_SECS_HENCE | `<integer>` | `604800 (one week).` | This setting prevents Splunk software from rejecting events with timestamps Do not use this setting to filter events. Splunk software uses Splunk software warns you if an event timestamp is more than After Splunk software throws the warning, it only rejects an event if it If your timestamps are wildly out of order, or you have logs that Highest legal value: 2147483646 (68.1 years). |
| ADD_EXTRA_TIME_FIELDS | `[none \| subseconds \| all \| <boolean>]` | `true (Enabled for most data sources.)` | Whether or not Splunk software automatically generates and indexes the date_hour, date_mday, date_minute, date_month, date_second, date_wday, These fields are never required, and may be turned off as desired. If set to "none" (or false), all indextime data about the timestamp is If set to "subseconds", the above fields are stripped out but the data about If set to "all" (or true), all of the indextime fields from the time |

### Structured Data Header Extraction and configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| INDEXED_EXTRACTIONS | `<CSV\|TSV\|PSV\|W3C\|JSON\|HEC>` | `not set` | The type of file that Splunk software should expect for a given source The following values are valid for 'INDEXED_EXTRACTIONS': These settings change the defaults for other settings in this subsection The HEC format lets events overide many details on a per-event basis, such When 'INDEXED_EXTRACTIONS = JSON' for a particular source type, do not also |
| METRICS_PROTOCOL | `<STATSD\|COLLECTD_HTTP>` | `not set` | Which protocol the incoming metric data is using: |
| STATSD-DIM-TRANSFORMS | `<statsd_dim_stanza_name1>,<statsd_dim_stanza_name2>..` | `not set` | Valid only when 'METRICS_PROTOCOL' is set to "statsd". A comma separated list of transforms stanza names which are used to extract Optional for sourcetypes which have only one transforms stanza for extracting Stanza names must start with prefix "statsd-dims:" |
| STATSD_EMIT_SINGLE_MEASUREMENT_FORMAT | `<boolean>` | `true` | Valid only when 'METRICS_PROTOCOL' is set to 'statsd'. This setting controls the metric data point format emitted by the statsd When set to true, the statsd processor produces metric data points in When set to false, the statsd processor produces metric data points in We recommend you set this to 'true' for statsd data, because the statsd data |
| METRIC-SCHEMA-TRANSFORMS | `<metric-schema:stanza_name>[,<metric-schema:stanza_name>]...` | `empty` | A comma-separated list of metric-schema stanza names from transforms.conf NOTE: This setting is valid only for index-time field extractions. Optional. |
| PREAMBLE_REGEX | `<regex>` | `not set` | A regular expression that lets Splunk software ignore "preamble lines", When set, Splunk software ignores these preamble lines, |
| FIELD_HEADER_REGEX | `<regex>` | `not set` | A regular expression that specifies a pattern for prefixed headers. The actual header starts after the pattern. It is not included in This setting supports the use of the special characters described above. The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| HEADER_FIELD_LINE_NUMBER | `<integer>` | `0` | The line number of the line within the specified file or source that If set to 0, Splunk software attempts to |
| FIELD_DELIMITER | `<character>` | `not set` | Which character delimits or separates fields in the You can use the delimiters for structured data header extraction with This setting supports the use of the special characters described above. The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| HEADER_FIELD_DELIMITER | `<character>` | `not set` | Which character delimits or separates header fields in The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| HEADER_FIELD_ACCEPTABLE_SPECIAL_CHARACTERS | `<string>` | `empty string` | This setting specifies the special characters that are allowed in header When this setting is not set, the processor replaces all characters in header For example, if you import a CSV file, and one of the header field names is If you configure this setting, the processor does not perform a character For example, if you configure this setting to ".", the processor does not This setting only supports characters with ASCII codes below 128. CAUTION: Certain special characters can cause the Splunk instance to For example, the field name "fieldname=a" is currently sanitized to |
| FIELD_QUOTE | `<character>` | `not set` | The character to use for quotes in the specified file You can use the delimiters for structured data header extraction with The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| HEADER_FIELD_QUOTE | `<character>` | `not set` | The character to use for quotes in the header of the You can use the delimiters for structured data header extraction with The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| TIMESTAMP_FIELDS | `[ <string>,..., <string>]` | `not set` | Some CSV and structured files have their timestamp encompass multiple This setting tells Splunk software to specify all such fields which If not specified, Splunk software tries to automatically extract the The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| FIELD_NAMES | `[ <string>,..., <string>]` | `not set` | Some CSV and structured files might have missing headers. This setting tells Splunk software to specify the header field names directly. The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| MISSING_VALUE_REGEX | `<regex>` | `not set` | The placeholder to use in events where no value is present. The default can vary if 'INDEXED_EXTRACTIONS' is set. |
| JSON_TRIM_BRACES_IN_ARRAY_NAMES | `<boolean>` | `false` | Whether or not the JSON parser for 'INDEXED_EXTRACTIONS' strips curly When the JSON parser extracts fields from JSON events, by default, it For example, given the following partial JSON event: Set 'JSON_TRIM_BRACES_IN_ARRAY_NAMES' to "true" if you want the JSON CAUTION: Setting this to "true" makes array field names that are extracted |

### Field extraction configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| TRANSFORMS-<class> | `<transform_stanza_name>, <transform_stanza_name2>,...` | — | Used for creating indexed fields (index-time field extractions). <class> is a unique literal string that identifies the namespace of the Note:** <class> values do not have to follow field name syntax <transform_stanza_name> is the name of your stanza from transforms.conf. Use a comma-separated list to apply multiple transform stanzas to a single See the RULESET-<class> setting for additional index-time transformation options. |
| RULESET-<class> | `<string>` | `empty string` | This setting is used to perform index-time transformations, such as filtering, A <class> is a unique string that identifies the name of a ruleset. Supply one or more transform stanza names as values for this setting. A Use a comma-separated list to apply multiple transform stanzas to a single Use the REST endpoint: /services/data/ingest/rulesets to configure this setting. This setting is nearly identical to the TRANSFORMS-<class> setting, with the If a RULESET is configured for a particular data stream on both indexers and If a data source matches both a TRANSFORMS and a RULESET, the proces... |
| RULESET_DESC-<class> | `<string>` | — | Description of 'RULESET-' to help users understand what a specific |
| REPORT-<class> | `<transform_stanza_name>, <transform_stanza_name2>,...` | — | Used for creating extracted fields (search-time field extractions) that <class> is a unique literal string that identifies the namespace of the <transform_stanza_name> is the name of your stanza from transforms.conf. Use a comma-separated list to apply multiple transform stanzas to a single |
| EXTRACT-<class> | `[<regex>\|<regex> in <src_field>]` | — | Used to create extracted fields (search-time field extractions) that do Performs a regex-based field extraction from the value of the source <class> is a unique literal string that identifies the namespace of the The <regex> is required to have named capturing groups. When the <regex> dotall (?s) and multi-line (?m) modifiers are added in front of the regex. Use '<regex> in <src_field>' to match the regex against the values of a NOTE: <src_field> has the following restrictions: It can only contain alphanumeric characters and underscore It must already exist as a field that has either been e... |
| KV_MODE | `[none\|auto\|auto_escaped\|multi\|multi:<multikv.conf_stanza_name>\|json\|xml]` | `auto` | Used for search-time field extractions only. Specifies the field/value extraction mode for the data. Set KV_MODE to one of the following: none - Disables field extraction for the host, source, or source type. auto_escaped - Extracts fields/value pairs separated by equal signs and multi - Invokes the 'multikv' search command, which extracts fields from multi:<multikv.conf_stanza_name> - Invokes a custom multikv.conf xml - Automatically extracts fields from XML data. json - Automatically extracts fields from JSON data. Setting to 'none' can ensure that one or more custom field extractions are... |
| MATCH_LIMIT | `<integer>` | `100000` | Only set in props.conf for EXTRACT type field extractions. Optional. Limits the amount of resources spent by PCRE Use this to set an upper bound on how many times PCRE calls an internal |
| DEPTH_LIMIT | `<integer>` | `1000` | Only set in props.conf for EXTRACT type field extractions. Optional. Limits the amount of resources spent by PCRE Use this to limit the depth of nested backtracking in an internal PCRE |
| AUTO_KV_JSON | `<boolean>` | `true` | Used only for search-time field extractions. Specifies whether to extract fields from JSON data when 'KV_MODE' is set to To disable automatic extraction of fields from JSON data when 'KV_MODE' is Setting 'AUTO_KV_JSON = false' when 'KV_MODE' is set to 'none', 'multi', |
| KV_TRIM_SPACES | `<boolean>` | `true` | Modifies the behavior of KV_MODE when set to auto, and auto_escaped. Traditionally, automatically identified fields have leading and trailing Example event: 2014-04-04 10:10:45 myfield=" apples " If this value is set to false, then external whitespace then this outer Example: 2014-04-04 10:10:45 myfield=" apples " The trimming logic applies only to space characters, not tabs, or other NOTE: Splunk Web currently has limitations with displaying and The limitations are not specific to this feature. Any embedded spaces The Splunk search language and included commands respect the spaces. |
| CHECK_FOR_HEADER | `<boolean>` | `false` | Used for index-time field extractions only. Set to true to enable header-based field extraction for a file. If the file has a list of columns and each event contains a field value Can only be used on the basis of [<sourcetype>] or [source::<spec>], Disabled when LEARN_SOURCETYPE = false. Causes the indexed source type to have an appended numeral; for The field names are stored in etc/apps/learned/local/props.conf. Because of this, this feature does not work in most environments where This setting applies at input time, when data is first read by Splunk |
| SEDCMD-<class> | `<sed script>` | — | Only used at index time. Commonly used to anonymize incoming data at index time, such as credit Used to specify a sed script which Splunk software applies to the _raw A sed script is a space-separated list of sed commands. Currently the replace (s) and character substitution (y). Syntax: replace - s/regex/replacement/flags regex is a perl regular expression (optionally containing capturing replacement is a string to replace the regex match. Use \n for back flags can be either: g to replace all matches, or a number to substitute - y/string1/string2/ substitutes the string1[i] with string2[i]... |
| FIELDALIAS-<class> | `(<orig_field_name> AS\|ASNEW <new_field_name>)+` | — | Use FIELDALIAS configurations to apply aliases to a field. This lets you <orig_field_name> is the original name of the field. It is not removed by <new_field_name> is the alias to assign to the <orig_field_name>. You can create multiple aliases for the same field. For example, a single Example of a valid configuration: You can include multiple field alias renames in the same stanza. Avoid applying the same alias field name to multiple original field For example, if you attempt to run the following configuration, If you must do this, set it up as a calculated field (an EVAL-* statement) The ... |
| EVAL-<fieldname> | `<eval statement>` | — | Use this to automatically run the <eval statement> and assign the value of When multiple EVAL-* statements are specified, they behave as if they are run in parallel, rather than in any particular sequence. Splunk software processes calculated fields after field extraction and You can use a field alias in the eval statement for a calculated You cannot use a field added through a lookup in an eval statement for a No default. |
| LOOKUP-<class> | `$TRANSFORM (<match_field> (AS <match_field_in_event>)?)+ (OUTPUT\|OUTPUTNEW (<output_field> (AS <output_field_in_event>)? )+ )?` | — | At search time, identifies a specific lookup table and describes how that <match_field> specifies a field in the lookup table to match on. By default Splunk software looks for a field with that same name in the You must provide at least one match field. Multiple match fields are <output_field> specifies a field in the lookup entry to copy into each If you do not specify an <output_field_in_event> value, Splunk software A list of output fields is not required. If they are not provided, all fields in the lookup table except for the If the output field list starts with the keyword "OUTPUTNEW" ... |

### Binary file configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| NO_BINARY_CHECK | `<boolean>` | `false (binary files are ignored).` | When set to true, Splunk software processes binary files. Can only be used on the basis of [<sourcetype>], or [source::<source>], This setting applies at input time, when data is first read by Splunk |
| detect_trailing_nulls | `[auto\|true\|false]` | `true` | When enabled, Splunk software tries to avoid reading in null bytes at When false, Splunk software assumes that all the bytes in the file should Set this value to false for UTF-16 and other encodings (CHARSET) values Subtleties of 'true' vs 'auto': 'true' is the historical behavior of trimming all null 'auto' is currently a synonym for true but may be extended to be This feature was introduced to work around programs which foolishly This setting applies at input time, when data is first read by Splunk |

### Segmentation configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| SEGMENTATION | `<segmenter>` | `indexing` | Specifies the segmenter from segmenters.conf to use at index time for the |

### File checksum configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| CHECK_METHOD | `[endpoint_md5\|entire_md5\|modtime]` | `endpoint_md5` | Set CHECK_METHOD to "endpoint_md5" to have Splunk software perform a checksum Set CHECK_METHOD to "entire_md5" to use the checksum of the entire file. Set CHECK_METHOD to "modtime" to check only the modification time of the Settings other than "endpoint_md5" cause Splunk software to index the entire This option is only valid for [source::<source>] stanzas. This setting applies at input time, when data is first read by Splunk |
| initCrcLength | `<integer>` | — | See documentation in inputs.conf.spec. |

### Small file settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| PREFIX_SOURCETYPE | `<boolean>` | `true` | NOTE: this setting is only relevant to the "[too_small]" sourcetype. Determines the source types that are given to files smaller than 100 PREFIX_SOURCETYPE = false sets the source type to "too_small." PREFIX_SOURCETYPE = true sets the source type to "<sourcename>-too_small", The advantage of PREFIX_SOURCETYPE = true is that not all small files For example, a Splunk search of "sourcetype=access*" retrieves This setting applies at input time, when data is first read by Splunk |

### Sourcetype configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| sourcetype | `<string>` | `empty string` | Can only be set for a [source::...] stanza. Anything from that <source> is assigned the specified source type. Is used by file-based inputs, at input time (when accessing logfiles) such sourcetype assignment settings on a system receiving forwarded Splunk data For log files read locally, data from log files matching <source> is |
| rename | `<string>` | `empty string` | Renames [<sourcetype>] as <string> at search time With renaming, you can search for the [<sourcetype>] with To search for the original source type without renaming it, use the Data from a renamed sourcetype only uses the search-time |
| invalid_cause | `<string>` | `empty string` | Can only be set for a [<sourcetype>] stanza. If invalid_cause is set, the Tailing code (which handles uncompressed Set <string> to "archive" to send the file to the archive processor When set to "winevt", this causes the file to be handed off to the Set to any other string to throw an error in the splunkd.log if you are This setting applies at input time, when data is first read by Splunk |
| SOURCETYPE_NAME_RESTRICTED_CHARACTERS | `<comma-separated list>` | `"#,&,>,<,?,::"` | The characters that cannot appear in a sourcetype name. If this setting has either no value or a value that is only whitespace, You can increase restrictions on sourcetype names by adding more characters, Consequently, you can reduce restrictions by supplying fewer characters, You must specify the value in double quotes, as shown in CAUTION: Consult Splunk Support before changing this setting. |
| is_valid | `<boolean>` | `true` | Automatically set by invalid_cause. This setting applies at input time, when data is first read by Splunk DO NOT SET THIS. |
| force_local_processing | `<boolean>` | `false` | Forces a universal forwarder to process all data tagged with this sourcetype Data with this sourcetype is processed by the linebreaker, Note that switching this property potentially increases the cpu Applicable only on a universal forwarder. |
| unarchive_cmd | `<string>` | `empty string` | Only called if invalid_cause is set to "archive". This field is only valid on [source::<source>] stanzas. <string> specifies the shell command to run to extract an archived source. Must be a shell command that takes input on stdin and produces output on Use _auto for Splunk software's automatic handling of archive files (tar, This setting applies at input time, when data is first read by Splunk |
| unarchive_cmd_start_mode | `[direct\|shell]` | `shell` | Determines how the Splunk platform runs the "unarchive_cmd" command. A value of "direct" means that the Splunk daemon runs the 'unarchive_cmd' command When this setting has a value of "direct", command shell operators such A value of "shell" means that a shell process runs the "unarchive_cmd" commands. |
| unarchive_sourcetype | `<string>` | `empty string` | Sets the source type of the contents of the matching archive file. Use If this field is empty (for a matching archive file props lookup) Splunk This setting applies at input time, when data is first read by Splunk |
| LEARN_SOURCETYPE | `<boolean>` | `true` | Determines whether learning of known or unknown sourcetypes is enabled. For known sourcetypes, refer to LEARN_MODEL. For unknown sourcetypes, refer to the rule:: and delayedrule:: Setting this field to false disables CHECK_FOR_HEADER as well (see above). This setting applies at input time, when data is first read by Splunk |
| LEARN_MODEL | `<boolean>` | `true` | For known source types, the file classifier adds a model file to the To disable this behavior for diverse source types (such as source code, This setting applies at input time, when data is first read by Splunk |
| termFrequencyWeightedDist | `<boolean>` | `false` | Whether or not the Splunk platform calculates distance between files by The Splunk platform calculates file "distance", or how similar one file When this setting is the default of "false", the platform determines the To instead have the platform use the frequency in which those terms occur |
| maxDist | `<integer>` | `300` | Determines how different a source type model may be from the current file. The larger the 'maxDist' value, the more forgiving Splunk software is For example, if the value is very small (for example, 10), then files A larger value indicates that files of the given source type can vary If you're finding that a source type model is matching too broadly, reduce This setting applies at input time, when data is first read by Splunk |
| MORE_THAN<optional_unique_value>_<number> | `<regular expression> (empty)` | — | — |
| LESS_THAN<optional_unique_value>_<number> | `<regular expression> (empty)` | — | This setting applies at input time, when data is first read by Splunk |

### Annotation Processor configured

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| ANNOTATE_PUNCT | `<boolean>` | `true` | Determines whether to index a special token starting with "punct::" The "punct::" key contains punctuation in the text of the event. If it is not useful for your dataset, or if it ends up taking |

### Header Processor configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| HEADER_MODE | `<empty> \| always \| firstline \| none` | `<empty>` | Determines whether to use the inline ***SPLUNK*** directive to rewrite If "always", any line with ***SPLUNK*** can be used to rewrite If "firstline", only the first line can be used to rewrite If "none", the string ***SPLUNK*** is treated as normal data. If <empty>, scripted inputs take the value "always" and file inputs This setting applies at input time, when data is first read by Splunk |

### Internal settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| _actions | `<string>` | `"new,edit,delete".` | Internal field used for user-interface control of objects. |
| pulldown_type | `<boolean>` | `empty` | Internal field used for user-interface control of source types. |
| given_type | `<string>` | `not set` | Internal field used by the CHECK_FOR_HEADER feature to remember the This setting applies at input time, when data is first read by Splunk |

### Sourcetype Category and Descriptions

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| description | `<string>` | `not set` | Field used to describe the sourcetype. Does not affect indexing behavior. |
| category | `<string>` | `not set` | Field used to classify sourcetypes for organization in the front end. Case |
