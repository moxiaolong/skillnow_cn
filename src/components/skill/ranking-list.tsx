import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { SkillCardData } from "@/components/skill/skill-card";
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
  const ranked = [...skills]
    .sort((a, b) => a.order - b.order)
    .slice(0, limit ?? skills.length);

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {ranked.map((skill, index) => (
        <Link
          key={skill.slug}
          href={`/skills/${skill.slug}/`}
          className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 py-4 transition-colors hover:bg-surface sm:grid-cols-[3rem_minmax(0,1fr)_auto]"
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
          <ArrowUpRight
            className="size-3.5 shrink-0 text-muted transition-colors group-hover:text-orange-strong"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
