export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  summary: string;
  siteName?: string;
  date?: string;
};

export type ChatSource = {
  title: string;
  url: string;
  snippet?: string;
  siteName?: string;
  date?: string;
};

export type SearchRequest = {
  query: string;
  count: number;
  need_content: boolean;
  ori_question?: string;
};

export const MAX_SEARCH_RESULTS = 5;
export const MAX_SOURCE_COUNT = 15;
export const MAX_SEARCH_QUERY_LENGTH = 128;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function clampSearchText(value: string): string {
  return Array.from(value.replace(/\s+/g, " ").trim())
    .slice(0, MAX_SEARCH_QUERY_LENGTH)
    .join("");
}

export function buildSearchRequest(
  query: string,
  oriQuestion?: string,
): SearchRequest | null {
  const normalizedQuery = clampSearchText(query);
  if (!normalizedQuery) return null;

  const normalizedQuestion = oriQuestion
    ? clampSearchText(oriQuestion)
    : undefined;

  return {
    query: normalizedQuery,
    count: MAX_SEARCH_RESULTS,
    need_content: false,
    ...(normalizedQuestion ? { ori_question: normalizedQuestion } : {}),
  };
}

export function parseSearchResults(
  payload: unknown,
  limit = MAX_SEARCH_RESULTS,
): SearchResult[] {
  if (!isRecord(payload) || !Array.isArray(payload.results)) return [];

  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const item of payload.results) {
    if (!isRecord(item)) continue;

    const title = typeof item.title === "string" ? item.title.trim() : "";
    const url =
      typeof item.url === "string" ? safeHttpUrl(item.url) : null;
    if (!title || !url || seen.has(url)) continue;

    const rawSnippet =
      typeof item.snippet === "string" ? item.snippet.trim() : "";
    const rawSummary =
      typeof item.summary === "string" ? item.summary.trim() : "";
    if (!rawSnippet && !rawSummary) continue;

    seen.add(url);
    results.push({
      title: title.slice(0, 300),
      url,
      snippet: (rawSnippet || rawSummary).slice(0, 500),
      summary: (rawSummary || rawSnippet).slice(0, 2000),
      ...(typeof item.site_name === "string" && item.site_name.trim()
        ? { siteName: item.site_name.trim().slice(0, 100) }
        : {}),
      ...(typeof item.date === "string" && item.date.trim()
        ? { date: item.date.trim().slice(0, 40) }
        : {}),
    });

    if (results.length >= limit) break;
  }

  return results;
}

export function toChatSources(results: SearchResult[]): ChatSource[] {
  return results.map((result) => ({
    title: result.title,
    url: result.url,
    ...(result.snippet ? { snippet: result.snippet } : {}),
    ...(result.siteName ? { siteName: result.siteName } : {}),
    ...(result.date ? { date: result.date } : {}),
  }));
}

/**
 * Merges new search results into the existing source list, drops URLs that
 * were already cited, and returns the citation number for the first new result.
 */
export function mergeSearchResults(
  existing: ChatSource[],
  incoming: SearchResult[],
): {
  sources: ChatSource[];
  added: SearchResult[];
  startIndex: number;
} {
  const seen = new Set(existing.map((source) => source.url));
  const added: SearchResult[] = [];

  for (const result of incoming) {
    if (seen.has(result.url)) continue;
    seen.add(result.url);
    added.push(result);
  }

  return {
    sources: [...existing, ...toChatSources(added)].slice(0, MAX_SOURCE_COUNT),
    added,
    startIndex: existing.length + 1,
  };
}

export function buildToolResult(
  query: string,
  results: SearchResult[],
  startIndex: number,
): string {
  return JSON.stringify({
    query,
    results: results.map((result, index) => ({
      citation: startIndex + index,
      title: result.title,
      url: result.url,
      summary: result.summary,
      ...(result.siteName ? { site_name: result.siteName } : {}),
      ...(result.date ? { date: result.date } : {}),
    })),
  });
}

export const WEB_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "搜索实时网页。用于需要最新信息、事实核查、新闻、价格、版本、政策、人物近况，或用户明确要求联网的问题。普通常识、闲聊、写作和代码问题不需要搜索。",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "搜索词，1–128 个字符。支持 site:、lang:、after:、before: 等搜索语法。",
        },
        ori_question: {
          type: "string",
          description: "触发搜索的用户原始问题，可选，1–128 个字符。",
        },
      },
      required: ["query"],
    },
  },
} as const;
