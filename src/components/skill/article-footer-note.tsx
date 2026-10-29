import Link from "next/link";

import type { Skill } from "@/lib/skills";

export function ArticleFooterNote({ skill }: { skill: Skill }) {
  const pieces: string[] = [];

  if (skill.disclaimers.includes("non-person")) {
    pieces.push("个人整理，非本人/非代言");
  }
  if (skill.disclaimers.includes("ai-accuracy")) {
    pieces.push("AI 内容可能有误");
  }
  if (skill.disclaimers.includes("mental-health")) {
    pieces.push("心理内容不构成建议，危机请拨 400-161-9995");
  }
  if (skill.disclaimers.includes("investment")) {
    pieces.push("不构成投资建议");
  }
  if (skill.disclaimers.includes("viewpoint")) {
    pieces.push("角色观点不代表整理者");
  }

  return (
    <div className="mt-8 border-t border-line pt-4 text-xs leading-6 text-muted">
      <span>
        内容许可{" "}
        <Link
          href="/terms/"
          className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-orange-strong"
        >
          CC BY 4.0
        </Link>
      </span>

      <details className="mt-1">
        <summary className="cursor-pointer text-ink underline decoration-line underline-offset-4 transition-colors hover:text-orange-strong">
          免责声明
        </summary>
        <p className="mt-2 max-w-2xl">
          {pieces.length > 0 ? `${pieces.join(" · ")} · ` : null}
          <Link
            href="/terms/"
            className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-orange-strong"
          >
            完整条款
          </Link>
        </p>
      </details>
    </div>
  );
}
