# Visual QA — gjennomgangsplan

Vi har **27 deployet dashboards** under `splunk-knowledge-testing` —
25 visualization-test-bencher + 2 interactivity-bencher. Hver finnes i
dark og light variant, men siden `make_light.py` *kun* gjør hex-remap +
`theme: "light"`, er layout og innhold identisk. Vi gjennomgår dark-
versjonen og noterer kun ett krav for light: at det leser bra mot lys
bakgrunn.

## QA-konvensjon

For hver dashboard, gjør:

1. **Åpne dark-versjon** i Splunk UI (`/app/splunk-knowledge-testing/<name>`).
2. **Sjekk visuelt** mot sjekklisten under.
3. **Marker dashboard-en med `name`-regex-sjekken** — kjør:
   ```bash
   python3 plugins/splunk-dashboards/scripts/audit_data_source_names.py \
       plugins/splunk-dashboards/skills/<sti>/test-dashboard/dashboard.json
   ```
   Hvis brudd: oppdater `dataSource.name`-feltene per
   `pipeline/ds-create`-tabellen, redeploy.
4. **Kort sveip light-versjonen** — er fargene lesbare? KPI-tall
   synlige mot lys bakgrunn? Ingen mørk-tema-rester? Hvis ja → ✅ light.
5. **Oppdater `viz/PROGRESS.md` (eller `interactivity/PROGRESS.md`)**:
   sett QA-dark og QA-light fra ⬜ til ✅. Hvis funn: noter under
   "QA findings" nederst i samme PROGRESS-fil og opprett follow-up commit.

### Standard sjekkliste per dashboard

- [ ] **Header / markdown-intro** rendrer riktig (ingen `\n`-artefakter,
      ingen halve syntax-eksempler i dårlig formatert MD).
- [ ] **Alle paneler rendrer data** (ingen "Search returned no results",
      ingen rød feilboks, ingen evig spinner).
- [ ] **SPL-ene returnerer det de skal** — `makeresults`-bench-er er
      deterministiske, så tall stemmer eller stemmer ikke.
- [ ] **Alle dokumenterte options demonstreres synlig** — hvert panel
      har en deskriptiv tittel som forklarer hva det viser.
- [ ] **Drilldown der det er relevant** — klikk en rad/punkt og se at
      ingenting krasjer (ikke alle bench-er har drilldown).
- [ ] **`dataSource.name`-audit ren** (kjør scriptet over).
- [ ] **Light-tema sveip** — fargevalg fungerer mot lys bakgrunn.
- [ ] **Note evt. funn** under PROGRESS i samme fil.

---

## Anbefalt rekkefølge — enkel til kompleks

Bygger fra "hvis dette ikke virker, er noe rotfeil" → mot "spesialtilfeller
som krever full evidens".

### Bølge 1 — primitiver (hvis disse brekker er noe rotfeil)
| # | Dashboard | Skill | Hva det tester |
|---|---|---|---|
| 1 | `ds_viz_markdown_dark` | `ds-viz-markdown` | Tekst, MD-rendering, fontSize |
| 2 | `ds_viz_image_dark` | `ds-viz-image` | Bilder, src URL/data-URI |
| 3 | `ds_viz_rectangle_dark` | `ds-viz-rectangle` | Forme-grafikk, fillColor/strokeColor |
| 4 | `ds_viz_ellipse_dark` | `ds-viz-ellipse` | Forme-grafikk, drilldown-payload-begrensning |

**Forventet utfall**: alle skal se "kjedelige men korrekte" ut. Hvis selv
disse 4 har feil → stopp QA, ordne deploy-pipeline-issue først.

### Bølge 2 — klassiske KPI og time-series
| # | Dashboard | Skill | Hva det tester |
|---|---|---|---|
| 5 | `ds_viz_singlevalue_dark` | `ds-viz-singlevalue` | KPI, trend, sparkline, color tokens |
| 6 | `ds_viz_singlevalueicon_dark` | `ds-viz-singlevalueicon` | KPI med ikon |
| 7 | `ds_viz_line_dark` | `ds-viz-line` | Time-series, multi-serie |
| 8 | `ds_viz_area_dark` | `ds-viz-area` | Stacked / grunnflate-fyll |
| 9 | `ds_viz_column_dark` | `ds-viz-column` | Vertikal kategori |
| 10 | `ds_viz_bar_dark` | `ds-viz-bar` | Horisontal kategori |
| 11 | `ds_viz_pie_dark` | `ds-viz-pie` | Kategori-andel |

