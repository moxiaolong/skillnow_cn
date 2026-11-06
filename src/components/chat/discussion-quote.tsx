"use client";

import type { ChatQuote } from "@/lib/chat-history";

export function DiscussionQuote({
  quote,
  onJump,
}: {
  quote: ChatQuote;
  onJump?: (messageId: string) => void;
}) {
  function jumpToMessage() {
    if (onJump) {
      onJump(quote.messageId);
      return;
    }
    const target = document.getElementById(`chat-message-${quote.messageId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <button
      type="button"
      onClick={jumpToMessage}
      aria-label={`查看 ${quote.speakerName} 被引用的消息`}
      className="mb-2 block w-full rounded-md border-l-2 border-orange/50 bg-surface px-2.5 py-1.5 text-left text-xs leading-5 text-muted transition-colors hover:bg-orange-soft/40"
    >
      <span className="font-medium text-ink/70">{quote.speakerName}：</span>
      <span className="line-clamp-2">{quote.text}</span>
    </button>
  );
}
