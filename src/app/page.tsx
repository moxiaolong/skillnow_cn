import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { ReactionsProvider } from "@/components/skill/reactions-context";
import { SkillGrid } from "@/components/skill/skill-grid";
import { TagLink } from "@/components/skill/tag-link";
import { HeroSearch } from "@/components/site/hero-search";
import { SectionHeading } from "@/components/site/section-heading";
import { toSkillCardData } from "@/lib/skill-card-data";
import {
  getFeaturedSkills,
  getPublishedSkills,
  getTagsWithCounts,
} from "@/lib/skills";

const DESCRIPTION =
  "整理者日常在用的 AI Skill。收录弗洛伊德、黑格尔、芒格、雷军等人物思维 Skill，支持全文阅读、复制与下载。";

export const metadata: Metadata = {
  title: {
    absolute: "SkillNow · 中文 AI Skill 精选",
  },
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SkillNow · 中文 AI Skill 精选",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "SkillNow · 中文 AI Skill 精选",
    description: DESCRIPTION,
    images: ["/og/default.png"],
  },
};

export default function HomePage() {
  const skills = getPublishedSkills();
  const featured = getFeaturedSkills(4);
  const featuredOrFirst = featured.length > 0 ? featured : skills.slice(0, 4);
  const popularTags = [...getTagsWithCounts()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, 3);
  const cardSkills = skills.map(toSkillCardData);
  const ids = cardSkills.map((skill) => skill.slug);

  return (
    <ReactionsProvider ids={ids}>
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-xl font-serif text-[32px] leading-[1.2] tracking-tight text-ink sm:text-[40px] lg:text-[44px]">
              把大师的思维方式，
              <br />
              装进你的 AI。
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-muted">
              整理者日常在用的 AI Skill，直接复制就能用。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <HeroSearch />
              <Link
                href="/skills/"
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-strong px-5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange sm:w-auto"
              >
                浏览全部 Skill
                <ArrowUpRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </Link>
            </div>

            {popularTags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <TagLink
                    key={tag.slug}
                    slug={tag.slug}
                    label={tag.label}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-[340px] items-center justify-center lg:flex">
            <div className="relative flex h-full w-full items-center justify-center">
              <div
                className="animate-breathe-soft absolute h-[280px] w-[230px]"
                aria-hidden
              >
                <div className="-rotate-6 translate-x-2 translate-y-2 h-full w-full rounded-2xl border border-line bg-surface" />
              </div>
              <div
                className="animate-breathe absolute h-[265px] w-[215px]"
                aria-hidden
              >
                <div className="rotate-3 -translate-x-1 -translate-y-1 h-full w-full rounded-2xl border border-line bg-bg shadow-[0_12px_40px_rgba(28,25,23,0.06)]" />
              </div>
              <div className="relative flex h-[250px] w-[200px] -rotate-2 flex-col justify-between rounded-2xl border border-line bg-bg p-5 shadow-[0_20px_60px_rgba(28,25,23,0.08)]">
                <div className="flex items-center justify-between">
                  <span className="h-2.5 w-2.5 bg-orange" aria-hidden />
                  <span className="font-mono text-[10px] text-muted">2026</span>
                </div>
                <div>
                  <p className="font-serif text-xl tracking-tight text-ink">
                    SKILLNOW
                  </p>
                  <p className="mt-1 text-xs text-muted">精选中文 Skill 整理</p>
                </div>
                <div className="h-px w-full bg-line" />
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span className="tracking-[0.14em]">SKILLS</span>
                  <span>{String(skills.length).padStart(2, "0")}</span>
                </div>
              </div>
            </div>
            <div
              className="absolute -top-2 -right-2 h-12 w-12 border border-orange/30"
              aria-hidden
            />
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <SectionHeading title="常用清单" meta={`${skills.length} 个`} />
        <SkillGrid
          skills={featuredOrFirst.map(toSkillCardData)}
          columns={2}
          className="mt-7"
        />
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SkillNow",
          url: "https://skillnow.cn/",
          description: DESCRIPTION,
          inLanguage: "zh-CN",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: featuredOrFirst.map((skill, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://skillnow.cn/skills/${skill.slug}/`,
            name: skill.title,
          })),
        }}
      />
    </ReactionsProvider>
  );
}
