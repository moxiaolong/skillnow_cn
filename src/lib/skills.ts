import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { getAllTags, getTagLabel, type TagSlug } from "@content/taxonomy";

import { skillFrontmatterSchema, type SkillFrontmatter } from "@/lib/schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "skills");

export type Skill = SkillFrontmatter & {
  body: string;
  displayBody: string;
  wordCount: number;
  readingMinutes: number;
  wordCountLabel: string;
  readingLabel: string;
  tagLabels: string[];
};

function countCjkCharacters(text: string): number {
  const matches = text.match(/[㐀-䶿一-鿿豈-﫿]/g);
  return matches?.length ?? 0;
}

function countLatinWords(text: string): number {
  const matches = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);
  return matches?.length ?? 0;
}

export function countWords(text: string): number {
  return countCjkCharacters(text) + countLatinWords(text);
}

export function getReadingMinutes(text: string): number {
  const cjk = countCjkCharacters(text);
  const latin = countLatinWords(text);
  return Math.max(1, Math.ceil(cjk / 300 + latin / 200));
}

export function formatWordCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)} 万字`;
  }
  return `${count.toLocaleString("zh-CN")} 字`;
}

export function formatReadingTime(minutes: number): string {
  return `约 ${minutes} 分钟`;
}

export function stripFirstH1(markdown: string): string {
  const trimmed = markdown.replace(/^\s+/, "");
  return trimmed.replace(/^#\s+[^\r\n]+\r?\n+/, "");
}

function readSkillFile(filePath: string): Skill {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const data = { ...parsed.data };

  if (data.updatedAt instanceof Date) {
    data.updatedAt = data.updatedAt.toISOString().slice(0, 10);
  }

  const result = skillFrontmatterSchema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid skill frontmatter in ${filePath}: ${details}`);
  }

  const frontmatter = result.data;
  const displayBody = stripFirstH1(parsed.content);
  const wordCount = countWords(displayBody);
  const readingMinutes = getReadingMinutes(displayBody);

  return {
    ...frontmatter,
    body: parsed.content.trimStart(),
    displayBody,
    wordCount,
    readingMinutes,
    wordCountLabel: formatWordCount(wordCount),
    readingLabel: formatReadingTime(readingMinutes),
    tagLabels: frontmatter.tags.map(getTagLabel),
  };
}

export function getAllSkills(options: { includeDrafts?: boolean } = {}): Skill[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const skills = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readSkillFile(path.join(CONTENT_DIR, file)))
    .sort((a, b) => a.order - b.order || a.shortTitle.localeCompare(b.shortTitle, "zh-CN"));

  return options.includeDrafts ? skills : skills.filter((skill) => !skill.draft);
}

export function getPublishedSkills(): Skill[] {
  return getAllSkills();
}

export function getSkillBySlug(slug: string): Skill | undefined {
  return getPublishedSkills().find((skill) => skill.slug === slug);
}

export function getSkillSlugs(): string[] {
  return getPublishedSkills().map((skill) => skill.slug);
}

export function getFeaturedSkills(limit = 4): Skill[] {
  return getPublishedSkills()
    .filter((skill) => skill.featured)
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
}

export function getLatestSkills(limit = 3): Skill[] {
  return getPublishedSkills()
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.order - b.order)
    .slice(0, limit);
}

export function getSkillsByTag(tag: string): Skill[] {
  return getPublishedSkills().filter((skill) => skill.tags.includes(tag));
}

export function getTagCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const skill of getPublishedSkills()) {
    for (const tag of skill.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

export function getTagsWithCounts(): Array<{
  slug: TagSlug;
  label: string;
  description: string;
  order: number;
  count: number;
}> {
  const counts = getTagCounts();
  return getAllTags()
    .map((tag) => ({ ...tag, count: counts.get(tag.slug) ?? 0 }))
    .filter((tag) => tag.count > 0);
}

export function getRelatedSkills(skill: Skill, limit = 3): Skill[] {
  const tagSet = new Set<string>(skill.tags);
  return getPublishedSkills()
    .filter((candidate) => candidate.slug !== skill.slug)
    .map((candidate) => ({
      skill: candidate,
      shared: candidate.tags.filter((tag) => tagSet.has(tag)).length,
    }))
    .filter((entry) => entry.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        a.skill.order - b.skill.order ||
        a.skill.shortTitle.localeCompare(b.skill.shortTitle, "zh-CN"),
    )
    .slice(0, limit)
    .map((entry) => entry.skill);
}

function indentBlock(text: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return text
    .trimEnd()
    .split(/\r?\n/)
    .map((line) => (line.length > 0 ? `${prefix}${line}` : ""))
    .join("\n");
}

export function buildSkillMd(skill: Skill): string {
  const description = indentBlock(skill.description, 2);
  return [
    "---",
    `name: ${skill.name}`,
    "description: |",
    description,
    "---",
    "",
    skill.body.trimStart(),
  ].join("\n");
}

export function getCopyPayloads(skill: Skill): {
  prompt: string;
  skillMd: string;
} {
  return {
    prompt: skill.body.trim(),
    skillMd: buildSkillMd(skill),
  };
}

export function formatUpdatedAt(value: string): string {
  const [year, month, day] = value.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}
