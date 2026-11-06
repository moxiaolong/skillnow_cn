import { describe, expect, it } from "vitest";

import {
  EMPTY_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  SEARCH_TOOL_PROMPT,
  SKILL_SYSTEM_PREFIX,
  buildRequestMessages,
  buildSkillSystemPrompt,
  buildSystemPrompt,
  createSseParser,
  extractCompletion,
  extractProviderError,
  isAbortError,
  mapHttpError,
  mapSearchHttpError,
  redactSecret,
  type StreamEvent,
} from "@/lib/chat-stream";
import type { ChatMessage } from "@/lib/chat-history";

function parse(chunks: string[]): StreamEvent[] {
  const events: StreamEvent[] = [];
  const parser = createSseParser((event) => events.push(event));
  for (const chunk of chunks) parser.push(chunk);
  parser.flush();
  return events;
}

let sequence = 0;

function message(
  role: "user" | "assistant",
  content: string,
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  sequence += 1;
  return {
    id: `m${sequence}`,
    role,
    content,
    status: "complete",
    createdAt: sequence,
    ...overrides,
  };
}

describe("createSseParser", () => {
  it("reads content deltas", () => {
    expect(
      parse(['data: {"choices":[{"delta":{"content":"你"}}]}\n\n']),
    ).toEqual([{ type: "delta", content: "你" }]);
  });

  it("reads multiple events in one chunk", () => {
    expect(
      parse([
        'data: {"choices":[{"delta":{"content":"你"}}]}\n\ndata: {"choices":[{"delta":{"content":"好"}}]}\n\n',
      ]),
    ).toEqual([
      { type: "delta", content: "你" },
      { type: "delta", content: "好" },
    ]);
  });

  it("handles JSON split across chunks", () => {
    expect(
      parse([
        'data: {"choices":[{"delta":{"con',
        'tent":"好"}}]}\n\n',
      ]),
    ).toEqual([{ type: "delta", content: "好" }]);
  });

  it("handles CRLF, comments and blank lines", () => {
    expect(
      parse([
        ": keep-alive\r\n\r\ndata: {\"choices\":[{\"delta\":{\"content\":\"好\"}}]}\r\n\r\n",
      ]),
    ).toEqual([{ type: "delta", content: "好" }]);
  });

  it("reads reasoning content", () => {
    expect(
      parse([
        'data: {"choices":[{"delta":{"reasoning_content":"想"}}]}\n\n',
        'data: {"choices":[{"delta":{"reasoning":"再想"}}]}\n\n',
      ]),
    ).toEqual([
      { type: "delta", reasoning: "想" },
      { type: "delta", reasoning: "再想" },
    ]);
  });

  it("reads a non-streaming message fallback", () => {
    expect(
      parse(['data: {"choices":[{"message":{"content":"完整"}}]}\n\n']),
    ).toEqual([{ type: "delta", content: "完整" }]);
  });

  it("emits done for [DONE]", () => {
    expect(parse(["data: [DONE]\n\n"])).toEqual([{ type: "done" }]);
  });

  it("ignores malformed JSON", () => {
    expect(parse(["data: not-json\n\n"])).toEqual([]);
  });

  it("emits provider errors from the stream", () => {
    expect(
      parse(['data: {"error":{"message":"额度不足"}}\n\n']),
    ).toEqual([{ type: "error", message: "额度不足" }]);
  });

  it("flushes a trailing line without a newline", () => {
    expect(
      parse(['data: {"choices":[{"delta":{"content":"尾"}}]}']),
    ).toEqual([{ type: "delta", content: "尾" }]);
  });

  it("reads streamed tool call deltas", () => {
    expect(
      parse([
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"web_search","arguments":"{\\"query\\":\\"Deep"}}]}}]}\n\n',
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"Seek\\"}"}}]}}]}\n\n',
      ]),
    ).toEqual([
      {
        type: "delta",
        toolCalls: [
          {
            index: 0,
            id: "call_1",
            name: "web_search",
            arguments: '{"query":"Deep',
          },
        ],
      },
      {
        type: "delta",
        toolCalls: [{ index: 0, arguments: 'Seek"}' }],
      },
    ]);
  });
});

