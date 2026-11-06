"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function ChatNotice({
  children,
  className,
  label = "隐藏提示",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 border-b border-line px-3 py-1.5 text-[11px] leading-5",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label={label}
        title="隐藏提示"
        className="-mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
