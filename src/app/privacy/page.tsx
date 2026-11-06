import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION =
  "SkillNow 隐私政策：匿名统计、AI 对话与联网搜索的本地配置和第三方直连说明、本地存储与联系方式。";

export const metadata: Metadata = {
  title: "隐私政策",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy/" },
  openGraph: {
    title: "隐私政策",
    description: DESCRIPTION,
    url: "/privacy/",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
};

export default function PrivacyPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          隐私政策
        </h1>
        <p className="mt-3 text-xs text-muted">
          更新日期：2026 年 11 月 6 日
        </p>

        <div className="prose mt-8">
          <p>
            本站不要求登录，不收集姓名、邮箱或账号信息。下面说明实际用到的少量数据。
          </p>

          <h2>匿名统计</h2>
          <p>
            本站使用第三方统计服务做匿名访问统计，不使用 cookie，只用浏览器
            localStorage 中的匿名标识，记录页面访问与复制、下载等交互。数据只用于了解内容使用情况，不用于广告画像；保留时间按服务方的数据保留设置。
          </p>

          <h2>置顶与本地存储</h2>
          <p>
            你可以在「全部 Skill」列表或详情页置顶 Skill。置顶记录只保存在浏览器
            localStorage，不上传服务器，清除浏览器数据后会丢失；只影响你自己看到的排序。
          </p>

          <h2>AI 对话与本地存储</h2>
          <p>
            站内的 AI 对话采用「浏览器直连」方式。你填写的 API 地址、API
            Key、模型名称、联网搜索开关，以及产生的对话记录，只保存在当前浏览器的
            localStorage 中，不会上传到本站服务器，也不会写入本站的访问统计。
          </p>
          <p>
            发送消息时，你的浏览器会直接请求你所填写的模型平台，并把 API Key
            与对话内容发送给该平台。本站不参与这次请求，不接收、不存储对话内容。该平台如何收集、使用和保留数据，适用其自身的隐私政策与服务条款，请在连接前自行了解。开启上下文压缩时，早期对话也会发送给该平台生成摘要。
          </p>
          <p>
            联网搜索默认开启。模型决定调用搜索时，你的浏览器会把查询词发送给
            你所填写的 API
            服务提供的搜索接口，并把返回的网页摘要作为上下文发送给你连接的模型平台；本站不接收这些内容。你可以在对话输入框下方关闭。搜索结果来自第三方网页，可能不准确或包含误导性内容，请自行核实。
          </p>
          <p>
            API Key
            以明文形式保存在浏览器本地，仅用于你发起的请求。请勿在公共或共享设备上保存
            Key；使用后可在 <Link href="/chat/">AI 对话</Link>{" "}
            页点击「清除配置」，并在需要时清空本地对话记录。如果怀疑 Key
            已泄露，请立即到模型平台撤销并重新生成。
          </p>
          <p>
            AI
            生成内容可能不准确、不完整或已过时，不代表本站观点，也不构成法律、医疗、投资等专业建议。对话界面底部会持续提示：内容为
            AI 生成，并非真人，结果仅供参考。
          </p>

          <h2>联系</h2>
          <p>
            本站由北京此在科技有限公司运营。数据查询或删除请求：
            <a href="mailto:hi@skillnow.cn">hi@skillnow.cn</a>。另见
            <Link href="/terms/">用户协议与免责声明</Link>。
          </p>
        </div>
      </div>
    </div>
  );
}
