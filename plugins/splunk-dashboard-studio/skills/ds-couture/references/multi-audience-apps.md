# Multi-audience apps — three-flavor starting matrix

When one Splunk app serves several distinct audiences, do NOT reuse one flavor across every dashboard. Each dashboard should explicitly BREAK from the others on **theme + flavor + density** so each audience instantly recognizes "this view is for me." Sameness across audiences is the committee-design failure mode: a C-suite reader drowns in an operations grid, and a specialist is starved by an executive headline tile.

This is the **recommended starting template**, not a footnote — reach for it whenever the scoping conversation names more than one audience.

## The matrix (test51 Pattern D)

```
Audience          -> Flavor       -> Theme   -> Density   -> Hero
-----------------------------------------------------------------------
C-suite           -> Editorial    -> Light   -> Sparse    -> 1 headline metric
Operations team   -> Refined      -> Dark    -> Medium    -> Multi-zone overview
Specialist deep   -> Industrial   -> Black   -> Dense     -> Diagnostic grid
```

The flavor names map directly to the flavor table in [../SKILL.md](../SKILL.md):

- **Editorial** — magazine-grade typography, generous whitespace, restrained accents. Pairs with a **light** theme and **sparse** density so a single headline metric carries the dashboard. The C-suite reads for the takeaway, not the detail.
- **Refined** — polished but understated, tinted neutrals, single accent. Pairs with a **dark** theme and **medium** density for a multi-zone operational overview. The operations team scans state across zones.
- **Industrial** — high-contrast, geometric, dense, accent-saturated, function-first. Pairs with a **black** theme and **dense** density for a diagnostic grid. The specialist wants every signal on one screen.

## How to apply

1. List the audiences during scoping (Design Context Protocol "audience" input).
2. Assign each audience a ROW of the matrix above — do not let two dashboards land on the same theme + flavor + density triple.
3. Lock each dashboard's flavor in its own design brief, exactly as the single-dashboard flow does, so every downstream decision (palette, typography, layout, density) is filtered by that flavor.
4. The hero element differs per row by design: 1 headline metric (C-suite) vs. multi-zone overview (operations) vs. diagnostic grid (specialist). Resist normalizing them.

The point is differentiation: if a stranger could not tell which audience a dashboard targets within two seconds, the flavors are fighting and the multi-audience split has failed.
