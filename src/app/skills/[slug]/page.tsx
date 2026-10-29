import fs from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { ArticleFooterNote } from "@/components/skill/article-footer-note";
import { BackToTop } from "@/components/skill/back-to-top";
import { ExampleQuestions } from "@/components/skill/example-questions";
import { ReactionsProvider } from "@/components/skill/reactions-context";
import { ReadingProgress } from "@/components/skill/reading-progress";
import { RelatedSkills } from "@/components/skill/related-skills";
import { SkillActions } from "@/components/skill/skill-actions";
import { TableOfContents } from "@/components/skill/table-of-contents";
import { TagLink } from "@/components/skill/tag-link";
import { UseNotes } from "@/components/skill/use-notes";
import { RelatedToolCTA } from "@/components/soulstation/related-tool-cta";
import { extractToc, renderMarkdown } from "@/lib/markdown";
import { toSkillCardData } from "@/lib/skill-card-data";
import {
  formatUpdatedAt,
  getRelatedSkills,
  getSkillBySlug,
  getSkillSlugs,
} from "@/lib/skills";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getSkillSlugs().map((slug) => ({ slug }));
}

function resolveOgImage(slug: string): string {
  const file = path.join(process.cwd(), "public", "og", `${slug}.png`);
  return fs.existsSync(file) ? `/og/${slug}.png` : "/og/default.png";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) return {};

  const ogImage = resolveOgImage(skill.slug);

  return {
    title: skill.title,
    description: skill.summary,
    keywords: [skill.shortTitle, ...skill.tagLabels],
    alternates: { canonical: `/skills/${skill.slug}/` },
    openGraph: {
      type: "article",
      locale: "zh_CN",
      title: skill.title,
      description: skill.summary,
      url: `/skills/${skill.slug}/`,
      publishedTime: `${skill.updatedAt}T00:00:00+08:00`,
      modifiedTime: `${skill.updatedAt}T00:00:00+08:00`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: skill.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: skill.title,
      description: skill.summary,
      images: [ogImage],
    },
  };
}

export default async function SkillPage({ params }: PageProps) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) notFound();

  const html = await renderMarkdown(skill.displayBody);
  const toc = extractToc(skill.displayBody);
  const related = getRelatedSkills(skill, 3).map(toSkillCardData);
  const reactionIds = [skill.slug, ...related.map((item) => item.slug)];
  const primaryTag = skill.tags[0];
  const primaryTagLabel = skill.tagLabels[0];
  const visibleTags = skill.tags.slice(0, 3);

  return (
    <ReactionsProvider ids={reactionIds}>
      <ReadingProgress />

      <article className="container-page py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 lg:max-w-[760px]">
            <nav
              aria-label="面包屑"
              className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
            >
              <Link href="/skills/" className="transition-colors hover:text-ink">
                全部 Skill
              </Link>
              <span aria-hidden>/</span>
              {primaryTag ? (
                <Link
                  href={`/tags/${primaryTag}/`}
                  className="transition-colors hover:text-ink"
                >
                  {primaryTagLabel}
                </Link>
              ) : null}
              <span aria-hidden>/</span>
              <span className="text-ink">{skill.shortTitle}</span>
            </nav>

            <header className="mt-6 border-b border-line pb-6">
              <h1 className="font-serif text-3xl leading-tight tracking-tight text-ink sm:text-[40px]">
                {skill.shortTitle}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-ink">
                {skill.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>{skill.readingLabel}</span>
                <span aria-hidden>·</span>
                <span>更新于 {formatUpdatedAt(skill.updatedAt)}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {visibleTags.map((tag, index) => (
                  <TagLink
                    key={tag}
                    slug={tag}
                    label={skill.tagLabels[index]}
                  />
                ))}
              </div>
            </header>

            <div className="mt-6">
              <SkillActions slug={skill.slug} />
            </div>

            <div className="mt-10 space-y-8">
              <UseNotes note={skill.note} />
              <ExampleQuestions
                examples={skill.examples}
                slug={skill.slug}
              />
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>

            <ArticleFooterNote skill={skill} />

            {skill.relatedTool ? (
              <RelatedToolCTA
                tool={skill.relatedTool}
                slug={skill.slug}
              />
            ) : null}

            <div className="mt-12">
              <RelatedSkills skills={related} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
              <TableOfContents items={toc} />
            </div>
          </aside>
        </div>
      </article>

      <BackToTop />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: skill.title,
          alternateName: skill.shortTitle,
          description: skill.summary,
          url: `https://skillnow.cn/skills/${skill.slug}/`,
          mainEntityOfPage: `https://skillnow.cn/skills/${skill.slug}/`,
          dateModified: skill.updatedAt,
          inLanguage: "zh-CN",
          keywords: skill.tagLabels.join(", "),
          isAccessibleForFree: true,
          timeRequired: `PT${skill.readingMinutes}M`,
          ...(skill.source
            ? {
                author: {
                  "@type": "Organization",
                  name: skill.source.name,
                  ...(skill.source.url ? { url: skill.source.url } : {}),
                },
              }
            : {}),
          ...(skill.relatedTool
            ? {
                isRelatedTo: {
                  "@type": "WebPage",
                  name: skill.relatedTool.label,
                  url: skill.relatedTool.url,
                },
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "全部 Skill",
              item: "https://skillnow.cn/skills/",
            },
            ...(primaryTag
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: primaryTagLabel,
                    item: `https://skillnow.cn/tags/${primaryTag}/`,
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: primaryTag ? 3 : 2,
              name: skill.shortTitle,
              item: `https://skillnow.cn/skills/${skill.slug}/`,
            },
          ],
        }}
      />
    </ReactionsProvider>
  );
}
