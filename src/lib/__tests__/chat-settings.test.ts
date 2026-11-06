import { describe, expect, it } from "vitest";

import {
  CHAT_SETTINGS_KEY,
  DEFAULT_CHAT_SETTINGS,
  clearChatSettings,
  normalizeChatEndpoint,
  normalizeSearchEndpoint,
  readChatSearch,
  readChatSettings,
  saveChatSearch,
  saveChatSettings,
  validateChatSettings,
  type StorageLike,
} from "@/lib/chat-settings";

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

describe("normalizeChatEndpoint", () => {
  it.each([
    [
      "https://api.deepseek.com",
      "https://api.deepseek.com/chat/completions",
    ],
    [
      "https://api.deepseek.com/",
      "https://api.deepseek.com/chat/completions",
    ],
    [
      "https://api.deepseek.com/v1",
      "https://api.deepseek.com/v1/chat/completions",
    ],
    [
      "https://api.deepseek.com/v1/chat/completions",
      "https://api.deepseek.com/v1/chat/completions",
    ],
    [
      "api.deepseek.com",
      "https://api.deepseek.com/chat/completions",
    ],
    [
      "https://example.com/v1?api-version=1",
      "https://example.com/v1/chat/completions?api-version=1",
    ],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeChatEndpoint(input)).toEqual({
      ok: true,
      endpoint: expected,
      insecure: false,
    });
  });

  it("allows local http and flags it as insecure", () => {
    expect(normalizeChatEndpoint("http://localhost:8787")).toEqual({
      ok: true,
      endpoint: "http://localhost:8787/chat/completions",
      insecure: true,
    });
    expect(normalizeChatEndpoint("http://127.0.0.1:11434").ok).toBe(true);
    expect(normalizeChatEndpoint("http://[::1]:8080").ok).toBe(true);
  });

  it.each([
    "http://example.com",
    "ftp://example.com",
    "https://user:pass@example.com",
    "",
    "   ",
    "https://",
  ])("rejects %s", (input) => {
    expect(normalizeChatEndpoint(input).ok).toBe(false);
  });
});

describe("DEFAULT_CHAT_SETTINGS", () => {
  it("uses the current DeepSeek default model", () => {
    expect(DEFAULT_CHAT_SETTINGS.model).toBe("deepseek-flash");
    expect(DEFAULT_CHAT_SETTINGS.reasoningEffort).toBe("default");
    expect(DEFAULT_CHAT_SETTINGS.contextLimit).toBe(1_000_000);
  });
});

describe("normalizeSearchEndpoint", () => {
  it.each([
    [
      "https://api.deepseek.com",
      "https://api.deepseek.com/v1/tools/search",
    ],
    [
      "https://api.deepseek.com/",
      "https://api.deepseek.com/v1/tools/search",
    ],
    [
      "https://api.deepseek.com/v1",
      "https://api.deepseek.com/v1/tools/search",
    ],
    [
      "https://api.deepseek.com/v1/chat/completions",
      "https://api.deepseek.com/v1/tools/search",
    ],
    [
      "https://example.com/proxy",
      "https://example.com/proxy/v1/tools/search",
    ],
  ])("derives the search endpoint from %s", (input, expected) => {
    expect(normalizeSearchEndpoint(input)).toEqual({
      ok: true,
      endpoint: expected,
      insecure: false,
    });
  });

  it("allows local http and flags it as insecure", () => {
    expect(normalizeSearchEndpoint("http://127.0.0.1:8787")).toEqual({
      ok: true,
      endpoint: "http://127.0.0.1:8787/v1/tools/search",
      insecure: true,
    });
  });

  it("rejects invalid API URLs", () => {
    expect(normalizeSearchEndpoint("http://example.com").ok).toBe(false);
    expect(normalizeSearchEndpoint("ftp://example.com").ok).toBe(false);
  });
});

describe("chat search preference", () => {
  it("defaults to on", () => {
    expect(readChatSearch(new MemoryStorage())).toBe(true);
  });

  it("persists off and on", () => {
    const storage = new MemoryStorage();

    expect(saveChatSearch(false, storage)).toBe(true);
    expect(readChatSearch(storage)).toBe(false);

    expect(saveChatSearch(true, storage)).toBe(true);
    expect(readChatSearch(storage)).toBe(true);
  });

  it("defaults to on when storage throws", () => {
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

    expect(readChatSearch(throwing)).toBe(true);
    expect(saveChatSearch(false, throwing)).toBe(false);
  });
});

