import { describe, expect, it } from "vitest";

import {
  PINS_STORAGE_KEY,
  parsePins,
  readPins,
  togglePinSlug,
  writePins,
} from "@/lib/pins";

class MemoryStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("parsePins", () => {
  it("returns an empty array for missing or invalid data", () => {
    expect(parsePins(null)).toEqual([]);
    expect(parsePins("")).toEqual([]);
    expect(parsePins("not-json")).toEqual([]);
    expect(parsePins('{"slug":"sigmund-freud"}')).toEqual([]);
  });

  it("keeps string slugs, trims them, and removes duplicates", () => {
    expect(
      parsePins('["sigmund-freud"," carl-jung ","sigmund-freud",42,null]'),
    ).toEqual(["sigmund-freud", "carl-jung"]);
  });
});

describe("pin storage", () => {
  it("reads and writes the stored slugs", () => {
    const storage = new MemoryStorage();
    writePins(["carl-jung", "sigmund-freud"], storage);

    expect(storage.getItem(PINS_STORAGE_KEY)).toBe(
      '["carl-jung","sigmund-freud"]',
    );
    expect(readPins(storage)).toEqual(["carl-jung", "sigmund-freud"]);
  });

  it("returns an empty array when storage fails", () => {
    const storage = {
      getItem() {
        throw new Error("unavailable");
      },
    };

    expect(readPins(storage)).toEqual([]);
  });
});

describe("togglePinSlug", () => {
  it("adds and removes a slug without mutating the original list", () => {
    const current = ["carl-jung"];
    expect(togglePinSlug(current, "sigmund-freud")).toEqual([
      "carl-jung",
      "sigmund-freud",
    ]);
    expect(togglePinSlug(current, "carl-jung")).toEqual([]);
    expect(current).toEqual(["carl-jung"]);
  });
});
