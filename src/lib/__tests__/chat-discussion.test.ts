import { describe, expect, it } from "vitest";

import type { ChatMessage } from "@/lib/chat-history";
import {
  DEFAULT_DISCUSSION_ROUNDS,
  MAX_DISCUSSION_PARTICIPANTS,
  MAX_TOTAL_DISCUSSION_ROUNDS,
  buildDiscussionEndNote,
  buildDiscussionHostPickPrompt,
  buildDiscussionIntentPrompt,
  buildDiscussionSystemPrompt,
  buildDiscussionTranscript,
  buildDiscussionUserPrompt,
  clampDiscussionRounds,
  discussionContextKey,
  getStoredDiscussionPreferences,
  getDiscussionResponseStatuses,
  isErrorDiscussionNote,
  isNoHandsDiscussionNote,
  isPassOnlyDiscussionMessage,
  makeChatQuote,
  normalizeParticipantSlugs,
  parseDiscussionHostPick,
  parseDiscussionIntent,
  parseDiscussionOutput,
  parseReplyDirective,
  pickDiscussionStarter,
  saveDiscussionPreferences,
  speakerLabel,
  stripReplyDirectives,
} from "@/lib/chat-discussion";

class MemoryStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function message(
  id: string,
  role: ChatMessage["role"],
  content: string,
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id,
    role,
    content,
    status: "complete",
    createdAt: 1,
    ...overrides,
  };
}

describe("participant and round normalization", () => {
  it("trims, dedupes and caps participants", () => {
    expect(
      normalizeParticipantSlugs([
        " freud ",
        "hegel",
        "freud",
        42,
        null,
        "jung",
        "lacan",
        "kant",
      ]),
    ).toEqual(["freud", "hegel", "jung", "lacan", "kant"]);
    expect(normalizeParticipantSlugs("freud")).toEqual([]);
    expect(
      normalizeParticipantSlugs(
        Array.from({ length: 20 }, (_, i) => `s${i}`),
      ),
    ).toHaveLength(MAX_DISCUSSION_PARTICIPANTS);
  });

  it("clamps rounds to 2–10 or unlimited and falls back to the default", () => {
    expect(clampDiscussionRounds(1)).toBe(2);
    expect(clampDiscussionRounds(3)).toBe(3);
    expect(clampDiscussionRounds(99)).toBe(10);
    expect(clampDiscussionRounds(0)).toBe(0);
    expect(clampDiscussionRounds("3")).toBe(DEFAULT_DISCUSSION_ROUNDS);
    expect(clampDiscussionRounds(Number.NaN)).toBe(DEFAULT_DISCUSSION_ROUNDS);
  });

  it("builds a stable context key regardless of order", () => {
    expect(discussionContextKey(["hegel", "freud", "hegel"])).toBe(
      "discussion:freud,hegel",
    );
  });
});

describe("discussion preferences", () => {
  it("round-trips mode, participants and rounds", () => {
    const storage = new MemoryStorage();
    saveDiscussionPreferences(
      {
        mode: "discussion",
        participants: ["freud", "hegel"],
        maxRounds: 4,
      },
      storage,
    );

    expect(getStoredDiscussionPreferences(storage)).toEqual({
      mode: "discussion",
      participants: ["freud", "hegel"],
      maxRounds: 4,
    });
  });

  it("preserves unlimited rounds", () => {
    const storage = new MemoryStorage();
    saveDiscussionPreferences(
      {
        mode: "discussion",
        participants: ["freud", "hegel"],
        maxRounds: 0,
      },
      storage,
    );

    expect(getStoredDiscussionPreferences(storage).maxRounds).toBe(0);
  });

  it("falls back to single mode when fewer than two participants remain", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "skillnow:chat-discussion:v1",
      JSON.stringify({
        version: 1,
        mode: "discussion",
        participants: ["freud"],
        maxRounds: 2,
      }),
    );

    expect(getStoredDiscussionPreferences(storage)).toEqual({
      mode: "single",
      participants: ["freud"],
      maxRounds: 2,
    });
  });

  it("ignores corrupt storage", () => {
    const storage = new MemoryStorage();
    storage.setItem("skillnow:chat-discussion:v1", "not json");
    expect(getStoredDiscussionPreferences(storage)).toEqual({
      mode: "single",
      participants: [],
      maxRounds: DEFAULT_DISCUSSION_ROUNDS,
    });
  });
});

