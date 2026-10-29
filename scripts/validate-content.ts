import { TAGS } from "../content/taxonomy";
import { getAllSkills } from "../src/lib/skills";

const ALLOWED_RELATED_TOOL_SLUGS = new Set([
  "sigmund-freud",
  "carl-jung",
  "jacques-lacan",
  "slavoj-zizek",
]);

export function validateContent(): void {
  const skills = getAllSkills({ includeDrafts: true });
  const published = skills.filter((skill) => !skill.draft);
  const drafts = skills.filter((skill) => skill.draft);
  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();

  for (const skill of skills) {
    if (seenSlugs.has(skill.slug)) {
      errors.push(`Duplicate slug: ${skill.slug}`);
    }
    seenSlugs.add(skill.slug);

    if (seenNames.has(skill.name)) {
      errors.push(`Duplicate skill name: ${skill.name}`);
    }
    seenNames.add(skill.name);

    for (const tag of skill.tags) {
      if (!(tag in TAGS)) {
        errors.push(`${skill.slug}: unknown tag "${tag}"`);
      }
    }

    if (!skill.disclaimers.includes("non-person")) {
      errors.push(`${skill.slug}: missing "non-person" disclaimer`);
    }
    if (!skill.disclaimers.includes("ai-accuracy")) {
      errors.push(`${skill.slug}: missing "ai-accuracy" disclaimer`);
    }

    if (skill.relatedTool && !ALLOWED_RELATED_TOOL_SLUGS.has(skill.slug)) {
      errors.push(
        `${skill.slug}: relatedTool is only allowed on the four psychoanalysis skills`,
      );
    }

    if (skill.note.scenarios.length === 0 && !skill.draft) {
      errors.push(`${skill.slug}: published skill needs at least one scenario`);
    }
    if (skill.examples.length === 0 && !skill.draft) {
      errors.push(`${skill.slug}: published skill needs at least one example`);
    }
  }

  if (errors.length > 0) {
    console.error("Content validation failed:\n");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Content OK: ${skills.length} skills (${published.length} published, ${drafts.length} drafts).`,
  );
  if (drafts.length > 0) {
    console.log(`Drafts: ${drafts.map((skill) => skill.slug).join(", ")}`);
  }
}

validateContent();
