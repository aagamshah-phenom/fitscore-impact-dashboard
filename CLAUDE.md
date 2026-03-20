# Copilot Configuration

<!-- Personal profile — who I am and how I work -->
@me.md

<!-- Policies — always active -->
@policies/planning.md
@policies/jira-constants.md
@policies/jira-epic-format.md
@policies/jira-story-format.md

<!-- Skills — loaded when relevant -->
@skills/jira-api.md
@skills/snowflake-data-context.md
@skills/google.md
@skills/vanilla-kb.md
@skills/prd.md
@skills/release-calendar.md

## Tools

The following tools are available via MCP servers configured in `.cursor/mcp.json`:

- **Google** (Drive, Docs, Sheets, Slides, Calendar) — local copilot MCP server
- **Snowflake** — local copilot MCP server
- **Vanilla Knowledge Base** — local copilot MCP server
- **Jira + Confluence** — official Atlassian MCP server
- **Figma** — official Figma MCP server

## Agents

The following agents are available:

- **Customer Adoption Report** [manual]: Analyzes customer platform adoption and produces a Google Slides deck
- **Support Ticket Analyst** [auto]: Classifies a single ticket or processes a full batch for a team
- **Issue Clustering** [manual]: Groups classified tickets into existing or new high-level issues
- **Onboarding** [manual]: Walks new users through repo setup, MCP servers, and their personal profile