describe("discussion prompts", () => {
  it("adds discussion rules after the skill prompt and optional search prompt", () => {
    const prompt = buildDiscussionSystemPrompt({
      skillPrompt: "我是弗洛伊德。",
      self: { slug: "freud", name: "弗洛伊德" },
      participants: [
        { slug: "freud", name: "弗洛伊德" },
        { slug: "hegel", name: "黑格尔" },
      ],
      searchEnabled: true,
    });

    expect(prompt).toContain("我是弗洛伊德。");
    expect(prompt).toContain("你的身份：弗洛伊德（freud）");
    expect(prompt).toContain("其他参与者：黑格尔");
    expect(prompt).toContain("圆桌讨论");
    expect(prompt).toContain("web_search");
    expect(prompt).toContain("[[reply:mN]]");
    expect(prompt).toContain("[[pass]]");
    expect(prompt).toContain("不要机械引用上一条");
  });

  it("builds a direct-answer prompt for the user's question", () => {
    const transcript = buildDiscussionTranscript([
      message("u1", "user", "问题"),
    ]);
    const system = buildDiscussionSystemPrompt({
      skillPrompt: "我是弗洛伊德。",
      self: { slug: "freud", name: "弗洛伊德" },
      participants: [{ slug: "freud", name: "弗洛伊德" }],
      searchEnabled: false,
      directAnswer: true,
    });

    expect(system).toContain("直接回答这个问题");
    expect(system).toContain("不要输出 [[pass]]");
    expect(system).not.toContain("只有当你确实想回应某条消息时才引用");

    const user = buildDiscussionUserPrompt({
      topic: "问题",
      selfName: "弗洛伊德",
      transcript,
      directAnswer: true,
    });
    expect(user).toContain("请直接回答这个问题");
    expect(user).toContain("不要输出 [[pass]]");
    expect(user).not.toContain("主持人没有指定引用目标");
  });

  it("builds a transcript with aliases and an optional suggested target", () => {
    const transcript = buildDiscussionTranscript([
      message("u1", "user", "什么是自由？"),
      message("a1", "assistant", "自由是……", {
        speaker: { slug: "freud", name: "弗洛伊德" },
        round: 1,
      }),
      message("n1", "assistant", "讨论结束", { kind: "discussion-note" }),
    ]);

    expect(transcript.omitted).toBe(false);
    expect(transcript.entries.map((entry) => entry.alias)).toEqual(["m1", "m2"]);
    expect(transcript.entries[0].speakerName).toBe("用户");
    expect(transcript.entries[1].speakerName).toBe("弗洛伊德");
    expect(transcript.text).toContain("m1 用户：什么是自由？");
    expect(transcript.text).toContain("m2 弗洛伊德：自由是……");
    expect(transcript.text).not.toContain("讨论结束");

    const prompt = buildDiscussionUserPrompt({
      topic: "什么是自由？",
      selfName: "黑格尔",
      transcript,
      suggestedTarget: transcript.entries[1],
    });
    expect(prompt).toContain("主持人建议你回应 m2（弗洛伊德）");
    expect(prompt).toContain("[[reply:mN]]");
    expect(prompt).toContain("[[pass]]");
    expect(prompt).not.toContain("默认回应上一条");

    const noTarget = buildDiscussionUserPrompt({
      topic: "什么是自由？",
      selfName: "黑格尔",
      transcript,
    });
    expect(noTarget).toContain("主持人没有指定引用目标");
  });

  it("excludes error/streaming messages and trims the oldest entries", () => {
    const messages: ChatMessage[] = [
      message("u1", "user", "问题"),
      ...Array.from({ length: 6 }, (_, index) =>
        message(`a${index}`, "assistant", `发言 ${index} `.repeat(30), {
          speaker: { slug: `s${index}`, name: `角色${index}` },
        }),
      ),
      message("err", "assistant", "失败", { status: "error" }),
      message("live", "assistant", "生成中", { status: "streaming" }),
    ];

    const transcript = buildDiscussionTranscript(messages, {
      maxChars: 700,
      messageChars: 500,
    });

    expect(transcript.omitted).toBe(true);
    expect(transcript.text).toContain("较早发言已省略");
    expect(transcript.text).not.toContain("失败");
    expect(transcript.text).not.toContain("生成中");
    expect(transcript.entries.at(-1)?.message.id).toBe("a5");
  });

  it("includes a user quote in the transcript", () => {
    const transcript = buildDiscussionTranscript([
      message("a1", "assistant", "自由是……", {
        speaker: { slug: "freud", name: "弗洛伊德" },
      }),
      message("u1", "user", "我不同意", {
        replyToId: "a1",
        quote: {
          messageId: "a1",
          speakerName: "弗洛伊德",
          text: "自由是……",
        },
      }),
    ]);

    expect(transcript.text).toContain(
      "m2 用户：（引用 弗洛伊德：自由是……）\n我不同意",
    );
  });

  it("identifies no-hands end notes for hiding", () => {
    expect(
      isNoHandsDiscussionNote(
        message("n1", "assistant", "讨论结束：没有人举手想继续发言（第 2 轮）。", {
          kind: "discussion-note",
        }),
      ),
    ).toBe(true);
    expect(
      isNoHandsDiscussionNote(
        message("n2", "assistant", "讨论结束：达到 3 轮上限。", {
          kind: "discussion-note",
        }),
      ),
    ).toBe(false);
    expect(
      isNoHandsDiscussionNote(
        message("n3", "assistant", "讨论结束：没有人举手想继续发言（第 2 轮）。"),
      ),
    ).toBe(false);
  });

  it("identifies interrupted notes for hiding", () => {
    expect(
      isErrorDiscussionNote(
        message("n1", "assistant", "讨论已中断（第 2 轮）。", {
          kind: "discussion-note",
        }),
      ),
    ).toBe(true);
    expect(
      isErrorDiscussionNote(
        message("n2", "assistant", "讨论结束：达到 3 轮上限。", {
          kind: "discussion-note",
        }),
      ),
    ).toBe(false);
  });

  it("identifies pass-only participant messages for hiding", () => {
    const speaker = { slug: "leijun", name: "雷军" };

    expect(
      isPassOnlyDiscussionMessage(
        message("a1", "assistant", "没有新的观点。", { speaker }),
      ),
    ).toBe(true);
    expect(
      isPassOnlyDiscussionMessage(
        message("a2", "assistant", "我不同意这个判断。", { speaker }),
      ),
    ).toBe(false);
    expect(
      isPassOnlyDiscussionMessage(
        message("a3", "assistant", "没有新的观点。"),
      ),
    ).toBe(false);
    expect(
      isPassOnlyDiscussionMessage(
        message("a4", "assistant", "没有新的观点。", {
          speaker,
          kind: "discussion-note",
        }),
      ),
    ).toBe(false);
  });

  it("picks the least-speaking participant to open the discussion", () => {
    const participants = [
      { slug: "freud", name: "弗洛伊德" },
      { slug: "hegel", name: "黑格尔" },
    ];

    expect(pickDiscussionStarter(participants, [])?.slug).toBe("freud");
    expect(
      pickDiscussionStarter(participants, [
        message("a1", "assistant", "一", {
          speaker: { slug: "freud", name: "弗洛伊德" },
        }),
      ])?.slug,
    ).toBe("hegel");
    expect(
      pickDiscussionStarter(participants, [
        message("a1", "assistant", "一", {
          speaker: { slug: "freud", name: "弗洛伊德" },
        }),
        message("a2", "assistant", "二", {
          speaker: { slug: "hegel", name: "黑格尔" },
        }),
      ])?.slug,
    ).toBe("freud");
    expect(pickDiscussionStarter([], [])).toBeNull();
  });

  it("builds the intent and host pick prompts from the transcript", () => {
    const transcript = buildDiscussionTranscript([
      message("u1", "user", "问题"),
      message("a1", "assistant", "回答", {
        speaker: { slug: "freud", name: "弗洛伊德" },
      }),
    ]);
    const intent = buildDiscussionIntentPrompt({
      skillPrompt: "我是弗洛伊德。",
      topic: "问题",
      transcript,
    });
    expect(intent.system).toContain("我是弗洛伊德。");
    expect(intent.system).toContain("RAISE <mN>");
    expect(intent.system).toContain("默认 PASS");
    expect(intent.system).toContain("具体错误");
    expect(intent.system).toContain("宁可少说");
    expect(intent.system).toContain("没有明确回应对象就 PASS");
    expect(intent.user).toContain("m2 弗洛伊德：回答");
    expect(intent.user).toContain("先自检");
    expect(intent.user).not.toContain("任意一条");

    const host = buildDiscussionHostPickPrompt({
      topic: "问题",
      hands: [
        { slug: "hegel", name: "黑格尔", targetAlias: "m2" },
      ],
      transcript,
    });
    expect(host).toContain("hegel / 黑格尔");
    expect(host).toContain("想回应 m2");
    expect(host).toContain("不要只看最新消息");
    expect(host).toContain("举手目标");
    expect(host).not.toContain("举手理由");
    expect(host).toContain("END");
  });
});

