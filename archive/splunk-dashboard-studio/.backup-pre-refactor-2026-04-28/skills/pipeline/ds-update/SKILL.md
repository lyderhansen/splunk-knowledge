---
name: ds-update
description: Use this skill to modify an existing Splunk Dashboard Studio dashboard based on a natural-language change request. Can edit dashboard.json inside a workspace (preserving pipeline state) or operate on any dashboard.json or dashboard.xml file outside a workspace. Applies targeted edits like adding a panel, changing a viz type, adjusting an SPL query, retitling, or rebinding data sources. After editing, always re-run ds-validate before ds-deploy.
---

# ds-update — Modify an existing dashboard

## When to use

- User says "change <X> in my dashboard" and points at a workspace project or a file path.
- After `ds-review` flagged something that needs fixing.
- After `ds-validate` reported errors that need to be corrected in the JSON.

## Two modes

### Workspace mode

If the dashboard is inside an existing workspace (`.splunk-dashboards/<project>/dashboard.json`), apply edits in place. The workspace state stays where it is — `ds-update` is not a pipeline stage. After editing, advise the user to re-run `ds-validate` and `ds-deploy`.

### Standalone mode

Operate on any `dashboard.json` or `dashboard.xml` path the user provides. If the input is XML, extract the JSON from the `<![CDATA[...]]>` block, edit it, and write it back in the same envelope.

## How to apply edits

1. Read the file (or workspace `dashboard.json`).
2. Interpret the change request. Map it to one or more JSON mutations:

| Request pattern | Mutation |
|---|---|
| "Add a panel for <metric>" | Add a new `visualizations.viz_<id>` entry + a new `layout.structure` block. Bind to an existing or new `dataSources` entry. |
| "Change viz <id> to <type>" | Update `visualizations.<id>.type`; remove incompatible options. |
| "Rename panel <id> to <title>" | Update `visualizations.<id>.title`. |
| "Change query for <ds>" | Update `dataSources.<ds>.options.query`. |
| "Rebind panel <id> to <ds>" | Update `visualizations.<id>.dataSources.primary`. |
| "Resize panel <id> to <w>x<h>" | Update `layout.structure` entry's `position.w` / `position.h` (in pixels — grid cells × 100 × 80 if built by ds-create). |
| "Drop panel <id>" | Remove from `visualizations` AND from `layout.structure`. |

3. Preserve the rest of the file unchanged — don't reformat keys or reorder entries unnecessarily.
4. Write back to the same path.
5. If operating on XML, preserve the XML envelope exactly (only the CDATA body changes).

## Invariants to preserve

- Every `ds.search` keeps its `name` field.
- Every `visualizations.<id>.dataSources.primary` references a real `dataSources` key.
- Every `layout.structure[*].item` references a real `visualizations` key.
- `layout.structure` and `visualizations` stay in sync (no orphans in either).

If any invariant breaks after your edit, fix it before writing the file.

## After editing

Tell the user:
- What you changed (one-sentence summary).
- What to do next: re-run `ds-validate` (and then `ds-deploy`) if operating in a workspace, or just re-lint manually otherwise.
