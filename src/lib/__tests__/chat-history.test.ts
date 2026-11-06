import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHAT_HISTORY_KEY,
  MAX_CHARS_PER_CONVERSATION,
  MAX_CONVERSATIONS,
  MAX_MESSAGES_PER_CONVERSATION,
  chatContextKey,
  clearConversation,
  readChatHistory,
  readConversation,
  trimMessages,
  writeConversation,
  type ChatMessage,
  type ChatRole,
} from "@/lib/chat-history";
import type { StorageLike } from "@/lib/chat-settings";

class MemoryStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

let sequence = 0;

function message(
  role: ChatRole,
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

beforeEach(() => {
  sequence = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("chatContextKey", () => {
  it("separates general and skill conversations", () => {
    expect(chatContextKey(null)).toBe("general");
    expect(chatContextKey("sigmund-freud")).toBe("skill:sigmund-freud");
  });
});

describe("trimMessages", () => {
  it("drops empty streaming placeholders", () => {
    const trimmed = trimMessages([
      message("user", "你好"),
      message("assistant", "", { status: "streaming" }),
    ]);

    expect(trimmed.map((item) => item.content)).toEqual(["你好"]);
  });

  it("keeps partial streaming content as stopped", () => {
    const trimmed = trimMessages([
      message("assistant", "生成到一半", { status: "streaming" }),
    ]);

    expect(trimmed).toHaveLength(1);
    expect(trimmed[0].status).toBe("stopped");
  });

  it("keeps reasoning-only partials", () => {
    const trimmed = trimMessages([
      message("assistant", "", {
        status: "streaming",
        reasoning: "正在思考",
      }),
    ]);

    expect(trimmed).toHaveLength(1);
    expect(trimmed[0].status).toBe("stopped");
    expect(trimmed[0].reasoning).toBe("正在思考");
  });

  it("caps the message count from the newest end", () => {
    const messages = Array.from({ length: 70 }, (_, index) =>
      message("user", `m${index}`),
    );

    const trimmed = trimMessages(messages);

    expect(trimmed).toHaveLength(MAX_MESSAGES_PER_CONVERSATION);
    expect(trimmed[0].content).toBe("m10");
    expect(trimmed[trimmed.length - 1].content).toBe("m69");
  });

  it("caps characters from the newest end", () => {
    const big = "x".repeat(50_000);
    const trimmed = trimMessages([
      message("user", big),
      message("assistant", big),
      message("user", big),
    ]);

    expect(trimmed).toHaveLength(2);
    expect(
      trimmed.reduce(
        (total, item) =>
          total + item.content.length + (item.reasoning?.length ?? 0),
        0,
      ),
    ).toBeLessThanOrEqual(MAX_CHARS_PER_CONVERSATION);
  });

  it("always keeps the newest message even when oversized", () => {
    const trimmed = trimMessages([
      message("user", "x".repeat(MAX_CHARS_PER_CONVERSATION + 1)),
    ]);

    expect(trimmed).toHaveLength(1);
  });
});

describe("readChatHistory", () => {
  it("returns an empty store for missing or corrupt data", () => {
    const storage = new MemoryStorage();
    expect(readChatHistory(storage)).toEqual({ version: 1, conversations: {} });

    storage.setItem(CHAT_HISTORY_KEY, "not json");
    expect(readChatHistory(storage)).toEqual({ version: 1, conversations: {} });

    storage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify({ version: 2, conversations: {} }),
    );
    expect(readChatHistory(storage)).toEqual({ version: 1, conversations: {} });
  });

  it("filters invalid messages and keeps valid conversations", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify({
        version: 1,
        conversations: {
          general: {
            updatedAt: 1,
            messages: [
              {
                id: "ok",
                role: "user",
                content: "有效",
                status: "complete",
                createdAt: 1,
              },
              { id: "bad-role", role: "system", content: "x", createdAt: 1 },
              { id: "bad-content", role: "user", content: "", createdAt: 1 },
            ],
          },
          empty: { updatedAt: 0, messages: [] },
        },
      }),
    );

    const store = readChatHistory(storage);

    expect(Object.keys(store.conversations)).toEqual(["general"]);
    expect(store.conversations.general.messages).toHaveLength(1);
  });

  it("fails gracefully when storage throws", () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readChatHistory(throwing)).toEqual({ version: 1, conversations: {} });
  });

  it("filters unsafe source URLs and keeps valid ones", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify({
        version: 1,
        conversations: {
          general: {
            updatedAt: 1,
            messages: [
              {
                id: "a",
                role: "assistant",
                content: "答案",
                status: "complete",
                createdAt: 1,
                sources: [
                  { title: "bad", url: "javascript:alert(1)" },
                  { title: "ok", url: "https://example.com/a" },
                ],
              },
            ],
          },
        },
      }),
    );

    expect(readConversation("general", storage)[0].sources).toEqual([
      { title: "ok", url: "https://example.com/a" },
    ]);
  });
});