describe("reply directives", () => {
  it("extracts a leading directive and strips all directive tokens", () => {
    const result = parseReplyDirective("[[reply:M2]] 我不同意。[[reply:m3]]");
    expect(result.alias).toBe("m2");
    expect(result.content).toBe("我不同意。");
    expect(result.pending).toBe(false);
  });

  it("extracts a directive anywhere in the text", () => {
    const result = parseReplyDirective("我先说一句。[[reply:m4]] 然后回应。");
    expect(result.alias).toBe("m4");
    expect(result.content).toBe("我先说一句。 然后回应。");
  });

  it("returns pending for a partial directive at the start", () => {
    expect(parseReplyDirective("  [[rep").pending).toBe(true);
    expect(parseReplyDirective("[[reply:m").pending).toBe(true);
    expect(parseReplyDirective("[[reply:m1]]").pending).toBe(false);
  });

  it("leaves ordinary content untouched and strips stray tokens", () => {
    expect(parseReplyDirective("普通发言").content).toBe("普通发言");
    expect(stripReplyDirectives("a[[reply:m1]]b")).toBe("ab");
  });
});

describe("discussion output", () => {
  it("detects a pass", () => {
    const result = parseDiscussionOutput("[[pass]]");
    expect(result.pass).toBe(true);
    expect(result.content).toBe("");
    expect(result.alias).toBeNull();
  });

  it("keeps a quote and content", () => {
    const result = parseDiscussionOutput("[[reply:m2]] 我不同意。");
    expect(result.pass).toBe(false);
    expect(result.alias).toBe("m2");
    expect(result.content).toBe("我不同意。");
  });

  it("treats a reply plus pass as a pass", () => {
    const result = parseDiscussionOutput("[[reply:m2]] [[pass]]");
    expect(result.pass).toBe(true);
    expect(result.alias).toBe("m2");
    expect(result.content).toBe("");
  });

  it("treats a no-new-view answer as a pass", () => {
    for (const text of [
      "没有新的观点。",
      "我暂时没有新的观点。",
      "没有补充。",
      "无新观点",
    ]) {
      expect(parseDiscussionOutput(text).pass).toBe(true);
    }

    expect(
      parseDiscussionOutput("没有新的观点，但我补充一点。").pass,
    ).toBe(false);
  });

  it("strips a stray pass token when there is content", () => {
    const result = parseDiscussionOutput("[[pass]] 但我还是想说一句。");
    expect(result.pass).toBe(false);
    expect(result.content).toBe("但我还是想说一句。");
  });
});

