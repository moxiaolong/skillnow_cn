import { ArrowDown } from "lucide-react";

import type { ReaderBrief as ReaderBriefData } from "@/lib/schema";

export function ReaderBrief({
  brief,
  anchorId,
}: {
  brief: ReaderBriefData;
  anchorId?: string;
}) {
  return (
    <section className="not-prose" aria-labelledby="reader-brief-title">
      <h2
        id="reader-brief-title"
        className="font-serif text-2xl tracking-tight text-ink"
      >
        读给自己
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        不用 AI，也可以直接读这套方法。
      </p>

      <div className="mt-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] sm:gap-6">
          <div>
            <p className="text-xs font-medium text-muted">方法要点</p>
            <ol className="mt-3 space-y-3">
              {brief.takeaways.map((takeaway, index) => (
                <li key={takeaway} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-soft text-[10px] font-medium text-orange-strong"
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm leading-6 text-ink">{takeaway}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-line pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
            <p className="text-xs font-medium text-orange-strong">
              拿它想一件自己的事
            </p>
            <p className="mt-2 font-serif text-base leading-7 text-ink">
              {brief.question}
            </p>
          </div>
        </div>
      </div>

      {anchorId ? (
        <a
          href={`#${anchorId}`}
          className="group mt-3 inline-flex items-center gap-1 text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-orange-strong"
        >
          跳到全文的「核心心智模型」
          <ArrowDown
            className="size-3.5 transition-transform group-hover:translate-y-0.5"
            aria-hidden
          />
        </a>
      ) : null}
    </section>
  );
}
