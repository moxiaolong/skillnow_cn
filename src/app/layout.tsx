import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

const SITE_NAME = "SkillNow";
const SITE_DESCRIPTION =
  "整理者日常在用的 AI Skill。收录弗洛伊德、荣格、黑格尔、芒格、雷军等人物思维 Skill，支持全文阅读、复制与下载。";

export const metadata: Metadata = {
  metadataBase: new URL("https://skillnow.cn"),
  title: {
    default: `${SITE_NAME} · 中文 AI Skill 精选`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI Skill",
    "提示词",
    "Claude Code",
    "思维模型",
    "弗洛伊德",
    "荣格",
    "黑格尔",
    "芒格",
    "雷军",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: "北京此在科技有限公司",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://skillnow.cn/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · 中文 AI Skill 精选`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · 中文 AI Skill 精选`,
    description: SITE_DESCRIPTION,
    images: ["/og/default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={GeistSans.variable}>
      <body className="flex min-h-dvh flex-col bg-bg text-ink">
        <a href="#main" className="skip-link">
          跳到主要内容
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <PostHogProvider />
      </body>
    </html>
  );
}
