import type { StorageLike } from "@/lib/chat-settings";
import {
  MAX_SOURCE_COUNT,
  safeHttpUrl,
  type ChatSource,
} from "@/lib/chat-search";

export type ChatRole = "user" | "assistant";
export type ChatStatus = "streaming" | "complete" | "stopped" | "error";
export type ChatKind = "summary" | "discussion-note";

export type ChatSpeaker = {
  slug: string;
  name: string;
};

export type ChatQuote = {
  messageId: string;
  speakerName: string;
  text: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  reasoning?: string;
  sources?: ChatSource[];
  kind?: ChatKind;
  speaker?: ChatSpeaker;
  round?: number;
  replyToId?: string;
  quote?: ChatQuote;
  interjection?: boolean;
  status: ChatStatus;
  createdAt: number;
};

export type StoredChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  reasoning?: string;
  sources?: ChatSource[];
  kind?: ChatKind;
  speaker?: ChatSpeaker;
  round?: number;
  replyToId?: string;
  quote?: ChatQuote;
  interjection?: boolean;
  status: Exclude<ChatStatus, "streaming">;
  createdAt: number;
};

export type StoredConversation = {
  messages: StoredChatMessage[];
  updatedAt: number;
};

export type ChatHistoryStore = {
  version: 1;
  conversations: Record<string, StoredConversation>;
};

export const CHAT_HISTORY_KEY = "skillnow:chat-history:v1";
export const MAX_MESSAGES_PER_CONVERSATION = 60;
export const MAX_CHARS_PER_CONVERSATION = 120_000;
export const MAX_CONVERSATIONS = 10;

export function chatContextKey(skillSlug: string | null): string {
  return skillSlug ? `skill:${skillSlug}` : "general";
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function emptyStore(): ChatHistoryStore {
  return { version: 1, conversations: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredStatus(value: unknown): value is StoredChatMessage["status"] {
  return value === "complete" || value === "stopped" || value === "error";
}

function parseChatSources(value: unknown): ChatSource[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const sources: ChatSource[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) continue;

    const title = typeof item.title === "string" ? item.title.trim() : "";
    const url = typeof item.url === "string" ? safeHttpUrl(item.url) : null;
    if (!title || !url || seen.has(url)) continue;

    seen.add(url);
    sources.push({
      title: title.slice(0, 300),
      url,
      ...(typeof item.snippet === "string" && item.snippet.trim()
        ? { snippet: item.snippet.trim().slice(0, 500) }
        : {}),
      ...(typeof item.siteName === "string" && item.siteName.trim()
        ? { siteName: item.siteName.trim().slice(0, 100) }
        : {}),
      ...(typeof item.date === "string" && item.date.trim()
        ? { date: item.date.trim().slice(0, 40) }
        : {}),
    });

    if (sources.length >= MAX_SOURCE_COUNT) break;
  }

  return sources.length > 0 ? sources : undefined;
}

function parseChatSpeaker(value: unknown): ChatSpeaker | undefined {
  if (!isRecord(value)) return undefined;
  const slug = typeof value.slug === "string" ? value.slug.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!slug || !name) return undefined;
  return {
    slug: slug.slice(0, 100),
    name: name.slice(0, 100),
  };
}

function parseChatQuote(value: unknown): ChatQuote | undefined {
  if (!isRecord(value)) return undefined;
  const messageId =
    typeof value.messageId === "string" ? value.messageId.trim() : "";
  const speakerName =
    typeof value.speakerName === "string" ? value.speakerName.trim() : "";
  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!messageId || !speakerName || !text) return undefined;
  return {
    messageId: messageId.slice(0, 200),
    speakerName: speakerName.slice(0, 100),
    text: text.slice(0, 300),
  };
}

function parseChatKind(value: unknown): ChatKind | undefined {
  return value === "summary" || value === "discussion-note"
    ? value
    : undefined;
}

function parseRound(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= 999
    ? value
    : undefined;
}

function parseStoredMessage(value: unknown): StoredChatMessage | null {
  if (!isRecord(value)) return null;

  const { id, role, content, reasoning, status, createdAt } = value;
  if (typeof id !== "string" || id.length === 0) return null;
  if (role !== "user" && role !== "assistant") return null;
  if (typeof content !== "string") return null;

  const sources = parseChatSources(value.sources);
  const kind = parseChatKind(value.kind);
  const speaker = parseChatSpeaker(value.speaker);
  const round = parseRound(value.round);
  const replyToId =
    typeof value.replyToId === "string" && value.replyToId.trim()
      ? value.replyToId.trim().slice(0, 200)
      : undefined;
  const quote = parseChatQuote(value.quote);
  const interjection = value.interjection === true ? true : undefined;
  if (
    content.trim().length === 0 &&
    (typeof reasoning !== "string" || reasoning.trim().length === 0) &&
    !sources
  ) {
    return null;
  }
  if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) return null;

  return {
    id,
    role,
    content,
    ...(typeof reasoning === "string" && reasoning.length > 0
      ? { reasoning }
      : {}),
    ...(sources ? { sources } : {}),
    ...(kind ? { kind } : {}),
    ...(speaker ? { speaker } : {}),
    ...(round ? { round } : {}),
    ...(replyToId ? { replyToId } : {}),
    ...(quote ? { quote } : {}),
    ...(interjection ? { interjection } : {}),
    status: isStoredStatus(status) ? status : "complete",
    createdAt,
  };
}

