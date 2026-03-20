import type { ToolCall, ToolDefinition, CredentialProvider } from "../types.js";
import { logger } from "./lib/logger.js";

// ── Credential helper ─────────────────────────────────────────────────────────

interface SnowflakeCreds {
  authMode: "oauth" | "pat";
  accessToken: string;
  account: string;
  warehouse?: string;
  role?: string;
}

async function getSnowflakeCredsFromProvider(credProvider: CredentialProvider): Promise<SnowflakeCreds | null> {
  const row = await credProvider.getCredentials("snowflake");
  if (!row?.access_token) return null;
  const meta = row.metadata as { account?: string; warehouse?: string; role?: string; authMode?: string } | null;
  if (!meta?.account) return null;
  return {
    authMode: meta.authMode === "pat" ? "pat" : "oauth",
    accessToken: row.access_token,
    account: meta.account,
    warehouse: meta.warehouse,
    role: meta.role,
  };
}

// ── Snowflake SQL REST API v2 ─────────────────────────────────────────────────

interface SnowflakeStatementResponse {
  statementHandle?: string;
  message?: string;
  code?: string;
  sqlState?: string;
  resultSetMetaData?: {
    rowType: Array<{ name: string; type: string }>;
    numRows: number;
  };
  data?: string[][];
}

async function runStatement(
  creds: SnowflakeCreds,
  sql: string,
  warehouse?: string,
  database?: string,
  schema?: string
): Promise<{ columns: string[]; rows: Record<string, string>[]; rowCount: number }> {
  const url = `https://${creds.account}.snowflakecomputing.com/api/v2/statements`;

  const body: Record<string, unknown> = {
    statement: sql,
    timeout: 120,
  };
  if (warehouse ?? creds.warehouse) body.warehouse = warehouse ?? creds.warehouse;
  if (database) body.database = database;
  if (schema) body.schema = schema;

  const tokenType = creds.authMode === "pat" ? "PROGRAMMATIC_ACCESS_TOKEN" : "OAUTH";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${creds.accessToken}`,
      "X-Snowflake-Authorization-Token-Type": tokenType,
    },
    body: JSON.stringify(body),
  });

  const result = (await res.json()) as SnowflakeStatementResponse;

  if (!res.ok || (result.code && result.code !== "090001")) {
    throw new Error(`Snowflake error (${res.status}): ${result.message ?? JSON.stringify(result)}`);
  }

  const columns = result.resultSetMetaData?.rowType.map((c) => c.name) ?? [];
  const rows = (result.data ?? []).map((row) => {
    const obj: Record<string, string> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i] ?? "";
    });
    return obj;
  });

  return { columns, rows, rowCount: rows.length };
}

// ── Tool definitions ──────────────────────────────────────────────────────────

export const snowflakeToolDefinitions: ToolDefinition[] = [
  {
    name: "execute_snowflake_query",
    description:
      "Execute a SQL query against Snowflake and return results as JSON. " +
      "Use this to fetch ServiceNow tickets, support data, or any data stored in Snowflake. " +
      "Always include a LIMIT clause to avoid returning too many rows (max 500 recommended). " +
      "Results are capped at 500 rows regardless of query.",
    input_schema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description:
            "The SQL SELECT statement to execute. Include a LIMIT clause. " +
            "Example: SELECT number, short_description, category, opened_at FROM SERVICENOW.PUBLIC.INCIDENT WHERE category = 'Scheduling' AND opened_at >= DATEADD('month', -3, CURRENT_TIMESTAMP()) LIMIT 500",
        },
        database: {
          type: "string",
          description: "Snowflake database to query. Leave blank to use the default from the config page.",
        },
        schema: {
          type: "string",
          description: "Snowflake schema to query. Leave blank to use the default from the config page.",
        },
        warehouse: {
          type: "string",
          description: "Snowflake warehouse to use. Defaults to the user's connected warehouse.",
        },
      },
      required: ["sql"],
    },
  },
];

export const snowflakeToolNames = new Set(snowflakeToolDefinitions.map((t) => t.name));

// ── Executor ──────────────────────────────────────────────────────────────────

export async function executeSnowflakeTool(
  _userId: string,
  call: ToolCall,
  credProvider: CredentialProvider
): Promise<string> {
  const creds = await getSnowflakeCredsFromProvider(credProvider);
  if (!creds) {
    return "Error: Snowflake is not connected. Run `npm run setup` and follow the Snowflake prompts.";
  }

  if (call.name === "execute_snowflake_query") {
    const { sql, database, schema, warehouse } = call.input as {
      sql: string;
      database?: string;
      schema?: string;
      warehouse?: string;
    };

    if (!sql?.trim()) return "Error: sql parameter is required.";

    try {
      logger.debug("snowflake", `executing: ${sql.slice(0, 160)}`);
      const { columns, rows, rowCount } = await runStatement(creds, sql, warehouse, database, schema);

      if (rowCount === 0) return "Query returned 0 rows.";

      const capped = rows.slice(0, 500);
      const truncated = rowCount > 500 ? ` (showing first 500 of ${rowCount})` : "";

      return (
        `Query returned ${rowCount} rows${truncated}. Columns: ${columns.join(", ")}\n\n` +
        `Results:\n${JSON.stringify(capped, null, 2)}`
      );
    } catch (err) {
      logger.error("snowflake", `query error: ${err}`);
      return `Error executing query: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return `Unknown tool: ${call.name}`;
}
