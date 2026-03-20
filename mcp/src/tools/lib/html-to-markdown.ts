import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Preserve Confluence-specific elements where possible
turndown.addRule("strikethrough", {
  filter: ["del", "s", "strike"],
  replacement: (content: string) => `~~${content}~~`,
});

export function htmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return "";
  try {
    return turndown.turndown(html);
  } catch {
    return html.replace(/<[^>]+>/g, "");
  }
}
