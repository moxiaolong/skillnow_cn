import fs from "node:fs";
import path from "node:path";

import { extractToc } from "../src/lib/markdown";
import { getAllSkills } from "../src/lib/skills";

export type SearchIndexItem = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  tags: string[];
  tagLabels: string[];
  headings: string[];
  url: string;
};

const skills = getAllSkills();
const index: SearchIndexItem[] = skills.map((skill) => ({
  slug: skill.slug,
  title: skill.title,
  shortTitle: skill.shortTitle,
  summary: skill.summary,
  tags: skill.tags,
  tagLabels: skill.tagLabels,
  headings: extractToc(skill.displayBody).map((item) => item.text),
  url: `/skills/${skill.slug}/`,
}));

const outDir = path.join(process.cwd(), "public");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "search-index.json");
fs.writeFileSync(outFile, `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(`Search index written: ${outFile} (${index.length} skills).`);
