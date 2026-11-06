"use client";

import { Pin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DISCUSSION_ROUND_OPTIONS,
  MAX_DISCUSSION_PARTICIPANTS,
  MIN_DISCUSSION_PARTICIPANTS,
  RECOMMENDED_MAX_DISCUSSION_PARTICIPANTS,
  UNLIMITED_DISCUSSION_ROUNDS,
} from "@/lib/chat-discussion";
import { cn } from "@/lib/utils";

export type DiscussionSkillOption = {
  slug: string;
  name: string;
  pinned: boolean;
  tagLabels?: string[];
};

export function DiscussionSetupDialog({
  open,
  onOpenChange,
  options,
  selected,
  maxRounds,
  onToggle,
  onRoundsChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: DiscussionSkillOption[];
  selected: string[];
  maxRounds: number;
  onToggle: (slug: string) => void;
  onRoundsChange: (rounds: number) => void;
  onConfirm: () => void;
}) {
  const canConfirm =
    selected.length >= MIN_DISCUSSION_PARTICIPANTS &&
    selected.length <= MAX_DISCUSSION_PARTICIPANTS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto p-4 sm:max-w-lg sm:p-6">
        <DialogTitle className="font-serif text-xl tracking-tight text-ink">
          选择讨论参与者
        </DialogTitle>
        <DialogDescription className="sr-only">
          选择参与讨论的 Skill 和最多轮数。
        </DialogDescription>

        <fieldset className="mt-4">
          <legend className="sr-only">讨论参与者</legend>
          <div className="max-h-[48vh] space-y-1 overflow-y-auto rounded-lg border border-line p-2">
            {options.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted">
                正在加载 Skill…
              </p>
            ) : null}
            {options.map((option) => {
              const checked = selected.includes(option.slug);
              const full =
                !checked && selected.length >= MAX_DISCUSSION_PARTICIPANTS;

              return (
                <label
                  key={option.slug}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 transition-colors",
                    checked ? "bg-orange-soft/50" : "hover:bg-surface",
                    full && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(option.slug)}
                    disabled={full}
                    className="mt-1 size-4 accent-[var(--color-orange-strong)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm text-ink">
                      {option.pinned ? (
                        <Pin
                          className="size-3.5 shrink-0 fill-current text-orange-strong"
                          aria-label="已置顶"
                        />
                      ) : null}
                      {option.name}
                    </span>
                    {option.tagLabels?.length ? (
                      <span className="mt-0.5 block truncate text-[11px] text-muted">
                        {option.tagLabels.join(" · ")}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            已选 <span className="text-ink">{selected.length}</span>/
            {MAX_DISCUSSION_PARTICIPANTS}
          </p>
          <label className="flex items-center gap-2 text-xs text-muted">
            最多轮数
            <select
              value={maxRounds}
              onChange={(event) =>
                onRoundsChange(Number(event.target.value))
              }
              className="h-8 rounded-lg border border-line bg-bg px-2 text-xs text-ink outline-none transition-colors hover:border-orange focus:border-orange"
            >
              {DISCUSSION_ROUND_OPTIONS.map((rounds) => (
                <option key={rounds} value={rounds}>
                  {rounds === UNLIMITED_DISCUSSION_ROUNDS
                    ? "无限模式"
                    : `${rounds} 轮`}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selected.length > RECOMMENDED_MAX_DISCUSSION_PARTICIPANTS ? (
          <p className="mt-3 rounded-lg border border-orange/30 bg-orange-soft/40 px-3 py-2 text-[11px] leading-5 text-orange-strong">
            已选 {selected.length} 位。每轮会并行征询每位参与者的发言意愿，
            参与者越多，Token 消耗可能暴增；建议控制在{" "}
            {RECOMMENDED_MAX_DISCUSSION_PARTICIPANTS} 位以内，并全程看护。
          </p>
        ) : null}

        {maxRounds === UNLIMITED_DISCUSSION_ROUNDS ? (
          <p className="mt-3 rounded-lg border border-orange/30 bg-orange-soft/40 px-3 py-2 text-[11px] leading-5 text-orange-strong">
            无限模式不会按轮数自动停止。建议全程看护，避免消耗过多
            Token；随时可以点「停止讨论」。
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            进入讨论
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
