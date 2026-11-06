"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function ChatPageNotice() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="mt-1 flex items-start gap-3">
      <p className="min-w-0 flex-1 text-xs leading-5 text-muted">
        浏览器直连模型平台，支持多 Skill 讨论；API Key、联网搜索开关与对话记录只保存在本机，不会上传到本站。{" "}
        <Link
          href="/privacy/"
          className="text-orange-strong underline decoration-orange/30 underline-offset-4 hover:text-orange"
        >
          隐私政策
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="隐藏顶部提示"
        title="隐藏提示"
        className="-mr-1 -mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
