import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { ReactionsProvider } from "@/components/skill/reactions-context";
import { SkillGrid } from "@/components/skill/skill-grid";
import { TagLink } from "@/components/skill/tag-link";
import { toSkillCardData } from "@/lib/skill-card-data";
import { getSkillsByTag, getTagsWithCounts } from "@/lib/skills";

type PageProps = {
  params: Promise<{ tag: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getTagsWithCounts().map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const definition = getTagsWithCounts().find((item) => item.slug === tag);
  if (!definition) return {};

  const title = `${definition.label} Skill`;

  return {
    title,
    description: definition.description,
    alternates: { canonical: `/tags/${definition.slug}/` },
    openGraph: {
      title,
      description: definition.description,
      url: `/tags/${definition.slug}/`,
      images: [{ url: "/og/default.png", width: 1200, height: 630 }],
    },
    twitter: {
      title,
      description: definition.description,
      images: ["/og/default.png"],
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const allTags = getTagsWithCounts();
  const definition = allTags.find((item) => item.slug === tag);
  if (!definition) notFound();

  const skills = getSkillsByTag(tag).map(toSkillCardData);
  const otherTags = allTags.filter((item) => item.slug !== tag).slice(0, 10);
  const ids = skills.map((skill) => skill.slug);
  const title = `${definition.label} Skill`;

  return (
    <ReactionsProvider ids={ids}>
      <div className="container-page py-12 sm:py-16">
        <nav
          aria-label="面包屑"
          className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted"
        >
          <Link href="/skills/" className="transition-colors hover:text-ink">
            全部 Skill
          </Link>
          <span aria-hidden>/</span>
          <Link href="/tags/" className="transition-colors hover:text-ink">
            标签
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">{definition.label}</span>
        </nav>

        <header className="mt-6 max-w-2xl">
          <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            {definition.label}
          </h1>
          <p className="mt-3 text-base leading-8 text-muted">
            {definition.description}
          </p>
          <p className="mt-2 text-xs text-muted">{skills.length} 个 Skill</p>
        </header>

        <div className="mt-10">
          <SkillGrid skills={skills} columns={3} />
        </div>

        {otherTags.length > 0 ? (
          <div className="mt-14 border-t border-line pt-6">
            <h2 className="text-sm text-ink">其他标签</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherTags.map((item) => (
                <TagLink
                  key={item.slug}
                  slug={item.slug}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        ) : null}

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: title,
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