### Bølge 3 — tabulær og hendelsesdrevet
| # | Dashboard | Skill | Hva det tester |
|---|---|---|---|
| 12 | `ds_viz_table_dark` | `ds-viz-table` | Tabell, columnFormat, sortering |
| 13 | `ds_viz_events_dark` | `ds-viz-events` | Event-liste, _raw, _time |
| 14 | `ds_viz_timeline_dark` | `ds-viz-timeline` | Hendelses-tidslinje, lanes |

### Bølge 4 — gauges og avanserte KPI
| # | Dashboard | Skill | Hva det tester |
|---|---|---|---|
| 15 | `ds_viz_fillergauge_dark` | `ds-viz-fillergauge` | Filler-gauge, gaugeRanges |
| 16 | `ds_viz_markergauge_dark` | `ds-viz-markergauge` | Marker-gauge, gaugeRanges |
| 17 | `ds_viz_singlevalueradial_dark` | `ds-viz-singlevalueradial` | Radial KPI, %-format |

### Bølge 5 — multivariate og distribusjon
| # | Dashboard | Skill | Hva det tester |
|---|---|---|---|
| 18 | `ds_viz_scatter_dark` | `ds-viz-scatter` | XY-spredning, kategori-farge |
| 19 | `ds_viz_bubble_dark` | `ds-viz-bubble` | XY + størrelse + kategori (4-dim) |
| 20 | `ds_viz_punchcard_dark` | `ds-viz-punchcard` | Heatmap-grid, intensitet |

### Bølge 6 — eksotiske/komplekse
| # | Dashboard | Skill | Hva det tester |
|---|---|---|---|
| 21 | `ds_viz_linkgraph_dark` | `ds-viz-linkgraph` | Graf, nodes/edges, resultLimit |
| 22 | `ds_viz_sankey_dark` | `ds-viz-sankey` | Flow-diagram, source→target→value |
| 23 | `ds_viz_parallelcoordinates_dark` | `ds-viz-parallelcoordinates` | Multi-akse linje |
| 24 | `ds_viz_choropleth_svg_dark` | `ds-viz-choropleth-svg` | Custom SVG, areaColors |
| 25 | `ds_viz_map_dark` | `ds-viz-map` | Geo-map, marker/bubble/choropleth-layers |

### Bølge 7 — interactivity
| # | Dashboard | Skill | Hva det tester |
|---|---|---|---|
| 26 | `ds_interactivity_core_dark` | `ds-tokens` + `ds-inputs` + `ds-defaults` + `ds-drilldowns` + `ds-visibility` | 5 sections, hver tester én skill — bytt input, klikk rad, se token-echo oppdatere |
| 27 | `ds_interactivity_tabs_dark` | `ds-tabs` | Bytt mellom 3 tabs, layout-bytting fungerer |

---

## Hva vi *ikke* sjekker per dashboard

- **API-deploy** — det er allerede bekreftet via `splunk_create_dashboard`
  responses. Hvis dashboardet er på listen ovenfor, eksisterer det.
- **JSON-validitet** — bekreftet ved deploy-tid; vi har ingen dashboards
  som hadde parse-feil.
- **Light-tema-pixel-perfekt-match** — kun "leser bra mot lys bakgrunn".
  Vi stoler på `make_light.py` for resten.

## Hva vi *gjør* sjekker etter alle 27

- **Cross-viz konsistens** — leser KPI-er likt på tvers? Bruker alle
  `seriesColors` med DOS samme måte?
- **`reference/ds-design-principles`-bidrag** — funn som gjelder mer
  enn én viz, løftes til design-principles-skillen.
- **`viz/REVIEW.md`-oppdatering** — siste status etter QA-pass.

---

## Hvor du bør starte

**Start med #1 `ds_viz_markdown_dark`** — det er den enkleste, og gir oss
en kalibrert sjekkliste-runde. Hvis markdown-bench-en ser bra ut, er
deploy-pipeline og light-konvertering bekreftet for resten. Hvis den ikke
ser bra ut, fanger vi noe rotfeil før vi har sjekket 25 til.

Når du har åpnet dashboardet, bare si "OK på #1, neste" eller "funn på
#1: <beskrivelse>", så fortsetter jeg.
