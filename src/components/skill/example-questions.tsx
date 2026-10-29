"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { track } from "@/lib/analytics";
import { writeClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export function ExampleQuestions({
  examples,
  slug,
}: {
  examples: string[];
  slug: string;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const visible = examples.slice(0, 3);

  if (visible.length === 0) return null;

  async function copy(text: string, index: number) {
    try {
      await writeClipboard(text);
      setCopied(index);
      track("example_copy", { slug });
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="not-prose" aria-labelledby="examples-title">
      <h2
        id="examples-title"
        className="font-serif text-2xl tracking-tight text-ink"
      >
        可以这样问
      </h2>

      <ul className="mt-5 space-y-2">
        {visible.map((example, index) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => copy(example, index)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-orange hover:bg-bg",
                copied === index && "border-orange bg-bg",
              )}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-soft text-[10px] font-medium text-orange-strong">
                {index + 1}
              </span>
              <span className="flex-1 text-sm leading-6 text-ink">
                {example}
              </span>
              <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs text-muted transition-colors group-hover:text-orange-strong">
                {copied === index ? (
                  <>
                    <Check className="size-3" aria-hidden />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="size-3" aria-hidden />
                    复制
                  </>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <span className="sr-only" aria-live="polite">
        {copied !== null ? "已复制示例问题" : ""}
      </span>
    </section>
  );
}
