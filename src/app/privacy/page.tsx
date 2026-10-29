import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION =
  "SkillNow 的隐私政策：匿名统计、赞踩防刷哈希、本地存储与第三方服务说明。";

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
          更新日期：2026 年 10 月 27 日
        </p>

        <div className="prose mt-8">
          <p>
            这个站点不要求登录，也不收集姓名、邮箱或账号信息。下面是我们实际用到的
            少量数据，以及它们的用途和保留时间。
          </p>

          <h2>匿名访问统计</h2>
          <p>
            本站使用 PostHog 做匿名访问统计。它不使用 cookie，只用浏览器
            localStorage 里的匿名标识，记录页面访问与少量交互事件（复制、下载、
            投票、外链点击、搜索）。这些数据用于了解哪些内容更有用，不用于广告
            画像，也不包含你的姓名或联系方式。
          </p>
          <p>
            我们关闭了 PostHog 的 session recording 与 autocapture，不会录制你的
            页面操作或输入内容。
          </p>

          <h2>赞/踩防刷</h2>
          <p>
            赞/踩是匿名的。为了防止同一来源反复投票，边缘函数会把你的 IP 与
            User-Agent 拼接后做带密钥的 HMAC-SHA256 哈希，只保存哈希结果，
            <strong>不保存原始 IP</strong>。哈希记录保留 24–48 小时，只用于
            「同一 IP 对同一 Skill 每天一次」的判断，之后会被清理或不再读取。
          </p>

          <h2>本地存储</h2>
          <p>
            收藏与「今天已投」记录保存在你浏览器的 localStorage 中，不会上传到
            服务器。清除浏览器站点数据即可删除。
          </p>

          <h2>第三方服务</h2>
          <ul>
            <li>PostHog：匿名访问统计</li>
            <li>腾讯云 EdgeOne：静态托管、边缘函数与 KV 存储</li>
          </ul>

          <h2>数据保留</h2>
          <ul>
            <li>赞踩防刷哈希：24–48 小时</li>
            <li>匿名统计：按 PostHog 项目的数据保留设置</li>
            <li>赞踩汇总计数：不包含个人身份信息，长期保留</li>
          </ul>

          <h2>你的选择</h2>
          <p>
            你可以通过浏览器设置或清除站点数据来删除本地收藏与投票记录；
            也可以通过邮件联系我们，请求删除与哈希相关的记录或询问数据情况。
          </p>

          <h2>联系我们</h2>
          <p>
            邮箱：<a href="mailto:hi@skillnow.cn">hi@skillnow.cn</a>
          </p>
          <p>
            另见 <Link href="/terms/">用户协议与免责声明</Link>。
          </p>
        </div>
      </div>
    </div>
  );
}
