import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { SkillsExplorer } from "@/components/skill/skills-explorer";
import { toSkillCardData } from "@/lib/skill-card-data";
import { getPublishedSkills, getTagsWithCounts } from "@/lib/skills";

const DESCRIPTION =
  "浏览全部 AI Skill：按人物、主题或标签搜索，支持默认、最近更新和最有用的排序。";

export const metadata: Metadata = {
  title: "全部 Skill",
  description: DESCRIPTION,
  alternates: { canonical: "/skills/" },
  openGraph: {
    title: "全部 Skill",
    description: DESCRIPTION,
    url: "/skills/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "全部 Skill",
    description: DESCRIPTION,
    images: ["/og/default.png"],
  },
};

export default function SkillsPage() {
  const skills = getPublishedSkills().map(toSkillCardData);
  const tags = getTagsWithCounts().map(({ slug, label, count }) => ({
    slug,
    label,
    count,
  }));

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          全部 Skill
        </h1>
        <p className="mt-3 text-base leading-8 text-muted">
          按关键词、标签或排序浏览。
        </p>
      </header>

      <div className="mt-10">
        <SkillsExplorer skills={skills} tags={tags} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "SkillNow 全部 Skill",
          numberOfItems: skills.length,
          itemListElement: skills.map((skill, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://skillnow.cn/skills/${skill.slug}/`,
            name: skill.title,
          })),
        }}
      />
    </div>
  );
}
