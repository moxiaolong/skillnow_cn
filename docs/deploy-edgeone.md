# EdgeOne Pages 部署指南

目标：把 `out/` 静态站点和 `functions/` 边缘函数部署到腾讯云 EdgeOne Pages，绑定
`skillnow.cn`，赞踩数据存 EdgeOne KV，全程 0 成本。

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

> 仓库里不要提交 `.env.local`、`REACTIONS_HMAC_SECRET`、`REACTIONS_CLEANUP_SECRET`。
> `.gitignore` 已忽略 `.env*`，只保留 `.env.example`。

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

## 4. 创建 KV 并绑定

1. EdgeOne Pages 控制台 → **KV 存储** → 新建命名空间，例如 `skillnow-reactions`。
2. 在 Pages 项目的 **设置 → KV 绑定** 中绑定：
   - 变量名：`REACTIONS_KV`
   - 命名空间：`skillnow-reactions`
3. 绑定后在边缘函数里通过 `env.REACTIONS_KV` 访问。

## 5. 配置环境变量

在 Pages 项目的 **设置 → 环境变量** 中添加：

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog 项目 Key；不填则关闭统计 |
| `NEXT_PUBLIC_POSTHOG_HOST` | 例如 `https://us.i.posthog.com` |
| `REACTIONS_HMAC_SECRET` | 随机长字符串，用于 IP+UA 哈希 |
| `REACTIONS_CLEANUP_SECRET` | 另一个随机长字符串，用于清理接口鉴权 |

生成随机密钥：

```bash
openssl rand -hex 32
```

> `NEXT_PUBLIC_*` 会进入前端产物；`REACTIONS_*` 只给边缘函数用，不会打包到前端。
> 修改环境变量后需要重新部署。

## 6. 验证边缘函数

部署后：

```bash
curl "https://<preview-domain>/api/reactions?ids=sigmund-freud,hegel"
```

应返回：

```json
{"counts":{"sigmund-freud":{"up":0,"down":0},"hegel":{"up":0,"down":0}}}
```

投票：

```bash
curl -X POST "https://<preview-domain>/api/reactions" \
  -H "content-type: application/json" \
  -H "Origin: https://skillnow.cn" \
  -d '{"slug":"sigmund-freud","action":"up"}'
```

第一次应返回 `{"ok":true,"counts":{"up":1,"down":0}}`；同一天再投返回 409。

> EdgeOne KV 是最终一致模型，边缘缓存约 60 秒。投票者自己的页面会乐观 +1，
> 其他用户最多约 60 秒后看到最新计数。

## 7. 绑定域名与备案

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

## 8. 配置每日清理

`functions/api/reactions-cleanup.js` 会删除 2 天前的投票哈希 key。

1. GitHub 仓库 → **Settings → Secrets and variables → Actions**，新增：
   - `REACTIONS_CLEANUP_SECRET`：与 EdgeOne 环境变量里的值一致。
2. `.github/workflows/cleanup-reactions.yml` 已配置每天 03:17 UTC 调用：
   `https://skillnow.cn/api/reactions-cleanup`
3. 上线前如果域名还没生效，工作流会失败；可以先在 Actions 里手动禁用，
   上线后再启用（或手动触发一次）。

如果 EdgeOne KV 运行时不支持 `list`，清理接口会返回 501；此时旧 key 会保留但不再读取，
隐私政策里已说明这一限制。

## 9. 上线检查清单

- [ ] 首页、`/skills/`、4 个详情页、标签页、榜单、关于、隐私、条款均可访问
- [ ] 搜索弹窗能加载 `/search-index.json` 并命中
- [ ] 复制提示词 / 复制 SKILL.md / 下载 .md 正常
- [ ] 赞踩：第一次成功，第二次同一天 409，刷新后计数仍在
- [ ] 断网或 API 失败时显示「本次反馈仅保存在本地」
- [ ] 四个精神分析详情页底部有 SoulStation CTA，其它页面没有
- [ ] 来源徽章只在有女娲署名的页面出现（齐泽克没有）
- [ ] sitemap.xml、robots.txt、canonical、JSON-LD、OG 图可访问
- [ ] 375 / 390 / 768 / 1440 无横向滚动
- [ ] Lighthouse 性能 / SEO / 可访问性 ≥ 90
- [ ] 页脚公司主体、ICP 备案号、hi@skillnow.cn 正确

## 10. 常见问题

### 构建失败：`spawnSync pnpm.cmd EINVAL`

Windows 本地构建已改用 `execSync`；如果仍有问题，确认在 PowerShell / Git Bash 中
能直接运行 `pnpm -v`。

### 构建失败：OG 图

`build:og` 需要中文字体。本机默认读取 `C:/Windows/Fonts/simfang.ttf`；
EdgeOne 构建环境没有该字体时会跳过，保留已提交的 `public/og/*.png`。
如需重新生成，在本机运行 `pnpm build:og` 后提交 PNG。

### 赞踩一直显示「暂无评价」

- 检查 `REACTIONS_KV` 是否绑定。
- 检查 `REACTIONS_HMAC_SECRET` 是否配置。
- 检查 `Origin` 是否为 `https://skillnow.cn`、`https://www.skillnow.cn` 或 EdgeOne 预览域。
- 查看 Pages 项目的函数日志。

### 赞踩第二次仍然成功

EdgeOne KV 最终一致，voter key 写入可能有延迟；等约 60 秒再试。
如果持续出现，检查 `v:{date}:{hash}:{slug}` 是否写入成功。

### 修改内容后页面没更新

内容文件改动后需要重新构建（push 到 GitHub 触发 Pages 构建，或本地 `pnpm build`）。
`public/skills/` 与 `public/search-index.json` 是构建产物，不要手改。

## 11. 免费额度提醒

EdgeOne Pages 免费版当前包含（以控制台为准）：

- 静态托管流量与请求不限量
- 每月约 300 万次边缘函数执行
- KV 1 GB
- 每月 500 次构建

本项目 14–50 个 Skill、低流量场景完全在额度内。额度政策可能调整，上线后可在
控制台「用量概览」查看。