export function readChatHistory(
  storage: StorageLike | null = getDefaultStorage(),
): ChatHistoryStore {
  if (!storage) return emptyStore();

  try {
    const raw = storage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return emptyStore();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return emptyStore();
    if (!isRecord(parsed.conversations)) return emptyStore();

    const conversations: Record<string, StoredConversation> = {};

    for (const [key, value] of Object.entries(parsed.conversations)) {
      if (!isRecord(value) || !Array.isArray(value.messages)) continue;

      const messages = value.messages
        .map(parseStoredMessage)
        .filter((message): message is StoredChatMessage => message !== null);

      if (messages.length === 0) continue;

      conversations[key] = {
        messages,
        updatedAt:
          typeof value.updatedAt === "number" &&
          Number.isFinite(value.updatedAt)
            ? value.updatedAt
            : 0,
      };
    }

    return { version: 1, conversations };
  } catch {
    return emptyStore();
  }
}

export function readConversation(
  contextKey: string,
  storage: StorageLike | null = getDefaultStorage(),
): ChatMessage[] {
  const conversation = readChatHistory(storage).conversations[contextKey];
  if (!conversation) return [];
  return conversation.messages.map((message) => ({
    ...message,
    ...(message.sources
      ? { sources: message.sources.map((source) => ({ ...source })) }
      : {}),
    ...(message.quote ? { quote: { ...message.quote } } : {}),
  }));
}

/**
 * Drops empty placeholders and trims the oldest messages until both the count
 * and character budgets fit. The newest message is always kept.
 */
export function trimMessages(messages: ChatMessage[]): StoredChatMessage[] {
  const persistable: StoredChatMessage[] = [];

  for (const message of messages) {
    const reasoning =
      typeof message.reasoning === "string" && message.reasoning.length > 0
        ? message.reasoning
        : undefined;
    const sources = message.sources?.length ? message.sources : undefined;
    const kind = parseChatKind(message.kind);
    const quote = parseChatQuote(message.quote);
    const speaker = parseChatSpeaker(message.speaker);
    const round = parseRound(message.round);
    const replyToId =
      typeof message.replyToId === "string" && message.replyToId.trim()
        ? message.replyToId.trim().slice(0, 200)
        : undefined;

    if (message.content.trim().length === 0 && !reasoning && !sources) {
      continue;
    }
    if (
      message.status === "error" &&
      message.content.trim().length === 0 &&
      !sources
    ) {
      continue;
    }

    persistable.push({
      id: message.id,
      role: message.role,
      content: message.content,
      ...(reasoning ? { reasoning } : {}),
      ...(sources ? { sources } : {}),
      ...(kind ? { kind } : {}),
      ...(speaker ? { speaker } : {}),
      ...(round ? { round } : {}),
      ...(replyToId ? { replyToId } : {}),
      ...(quote ? { quote } : {}),
      ...(message.interjection === true ? { interjection: true } : {}),
      status: message.status === "streaming" ? "stopped" : message.status,
      createdAt: message.createdAt,
    });
  }

  const byCount = persistable.slice(-MAX_MESSAGES_PER_CONVERSATION);
  const kept: StoredChatMessage[] = [];
  let chars = 0;

  for (let index = byCount.length - 1; index >= 0; index -= 1) {
    const message = byCount[index];
    const sourceChars =
      message.sources?.reduce(
        (total, source) =>
          total + source.title.length + (source.snippet?.length ?? 0),
        0,
      ) ?? 0;
    const length =
      message.content.length +
      (message.reasoning?.length ?? 0) +
      (message.quote?.text.length ?? 0) +
      sourceChars;

    if (kept.length > 0 && chars + length > MAX_CHARS_PER_CONVERSATION) break;

    kept.unshift(message);
    chars += length;
  }

  return kept;
}

function pruneConversations(store: ChatHistoryStore, currentKey: string): void {
  const entries = Object.entries(store.conversations).sort(
    (a, b) => b[1].updatedAt - a[1].updatedAt,
  );

  if (entries.length <= MAX_CONVERSATIONS) return;

  const keep = new Set(
    entries.slice(0, MAX_CONVERSATIONS).map(([key]) => key),
  );
  keep.add(currentKey);

  for (const key of Object.keys(store.conversations)) {
    if (!keep.has(key)) delete store.conversations[key];
  }
}

export function writeConversation(
  contextKey: string,
  messages: ChatMessage[],
  storage: StorageLike | null = getDefaultStorage(),
): boolean {
  if (!storage) return false;

  try {
    const store = readChatHistory(storage);
    const trimmed = trimMessages(messages);

    if (trimmed.length === 0) {
      delete store.conversations[contextKey];
    } else {
      store.conversations[contextKey] = {
        messages: trimmed,
        updatedAt: Date.now(),
      };
    }

    pruneConversations(store, contextKey);

    if (Object.keys(store.conversations).length === 0) {
      storage.removeItem(CHAT_HISTORY_KEY);
    } else {
      storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(store));
    }

    return true;
  } catch {
    return false;
  }
}

export function clearConversation(
  contextKey: string,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;

  try {
    const store = readChatHistory(storage);
    if (!store.conversations[contextKey]) return;

    delete store.conversations[contextKey];

    if (Object.keys(store.conversations).length === 0) {
      storage.removeItem(CHAT_HISTORY_KEY);
    } else {
      storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(store));
    }
  } catch {
    // Storage failures only affect persistence, not the live conversation.
  }
}
