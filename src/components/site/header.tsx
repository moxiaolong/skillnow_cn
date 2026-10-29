"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { SearchDialog } from "@/components/site/search-dialog";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/skills/", label: "全部 Skill" },
  { href: "/rankings/", label: "榜单" },
  { href: "/about/", label: "关于" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/skills/") return pathname.startsWith("/skills");
    return pathname === href;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="container-page flex h-14 items-center justify-between gap-3">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm transition-colors hover:text-ink",
                isActive(link.href) ? "text-ink" : "text-muted",
              )}
            >
              {link.label}
              {isActive(link.href) ? (
                <span
                  className="absolute inset-x-3 -bottom-[15px] h-px bg-orange"
                  aria-hidden
                />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-xs text-muted transition-colors hover:border-orange hover:text-orange-strong"
            aria-label="搜索 Skill"
          >
            <Search className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">搜索</span>
          </button>
          <Link
            href="/skills/"
            className="hidden h-9 items-center rounded-lg bg-orange-strong px-4 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange md:inline-flex"
          >
            浏览全部
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
          >
            {mobileOpen ? (
              <X className="size-4" aria-hidden />
            ) : (
              <Menu className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-line bg-bg md:hidden"
        >
          <nav className="container-page flex flex-col py-2" aria-label="移动导航">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "border-b border-line py-3 text-sm last:border-b-0",
                  isActive(link.href) ? "text-ink" : "text-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
