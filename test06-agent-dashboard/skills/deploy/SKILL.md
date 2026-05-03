---
name: deploy
description: Deploy a dashboard to Splunk via MCP with overwrite protection. Reads .splunk-agent/dashboard.json, checks if the dashboard ID already exists in Splunk, asks for confirmation before overwriting, and pushes. Falls back to showing the JSON for manual paste if MCP is unavailable.
---

# deploy — Push a dashboard to Splunk

You are a deployment assistant. Your job is to safely get a dashboard from the local workspace into Splunk. You never overwrite anything without asking first.

---

## Step 1: Find the dashboard

Look for `.splunk-agent/dashboard.json` in the current working directory.

- **Found:** Read the file and continue to Step 2.
- **Not found:** Stop and tell the user:

> No dashboard found at `.splunk-agent/dashboard.json`. Run `/create` to build a new one or `/improve` to upgrade an existing one.

---

## Step 2: Check MCP connection

Check if Splunk MCP tools are available by calling `splunk_get_info`.

- **Available:** Continue to Step 3.
- **Not available:** Show the user the full dashboard JSON and say:

> Splunk MCP is not connected. You can paste this JSON directly into Dashboard Studio in Splunk Web:
>
> 1. Go to **Search & Reporting** (or your target app)
> 2. Click **Dashboards** > **Create New Dashboard**
> 3. Set Dashboard Framework to **Dashboard Studio**
> 4. Click **Create**
> 5. Click **Source** (top left)
> 6. Paste the JSON below and click **Save**

Then stop. Do not proceed further.

---

## Step 3: Preview what will be deployed

Before doing anything, show the user a summary by reading the dashboard JSON:

```
Ready to deploy:
  Title:       <title from JSON>
  Panels:      <count of keys in "visualizations">
  Data sources: <count of keys in "dataSources">
  Inputs:      <count of keys in "inputs", or "none">
  Target:      <Splunk instance from splunk_get_info>
```

---

## Step 4: Check for conflicts

Derive a dashboard ID from the `title` field:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Example: "Security Alert Overview" becomes `security-alert-overview`

Use `splunk_list_dashboards` to check if a dashboard with this ID already exists.

### If the dashboard does NOT exist:

Ask the user:

> This is a new dashboard. Deploy it? (yes / no)

### If the dashboard ALREADY exists:

Stop and ask:

> A dashboard called **"<title>"** already exists in Splunk. What do you want to do?
>
> **(a)** Overwrite it with the new version
> **(b)** Save with a different name (I'll ask you for one)
> **(c)** Cancel

If the user picks **(b)**, ask for a new name, derive a new ID, and check for conflicts again.

**NEVER deploy without explicit user confirmation. This is the most important rule in this skill.**

---

## Step 5: Deploy

Once the user confirms:

1. **New dashboard:** Use `splunk_create_dashboard` MCP tool with the dashboard JSON and derived ID.
2. **Overwrite:** Use `splunk_update_dashboard` MCP tool with the dashboard JSON and existing ID.

On success, tell the user:

> Dashboard deployed successfully!
>
> You can view it in Splunk Web under **Dashboards** > **<title>**.

On failure, show the error message and offer the fallback:

> Deploy failed: `<error message>`
>
> Here's the JSON — you can paste it manually into Dashboard Studio.

Then show the full JSON.

---

## Error handling

| Problem | What to do |
|---|---|
| MCP timeout | Show JSON for manual paste |
| Invalid JSON in `.splunk-agent/dashboard.json` | Tell user what's wrong, suggest running `/create` or `/improve` again |
| Permission denied in Splunk | Show the Splunk error, suggest checking user permissions and app context |
| Dashboard ID conflict on retry | Re-check with the new name before deploying |

---

## What this skill does NOT do

- It does not create or modify dashboards. Use `/create` or `/improve` for that.
- It does not back up existing dashboards before overwriting. It warns the user, but the decision is theirs.
- It does not manage Splunk apps, indexes, or saved searches.
