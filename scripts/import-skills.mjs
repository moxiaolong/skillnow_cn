import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const SOURCE_DIR =
  process.env.SKILL_SOURCE_DIR || "C:/Users/dragon/Desktop/完整skill";
const CONTENT_DIR = path.resolve("content/skills");
const FORCE = process.argv.includes("--force");
const UPDATED_AT = "2026-10-27";

const RELATED_TOOL = {
  label: "精神分析专家团",
  description: "想把这些视角用在一次完整的自我探索上？",
  url: "https://soulstation.club/psychoanalysis?utm_source=skillnow&utm_medium=referral&utm_campaign=skill_detail",
};

const SKILLS = {
  "sigmund-freud-perspective": {
    slug: "sigmund-freud",
    shortTitle: "弗洛伊德",
    tags: ["psychology", "psychoanalysis", "dream", "self-knowledge"],
    summary: "用精神分析的视角看潜意识动机、梦与口误。",
    featured: true,
    order: 1,
    draft: false,
    relatedTool: RELATED_TOOL,
    disclaimers: ["non-person", "ai-accuracy", "mental-health"],
    note: {
      scenarios: [
        "反复出现的梦、口误、关系里重复的同一种模式",
        "想理解某个行为背后的隐秘动机",
        "创作或表达中出现了自己也没料到的内容",
      ],
      notFor: [
        "需要诊断或治疗的精神健康问题",
        "需要事实核查或快速行动清单的问题",
        "只想被安慰、不想被追问的场景",
      ],
      tips: [
        "先描述具体事件、梦境或原话，再让它拆解底层动机",
        "把它的断言当作假设，不要当作结论",
        "可以追问它：这个解释的反证是什么？",
      ],
      cautions: [
        "它倾向于把问题还原到童年与性驱力，未必适合当前语境",
        "涉及自伤、自杀或严重抑郁时，请直接联系专业援助",
      ],
    },
    examples: [
      "我最近反复梦到同一座房子，帮我从精神分析的角度看看。",
      "我总是在关键场合说错话，这可能是因为什么？",
      "为什么我总在关系里重复同一种模式？",
      "我对一个人明明很反感，却总想得到他的认可，这怎么理解？",
    ],
  },
  "hegel-perspective": {
    slug: "hegel",
    shortTitle: "黑格尔",
    tags: ["philosophy", "dialectics", "social-critique", "mental-models"],
    summary: "用辩证法追踪矛盾、概念运动与更高层面的统一。",
    featured: true,
    order: 2,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy", "viewpoint"],
    note: {
      scenarios: [
        "两个观点似乎都成立，却互相冲突",
        "想理解一个概念、制度或历史过程是怎么演变到今天",
        "在变化中重新理解自己的位置",
      ],
      notFor: [
        "具体二选一的日常决策（选 A 还是 B）",
        "需要快速事实答案的问题",
        "只想听一句情绪安慰的场景",
      ],
      tips: [
        "先说清楚冲突双方各自成立的理由，再让它找更高的统一",
        "让它解释概念是如何一步步自我运动的",
        "对它的宏大叙事保持警惕，追问具体机制",
      ],
      cautions: [
        "它容易把具体问题上升为宏大历史叙事，可能偏离你的实际处境",
        "角色观点不代表整理者立场",
      ],
    },
    examples: [
      "我既想稳定又想自由，这两个想法一直打架，帮我用辩证法看看。",
      "为什么一个原本进步的制度会慢慢变成它的反面？",
      "我该怎么理解「承认」？为什么我这么在意别人的认可？",
    ],
  },
  "charlie-munger-perspective": {
    slug: "charlie-munger",
    shortTitle: "芒格",
    tags: ["investing", "business", "decision-making", "mental-models"],
    summary: "用多元心智模型、逆向思维与认知偏差清单做决策。",
    featured: true,
    order: 3,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy", "investment"],
    note: {
      scenarios: [
        "在几个选项之间做重要决策",
        "想检查自己是否犯了明显的认知偏差",
        "评估一个生意、投资或长期选择",
      ],
      notFor: [
        "需要即时行情或具体买卖点的问题",
        "纯情绪宣泄、不需要分析的时刻",
        "需要专业法律、税务或医疗意见的场景",
      ],
      tips: [
        "先把问题写成「如果我失败了，最可能因为什么」，再反过来想",
        "让它列出你忽略的两三个心智模型，而不是直接给结论",
        "把它当决策检查清单，不要当投资顾问",
      ],
      cautions: [
        "不构成投资建议",
        "它的判断基于公开言论与案例，未必适用于你的资金与风险承受能力",
      ],
    },
    examples: [
      "我在考虑要不要换工作，帮我用多元思维模型拆一下。",
      "这个生意看起来很好，但我想先反过来找它失败的原因。",
      "我最近做了一个糟糕的决定，帮我看看是哪种认知偏差在起作用。",
    ],
  },
  "lei-jun-perspective": {
    slug: "lei-jun",
    shortTitle: "雷军",
    tags: ["business", "product", "china-business", "management"],
    summary: "用「顺势而为」、产品定义与效率思维看商业与产品选择。",
    featured: true,
    order: 4,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy"],
    note: {
      scenarios: [
        "判断一个产品方向是否顺势、是否有足够大的市场",
        "在资源有限时做产品取舍与优先级排序",
        "理解中国互联网与硬件公司的打法",
      ],
      notFor: [
        "需要内部数据或未公开信息的判断",
        "具体投资建议或法律意见",
        "完全不适合商业语境的个人情绪问题",
      ],
      tips: [
        "先补充你的资源、阶段与竞争格局，再让它给方向",
        "让它区分「风口」与「能力圈」，不要只谈趋势",
        "把它的建议落到一个可验证的小实验",
      ],
      cautions: [
        "它基于公开演讲与案例，不代表本人观点，也不构成投资建议",
        "商业判断高度依赖具体情境，别把通用框架当答案",
      ],
    },
    examples: [
      "我想做一个 AI 工具，怎么判断这个方向是不是「顺势」？",
      "资源有限时，我应该先做产品还是先做增长？",
      "用雷军的视角看看，这个硬件产品还有没有机会。",
    ],
  },
  "carl-jung-perspective": {
    slug: "carl-jung",
    shortTitle: "荣格",
    tags: [
      "psychology",
      "analytical-psychology",
      "personality-types",
      "dream",
      "self-knowledge",
    ],
    summary: "用荣格的视角看梦、象征、人格类型与中年转折。",
    order: 5,
    draft: false,
    relatedTool: RELATED_TOOL,
    disclaimers: ["non-person", "ai-accuracy", "mental-health"],
    note: {
      scenarios: ["梦境与反复出现的意象", "中年转折与身份变化", "理解自己的人格类型"],
      notFor: ["需要诊断或治疗的精神健康问题", "需要快速事实答案的问题"],
      tips: ["先描述意象和感受，再让它关联原型", "把它的解释当作一种视角，而不是诊断"],
      cautions: ["它倾向于把问题上升到原型与集体无意识", "涉及危机时请直接联系专业援助"],
    },
    examples: [
      "我最近反复梦到一个陌生的老人，这可能在说什么？",
      "我到了中年，突然不知道自己想要什么，能用荣格的视角看看吗？",
      "我总觉得自己有两个面，一个想融入，一个想逃开，这怎么理解？",
    ],
  },
  "jacques-lacan-perspective": {
    slug: "jacques-lacan",
    shortTitle: "拉康",
    tags: ["psychoanalysis", "philosophy", "critical-theory", "self-knowledge"],
    summary: "用拉康的结构主义视角看欲望、语言与主体。",
    order: 6,
    draft: false,
    relatedTool: RELATED_TOOL,
    disclaimers: ["non-person", "ai-accuracy", "mental-health", "viewpoint"],
    note: {
      scenarios: ["理解欲望为什么总绕着缺失转", "分析话语中的矛盾与主体位置"],
      notFor: ["需要直接行动建议的问题", "需要诊断或治疗的精神健康问题"],
      tips: ["从你实际说出的话入手，而不是从抽象概念入手", "对它的晦涩保持耐心，要求它举例"],
      cautions: ["它的表达可能非常晦涩", "涉及危机时请直接联系专业援助"],
    },
    examples: [
      "为什么我得到想要的东西之后，反而觉得更空？",
      "我总在别人面前扮演一个不是我的角色，这怎么理解？",
      "为什么我越想让别人懂我，越觉得说不清？",
    ],
  },
  "zizek-perspective": {
    slug: "slavoj-zizek",
    shortTitle: "齐泽克",
    tags: ["philosophy", "psychoanalysis", "critical-theory", "social-critique"],
    summary: "用齐泽克的视角拆解意识形态、文化现象与话语矛盾。",
    order: 7,
    draft: false,
    relatedTool: RELATED_TOOL,
    disclaimers: ["non-person", "ai-accuracy", "viewpoint"],
    note: {
      scenarios: ["看不懂某个社会现象为什么大家都习以为常", "想拆解一个文化产品背后的意识形态"],
      notFor: ["需要快速事实答案的问题", "需要具体行动清单的场景"],
      tips: ["先给出具体现象，再让它找其中的悖论", "追问它：这个批判自己的盲点在哪里？"],
      cautions: ["角色观点不代表整理者立场", "它喜欢用悖论和反转，未必适合所有语境"],
    },
    examples: [
      "为什么我们一边知道消费主义有问题，一边还是停不下来？",
      "用齐泽克的视角看看，这个广告在贩卖什么？",
      "为什么我们一边嘲笑某个口号，一边又照着它生活？",
    ],
  },
  "foucault-perspective": {
    slug: "michel-foucault",
    shortTitle: "福柯",
    tags: ["philosophy", "critical-theory", "social-critique", "power"],
    summary: "用福柯的视角看权力、话语、规训与制度。",
    order: 8,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy", "viewpoint"],
    note: {
      scenarios: ["理解一个制度如何塑造人的行为", "分析某套话语背后的权力关系"],
      notFor: ["需要规范性问题答案的场景", "需要快速行动建议的问题"],
      tips: ["先描述具体的制度、规则或话语", "让它指出谁被规训、谁有发言权"],
      cautions: ["角色观点不代表整理者立场", "它更擅长诊断权力，不擅长给规范答案"],
    },
    examples: [
      "公司的绩效考核为什么让人越来越焦虑？",
      "用福柯的视角看看，这套「自我提升」话语在塑造什么？",
      "为什么一套「为你好」的管理方式，会让人更顺从？",
    ],
  },
  "kant-perspective": {
    slug: "kant",
    shortTitle: "康德",
    tags: ["philosophy", "ethics", "mental-models"],
    summary: "用康德的批判哲学看认知边界、道德与判断。",
    order: 9,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy"],
    note: {
      scenarios: ["想厘清一个道德困境的原则", "想理解认知的边界与前提"],
      notFor: ["需要经验事实的问题", "需要情绪支持的时刻"],
      tips: ["先把问题里的经验成分和原则成分分开", "让它用可普遍化的标准检验你的准则"],
      cautions: ["它的框架偏形式化，可能离具体情境较远"],
    },
    examples: [
      "我该不该为了救人而撒谎？用康德的视角看看。",
      "我们真的能认识「事物本身」吗？",
      "如果所有人都按我这个理由行事，世界会变成什么样？",
    ],
  },
  "marx-perspective": {
    slug: "karl-marx",
    shortTitle: "马克思",
    tags: ["philosophy", "dialectics", "social-critique", "business"],
    summary: "用历史唯物主义与辩证法看资本、劳动与社会结构。",
    order: 10,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy", "viewpoint"],
    note: {
      scenarios: ["理解一个经济现象背后的结构", "分析劳动、资本与制度的关系"],
      notFor: ["需要具体投资建议的问题", "需要个人情绪支持的时刻"],
      tips: ["先描述具体的生产、分配或劳动关系", "让它区分现象与结构性原因"],
      cautions: ["角色观点不代表整理者立场", "它倾向于结构性解释，可能忽略个体差异"],
    },
    examples: [
      "为什么工作越来越忙，却感觉越来越穷？",
      "用马克思的视角看看，平台经济和雇佣劳动有什么区别？",
      "为什么平台上的自由职业者，看起来自由，却更依赖平台？",
    ],
  },
  "warren-buffett-perspective": {
    slug: "warren-buffett",
    shortTitle: "巴菲特",
    tags: ["investing", "business", "decision-making", "mental-models"],
    summary: "用巴菲特的视角看护城河、长期价值与能力圈。",
    order: 11,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy", "investment"],
    note: {
      scenarios: ["评估一个生意的长期竞争力", "判断自己是否在能力圈内"],
      notFor: ["需要即时行情或具体买卖点的问题", "需要专业法律或税务意见的场景"],
      tips: ["先描述生意的商业模式与竞争格局", "让它解释护城河能不能持续"],
      cautions: ["不构成投资建议", "它的方法依赖长期视角与特定市场环境"],
    },
    examples: [
      "这个品牌的护城河到底在哪里？用巴菲特的视角看看。",
      "我该不该投资一个自己不完全懂的行业？",
      "怎么判断一个生意的优势是真护城河，还是短期运气？",
    ],
  },
  "andy-grove-perspective": {
    slug: "andy-grove",
    shortTitle: "格鲁夫",
    tags: ["management", "business", "decision-making"],
    summary: "用格鲁夫的高产出管理看组织、杠杆与战略转折点。",
    order: 12,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy"],
    note: {
      scenarios: ["团队产出低、会议过多", "判断组织是否到了战略转折点"],
      notFor: ["需要具体人事法律意见的场景", "纯个人情绪问题"],
      tips: ["先给出团队规模、目标与瓶颈", "让它区分「活动」与「产出」"],
      cautions: ["它基于特定行业的管理经验，未必适用于所有组织"],
    },
    examples: [
      "我的团队每天都很忙，但产出很低，问题出在哪？",
      "怎么判断公司是不是到了一个必须转型的转折点？",
      "团队规模翻倍后，为什么沟通成本突然失控？",
    ],
  },
  "ma-huateng-perspective": {
    slug: "ma-huateng",
    shortTitle: "马化腾",
    tags: ["business", "product", "china-business", "management"],
    summary: "用马化腾的视角看连接、灰度、产品与组织。",
    order: 13,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy"],
    note: {
      scenarios: ["判断一个产品是否具备连接与网络效应", "在不确定中做灰度试验"],
      notFor: ["需要内部数据或未公开信息的判断", "具体投资建议"],
      tips: ["先描述产品的用户关系与生态位置", "让它区分「连接」与「流量」"],
      cautions: ["它基于公开演讲与案例，不代表本人观点"],
    },
    examples: [
      "我的产品有很多用户，但彼此没有连接，这算有网络效应吗？",
      "面对不确定性，怎么设计一个灰度试验？",
      "一个产品从工具变成生态，最关键的那一步是什么？",
    ],
  },
  "john-beebe-perspective": {
    slug: "john-beebe",
    shortTitle: "毕比",
    tags: ["psychology", "analytical-psychology", "personality-types", "psychoanalysis"],
    summary: "用毕比的类型与原型系统看人格结构与自我发展。",
    order: 14,
    draft: false,
    disclaimers: ["non-person", "ai-accuracy", "mental-health"],
    note: {
      scenarios: ["理解八维功能在人格中的位置", "分析自我发展中的原型主题"],
      notFor: ["需要诊断或治疗的精神健康问题", "需要快速人格测试结果的场景"],
      tips: ["先给出你观察到的行为模式", "让它区分功能、原型与发展阶段"],
      cautions: ["它是一套理论框架，不是诊断工具", "涉及危机时请直接联系专业援助"],
    },
    examples: [
      "用毕比的八维原型看看，我为什么总在同一个地方卡住？",
      "我的劣势功能可能是什么？它怎么影响我的关系？",
      "为什么我在压力下会变成完全不同的人？用八维原型看看。",
    ],
  },
};

