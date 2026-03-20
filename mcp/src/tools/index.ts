/**
 * Tool registry for the MCP server.
 * Tools: Google (Drive/Docs/Sheets/Slides/Calendar), Snowflake, Vanilla KB.
 * Jira/Confluence → mcp-atlassian official server
 * Figma           → @figma/mcp-server official server
 */

import type { ToolDefinition, ToolCall } from "../types.js";
import { FileCredentialProvider } from "../auth/file-credential-provider.js";
import { readTokenStore } from "../auth/token-store.js";

import { googleToolDefinitions, executeGoogleTool } from "./google.js";
import { snowflakeToolDefinitions, executeSnowflakeTool } from "./snowflake.js";
import { vanillaKbToolDefinitions, executeVanillaKbTool } from "./vanilla-kb.js";

type Executor = (userId: string, call: ToolCall, credProvider: FileCredentialProvider) => Promise<string>;

interface ProviderEntry {
  tokenKey: string;
  definitions: ToolDefinition[];
  execute: Executor;
}

// Vanilla reads VANILLA_API_KEY from process.env — inject from token store before each call.
async function executeVanillaWithCreds(_userId: string, call: ToolCall, credProvider: FileCredentialProvider): Promise<string> {
  const creds = await credProvider.getCredentials("vanilla");
  if (creds?.access_token) process.env.VANILLA_API_KEY = creds.access_token;
  return executeVanillaKbTool(call);
}

const PROVIDERS: ProviderEntry[] = [
  { tokenKey: "google", definitions: googleToolDefinitions, execute: executeGoogleTool as Executor },
  { tokenKey: "snowflake", definitions: snowflakeToolDefinitions, execute: executeSnowflakeTool as Executor },
  { tokenKey: "vanilla", definitions: vanillaKbToolDefinitions, execute: executeVanillaWithCreds },
];

export async function getAvailableToolDefinitions(): Promise<ToolDefinition[]> {
  const store = await readTokenStore();
  const connected = new Set(Object.keys(store).filter((k) => !!store[k]?.access_token));
  // Vanilla can be configured via env var directly (no setup step required)
  if (process.env.VANILLA_API_KEY) connected.add("vanilla");

  const definitions: ToolDefinition[] = [];
  const seen = new Set<string>();

  for (const p of PROVIDERS) {
    if (!connected.has(p.tokenKey)) continue;
    for (const def of p.definitions) {
      if (!seen.has(def.name)) {
        seen.add(def.name);
        definitions.push(def);
      }
    }
  }

  return definitions;
}

export async function executeTool(call: ToolCall): Promise<string> {
  const credProvider = new FileCredentialProvider();

  for (const p of PROVIDERS) {
    const names = new Set(p.definitions.map((d) => d.name));
    if (names.has(call.name)) {
      return p.execute("", call, credProvider);
    }
  }

  return `Unknown tool: ${call.name}`;
}
