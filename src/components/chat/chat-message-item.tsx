"use client";

import { Quote } from "lucide-react";

import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { DiscussionQuote } from "@/components/chat/discussion-quote";
import type { ChatMessage } from "@/lib/chat-history";
import {
  getDiscussionResponseStatuses,
  type DiscussionIntentStatus,
  type DiscussionParticipant,
} from "@/lib/chat-discussion";
import { cn } from "@/lib/utils";

function MessageResponses({
  message,
  messages,
  participants,
  intents,
  intentTargets,
  alignEnd,
  onJump,
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  participants: DiscussionParticipant[];
  intents: Record<string, DiscussionIntentStatus>;
  intentTargets: Record<string, string>;
  alignEnd: boolean;
  onJump: (messageId: string) => void;
}) {
  const statuses = getDiscussionResponseStatuses({
    message,
    messages,
    participants,
    intents,
    intentTargets,
  });

  if (statuses.length === 0) return null;

  return (
    <div
      aria-label="本条消息的回应状态"
      className={cn(
        "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted",
        alignEnd ? "justify-end" : "justify-start",
      )}
    >
      <span>回应：</span>
      {statuses.map(({ participant, state, messageId }) => {
        if (state === "none") {
          return (
            <span key={participant.slug} className="text-muted/60">
              {participant.name} 无回应
            </span>
          );
        }

        const label = state === "responded" ? "已回应" : "回应中";

        if (messageId) {
          return (
            <button
              key={participant.slug}
              type="button"
              onClick={() => onJump(messageId)}
              aria-label={`跳转到 ${participant.name} 的${label}消息`}
              className="text-orange-strong underline decoration-orange/30 underline-offset-4 transition-colors hover:text-orange"
            >
              {participant.name} {label}
            </button>
          );
        }

        return (
          <span key={participant.slug} className="text-orange-strong">
            {participant.name} {label}
          </span>
        );
      })}
    </div>
  );
}

export function ChatMessageItem({
  message,
  messages,
  searching,
  discussionMode,
  discussionParticipants,
  discussionIntents,
  discussionIntentTargets,
  treeMode = false,
  treeDepth,
  showReasoning = true,
  onJumpMessage,
  onQuoteMessage,
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  searching: boolean;
  discussionMode: boolean;
  discussionParticipants: DiscussionParticipant[];
  discussionIntents: Record<string, DiscussionIntentStatus>;
  discussionIntentTargets: Record<string, string>;
  treeMode?: boolean;
  treeDepth?: number;
  showReasoning?: boolean;
  onJumpMessage: (messageId: string) => void;
  onQuoteMessage?: (message: ChatMessage) => void;
}) {
  const isUser = message.role === "user";
  const speakerName = message.speaker?.name;
  const deepReply =
    treeMode && treeDepth !== undefined && treeDepth >= 4;
  const canQuote =
    Boolean(onQuoteMessage) &&
    message.kind === undefined &&
    message.status !== "streaming" &&
    message.content.trim().length > 0;

  return (
    <>
      <div className="group mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {speakerName ? (
          <>
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-soft text-[10px] font-medium text-orange-strong">
              {speakerName.slice(0, 1)}
            </span>
            <span className="text-ink">{speakerName}</span>
            {message.round ? (
              <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px]">
                第 {message.round} 轮
              </span>
            ) : null}
          </>
        ) : (
          <span>{isUser ? "你" : "AI"}</span>
        )}
        {isUser && message.interjection ? (
          <span className="rounded-full bg-orange-soft px-1.5 py-0.5 text-[10px] text-orange-strong">
            插话
          </span>
        ) : null}
        {deepReply ? (
          <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px]">
            深层回复
          </span>
        ) : null}
        {canQuote ? (
          <button
            type="button"
            onClick={() => onQuoteMessage?.(message)}
            aria-label="引用这条消息"
            title="引用这条消息"
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted transition-opacity hover:bg-surface hover:text-ink sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
          >
            <Quote className="size-3.5" aria-hidden />
            引用
          </button>
        ) : null}
      </div>

      {isUser ? (
        <>
          {message.quote && !treeMode ? (
            <div className="ml-auto max-w-[85%]">
              <DiscussionQuote
                quote={message.quote}
                onJump={onJumpMessage}
              />
            </div>
          ) : null}
          <div
            className={cn(
              "whitespace-pre-wrap break-words rounded-2xl bg-orange-soft px-4 py-2.5 text-sm leading-7 text-ink",
              treeMode
                ? "mr-auto max-w-[85%] rounded-bl-md"
                : "ml-auto max-w-[85%] rounded-br-md",
            )}
          >
            {message.content}
          </div>
          {discussionMode && !treeMode ? (
            <MessageResponses
              message={message}
              messages={messages}
              participants={discussionParticipants}
              intents={discussionIntents}
              intentTargets={discussionIntentTargets}
              alignEnd
              onJump={onJumpMessage}
            />
          ) : null}
        </>
      ) : (
        <div className="max-w-full">
          {message.quote && !treeMode ? (
            <DiscussionQuote
              quote={message.quote}
              onJump={onJumpMessage}
            />
          ) : null}

          {message.reasoning && showReasoning ? (
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

          {discussionMode && !treeMode ? (
            <MessageResponses
              message={message}
              messages={messages}
              participants={discussionParticipants}
              intents={discussionIntents}
              intentTargets={discussionIntentTargets}
              alignEnd={false}
              onJump={onJumpMessage}
            />
          ) : null}

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
                      <p className="mt-0.5 text-muted">{source.snippet}</p>
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
            <p className="mt-1.5 text-xs text-orange-strong">生成中断</p>
          ) : null}
        </div>
      )}
    </>
  );
}
