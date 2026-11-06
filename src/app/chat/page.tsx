import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatClient } from "@/components/chat/chat-client";
import { ChatPageNotice } from "@/components/chat/chat-page-notice";

const DESCRIPTION =
  "在浏览器中直接连接你填写的模型平台的 AI 对话工具，支持联网搜索和多 Skill 讨论。API Key 与对话记录只保存在本机，不上传到本站。";

export const metadata: Metadata = {
  title: "AI 对话",
  description: DESCRIPTION,
  alternates: { canonical: "/chat/" },
  openGraph: {
    title: "AI 对话",
    description: DESCRIPTION,
    url: "/chat/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "AI 对话",
    description: DESCRIPTION,
    images: ["/og/default.png"],
  },
};

function ChatFallback() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-line bg-surface text-sm text-muted">
      正在载入对话…
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="container-page flex h-[calc(100dvh-3.5rem)] min-h-[480px] flex-col py-4 sm:py-6">
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
        <header className="mb-3">
          <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">
            AI 对话
          </h1>
          <ChatPageNotice />
        </header>

        <Suspense fallback={<ChatFallback />}>
          <ChatClient />
        </Suspense>
      </div>
    </div>
  );
}
