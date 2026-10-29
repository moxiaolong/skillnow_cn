import { describe, expect, it } from "vitest";

import { bayesianScore, upRatio } from "@/lib/reactions";

describe("bayesianScore", () => {
  it("starts at 0.5 with no votes", () => {
    expect(bayesianScore(0, 0)).toBe(0.5);
  });

  it("increases with upvotes", () => {
    expect(bayesianScore(10, 0)).toBeGreaterThan(bayesianScore(1, 0));
  });

  it("decreases with downvotes", () => {
    expect(bayesianScore(0, 10)).toBeLessThan(0.5);
  });

  it("is safe with negative or invalid input", () => {
    expect(bayesianScore(-5, Number.NaN)).toBe(0.5);
  });
});

describe("upRatio", () => {
  it("returns 0 when there are no votes", () => {
    expect(upRatio(0, 0)).toBe(0);
  });

  it("rounds the upvote percentage", () => {
    expect(upRatio(3, 1)).toBe(75);
  });
});
