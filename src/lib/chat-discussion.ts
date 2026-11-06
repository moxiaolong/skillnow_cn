import type { ChatMessage, ChatQuote } from "@/lib/chat-history";
import type { StorageLike } from "@/lib/chat-settings";
import { buildSystemPrompt } from "@/lib/chat-stream";

export const MIN_DISCUSSION_PARTICIPANTS = 2;
export const MAX_DISCUSSION_PARTICIPANTS = 14;
export const RECOMMENDED_MAX_DISCUSSION_PARTICIPANTS = 4;
export const DEFAULT_DISCUSSION_ROUNDS = 3;
export const MIN_DISCUSSION_ROUNDS = 2;
export const MAX_DISCUSSION_ROUNDS = 10;
export const UNLIMITED_DISCUSSION_ROUNDS = 0;
export const DISCUSSION_ROUND_OPTIONS = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, UNLIMITED_DISCUSSION_ROUNDS,
] as const;
export const MAX_TOTAL_DISCUSSION_ROUNDS = 24;
export const MAX_TRANSCRIPT_CHARS = 24_000;
export const MAX_TRANSCRIPT_MESSAGE_CHARS = 800;
export const MAX_TRANSCRIPT_QUESTION_CHARS = 2_000;
export const MAX_QUOTE_CHARS = 120;
export const MAX_QUOTE_STORAGE_CHARS = 300;
export const MAX_QUESTION_STORAGE_CHARS = 2_000;
export const DISCUSSION_PREFERENCES_KEY = "skillnow:chat-discussion:v1";

export type DiscussionMode = "single" | "discussion";

export type DiscussionParticipant = {
  slug: string;
  name: string;
};

export type DiscussionPreferences = {
  mode: DiscussionMode;
  participants: string[];
  maxRounds: number;
};

export type DiscussionEndReason =
  | "host"
  | "no-hands"
  | "max-rounds"
  | "hard-cap"
  | "stopped"
  | "error";

export type DiscussionTranscriptEntry = {
  alias: string;
  message: ChatMessage;
  speakerName: string;
};

export type DiscussionTranscript = {
  text: string;
  entries: DiscussionTranscriptEntry[];
  omitted: boolean;
};

export type DiscussionIntent = {
  raised: boolean;
  targetAlias?: string;
  targetMessageId?: string;
};

export type DiscussionIntentStatus = "pending" | "raise" | "pass";

export type DiscussionResponseStatus = {
  participant: DiscussionParticipant;
  state: "responded" | "responding" | "none";
  messageId?: string;
};

export type DiscussionHand = {
  slug: string;
  name: string;
  targetAlias?: string;
  targetMessageId?: string;
};

export function pickDiscussionStarter(
  participants: readonly DiscussionParticipant[],
  messages: readonly ChatMessage[],
): DiscussionParticipant | null {
  if (participants.length === 0) return null;

  const counts = new Map<string, number>(
    participants.map((participant) => [participant.slug, 0]),
  );

  for (const message of messages) {
    if (
      message.role !== "assistant" ||
      message.kind !== undefined ||
      !message.speaker
    ) {
      continue;
    }
    const current = counts.get(message.speaker.slug);
    if (current !== undefined) {
      counts.set(message.speaker.slug, current + 1);
    }
  }

  let starter = participants[0];
  let starterCount = counts.get(starter.slug) ?? 0;

  for (const participant of participants.slice(1)) {
    const count = counts.get(participant.slug) ?? 0;
    if (count < starterCount) {
      starter = participant;
      starterCount = count;
    }
  }

  return starter;
}

const DEFAULT_PREFERENCES: DiscussionPreferences = {
  mode: "single",
  participants: [],
  maxRounds: DEFAULT_DISCUSSION_ROUNDS,
};

export function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function clampDiscussionRounds(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_DISCUSSION_ROUNDS;
  }
  const rounded = Math.round(value);
  if (rounded === UNLIMITED_DISCUSSION_ROUNDS) {
    return UNLIMITED_DISCUSSION_ROUNDS;
  }
  if (rounded < MIN_DISCUSSION_ROUNDS) return MIN_DISCUSSION_ROUNDS;
  if (rounded > MAX_DISCUSSION_ROUNDS) return MAX_DISCUSSION_ROUNDS;
  return rounded;
}

export function normalizeParticipantSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const slugs: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;
    const slug = item.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= MAX_DISCUSSION_PARTICIPANTS) break;
  }

  return slugs;
}

