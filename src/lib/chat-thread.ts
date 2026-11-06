import type { ChatMessage } from "@/lib/chat-history";

export type ThreadNode = {
  message: ChatMessage;
  children: ThreadNode[];
  depth: number;
  orphan?: boolean;
};

export type MessageForest = {
  roots: ThreadNode[];
  notes: ChatMessage[];
  summaries: ChatMessage[];
  byId: Map<string, ThreadNode>;
  parentById: Map<string, string>;
  childrenByParent: Map<string, ChatMessage[]>;
  orphans: ThreadNode[];
};

export const MAX_THREAD_DEPTH = 64;

export function buildMessageForest(
  messages: readonly ChatMessage[],
): MessageForest {
  const unique: ChatMessage[] = [];
  const seenIds = new Set<string>();
  for (const message of messages) {
    if (seenIds.has(message.id)) continue;
    seenIds.add(message.id);
    unique.push(message);
  }

  const notes: ChatMessage[] = [];
  const summaries: ChatMessage[] = [];
  const conversation: ChatMessage[] = [];

  for (const message of unique) {
    if (message.kind === "discussion-note") {
      notes.push(message);
    } else if (message.kind === "summary") {
      summaries.push(message);
    } else {
      conversation.push(message);
    }
  }

  const messageById = new Map(
    conversation.map((message) => [message.id, message]),
  );
  const parentById = new Map<string, string>();
  const childrenByParent = new Map<string, ChatMessage[]>();
  const orphanIds = new Set<string>();
  const rootMessages: ChatMessage[] = [];

  for (const message of conversation) {
    const parentId = message.replyToId;
    if (!parentId || parentId === message.id) {
      rootMessages.push(message);
      continue;
    }

    if (!messageById.has(parentId)) {
      rootMessages.push(message);
      orphanIds.add(message.id);
      continue;
    }

    parentById.set(message.id, parentId);
    const children = childrenByParent.get(parentId) ?? [];
    children.push(message);
    childrenByParent.set(parentId, children);
  }

  const byId = new Map<string, ThreadNode>();
  const rendered = new Set<string>();

  function buildNode(
    message: ChatMessage,
    depth: number,
    ancestors: ReadonlySet<string>,
  ): ThreadNode {
    const node: ThreadNode = {
      message,
      children: [],
      depth,
      ...(orphanIds.has(message.id) ? { orphan: true } : {}),
    };
    byId.set(message.id, node);
    rendered.add(message.id);

    if (depth >= MAX_THREAD_DEPTH) return node;

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(message.id);

    for (const child of childrenByParent.get(message.id) ?? []) {
      if (nextAncestors.has(child.id) || rendered.has(child.id)) continue;
      node.children.push(buildNode(child, depth + 1, nextAncestors));
    }

    return node;
  }

  const roots = rootMessages.map((message) =>
    buildNode(message, 0, new Set()),
  );

  // Corrupted history can contain parent cycles with no natural root.
  // Promote any remaining message to a root; buildNode stops at repeated
  // ancestors and at MAX_THREAD_DEPTH.
  for (const message of conversation) {
    if (rendered.has(message.id)) continue;
    roots.push(buildNode(message, 0, new Set()));
  }

  return {
    roots,
    notes,
    summaries,
    byId,
    parentById,
    childrenByParent,
    orphans: [...byId.values()].filter((node) => node.orphan),
  };
}

export function getThreadAncestors(
  forest: MessageForest,
  messageId: string,
): string[] {
  const ancestors: string[] = [];
  const seen = new Set<string>();
  let current = forest.parentById.get(messageId);

  while (current && !seen.has(current)) {
    if (current === messageId) break;
    ancestors.push(current);
    seen.add(current);
    current = forest.parentById.get(current);
  }

  return ancestors;
}
