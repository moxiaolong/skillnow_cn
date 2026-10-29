import type { Skill } from "@/lib/skills";

export type SkillCardData = Pick<
  Skill,
  | "slug"
  | "title"
  | "shortTitle"
  | "summary"
  | "tags"
  | "tagLabels"
  | "readingLabel"
  | "featured"
  | "order"
  | "updatedAt"
>;

export function toSkillCardData(skill: Skill): SkillCardData {
  return {
    slug: skill.slug,
    title: skill.title,
    shortTitle: skill.shortTitle,
    summary: skill.summary,
    tags: skill.tags,
    tagLabels: skill.tagLabels,
    readingLabel: skill.readingLabel,
    featured: skill.featured,
    order: skill.order,
    updatedAt: skill.updatedAt,
  };
}
