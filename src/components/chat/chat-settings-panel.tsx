"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CONTEXT_LIMITS,
  normalizeChatEndpoint,
  validateChatSettings,
  type ChatSettings,
  type ContextLimit,
  type ReasoningEffort,
} from "@/lib/chat-settings";
import { formatContextTokens } from "@/lib/chat-context";
import { cn } from "@/lib/utils";

export type SettingsField = "apiUrl" | "apiKey" | "model";

export type SettingsFieldError = {
  field: SettingsField;
  message: string;
} | null;

type ChatSettingsPanelProps = {
  settings: ChatSettings;
  draft: ChatSettings;
  onDraftChange: (draft: ChatSettings) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: ChatSettings) => void;
  onClear: () => void;
  storageWarning: string | null;
  externalError: SettingsFieldError;
};

const inputClass =
  "h-11 w-full rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-orange";

export function ChatSettingsPanel({
  settings,
  draft,
  onDraftChange,
  open,
  onOpenChange,
  onSave,
  onClear,
  storageWarning,
  externalError,
}: ChatSettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<SettingsFieldError>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const urlRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<number | null>(null);

  const displayedError = error ?? externalError;

  useEffect(() => {
    if (!externalError) return;
    onOpenChange(true);
    const ref =
      externalError.field === "apiUrl"
        ? urlRef
        : externalError.field === "apiKey"
          ? keyRef
          : modelRef;
    ref.current?.focus();
  }, [externalError, onOpenChange]);

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) {
        window.clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  const hasSavedKey = settings.apiKey.trim().length > 0;
  const normalized = normalizeChatEndpoint(draft.apiUrl);

  function focusField(field: SettingsField) {
    const ref =
      field === "apiUrl" ? urlRef : field === "apiKey" ? keyRef : modelRef;
    ref.current?.focus();
  }

  function update(field: "apiUrl" | "apiKey" | "model", value: string) {
    onDraftChange({ ...draft, [field]: value });
    setError(null);
    setSavedNotice(false);
  }

  function updateEffort(value: ReasoningEffort) {
    onDraftChange({ ...draft, reasoningEffort: value });
    setError(null);
    setSavedNotice(false);
  }

  function updateContextLimit(value: ContextLimit) {
    onDraftChange({ ...draft, contextLimit: value });
    setError(null);
    setSavedNotice(false);
  }

  function handleSave() {
    const result = validateChatSettings(draft);
    if (!result.ok) {
      setError({ field: result.field, message: result.error });
      focusField(result.field);
      return;
    }

    onSave(result.settings);
    setError(null);
    setSavedNotice(true);
    onOpenChange(false);

    if (noticeTimer.current !== null) {
      window.clearTimeout(noticeTimer.current);
    }
    noticeTimer.current = window.setTimeout(() => {
      setSavedNotice(false);
    }, 3000);
  }

  function handleClear() {
    onClear();
    setShowKey(false);
    setError(null);
    setSavedNotice(false);
  }

  if (hasSavedKey && !open) {
    const endpoint = normalizeChatEndpoint(settings.apiUrl);
    const host = endpoint.ok
      ? new URL(endpoint.endpoint).host
      : settings.apiUrl;

    return (
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Settings2 className="size-4 text-muted" aria-hidden />
              连接配置已保存在本机
            </p>
            <p className="mt-1 break-all text-xs leading-5 text-muted">
              {settings.model} · {host} · Key 已保存
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(true)}
            >
              修改
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              清除配置
            </Button>
          </div>
        </div>
        {storageWarning ? (
          <p className="mt-3 text-xs leading-5 text-orange-strong" role="status">
            {storageWarning}
          </p>
        ) : null}
        {savedNotice ? (
          <p className="mt-3 text-xs leading-5 text-muted" role="status">
            已保存到当前浏览器。
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section aria-labelledby="chat-settings-title" className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="chat-settings-title"
            className="flex items-center gap-2 font-serif text-lg tracking-tight text-ink"
          >
            <KeyRound className="size-4 text-muted" aria-hidden />
            连接你的模型
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            配置只保存在当前浏览器，不会上传到本站。
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="chat-api-url"
            className="text-xs font-medium text-ink"
          >
            API 地址
          </label>
          <input
            ref={urlRef}
            id="chat-api-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={draft.apiUrl}
            onChange={(event) => update("apiUrl", event.target.value)}
            aria-invalid={displayedError?.field === "apiUrl" || undefined}
            aria-describedby="chat-api-url-hint"
            placeholder="https://api.example.com"
            className={cn(
              inputClass,
              "mt-1.5",
              displayedError?.field === "apiUrl" && "border-orange-strong",
            )}
          />
          <p
            id="chat-api-url-hint"
            className="mt-1.5 break-all font-mono text-[11px] leading-5 text-muted"
          >
            {normalized.ok ? (
              <>
                实际请求：{normalized.endpoint}
                {normalized.insecure ? "（本机 HTTP，仅用于开发）" : ""}
              </>
            ) : draft.apiUrl.trim() ? (
              <span className="text-orange-strong">{normalized.error}</span>
            ) : (
              "支持任意 OpenAI 兼容平台；默认地址可直接使用。"
            )}
          </p>
        </div>

        <div>
          <label
            htmlFor="chat-api-key"
            className="text-xs font-medium text-ink"
          >
            API Key
          </label>
          <div className="relative mt-1.5">
            <input
              ref={keyRef}
              id="chat-api-key"
              type={showKey ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={draft.apiKey}
              onChange={(event) => update("apiKey", event.target.value)}
              aria-invalid={displayedError?.field === "apiKey" || undefined}
              placeholder="sk-..."
              className={cn(
                inputClass,
                "pr-11",
                displayedError?.field === "apiKey" && "border-orange-strong",
              )}
            />
            <button
              type="button"
              onClick={() => setShowKey((value) => !value)}
              aria-label={showKey ? "隐藏 API Key" : "显示 API Key"}
              aria-pressed={showKey}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted transition-colors hover:text-ink"
            >
              {showKey ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            填入对应平台的 API Key；明文保存在浏览器。
          </p>
        </div>

        <div>
          <label htmlFor="chat-model" className="text-xs font-medium text-ink">
            模型
          </label>
          <input
            ref={modelRef}
            id="chat-model"
            type="text"
            spellCheck={false}
            list="chat-model-options"
            value={draft.model}
            onChange={(event) => update("model", event.target.value)}
            aria-invalid={displayedError?.field === "model" || undefined}
            placeholder="模型名称"
            className={cn(
              inputClass,
              "mt-1.5",
              displayedError?.field === "model" && "border-orange-strong",
            )}
          />
          <datalist id="chat-model-options">
            <option value="deepseek-flash" />
            <option value="deepseek-v4-pro" />
          </datalist>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            默认模型支持思考模式，思考过程会自动显示；也可填写其他平台的模型名。
          </p>
        </div>

        <div>
          <label
            htmlFor="chat-reasoning-effort"
            className="text-xs font-medium text-ink"
          >
            思考强度
          </label>
          <select
            id="chat-reasoning-effort"
            value={draft.reasoningEffort}
            onChange={(event) =>
              updateEffort(event.target.value as ReasoningEffort)
            }
            className={cn(inputClass, "mt-1.5")}
          >
            <option value="default">默认（由平台决定）</option>
            <option value="low">低</option>
            <option value="high">高</option>
            <option value="max">最高</option>
          </select>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            仅对支持思考模式的模型生效；默认不发送该参数。
          </p>
        </div>

        <div>
          <label
            htmlFor="chat-context-limit"
            className="text-xs font-medium text-ink"
          >
            上下文上限
          </label>
          <select
            id="chat-context-limit"
            value={draft.contextLimit}
            onChange={(event) =>
              updateContextLimit(Number(event.target.value) as ContextLimit)
            }
            className={cn(inputClass, "mt-1.5")}
          >
            {CONTEXT_LIMITS.map((limit) => (
              <option key={limit} value={limit}>
                {formatContextTokens(limit)}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            按估算 token 计算；达到 80% 会自动压缩早期对话。
          </p>
        </div>
      </div>

      {displayedError ? (
        <p className="mt-3 text-xs leading-5 text-orange-strong" role="alert">
          {displayedError.message}
        </p>
      ) : null}
      {storageWarning ? (
        <p className="mt-3 text-xs leading-5 text-orange-strong" role="status">
          {storageWarning}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={handleSave}>
          保存配置
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          清除配置
        </Button>
        {savedNotice ? (
          <span className="text-xs text-muted" role="status">
            已保存到当前浏览器。
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-muted">
        本站不提供 Key，也不代管请求。请勿在公共设备上保存。
      </p>
      <p className="mt-1 text-[11px] leading-5 text-muted">
        联网搜索默认开启，会调用所填 API 的 /v1/tools/search；平台不支持时请关闭。可在输入框下方切换。
      </p>
    </section>
  );
}
