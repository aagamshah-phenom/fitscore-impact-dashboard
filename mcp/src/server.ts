#!/usr/bin/env node
/**
 * copilot-mcp — MCP stdio server for hi-copilot tools
 *
 * Usage (in .cursor/mcp.json or Claude Code settings):
 *   { "command": "npx", "args": ["copilot-mcp"] }
 *
 * Run `npm run setup` to authenticate providers first.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "./types.js";
import { getAvailableToolDefinitions, executeTool } from "./tools/index.js";
import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load .env from the hi-copilot-config directory
async function loadDotEnv() {
  const candidates = [
    ...(process.env.COPILOT_CONFIG_DIR ? [join(process.env.COPILOT_CONFIG_DIR, ".env")] : []),
    join(process.cwd(), ".env"),
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf-8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) process.env[key] = val;
      }
      break;
    } catch {
      // try next candidate
    }
  }
}

await loadDotEnv();

function toMcpTool(def: ToolDefinition): Tool {
  return {
    name: def.name,
    description: def.description,
    inputSchema: def.input_schema as Tool["inputSchema"],
  };
}

async function main() {
  const server = new Server(
    { name: "copilot-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const definitions = await getAvailableToolDefinitions();
    return { tools: definitions.map(toMcpTool) };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await executeTool({ id: "", name, input: args ?? {} });
    return {
      content: [{ type: "text", text: result }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write("copilot-mcp server started\n");
}

main().catch((err) => {
  process.stderr.write(`copilot-mcp fatal error: ${err}\n`);
  process.exit(1);
});
