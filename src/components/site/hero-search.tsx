"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed ? `/skills/?q=${encodeURIComponent(trimmed)}` : "/skills/",
    );
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="relative w-full sm:max-w-xs"
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜索人物、主题或标签"
        aria-label="搜索 Skill"
        className="h-11 w-full rounded-lg border border-line bg-bg pr-3 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-orange"
      />
      <button type="submit" className="sr-only">
        搜索
      </button>
    </form>
  );
}
