"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="回到顶部"
      className="fixed right-5 bottom-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-muted shadow-sm transition-colors hover:border-orange hover:text-orange-strong"
    >
      <ArrowUp className="size-4" aria-hidden />
    </button>
  );
}
