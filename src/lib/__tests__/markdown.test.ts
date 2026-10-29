import { describe, expect, it } from "vitest";

import { extractToc, renderMarkdown } from "@/lib/markdown";

describe("extractToc", () => {
  it("collects H2 and H3 headings", () => {
    const toc = extractToc("## 第一节\n\n### 1.1\n\n## 第二节");

    expect(toc).toHaveLength(3);
    expect(toc[0]).toMatchObject({ text: "第一节", level: 2 });
    expect(toc[1]).toMatchObject({ text: "1.1", level: 3 });
    expect(toc[2]).toMatchObject({ text: "第二节", level: 2 });
    expect(toc.every((item) => item.id.length > 0)).toBe(true);
  });

  it("ignores H1", () => {
    expect(extractToc("# 标题\n\n## 第一节")).toHaveLength(1);
  });
});

describe("renderMarkdown", () => {
  it("renders headings with ids and emphasis", async () => {
    const html = await renderMarkdown("## 标题\n\n**粗体**");

    expect(html).toContain("<h2 id=");
    expect(html).toContain("<strong>粗体</strong>");
  });

  it("renders GFM tables", async () => {
    const html = await renderMarkdown(
      "| 列 A | 列 B |\n| --- | --- |\n| 1 | 2 |",
    );

    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });
});
