---
name: prd
type: skill
description: "PRD authoring, pipeline workflow, and feature planning process"
requires: []
always: false
triggers: [prd, product requirements, requirements document, feature spec, write a prd, create a prd, prd template, feature planning, initiative, initiatives]
---

When a user asks to write, review, or plan a PRD — or asks about the PRD pipeline — use this skill.

## PRD Pipeline Overview

Features move through five stages:

```
1. LOCAL PRD → 2. CONFLUENCE → 3. JIRA EPIC → 4. STORIES → 5. DEVELOPMENT
   (draft)       (published)     (tracking)     (sprint)     (release)
```

| Stage | Location | Source of Truth |
|---|---|---|
| Draft | `{team}/Projects/{product}/{feature}/prd.md` in product knowledge repo | Git |
| Published | Confluence page | Confluence |
| Development | Jira Epic + child Stories | Jira |

## Writing a PRD

Use the template below. Fill in all sections. Mark status as `Draft`.

### PRD Template

```markdown
# PRD: [Feature Name]

> **Status**: Draft | Review | Published
> **Author**: [Name]
> **Last Updated**: YYYY-MM-DD
> **Confluence**: [Link when published]
> **Epic**: [PHEM-XXXXXX when created]

---

## Executive Summary

[2-3 sentences: what this feature does and why it matters]

---

## Problem Statement

### Current State
[Current experience/workflow and its limitations]

### Pain Points
- [Pain point 1]
- [Pain point 2]

### User Impact
[Who is affected, how, quantify if possible]

---

## Goals & Success Metrics

### Goals
1. [Primary goal]
2. [Secondary goal]

### Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| [Metric 1] | X% | Y% | [Method] |

### Non-Goals
- [What this feature will NOT do]

---

## Solution Overview

### Proposed Solution
[High-level description]

### User Flow
1. User does X
2. System responds with Y
3. User completes Z

### Key Features
1. **Feature 1**: [Description]
2. **Feature 2**: [Description]

---

## Detailed Requirements

### Functional Requirements

#### FR1: [Requirement Name]
- **Description**: [What it does]
- **Acceptance Criteria**:
  - GIVEN [context]
  - WHEN [action]
  - THEN [expected result]

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | [Response time, throughput] |
| Security | [Auth, data protection] |

---

## Technical Considerations

### Architecture
[High-level technical approach]

### Dependencies
- [Internal system/team dependencies]

### Data Model Changes
[New tables, columns, or schema changes]

---

## Cross-Team Dependencies

| Team | Dependency | Required By | Status |
|------|------------|-------------|--------|
| [Team] | [What's needed] | [Date] | Open |

---

## UX/Design

- **UX Required**: Yes / No
- **Design Link**: [Figma link]

---

## Release Plan

### Phases
1. **Phase 1** (MVP): [Scope]
2. **Phase 2**: [Additional scope]

### Feature Flags
- **Flag Name**: [name]
- **Rollout Strategy**: [Percentage, customer list]

---

## Open Questions

| Question | Owner | Status | Answer |
|----------|-------|--------|--------|
| [Question 1] | [Name] | Open | |
```

## Publishing to Confluence

When a PRD is ready for stakeholder review:

1. Create a Confluence page in the team's space (use Confluence MCP if available)
2. Copy PRD content — Confluence accepts markdown paste
3. The Confluence page becomes the source of truth once published

## Creating the Jira Epic

When a PRD is approved and development capacity is confirmed:

1. Create the Jira Epic using `skills/jira-api.md` (two-step process: create, then update description)
2. Epic description should include: What, Why, Success Metrics, Cross-Team Dependencies, Open Questions
3. Use ADF format for Epic descriptions

## Story Breakdown

Stories follow naming convention: `[PREFIX] – [FE/BE] – [Story Title]`

| Product | Prefix |
|---------|--------|
| Scheduling | `SCH` |
| Screening | `SCR` |
| Interview Intelligence | `II` |
| Automation Engine | `AE` |

Each story should include: User Story format, Acceptance Criteria (GIVEN/WHEN/THEN), Dependencies, Technical Notes.

See `skills/jira-api.md` for field IDs and creation details.

## Notes

- For Jira field IDs, required fields, and ADF format — always load `skills/jira-api.md`.
- For story and epic formatting conventions — see `policies/jira-story-format.md` and `policies/jira-epic-format.md`.
- PRDs in the product knowledge repo live at `{team}/Projects/{product}/{feature}/prd.md`.
- Initiatives are registered in `INITIATIVES.yaml` files within each product team's folder.
