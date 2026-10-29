"use client";

import { ArrowUpRight } from "lucide-react";

import { track } from "@/lib/analytics";
import type { Skill } from "@/lib/skills";

export function RelatedToolCTA({
  tool,
  slug,
}: {
  tool: NonNullable<Skill["relatedTool"]>;
  slug: string;
}) {
  return (
    <section className="not-prose mt-8 flex flex-col gap-3 rounded-xl border border-line p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ink">{tool.label}</p>
        <p className="mt-0.5 text-xs text-muted">{tool.description}</p>
      </div>
      <a
        href={tool.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("soulstation_outbound", { slug, url: tool.url })}
        className="group inline-flex h-9 shrink-0 items-center gap-1 text-sm text-orange-strong"
      >
        去看看
        <ArrowUpRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </a>
    </section>
  );
}
