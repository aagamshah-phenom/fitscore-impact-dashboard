#!/usr/bin/env node
/**
 * copilot-setup — authenticate providers and write IDE configs
 *
 * This local MCP server only handles tools without an official published MCP server.
 * Jira/Confluence → install mcp-atlassian directly in Cursor/Claude
 * Figma           → install @figma/mcp-server directly in Cursor/Claude
 *
 * Usage:
 *   npx @hi/copilot-mcp setup           # interactive wizard
 *   npx @hi/copilot-mcp setup google
 *   npx @hi/copilot-mcp setup snowflake
 *   npx @hi/copilot-mcp status          # show which providers are connected
 *   npx @hi/copilot-mcp generate        # (re)generate IDE config files
 */

import { createServer } from "http";
import { exec } from "child_process";
import { readTokenStore, setToken, getBackendJwt, setBackendJwt, tokensPath } from "../auth/token-store.js";
import { BACKEND_URL } from "../config.js";
import readline from "readline";

// ── Helpers ──────────────────────────────────────────────────────────────────

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function openBrowser(url: string) {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} "${url}"`);
}

/** Spin up a localhost callback server and wait for a query param (e.g. token or status). */
function waitForQueryParam(port: number, param: string, path: string = "/callback"): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url?.startsWith(path)) return;
      const url = new URL(req.url, `http://localhost:${port}`);
      const value = url.searchParams.get(param);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body><h2>Done! You can close this tab.</h2></body></html>");
      server.close();
      if (value) resolve(value);
      else reject(new Error(`Missing query param: ${param}`));
    });
    server.listen(port, "localhost");
    server.on("error", reject);
  });
}

// ── Backend auth ──────────────────────────────────────────────────────────────

/**
 * Ensure the user is authenticated with the backend.
 * Opens a browser to the backend's Google OAuth flow and stores the resulting JWT.
 * Skips if a JWT is already stored.
 */
async function ensureLoggedIn(): Promise<string> {
  const existing = await getBackendJwt();
  if (existing) return existing;

  console.log("\nLogging in to Copilot backend...");
  const port = 3792;
  const redirectUri = `http://localhost:${port}/callback`;

  openBrowser(`${BACKEND_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`);
  console.log("Waiting for browser login...");

  const jwt = await waitForQueryParam(port, "token");
  await setBackendJwt(jwt);
  console.log("✓ Logged in.\n");
  return jwt;
}

/** Fetch all integration tokens from the backend and store them locally. */
async function pullTokensFromBackend(jwt: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/integrations/export`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(`Failed to export tokens: ${res.status}`);

  const data = (await res.json()) as Record<string, { access_token: string; refresh_token?: string; token_expires_at?: string; metadata?: Record<string, unknown> }>;
  for (const [provider, tokens] of Object.entries(data)) {
    await setToken(provider, tokens);
  }
}

// ── Provider setup functions ──────────────────────────────────────────────────
// Note: Jira/Confluence setup removed — use mcp-atlassian official server instead.

async function setupGoogle() {
  console.log("\n── Google (Drive, Docs, Sheets) ─────────────────────────────");

  const jwt = await ensureLoggedIn();

  const port = 3792;
  const redirectUri = `http://localhost:${port}/callback`;

  console.log("Opening browser for Google OAuth...");
  openBrowser(`${BACKEND_URL}/integrations/google/connect?redirect_uri=${encodeURIComponent(redirectUri)}&token=${encodeURIComponent(jwt)}`);
  console.log("Waiting for Google authorization...");

  const status = await waitForQueryParam(port, "google");
  if (status === "error") throw new Error("Google OAuth failed");

  console.log("Saving tokens locally...");
  await pullTokensFromBackend(jwt);
  console.log("✓ Google connected.\n");
}

async function setupSnowflake() {
  console.log("\n── Snowflake ─────────────────────────────────────────────────");
  console.log("Snowflake uses a Programmatic Access Token (PAT).");
  const account = await prompt("Snowflake account identifier (e.g. xy12345.us-east-1): ");
  const token = await prompt("Programmatic Access Token: ");
  const warehouse = await prompt("Default warehouse (leave blank to skip): ");
  const role = await prompt("Default role (leave blank to skip): ");

  await setToken("snowflake", {
    access_token: token,
    metadata: {
      account,
      authMode: "pat",
      ...(warehouse ? { warehouse } : {}),
      ...(role ? { role } : {}),
    },
  });

  console.log("✓ Snowflake connected.\n");
}

