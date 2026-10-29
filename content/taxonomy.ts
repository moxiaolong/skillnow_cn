export type TagDefinition = {
  label: string;
  description: string;
  order: number;
};

export const TAGS = {
  psychology: {
    label: "心理学",
    description: "研究人的心理过程、行为与关系。",
    order: 1,
  },
  psychoanalysis: {
    label: "精神分析",
    description: "潜意识、欲望、梦、移情与主体结构。",
    order: 2,
  },
  "analytical-psychology": {
    label: "分析心理学",
    description: "荣格学派的原型、象征与个体化。",
    order: 3,
  },
  "personality-types": {
    label: "人格类型",
    description: "MBTI、八维、类型与原型等人格框架。",
    order: 4,
  },
  dream: {
    label: "梦与象征",
    description: "梦、意象、象征与无意识的表达。",
    order: 5,
  },
  "self-knowledge": {
    label: "自我认知",
    description: "理解自己的动机、模式与选择。",
    order: 6,
  },
  philosophy: {
    label: "哲学",
    description: "概念分析、认识论、伦理与存在。",
    order: 7,
  },
  dialectics: {
    label: "辩证法",
    description: "矛盾、否定、扬弃与概念的自我运动。",
    order: 8,
  },
  "critical-theory": {
    label: "批判理论",
    description: "意识形态、话语、权力与社会批判。",
    order: 9,
  },
  "social-critique": {
    label: "社会批判",
    description: "用结构性视角看社会现象与制度。",
    order: 10,
  },
  power: {
    label: "权力与制度",
    description: "规训、治理、制度与话语权力。",
    order: 11,
  },
  ethics: {
    label: "伦理学",
    description: "道德判断、义务、自由与好生活。",
    order: 12,
  },
  investing: {
    label: "投资",
    description: "长期价值、护城河、能力圈与风险。",
    order: 13,
  },
  business: {
    label: "商业",
    description: "生意、竞争、增长与商业模式。",
    order: 14,
  },
  management: {
    label: "管理",
    description: "组织、杠杆、战略转折点与领导力。",
    order: 15,
  },
  product: {
    label: "产品",
    description: "产品定义、用户价值与取舍。",
    order: 16,
  },
  "decision-making": {
    label: "决策",
    description: "判断、偏差、概率与长期选择。",
    order: 17,
  },
  "mental-models": {
    label: "思维模型",
    description: "多元模型、逆向思维与认知检查。",
    order: 18,
  },
  "china-business": {
    label: "中国商业",
    description: "中国互联网与硬件公司的打法。",
    order: 19,
  },
} as const satisfies Record<string, TagDefinition>;

export type TagSlug = keyof typeof TAGS;

export function getTagDefinition(slug: string): TagDefinition | undefined {
  return TAGS[slug as TagSlug];
}

export function getTagLabel(slug: string): string {
  return getTagDefinition(slug)?.label ?? slug;
}

export function getAllTags(): Array<{ slug: TagSlug } & TagDefinition> {
  return (Object.entries(TAGS) as Array<[TagSlug, TagDefinition]>)
    .map(([slug, definition]) => ({ slug, ...definition }))
    .sort((a, b) => a.order - b.order);
}
