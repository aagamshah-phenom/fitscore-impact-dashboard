---
name: jira
type: policy
description: "Jira routing and project constants for Phenom's PHEM project"
requires:
  - jira
always: false
triggers: [jira, phem, epic, story, stories, bug, ticket, sprint, backlog, issue, jql, task, defect]
---

## Jira Skill Router

When handling any Jira task, apply the relevant sub-skills also loaded in this context:

| Task | Refer to |
|------|----------|
| Creating or updating an **Epic** | `jira-epic-format` skill |
| Creating or updating a **Story** | `jira-story-format` skill |
| Making any API call (field IDs, two-step creation, ADF) | `jira-api` skill |

---

## Project Constants

- **Workspace**: phenompeople.atlassian.net
- **Cloud ID**: `abbe3ee2-54f7-4096-a7a0-62a220d87814`
- **Project Key**: `PHEM`
- **Issue Types**: Epic, Story, Task, Sub-task, Bug-Internal, Customer Bug, Refactoring, Theme, Initiative

---

## Pre-Creation Checklist

Before creating any Epic or Story, confirm:

1. **Product Experience** — Which product/experience does this belong to? (required field — see `jira-api` for values)
2. **UX Required** — Does this involve UI/UX work? If yes, mark `UX Required = YES`.
3. **Linking** — Should this be linked to an existing Epic or Story? Avoid floating items.
4. **Multi-team** — If multiple teams are involved, note dependencies in the Epic and use naming prefixes in Stories.

If any of these are unclear, ask the user before proceeding.

---

## Naming Conventions

Story title format: `[Prefix] – [FE/BE] – [Story Title]`
Example: `II – FE – Add transcript export option`

| Product | Prefix |
|---------|--------|
| Screening | `SCR` |
| Scheduling | `SCH` |
| Interview Intelligence | `II` |
| Automation Engine | `AE` |
| High Volume Hiring | `HVH` |
| CRM | `CRM` |
| Agents | `AG` |

---

## Bug Reporting

When creating a **Bug-Internal** or **Customer Bug**, always include:
- **Reproduction steps** (clear, numbered)
- **Environment** — Staging or Production? Ireland or US? Customer tenant or Phenom internal?
- **Links** — Job, candidate, logs, or any data needed to reproduce
- **Parent link** — Every bug must link to an Epic or Story (no floating bugs)
- **Priority** — P0 (blocker), P1 (critical), P2 (medium), P3 (low)

---

## Phase Management

- Phase 1 = Epic 1 with a clear scope boundary
- Phase 2 = a separate new Epic (never mix phases in one Epic)
- If scope creeps during development → move additions to a Phase 2 Epic
