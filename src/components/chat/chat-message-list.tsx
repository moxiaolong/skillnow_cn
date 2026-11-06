"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronRight, MessageSquare } from "lucide-react";

import { ChatMessageItem } from "@/components/chat/chat-message-item";
import type { ChatMessage } from "@/lib/chat-history";
import type {
  DiscussionIntentStatus,
  DiscussionParticipant,
} from "@/lib/chat-discussion";
import {
  buildMessageForest,
  getThreadAncestors,
  type ThreadNode,
} from "@/lib/chat-thread";
import { cn } from "@/lib/utils";

export type ChatView = "timeline" | "tree";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
  searching: boolean;
  loading: boolean;
  skillMode: boolean;
  discussionMode?: boolean;
  discussionParticipants?: DiscussionParticipant[];
  discussionIntents?: Record<string, DiscussionIntentStatus>;
  discussionIntentTargets?: Record<string, string>;
  view?: ChatView;
  showReasoning?: boolean;
  retryableMessageId?: string | null;
  onAnnounce?: (text: string) => void;
  onPickExample: (text: string) => void;
  onQuoteMessage?: (message: ChatMessage) => void;
  onRetryMessage?: (messageId: string) => void;
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

const DISCUSSION_EXAMPLES = [
  "AI 会取代心理咨询师吗？",
  "人应该如何面对失败？",
  "自由意志真的存在吗？",
];

