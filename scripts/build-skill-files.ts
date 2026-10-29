import fs from "node:fs";
import path from "node:path";

import { getAllSkills, getCopyPayloads } from "../src/lib/skills";

const skills = getAllSkills();
const root = path.join(process.cwd(), "public", "skills");

for (const skill of skills) {
  const dir = path.join(root, skill.slug);
  fs.mkdirSync(dir, { recursive: true });
  const { prompt, skillMd } = getCopyPayloads(skill);
  fs.writeFileSync(path.join(dir, "prompt.txt"), `${prompt}\n`, "utf8");
  fs.writeFileSync(path.join(dir, "SKILL.md"), `${skillMd}\n`, "utf8");
}

console.log(`Skill files written: ${skills.length} skills.`);
