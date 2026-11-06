"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Globe, Send, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  searchEnabled: boolean;
  onToggleSearch: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  searchEnabled,
  onToggleSearch,
  textareaRef,
  placeholder,
}: ChatComposerProps) {
  const composingRef = useRef(false);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [value, textareaRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (
      event.nativeEvent.isComposing ||
      composingRef.current ||
      event.keyCode === 229
    ) {
      return;
    }

    event.preventDefault();
    if (!isStreaming && !disabled) onSubmit();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isStreaming && !disabled) onSubmit();
      }}
      className="border-t border-line bg-bg px-3 pb-3 pt-3"
    >
      <label htmlFor="chat-input" className="sr-only">
        输入消息
      </label>
      <textarea
        ref={textareaRef}
        id="chat-input"
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="max-h-40 min-h-[44px] w-full resize-none rounded-lg border border-line bg-bg px-3 py-2.5 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-muted focus:border-orange disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleSearch}
            disabled={disabled || isStreaming}
            aria-pressed={searchEnabled}
            title="让模型检索实时网页"
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              searchEnabled
                ? "border-orange bg-orange-soft text-orange-strong"
                : "border-line text-muted hover:border-orange hover:text-orange-strong",
            )}
          >
            <Globe className="size-3.5" aria-hidden />
            联网搜索
          </button>
          <p className="hidden text-[11px] text-muted sm:block">
            Enter 发送 · Shift + Enter 换行
          </p>
        </div>
        {isStreaming ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStop}
            className="ml-auto"
          >
            <Square aria-hidden />
            停止
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            disabled={!value.trim() || disabled}
            className="ml-auto"
          >
            <Send aria-hidden />
            发送
          </Button>
        )}
      </div>
    </form>
  );
}
