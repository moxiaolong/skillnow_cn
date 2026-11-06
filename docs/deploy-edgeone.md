# EdgeOne Pages 部署指南

目标：把 `out/` 静态站点部署到腾讯云 EdgeOne Pages，绑定 `skillnow.cn`，全程 0 成本。

## 0. 前置条件

- 域名 `skillnow.cn` 已完成 **ICP 备案**（公司主体：北京此在科技有限公司）。
  建议沿用 soulstation.club 的现有备案，在 **阿里云备案控制台** 做「新增网站」。
  未备案时不要绑定中国大陆节点。
- 腾讯云账号已实名，EdgeOne Pages 免费版已开通。
- GitHub 仓库：`git@github.com:moxiaolong/skillnow_cn.git`。
- 本地 `pnpm build` 通过。

> 备案接入商和托管商可以不同：可以在阿里云备案，再把域名绑定到 EdgeOne。
> 如果 EdgeOne 控制台提示需要「接入备案」，按提示提交；若要求腾讯云云资源/授权码，
> 再评估是否继续用大陆节点，或先用全球节点 / 阿里云静态托管。

## 1. 本地构建

```bash
pnpm install
pnpm build
pnpm start
```

确认 `out/` 存在，`out/index.html`、`out/skills/sigmund-freud/index.html`、
`out/search-index.json`、`out/skills/sigmund-freud/SKILL.md`、`out/og/default.png` 都在。

## 2. 推送到 GitHub

仓库已创建并推送（`main`，commit `7296b1c`）。如需重新推送：

```bash
git add .
git commit -m "feat: update SkillNow"
git branch -M main
git remote add origin git@github.com:moxiaolong/skillnow_cn.git
git push -u origin main
```

> 仓库里不要提交 `.env.local`。`.gitignore` 已忽略 `.env*`，只保留 `.env.example`。

## 3. 创建 EdgeOne Pages 项目

1. 登录腾讯云 EdgeOne 控制台，进入 **Pages**。
2. **新建项目 → 导入 Git 仓库**，选择 `moxiaolong/skillnow_cn` 仓库。
3. 构建配置：
   - Framework：Next.js
   - 构建命令：`pnpm build`
   - 输出目录：`out`
   - Node 版本：22
4. 首次构建。构建时会自动执行 `prebuild`（校验、搜索索引、复制文件、OG 图）。
   - 如果构建环境没有中文字体，`build:og` 会跳过并保留仓库里已提交的 `public/og/*.png`。
5. 记下平台分配的预览域名。

## 4. 配置环境变量

在 Pages 项目的 **设置 → 环境变量** 中添加：

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog 项目 Key；不填则关闭统计 |
| `NEXT_PUBLIC_POSTHOG_HOST` | 例如 `https://us.i.posthog.com` |

> `NEXT_PUBLIC_*` 会进入前端产物；修改环境变量后需要重新部署。
> AI 对话不依赖任何服务端环境变量，用户自己的 API Key 只保存在浏览器。

## 5. 绑定域名与备案

1. 备案通过后，在 Pages 项目 **域名管理** 中添加：
   - `skillnow.cn`（主域名）
   - `www.skillnow.cn`
2. 按控制台提示配置 DNS：
   - apex 指向 EdgeOne 提供的目标
   - `www` 配置 301 跳转到 apex
3. 开启 HTTPS（EdgeOne 自动证书）。
4. 在 `src/components/site/footer.tsx` 把 `京ICP备XXXXXXXX号` 替换成真实备案号，
   重新构建部署。
5. 如有公安备案，在页脚补上公安备案号与链接。

> skillnow.cn 可以在阿里云做新增网站备案，再绑定到 EdgeOne。
> 如果 EdgeOne 绑定域名时提示需要「接入备案」，按控制台提示提交；
> 若要求腾讯云云资源/备案授权码，先不要急着购买，把控制台提示发我，
> 我们再决定是继续用 EdgeOne 大陆节点，还是先用全球节点 / 阿里云静态托管。
>
> 未备案时只能使用「全球可用区（不含中国大陆）」，国内访问会慢；
> 不要用未备案域名做正式推广。

