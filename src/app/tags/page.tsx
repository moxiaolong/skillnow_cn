import type { Metadata } from "next";
import Link from "next/link";

import { getTagsWithCounts } from "@/lib/skills";

export const metadata: Metadata = {
  title: "全部标签",
  description: "按标签浏览 SkillNow 收录的 AI Skill。",
  alternates: { canonical: "/tags/" },
  openGraph: {
    title: "全部标签",
    description: "按标签浏览 SkillNow 收录的 AI Skill。",
    url: "/tags/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
};

export default function TagsPage() {
  const tags = getTagsWithCounts();

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          全部标签
        </h1>
        <p className="mt-3 text-base leading-8 text-muted">
          用标签交叉浏览，找到相近的 Skill。
        </p>
      </header>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/tags/${tag.slug}/`}
            className="group flex items-start justify-between gap-4 rounded-xl border border-line bg-bg p-5 transition-colors hover:border-orange"
          >
            <span>
              <span className="font-serif text-lg text-ink transition-colors group-hover:text-orange-strong">
                {tag.label}
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted">
                {tag.description}
              </span>
            </span>
            <span className="font-mono text-xs text-muted">{tag.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
