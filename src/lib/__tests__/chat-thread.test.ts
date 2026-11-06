import { describe, expect, it } from "vitest";

import type { ChatMessage } from "@/lib/chat-history";
import {
  MAX_THREAD_DEPTH,
  buildMessageForest,
  getThreadAncestors,
} from "@/lib/chat-thread";

function message(
  id: string,
  role: ChatMessage["role"],
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id,
    role,
    content: `message ${id}`,
    status: "complete",
    createdAt: 1,
    ...overrides,
  };
}

function maxDepth(
  nodes: ReturnType<typeof buildMessageForest>["roots"],
): number {
  let max = 0;
  const walk = (list: typeof nodes) => {
    for (const node of list) {
      max = Math.max(max, node.depth);
      walk(node.children);
    }
  };
  walk(nodes);
  return max;
}

describe("buildMessageForest", () => {
  it("builds chronological roots and children", () => {
    const messages: ChatMessage[] = [
      message("u1", "user"),
      message("a1", "assistant", { replyToId: "u1" }),
      message("a2", "assistant", { replyToId: "a1" }),
      message("a3", "assistant", { replyToId: "u1" }),
      message("n1", "assistant", { kind: "discussion-note" }),
      message("s1", "assistant", { kind: "summary" }),
    ];
    const forest = buildMessageForest(messages);

    expect(forest.roots.map((node) => node.message.id)).toEqual(["u1"]);
    expect(forest.roots[0].children.map((node) => node.message.id)).toEqual([
      "a1",
      "a3",
    ]);
    expect(forest.roots[0].children[0].children[0].message.id).toBe("a2");
    expect(forest.roots[0].children[0].children[0].depth).toBe(2);
    expect(forest.roots[0].children[1].depth).toBe(1);
    expect(forest.notes.map((item) => item.id)).toEqual(["n1"]);
    expect(forest.summaries.map((item) => item.id)).toEqual(["s1"]);
    expect(forest.byId.get("a1")?.message.id).toBe("a1");
    expect(forest.childrenByParent.get("u1")?.map((item) => item.id)).toEqual([
      "a1",
      "a3",
    ]);
    expect(forest.parentById.get("a2")).toBe("a1");
    expect(forest.orphans).toEqual([]);
  });

  it("promotes missing parents and self-parents to roots", () => {
    const forest = buildMessageForest([
      message("u1", "user"),
      message("a1", "assistant", { replyToId: "missing" }),
      message("a2", "assistant", { replyToId: "a2" }),
    ]);

    expect(forest.roots.map((node) => node.message.id)).toEqual([
      "u1",
      "a1",
      "a2",
    ]);
    expect(forest.roots[1].orphan).toBe(true);
    expect(forest.roots[2].orphan).toBeUndefined();
    expect(forest.orphans.map((node) => node.message.id)).toEqual(["a1"]);
    expect(forest.parentById.has("a2")).toBe(false);
  });

  it("handles parent cycles without infinite recursion", () => {
    const forest = buildMessageForest([
      message("a1", "assistant", { replyToId: "a2" }),
      message("a2", "assistant", { replyToId: "a1" }),
    ]);

    expect(forest.roots).toHaveLength(1);
    expect(forest.roots[0].message.id).toBe("a1");
    expect(forest.roots[0].children[0].message.id).toBe("a2");
    expect(forest.roots[0].children[0].children).toEqual([]);
    expect(forest.byId.size).toBe(2);
    expect(getThreadAncestors(forest, "a1")).toEqual(["a2"]);
  });

  it("keeps the first message when ids are duplicated", () => {
    const forest = buildMessageForest([
      message("u1", "user", { content: "first" }),
      message("u1", "user", { content: "second" }),
    ]);

    expect(forest.roots).toHaveLength(1);
    expect(forest.roots[0].message.content).toBe("first");
  });

  it("stops at the depth guard instead of overflowing", () => {
    const messages: ChatMessage[] = [message("m0", "user")];
    for (let index = 1; index <= MAX_THREAD_DEPTH + 5; index += 1) {
      messages.push(
        message(`m${index}`, "assistant", {
          replyToId: `m${index - 1}`,
        }),
      );
    }

    const forest = buildMessageForest(messages);

    expect(forest.roots.length).toBeGreaterThan(1);
    expect(maxDepth(forest.roots)).toBeLessThanOrEqual(MAX_THREAD_DEPTH);
  });

  it("returns ancestor ids from nearest to oldest", () => {
    const forest = buildMessageForest([
      message("u1", "user"),
      message("a1", "assistant", { replyToId: "u1" }),
      message("a2", "assistant", { replyToId: "a1" }),
    ]);

    expect(getThreadAncestors(forest, "a2")).toEqual(["a1", "u1"]);
    expect(getThreadAncestors(forest, "u1")).toEqual([]);
  });
});
