"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FAVORITES_KEY = "skillnow:favorites";

function readFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeFavorites(items: string[]): void {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures.
  }
}

export function FavoriteButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // localStorage is external state; read it after mount to keep SSR output stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readFavorites().includes(slug));
  }, [slug]);

  function toggle() {
    const current = readFavorites();
    const next = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug];
    writeFavorites(next);
    setSaved(next.includes(slug));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="default"
      className={cn(saved && "text-orange-strong", className)}
      onClick={toggle}
      aria-pressed={saved}
    >
      <Heart className={saved ? "fill-current" : undefined} aria-hidden />
      {saved ? "已收藏" : "收藏"}
    </Button>
  );
}
