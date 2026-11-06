"use client";

import { Pin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { togglePin } from "@/lib/pins";
import { usePins } from "@/lib/use-pins";
import { cn } from "@/lib/utils";

export function PinButton({
  slug,
  name,
  className,
  compact = false,
}: {
  slug: string;
  name?: string;
  className?: string;
  compact?: boolean;
}) {
  const pins = usePins();
  const pinned = pins.includes(slug);
  const action = pinned ? "取消置顶" : "置顶";

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "default"}
      aria-pressed={pinned}
      aria-label={name ? `${action} ${name}` : action}
      title={action}
      onClick={() => togglePin(slug)}
      className={cn(
        "shrink-0",
        pinned && "text-orange-strong",
        compact && "border border-line bg-bg/95 hover:bg-surface",
        className,
      )}
    >
      <Pin className={pinned ? "fill-current" : undefined} aria-hidden />
      {compact ? null : <span>{pinned ? "已置顶" : "置顶"}</span>}
    </Button>
  );
}