async function setupVanilla() {
  console.log("\n── Vanilla Knowledge Base ────────────────────────────────────");
  const jwt = await ensureLoggedIn();
  await pullTokensFromBackend(jwt);
  const store = await readTokenStore();
  if (store["vanilla"]?.access_token) {
    console.log("✓ Vanilla Knowledge Base connected.\n");
  } else {
    console.log("Vanilla API key not configured on backend.\n");
  }
}

// ── Status ────────────────────────────────────────────────────────────────────

async function showStatus() {
  const store = await readTokenStore();
  const providers = ["google", "snowflake", "vanilla"];
  console.log("\nProvider status:");
  for (const p of providers) {
    const connected = !!store[p]?.access_token;
    const expiry = store[p]?.token_expires_at
      ? `  (expires ${new Date(store[p].token_expires_at!).toLocaleString()})`
      : "";
    console.log(`  ${connected ? "✓" : "✗"} ${p}${expiry}`);
  }
  console.log(`\nTokens stored at: ${tokensPath()}\n`);
}

// ── Generate IDE configs ──────────────────────────────────────────────────────

async function generate() {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");

  // Merge into existing .cursor/mcp.json rather than overwriting
  await mkdir(".cursor", { recursive: true });
  let cursorMcp: Record<string, unknown> = {};
  try {
    const { readFile } = await import("fs/promises");
    cursorMcp = JSON.parse(await readFile(".cursor/mcp.json", "utf-8"));
  } catch {
    // No existing file — start fresh
  }
  const existingServers = (cursorMcp.mcpServers as Record<string, unknown>) ?? {};
  // Use absolute path so Cursor/Claude Code can find the binary regardless of PATH
  const binPath = join(process.cwd(), "node_modules", ".bin", "copilot-mcp");
  cursorMcp.mcpServers = { ...existingServers, copilot: { command: binPath, env: { COPILOT_CONFIG_DIR: process.cwd() } } };
  await writeFile(".cursor/mcp.json", JSON.stringify(cursorMcp, null, 2));
  console.log("✓ Updated .cursor/mcp.json");

  // Append to ~/.claude/settings.json for Claude Code
  const settingsPath = join(process.env.HOME ?? "~", ".claude", "settings.json");
  let settings: Record<string, unknown> = {};
  try {
    const { readFile } = await import("fs/promises");
    settings = JSON.parse(await readFile(settingsPath, "utf-8"));
  } catch {
    // file doesn't exist yet — start fresh
  }

  const existing = (settings.mcpServers as Record<string, unknown>) ?? {};
  settings.mcpServers = { ...existing, copilot: { command: "npx", args: ["@hi/copilot-mcp"] } };

  await mkdir(join(process.env.HOME ?? "~", ".claude"), { recursive: true });
  await writeFile(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`✓ Added copilot MCP server to ${settingsPath}`);
  console.log("\nRestart Cursor and/or Claude Code to pick up the new MCP server.\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PROVIDERS: Record<string, () => Promise<void>> = {
  google: setupGoogle,
  snowflake: setupSnowflake,
  vanilla: setupVanilla,
};

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === "status") {
    await showStatus();
    return;
  }

  if (cmd === "generate") {
    await generate();
    return;
  }

  if (cmd && PROVIDERS[cmd]) {
    await PROVIDERS[cmd]();
    await generate();
    return;
  }

  // Interactive wizard
  console.log("copilot-setup — connect providers for Cursor and Claude Code\n");
  const store = await readTokenStore();

  for (const [key, setupFn] of Object.entries(PROVIDERS)) {
    const already = !!store[key]?.access_token;
    const answer = await prompt(`Set up ${key}?${already ? " (already connected)" : ""} [y/N] `);
    if (answer.toLowerCase() === "y") {
      await setupFn();
    }
  }

  await generate();
  console.log("Setup complete! Your tools are now available in Cursor and Claude Code.\n");
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
