"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

import { useReactions } from "@/components/skill/reactions-context";

export function ReactionBadge({ slug }: { slug: string }) {
  const { getCount, loading } = useReactions();
  const { up, down } = getCount(slug);

  if (loading) {
    return null;
  }

  if (up + down === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-2.5 text-xs text-muted">
      <span className="inline-flex items-center gap-1">
        <ThumbsUp className="size-3" aria-hidden />
        {up}
      </span>
      <span className="inline-flex items-center gap-1">
        <ThumbsDown className="size-3" aria-hidden />
        {down}
      </span>
    </span>
  );
}
