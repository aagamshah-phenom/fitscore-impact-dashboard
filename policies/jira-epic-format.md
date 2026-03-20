---
name: jira-epic-format
type: policy
description: "Epic structure, template, and management rules for Phenom Jira"
requires:
  - jira
always: false
triggers: [jira, phem, epic, story, stories, bug, ticket, sprint, backlog, issue, jql, task, defect]
---

## Epic Rules

- **One Epic = one shippable increment.** Never mix phases or unrelated features.
- **One owner** = a single PM accountable for the Epic end-to-end.
- All Stories under the Epic ship together under the same Fix Version.
- Epic closes only when all Stories across all teams are complete and end-to-end testing passes.
- Phase 2 work = a new Epic. Never extend an existing Epic's scope.

**Cross-team epics:**
- The Epic owner creates the Epic on their board.
- Other teams create Stories on their own boards but link them to the shared Epic.
- One Fix Version on the Epic signals the release target.

---

## Epic Description Template

Use this structure when creating or updating an Epic description. Apply via the two-step API pattern (see `jira-api` skill — Epics require ADF format).

```
## What
What is this feature? Brief overview of what it accomplishes.

## Why
Why should this be worked on? Business problem and value to Phenom, customers, and users.

## Success Metrics
- What metric does this impact?
- What determines success? Make it measurable and quantifiable.

## Requirements
Functional and engineering requirements. For large epics, link to a PRD.

## Cross-Team Dependencies
| Team | Required | Why | Story |
|------|----------|-----|-------|
| [Team name] | YES / tbd | [reason] | [PHEM-XXXXX] |

## Out of Scope
What will NOT be worked on. What belongs to a future phase.

## Open Questions
| Question | Owner | Status |
|----------|-------|--------|
| [question] | [PM/Eng/UX] | Open |

## Customer Timelines (optional)
| Customer | UAT Start | Go-Live |
|----------|-----------|---------|

## Documentation
- Visual QA: [link]
- Release Documentation: [link after release]
```

---

## Before Creating an Epic

Ask the user to confirm:
1. Product Experience / Product (required — see `jira-api` for field values)
2. Fix Version — specific month (`YY.MM`, e.g., `25.10`) or `Backlog` if unscheduled
3. UX Required — YES / NO
4. Any cross-team dependencies to document upfront
5. If a kick-off call with UX and Engineering is needed before work starts
