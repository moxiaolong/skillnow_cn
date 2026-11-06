export const CHAT_SETTINGS_KEY = "skillnow:chat-settings:v1";
export const CHAT_SEARCH_KEY = "skillnow:chat-search:v1";

export type ReasoningEffort = "default" | "low" | "high" | "max";

export const CONTEXT_LIMITS = [
  1_000_000,
  512_000,
  256_000,
  128_000,
  64_000,
  32_000,
] as const;

export type ContextLimit = (typeof CONTEXT_LIMITS)[number];

export type ChatSettings = {
  apiUrl: string;
  apiKey: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  contextLimit: ContextLimit;
  showReasoning: boolean;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  apiUrl: "https://api.deepseek.com",
  apiKey: "",
  model: "deepseek-flash",
  reasoningEffort: "default",
  contextLimit: 1_000_000,
  showReasoning: true,
};

export function normalizeReasoningEffort(value: unknown): ReasoningEffort {
  return value === "low" || value === "high" || value === "max"
    ? value
    : "default";
}

export function normalizeContextLimit(value: unknown): ContextLimit {
  return CONTEXT_LIMITS.includes(value as ContextLimit)
    ? (value as ContextLimit)
    : 1_000_000;
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type NormalizedEndpoint =
  | { ok: true; endpoint: string; insecure: boolean }
  | { ok: false; error: string };

export type SettingsValidation =
  | {
      ok: true;
      settings: ChatSettings;
      endpoint: string;
      insecure: boolean;
    }
  | {
      ok: false;
      field: "apiUrl" | "apiKey" | "model";
      error: string;
    };

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  );
}

/**
 * Accepts either a provider base URL or a full chat-completions endpoint and
 * returns the final URL that will be called from the browser.
 */
export function normalizeChatEndpoint(input: string): NormalizedEndpoint {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "请填写 API 地址。" };

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)
    ? raw
    : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return {
      ok: false,
      error: "API 地址格式不正确，请填写以 https:// 开头的地址。",
    };
  }

  if (url.username || url.password) {
    return { ok: false, error: "API 地址不能包含用户名或密码。" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "API 地址必须以 https:// 或 http:// 开头。" };
  }

  const insecure = url.protocol === "http:";
  if (insecure && !isLocalHostname(url.hostname)) {
    return {
      ok: false,
      error: "公网 API 地址必须使用 https://；http:// 仅允许本机地址。",
    };
  }

  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/chat/completions";
  } else {
    const pathname = url.pathname.replace(/\/+$/, "");
    url.pathname = pathname.toLowerCase().endsWith("/chat/completions")
      ? pathname
      : `${pathname}/chat/completions`;
  }

  url.hash = "";

  return { ok: true, endpoint: url.toString(), insecure };
}

/**
 * Derives the search endpoint from the chat API URL. The search API is
 * expected at `/v1/tools/search` on the same host.
 */
export function normalizeSearchEndpoint(input: string): NormalizedEndpoint {
  const chatEndpoint = normalizeChatEndpoint(input);
  if (!chatEndpoint.ok) return chatEndpoint;

  const url = new URL(chatEndpoint.endpoint);
  let pathname = url.pathname.replace(/\/+$/, "");

  if (pathname.toLowerCase().endsWith("/chat/completions")) {
    pathname = pathname.slice(0, -"/chat/completions".length);
  }

  if (pathname.toLowerCase().endsWith("/tools/search")) {
    // Already a search endpoint.
  } else if (pathname.toLowerCase().endsWith("/v1")) {
    pathname = `${pathname}/tools/search`;
  } else {
    pathname = `${pathname}/v1/tools/search`;
  }

  url.pathname = pathname || "/v1/tools/search";
  url.search = "";
  url.hash = "";

  return {
    ok: true,
    endpoint: url.toString(),
    insecure: chatEndpoint.insecure,
  };
}

export function validateChatSettings(input: ChatSettings): SettingsValidation {
  const normalized = normalizeChatEndpoint(input.apiUrl);
  if (!normalized.ok) {
    return { ok: false, field: "apiUrl", error: normalized.error };
  }

  const apiKey = input.apiKey.trim();
  if (!apiKey) {
    return { ok: false, field: "apiKey", error: "请填写 API Key。" };
  }

  const model = input.model.trim();
  if (!model) {
    return { ok: false, field: "model", error: "请填写模型名称。" };
  }

  return {
    ok: true,
    settings: {
      apiUrl: input.apiUrl.trim(),
      apiKey,
      model,
      reasoningEffort: normalizeReasoningEffort(input.reasoningEffort),
      contextLimit: normalizeContextLimit(input.contextLimit),
      showReasoning: input.showReasoning !== false,
    },
    endpoint: normalized.endpoint,
    insecure: normalized.insecure,
  };
}

export function readChatSettings(
  storage: StorageLike | null = getDefaultStorage(),
): ChatSettings | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(CHAT_SETTINGS_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const record = parsed as Record<string, unknown>;
    if (record.version !== 1) return null;
    if (
      typeof record.apiUrl !== "string" ||
      typeof record.apiKey !== "string" ||
      typeof record.model !== "string"
    ) {
      return null;
    }

    return {
      apiUrl: record.apiUrl.trim(),
      apiKey: record.apiKey.trim(),
      model: record.model.trim(),
      reasoningEffort: normalizeReasoningEffort(record.reasoningEffort),
      contextLimit: normalizeContextLimit(record.contextLimit),
      showReasoning: record.showReasoning !== false,
    };
  } catch {
    return null;
  }
}

export function saveChatSettings(
  settings: ChatSettings,
  storage: StorageLike | null = getDefaultStorage(),
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(
      CHAT_SETTINGS_KEY,
      JSON.stringify({
        version: 1,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        reasoningEffort: settings.reasoningEffort,
        contextLimit: settings.contextLimit,
        showReasoning: settings.showReasoning !== false,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearChatSettings(
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;

  try {
    storage.removeItem(CHAT_SETTINGS_KEY);
  } catch {
    // Storage can fail in private mode; the UI keeps working for this session.
  }
}

export function readChatSearch(
  storage: StorageLike | null = getDefaultStorage(),
): boolean {
  if (!storage) return true;

  try {
    return storage.getItem(CHAT_SEARCH_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveChatSearch(
  enabled: boolean,
  storage: StorageLike | null = getDefaultStorage(),
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(CHAT_SEARCH_KEY, enabled ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}
