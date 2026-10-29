# 内容维护指南

## 1. 一个 Skill 是什么

`content/skills/<slug>.md` 一个文件。文件由两部分组成：

1. YAML frontmatter：站点展示与 SEO 用的元数据。
2. 原始 Skill 正文：从源 `SKILL.md` 原样保留，不改写角色规则。

slug 用英文小写与连字符，例如 `sigmund-freud`、`charlie-munger`。

## 2. frontmatter 字段

```yaml
---
name: sigmund-freud-perspective          # 原始 SKILL.md 的 name，保留
description: |                            # 原始 description，保留
  西格蒙德·弗洛伊德的思维框架与表达方式……
title: 西格蒙德·弗洛伊德 · 精神分析方法论   # 原文 H1，详情页副标题与 SEO title
shortTitle: 弗洛伊德                       # 卡片与 H1 用的短名
slug: sigmund-freud                        # URL：/skills/<slug>/
summary: 用精神分析的视角看潜意识动机、梦与口误。 # 40–60 字，卡片摘要
tags: [psychology, psychoanalysis, dream, self-knowledge] # 标签 slug
updatedAt: "2026-10-27"                    # 展示为「更新于」
note:                                      # 使用笔记，无人称条目式
  scenarios:
    - 反复出现的梦、口误、关系里重复的同一种模式
  notFor:
    - 需要诊断或治疗的精神健康问题
  tips:
    - 先描述具体事件、梦境或原话，再让它拆解底层动机
  cautions:
    - 它倾向于把问题还原到童年与性驱力，未必适合当前语境
examples:                                  # 3–5 条，点击复制
  - 我最近反复梦到同一座房子，帮我从精神分析的角度看看。
source:                                    # 可选：有署名才写，没有就不写
  name: 女娲 · Skill造人术
  url: https://github.com/alchaincyf/nuwa-skill
  author: 花叔
license: CC-BY-4.0
disclaimers: [non-person, ai-accuracy, mental-health]
relatedTool:                               # 可选：只有四个精神分析 Skill 配置
  label: 精神分析专家团
  description: 想把这些视角用在一次完整的自我探索上？
  url: https://soulstation.club/psychoanalysis?utm_source=skillnow&utm_medium=referral&utm_campaign=skill_detail
featured: true                             # 是否进首页「常用清单」
order: 1                                   # 默认排序 / 同分排序
draft: false                               # true 不生成页面、不出现在列表
---
```

## 3. 标签

标签定义在 `content/taxonomy.ts`，每个标签包含：

- `label`：中文展示名
- `description`：标签页描述
- `order`：展示顺序

当前标签：

| slug | 中文 |
|---|---|
| psychology | 心理学 |
| psychoanalysis | 精神分析 |
| analytical-psychology | 分析心理学 |
| personality-types | 人格类型 |
| dream | 梦与象征 |
| self-knowledge | 自我认知 |
| philosophy | 哲学 |
| dialectics | 辩证法 |
| critical-theory | 批判理论 |
| social-critique | 社会批判 |
| power | 权力与制度 |
| ethics | 伦理学 |
| investing | 投资 |
| business | 商业 |
| management | 管理 |
| product | 产品 |
| decision-making | 决策 |
| mental-models | 思维模型 |
| china-business | 中国商业 |

新增标签：先在 `content/taxonomy.ts` 里加一条，再在 Skill 的 `tags` 里使用。
校验脚本会拒绝未定义的标签。

## 4. 使用笔记

「使用笔记」是全站唯一的编辑性内容，用无人称条目式，不做媒体评测。四个字段：

- `scenarios`：适用场景
- `notFor`：不适合
- `tips`：使用建议
- `cautions`：注意

写作原则：

- 写具体，不写「非常强大」「值得一试」这类空话。
- 写边界，尤其是不适合什么。
- 不做诊断、投资或法律建议。
- 不假设「编辑」角色；这是整理者的使用观察。

## 5. 示例问题

`examples` 写 3–5 条用户可以直接复制到对话框的中文问题。要求：

- 具体、有场景，不要「帮我分析一下」这种空问题。
- 能体现该 Skill 的独特视角。
- 不涉及真实个人隐私或敏感信息。

## 6. 免责声明

`disclaimers` 从下面选：

| 值 | 适用 | 页面文案 |
|---|---|---|
| `non-person` | 全部（必填） | 个人整理，非本人/非代言 |
| `ai-accuracy` | 全部（必填） | AI 内容可能存在错误 |
| `mental-health` | 弗洛伊德、荣格、拉康、毕比 | 不构成心理/医疗建议 + 热线 |
| `investment` | 芒格、巴菲特 | 不构成投资建议 |
| `viewpoint` | 马克思、福柯、齐泽克、黑格尔 | 角色观点不代表整理者立场 |

校验会要求每个 Skill 至少包含 `non-person` 与 `ai-accuracy`。

## 7. 来源与女娲

- 只在源文件本身出现 `女娲` / `nuwa-skill` / `花叔` 时写 `source`。
- 没有署名就不写，页面不会显示来源区。
- 不要在站点层面写「所有内容由女娲生成」；不同 Skill 来源不同。
- `source.author` 可选，通常是「花叔」。

## 8. 导入新 Skill

源目录默认 `C:/Users/dragon/Desktop/完整skill`，可覆盖：

```bash
SKILL_SOURCE_DIR="/path/to/skills" pnpm import:skills
```

脚本行为：

- 读取 `SKILL*.md`，按 frontmatter 的 `name` 匹配配置。
- 按 `name` 去重，默认不覆盖已有 `content/skills/<slug>.md`。
- `--force` 才会覆盖已有文件（会冲掉手写笔记，慎用）。
- 自动检测女娲署名并写入 `source`。
- 新 Skill 默认 `draft: true`，需要手动补齐笔记与示例后发布。

导入后：

1. 打开 `content/skills/<slug>.md`，检查 `title` / `shortTitle` / `summary`。
2. 补 `tags`、`note`、`examples`、`disclaimers`。
3. 需要发布时把 `draft` 改成 `false`。
4. 运行 `pnpm validate:content`。
5. 运行 `pnpm build`，检查页面。

## 9. 构建产物

`pnpm build` 会自动生成：

- `public/search-index.json`：搜索索引
- `public/skills/<slug>/prompt.txt`：纯提示词
- `public/skills/<slug>/SKILL.md`：带 name/description 的完整文件
- `public/og/<slug>.png`：分享图
- `out/`：静态站点

不要手动改 `public/skills/` 与 `public/search-index.json`；改内容文件后重新构建即可。

## 10. 发布前检查

- [ ] `draft: false`
- [ ] `summary` 40–60 字
- [ ] 3–6 个已定义标签
- [ ] `note` 四项至少各有一条
- [ ] `examples` 至少 3 条
- [ ] `disclaimers` 含 `non-person` 与 `ai-accuracy`
- [ ] 人物类有 `mental-health`，投资类有 `investment`，争议人物有 `viewpoint`
- [ ] `relatedTool` 只在弗洛伊德/荣格/拉康/齐泽克出现
- [ ] `pnpm validate:content` 通过
- [ ] `pnpm build` 通过
- [ ] 移动端 375px 与桌面 1440px 检查
- [ ] 复制提示词、复制 SKILL.md、下载、赞踩降级均正常
