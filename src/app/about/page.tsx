import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION =
  "SkillNow 是一个 AI Skill 整理站：整理者日常在用的 Skill，觉得好用就放出来，大家自取。";

export const metadata: Metadata = {
  title: "关于",
  description: DESCRIPTION,
  alternates: { canonical: "/about/" },
  openGraph: {
    title: "关于 SkillNow",
    description: DESCRIPTION,
    url: "/about/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "关于 SkillNow",
    description: DESCRIPTION,
    images: ["/og/default.png"],
  },
};

export default function AboutPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          关于 SkillNow
        </h1>
        <p className="mt-5 text-base leading-8 text-ink">
          SkillNow 是一个 AI Skill 整理站。
        </p>

        <div className="prose mt-8">
          <p>
            这里收录的是整理者日常在用的 Skill。觉得好用，就整理出来放在这，
            大家自取。不是商店，也不是媒体评测，也不代表任何人物或机构。
          </p>

          <h2>内容从哪里来</h2>
          <p>
            大部分 Skill 由{" "}
            <a
              href="https://github.com/alchaincyf/nuwa-skill"
              target="_blank"
              rel="noreferrer"
            >
              女娲 · Skill造人术
            </a>{" "}
            生成。每个详情页只在文件本身有署名时标注来源，没有就不标；
            不强行给所有内容安一个出处。
          </p>

          <h2>怎么整理</h2>
          <ul>
            <li>保留原始正文与角色规则，不改写</li>
            <li>补充使用笔记、示例问题与标签，方便判断是否适合自己</li>
            <li>不做站方评分，只展示读者的赞/踩</li>
          </ul>

          <h2>不做什么</h2>
          <p>
            不提供心理诊断、医疗建议或投资建议；不代替专业人士；
            不声称与任何人物、作者或机构有隶属关系。
          </p>

          <h2>内容许可</h2>
          <p>
            本站整理内容采用 <Link href="/terms/">CC BY 4.0</Link>{" "}
            许可，转载或引用请注明来源。原始 Skill 的正文权利归其各自作者或生成者所有。
          </p>

          <h2>联系</h2>
          <p>
            内容纠错、侵权投诉或下架请求：
            <a href="mailto:hi@skillnow.cn">hi@skillnow.cn</a>
          </p>
        </div>
      </div>
    </div>
  );
}
