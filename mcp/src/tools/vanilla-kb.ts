import type { ToolCall, ToolDefinition } from "../types.js";
import { htmlToMarkdown } from "./lib/html-to-markdown.js";
import { logger } from "./lib/logger.js";

const VANILLA_BASE = "https://community.phenom.com/api/v2";

function getApiKey(): string {
  const key = process.env.VANILLA_API_KEY;
  if (!key) throw new Error("VANILLA_API_KEY not configured");
  return key;
}

// ── Tool handlers ─────────────────────────────────────────────────────────────

interface SearchResult {
  recordID?: number;
  articleID?: number;
  name?: string;
  body?: string;
  url?: string;
  dateUpdated?: string;
  knowledgeBase?: { knowledgeBaseID?: number; name?: string };
  knowledgeCategory?: { name?: string };
}

async function searchKbArticles(params: {
  query: string;
  kb_id?: number;
  limit?: number;
}): Promise<string> {
  const apiKey = getApiKey();
  const limit = Math.min(params.limit ?? 8, 20);

  const url = new URL(`${VANILLA_BASE}/search`);
  url.searchParams.set("query", params.query);
  url.searchParams.append("recordTypes[]", "article");
  url.searchParams.set("limit", String(limit));
  if (params.kb_id) url.searchParams.set("knowledgeBaseID", String(params.kb_id));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });

  if (!res.ok) return `Error searching knowledge base: ${await res.text()}`;

  const data = (await res.json()) as SearchResult[] | { results?: SearchResult[] };
  const results: SearchResult[] = Array.isArray(data) ? data : (data.results ?? []);

  if (results.length === 0) return "No articles found matching that query.";

  return JSON.stringify(
    results.map((r) => ({
      article_id: r.articleID ?? r.recordID,
      title: r.name,
      url: r.url,
      knowledge_base: r.knowledgeBase?.name,
      category: r.knowledgeCategory?.name,
      excerpt: r.body ? r.body.replace(/<[^>]+>/g, "").slice(0, 300) : undefined,
      date_updated: r.dateUpdated,
    })),
    null,
    2
  );
}

interface ArticleResponse {
  articleID?: number;
  name?: string;
  body?: string;
  bodyRendered?: string;
  url?: string;
  dateUpdated?: string;
  knowledgeBase?: { name?: string };
  knowledgeCategory?: { name?: string };
}

async function getKbArticle(params: { article_id: number }): Promise<string> {
  const apiKey = getApiKey();

  const res = await fetch(`${VANILLA_BASE}/articles/${params.article_id}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });

  if (!res.ok) return `Error fetching article ${params.article_id}: ${await res.text()}`;

  const article = (await res.json()) as ArticleResponse;
  const rawHtml = article.body ?? article.bodyRendered ?? "";
  const body = htmlToMarkdown(rawHtml);

  const meta = [
    article.knowledgeBase?.name && `**Knowledge Base:** ${article.knowledgeBase.name}`,
    article.knowledgeCategory?.name && `**Category:** ${article.knowledgeCategory.name}`,
    article.url && `**URL:** ${article.url}`,
    article.dateUpdated && `**Last Updated:** ${article.dateUpdated}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `# ${article.name ?? "Untitled"}\n\n${meta}\n\n---\n\n${body}`;
}

// ── Tool definitions ──────────────────────────────────────────────────────────

export const vanillaKbToolDefinitions: ToolDefinition[] = [
  {
    name: "search_kb",
    description:
      "Search Phenom's customer-facing knowledge base for articles about product features, setup guides, and how-to documentation. Returns article titles, IDs, excerpts, and URLs. Use kb_id to target a specific product knowledge base — see the vanilla-kb skill for the ID mapping.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query — use specific feature or topic keywords for best results",
        },
        kb_id: {
          type: "number",
          description:
            "Knowledge base ID to search within. See vanilla-kb skill for the full list. Omit to search across all KBs.",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 8, max: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_kb_article",
    description:
      "Fetch the full content of a knowledge base article by ID. Returns the complete article in markdown. Always call this after search_kb to get the full content before quoting or summarizing an article.",
    input_schema: {
      type: "object",
      properties: {
        article_id: {
          type: "number",
          description: "Article ID from search_kb results",
        },
      },
      required: ["article_id"],
    },
  },
];

export const vanillaKbToolNames = new Set(vanillaKbToolDefinitions.map((t) => t.name));

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function executeVanillaKbTool(call: ToolCall): Promise<string> {
  logger.debug("vanilla-kb", `tool: ${call.name}(${JSON.stringify(call.input).slice(0, 100)})`);

  try {
    switch (call.name) {
      case "search_kb":
        return await searchKbArticles(call.input as Parameters<typeof searchKbArticles>[0]);
      case "get_kb_article":
        return await getKbArticle(call.input as Parameters<typeof getKbArticle>[0]);
      default:
        return `Unknown vanilla-kb tool: ${call.name}`;
    }
  } catch (err) {
    logger.error("vanilla-kb", `tool error: ${call.name}`, err);
    return `Error executing ${call.name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
