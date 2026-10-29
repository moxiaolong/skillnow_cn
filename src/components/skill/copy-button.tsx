"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { writeClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export function CopyButton({
  url,
  label,
  copiedLabel = "已复制",
  slug,
  format,
  variant = "outline",
  size = "default",
  className,
}: {
  url: string;
  label: string;
  copiedLabel?: string;
  slug: string;
  format: "prompt" | "skill-md";
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">(
    "idle",
  );
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  async function copy() {
    setState("loading");
    setFallbackText(null);
    let text = "";

    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      text = await response.text();
      await writeClipboard(text);
      setState("copied");
      track("skill_copy", { slug, format });
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      if (text) {
        setFallbackText(text);
        setState("idle");
      } else {
        setState("error");
        window.setTimeout(() => setState("idle"), 2500);
      }
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={copy}
        disabled={state === "loading"}
        aria-live="polite"
        data-copy-format={format}
      >
        {state === "loading" ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : state === "copied" ? (
          <Check aria-hidden />
        ) : (
          <Copy aria-hidden />
        )}
        {state === "copied"
          ? copiedLabel
          : state === "error"
            ? "复制失败"
            : label}
      </Button>

      {fallbackText ? (
        <div className="w-full">
          <p className="text-[11px] leading-5 text-muted">
            浏览器未允许自动复制，请手动全选复制：
          </p>
          <textarea
            readOnly
            value={fallbackText}
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
            aria-label="待复制内容"
            className="mt-1 h-32 w-full rounded-lg border border-line bg-surface p-2 font-mono text-[11px] leading-5 text-ink"
          />
        </div>
      ) : null}
    </div>
  );
}
