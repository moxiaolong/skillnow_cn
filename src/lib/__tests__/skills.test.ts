import { describe, expect, it } from "vitest";

import {
  buildSkillMd,
  countWords,
  formatReadingTime,
  formatWordCount,
  getAllSkills,
  getReadingMinutes,
  stripFirstH1,
} from "@/lib/skills";

describe("countWords", () => {
  it("counts CJK characters and Latin words", () => {
    expect(countWords("你好，世界 hello world")).toBe(6);
  });

  it("returns zero for empty content", () => {
    expect(countWords("")).toBe(0);
  });
});

describe("reading time", () => {
  it("always returns at least one minute", () => {
    expect(getReadingMinutes("你好")).toBe(1);
  });

  it("formats labels", () => {
    expect(formatReadingTime(25)).toBe("约 25 分钟");
  });
});

describe("formatWordCount", () => {
  it("formats small counts", () => {
    expect(formatWordCount(500)).toBe("500 字");
  });

  it("formats ten-thousand counts", () => {
    expect(formatWordCount(15000)).toBe("1.5 万字");
  });
});

describe("stripFirstH1", () => {
  it("removes only the first H1", () => {
    expect(stripFirstH1("# 标题\n\n## 第一节\n\n正文")).toBe(
      "## 第一节\n\n正文",
    );
  });

  it("keeps content that has no H1", () => {
    expect(stripFirstH1("## 第一节\n\n正文")).toBe("## 第一节\n\n正文");
  });
});

describe("buildSkillMd", () => {
  it("reconstructs a Claude Code compatible file", () => {
    const skill = getAllSkills({ includeDrafts: true })[0];
    const md = buildSkillMd(skill);

    expect(md.startsWith("---\nname: ")).toBe(true);
    expect(md).toContain("description: |");
    expect(md).toContain(skill.body.trimStart().slice(0, 40));
  });
});