describe("buildRequestMessages", () => {
  it("keeps prior turns and appends the new user turn", () => {
    const request = buildRequestMessages(
      [
        message("user", "第一问"),
        message("assistant", "第一答", { reasoning: "想" }),
      ],
      "第二问",
    );

    expect(request).toEqual([
      { role: "user", content: "第一问" },
      { role: "assistant", content: "第一答", reasoning_content: "想" },
      { role: "user", content: "第二问" },
    ]);
  });

  it("prepends the skill system prompt", () => {
    const request = buildRequestMessages([], "你好", {
      systemPrompt: buildSkillSystemPrompt("技能正文"),
    });

    expect(request[0]).toEqual({
      role: "system",
      content: buildSkillSystemPrompt("技能正文"),
    });
    expect(request[0].content).toContain(SKILL_SYSTEM_PREFIX);
    expect(request[1]).toEqual({ role: "user", content: "你好" });
  });

  it("combines Skill and search prompts", () => {
    const systemPrompt = buildSystemPrompt("技能正文", true);

    expect(systemPrompt).toContain(SKILL_SYSTEM_PREFIX);
    expect(systemPrompt).toContain(SEARCH_TOOL_PROMPT);

    const request = buildRequestMessages([], "你好", { systemPrompt });
    expect(request[0]).toEqual({ role: "system", content: systemPrompt });
  });

  it("sends summary messages as system context", () => {
    const request = buildRequestMessages(
      [
        message("assistant", "摘要内容", { kind: "summary" }),
        message("user", "继续"),
      ],
      "新问题",
    );

    expect(request[0]).toEqual({
      role: "system",
      content: "以下是早期对话摘要：\n摘要内容",
    });
    expect(request[1]).toEqual({ role: "user", content: "继续" });
    expect(request[2]).toEqual({ role: "user", content: "新问题" });
  });

  it("excludes streaming, errored and empty history", () => {
    const request = buildRequestMessages(
      [
        message("assistant", "半截", { status: "streaming" }),
        message("assistant", "报错", { status: "error" }),
        message("assistant", "   "),
        message("user", "保留"),
      ],
      "新消息",
    );

    expect(request).toEqual([
      { role: "user", content: "保留" },
      { role: "user", content: "新消息" },
    ]);
  });

  it("includes the quoted message in the new user turn", () => {
    const request = buildRequestMessages([], "我不同意", {
      quote: {
        messageId: "a1",
        speakerName: "弗洛伊德",
        text: "自由是……",
      },
    });

    expect(request).toEqual([
      {
        role: "user",
        content: "[引用 弗洛伊德 的消息]\n自由是……\n\n我不同意",
      },
    ]);
  });

  it("keeps quotes on earlier user turns", () => {
    const request = buildRequestMessages(
      [
        message("user", "之前说过", {
          quote: {
            messageId: "a1",
            speakerName: "黑格尔",
            text: "历史观点",
          },
        }),
      ],
      "继续",
    );

    expect(request).toEqual([
      {
        role: "user",
        content: "[引用 黑格尔 的消息]\n历史观点\n\n之前说过",
      },
      { role: "user", content: "继续" },
    ]);
  });

  it("caps history by characters from the newest end", () => {
    const request = buildRequestMessages(
      [message("user", "1234"), message("assistant", "5678")],
      "new",
      { maxHistoryChars: 4 },
    );

    expect(request).toEqual([
      { role: "assistant", content: "5678" },
      { role: "user", content: "new" },
    ]);
  });

  it("keeps a single oversized history message", () => {
    const request = buildRequestMessages(
      [message("user", "123456789")],
      "new",
      { maxHistoryChars: 4 },
    );

    expect(request).toEqual([
      { role: "user", content: "123456789" },
      { role: "user", content: "new" },
    ]);
  });
});

