export const PINS_STORAGE_KEY = "skillnow:pins:v1";

export type ReadStorageLike = Pick<Storage, "getItem">;
export type WriteStorageLike = Pick<Storage, "setItem">;

const EMPTY_PINS: string[] = [];

export function parsePins(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        seen.add(item.trim());
      }
    }
    return [...seen];
  } catch {
    return [];
  }
}

export function readPins(storage: ReadStorageLike): string[] {
  try {
    return parsePins(storage.getItem(PINS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writePins(
  slugs: readonly string[],
  storage: WriteStorageLike,
): void {
  storage.setItem(PINS_STORAGE_KEY, JSON.stringify(slugs));
}

export function togglePinSlug(
  current: readonly string[],
  slug: string,
): string[] {
  return current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];
}

// Client-side store shared by every PinButton and the skills list.
let snapshot: string[] | null = null;const listeners = new Set<() => void>();
let storageListenerAttached = false;

function readBrowserPins(): string[] {
  if (typeof window === "undefined") return EMPTY_PINS;
  try {
    return readPins(window.localStorage);
  } catch {
    return EMPTY_PINS;
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== PINS_STORAGE_KEY) return;
  snapshot = readBrowserPins();
  notify();
}

function attachStorageListener(): void {
  if (storageListenerAttached || typeof window === "undefined") return;
  window.addEventListener("storage", handleStorage);
  storageListenerAttached = true;
}

export function getPinsSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY_PINS;
  if (snapshot === null) snapshot = readBrowserPins();
  return snapshot;
}

export function getServerPinsSnapshot(): string[] {
  return EMPTY_PINS;
}

export function subscribePins(listener: () => void): () => void {
  attachStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function togglePin(slug: string): void {
  const next = togglePinSlug(getPinsSnapshot(), slug);
  snapshot = next;
  try {
    writePins(next, window.localStorage);
  } catch {
    // Ignore storage failures; the in-memory state still updates.
  }
  notify();
}
