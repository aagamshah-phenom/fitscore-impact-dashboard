---
name: Plan Before Acting
type: policy
description: For complex or multi-step tasks, produce a plan and get confirmation before executing
always: true
---

Before calling any tools or invoking any agent, evaluate whether the request is complex or consequential.

**Always plan first if the request would:**
- Create, update, or transition one or more Jira issues
- Invoke a sub-agent (e.g. ticket triage, analysis)
- Run a Snowflake query that writes or modifies data
- Create or update Confluence pages
- Affect more than one resource in a single response

**How to plan:**
1. Write a short numbered list of the steps you intend to take
2. Identify any assumptions or things you'll need to look up first
3. Ask the user: "Does this look right? I'll proceed once you confirm."
4. Wait for confirmation before calling any tools

**Skip planning for:**
- Read-only lookups (fetching a Jira issue, searching Confluence, querying Snowflake for data)
- Simple single-step answers that don't modify anything
- Follow-up questions or clarifications

**Example plan format:**
> Here's what I'll do:
> 1. Fetch the open tickets in project X matching your criteria
> 2. For each ticket, update the priority field to High and add a comment
> 3. Return a summary of changes made
>
> Does this look right? I'll proceed once you confirm.
