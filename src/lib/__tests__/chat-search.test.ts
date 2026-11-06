import { describe, expect, it } from "vitest";

import {
  MAX_SEARCH_RESULTS,
  MAX_SOURCE_COUNT,
  WEB_SEARCH_TOOL,
  buildSearchRequest,
  buildToolResult,
  clampSearchText,
  mergeSearchResults,
  parseSearchResults,
  safeHttpUrl,
  toChatSources,
  type ChatSource,
} from "@/lib/chat-search";

describe("safeHttpUrl", () => {
  it("accepts http/https and rejects unsafe schemes", () => {
    expect(safeHttpUrl("https://example.com/a")).toBe(
      "https://example.com/a",
    );
    expect(safeHttpUrl("http://example.com")).toBe("http://example.com/");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,x")).toBeNull();
    expect(safeHttpUrl("ftp://example.com")).toBeNull();
    expect(safeHttpUrl("https://user:pass@example.com")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
  });
});

describe("clampSearchText", () => {
  it("collapses whitespace and limits to 128 characters", () => {
    expect(clampSearchText("  hello\n world  ")).toBe("hello world");
    expect(Array.from(clampSearchText("x".repeat(200)))).toHaveLength(128);
  });
});

describe("buildSearchRequest", () => {
  it("builds the DeepSeek search body", () => {
    expect(buildSearchRequest("  DeepSeek V4  ", "原始问题")).toEqual({
      query: "DeepSeek V4",
      count: MAX_SEARCH_RESULTS,
      need_content: false,
      ori_question: "原始问题",
    });
  });

  it("returns null for empty queries", () => {
    expect(buildSearchRequest("   ")).toBeNull();
  });
});

describe("parseSearchResults", () => {
  const payload = {
    results: [
      {
        title: " 标题 ",
        url: "https://example.com/a",
        snippet: " 摘要 ",
        summary: " 长摘要 ",
        site_name: " Example ",
        date: "2026-11-06T00:00:00+00:00",
      },
      {
        title: "重复",
        url: "https://example.com/a",
        snippet: "重复",
        summary: "重复",
      },
      {
        title: "不安全",
        url: "javascript:alert(1)",
        snippet: "x",
        summary: "x",
      },
      {
        title: "",
        url: "https://example.com/b",
        snippet: "x",
        summary: "x",
      },
    ],
  };

  it("validates, trims, dedupes and limits results", () => {
    const results = parseSearchResults(payload);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "标题",
      url: "https://example.com/a",
      snippet: "摘要",
      summary: "长摘要",
      siteName: "Example",
      date: "2026-11-06T00:00:00+00:00",
    });
  });

  it("returns empty for malformed payloads", () => {
    expect(parseSearchResults(null)).toEqual([]);
    expect(parseSearchResults({ results: "nope" })).toEqual([]);
  });
});

describe("sources and citations", () => {
  const result = {
    title: "标题",
    url: "https://example.com/a",
    snippet: "摘要",
    summary: "长摘要",
    siteName: "Example",
  };

  it("strips summary for chat sources", () => {
    expect(toChatSources([result])).toEqual([
      {
        title: "标题",
        url: "https://example.com/a",
        snippet: "摘要",
        siteName: "Example",
      },
    ]);
  });

  it("merges sources and assigns citation numbers", () => {
    const existing: ChatSource[] = [
      { title: "旧", url: "https://example.com/old" },
    ];
    const merged = mergeSearchResults(existing, [
      result,
      { ...result, title: "重复", url: "https://example.com/a" },
    ]);

    expect(merged.added).toHaveLength(1);
    expect(merged.startIndex).toBe(2);
    expect(merged.sources.map((source) => source.url)).toEqual([
      "https://example.com/old",
      "https://example.com/a",
    ]);

    const toolResult = JSON.parse(
      buildToolResult("q", merged.added, merged.startIndex),
    );
    expect(toolResult.results[0].citation).toBe(2);
  });

  it("caps merged sources", () => {
    const existing = Array.from({ length: 20 }, (_, index) => ({
      title: `t${index}`,
      url: `https://example.com/${index}`,
    }));
    const merged = mergeSearchResults(existing, [result]);

    expect(merged.sources.length).toBeLessThanOrEqual(MAX_SOURCE_COUNT);
  });
});

describe("WEB_SEARCH_TOOL", () => {
  it("describes the web_search function", () => {
    expect(WEB_SEARCH_TOOL.function.name).toBe("web_search");
    expect(WEB_SEARCH_TOOL.function.parameters.required).toEqual(["query"]);
  });
});
