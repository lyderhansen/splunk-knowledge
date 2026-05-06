# splunk.events — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.events.js`.

**8 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | Specify the color used for the background by using a hexadecimal code. For example, #0000FF. |
| `eventActions` | array | `[]` |  | 'Specify the available actions to take for an event. For example, `[{ "eventType": "eventAction.buildEventType.click", "label": "Build Event Type" }]`. Event types should end in `.click` if utilizing event handlers. N... |
| `fieldActions` | object | `—` |  | 'Specify the available actions for this field. For example, `{ *: [{ "eventType": "fieldAction.sharedAction1.click", "label": "Shared Action 1", "eventtypeValues": ["*"], "fieldFilters": ["*"] }] }`. Event types shoul... |
| `footerFields` | array | `[]` |  | 'Specify field(s) that should be displayed in the footer component. Specify one or more fields to display in the footer component. For example, specify ["source", "dest"] to display the source and destination fields.' |
| `highlightValuesByField` | object | `—` |  | 'Specify the field and value pairs for manual highlighting. For example, `{"source": "$srcToken$", "dest": "12.21.1.11", "tag": ["tag1", "tag2"]}`.' |
| `highlightFromSource` | string | `none` |  | 'Specify a segmentation mode to use for search based highlighting. Specifying "none" will turn search based highlighting off. For more about segmentation, search for "event segmentation" in the Getting Data In manual ... |
| `pageCount` | number | `10` |  | Specify the maximum number of rows to display per page. |
| `showFieldSummary` | boolean | `true` |  | Specify that a field summary popup appears when a field is selected. To show field summaries for a search, configure an additional datasource called `fieldsummary` using the original search followed by the `... | fiel... |