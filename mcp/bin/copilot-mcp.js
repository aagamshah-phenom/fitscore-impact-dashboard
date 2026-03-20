#!/usr/bin/env node
/**
 * copilot-mcp — dispatch to MCP server or setup CLI based on first argument.
 *
 * Usage:
 *   copilot-mcp             → start MCP stdio server
 *   copilot-mcp setup       → run setup wizard
 *   copilot-mcp setup google / snowflake / vanilla
 *   copilot-mcp status      → show connected providers
 *   copilot-mcp generate    → regenerate IDE config files
 */
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join, resolve } from "path";
import { spawnSync } from "child_process";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const tsxPkg = dirname(require.resolve("tsx/package.json"));
const tsxEsm = resolve(tsxPkg, "dist", "esm", "index.mjs");

const CLI_COMMANDS = new Set(["setup", "status", "generate", "google", "snowflake", "vanilla"]);
const subcommand = process.argv[2];

const srcFile = CLI_COMMANDS.has(subcommand)
  ? join(__dirname, "..", "src", "cli", "setup.ts")
  : join(__dirname, "..", "src", "server.ts");

const result = spawnSync(
  process.execPath,
  ["--import", pathToFileURL(tsxEsm).href, srcFile, ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env }
);

process.exit(result.status ?? 0);