describe("discussion intents and host pick", () => {
  const hands = [
    {
      slug: "sigmund-freud",
      name: "弗洛伊德",
      targetAlias: "m1",
      targetMessageId: "u1",
    },
    {
      slug: "hegel",
      name: "黑格尔",
      targetAlias: "m2",
      targetMessageId: "a1",
    },
  ];
  const transcript = buildDiscussionTranscript([
    message("u1", "user", "问题"),
    message("a1", "assistant", "回答", {
      speaker: { slug: "sigmund-freud", name: "弗洛伊德" },
    }),
    message("a2", "assistant", "回应", {
      speaker: { slug: "hegel", name: "黑格尔" },
    }),
  ]);

  it("parses a hand raise with a valid target", () => {
    expect(parseDiscussionIntent("RAISE m2", transcript)).toEqual({
      raised: true,
      targetAlias: "m2",
      targetMessageId: "a1",
    });
  });

  it("parses PASS and no-expression answers as no hand", () => {
    expect(parseDiscussionIntent("PASS", transcript)).toEqual({
      raised: false,
    });
    expect(
      parseDiscussionIntent("我没有新的表达", transcript),
    ).toEqual({ raised: false });
    expect(parseDiscussionIntent("我不想发言", transcript)).toEqual({
      raised: false,
    });
    expect(parseDiscussionIntent("我不举手", transcript)).toEqual({
      raised: false,
    });
  });

  it("does not treat agreement or a bare alias as a hand", () => {
    expect(
      parseDiscussionIntent("我有一个不同的看法。", transcript),
    ).toEqual({ raised: false });
    expect(parseDiscussionIntent("m2 说得对", transcript)).toEqual({
      raised: false,
    });
    expect(parseDiscussionIntent("我同意。", transcript)).toEqual({
      raised: false,
    });
  });

  it("only accepts an explicit valid RAISE target", () => {
    expect(parseDiscussionIntent("RAISE m2", transcript)).toEqual({
      raised: true,
      targetAlias: "m2",
      targetMessageId: "a1",
    });
    expect(parseDiscussionIntent("举手 m1", transcript)).toEqual({
      raised: true,
      targetAlias: "m1",
      targetMessageId: "u1",
    });
    expect(parseDiscussionIntent("RAISE m99", transcript)).toEqual({
      raised: false,
    });
    expect(parseDiscussionIntent("RAISE", transcript)).toEqual({
      raised: false,
    });
  });

  it("uses the explicit RAISE target even when the latest is mentioned first", () => {
    expect(
      parseDiscussionIntent(
        "最新 m3 我不想回应，但我想回应 RAISE m1",
        transcript,
      ),
    ).toEqual({
      raised: true,
      targetAlias: "m1",
      targetMessageId: "u1",
    });
  });

  it("lets the host pick a slug or name from the hands", () => {
    expect(parseDiscussionHostPick("hegel", hands)).toEqual({
      slug: "hegel",
      ended: false,
    });
    expect(parseDiscussionHostPick("我选择黑格尔。", hands)).toEqual({
      slug: "hegel",
      ended: false,
    });
    expect(parseDiscussionHostPick("END", hands)).toEqual({
      slug: null,
      ended: true,
    });
    expect(parseDiscussionHostPick("nobody", hands)).toEqual({
      slug: null,
      ended: false,
    });
  });
});

