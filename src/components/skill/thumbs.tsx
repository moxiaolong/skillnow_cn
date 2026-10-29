"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

import { useReactions } from "@/components/skill/reactions-context";
import { track } from "@/lib/analytics";
import { upRatio } from "@/lib/reactions";
import { cn } from "@/lib/utils";

export function Thumbs({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const { getCount, vote, voted, offline, loading } = useReactions();
  const { up, down } = getCount(slug);
  const total = up + down;
  const ratio = upRatio(up, down);
  const myVote = voted[slug];

  function handleVote(action: "up" | "down") {
    track("skill_vote", { slug, action });
    void vote(slug, action);
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={Boolean(myVote)}
          aria-pressed={myVote === "up"}
          onClick={() => handleVote("up")}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors disabled:cursor-default",
            myVote === "up"
              ? "border-orange bg-orange-soft text-orange-strong"
              : "border-line text-muted hover:border-orange hover:text-orange-strong",
            myVote && myVote !== "up" ? "opacity-45" : "",
          )}
        >
          <ThumbsUp className="size-3.5" aria-hidden />
          有用{up > 0 ? ` ${up}` : ""}
        </button>
        <button
          type="button"
          disabled={Boolean(myVote)}
          aria-pressed={myVote === "down"}
          onClick={() => handleVote("down")}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors disabled:cursor-default",
            myVote === "down"
              ? "border-orange bg-orange-soft text-orange-strong"
              : "border-line text-muted hover:border-orange hover:text-orange-strong",
            myVote && myVote !== "down" ? "opacity-45" : "",
          )}
        >
          <ThumbsDown className="size-3.5" aria-hidden />
          没用{down > 0 ? ` ${down}` : ""}
        </button>
        {myVote ? (
          <span className="text-xs text-muted">今天已投</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {total > 0 ? (
          <>
            <span className="h-1 w-36 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-orange"
                style={{ width: `${ratio}%` }}
              />
            </span>
            <span className="text-xs text-muted">
              {ratio}% 有用
            </span>
          </>
        ) : (
          <span className="text-xs text-muted">
            {loading ? "正在读取评价…" : "暂无评价"}
          </span>
        )}
      </div>

      {offline ? (
        <p className="text-xs text-muted">网络异常，仅保存在本地。</p>
      ) : null}
    </div>
  );
}
