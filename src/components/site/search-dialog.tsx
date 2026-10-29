"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SearchItem = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  tags: string[];
  tagLabels: string[];
  headings: string[];
  url: string;
};

type SearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const fetchStartedRef = useRef(false);
  const [index, setIndex] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open || index || error || fetchStartedRef.current) return;
    fetchStartedRef.current = true;
    setLoading(true);

    fetch("/search-index.json")
      .then((response) => {
        if (!response.ok) throw new Error("search index unavailable");
        return response.json() as Promise<SearchItem[]>;
      })
      .then((data) => {
        setIndex(data);
        setLoading(false);
      })
      .catch(() => {
        fetchStartedRef.current = false;
        setError(true);
        setLoading(false);
      });
  }, [open, index, error]);

  const fuse = useMemo(() => {
    if (!index) return null;
    return new Fuse(index, {
      keys: [
        { name: "shortTitle", weight: 0.38 },
        { name: "title", weight: 0.24 },
        { name: "tagLabels", weight: 0.18 },
        { name: "summary", weight: 0.12 },
        { name: "headings", weight: 0.08 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [index]);

  const results = useMemo(() => {
    if (!index) return [];
    const trimmed = query.trim();
    if (!trimmed) return index.slice(0, 6);
    if (!fuse) return [];
    return fuse.search(trimmed).slice(0, 8).map((result) => result.item);
  }, [index, fuse, query]);

  const safeActiveIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  useEffect(() => {
    if (!open) return;
    const element = document.getElementById(
      `search-result-${safeActiveIndex}`,
    );
    element?.scrollIntoView({ block: "nearest" });
  }, [safeActiveIndex, open]);

  function resetSearch() {
    setQuery("");
    setActiveIndex(0);
  }

  function openItem(item: SearchItem) {
    resetSearch();
    onOpenChange(false);
    router.push(item.url);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + results.length) % results.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = results[safeActiveIndex] ?? results[0];
      if (item) openItem(item);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetSearch();
        onOpenChange(next);
      }}
    >
      <DialogContent className="top-[12vh] max-w-xl overflow-hidden p-0" hideClose>
        <DialogTitle className="sr-only">搜索 Skill</DialogTitle>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索 Skill、人物或主题…"
            aria-label="搜索 Skill"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:inline-block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              正在加载索引…
            </div>
          ) : error ? (
            <div className="px-3 py-12 text-center text-sm text-muted">
              搜索索引加载失败，请刷新页面重试。
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-12 text-center text-sm text-muted">
              没有找到匹配的 Skill，试试人物名或标签。
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((item, itemIndex) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    id={`search-result-${itemIndex}`}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    onClick={() => openItem(item)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                      itemIndex === safeActiveIndex
                        ? "bg-surface"
                        : "hover:bg-surface",
                    )}
                  >
                    <span className="mt-1 font-mono text-[10px] text-muted">
                      {String(itemIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="font-serif text-base font-semibold text-ink">
                          {item.shortTitle}
                        </span>
                        <span className="truncate text-[11px] text-muted">
                          {item.title}
                        </span>
                      </span>
                      <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted">
                        {item.summary}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.tagLabels.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="mt-1 size-3.5 shrink-0 text-muted"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[10px] text-muted">
          <span>↑↓ 选择 · Enter 打开</span>
          <span>{index ? `${index.length} 个 Skill` : "—"}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
