import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PinButton } from "@/components/skill/pin-button";
import { cn } from "@/lib/utils";
import type { SkillCardData } from "@/lib/skill-card-data";

export type { SkillCardData };

export function SkillCard({
  skill,
  className,
  showPin = false,
}: {
  skill: SkillCardData;
  className?: string;
  showPin?: boolean;
}) {
  return (
    <div className="relative h-full transition-transform duration-300 hover:-translate-y-0.5">
      <Link
        href={`/skills/${skill.slug}/`}
        className={cn(
          "group flex h-full flex-col rounded-xl border border-line bg-bg p-6 transition-all duration-300 hover:border-orange hover:shadow-[0_10px_30px_rgba(28,25,23,0.06)]",
          className,
        )}
      >
        <span className="pr-10 text-xs font-medium text-orange-strong">
          {skill.tagLabels[0] ?? "Skill"}
        </span>

        <h3 className="mt-4 font-serif text-xl leading-snug text-ink transition-colors duration-200 group-hover:text-orange-strong">
          {skill.shortTitle}
        </h3>
        <p className="mt-3 line-clamp-2 text-base leading-7 text-muted">
          {skill.summary}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-8 text-xs text-muted">
          <span>{skill.readingLabel}</span>
          <ArrowUpRight
            className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden
          />
        </div>
      </Link>

      {showPin ? (
        <PinButton
          slug={skill.slug}
          name={skill.shortTitle}
          compact
          className="absolute top-3 right-3 z-10"
        />
      ) : null}
    </div>
  );
}
