import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function extractToc(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];

  visit(tree, "heading", (node) => {
    const text = toString(node).trim();
    const id = slugger.slug(text);

    if (node.depth === 2 || node.depth === 3) {
      toc.push({ id, text, level: node.depth });
    }
  });

  return toc;
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeShiki, {
      theme: "github-light",
    })
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}
