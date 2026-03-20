---
name: jira-api
type: skill
description: "Jira REST API field IDs, creation pattern, and ADF reference for PHEM project"
requires:
  - jira
always: false
triggers: [jira, phem, epic, story, stories, bug, ticket, sprint, backlog, issue, jql, task, defect]
---

## Field Discovery

If you are unsure what value to use for a custom field, or after receiving `INVALID_INPUT`, call `get_jira_project_fields` first. It returns all fields for a given issue type with their required flag and every allowed value. Use the exact `value` strings from the response in `custom_fields`.

---

## Two-Step Creation Pattern (CRITICAL)

The PHEM Jira project applies a default template on issue creation that **overwrites any description provided**. Always use two steps:

1. **Create** the issue with required fields only — no description
2. **Wait ~1.5 seconds**, then **update** with the full description via `update_jira_issue`

Epics → description must be **ADF format**
Stories/Bugs/Tasks → description can be **plain text**

---

## Required Custom Fields — MUST ALL BE PRESENT

**All 7 fields below are required by PHEM. Include every one in a single `create_jira_issue` call or Jira will reject with 400.**

| Field | Field ID | Format |
|-------|----------|--------|
| Product Experience : Product | `customfield_15211` | Cascading — `{"value": "X", "child": {"value": "Y"}}` |
| Product Experience | `customfield_15256` | Select — `{"value": "X"}` |
| Priority | `customfield_15212` | Select — `{"value": "P2"}` etc. |
| Release Note Candidate | `customfield_15217` | Select — `{"value": "NO - Do Not Advertise / Specific Customers"}` |
| Feature Flag Available | `customfield_15427` | Select — `{"value": "NA"}` |
| How to Enable | `customfield_15218` | Select — `{"value": "None"}` |
| Initiative Type | `customfield_15216` | Select — `{"value": "New Feature"}` / `{"value": "Usability"}` |
| Fix Version | `fixVersions` | `[{"name": "Backlog"}]` or `[{"name": "25.10"}]` etc. |

Optional fields (include when known):

| Field | Field ID | Format |
|-------|----------|--------|
| UX Required | `customfield_15213` | Select — `{"value": "YES"}` / `{"value": "NO"}` / `{"value": "NA"}` |
| Theme | `customfield_15215` | Select — `{"value": "Revenue Bet"}` / `{"value": "Engineering Driven"}` |
| PM Owner | `customfield_15223` | `{"accountId": "..."}` |
| QA Required | `customfield_15716` | Multi-checkbox |

> Leave `customfield_15451` (Story Description custom field) empty — it is optional.

---

## Field Values

**Product Experience : Product (`customfield_15211`)** — cascading `{"value": "X", "child": {"value": "Y"}}`:
- `{"value": "Hiring Intelligence", "child": {"value": "Screening"}}`
- `{"value": "Hiring Intelligence", "child": {"value": "Scheduling"}}`
- `{"value": "Hiring Intelligence", "child": {"value": "Interview Intelligence"}}`
- `{"value": "Automation Engine", "child": {"value": "Automation Engine - Core"}}`

**Product Experience (`customfield_15256`)** — `{"value": "X"}`:
- `{"value": "Hiring Intelligence"}`
- `{"value": "Automation Engine"}`

**Priority (`customfield_15212`)**: `{"value": "P0"}`, `{"value": "P1"}`, `{"value": "P2"}`, `{"value": "P3"}`

**Release Note Candidate (`customfield_15217`)** common values:
- `{"value": "NO - Do Not Advertise / Specific Customers"}`
- `{"value": "YES - Advertise"}`

**Feature Flag Available (`customfield_15427`)**: `{"value": "YES"}`, `{"value": "NO"}`, `{"value": "NA"}`

**How to Enable (`customfield_15218`)**: `{"value": "None"}` (most common for Stories)

**PM Owner (`customfield_15223`)** — `{"accountId": "..."}`:
- Sebastian Niewöhner: `{"accountId": "6035546d8ff09800715a3137"}`
- Markus Hertlein: `{"accountId": "623c36be4a57610068e75ed9"}`

---

## Working Example (Story) — Confirmed

The following `create_jira_issue` call is confirmed working (created PHEM-1708288):

```json
{
  "issue_type": "Story",
  "summary": "SCH – BE – <title>",
  "parent_key": "PHEM-1556813",
  "custom_fields": {
    "customfield_15211": {"value": "Hiring Intelligence", "child": {"value": "Scheduling"}},
    "customfield_15256": {"value": "Hiring Intelligence"},
    "customfield_15212": {"value": "P2"},
    "customfield_15217": {"value": "NO - Do Not Advertise / Specific Customers"},
    "customfield_15427": {"value": "NA"},
    "customfield_15218": {"value": "None"},
    "customfield_15216": {"value": "Usability"},
    "fixVersions": [{"name": "Backlog"}]
  }
}
```

Then wait 1.5s and call `update_jira_issue` with the story description as plain text.

---

## Description Formats

| Issue Type | Create | Update via `update_jira_issue` |
|------------|--------|--------------------------------|
| Story / Bug / Task | No description | Plain text |
| Epic | No description | ADF JSON string |

---

## ADF Structure (Epics)

Pass as a JSON-serialised string to `update_jira_issue` description field:

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Description here"}]},
    {"type": "rule"},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Why"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": "Bullet point"}]}
      ]}
    ]}
  ]
}
```

**ADF node types**: `heading` (attrs: level 1–6), `paragraph`, `bulletList`, `orderedList`, `listItem`, `table`, `tableRow`, `tableHeader`, `tableCell`, `rule`

**Text formatting marks**: `strong` (bold), `em` (italic), `link` (attrs: href)

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `INVALID_INPUT` (any) | Wrong field value or format | Call `get_jira_project_fields` to get the exact allowed values, then retry |
| `Please fill the Product Experience: Product field` | Missing child in cascading select | Use `{"value": "X", "child": {"value": "Y"}}` |
| `Feature Flag Available is required` | Missing field | Add `customfield_15427: {"value": "NA"}` |
| `Initiative Type is required` | Missing field | Add `customfield_15216: {"value": "Usability"}` |
| `Fix versions is required` | Missing field | Add `fixVersions: [{"name": "Backlog"}]` |
| Description shows default template | Jira template overwrote description | Two-step: create first, wait 1.5s, then update |
| `"description": "Field cannot be set"` | Providing description during creation | Create without description, update separately |
| `401 Unauthorized` | Expired OAuth token | User must reconnect Jira in Settings |
