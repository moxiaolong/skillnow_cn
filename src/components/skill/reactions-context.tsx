"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { bayesianScore } from "@/lib/reactions";

export type VoteAction = "up" | "down";
export type ReactionCount = { up: number; down: number };

type VoteRecord = { date: string; action: VoteAction };

type ReactionsContextValue = {
  counts: Record<string, ReactionCount>;
  loading: boolean;
  offline: boolean;
  voted: Record<string, VoteAction | undefined>;
  getCount: (slug: string) => ReactionCount;
  getScore: (slug: string) => number;
  vote: (slug: string, action: VoteAction) => Promise<void>;
};

const ReactionsContext = createContext<ReactionsContextValue | null>(null);

const VOTES_KEY = "skillnow:votes";

function todayInShanghai(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function readVotes(): Record<string, VoteRecord> {
  try {
    const raw = window.localStorage.getItem(VOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeVotes(votes: Record<string, VoteRecord>): void {
  try {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch {
    // Ignore storage failures; the UI still works for this session.
  }
}

function normalizeCounts(
  payload: unknown,
  ids: string[],
): Record<string, ReactionCount> {
  const record =
    payload && typeof payload === "object"
      ? ((payload as { counts?: unknown }).counts ?? payload)
      : {};
  const source =
    record && typeof record === "object"
      ? (record as Record<string, unknown>)
      : {};

  const next: Record<string, ReactionCount> = {};
  for (const id of ids) {
    const value = source[id];
    if (value && typeof value === "object") {
      const up = Number((value as { up?: unknown }).up);
      const down = Number((value as { down?: unknown }).down);
      next[id] = {
        up: Number.isFinite(up) ? Math.max(0, up) : 0,
        down: Number.isFinite(down) ? Math.max(0, down) : 0,
      };
    } else {
      next[id] = { up: 0, down: 0 };
    }
  }
  return next;
}

export function ReactionsProvider({
  ids,
  children,
}: {
  ids: string[];
  children: ReactNode;
}) {
  const idsKey = ids.join(",");
  const idList = useMemo(() => idsKey.split(",").filter(Boolean), [idsKey]);
  const [counts, setCounts] = useState<Record<string, ReactionCount>>({});
  const [loading, setLoading] = useState(idList.length > 0);
  const [offline, setOffline] = useState(false);
  const [voted, setVoted] = useState<Record<string, VoteAction | undefined>>({});

  useEffect(() => {
    const today = todayInShanghai();
    const stored = readVotes();
    const valid: Record<string, VoteAction> = {};
    for (const [slug, record] of Object.entries(stored)) {
      if (record?.date === today && (record.action === "up" || record.action === "down")) {
        valid[slug] = record.action;
      }
    }
    // Reading the browser's stored votes is external state, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoted(valid);
    setCounts((current) => {
      const next = { ...current };
      for (const [slug, action] of Object.entries(valid)) {
        const existing = next[slug];
        if (!existing || (existing.up === 0 && existing.down === 0)) {
          next[slug] = {
            up: action === "up" ? 1 : 0,
            down: action === "down" ? 1 : 0,
          };
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (idList.length === 0) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    fetch(`/api/reactions?ids=${encodeURIComponent(idList.join(","))}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (cancelled) return;
        setCounts(normalizeCounts(payload, idList));
        setOffline(false);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idList]);

  const refreshCounts = useCallback(async (slug: string) => {
    try {
      const response = await fetch(
        `/api/reactions?ids=${encodeURIComponent(slug)}`,
        { headers: { accept: "application/json" }, cache: "no-store" },
      );
      if (!response.ok) return;
      const payload = (await response.json()) as unknown;
      const next = normalizeCounts(payload, [slug]);
      setCounts((current) => ({ ...current, ...next }));
    } catch {
      // Keep the optimistic state.
    }
  }, []);

  const vote = useCallback(
    async (slug: string, action: VoteAction) => {
      if (voted[slug]) return;

      const today = todayInShanghai();
      const stored = readVotes();
      stored[slug] = { date: today, action };
      writeVotes(stored);
      setVoted((current) => ({ ...current, [slug]: action }));

      setCounts((current) => {
        const previous = current[slug] ?? { up: 0, down: 0 };
        return {
          ...current,
          [slug]: { ...previous, [action]: previous[action] + 1 },
        };
      });

      try {
        const response = await fetch("/api/reactions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, action }),
        });

        if (response.status === 409) {
          await refreshCounts(slug);
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as unknown;
        const next = normalizeCounts(payload, [slug]);
        setCounts((current) => ({ ...current, ...next }));
        setOffline(false);
      } catch {
        setOffline(true);
      }
    },
    [refreshCounts, voted],
  );

  const getCount = useCallback(
    (slug: string): ReactionCount => counts[slug] ?? { up: 0, down: 0 },
    [counts],
  );

  const getScore = useCallback(
    (slug: string): number => {
      const { up, down } = getCount(slug);
      return bayesianScore(up, down);
    },
    [getCount],
  );

  const value = useMemo<ReactionsContextValue>(
    () => ({
      counts,
      loading,
      offline,
      voted,
      getCount,
      getScore,
      vote,
    }),
    [counts, loading, offline, voted, getCount, getScore, vote],
  );

  return (
    <ReactionsContext.Provider value={value}>
      {children}
    </ReactionsContext.Provider>
  );
}

export function useReactions(): ReactionsContextValue {
  const value = useContext(ReactionsContext);
  if (!value) {
    throw new Error("useReactions must be used inside a ReactionsProvider");
  }
  return value;
}