describe("extractCompletion", () => {
  it("extracts content and reasoning from a non-streaming response", () => {
    expect(
      extractCompletion({
        choices: [
          {
            message: {
              content: "你好",
              reasoning_content: "想",
            },
          },
        ],
      }),
    ).toEqual({ content: "你好", reasoning: "想", toolCalls: [] });
  });

  it("extracts non-streaming tool calls", () => {
    expect(
      extractCompletion({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "web_search",
                    arguments: '{"query":"x"}',
                  },
                },
              ],
            },
          },
        ],
      }),
    ).toEqual({
      content: "",
      reasoning: "",
      toolCalls: [
        {
          id: "call_1",
          name: "web_search",
          arguments: '{"query":"x"}',
        },
      ],
    });
  });

  it("returns empty values for malformed payloads", () => {
    expect(extractCompletion(null)).toEqual({
      content: "",
      reasoning: "",
      toolCalls: [],
    });
    expect(extractCompletion({ choices: [] })).toEqual({
      content: "",
      reasoning: "",
      toolCalls: [],
    });
    expect(extractCompletion({ choices: [{ message: null }] })).toEqual({
      content: "",
      reasoning: "",
      toolCalls: [],
    });
  });
});

describe("mapHttpError", () => {
  it("maps common statuses to friendly messages", () => {
    expect(mapHttpError(401)).toBe("API Key 无效或已过期，请检查后重试。");
    expect(mapHttpError(402)).toBe(
      "模型平台账户余额不足，请充值后重试。",
    );
    expect(mapHttpError(429)).toBe(
      "请求过于频繁或额度受限，请稍后再试。",
    );
    expect(mapHttpError(500)).toBe(
      "模型平台暂时不可用，请稍后再试。",
    );
    expect(mapHttpError(418)).toBe("请求失败（HTTP 418）。");
  });

  it("exposes stable network and empty-response copy", () => {
    expect(NETWORK_ERROR_MESSAGE).toContain("无法连接模型平台");
    expect(EMPTY_RESPONSE_MESSAGE).toBe("模型平台未返回内容。");
  });

  it("maps search 404 to a search-specific hint", () => {
    expect(mapSearchHttpError(404)).toContain("不支持联网搜索接口");
    expect(mapSearchHttpError(401)).toBe(mapHttpError(401));
  });
});

describe("extractProviderError", () => {
  it("extracts nested and flat JSON error messages", () => {
    expect(
      extractProviderError('{"error":{"message":"bad key"}}', "sk-abc"),
    ).toBe("bad key");
    expect(extractProviderError('{"message":"boom"}', "sk-abc")).toBe("boom");
  });

  it("keeps plain-text errors", () => {
    expect(extractProviderError("oops", "sk-abc")).toBe("oops");
  });

  it("redacts the API key", () => {
    expect(
      extractProviderError(
        '{"error":{"message":"key sk-secret is invalid"}}',
        "sk-secret",
      ),
    ).toBe("key sk-*** is invalid");
  });

  it("strips control characters and collapses whitespace", () => {
    expect(extractProviderError("a\u0000b\n\nc", "sk")).toBe("a b c");
  });

  it("truncates long details", () => {
    const result = extractProviderError("x".repeat(400), "sk");
    expect(result).not.toBeNull();
    expect(result?.endsWith("…")).toBe(true);
    expect(result?.length).toBe(301);
  });

  it("returns null for empty bodies", () => {
    expect(extractProviderError("", "sk")).toBeNull();
    expect(extractProviderError("   ", "sk")).toBeNull();
  });
});

describe("isAbortError and redactSecret", () => {
  it("recognizes abort errors", () => {
    expect(isAbortError({ name: "AbortError" })).toBe(true);
    expect(isAbortError(new Error("nope"))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });

  it("redacts every occurrence", () => {
    expect(redactSecret("a sk-1 b sk-1", "sk-1")).toBe("a sk-*** b sk-***");
    expect(redactSecret("unchanged", "")).toBe("unchanged");
  });
});
