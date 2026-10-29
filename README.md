# SkillNow

AI Skill 整理站。整理者日常在用的 Skill，觉得好用就整理出来放在这，大家自取。

- 站点：https://skillnow.cn
- 内容：14 个人物思维 Skill（全部已发布）
- 视觉：极简科技风 + 赤陶橙 `#E8590C`，宋体标题 + 无衬线正文，仅浅色
- 技术：Next.js 16 App Router + React 19 + Tailwind CSS 4 + TypeScript
- 部署：静态导出 `out/` → 腾讯云 EdgeOne Pages；赞踩用 EdgeOne Pages Functions + KV
- 成本：0 元（EdgeOne Pages 免费版 + KV 免费额度）

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
  app/               页面（首页、skills、tags、rankings、about、privacy、terms）
  components/        Header / Footer / SkillCard / Search / Reactions / TOC 等
  lib/               内容读取、Markdown 渲染、搜索、赞踩上下文、工具函数
functions/api/       EdgeOne Pages Functions：赞踩与清理
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
- 详细字段说明见 [docs/content-guide.md](docs/content-guide.md)。

## 标签

不设分类，只用标签。标签定义在 `content/taxonomy.ts`；每个 Skill 3–6 个标签。
新增标签时同时补上中文名、描述和排序，否则校验会失败。

## 赞踩

- 前端：`ReactionsProvider` 拉取 `/api/reactions?ids=...`，投票走 `POST /api/reactions`。
- 后端：`functions/api/reactions.js`，KV 绑定名 `REACTIONS_KV`。
- 防刷：IP + UA 的 HMAC-SHA256 哈希，按 Asia/Shanghai 日期每天一次；不存原始 IP。
- 降级：接口不可用时只写 localStorage，页面浏览/复制不受影响。
- 清理：`functions/api/reactions-cleanup.js` 由 GitHub Actions 每日调用，删除 2 天前的投票哈希。

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

1. 推送到 GitHub。
2. EdgeOne Pages 导入仓库，构建命令 `pnpm build`，输出目录 `out`，Node 22。
3. 创建 KV 命名空间并绑定为 `REACTIONS_KV`。
4. 配置环境变量：`NEXT_PUBLIC_POSTHOG_KEY`、`NEXT_PUBLIC_POSTHOG_HOST`、
   `REACTIONS_HMAC_SECRET`、`REACTIONS_CLEANUP_SECRET`。
5. 备案完成后绑定 `skillnow.cn` 与 `www.skillnow.cn`，apex 为主，www 301。
6. 页脚替换真实 ICP 备案号。

## 许可

站点整理内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh-hans)。
原始 Skill 正文的权利归其各自作者或生成者所有；本站许可不替代原始许可。

内容纠错、侵权投诉或下架：hi@skillnow.cn