function quote(value) {
  return JSON.stringify(value);
}

function flowArray(items) {
  return `[${items
    .map((item) => (/^[a-z0-9-]+$/.test(item) ? item : quote(item)))
    .join(", ")}]`;
}

function blockArray(key, items, indent = 0) {
  const prefix = " ".repeat(indent);
  if (!items || items.length === 0) {
    return `${prefix}${key}: []`;
  }
  return `${prefix}${key}:\n${items
    .map((item) => `${prefix}  - ${quote(item)}`)
    .join("\n")}`;
}

function renderNote(note) {
  const lines = ["note:"];
  for (const key of ["scenarios", "notFor", "tips", "cautions"]) {
    const items = note[key] ?? [];
    if (items.length === 0) {
      lines.push(`  ${key}: []`);
    } else {
      lines.push(`  ${key}:`);
      for (const item of items) {
        lines.push(`    - ${quote(item)}`);
      }
    }
  }
  return lines.join("\n");
}

function indentBlock(text, spaces) {
  const prefix = " ".repeat(spaces);
  return text
    .trimEnd()
    .split(/\r?\n/)
    .map((line) => (line.length > 0 ? `${prefix}${line}` : ""))
    .join("\n");
}

function detectSource(raw) {
  if (!/(女娲|nuwa-skill|花叔)/.test(raw)) {
    return undefined;
  }
  return {
    name: "女娲 · Skill造人术",
    url: "https://github.com/alchaincyf/nuwa-skill",
    author: /花叔/.test(raw) ? "花叔" : undefined,
  };
}

