import Link from "next/link";

import { cn } from "@/lib/utils";

export function TagLink({
  slug,
  label,
  count,
  className,
}: {
  slug: string;
  label: string;
  count?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/tags/${slug}/`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-orange hover:text-orange-strong",
        className,
      )}
    >
      {label}
      {typeof count === "number" ? (
        <span className="text-[10px] opacity-60">{count}</span>
      ) : null}
    </Link>
  );
}
