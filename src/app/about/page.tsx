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
          SkillNow 是一个人物 Skill 整理站。
        </p>

        <div className="prose mt-8">
          <p>
            收录一些精选的人物Skill。
          </p>


          <p>
            这些 Skill 可以直接复制给 AI，让它按这个人物的方式和你对话；
            也可以把正文里的「核心心智模型」和「决策启发式」当成一套方法去学习。
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
