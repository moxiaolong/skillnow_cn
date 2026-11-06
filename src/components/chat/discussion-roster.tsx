"use client";

import { cn } from "@/lib/utils";

export function DiscussionRoster({
  participants,
  selectedSlug,
  disabled,
  onEdit,
  onExit,
}: {
  participants: { slug: string; name: string }[];
  selectedSlug: string | null;
  disabled: boolean;
  onEdit: () => void;
  onExit: () => void;
}) {
  return (
    <div
      data-discussion-roster=""
      className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-[11px] text-muted"
    >
      <span>参与者</span>

      {participants.length === 0 ? (
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="rounded-full border border-line px-2 py-0.5 transition-colors hover:border-orange hover:text-orange-strong disabled:opacity-50"
        >
          选择参与者
        </button>
      ) : (
        participants.map((participant) => {
          const selected = selectedSlug === participant.slug;

          return (
            <button
              key={participant.slug}
              type="button"
              data-participant={participant.slug}
              data-selected={selected || undefined}
              onClick={onEdit}
              disabled={disabled}
              title={selected ? "正在发言" : "调整讨论参与者"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors",
                selected
                  ? "border-orange bg-orange-soft text-orange-strong"
                  : "border-line",
                !disabled &&
                  !selected &&
                  "hover:border-orange hover:text-orange-strong",
              )}
            >
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-orange-soft text-[9px] font-medium text-orange-strong">
                {participant.name.slice(0, 1)}
              </span>
              <span>{participant.name}</span>
              {selected ? (
                <span className="text-[10px]">发言中</span>
              ) : null}
            </button>
          );
        })
      )}

      <button
        type="button"
        onClick={onExit}
        disabled={disabled}
        className="ml-auto underline decoration-line underline-offset-4 transition-colors hover:text-orange-strong disabled:opacity-50"
      >
        退出讨论
      </button>
    </div>
  );
}
