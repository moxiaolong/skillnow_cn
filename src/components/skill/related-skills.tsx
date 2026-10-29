import Link from "next/link";

import { SkillGrid } from "@/components/skill/skill-grid";
import type { SkillCardData } from "@/components/skill/skill-card";

export function RelatedSkills({ skills }: { skills: SkillCardData[] }) {
  if (skills.length === 0) return null;

  return (
    <section className="not-prose">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-2xl tracking-tight text-ink">
          相关 Skill
        </h2>
        <Link
          href="/skills/"
          className="text-sm text-muted transition-colors hover:text-orange-strong"
        >
          全部 Skill
        </Link>
      </div>
      <SkillGrid skills={skills} columns={3} className="mt-5" />
    </section>
  );
}