describe("validateChatSettings", () => {
  it("trims valid settings and returns the endpoint", () => {
    const result = validateChatSettings({
      apiUrl: " https://api.deepseek.com ",
      apiKey: " sk-abc ",
      model: " deepseek-flash ",
      reasoningEffort: "max",
      contextLimit: 128_000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.settings).toEqual({
        apiUrl: "https://api.deepseek.com",
        apiKey: "sk-abc",
        model: "deepseek-flash",
        reasoningEffort: "max",
        contextLimit: 128_000,
      });
      expect(result.endpoint).toBe(
        "https://api.deepseek.com/chat/completions",
      );
      expect(result.insecure).toBe(false);
    }
  });

  it("reports the first invalid field", () => {
    expect(
      validateChatSettings({ ...DEFAULT_CHAT_SETTINGS, apiUrl: "http://x.com" }),
    ).toMatchObject({ ok: false, field: "apiUrl" });

    expect(
      validateChatSettings({ ...DEFAULT_CHAT_SETTINGS, apiKey: " " }),
    ).toMatchObject({ ok: false, field: "apiKey" });

    expect(
      validateChatSettings({
        ...DEFAULT_CHAT_SETTINGS,
        apiKey: "sk-abc",
        model: " ",
      }),
    ).toMatchObject({ ok: false, field: "model" });
  });
});

describe("chat settings storage", () => {
  it("round-trips settings", () => {
    const storage = new MemoryStorage();
    const settings = {
      apiUrl: "https://api.deepseek.com",
      apiKey: "sk-abc",
      model: "deepseek-flash",
      reasoningEffort: "low" as const,
      contextLimit: 128_000 as const,
    };

    expect(saveChatSettings(settings, storage)).toBe(true);
    expect(readChatSettings(storage)).toEqual(settings);
  });

  it("defaults missing or invalid reasoning effort", () => {
    const storage = new MemoryStorage();

    storage.setItem(
      CHAT_SETTINGS_KEY,
      JSON.stringify({
        version: 1,
        apiUrl: "https://api.deepseek.com",
        apiKey: "sk-abc",
        model: "m",
      }),
    );
    expect(readChatSettings(storage)).toEqual({
      apiUrl: "https://api.deepseek.com",
      apiKey: "sk-abc",
      model: "m",
      reasoningEffort: "default",
      contextLimit: 1_000_000,
    });

    storage.setItem(
      CHAT_SETTINGS_KEY,
      JSON.stringify({
        version: 1,
        apiUrl: "https://api.deepseek.com",
        apiKey: "sk-abc",
        model: "m",
        reasoningEffort: "weird",
        contextLimit: 12_345,
      }),
    );
    expect(readChatSettings(storage)).toEqual({
      apiUrl: "https://api.deepseek.com",
      apiKey: "sk-abc",
      model: "m",
      reasoningEffort: "default",
      contextLimit: 1_000_000,
    });
  });

  it("returns null for missing, corrupt or incompatible data", () => {
    const storage = new MemoryStorage();
    expect(readChatSettings(storage)).toBeNull();

    storage.setItem(CHAT_SETTINGS_KEY, "not json");
    expect(readChatSettings(storage)).toBeNull();

    storage.setItem(
      CHAT_SETTINGS_KEY,
      JSON.stringify({ version: 2, apiUrl: "a", apiKey: "b", model: "c" }),
    );
    expect(readChatSettings(storage)).toBeNull();

    storage.setItem(
      CHAT_SETTINGS_KEY,
      JSON.stringify({ version: 1, apiUrl: 1, apiKey: "b", model: "c" }),
    );
    expect(readChatSettings(storage)).toBeNull();
  });

  it("clears stored settings", () => {
    const storage = new MemoryStorage();
    saveChatSettings(
      {
        apiUrl: "https://api.deepseek.com",
        apiKey: "sk-abc",
        model: "m",
        reasoningEffort: "high",
        contextLimit: 64_000,
      },
      storage,
    );

    clearChatSettings(storage);
    expect(readChatSettings(storage)).toBeNull();
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

    expect(readChatSettings(throwing)).toBeNull();
    expect(
      saveChatSettings(
        {
          apiUrl: "https://api.deepseek.com",
          apiKey: "sk",
          model: "m",
          reasoningEffort: "high",
          contextLimit: 64_000,
        },
        throwing,
      ),
    ).toBe(false);
    expect(() => clearChatSettings(throwing)).not.toThrow();
  });
});
