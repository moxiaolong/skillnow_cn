import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ChatClient } from "@/components/chat/chat-client";

const DESCRIPTION =
  "在浏览器中直接连接你填写的模型平台的 AI 对话工具，支持联网搜索。API Key 与对话记录只保存在本机，不上传到本站。";

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
          <p className="mt-1 text-xs leading-5 text-muted">
            浏览器直连模型平台；API Key、联网搜索开关与对话记录只保存在本机，不会上传到本站。{" "}
            <Link
              href="/privacy/"
              className="text-orange-strong underline decoration-orange/30 underline-offset-4 hover:text-orange"
            >
              隐私政策
            </Link>
          </p>
        </header>

        <Suspense fallback={<ChatFallback />}>
          <ChatClient />
        </Suspense>
      </div>
    </div>
  );
}
