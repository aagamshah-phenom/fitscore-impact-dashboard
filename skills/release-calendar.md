---
name: release-calendar
type: skill
description: "Release cadence, schedule lookup, and version naming conventions"
requires:
  - google
always: false
triggers: [release, release date, release calendar, code freeze, release schedule, next release, fix version, release cadence, when is the next release, version]
---

When a user asks about release dates, code freeze, release cadence, or which version to target — use this skill.

## Release Cadence

Phenom releases follow a **monthly cadence** with version numbers in **YY.MM** format (e.g., `26.03` = March 2026, `26.04` = April 2026).

## Looking Up the Release Schedule

The release calendar is maintained as a Google Sheet. To look up specific dates:

1. Use `list_drive_files` to search for the release schedule:
   ```
   list_drive_files({ query: "Release Schedule" })
   ```
2. Use `read_google_sheet` with the file ID to read the schedule
3. Look for the relevant release version row to find: code freeze date, release date, and any special notes

If the file is not found by name, try searching in the `product-copilot/` Drive folder.

## Common Questions

| Question | How to Answer |
|---|---|
| "When is the next release?" | Look up the next upcoming release date from the schedule |
| "What version should I target?" | Use the next available release in YY.MM format |
| "When is code freeze for X?" | Find the release version row and check the freeze date |
| "What's the current release?" | Check the schedule for the most recently shipped version |

## Fix Version in Jira

When creating Jira issues, `fixVersions` uses the YY.MM format:
- `[{"name": "26.03"}]` — targeting the March 2026 release
- `[{"name": "Backlog"}]` — not yet targeted to a specific release

See `skills/jira-api.md` for full Jira field details.

## Notes

- Release dates can shift — always check the live schedule rather than assuming fixed monthly dates.
- The Google MCP tools are required for this skill. See `skills/google.md` for tool routing.
