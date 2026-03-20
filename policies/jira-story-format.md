---
name: jira-story-format
type: policy
description: "Story structure, template, and sign-off rules for Phenom Jira"
requires:
  - jira
always: false
triggers: [jira, phem, epic, story, stories, bug, ticket, sprint, backlog, issue, jql, task, defect]
---

## Story Rules

- Stories must be deliverable within a two-week sprint.
- Every Story must link to a parent Epic (no floating stories).
- Naming: `[Prefix] – [FE/BE] – [Story Title]` (prefixes in `jira` skill).
- Stories marked `UX Required = YES` must pass Visual QA and UX sign-off before closing.
- Sign-off order: Dev → QA → UX (if UI changes) → PM.

---

## Story Description Template

Use markdown format. Apply via the two-step API pattern (see `jira-api` skill — Stories use markdown, not ADF).

```markdown
**User Story:**
As a [type of user], I want [goal] so that [reason].

**Background / Context:** (optional)
[Relevant product, technical, or business context. Link to designs, research, related epics/bugs.]

**Acceptance Criteria:**

**Scenario 1: [Brief name]**
- Given [precondition]
- When [action]
- Then [expected result]

**Scenario 2: [Brief name]**
- Given [precondition]
- When [action]
- Then [expected result]

**Out of Scope:**
[What this story does NOT cover. Reference other stories/epics if applicable.]

**Design / Mockups:**
[Figma link → Frame name]

**Technical Notes:** (if applicable)
- [Backend/frontend considerations, API endpoints, data notes]

**Open Questions:**
| Question | Owner | Status |
|----------|-------|--------|
| [question] | [PM/Eng/UX] | Open |
```

---

## Before Creating a Story

Confirm:
1. Parent Epic key (required — verify it exists before creating)
2. Product Experience / Product (required custom field)
3. UX Required — YES / NO
4. FE or BE prefix (or both — create separate stories per team)
5. Fix Version — inherit from Epic unless different

If the user hasn't provided a user story statement or acceptance criteria, draft them and confirm before creating.
