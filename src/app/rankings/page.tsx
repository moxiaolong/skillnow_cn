import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { RankingList } from "@/components/skill/ranking-list";
import { ReactionsProvider } from "@/components/skill/reactions-context";
import { toSkillCardData } from "@/lib/skill-card-data";
import { getPublishedSkills } from "@/lib/skills";

const DESCRIPTION =
  "按读者赞踩排序的 AI Skill 榜单。0 票时按收录顺序展示。";

export const metadata: Metadata = {
  title: "榜单",
  description: DESCRIPTION,
  alternates: { canonical: "/rankings/" },
  openGraph: {
    title: "榜单",
    description: DESCRIPTION,
    url: "/rankings/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "榜单",
    description: DESCRIPTION,
    images: ["/og/default.png"],
  },
};

export default function RankingsPage() {
  const skills = getPublishedSkills().map(toSkillCardData);
  const ids = skills.map((skill) => skill.slug);

  return (
    <ReactionsProvider ids={ids}>
      <div className="container-page py-12 sm:py-16">
        <header className="max-w-2xl">
          <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            榜单
          </h1>
          <p className="mt-3 text-base leading-8 text-muted">
            按赞减踩排序，0 票时按收录顺序。
          </p>
        </header>

        <div className="mt-8">
          <RankingList skills={skills} />
        </div>

        <p className="mt-6 text-xs text-muted">
          <Link
            href="/skills/"
            className="text-orange-strong underline decoration-line underline-offset-4"
          >
            去全部 Skill
          </Link>
        </p>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "SkillNow 榜单",
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
    </ReactionsProvider>
  );
}
