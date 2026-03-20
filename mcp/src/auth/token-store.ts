import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";

export interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string; // ISO string
  metadata?: Record<string, unknown>;
}

export interface TokenStoreData {
  backend_jwt?: string;
  [provider: string]: StoredTokens | string | undefined;
}

export type TokenStore = Record<string, StoredTokens>;

const TOKENS_PATH = join(homedir(), ".copilot", "tokens.json");

export async function readTokenStore(): Promise<TokenStore> {
  if (!existsSync(TOKENS_PATH)) return {};
  try {
    const raw = await readFile(TOKENS_PATH, "utf-8");
    const data = JSON.parse(raw) as TokenStoreData;
    // Strip non-token fields before returning
    const store: TokenStore = {};
    for (const [key, val] of Object.entries(data)) {
      if (key === "backend_jwt") continue;
      if (val && typeof val === "object") store[key] = val as StoredTokens;
    }
    return store;
  } catch {
    return {};
  }
}

export async function writeTokenStore(store: TokenStore): Promise<void> {
  const dir = dirname(TOKENS_PATH);
  await mkdir(dir, { recursive: true });
  // Preserve backend_jwt if it exists
  let existing: TokenStoreData = {};
  try {
    existing = JSON.parse(await readFile(TOKENS_PATH, "utf-8")) as TokenStoreData;
  } catch {
    // ignore
  }
  const data: TokenStoreData = { ...store };
  if (existing.backend_jwt) data.backend_jwt = existing.backend_jwt;
  // Atomic write: write to a temp file then rename
  const tmp = TOKENS_PATH + ".tmp";
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  const { rename } = await import("fs/promises");
  await rename(tmp, TOKENS_PATH);
}

export async function getToken(provider: string): Promise<StoredTokens | null> {
  const store = await readTokenStore();
  return store[provider] ?? null;
}

export async function setToken(provider: string, tokens: StoredTokens): Promise<void> {
  const store = await readTokenStore();
  store[provider] = tokens;
  await writeTokenStore(store);
}

export async function deleteToken(provider: string): Promise<void> {
  const store = await readTokenStore();
  delete store[provider];
  await writeTokenStore(store);
}

export function tokensPath(): string {
  return TOKENS_PATH;
}

export async function getBackendJwt(): Promise<string | null> {
  if (!existsSync(TOKENS_PATH)) return null;
  try {
    const data = JSON.parse(await readFile(TOKENS_PATH, "utf-8")) as TokenStoreData;
    return (data.backend_jwt as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function setBackendJwt(jwt: string): Promise<void> {
  const dir = dirname(TOKENS_PATH);
  await mkdir(dir, { recursive: true });
  let data: TokenStoreData = {};
  try {
    data = JSON.parse(await readFile(TOKENS_PATH, "utf-8")) as TokenStoreData;
  } catch {
    // ignore
  }
  data.backend_jwt = jwt;
  const tmp = TOKENS_PATH + ".tmp";
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  const { rename } = await import("fs/promises");
  await rename(tmp, TOKENS_PATH);
}
