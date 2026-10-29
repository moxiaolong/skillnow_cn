import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeading({
  title,
  meta,
  link,
}: {
  title: string;
  meta?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-2xl tracking-tight text-ink">
          {title}
        </h2>
        {meta ? <span className="text-xs text-muted">{meta}</span> : null}
      </div>
      {link ? (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm text-muted transition-colors hover:text-orange-strong"
        >
          {link.label}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
