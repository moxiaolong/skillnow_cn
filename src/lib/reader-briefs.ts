import { READER_BRIEFS } from "@content/reader-briefs";

import type { TocItem } from "@/lib/markdown";
import { readerBriefSchema, type ReaderBrief } from "@/lib/schema";

export const CORE_MODEL_HEADING = "核心心智模型";

const briefs = new Map<string, ReaderBrief>();

for (const [slug, raw] of Object.entries(READER_BRIEFS)) {
  const parsed = readerBriefSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid reader brief for "${slug}": ${issues}`);
  }
  briefs.set(slug, parsed.data);
}

export function getReaderBrief(slug: string): ReaderBrief | undefined {
  return briefs.get(slug);
}

export function getReaderBriefSlugs(): string[] {
  return [...briefs.keys()];
}

export function findCoreModelAnchor(toc: TocItem[]): string | undefined {
  return toc.find(
    (item) => item.level === 2 && item.text === CORE_MODEL_HEADING,
  )?.id;
}