export function ChatMessageList({
  messages,
  isStreaming,
  searching,
  loading,
  skillMode,
  discussionMode = false,
  discussionParticipants = [],
  discussionIntents = {},
  discussionIntentTargets = {},
  view = "timeline",
  showReasoning = true,
  retryableMessageId,
  onAnnounce,
  onPickExample,
  onQuoteMessage,
  onRetryMessage,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const userCountRef = useRef(0);
  const highlightTimerRef = useRef<number | null>(null);
  const pendingScrollRef = useRef<{
    id: string;
    smooth: boolean;
    highlight: boolean;
  } | null>(null);
  const autoStreamingIdRef = useRef<string | null>(null);
  const previousTreeRef = useRef(false);

  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(),
  );
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);

  const isTree = discussionMode && view === "tree";
  const forest = useMemo(() => buildMessageForest(messages), [messages]);
  const streamingId =
    messages.find((message) => message.status === "streaming")?.id ?? null;

  const userCount = messages.reduce(
    (count, message) => (message.role === "user" ? count + 1 : count),
    0,
  );

  const scrollToMessage = useCallback(
    (messageId: string, behavior: ScrollBehavior): boolean => {
      const list = listRef.current;
      const element = document.getElementById(
        `chat-message-${messageId}`,
      );
      if (!list || !element) return false;

      const listRect = list.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const top =
        list.scrollTop + elementRect.top - listRect.top - 16;
      list.scrollTo({ top: Math.max(0, top), behavior });
      return true;
    },
    [],
  );

  const flash = useCallback((messageId: string) => {
    setHighlightId(messageId);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightId(null);
      highlightTimerRef.current = null;
    }, 1600);
  }, []);

  const revealAndJump = useCallback(
    (messageId: string) => {
      if (!messages.some((message) => message.id === messageId)) {
        onAnnounce?.("原消息已省略，无法跳转。");
        return;
      }

      if (isTree) {
        const ancestors = getThreadAncestors(forest, messageId);
        setCollapsed((current) => {
          const next = new Set(current);
          let changed = false;
          for (const ancestor of ancestors) {
            if (next.delete(ancestor)) changed = true;
          }
          return changed ? next : current;
        });
      }

      stickToBottomRef.current = false;
      pendingScrollRef.current = {
        id: messageId,
        smooth: true,
        highlight: true,
      };
      setScrollTick((value) => value + 1);

      window.setTimeout(() => {
        if (pendingScrollRef.current?.id === messageId) {
          pendingScrollRef.current = null;
          onAnnounce?.("原消息已省略，无法跳转。");
        }
      }, 700);
    },
    [forest, isTree, messages, onAnnounce],
  );

  const toggleCollapse = useCallback((messageId: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  // Expanding ancestors and scrolling are external DOM synchronization.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const element = listRef.current;
    if (!element || messages.length === 0) return;

    const userAdded = userCount > userCountRef.current;
    if (userAdded) stickToBottomRef.current = true;
    userCountRef.current = userCount;

    if (!isTree) {
      if (stickToBottomRef.current) {
        element.scrollTop = element.scrollHeight;
      }
      return;
    }

    if (userAdded) {
      const last = messages[messages.length - 1];
      if (last) {
        if (isTree) {
          const ancestors = getThreadAncestors(forest, last.id);
          setCollapsed((current) => {
            const next = new Set(current);
            let changed = false;
            for (const ancestor of ancestors) {
              if (next.delete(ancestor)) changed = true;
            }
            return changed ? next : current;
          });
        }
        pendingScrollRef.current = {
          id: last.id,
          smooth: false,
          highlight: false,
        };
        setScrollTick((value) => value + 1);
      }
    } else {
      const last = messages[messages.length - 1];
      if (
        last?.kind === "discussion-note" &&
        stickToBottomRef.current
      ) {
        pendingScrollRef.current = {
          id: last.id,
          smooth: false,
          highlight: false,
        };
        setScrollTick((value) => value + 1);
      }
    }
  }, [forest, isTree, messages, userCount]);

  useEffect(() => {
    if (!isTree || !streamingId) {
      if (!streamingId) autoStreamingIdRef.current = null;
      return;
    }
    if (autoStreamingIdRef.current === streamingId) return;
    autoStreamingIdRef.current = streamingId;
    if (!stickToBottomRef.current) return;

    const ancestors = getThreadAncestors(forest, streamingId);
    setCollapsed((current) => {
      const next = new Set(current);
      let changed = false;
      for (const ancestor of ancestors) {
        if (next.delete(ancestor)) changed = true;
      }
      return changed ? next : current;
    });
    pendingScrollRef.current = {
      id: streamingId,
      smooth: false,
      highlight: false,
    };
    setScrollTick((value) => value + 1);
  }, [forest, isTree, streamingId]);

  useEffect(() => {
    if (!isTree || !streamingId || !stickToBottomRef.current) return;
    scrollToMessage(streamingId, "auto");
  }, [isTree, messages, scrollToMessage, streamingId]);

  useEffect(() => {
    if (isTree && !previousTreeRef.current) {
      stickToBottomRef.current = true;
      const target = streamingId ?? messages[messages.length - 1]?.id;
      if (target) {
        const ancestors = getThreadAncestors(forest, target);
        setCollapsed((current) => {
          const next = new Set(current);
          for (const ancestor of ancestors) next.delete(ancestor);
          return next.size === current.size ? current : next;
        });
        pendingScrollRef.current = {
          id: target,
          smooth: false,
          highlight: false,
        };
        setScrollTick((value) => value + 1);
      }
    } else if (!isTree && previousTreeRef.current) {
      stickToBottomRef.current = true;
      const target = streamingId ?? messages[messages.length - 1]?.id;
      if (target) {
        pendingScrollRef.current = {
          id: target,
          smooth: false,
          highlight: false,
        };
        setScrollTick((value) => value + 1);
      }
    }
    previousTreeRef.current = isTree;
  }, [forest, isTree, messages, streamingId]);

  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (!pending) return;
    if (!scrollToMessage(pending.id, pending.smooth ? "smooth" : "auto")) {
      return;
    }

    pendingScrollRef.current = null;
    if (pending.highlight) flash(pending.id);
  }, [collapsed, flash, isTree, messages, scrollTick, scrollToMessage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  function handleScroll() {
    const element = listRef.current;
    if (!element) return;
    stickToBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 64;
  }

  const examples = discussionMode
    ? DISCUSSION_EXAMPLES
    : skillMode
      ? SKILL_EXAMPLES
      : GENERAL_EXAMPLES;

  function renderNote(message: ChatMessage): ReactNode {
    return (
      <div
        key={message.id}
        id={`chat-message-${message.id}`}
        className={cn(
          "flex items-center gap-3 py-1",
          highlightId === message.id &&
            "rounded-xl ring-2 ring-orange/40 ring-offset-2 ring-offset-bg",
        )}
      >
        <span className="h-px flex-1 bg-line" aria-hidden />
        <p className="max-w-[85%] text-center text-[11px] leading-5 text-muted">
          {message.content}
        </p>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
    );
  }

  function renderSummary(message: ChatMessage): ReactNode {
    return (
      <details
        key={message.id}
        id={`chat-message-${message.id}`}
        className={cn(
          "rounded-xl border border-dashed border-line bg-surface px-3 py-2",
          highlightId === message.id &&
            "ring-2 ring-orange/40 ring-offset-2 ring-offset-bg",
        )}
      >
        <summary className="cursor-pointer text-xs text-muted">
          早期对话摘要
        </summary>
        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-ink">
          {message.content}
        </p>
      </details>
    );
  }

  function renderItem(
    message: ChatMessage,
    options: { treeMode?: boolean; treeDepth?: number } = {},
  ): ReactNode {
    return (
      <ChatMessageItem
        message={message}
        messages={messages}
        searching={searching}
        discussionMode={discussionMode}
        discussionParticipants={discussionParticipants}
        discussionIntents={discussionIntents}
        discussionIntentTargets={discussionIntentTargets}
        treeMode={options.treeMode}
        treeDepth={options.treeDepth}
        showReasoning={showReasoning}
        retryableMessageId={retryableMessageId}
        onJumpMessage={revealAndJump}
        onQuoteMessage={onQuoteMessage}
        onRetryMessage={onRetryMessage}
      />
    );
  }

  function renderTree(node: ThreadNode): ReactNode {
    const hasChildren = node.children.length > 0;
    const nodeCollapsed = collapsed.has(node.message.id);
    const highlighted = highlightId === node.message.id;

    return (
      <li
        key={node.message.id}
        id={`chat-message-${node.message.id}`}
        className={cn(
          "min-w-0",
          highlighted &&
            "rounded-xl ring-2 ring-orange/40 ring-offset-2 ring-offset-bg",
        )}
      >
        <div className="flex min-w-0 items-start gap-1.5">
          <div className="mt-0.5 w-7 shrink-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapse(node.message.id)}
                aria-expanded={!nodeCollapsed}
                aria-label={
                  nodeCollapsed
                    ? `展开 ${node.children.length} 条回复`
                    : `收起 ${node.children.length} 条回复`
                }
                className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                {nodeCollapsed ? (
                  <ChevronRight className="size-4" aria-hidden />
                ) : (
                  <ChevronDown className="size-4" aria-hidden />
                )}
              </button>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            {renderItem(node.message, {
              treeMode: true,
              treeDepth: node.depth,
            })}
            {node.orphan ? (
              <p className="mt-1 text-[11px] text-muted">
                原消息已省略
              </p>
            ) : null}
            {hasChildren && nodeCollapsed ? (
              <p className="mt-1.5 text-[11px] text-muted">
                {node.children.length} 条回复已折叠
              </p>
            ) : null}
          </div>
        </div>

        {hasChildren && !nodeCollapsed ? (
          <ul
            className={cn(
              "mt-3 space-y-3 border-l border-line pl-3 sm:pl-4",
              node.depth < 4 ? "ml-3 sm:ml-4" : "ml-0",
            )}
          >
            {node.children.map((child) => renderTree(child))}
          </ul>
        ) : null}
      </li>
    );
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
            {discussionMode
              ? "提出一个问题，参与者会依次发言并相互回应。"
              : "下面是一些例子，点击填入输入框。"}
          </p>
          <ul className="mt-5 w-full max-w-md space-y-2">
            {examples.map((example) => (
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
      ) : isTree ? (
        <div className="space-y-5">
          {forest.summaries.map(renderSummary)}
          <ul className="space-y-5">
            {forest.roots.map((node) => renderTree(node))}
          </ul>
          {forest.notes.map(renderNote)}
        </div>
      ) : (
        <div className="space-y-5">
          {messages.map((message) => {
            if (message.kind === "discussion-note") {
              return renderNote(message);
            }
            if (message.kind === "summary") {
              return renderSummary(message);
            }

            return (
              <div
                key={message.id}
                id={`chat-message-${message.id}`}
                className={cn(
                  highlightId === message.id &&
                    "rounded-xl ring-2 ring-orange/40 ring-offset-2 ring-offset-bg",
                )}
              >
                {renderItem(message)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
