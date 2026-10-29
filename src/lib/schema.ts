import { z } from "zod";

export const DISCLAIMER_TYPES = [
  "non-person",
  "ai-accuracy",
  "mental-health",
  "investment",
  "viewpoint",
] as const;

export type DisclaimerType = (typeof DISCLAIMER_TYPES)[number];

const noteSchema = z.object({
  scenarios: z.array(z.string()).default([]),
  notFor: z.array(z.string()).default([]),
  tips: z.array(z.string()).default([]),
  cautions: z.array(z.string()).default([]),
});

const EMPTY_NOTE = {
  scenarios: [],
  notFor: [],
  tips: [],
  cautions: [],
};

const sourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  author: z.string().optional(),
});

const relatedToolSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url(),
});

export const skillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().min(8).max(200),
  tags: z.array(z.string().min(1)).min(1),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: noteSchema.default(EMPTY_NOTE),
  examples: z.array(z.string().min(1)).default([]),
  source: sourceSchema.optional(),
  license: z.string().min(1).default("CC-BY-4.0"),
  disclaimers: z.array(z.enum(DISCLAIMER_TYPES)).default([]),
  relatedTool: relatedToolSchema.optional(),
  featured: z.boolean().default(false),
  order: z.number().default(999),
  draft: z.boolean().default(false),
});

export type SkillFrontmatter = z.infer<typeof skillFrontmatterSchema>;
