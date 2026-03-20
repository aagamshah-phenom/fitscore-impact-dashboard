# hi-copilot-config

Shared configuration for the Phenom product copilot. Works with Cursor and Claude Code.

## What's in here

```
skills/         How-to guides for specific tools — when to use them and how
policies/       Always-active rules — naming conventions, templates, standards
agents/         Autonomous sub-workers with their own context and tool access
mcp/            Local MCP server (Google, Snowflake, Vanilla KB) — no need to edit
CLAUDE.md       Auto-loads all skills and policies for Claude Code
.cursor/rules/  Auto-loads all skills and policies for Cursor
```

The only folders you'll ever need to edit are `skills/`, `policies/`, and `agents/`.

---

## Prerequisites

- Node.js >= 20
- npm

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url> ~/hi-copilot-config
cd ~/hi-copilot-config
```

### 2. Add your credentials

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
GOOGLE_CLIENT_ID=       # from 1Password > "hi-copilot OAuth Apps"
GOOGLE_CLIENT_SECRET=   # from 1Password > "hi-copilot OAuth Apps"
VANILLA_API_KEY=        # from 1Password > "hi-copilot API Keys"
```

### 3. Install and authenticate

```bash
cd mcp && npm install && npm run setup
```

This will:
- Walk you through Google OAuth (opens browser)
- Prompt for your Snowflake account + personal access token
- Store all tokens in `~/.copilot/tokens.json`

Vanilla KB is automatically available once `VANILLA_API_KEY` is in `.env` — no extra step needed.

### 4. Install the official MCP servers

Jira/Confluence and Figma use their official MCP servers. Add these to your IDE config alongside the local copilot server (see IDE setup below).

**Atlassian (Jira + Confluence)**
- Get an API token at [id.atlassian.com → Security → API tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
- Server: `@modelcontextprotocol/server-atlassian`

**Figma**
- Get a personal access token at Figma → Settings → Security → Personal access tokens
- Server: `@figma/mcp-server`

---

## Using with Cursor

Open `~/hi-copilot-config` as your workspace in Cursor (or add it as a folder in a multi-root workspace). Cursor automatically picks up:

- `.cursor/rules/` — skills and policies injected as rules
- `.cursor/mcp.json` — local copilot MCP server

Add the official MCP servers to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "copilot": {
      "command": "npx",
      "args": ["copilot-mcp"],
      "env": { "COPILOT_CONFIG_DIR": "${workspaceFolder}" }
    },
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-atlassian"],
      "env": {
        "ATLASSIAN_SITE_URL": "https://phenompeople.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your.name@phenom.com",
        "ATLASSIAN_API_TOKEN": "<your-api-token>"
      }
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "<your-pat>"
      }
    }
  }
}
```

---

## Using with Claude Code

Run `claude` from inside `~/hi-copilot-config`. `CLAUDE.md` is automatically loaded and pulls in all skills and policies.

To use the copilot context while working in a different repo, add this to that repo's `CLAUDE.md`:

```markdown
@/Users/your-name/hi-copilot-config/CLAUDE.md
```

Add MCP servers to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "copilot": {
      "command": "npx",
      "args": ["copilot-mcp"],
      "env": { "COPILOT_CONFIG_DIR": "/Users/your-name/hi-copilot-config" }
    },
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-atlassian"],
      "env": {
        "ATLASSIAN_SITE_URL": "https://phenompeople.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your.name@phenom.com",
        "ATLASSIAN_API_TOKEN": "<your-api-token>"
      }
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "<your-pat>"
      }
    }
  }
}
```

---

## Updating skills and policies

1. Edit files directly in `skills/`, `policies/`, or `agents/`
2. Commit and push — teammates pick up changes with `git pull`

No regeneration step needed. Both Cursor and Claude Code read the source files directly.

If a change also applies to the Chrome extension, manually sync the updated file to `backend/src/skills/` or `backend/src/agents/` in the product-copilot repo.

See **[MAINTENANCE.md](MAINTENANCE.md)** for the full guide on:
- Syncing skills between this repo and product-copilot
- Translating Confluence page ID references to local `knowledge/` file paths
- Adding new Confluence pages to the knowledge folder
- The Confluence page → local file map

---

## Branching

Teams can branch `main` to experiment with or customize policies for their workflow. Propose changes back via pull request — changes that should apply to everyone get merged to `main`.
