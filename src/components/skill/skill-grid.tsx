import { SkillCard, type SkillCardData } from "@/components/skill/skill-card";
import { cn } from "@/lib/utils";

export function SkillGrid({
  skills,
  columns = 3,
  className,
}: {
  skills: SkillCardData[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("grid gap-4", gridClass, className)}>
      {skills.map((skill) => (
        <SkillCard key={skill.slug} skill={skill} />
      ))}
    </div>
  );
}
