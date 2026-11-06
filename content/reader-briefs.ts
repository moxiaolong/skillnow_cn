import type { ReaderBrief } from "@/lib/schema";

/**
 * 「读给自己」的编辑性内容，按已发布 Skill 的 slug 收录。
 *
 * 不放进 frontmatter：import-skills.mjs --force 会重建 frontmatter，
 * 这里的内容属于站方编辑层，不是源文件元数据。
 *
 * 写法见 docs/content-guide.md：三条方法要点 + 一个自问，
 * 不照抄正文，不写成角色口吻，不做诊断或投资建议。
 */
export const READER_BRIEFS = {
  "sigmund-freud": {
    takeaways: [
      "先问反应从哪里来。",
      "口误和梦也会说话。",
      "被压下去的总会回来。",
    ],
    question: "最近哪个反复出现的情绪，你还没问过它从哪来？",
  },
  hegel: {
    takeaways: [
      "在矛盾里找更高的统一。",
      "别把一个环节当成全部。",
      "让概念自己往前走。",
    ],
    question: "你正坚持的立场，内部卡着什么矛盾？",
  },
  "charlie-munger": {
    takeaways: [
      "别只用本行看问题。",
      "先列失败路径，再绕开。",
      "重大决定前，过一遍偏差清单。",
    ],
    question: "如果想让手头这件事失败，你会怎么做？",
  },
  "lei-jun": {
    takeaways: [
      "先看十年趋势，再看自己能力。",
      "砍掉不创造用户价值的成本。",
      "每件事做完，复盘三问。",
    ],
    question: "你手上这件事，是风口还是热潮？",
  },
  "carl-jung": {
    takeaways: [
      "先看反复出现的原型。",
      "把阴影当成线索，不当敌人。",
      "对立面之间，等第三种可能。",
    ],
    question: "你身上最不想承认的那一面，可能在提醒什么？",
  },
  "jacques-lacan": {
    takeaways: [
      "先看话在哪个位置说。",
      "缺口本身也是结构的一部分。",
      "别急着找更深的意义。",
    ],
    question: "你反复解释的那件事，换一种说法还成立吗？",
  },
  "slavoj-zizek": {
    takeaways: [
      "先问这套说法在维护什么。",
      "同一个东西，换个视角看裂缝。",
      "别把例外当成意外。",
    ],
    question: "你习以为常的那套说法，在替谁维持秩序？",
  },
  "michel-foucault": {
    takeaways: [
      "先问这句话谁有资格说。",
      "规则在怎样塑造「正常」。",
      "别把「人性」当成天生。",
    ],
    question: "你正在遵守的那条规则，是谁定义的「正常」？",
  },
  kant: {
    takeaways: [
      "先检查你用来判断的工具。",
      "把准则问成普遍法则。",
      "划清能知道和不能知道的界线。",
    ],
    question: "你这条行事准则，愿意让所有人都照做吗？",
  },
  "karl-marx": {
    takeaways: [
      "先看谁拥有、谁劳动、谁获益。",
      "把观念放回它产生的条件。",
      "别把社会关系当成物的属性。",
    ],
    question: "你眼前这个「理所当然」，是靠谁的成本维持的？",
  },
  "warren-buffett": {
    takeaways: [
      "先估它真正值多少。",
      "只做自己看得懂的事。",
      "把市场情绪当成报价，不当指令。",
    ],
    question: "你是在看懂之后行动，还是因为别人都在行动？",
  },
  "andy-grove": {
    takeaways: [
      "先看脚下的地基有没有变。",
      "只算产出，不算活动。",
      "用数据说话，别用感觉。",
    ],
    question: "你忙的这件事，真的改变了什么结果？",
  },
  "ma-huateng": {
    takeaways: [
      "先问用户有没有被照顾好。",
      "不确定时，让几个小方案并行。",
      "承认失败，再改制度。",
    ],
    question: "你手上这件事，是在连接人，还是只在抢入口？",
  },
  "john-beebe": {
    takeaways: [
      "先分清是哪种功能在说话。",
      "优势的反面，藏着未发展的部分。",
      "人格不是标签，是八个位置的舞。",
    ],
    question: "你最顺手的那个能力，遮住了哪一块？",
  },
} satisfies Record<string, ReaderBrief>;
