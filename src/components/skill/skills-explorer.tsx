"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";

import { SkillGrid } from "@/components/skill/skill-grid";
import type { SkillCardData } from "@/components/skill/skill-card";
import {
  ReactionsProvider,
  useReactions,
} from "@/components/skill/reactions-context";
import { cn } from "@/lib/utils";

export type TagOption = {
  slug: string;
  label: string;
  count: number;
};

type SortOption = "default" | "latest" | "popular";

const SORT_LABELS: Record<SortOption, string> = {
  default: "默认排序",
  latest: "最近更新",
  popular: "最有用的",
};

export function SkillsExplorer({
  skills,
  tags,
}: {
  skills: SkillCardData[];
  tags: TagOption[];
}) {
  const ids = useMemo(() => skills.map((skill) => skill.slug), [skills]);
  return (
    <ReactionsProvider ids={ids}>
      <ExplorerInner skills={skills} tags={tags} />
    </ReactionsProvider>
  );
}

function ExplorerInner({
  skills,
  tags,
}: {
  skills: SkillCardData[];
  tags: TagOption[];
}) {
  const { getCount, getScore } = useReactions();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("default");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The query string is external state; read it on mount to keep the page static.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    const initialTag = params.get("tag");
    if (initialQuery) setQuery(initialQuery);
    if (initialTag) setSelectedTags([initialTag]);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedTags.length === 1) params.set("tag", selectedTags[0]);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [ready, query, selectedTags]);

  const fuse = useMemo(
    () =>
      new Fuse(skills, {
        keys: [
          { name: "shortTitle", weight: 0.42 },
          { name: "title", weight: 0.22 },
          { name: "tagLabels", weight: 0.2 },
          { name: "summary", weight: 0.16 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [skills],
  );

  const visible = useMemo(() => {
    const trimmed = deferredQuery.trim();
    const base = trimmed
      ? fuse.search(trimmed).map((result) => result.item)
      : [...skills];
    const tagFiltered =
      selectedTags.length > 0
        ? base.filter((skill) =>
            selectedTags.some((tag) => skill.tags.includes(tag)),
          )
        : base;

    if (sort === "latest") {
      return [...tagFiltered].sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) || a.order - b.order,
      );
    }

    if (sort === "popular") {
      return [...tagFiltered].sort((a, b) => {
        const scoreDiff = getScore(b.slug) - getScore(a.slug);
        if (Math.abs(scoreDiff) > 1e-9) return scoreDiff;
        const upDiff = getCount(b.slug).up - getCount(a.slug).up;
        if (upDiff !== 0) return upDiff;
        return a.order - b.order;
      });
    }

    if (!trimmed) {
      return [...tagFiltered].sort((a, b) => a.order - b.order);
    }

    return tagFiltered;
  }, [
    deferredQuery,
    fuse,
    getCount,
    getScore,
    selectedTags,
    skills,
    sort,
  ]);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  function clearFilters() {
    setQuery("");
    setSelectedTags([]);
    setSort("default");
  }

  const hasFilters = query.trim().length > 0 || selectedTags.length > 0;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索人物、主题或标签…"
              aria-label="搜索 Skill"
              className="h-11 w-full rounded-lg border border-line bg-bg pr-10 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-orange"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
                aria-label="清除搜索"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-xs text-muted">
            <span className="sr-only">排序方式</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-11 rounded-lg border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors hover:border-orange focus:border-orange"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag.slug);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => toggleTag(tag.slug)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-orange bg-orange-soft text-orange-strong"
                    : "border-line text-muted hover:border-orange hover:text-orange-strong",
                )}
              >
                {tag.label}
              </button>
            );
          })}
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted underline underline-offset-4 transition-colors hover:text-orange-strong"
            >
              清除筛选
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-line pb-3">
        <p className="text-xs text-muted" aria-live="polite">
          {visible.length} 个 Skill
        </p>
      </div>

      {visible.length > 0 ? (
        <SkillGrid
          skills={visible}
          columns={skills.length <= 4 ? 2 : 3}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-serif text-xl text-ink">没有匹配的 Skill</p>
          <p className="mt-2 text-sm text-muted">
            换个关键词，或者清除标签筛选再试。
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 text-sm text-orange-strong underline underline-offset-4"
          >
            清除筛选
          </button>
        </div>
      )}
    </div>
  );
}
