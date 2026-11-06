import { describe, expect, it } from "vitest";

import {
  estimateChatContextTokens,
  estimateTokens,
  formatContextTokens,
} from "@/lib/chat-context";
import type { ChatMessage } from "@/lib/chat-history";

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "m1",
    role: "user",
    content: "",
    status: "complete",
    createdAt: 1,
    ...overrides,
  };
}

describe("estimateTokens", () => {
  it("estimates CJK and latin text", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("你好")).toBe(2);
    expect(estimateTokens("hello world")).toBe(3);
  });
});

describe("estimateChatContextTokens", () => {
  it("includes the system prompt, input, messages, and reasoning", () => {
    expect(
      estimateChatContextTokens([message({ content: "你好" })], "sys", "hi"),
    ).toBe(8);

    expect(
      estimateChatContextTokens(
        [
          message({
            role: "assistant",
            content: "你好",
            reasoning: "abcde",
          }),
        ],
        "",
      ),
    ).toBe(8);
  });
});

describe("formatContextTokens", () => {
  it("formats token counts", () => {
    expect(formatContextTokens(1_000_000)).toBe("1M");
    expect(formatContextTokens(512_000)).toBe("512K");
    expect(formatContextTokens(32_000)).toBe("32K");
    expect(formatContextTokens(1_500)).toBe("1.5K");
    expect(formatContextTokens(999)).toBe("999");
  });
});