describe("message response statuses", () => {
  const freud = { slug: "sigmund-freud", name: "弗洛伊德" };
  const hegel = { slug: "hegel", name: "黑格尔" };
  const participants = [freud, hegel];

  it("shows responded and streaming states while excluding the author", () => {
    const messages: ChatMessage[] = [
      message("u1", "user", "问题"),
      message("a1", "assistant", "回应", {
        speaker: freud,
        replyToId: "u1",
        status: "complete",
      }),
      message("a2", "assistant", "正在回应", {
        speaker: hegel,
        replyToId: "u1",
        status: "streaming",
      }),
    ];

    expect(
      getDiscussionResponseStatuses({
        message: messages[0],
        messages,
        participants,
        intents: {},
        intentTargets: {},
      }),
    ).toEqual([
      { participant: freud, state: "responded", messageId: "a1" },
      { participant: hegel, state: "responding", messageId: "a2" },
    ]);

    expect(
      getDiscussionResponseStatuses({
        message: messages[1],
        messages,
        participants,
        intents: { hegel: "raise" },
        intentTargets: { hegel: "a1" },
      }),
    ).toEqual([
      { participant: hegel, state: "responding" },
    ]);
  });

  it("keeps the latest message separate from an older hand target", () => {
    const older = message("u1", "user", "最初问题");
    const latest = message("a1", "assistant", "黑格尔最新发言", {
      speaker: hegel,
      replyToId: "u1",
      status: "complete",
    });
    const messages = [older, latest];

    expect(
      getDiscussionResponseStatuses({
        message: latest,
        messages,
        participants,
        intents: { "sigmund-freud": "raise" },
        intentTargets: { "sigmund-freud": "u1" },
      }),
    ).toEqual([
      { participant: freud, state: "none" },
    ]);

    expect(
      getDiscussionResponseStatuses({
        message: older,
        messages,
        participants,
        intents: { "sigmund-freud": "raise" },
        intentTargets: { "sigmund-freud": "u1" },
      }),
    ).toEqual([
      { participant: freud, state: "responding" },
      { participant: hegel, state: "responded", messageId: "a1" },
    ]);
  });
});

describe("end notes", () => {  it("describes every end reason", () => {
    expect(buildDiscussionEndNote("host", 2, 3)).toContain("主持人结束");
    expect(buildDiscussionEndNote("no-hands", 1, 3)).toContain(
      "没有人举手",
    );
    expect(buildDiscussionEndNote("max-rounds", 3, 3)).toContain("3 轮上限");
    expect(buildDiscussionEndNote("hard-cap", 8, 3)).toContain(
      `${MAX_TOTAL_DISCUSSION_ROUNDS} 轮`,
    );
    expect(buildDiscussionEndNote("stopped", 1, 3)).toContain("已停止");
    expect(buildDiscussionEndNote("error", 1, 3)).toContain("已中断");
  });
});

describe("quotes", () => {
  it("labels users and speakers and caps stored text", () => {
    const user = message("u1", "user", "一个很长的问题".repeat(40));
    expect(speakerLabel(user)).toBe("你");
    expect(makeChatQuote(user).speakerName).toBe("你");
    expect(makeChatQuote(user).text.length).toBeLessThanOrEqual(300);

    const assistant = message("a1", "assistant", "回应", {
      speaker: { slug: "hegel", name: "黑格尔" },
    });
    expect(speakerLabel(assistant)).toBe("黑格尔");
    expect(makeChatQuote(assistant)).toEqual({
      messageId: "a1",
      speakerName: "黑格尔",
      text: "回应",
    });
  });
});
