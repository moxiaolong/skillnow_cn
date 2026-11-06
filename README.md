# SkillNow

AI Skill 整理站。整理者日常在用的 Skill，觉得好用就整理出来放在这，大家自取。

- 站点：https://skillnow.cn
- 内容：14 个人物思维 Skill（全部已发布）
- 视觉：极简科技风 + 赤陶橙 `#E8590C`，宋体标题 + 无衬线正文，仅浅色
- 技术：Next.js 16 App Router + React 19 + Tailwind CSS 4 + TypeScript
- 部署：静态导出 `out/` → 腾讯云 EdgeOne Pages
- 成本：0 元（EdgeOne Pages 免费版）

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 http://localhost:3000。

## 构建与预览

```bash
pnpm build
pnpm start
```

`pnpm build` 会先执行 `prebuild`：

1. `validate:content`：校验 `content/skills/*.md` 的 frontmatter、标签、免责声明。
2. `build:search`：生成 `public/search-index.json`。
3. `build:skills`：生成每个 Skill 的 `prompt.txt` 与 `SKILL.md`，供复制/下载。
4. `build:og`：生成 `public/og/*.png`（需要中文字体，见下文）。

然后 `next build` 静态导出到 `out/`。`pnpm start` 用 `serve` 预览 `out/`。

## 目录

```text
content/
  skills/            一个 Skill 一个 Markdown 文件（frontmatter + 原始正文）
  taxonomy.ts        标签定义（slug / 中文名 / 描述 / 顺序）
src/
  app/               页面（首页、skills、tags、chat、about、privacy、terms）
  components/        Header / Footer / SkillCard / Search / Chat / TOC 等
  lib/               内容读取、Markdown 渲染、搜索、AI 对话、工具函数
scripts/             导入、校验、搜索索引、复制文件、OG 图
public/             生成的搜索索引、复制文件、OG 图、字体等
docs/               部署与内容维护文档
```

## 内容维护

- 新增 Skill：把 `SKILL.md` 放进源目录，运行 `pnpm import:skills`，再补齐 frontmatter 里的
  `summary` / `tags` / `note` / `examples`，最后 `pnpm validate:content`。
- 源目录默认是 `C:/Users/dragon/Desktop/完整skill`，可用 `SKILL_SOURCE_DIR` 覆盖。
- 导入脚本按 `name` 去重，默认不覆盖已有文件；`--force` 才会覆盖。
- 发布一个草稿：把 frontmatter 的 `draft: true` 改成 `false`，并补齐使用笔记与示例问题。
- 每个已发布 Skill 需在 `content/reader-briefs.ts` 补一条「读给自己」（三条方法要点 + 一个自问），否则校验失败。
- 详细字段说明见 [docs/content-guide.md](docs/content-guide.md)。

## 标签

不设分类，只用标签。标签定义在 `content/taxonomy.ts`；每个 Skill 3–6 个标签。
新增标签时同时补上中文名、描述和排序，否则校验会失败。

## AI 对话

