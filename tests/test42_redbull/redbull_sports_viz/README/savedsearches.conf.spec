# savedsearches.conf.spec
# Spec file for Red Bull Sports Viz demo saved searches.
# Each search uses inputlookup to load demo CSV data.

[<stanza-name>]
* Each stanza defines one demo saved search for a viz.

display.visualizations.type = <string>
* Set to "custom" for custom visualizations.

display.visualizations.custom.type = <string>
* The custom viz type identifier in format: app_id.viz_name

display.general.timeRangePicker.show = <bool>
* Whether to show time range picker.

search = <string>
* The SPL search string.
