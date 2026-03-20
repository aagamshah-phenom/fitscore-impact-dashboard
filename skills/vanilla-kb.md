---
name: vanilla-kb
type: skill
description: "Customer-facing product knowledge base routing and search guidance"
always: true
---

## Customer Knowledge Base

Use `search_kb` and `get_kb_article` to answer questions about how Phenom products work, feature setup, configuration, and user-facing how-to documentation. This is the customer-facing help content at community.phenom.com.

**When to use:** Questions about what a feature does, how to configure or use it, what the user experience looks like, or what is officially documented.

**Do NOT use:** Internal product strategy, roadmap, Snowflake queries, or anything covered by the knowledge context already loaded into this prompt. For those, use `skills/product-context.md` or `skills/snowflake-data-context.md`.

---

## Workflow

Always follow this two-step pattern:

1. **`search_kb`** — search with a targeted query and the relevant `kb_id`
2. **`get_kb_article`** — fetch the full article content before quoting or summarizing

Never quote or summarize an article from the excerpt alone. Always fetch the full content first.

---

## Knowledge Base ID Mapping

| kb_id | Knowledge Base | Article Categories & Content |
|-------|---------------|-------------------------------|
| 14 | Scheduling | Candidate availability flows, scheduling link setup, interview templates, email/SMS templates, calendar integrations (Google/Outlook/Exchange), video conferencing setup (Zoom/Teams/Meet), SLA and escalation configuration, reschedule/cancel flows, panel/group interview setup, generic scheduling links, recruiter request creation |
| 36 | Interview Intelligence | Recording setup and enablement, meeting bot configuration, consent flows and opt-out, recording playback, transcription and search, companion app (interviewer guide + scorecard during interview), evaluation submission, AI summarization, question coverage and detection, bias detection, access control and sharing, Zoom/Teams integration for II, highlight reels |
| 29 | Screening | Video screening setup, questionnaire creation (KO questions, MCQ, open text, video/audio), auto-invite configuration, candidate landing page branding, Voice Agent screening setup and configuration, recruiter evaluation in CRM, forwarding to hiring manager, auto-disposition rules, screening automations, X+ screening features |
| 11 | Hiring Manager | HM dashboard and workspace, forwarded screenings and evaluations, interview feedback submission, collaboration with recruiter, offer approval workflows, candidate pipeline visibility for HMs, HM scorecard access |
| 2  | Analytics | Reporting dashboards (scheduling, screening, pipeline), metrics definitions, analytics setup and permissions, data export, custom report creation, benchmark comparisons |
| 3  | CRM | Talent pipeline management, candidate sourcing, requisition setup, pipeline stage configuration, candidate communication from CRM, tagging and filtering, automation rules in CRM, evaluation and scorecard access in CRM |
| 8  | Career Site and CMS | Job site setup and branding, SEO configuration, CMS content management, job search and apply flow, landing pages, campaign tracking, multilingual site setup |
| 12 | Phenom Bot | Chatbot configuration, conversation flows and intents, FAQ setup, bot-to-human handoff, channel deployment (web, SMS), bot analytics |
| 22 | Employee Experience | Internal mobility portal, employee referral setup, employee job search and apply, internal candidate workflows |
| 31 | Product Release Notes | Recent feature releases and product changelog — use when asked "what's new" or about recently released features |

When a question spans multiple products (e.g. "how does scheduling connect to interview intelligence?"), search both KBs and synthesize.

---

## Search Tips

- Use specific feature terms rather than broad queries (e.g. `"generic scheduling link"` not `"scheduling"`)
- If the first search returns irrelevant results, try a different keyword angle
- Article titles are descriptive — scan titles before deciding which to fetch in full
- For Voice Agent questions, always use kb_id 29 (Screening), not a general search
- For companion app or scorecard submission questions during an interview, use kb_id 36 (Interview Intelligence)
