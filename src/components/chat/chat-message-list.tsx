"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";

import { ChatMarkdown } from "@/components/chat/chat-markdown";
import type { ChatMessage } from "@/lib/chat-history";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
  searching: boolean;
  loading: boolean;
  skillMode: boolean;
  onPickExample: (text: string) => void;
};

const GENERAL_EXAMPLES = [
  "帮我用结构化思维分析一个最近的选择。",
  "把下面这段想法整理成三条可执行建议：",
  "解释一下什么是 AI Skill，以及怎么用。",
];

const SKILL_EXAMPLES = [
  "用这个 Skill 的视角，帮我分析一个最近的问题。",
  "这个 Skill 最适合解决什么问题？",
  "先问我几个问题，再给出分析。",
];

export function ChatMessageList({
  messages,
  isStreaming,
  searching,
  loading,
  skillMode,
  onPickExample,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const userCountRef = useRef(0);

  const userCount = messages.reduce(
    (count, message) => (message.role === "user" ? count + 1 : count),
    0,
  );

  useEffect(() => {
    const element = listRef.current;
    if (!element || messages.length === 0) return;

    if (userCount > userCountRef.current) {
      stickToBottomRef.current = true;
    }
    userCountRef.current = userCount;

    if (stickToBottomRef.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, userCount]);

  function handleScroll() {
    const element = listRef.current;
    if (!element) return;
    stickToBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 64;
  }

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      aria-label="对话消息"
      aria-busy={isStreaming}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
    >
      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted">
          正在读取本地对话…
        </div>
      ) : messages.length === 0 ? (
        <div className="flex min-h-full flex-col items-center justify-center text-center">
          <MessageSquare className="size-6 text-muted" aria-hidden />
          <p className="mt-3 font-serif text-xl tracking-tight text-ink">
            从一个具体问题开始
          </p>
          <p className="mt-1.5 text-sm text-muted">
            下面是一些例子，点击填入输入框。
          </p>
          <ul className="mt-5 w-full max-w-md space-y-2">
            {(skillMode ? SKILL_EXAMPLES : GENERAL_EXAMPLES).map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => onPickExample(example)}
                  className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-left text-sm leading-6 text-muted transition-colors hover:border-orange hover:text-ink"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-5">
          {messages.map((message) =>
            message.kind === "summary" ? (
              <details
                key={message.id}
                className="rounded-xl border border-dashed border-line bg-surface px-3 py-2"
              >
                <summary className="cursor-pointer text-xs text-muted">
                  早期对话摘要
                </summary>
                <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-ink">
                  {message.content}
                </p>
              </details>
            ) : (
              <div key={message.id}>
                <p className="mb-1 text-xs text-muted">
                  {message.role === "user" ? "你" : "AI"}
                </p>

              {message.role === "user" ? (
                <div className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-orange-soft px-4 py-2.5 text-sm leading-7 text-ink">
                  {message.content}
                </div>
              ) : (
                <div className="max-w-full">
                  {message.reasoning ? (
                    <details className="mb-2 rounded-lg border border-line bg-surface px-3 py-2">
                      <summary className="cursor-pointer text-xs text-muted">
                        思考过程
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                        {message.reasoning}
                      </p>
                    </details>
                  ) : null}

                  <div className="break-words rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3 text-sm leading-7 text-ink">
                    {message.content ? (
                      <ChatMarkdown content={message.content} />
                    ) : (
                      <span className="whitespace-pre-wrap">
                        {message.status === "streaming"
                          ? searching
                            ? "正在搜索网页…"
                            : message.reasoning
                              ? "正在思考…"
                              : "正在等待模型响应…"
                          : message.status === "stopped"
                            ? "已停止生成"
                            : message.status === "error"
                              ? "生成失败"
                              : message.reasoning
                                ? "模型只返回了思考过程，未给出正文。"
                                : message.sources?.length
                                  ? "搜索已完成，但模型没有生成回答。"
                                  : ""}
                      </span>
                    )}
                    {message.status === "streaming" && message.content ? (
                      <span
                        className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-muted align-middle"
                        aria-hidden
                      />
                    ) : null}
                  </div>

                  {message.sources && message.sources.length > 0 ? (
                    <details className="mt-2 rounded-lg border border-line bg-surface px-3 py-2">
                      <summary className="cursor-pointer text-xs text-muted">
                        搜索来源（{message.sources.length}）
                      </summary>
                      <ol className="mt-2 space-y-2">
                        {message.sources.map((source, index) => (
                          <li
                            key={`${source.url}-${index}`}
                            className="break-words text-xs leading-5"
                          >
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-orange-strong underline decoration-orange/30 underline-offset-4 hover:text-orange"
                            >
                              [{index + 1}] {source.title}
                            </a>
                            {source.siteName || source.date ? (
                              <span className="ml-1 text-muted">
                                {[source.siteName, source.date?.slice(0, 10)]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            ) : null}
                            {source.snippet ? (
                              <p className="mt-0.5 text-muted">
                                {source.snippet}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </details>
                  ) : null}

                  {message.status === "stopped" && message.content ? (
                    <p className="mt-1.5 text-xs text-muted">已停止生成</p>
                  ) : null}
                  {message.status === "error" && message.content ? (
                    <p className="mt-1.5 text-xs text-orange-strong">
                      生成中断
                    </p>
                  ) : null}
                </div>
              )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
