import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="SkillNow 首页"
      className={cn(
        "group inline-flex items-center gap-2.5 text-ink transition-colors hover:text-orange-strong",
        className,
      )}
    >
      <span className="relative block h-3.5 w-3.5" aria-hidden>
        <span className="absolute inset-0 border border-current" />
        <span className="absolute right-0 bottom-0 h-2 w-2 bg-orange transition-colors group-hover:bg-orange-strong" />
      </span>
      <span className="text-[13px] font-semibold tracking-[0.18em]">
        SKILLNOW
      </span>
    </Link>
  );
}