export function discussionContextKey(slugs: readonly string[]): string {
  const unique = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))]
    .sort()
    .join(",");
  return `discussion:${unique}`;
}

export function getStoredDiscussionPreferences(
  storage: StorageLike | null,
): DiscussionPreferences {
  if (!storage) return DEFAULT_PREFERENCES;

  try {
    const raw = storage.getItem(DISCUSSION_PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_PREFERENCES;

    const record = parsed as Record<string, unknown>;
    if (record.version !== 1) return DEFAULT_PREFERENCES;

    const participants = normalizeParticipantSlugs(record.participants);
    const maxRounds = clampDiscussionRounds(record.maxRounds);
    const mode =
      record.mode === "discussion" &&
      participants.length >= MIN_DISCUSSION_PARTICIPANTS
        ? "discussion"
        : "single";

    return { mode, participants, maxRounds };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveDiscussionPreferences(
  preferences: DiscussionPreferences,
  storage: StorageLike | null,
): void {
  if (!storage) return;

  try {
    storage.setItem(
      DISCUSSION_PREFERENCES_KEY,
      JSON.stringify({
        version: 1,
        mode: preferences.mode,
        participants: normalizeParticipantSlugs(preferences.participants),
        maxRounds: clampDiscussionRounds(preferences.maxRounds),
      }),
    );
  } catch {
    // Preferences are optional; ignore storage failures.
  }
}

export function speakerLabel(message: ChatMessage): string {
  if (message.speaker?.name) return message.speaker.name;
  return message.role === "user" ? "你" : "AI";
}

export function makeChatQuote(target: ChatMessage): ChatQuote {
  return {
    messageId: target.id,
    speakerName: speakerLabel(target),
    text: truncateText(
      target.content.trim() || target.reasoning?.trim() || "……",
      MAX_QUOTE_STORAGE_CHARS,
    ),
  };
}

export function buildDiscussionSystemPrompt(params: {
  skillPrompt: string;
  self: DiscussionParticipant;
  participants: readonly DiscussionParticipant[];
  searchEnabled: boolean;
  directAnswer?: boolean;
}): string {
  const base = buildSystemPrompt(params.skillPrompt, params.searchEnabled);
  const others = params.participants
    .filter((participant) => participant.slug !== params.self.slug)
    .map((participant) => participant.name)
    .join("、");

  const rules = params.directAnswer
    ? [
        `1. 只以 ${params.self.name} 的身份发言；不要扮演其他参与者、不要冒充本人。`,
        "2. 用户刚提出了一个问题。请直接回答这个问题，给出你的核心判断和理由；不要机械引用其他消息，也不要为了发言而发言。",
        "3. 上文的单次字数限制、连续 N 轮后询问用户、退出角色等单聊规则在本次讨论中不适用；每次发言控制在 150–300 字。",
        "4. 这是对用户问题的直接回答，不要输出 [[pass]]，也不要只说「没有新的观点」「没有补充」等文字。",
        "5. 如果你确实想引用某条消息，可在正文第一行单独写 [[reply:mN]]；一般直接回答即可。",
        "6. 只输出发言正文；不要复述引用框，不要输出旁白、角色标签或“作为 AI”。",
        "7. 需要事实时可以使用搜索工具；不要编造来源。",
      ]
    : [
        `1. 只以 ${params.self.name} 的身份发言；不要扮演其他参与者、不要冒充本人。`,
        "2. 只有当你确实想回应某条消息时才引用它；不要机械引用上一条，也不要为了发言而发言。",
        "3. 上文的单次字数限制、连续 N 轮后询问用户、退出角色等单聊规则在本次讨论中不适用；每次发言控制在 150–300 字。",
        "4. 如果你确实要回应某条消息，请在正文第一行单独写 [[reply:mN]]；mN 是记录中的编号。没有明确想回应的消息就不要写引用。",
        "5. 如果你没有新的观点，请只输出 [[pass]]；不要输出「没有新的观点」「没有补充」等文字。",
        "6. 只输出发言正文；不要复述引用框，不要输出旁白、角色标签或“作为 AI”。",
        "7. 需要事实时可以使用搜索工具；不要编造来源。",
      ];

  return [
    base ?? "",
    "---",
    "你现在参加 SkillNow 的多位人物 Skill 圆桌讨论，不是单聊。",
    `你的身份：${params.self.name}（${params.self.slug}）。`,
    `其他参与者：${others || "无"}。`,
    "讨论规则（优先于上文中的所有单聊规则）：",
    ...rules,
  ]
    .filter((part) => part.length > 0)
    .join("\n");
}

function transcriptEntrySpeaker(message: ChatMessage): string {
  if (message.role === "user") return "用户";
  return message.speaker?.name ?? "AI";
}

function transcriptContent(message: ChatMessage): string {
  if (message.role === "user" && message.quote) {
    return `（引用 ${message.quote.speakerName}：${message.quote.text}）\n${message.content}`;
  }
  return message.content;
}

export function buildDiscussionTranscript(
  messages: readonly ChatMessage[],
  options: {
    maxChars?: number;
    messageChars?: number;
    questionChars?: number;
  } = {},
): DiscussionTranscript {
  const maxChars = options.maxChars ?? MAX_TRANSCRIPT_CHARS;
  const messageChars = options.messageChars ?? MAX_TRANSCRIPT_MESSAGE_CHARS;
  const questionChars = options.questionChars ?? MAX_TRANSCRIPT_QUESTION_CHARS;

  const usable = messages.filter((message) => {
    if (!message.content.trim()) return false;
    if (message.kind === "summary" || message.kind === "discussion-note") {
      return false;
    }
    if (message.status === "streaming" || message.status === "error") {
      return false;
    }
    return true;
  });

  const candidates: DiscussionTranscriptEntry[] = usable.map((message) => ({
    alias: "",
    message: {
      ...message,
      content: truncateText(
        transcriptContent(message),
        message.role === "user" ? questionChars : messageChars,
      ),
    },
    speakerName: transcriptEntrySpeaker(message),
  }));

  const kept: DiscussionTranscriptEntry[] = [];
  let chars = 0;

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const entry = candidates[index];
    const lineLength = entry.message.content.length + entry.speakerName.length + 8;
    if (kept.length > 0 && chars + lineLength > maxChars) break;
    kept.unshift(entry);
    chars += lineLength;
  }

  const omitted = kept.length < candidates.length;
  const entries = kept.map((entry, index) => ({
    ...entry,
    alias: `m${index + 1}`,
  }));

  const lines = entries.map(
    (entry) => `${entry.alias} ${entry.speakerName}：${entry.message.content}`,
  );
  const text = `${omitted ? "（较早发言已省略）\n" : ""}${lines.join("\n\n")}`;

  return { text, entries, omitted };
}

export function buildDiscussionUserPrompt(params: {
  topic: string;
  selfName: string;
  transcript: DiscussionTranscript;
  suggestedTarget?: DiscussionTranscriptEntry | null;
  directAnswer?: boolean;
}): string {
  if (params.directAnswer) {
    return [
      `讨论主题：${truncateText(params.topic, MAX_TRANSCRIPT_QUESTION_CHARS)}`,
      "讨论记录：",
      params.transcript.text || "（暂无发言）",
      "用户刚提出了一个问题。请直接回答这个问题，给出你的核心判断和理由。不要输出 [[pass]]，也不要只说「没有新的观点」「没有补充」。",
    ].join("\n\n");
  }

  const target = params.suggestedTarget
    ? `主持人建议你回应 ${params.suggestedTarget.alias}（${params.suggestedTarget.speakerName}）：“${truncateText(
        params.suggestedTarget.message.content,
        MAX_QUOTE_CHARS,
      )}”。这只是建议，你可以回应其他消息，也可以不引用。`
    : "主持人没有指定引用目标。";

  return [
    `讨论主题：${truncateText(params.topic, MAX_TRANSCRIPT_QUESTION_CHARS)}`,
    "讨论记录：",
    params.transcript.text || "（暂无发言）",
    target,
    "只有当你确实想回应某条消息时，才在正文第一行单独写 [[reply:mN]]；不要为了引用而引用。",
    "如果你没有新的观点，请只输出 [[pass]]，不要输出其他内容。",
  ].join("\n\n");
}

export function stripReplyDirectives(content: string): string {
  return content.replace(/\[\[\s*reply\s*:\s*m\d+\s*\]\]/gi, "");
}

function isPartialReplyDirective(content: string): boolean {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("[[")) return false;
  if (trimmed.length > 24) return false;
  const compact = trimmed.replace(/\s+/g, "").toLowerCase();
  return (
    "[[reply:m1]]".startsWith(compact) ||
    /^\[\[reply:m\d*$/.test(compact) ||
    compact === "[[reply:"
  );
}

export function parseReplyDirective(content: string): {
  alias: string | null;
  content: string;
  pending: boolean;
} {
  const start = content.match(/^\s*\[\[\s*reply\s*:\s*(m\d+)\s*\]\]/i);
  if (start) {
    return {
      alias: start[1].toLowerCase(),
      content: stripReplyDirectives(content.slice(start[0].length)).trimStart(),
      pending: false,
    };
  }

  const anywhere = content.match(/\[\[\s*reply\s*:\s*(m\d+)\s*\]\]/i);
  if (anywhere) {
    return {
      alias: anywhere[1].toLowerCase(),
      content: stripReplyDirectives(content).trim(),
      pending: false,
    };
  }

  if (isPartialReplyDirective(content)) {
    return { alias: null, content: "", pending: true };
  }

  return { alias: null, content, pending: false };
}

export function parseDiscussionOutput(content: string): {
  pass: boolean;
  alias: string | null;
  content: string;
  pending: boolean;
} {
  const parsed = parseReplyDirective(content);
  const hasPass = /\[\[\s*pass\s*\]\]/i.test(content);
  const withoutPass = parsed.content
    .replace(/\[\[\s*pass\s*\]\]/gi, "")
    .trim();
  const passOnly =
    !parsed.pending &&
    /^(?:我)?(?:暂时|目前|现在|也|都|并)*(?:没有|无)(?:什么)?(?:新的?)?(?:观点|看法|意见|想法|补充)(?:了)?[。.!！]*$/.test(
      withoutPass,
    );

  return {
    pass:
      passOnly || (hasPass && withoutPass.length === 0 && !parsed.pending),
    alias: parsed.alias,
    content: withoutPass,
    pending: parsed.pending,
  };
}

export const HOST_SYSTEM_PROMPT =
  "你是 SkillNow 圆桌讨论的主持人。你不参与发言，只在举手的参与者中决定谁发言。";

export function buildDiscussionIntentPrompt(params: {
  skillPrompt: string;
  topic: string;
  transcript: DiscussionTranscript;
}): { system: string; user: string } {
  const base = buildSystemPrompt(params.skillPrompt, false) ?? "";
  const system = [
    base,
    "---",
    "你正在参加 SkillNow 的圆桌讨论。现在只判断你是否应该举手发言，不要实际发言。",
    "默认 PASS。只有满足以下任意一条时才举手：",
    "1. 指出某条消息里的具体错误或事实错误；",
    "2. 补充一个会改变结论的关键事实；",
    "3. 给出与某条具体发言明确不同、并能说明理由的判断；",
    "4. 提出讨论必须回答、且尚无人提出的关键问题。",
    "如果只是赞同、复述、补充细节、泛泛延伸、表达兴趣、礼貌回应、换一种说法，或只是为了参与，必须 PASS。",
    "不确定就 PASS；宁可少说，不要凑发言。",
    "要举手必须指定一条有效的消息编号；没有明确回应对象就 PASS。",
    "只输出 RAISE <mN> 或 PASS，不要输出其他内容。",
  ]
    .filter((part) => part.length > 0)
    .join("\n");

  const user = [
    `讨论主题：${truncateText(params.topic, MAX_TRANSCRIPT_QUESTION_CHARS)}`,
    "讨论记录（mN 为消息编号）：",
    params.transcript.text || "（暂无发言）",
    "请先自检：你是否能指出一条具体、明确、会改变讨论的观点？如果不能，输出 PASS。只有确实有必要时才举手。",
  ].join("\n\n");

  return { system, user };
}

export function parseDiscussionIntent(
  content: string,
  transcript: DiscussionTranscript,
): DiscussionIntent {
  const text = content.trim();
  if (!text) return { raised: false };

  // PASS/negative wording wins even when it contains 举手/发言 as a substring.
  if (
    /\bPASS\b|不举手|不想发言|不发言|没有(?:明确|新的)观点|没有需要补充|无需发言|不必发言/i.test(
      text,
    )
  ) {
    return { raised: false };
  }

  const directive = text.match(
    /(?:RAISE|举手)\s*[:：]?\s*(m\d+)/i,
  );
  if (!directive) return { raised: false };

  const alias = `m${directive[1].toLowerCase().replace(/^m/, "")}`;
  const entry = transcript.entries.find(
    (item) => item.alias.toLowerCase() === alias,
  );
  if (!entry) return { raised: false };

  return {
    raised: true,
    targetAlias: entry.alias,
    targetMessageId: entry.message.id,
  };
}

export function getDiscussionResponseStatuses(params: {
  message: ChatMessage;
  messages: readonly ChatMessage[];
  participants: readonly DiscussionParticipant[];
  intents: Record<string, DiscussionIntentStatus>;
  intentTargets: Record<string, string>;
}): DiscussionResponseStatus[] {
  const authorSlug = params.message.speaker?.slug ?? null;

  return params.participants
    .filter((participant) => participant.slug !== authorSlug)
    .map((participant) => {
      const replies = params.messages.filter(
        (message) =>
          message.role === "assistant" &&
          message.speaker?.slug === participant.slug &&
          message.replyToId === params.message.id,
      );

      const streaming = replies.find(
        (message) => message.status === "streaming",
      );
      if (streaming) {
        return {
          participant,
          state: "responding" as const,
          messageId: streaming.id,
        };
      }

      const handRaised =
        params.intents[participant.slug] === "raise" &&
        params.intentTargets[participant.slug] === params.message.id;
      if (handRaised) {
        return {
          participant,
          state: "responding" as const,
        };
      }

      const responded = [...replies]
        .reverse()
        .find(
          (message) =>
            message.status === "complete" ||
            message.status === "stopped",
        );
      if (responded) {
        return {
          participant,
          state: "responded" as const,
          messageId: responded.id,
        };
      }

      return {
        participant,
        state: "none" as const,
      };
    });
}

export function buildDiscussionHostPickPrompt(params: {
  topic: string;
  hands: readonly DiscussionHand[];
  transcript: DiscussionTranscript;
}): string {
  const handLines = params.hands
    .map(
      (hand) =>
        `- ${hand.slug} / ${hand.name}${
          hand.targetAlias ? `：想回应 ${hand.targetAlias}` : ""
        }`,
    )
    .join("\n");

  return [
    "参与者举手情况：",
    handLines,
    "你是主持人。请只从上述举手者中选择一位继续发言，只输出该参与者的 slug；如果现在应该结束，输出 END。",
    "不要只看最新消息；举手者可能想回应任何一条较早的消息，请结合他们的举手目标和讨论需要选择。",
    `讨论主题：${truncateText(params.topic, MAX_TRANSCRIPT_QUESTION_CHARS)}`,
    "讨论记录（mN 为消息编号）：",
    params.transcript.text || "（暂无发言）",
  ].join("\n\n");
}

export function parseDiscussionHostPick(
  content: string,
  hands: readonly DiscussionHand[],
): { slug: string | null; ended: boolean } {
  const text = content.trim();
  if (/^\s*END\b/i.test(text) || /结束讨论|不选|不发言/.test(text)) {
    return { slug: null, ended: true };
  }

  const lowered = text.toLowerCase();
  const bySlug = hands.find((hand) =>
    lowered.includes(hand.slug.toLowerCase()),
  );
  if (bySlug) return { slug: bySlug.slug, ended: false };

  const byName = hands.find((hand) => text.includes(hand.name));
  if (byName) return { slug: byName.slug, ended: false };

  return { slug: null, ended: false };
}

export function buildDiscussionEndNote(
  reason: DiscussionEndReason,
  round: number,
  maxRounds: number,
): string {
  switch (reason) {
    case "host":
      return `讨论结束：主持人结束了讨论（第 ${round} 轮）。`;
    case "no-hands":
      return `讨论结束：没有人举手想继续发言（第 ${round} 轮）。`;
    case "max-rounds":
      return `讨论结束：达到 ${maxRounds} 轮上限。`;
    case "hard-cap":
      return `讨论结束：达到讨论上限（${MAX_TOTAL_DISCUSSION_ROUNDS} 轮）。`;
    case "stopped":
      return `讨论已停止（第 ${round} 轮）。`;
    case "error":
      return `讨论已中断（第 ${round} 轮）。`;
  }
}

export const NO_HANDS_DISCUSSION_NOTE_PREFIX =
  "讨论结束：没有人举手想继续发言";

export function isNoHandsDiscussionNote(message: ChatMessage): boolean {
  return (
    message.kind === "discussion-note" &&
    message.content.trimStart().startsWith(NO_HANDS_DISCUSSION_NOTE_PREFIX)
  );
}

export const ERROR_DISCUSSION_NOTE_PREFIX = "讨论已中断";

export function isErrorDiscussionNote(message: ChatMessage): boolean {
  return (
    message.kind === "discussion-note" &&
    message.content.trimStart().startsWith(ERROR_DISCUSSION_NOTE_PREFIX)
  );
}

export function isPassOnlyDiscussionMessage(message: ChatMessage): boolean {
  return (
    message.role === "assistant" &&
    message.kind === undefined &&
    Boolean(message.speaker) &&
    message.status !== "streaming" &&
    parseDiscussionOutput(message.content).pass
  );
}
