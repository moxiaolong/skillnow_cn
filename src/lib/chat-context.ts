import type { ChatMessage } from "@/lib/chat-history";

export const AUTO_COMPRESS_RATIO = 0.8;
export const KEEP_RECENT_MESSAGES = 6;

const CJK_PATTERN = /[㐀-䶿一-鿿豈-﫿]/g;

/**
 * Rough token estimate: one token per CJK character and one token per four
 * other characters. This is intentionally provider-agnostic; the UI labels it
 * as an estimate.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  const cjk = text.match(CJK_PATTERN)?.length ?? 0;
  const other = Math.max(0, text.length - cjk);
  return Math.ceil(cjk + other / 4);
}

export function estimateChatContextTokens(
  messages: ChatMessage[],
  systemPrompt: string,
  input = "",
): number {
  let total = estimateTokens(systemPrompt) + estimateTokens(input);

  for (const message of messages) {
    total += 4;
    total += estimateTokens(message.content);
    if (message.reasoning) {
      total += estimateTokens(message.reasoning);
    }
  }

  return total;
}

export function formatContextTokens(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    return thousands >= 10 || Number.isInteger(thousands)
      ? `${Math.round(thousands)}K`
      : `${thousands.toFixed(1)}K`;
  }

  return String(value);
}
