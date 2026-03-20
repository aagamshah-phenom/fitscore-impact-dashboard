---
name: google
type: skill
description: "Google Drive, Docs, Sheets, Slides, and Calendar tool routing"
requires:
  - google
always: false
triggers: [google, drive, doc, docs, sheet, sheets, slides, presentation, spreadsheet, gdoc, gsheet, gdrive, calendar, event, schedule, meeting, invite]
---

## Tool Routing

| Task | Tool |
|------|------|
| Find a file by name or search Drive | `list_drive_files` |
| Read a Google Doc | `read_google_doc` |
| Read a Google Sheet | `read_google_sheet` |
| Read a Presentation | `read_google_slides` |
| Create a new Doc | `create_google_doc` |
| Add/replace content in a Doc | `update_google_doc` |
| Create a new Sheet | `create_google_sheet` |
| Write rows to a Sheet | `update_google_sheet` |
| Rewrite a Presentation | `update_google_slides` |
| List the user's calendars | `list_calendars` |
| Get events in a date range | `list_calendar_events` |
| Create a calendar event | `create_calendar_event` |
| Update an existing event | `update_calendar_event` |
| Delete an event | `delete_calendar_event` |

---

## Extracting Document IDs

Google URLs contain the document ID between `/d/` and the next `/`:

```
https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

All tools accept either the full URL or just the raw ID — both work.

---

## Slides Write Spec

`update_google_slides` accepts a `slides` array plus optional `keep_first` / `keep_last` integers (default 0) to preserve the first/last N slides (e.g. a title slide or appendix):

```json
{
  "presentation_id": "<id or URL>",
  "keep_first": 1,
  "keep_last": 1,
  "slides": [
    {
      "layout": "TITLE_AND_BODY",
      "title": "Slide title",
      "body": "• Bullet 1\n• Bullet 2",
      "notes": "Speaker notes here"
    }
  ]
}
```

Available layouts: `TITLE_AND_BODY`, `TITLE_ONLY`, `BLANK`, `ONE_COLUMN_TEXT`, `MAIN_POINT`, `BIG_NUMBER`.

---

## Notes

- All tools use the connected user's OAuth token — no file sharing setup required.
- Tokens auto-refresh (Google tokens expire hourly).
- On write errors, the tool returns a descriptive error string — relay it to the user.
- For large Sheets, `read_google_sheet` returns at most 500 rows; ask the user to specify a sheet tab via `sheet_name` if the workbook has multiple tabs.
- For calendar operations, call `list_calendars` first if the user hasn't specified which calendar — present the list and let them choose. For the user's own primary calendar use `primary`.
- Event times must be RFC 3339 (e.g. `2026-03-10T14:00:00-07:00`). Always confirm timezone with the user if ambiguous.
- `create_calendar_event` accepts `attendees` as an array of email strings to send invites.
