import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SkillChatCTA({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-orange/30 bg-orange-soft/40 p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">和「{name}」对话</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            用你自己的 API Key，在浏览器里直接和这个 Skill
            对话。配置与记录只保存在本机。
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={`/chat/?skill=${encodeURIComponent(slug)}`}>
            <MessageSquare aria-hidden />
            开始对话
          </Link>
        </Button>
      </div>
    </div>
  );
}
