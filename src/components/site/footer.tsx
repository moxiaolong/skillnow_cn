import Link from "next/link";

import { Logo } from "@/components/site/logo";

const FOOTER_LINKS = [
  { href: "/skills/", label: "全部 Skill" },
  { href: "/rankings/", label: "榜单" },
  { href: "/about/", label: "关于" },
  { href: "/privacy/", label: "隐私" },
  { href: "/terms/", label: "条款" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="container-page flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted">
            整理者日常在用的 AI Skill。觉得好用就放出来，大家自取。
          </p>
        </div>

        <nav
          aria-label="页脚导航"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="mailto:hi@skillnow.cn"
            className="transition-colors hover:text-ink"
          >
            hi@skillnow.cn
          </a>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 北京此在科技有限公司 · SkillNow</p>
          <p>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              京ICP备XXXXXXXX号
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
