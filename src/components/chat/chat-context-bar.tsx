"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/chat-history";
import {
  KEEP_RECENT_MESSAGES,
  estimateChatContextTokens,
  formatContextTokens,
} from "@/lib/chat-context";
import { cn } from "@/lib/utils";

type ChatContextBarProps = {
  messages: ChatMessage[];
  input: string;
  systemPrompt: string;
  contextLimit: number;
  compressing: boolean;
  disabled: boolean;
  onCompress: () => void;
  onOpenSettings: () => void;
};

function ContextRing({ percent }: { percent: number }) {
  const radius = 8.5;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);
  const high = clamped >= 80;

  return (
    <svg viewBox="0 0 24 24" className="size-5 -rotate-90" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-line"
      />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={high ? "text-orange-strong" : "text-orange"}
      />
    </svg>
  );
}

export function ChatContextBar({
  messages,
  input,
  systemPrompt,
  contextLimit,
  compressing,
  disabled,
  onCompress,
  onOpenSettings,
}: ChatContextBarProps) {
  const [open, setOpen] = useState(false);

  const used = estimateChatContextTokens(messages, systemPrompt, input);
  const rawPercent = contextLimit > 0 ? (used / contextLimit) * 100 : 0;
  const percent = Math.round(rawPercent);
  const displayPercent = used > 0 && rawPercent < 1 ? "<1" : String(percent);
  const hasSummary = messages.some((message) => message.kind === "summary");
  const canCompress = messages.length > KEEP_RECENT_MESSAGES + 1;

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="chat-context-panel"
        aria-label={`上下文占用约 ${displayPercent}%，点击展开`}
        className="flex w-full items-center justify-between gap-3 px-4 py-1.5 text-left"
      >
        <span className="flex items-center gap-2 text-[11px] text-muted">
          <ContextRing percent={rawPercent} />
          上下文 {displayPercent}%
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id="chat-context-panel"
          className="border-t border-line bg-surface px-4 py-3 text-xs leading-5 text-muted"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              已用约 {formatContextTokens(used)} /{" "}
              {formatContextTokens(contextLimit)} tokens
            </span>
            <span>{displayPercent}%</span>
          </div>
          <p className="mt-1.5">
            按字符估算，实际以模型平台为准。达到 80% 且消息足够多时，会自动压缩早期对话。
          </p>
          {hasSummary ? (
            <p className="mt-1">早期对话已压缩为摘要。</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCompress}
              disabled={!canCompress || compressing || disabled}
            >
              {compressing ? "正在压缩…" : "压缩上下文"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onOpenSettings}
            >
              调整上限
            </Button>
            <span className="text-[11px]">
              {!canCompress
                ? `至少 ${KEEP_RECENT_MESSAGES + 2} 条消息后可压缩。`
                : "压缩会调用一次模型生成摘要。"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
