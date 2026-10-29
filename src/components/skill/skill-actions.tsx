import { CopyButton } from "@/components/skill/copy-button";
import { DownloadButton } from "@/components/skill/download-button";
import { FavoriteButton } from "@/components/skill/favorite-button";
import { Thumbs } from "@/components/skill/thumbs";

export function SkillActions({ slug }: { slug: string }) {
  const base = `/skills/${slug}`;

  return (
    <div className="not-prose rounded-xl border border-line bg-bg p-4">
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          url={`${base}/prompt.txt`}
          label="复制提示词"
          slug={slug}
          format="prompt"
          variant="default"
        />
        <CopyButton
          url={`${base}/SKILL.md`}
          label="复制 SKILL.md"
          copiedLabel="已复制 SKILL.md"
          slug={slug}
          format="skill-md"
        />
        <DownloadButton
          url={`${base}/SKILL.md`}
          fileName={`${slug}.md`}
          slug={slug}
        />
        <FavoriteButton slug={slug} className="sm:ml-auto" />
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <Thumbs slug={slug} />
      </div>
    </div>
  );
}