- `/chat/` 为纯前端对话页，用户自行填写 API 地址、API Key 与模型（默认 `deepseek-flash`，也可选 `deepseek-v4-pro`；思考模式默认开启）。
- 配置、联网搜索开关与对话记录只保存在浏览器 localStorage；请求由浏览器直接发往用户填写的模型平台，本站不代理、不接收。
- 设置弹窗可调思考强度（默认 / 低 / 高 / 最高）；选择「默认」时不发送 `reasoning_effort`。也可关闭「显示思考过程」，关闭后仍会保留思考内容，只是不在回答上方展开。
- 设置弹窗可调上下文上限（默认 1M）；聊天底部圆环显示估算占用，达到 80% 且消息足够多时自动压缩早期对话，也可手动压缩为摘要。
- AI 回答支持 Markdown（GFM）：标题、列表、表格、代码块、链接等；不渲染原始 HTML，图片显示为链接。
- 联网搜索默认开启：模型可自主调用 `web_search` 工具；浏览器调用所填 API 的 `/v1/tools/search` 并把摘要回传给模型，来源显示在回答下方。
- Skill 详情页的「和这个 Skill 对话」会读取 `/skills/<slug>/prompt.txt` 作为系统提示，不上传用户内容。
- 在「全部 Skill」中置顶的 Skill，会排在对话页 Skill 选择列表最前，并显示「置顶 ·」前缀。
- 讨论模式至少选 2 个 Skill；默认建议最多 4 位，也可以继续选更多，但每轮会并行征询每位参与者的发言意愿，Token 消耗可能暴增。用户提问后，每位参与者都会先直接回答一次；之后进入举手讨论：每轮中每位参与者最多发言一次，参与者可对任意一条历史消息举手（不只最新一条），主持人从举手者中选择，直到本轮所有参与者都发过言或无人举手。只有明确反对、纠正或关键补充时才举手，没人有明确意见时会较快结束。模型只输出「没有新的观点」「没有补充」时按 PASS 处理并移除，不留空发言；确实无人继续时直接结束，不显示「没有人举手」的结束提示。只有确实引用时才显示引用块。
- 每条消息下方显示其他参与者对它的回应状态：「已回应」「回应中」或「无回应」；点击已回应/回应中的名字可跳到对应回复。
- 每条消息旁可点「引用」选定回复对象；输入框会显示引用预览，发送后普通对话把被引用内容一并交给模型，时间线显示引用块，树状则按回复关系嵌套。
- 讨论支持「时间线 / 树状」切换：树状按回复关系嵌套，可折叠分支；层级本身已表明回复对象，因此树状下不再显示引用块和回应状态。时间线下点击引用或回应状态会自动展开并跳到对应消息。
- 讨论期间可以随时插话；每轮重新征询发言意愿，最多轮数可调 2–10 或无限。无限模式不会按轮数自动停止，建议全程看护，避免消耗过多 Token；随时可以停止讨论，不生成总结。
- 参与 Skill、模式与讨论记录只存 localStorage；讨论历史按参与者组合隔离（`discussion:<slugs>`）。每次发言意愿、主持人选择、发言和联网搜索都会单独请求所填 API。
- `/chat` 跳过 PostHog，聊天代码不调用 `track()`。

## PostHog

在 `.env.local` 或 EdgeOne 环境变量里配置：

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

未配置时统计自动禁用。当前配置为无 cookie、关闭 session recording 与 autocapture。

## OG 图与中文字体

`scripts/generate-og.tsx` 默认读取 `OG_FONT_PATH`，未设置时读取 `C:/Windows/Fonts/simfang.ttf`。

- 该字体只在本机生成图片时使用，**不要把字体文件提交到仓库**。
- 生成的 `public/og/*.png` 会提交到仓库；EdgeOne 构建环境没有中文字体时，脚本会跳过生成并保留已有 PNG。
- 如果内容更新后需要重新生成 OG 图，在本机运行 `pnpm build:og` 后提交 PNG。

## 部署

完整步骤见 [docs/deploy-edgeone.md](docs/deploy-edgeone.md)。

概要：

1. 在阿里云备案控制台用现有主体给 `skillnow.cn` 做「新增网站备案」。
2. 推送到 GitHub：`git@github.com:moxiaolong/skillnow_cn.git`。
3. EdgeOne Pages 导入仓库，构建命令 `pnpm build`，输出目录 `out`，Node 22。
4. 配置环境变量：`NEXT_PUBLIC_POSTHOG_KEY`、`NEXT_PUBLIC_POSTHOG_HOST`。
5. 备案完成后绑定 `skillnow.cn` 与 `www.skillnow.cn`，apex 为主，www 301。
6. 页脚替换真实 ICP 备案号。

## 许可

站点整理内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh-hans)。
原始 Skill 正文的权利归其各自作者或生成者所有；本站许可不替代原始许可。

内容纠错、侵权投诉或下架：hi@skillnow.cn
