"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { SkillCardData } from "@/components/skill/skill-card";
import { useReactions } from "@/components/skill/reactions-context";
import { upRatio } from "@/lib/reactions";
import { cn } from "@/lib/utils";

export function RankingList({
  skills,
  limit,
  className,
}: {
  skills: SkillCardData[];
  limit?: number;
  className?: string;
}) {
  const { getCount, getScore, loading } = useReactions();
  const ranked = [...skills]
    .sort((a, b) => {
      const scoreDiff = getScore(b.slug) - getScore(a.slug);
      if (Math.abs(scoreDiff) > 1e-9) return scoreDiff;
      const upDiff = getCount(b.slug).up - getCount(a.slug).up;
      if (upDiff !== 0) return upDiff;
      return a.order - b.order;
    })
    .slice(0, limit ?? skills.length);

  const totalVotes = ranked.reduce((sum, skill) => {
    const { up, down } = getCount(skill.slug);
    return sum + up + down;
  }, 0);

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {ranked.map((skill, index) => {
        const { up, down } = getCount(skill.slug);
        const total = up + down;
        const ratio = upRatio(up, down);
        return (
          <Link
            key={skill.slug}
            href={`/skills/${skill.slug}/`}
            className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 py-4 transition-colors hover:bg-surface sm:grid-cols-[3rem_minmax(0,1fr)_10rem]"
          >
            <span className="font-mono text-xs text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="font-serif text-lg text-ink transition-colors group-hover:text-orange-strong">
                {skill.shortTitle}
              </span>
              <span className="mt-1 block truncate text-xs text-muted">
                {skill.tagLabels.slice(0, 3).join(" · ")}
              </span>
            </span>
            <span className="flex items-center justify-end gap-3">
              {loading ? (
                <span className="text-xs text-muted">…</span>
              ) : total === 0 ? (
                <span className="text-xs text-muted">—</span>
              ) : (
                <span className="flex w-full max-w-[9rem] flex-col items-end gap-1">
                  <span className="text-xs text-muted">
                    有用 {up} · 没用 {down}
                  </span>
                  <span className="h-1 w-full overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-orange"
                      style={{ width: `${ratio}%` }}
                    />
                  </span>
                </span>
              )}
              <ArrowUpRight
                className="size-3.5 shrink-0 text-muted transition-colors group-hover:text-orange-strong"
                aria-hidden
              />
            </span>
          </Link>
        );
      })}
      {!loading && totalVotes === 0 ? (
        <p className="py-4 text-xs text-muted">0 票时按收录顺序。</p>
      ) : null}
    </div>
  );
}