describe("conversation persistence", () => {
  it("persists and restores search sources", () => {
    const storage = new MemoryStorage();
    const withSources = message("assistant", "答案", {
      sources: [
        {
          title: "来源",
          url: "https://example.com/a",
          snippet: "摘要",
          siteName: "Example",
        },
      ],
    });

    expect(writeConversation("general", [withSources], storage)).toBe(true);

    expect(readConversation("general", storage)[0].sources).toEqual([
      {
        title: "来源",
        url: "https://example.com/a",
        snippet: "摘要",
        siteName: "Example",
      },
    ]);
  });

  it("persists summary messages", () => {
    const storage = new MemoryStorage();
    const summary = message("assistant", "早期摘要内容", { kind: "summary" });

    expect(writeConversation("general", [summary], storage)).toBe(true);
    expect(readConversation("general", storage)[0].kind).toBe("summary");
  });

  it("keeps contexts isolated and clears one at a time", () => {
    const storage = new MemoryStorage();

    expect(
      writeConversation("general", [message("user", "通用")], storage),
    ).toBe(true);
    expect(
      writeConversation("skill:freud", [message("user", "弗洛伊德")], storage),
    ).toBe(true);

    expect(
      readConversation("general", storage).map((item) => item.content),
    ).toEqual(["通用"]);
    expect(
      readConversation("skill:freud", storage).map((item) => item.content),
    ).toEqual(["弗洛伊德"]);

    clearConversation("general", storage);

    expect(readConversation("general", storage)).toEqual([]);
    expect(readConversation("skill:freud", storage)).toHaveLength(1);
  });

  it("removes the storage key when the last conversation is cleared", () => {
    const storage = new MemoryStorage();
    writeConversation("general", [message("user", "hi")], storage);
    expect(storage.getItem(CHAT_HISTORY_KEY)).not.toBeNull();

    clearConversation("general", storage);
    expect(storage.getItem(CHAT_HISTORY_KEY)).toBeNull();
  });

  it("prunes the oldest conversations", () => {
    vi.useFakeTimers();
    const storage = new MemoryStorage();

    for (let index = 0; index < MAX_CONVERSATIONS + 2; index += 1) {
      vi.setSystemTime(new Date(2026, 0, 1, 0, 0, index));
      writeConversation(
        `ctx-${index}`,
        [message("user", `m${index}`)],
        storage,
      );
    }

    const store = readChatHistory(storage);

    expect(Object.keys(store.conversations)).toHaveLength(MAX_CONVERSATIONS);
    expect(store.conversations["ctx-0"]).toBeUndefined();
    expect(store.conversations["ctx-1"]).toBeUndefined();
    expect(store.conversations[`ctx-${MAX_CONVERSATIONS + 1}`]).toBeDefined();
  });

  it("fails gracefully when storage throws", () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(
      writeConversation("general", [message("user", "hi")], throwing),
    ).toBe(false);
    expect(() => clearConversation("general", throwing)).not.toThrow();
  });
});
