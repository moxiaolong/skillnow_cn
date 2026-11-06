"use client";

import { Square } from "lucide-react";

import { Button } from "@/components/ui/button";

export type DiscussionStatusState = {
  phase: "loading" | "collecting" | "selecting" | "speaking" | "searching";
  round: number;
  maxRounds: number;
  speakerName?: string;
  answerName?: string;
};

function roundsLabel(status: DiscussionStatusState): string {
  return Number.isFinite(status.maxRounds)
    ? `第 ${status.round}/${status.maxRounds} 轮`
    : `第 ${status.round} 轮 · 不限轮数`;
}

function statusText(status: DiscussionStatusState): string {
  switch (status.phase) {
    case "loading":
      return "正在载入参与 Skill…";
    case "collecting":
      return `${roundsLabel(status)} · 正在征询发言意愿…`;
    case "selecting":
      return status.answerName
        ? `${roundsLabel(status)} · 请 ${status.answerName} 回答用户的问题…`
        : `${roundsLabel(status)} · 主持人正在决定谁发言…`;
    case "searching":
      return `${roundsLabel(status)} · ${status.speakerName ?? "参与者"}正在搜索网页…`;
    case "speaking":
      return `${roundsLabel(status)} · ${status.speakerName ?? "参与者"}正在发言…`;
  }
}

export function DiscussionStatus({
  status,
  onStop,
}: {
  status: DiscussionStatusState | null;
  onStop: () => void;
}) {
  if (!status) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/70 px-3 py-2 text-xs text-muted"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className="size-1.5 shrink-0 animate-pulse rounded-full bg-orange"
          aria-hidden
        />
        <span className="truncate">{statusText(status)}</span>
      </span>
      {status.phase === "loading" ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onStop}
          className="h-7 shrink-0 px-2.5 text-xs"
        >
          <Square aria-hidden />
          停止讨论
        </Button>
      )}
    </div>
  );
}