function buildFrontmatter(frontmatter, source) {
  const lines = [
    "---",
    `name: ${frontmatter.name}`,
    "description: |",
    indentBlock(frontmatter.description, 2),
    `title: ${quote(frontmatter.title)}`,
    `shortTitle: ${quote(frontmatter.shortTitle)}`,
    `slug: ${frontmatter.slug}`,
    `summary: ${quote(frontmatter.summary)}`,
    `tags: ${flowArray(frontmatter.tags)}`,
    `updatedAt: "${frontmatter.updatedAt}"`,
    renderNote(frontmatter.note),
    blockArray("examples", frontmatter.examples, 0),
  ];

  if (source) {
    lines.push("source:");
    lines.push(`  name: ${quote(source.name)}`);
    if (source.url) {
      lines.push(`  url: ${quote(source.url)}`);
    }
    if (source.author) {
      lines.push(`  author: ${quote(source.author)}`);
    }
  }

  lines.push(`license: ${frontmatter.license}`);
  lines.push(`disclaimers: ${flowArray(frontmatter.disclaimers)}`);

  if (frontmatter.relatedTool) {
    lines.push("relatedTool:");
    lines.push(`  label: ${quote(frontmatter.relatedTool.label)}`);
    lines.push(`  description: ${quote(frontmatter.relatedTool.description)}`);
    lines.push(`  url: ${quote(frontmatter.relatedTool.url)}`);
  }

  lines.push(`featured: ${frontmatter.featured ?? false}`);
  lines.push(`order: ${frontmatter.order ?? 999}`);
  lines.push(`draft: ${frontmatter.draft ?? false}`);
  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => /^SKILL.*\.md$/i.test(file))
    .sort();

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const name = String(parsed.data.name || "").trim();
    const config = SKILLS[name];

    if (!config) {
      console.warn(`  skip ${file}: no config for name "${name}"`);
      skipped += 1;
      continue;
    }

    const h1Match = parsed.content.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1].trim() : config.shortTitle;
    const source = detectSource(raw);
    const frontmatter = {
      name,
      description: String(parsed.data.description || "").trim(),
      title,
      ...config,
      updatedAt: UPDATED_AT,
      license: "CC-BY-4.0",
    };

    const output = path.join(CONTENT_DIR, `${config.slug}.md`);
    if (fs.existsSync(output) && !FORCE) {
      console.log(`  skip ${config.slug}.md (exists; use --force to overwrite)`);
      skipped += 1;
      continue;
    }

    const content = `${buildFrontmatter(frontmatter, source)}${parsed.content.trimStart()}\n`;
    fs.writeFileSync(output, content, "utf8");
    console.log(`  wrote ${config.slug}.md`);
    created += 1;
  }

  console.log(`\nDone. created=${created} skipped=${skipped} total=${files.length}`);
}

main();