## 6. 上线检查清单

- [ ] 首页、`/skills/`、4 个详情页、标签页、AI 对话、关于、隐私、条款均可访问
- [ ] 搜索弹窗能加载 `/search-index.json` 并命中
- [ ] 复制提示词 / 复制 SKILL.md / 下载 .md 正常
- [ ] AI 对话：默认模型 `deepseek-flash`，填写 API 地址与 Key 后能收到流式回复（含思考过程）；设置中关闭「显示思考过程」后，回答上方不再展开思考内容，重新开启后恢复显示
- [ ] 联网搜索：默认开启，模型触发后能显示来源；关闭后不再请求 Search API
- [ ] AI 对话：无效 Key 显示友好错误；配置与历史刷新后仍在；清除配置后 Key 被删除
- [ ] AI 对话页底部始终显示「内容为 AI 生成，并非真人，结果仅供参考。」
- [ ] 讨论模式：至少 2 位（建议 4 位以内，可继续多选并显示 Token 风险提示）后每轮能显示参与者、消息内回应状态（已回应/回应中/无回应）和主持人选择；用户提问后每位参与者都会先回答一次；每轮每位参与者最多发言一次；时间线/树状切换、折叠、引用与回应跳转正常；用户可引用任意一条消息再回复；只有明确观点才举手；确实无人继续时直接结束且不显示结束提示；停止与刷新恢复历史正常；开启搜索时来源显示在对应发言下
- [ ] 四个精神分析详情页底部有 SoulStation CTA；页脚全站显示 SoulStation 推荐链接
- [ ] 来源徽章只在有女娲署名的页面出现（齐泽克没有）
- [ ] sitemap.xml、robots.txt、canonical、JSON-LD、OG 图可访问
- [ ] 375 / 390 / 768 / 1440 无横向滚动
- [ ] Lighthouse 性能 / SEO / 可访问性 ≥ 90
- [ ] 页脚公司主体、ICP 备案号、hi@skillnow.cn 正确

## 7. 常见问题

### 构建失败：`spawnSync pnpm.cmd EINVAL`

Windows 本地构建已改用 `execSync`；如果仍有问题，确认在 PowerShell / Git Bash 中
能直接运行 `pnpm -v`。

### 构建失败：OG 图

`build:og` 需要中文字体。本机默认读取 `C:/Windows/Fonts/simfang.ttf`；
EdgeOne 构建环境没有该字体时会跳过，保留已提交的 `public/og/*.png`。
如需重新生成，在本机运行 `pnpm build:og` 后提交 PNG。

### AI 对话无法连接模型平台

- 检查 API 地址是否为 `https://` 开头的完整地址（默认 `https://api.deepseek.com`）。
- 检查 API Key 是否有效、账户是否有余额；401/402 会显示对应提示。
- 浏览器直连依赖模型平台允许 CORS；请确认所选平台支持。
- 对话与配置只在本机，本站服务端没有相关日志可查。

### 联网搜索失败

- 联网搜索使用所填 API 的 `/v1/tools/search`；平台不支持时会返回 404，关闭联网搜索或改用支持该接口的平台。
- 401/402/429 与对话接口一致，检查 Key、余额和频率。

### 修改内容后页面没更新

内容文件改动后需要重新构建（push 到 GitHub 触发 Pages 构建，或本地 `pnpm build`）。
`public/skills/` 与 `public/search-index.json` 是构建产物，不要手改。

## 8. 免费额度提醒

EdgeOne Pages 免费版当前包含（以控制台为准）：

- 静态托管流量与请求不限量
- 每月 500 次构建

本项目 14–50 个 Skill、低流量场景完全在额度内。额度政策可能调整，上线后可在
控制台「用量概览」查看。
