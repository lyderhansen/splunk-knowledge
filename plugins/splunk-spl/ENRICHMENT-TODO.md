# splunk-spl Reference Enrichment TODO

Source: `SplunkSearchManual10.2.pdf` (985 pages)
Goal: Every file needs Syntax, Parameters table, 2-3 Examples, Gotchas, Tips & Tricks

Work through top-to-bottom. Check off when done.

| # | Command | Lines | Gotchas | Examples | Priority |
|---|---|---|---|---|---|
| 1 | `ctable` | 9 | **NO** | **NO** | **CRITICAL** |
| 2 | `msearch` | 9 | **NO** | **NO** | **CRITICAL** |
| 3 | `datamodelsimple` | 10 | **NO** | **NO** | **CRITICAL** |
| 4 | `typelearner` | 10 | **NO** | **NO** | **CRITICAL** |
| 5 | `findtypes` | 12 | **NO** | **NO** | **CRITICAL** |
| 6 | `folderize` | 13 | **NO** | **NO** | **CRITICAL** |
| 7 | `localop` | 13 | **NO** | **NO** | **CRITICAL** |
| 8 | `rtorder` | 13 | **NO** | **NO** | **CRITICAL** |
| 9 | `sirare` | 13 | **NO** | **NO** | **CRITICAL** |
| 10 | `sitimechart` | 13 | **NO** | **NO** | **CRITICAL** |
| 11 | `sitop` | 13 | **NO** | **NO** | **CRITICAL** |
| 12 | `meventcollect` | 14 | **NO** | **NO** | **CRITICAL** |
| 13 | `sichart` | 14 | **NO** | **NO** | **CRITICAL** |
| 14 | `sistats` | 14 | **NO** | **NO** | **CRITICAL** |
| 15 | `typer` | 14 | **NO** | **NO** | **CRITICAL** |
| 16 | `history` | 17 | **NO** | yes | **CRITICAL** |
| 17 | `mpreview` | 18 | **NO** | yes | **CRITICAL** |
| 18 | `pivot` | 18 | **NO** | yes | **CRITICAL** |
| 19 | `sendalert` | 18 | **NO** | yes | **CRITICAL** |
| 20 | `overlap` | 19 | **NO** | yes | **CRITICAL** |
| 21 | `delete` | 20 | yes | **NO** | HIGH |
| 22 | `x11` | 20 | **NO** | yes | HIGH |
| 23 | `addinfo` | 21 | **NO** | yes | HIGH |
| 24 | `audit` | 21 | **NO** | **NO** | HIGH |
| 25 | `redistribute` | 21 | yes | yes | HIGH |
| 26 | `localize` | 23 | **NO** | yes | HIGH |
| 27 | `script` | 23 | yes | **NO** | HIGH |
| 28 | `searchtxn` | 23 | **NO** | yes | HIGH |
| 29 | `abstract` | 24 | **NO** | yes | HIGH |
| 30 | `analyzefields` | 24 | **NO** | yes | HIGH |
| 31 | `bucketdir` | 24 | **NO** | yes | HIGH |
| 32 | `correlate` | 24 | **NO** | yes | HIGH |
| 33 | `gauge` | 24 | **NO** | yes | HIGH |
| 34 | `outputtext` | 24 | **NO** | yes | HIGH |
| 35 | `savedsearch` | 24 | **NO** | yes | HIGH |
| 36 | `accum` | 25 | **NO** | yes | HIGH |
| 37 | `anomalousvalue` | 25 | **NO** | yes | HIGH |
| 38 | `autoregress` | 25 | **NO** | yes | HIGH |
| 39 | `cofilter` | 25 | **NO** | yes | HIGH |
| 40 | `dbinspect` | 25 | **NO** | yes | HIGH |
| 41 | `eventcount` | 25 | **NO** | yes | HIGH |
| 42 | `outlier` | 25 | **NO** | yes | HIGH |
| 43 | `typeahead` | 25 | **NO** | yes | HIGH |
| 44 | `anomalydetection` | 26 | **NO** | yes | HIGH |
| 45 | `arules` | 26 | **NO** | yes | HIGH |
| 46 | `contingency` | 26 | **NO** | yes | HIGH |
| 47 | `geomfilter` | 26 | **NO** | yes | HIGH |
| 48 | `loadjob` | 26 | **NO** | yes | HIGH |
| 49 | `outputcsv` | 26 | **NO** | yes | HIGH |
| 50 | `walklex` | 26 | **NO** | yes | HIGH |
| 51 | `associate` | 27 | **NO** | yes | HIGH |
| 52 | `delta` | 27 | **NO** | yes | HIGH |
| 53 | `diff` | 27 | **NO** | yes | HIGH |
| 54 | `kmeans` | 27 | **NO** | yes | HIGH |
| 55 | `mcollect` | 27 | **NO** | yes | HIGH |
| 56 | `rangemap` | 27 | **NO** | yes | HIGH |
| 57 | `anomalies` | 28 | **NO** | yes | HIGH |
| 58 | `cluster` | 28 | **NO** | yes | HIGH |
| 59 | `concurrency` | 28 | **NO** | yes | HIGH |
| 60 | `metasearch` | 28 | yes | yes | HIGH |
| 61 | `trendline` | 28 | **NO** | yes | HIGH |
| 62 | `untable` | 28 | **NO** | yes | HIGH |
| 63 | `makecontinuous` | 29 | yes | yes | HIGH |
| 64 | `inputcsv` | 30 | yes | yes | HIGH |
| 65 | `predict` | 30 | **NO** | yes | HIGH |
| 66 | `transpose` | 30 | yes | yes | HIGH |
| 67 | `datamodel` | 32 | yes | yes | HIGH |
| 68 | `metadata` | 32 | yes | yes | HIGH |
| 69 | `multisearch` | 32 | yes | yes | HIGH |
| 70 | `sendemail` | 32 | yes | yes | HIGH |
| 71 | `timewrap` | 32 | yes | yes | HIGH |
| 72 | `appendcols` | 33 | yes | yes | HIGH |
| 73 | `appendpipe` | 33 | yes | yes | HIGH |
| 74 | `fieldsummary` | 33 | yes | yes | HIGH |
| 75 | `nomv` | 33 | yes | yes | HIGH |
| 76 | `tscollect` | 33 | **NO** | yes | HIGH |
| 77 | `xyseries` | 33 | yes | yes | HIGH |
| 78 | `map` | 34 | yes | yes | HIGH |
| 79 | `return` | 34 | **NO** | yes | HIGH |
| 80 | `collect` | 35 | yes | yes | MEDIUM |
| 81 | `gentimes` | 35 | yes | yes | MEDIUM |
| 82 | `geom` | 35 | yes | yes | MEDIUM |
| 83 | `selfjoin` | 35 | yes | yes | MEDIUM |
| 84 | `set` | 35 | **NO** | yes | MEDIUM |
| 85 | `geostats` | 36 | yes | yes | MEDIUM |
| 86 | `union` | 37 | yes | yes | MEDIUM |
| 87 | `foreach` | 38 | yes | yes | MEDIUM |
| 88 | `from` | 38 | yes | yes | MEDIUM |
| 89 | `strcat` | 38 | yes | yes | MEDIUM |
| 90 | `format` | 39 | yes | yes | MEDIUM |
| 91 | `rest` | 40 | yes | yes | MEDIUM |
| 92 | `iplocation` | 41 | yes | yes | MEDIUM |
| 93 | `makeresults` | 42 | yes | yes | MEDIUM |
| 94 | `mvcombine` | 42 | yes | yes | MEDIUM |
| 95 | `bin` | 44 | yes | yes | MEDIUM |
| 96 | `inputlookup` | 44 | yes | yes | MEDIUM |
| 97 | `outputlookup` | 44 | yes | yes | MEDIUM |
| 98 | `append` | 45 | yes | yes | MEDIUM |
| 99 | `makemv` | 45 | yes | yes | MEDIUM |
| 100 | `transaction` | 46 | yes | yes | MEDIUM |
| 101 | `sort` | 49 | yes | yes | MEDIUM |
| 102 | `mvexpand` | 53 | yes | yes | OK |
| 103 | `tail` | 53 | yes | yes | OK |
| 104 | `tstats` | 53 | yes | yes | OK |
| 105 | `require` | 55 | yes | yes | OK |
| 106 | `reverse` | 55 | yes | yes | OK |
| 107 | `xmlunescape` | 56 | yes | yes | OK |
| 108 | `lookup` | 57 | yes | yes | OK |
| 109 | `addcoltotals` | 58 | yes | yes | OK |
| 110 | `uniq` | 58 | yes | yes | OK |
| 111 | `dedup` | 59 | yes | yes | OK |
| 112 | `scrub` | 59 | yes | yes | OK |
| 113 | `addtotals` | 61 | yes | yes | OK |
| 114 | `join` | 61 | yes | yes | OK |
| 115 | `rare` | 61 | yes | yes | OK |
| 116 | `setfields` | 62 | yes | yes | OK |
| 117 | `top` | 64 | yes | yes | OK |
| 118 | `eventstats` | 65 | yes | yes | OK |
| 119 | `kvform` | 65 | yes | yes | OK |
| 120 | `multikv` | 66 | yes | yes | OK |
| 121 | `reltime` | 66 | yes | yes | OK |
| 122 | `xmlkv` | 66 | yes | yes | OK |
| 123 | `filldown` | 67 | yes | yes | OK |
| 124 | `highlight` | 67 | yes | yes | OK |
| 125 | `where` | 67 | yes | yes | OK |
| 126 | `fieldformat` | 69 | yes | yes | OK |
| 127 | `rename` | 69 | yes | yes | OK |
| 128 | `streamstats` | 69 | yes | yes | OK |
| 129 | `fillnull` | 70 | yes | yes | OK |
| 130 | `regex` | 70 | yes | yes | OK |
| 131 | `chart` | 72 | yes | yes | OK |
| 132 | `erex` | 72 | yes | yes | OK |
| 133 | `replace` | 74 | yes | yes | OK |
| 134 | `table` | 75 | yes | yes | OK |
| 135 | `head` | 77 | yes | yes | OK |
| 136 | `tojson` | 77 | yes | yes | OK |
| 137 | `iconify` | 78 | yes | yes | OK |
| 138 | `fields` | 79 | yes | yes | OK |
| 139 | `extract` | 81 | yes | yes | OK |
| 140 | `xpath` | 81 | yes | yes | OK |
| 141 | `timechart` | 82 | yes | yes | OK |
| 142 | `search` | 83 | yes | yes | OK |
| 143 | `mstats` | 86 | yes | yes | OK |
| 144 | `rex` | 87 | yes | yes | OK |
| 145 | `tags` | 87 | yes | yes | OK |
| 146 | `convert` | 88 | yes | yes | OK |
| 147 | `spath` | 114 | yes | yes | OK |
| 148 | `stats` | 136 | yes | yes | OK |
| 149 | `eval` | 245 | yes | **NO** | OK |

## Summary
- **CRITICAL** (< 20 lines): 20 files
- **HIGH** (20-34 lines): 59 files
- **MEDIUM** (35-49 lines): 22 files
- **OK** (50+ lines): 48 files
- Missing gotchas: 62 files
- Missing examples: 19 files
- Total: 149 files
