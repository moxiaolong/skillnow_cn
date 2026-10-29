import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION =
  "SkillNow 的用户协议与免责声明：内容许可、个人整理说明、心理/医疗与投资免责、侵权下架流程。";

export const metadata: Metadata = {
  title: "用户协议与免责声明",
  description: DESCRIPTION,
  alternates: { canonical: "/terms/" },
  openGraph: {
    title: "用户协议与免责声明",
    description: DESCRIPTION,
    url: "/terms/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
};

export default function TermsPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          用户协议与免责声明
        </h1>
        <p className="mt-3 text-xs text-muted">
          更新日期：2026 年 10 月 27 日
        </p>

        <div className="prose mt-8">
          <p>
            使用 SkillNow（以下简称「本站」）即表示你理解并接受以下说明。
            本站是一个个人整理的 AI Skill 整理站，不是商店、媒体评测或专业服务机构。
          </p>

          <h2>内容许可</h2>
          <p>
            本站整理内容（包括使用笔记、示例问题、标签与页面编排）采用{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/deed.zh-hans"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>{" "}
            许可。转载或引用请注明「来自 SkillNow」并附原文链接。
            原始 Skill 的正文权利归其各自作者或生成者所有，本站的许可不替代原始许可。
          </p>

          <h2>个人整理、非代言</h2>
          <p>
            本站与所收录人物、原作者、生成工具及任何机构均无隶属关系。
            人物类 Skill 是角色扮演式的思维框架，不是人物本人，也不代表其观点或背书。
            页面中的第一人称表达是角色的表达方式，不代表本站或整理者的立场。
          </p>

          <h2>不构成心理或医疗建议</h2>
          <p>
            涉及心理学、精神分析与咨询的内容仅供思考与自我探索，不构成诊断、治疗
            或医疗建议。如果你或他人正处于危机中，请立即联系专业援助：
            全国 24 小时心理援助热线 400-161-9995，或前往就近医院。
          </p>

          <h2>不构成投资建议</h2>
          <p>
            涉及投资、商业与管理的 Skill 仅提供思维框架，不构成任何投资建议、
            要约或推荐。任何决策请结合自身情况并咨询持牌专业人士。
          </p>

          <h2>AI 内容的准确性</h2>
          <p>
            本站内容由 AI 辅助生成与整理，可能存在事实错误、过时信息或偏差。
            请自行核实关键事实，不要把角色输出当作权威结论。
          </p>

          <h2>使用风险</h2>
          <p>
            本站内容按「现状」提供，不对完整性、准确性或适用性作任何明示或默示保证。
            因使用本站内容产生的任何直接或间接损失，本站不承担责任。
          </p>

          <h2>侵权投诉与下架</h2>
          <p>
            如果你认为本站内容侵犯了你的著作权、名誉权或其他合法权益，请发送邮件至{" "}
            <a href="mailto:hi@skillnow.cn">hi@skillnow.cn</a>，并尽量提供：
          </p>
          <ul>
            <li>你的身份与联系方式</li>
            <li>涉及的作品或权利说明</li>
            <li>具体页面链接</li>
            <li>你希望的处理方式</li>
          </ul>
          <p>
            我们会在核实后尽快处理，包括补充署名、修改或下架。对明显侵权的内容，
            我们保留先行下架的权利。
          </p>

          <h2>协议更新</h2>
          <p>
            本站可能根据内容与功能变化更新本页，更新后会在本页标注日期。
            继续使用即视为接受更新后的说明。
          </p>

          <h2>联系</h2>
          <p>
            邮箱：<a href="mailto:hi@skillnow.cn">hi@skillnow.cn</a>
            <br />
            另见 <Link href="/privacy/">隐私政策</Link>。
          </p>
        </div>
      </div>
    </div>
  );
}
