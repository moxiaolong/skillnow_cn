"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/markdown";

export function TableOfContents({ items: allItems }: { items: TocItem[] }) {
  const items = useMemo(
    () => allItems.filter((item) => item.level === 2).slice(0, 8),
    [allItems],
  );
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;

    function update() {
      const offset = 120;
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const element = document.getElementById(item.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= offset) {
          current = item.id;
        } else {
          break;
        }
      }
      setActiveId(current);
      frame = 0;
    }

    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="文章目录" className="text-xs">
      <p className="mb-3 text-xs text-muted">目录</p>
      <ul className="border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l border-transparent py-1 pl-3 leading-5 transition-colors hover:text-ink",
                activeId === item.id
                  ? "border-orange text-orange-strong"
                  : "text-muted",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
