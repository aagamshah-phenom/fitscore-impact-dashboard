/** Shared types for the copilot MCP server. */

export interface IntegrationRecord {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: Date | null;
  metadata: Record<string, unknown>;
}

export interface CredentialProvider {
  getCredentials(provider: string): Promise<IntegrationRecord | null>;
  saveCredentials(
    provider: string,
    tokens: {
      access_token: string;
      refresh_token?: string;
      token_expires_at?: Date;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}
