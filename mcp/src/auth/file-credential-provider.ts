import type { CredentialProvider, IntegrationRecord } from "../types.js";
import { getToken, setToken, getBackendJwt } from "./token-store.js";
import { BACKEND_URL } from "../config.js";

/**
 * FileCredentialProvider reads and writes OAuth tokens from ~/.copilot/tokens.json.
 * Used by the MCP server — no database required.
 *
 * When a token is within 5 minutes of expiry, it automatically refreshes via the
 * backend Cloud Run service (which holds OAuth client secrets).
 */
export class FileCredentialProvider implements CredentialProvider {
  async getCredentials(provider: string): Promise<IntegrationRecord | null> {
    let stored = await getToken(provider);
    if (!stored?.access_token) return null;

    // Auto-refresh if token expires within 5 minutes
    if (stored.refresh_token && stored.token_expires_at) {
      const expiresAt = new Date(stored.token_expires_at).getTime();
      if (expiresAt - Date.now() < 5 * 60 * 1000) {
        stored = await this.refreshViaBackend(provider);
      }
    }

    return {
      access_token: stored.access_token,
      refresh_token: stored.refresh_token ?? null,
      token_expires_at: stored.token_expires_at ? new Date(stored.token_expires_at) : null,
      metadata: stored.metadata ?? {},
    };
  }

  async saveCredentials(
    provider: string,
    tokens: {
      access_token: string;
      refresh_token?: string;
      token_expires_at?: Date;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await setToken(provider, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.token_expires_at?.toISOString(),
      metadata: tokens.metadata,
    });
  }

  /** Refresh a provider's access token via the backend and update local cache. */
  async refreshViaBackend(provider: string): Promise<{ access_token: string; refresh_token?: string; token_expires_at?: string; metadata?: Record<string, unknown> }> {
    const jwt = await getBackendJwt();
    if (!jwt) throw new Error("Not logged in to backend. Run 'npm run setup' to authenticate.");

    const res = await fetch(`${BACKEND_URL}/integrations/refresh/${provider}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Token refresh failed (${res.status}): ${body}`);
    }

    const refreshed = (await res.json()) as { access_token: string; token_expires_at?: string };

    // Merge with existing stored token to preserve refresh_token and metadata
    const existing = await getToken(provider);
    const updated = {
      access_token: refreshed.access_token,
      refresh_token: existing?.refresh_token,
      token_expires_at: refreshed.token_expires_at,
      metadata: existing?.metadata,
    };

    await setToken(provider, updated);
    return updated;
  }
}
