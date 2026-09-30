# 01 需求分析：默认瘦上下文（default-fact-gate）

- 日期：2026-09-30
- 上游：`docs/default-fact-gate/00-原始需求.md`
- 事实门控：本仓无知识库，基于下钻文件分析

## 1. 现状（下钻结果）

| 位置 | 现状 | 缺口 |
|------|------|------|
| `CLAUDE.md` 流程遵循/场景1 | 已有 compress MUST、事实门控 MUST | 无「禁止贴整本 KB」「S 级不得自行升级」的硬禁令；均为散落规则 |
| `.claude-collective/cicd-rules.md` §4 | 任务3 顺序已强制事实门控 | 只覆盖任务3；任务4/5/6/9 未写「必须带 --query」 |
| `skills/jit-project-knowledge-fact-gate/SKILL.md` | 已定义 query 切片 = `query-admit.md` | 未声明「切片是唯一可注入知识形态」 |
| `skills/jit-context-compress/SKILL.md` | 规则存在 | 未声明「禁止复读前序文档全文」为硬禁令（在 CLAUDE.md 里有 MUST 但未列禁令） |
| `DEVPILOT.md` 分级表 | S 级跳过 PRD/设计/用例已定 | 缺「模型不得自行升级」与「S 级代码改完只出简要报告 + 增量知识库」的成文条款 |

## 2. 需求要点 → 落点

| 00 要点 | 落点 |
|---------|------|
| 法律一：禁贴整本 KB | CLAUDE.md 新章节「注入法律」；fact-gate SKILL 同步声明 |
| 法律二：禁复读、必压缩 | CLAUDE.md 注入法律；compress SKILL 对齐 |
| 法律三：S 级跳过清单 + 不得自行升级 | CLAUDE.md 分级规则；DEVPILOT.md 分级表对齐 |
| 任务4/5/6/9 也必须带 --query | cicd-rules.md §4 扩展；fact-gate SKILL 触发条件改写 |

## 3. 涉及文件（预估 6 个，全部规则/文档）

1. `CLAUDE.md`（核心：注入法律 + S 级条款）
2. `.claude-collective/cicd-rules.md`
3. `skills/jit-project-knowledge-fact-gate/SKILL.md`
4. `skills/jit-context-compress/SKILL.md`
5. `DEVPILOT.md`
6. `.claude/agents/requirements-analysis-agent.md`（④.1 补一句禁令）

## 4. 疑问项

无阻塞项。S 级「简要测试报告」格式沿用现有 05 模板简化版，不新增文档类型。

## 5. 🔴 分级建议：**M 级**

理由：6 个文件、2 个模块域（协议层 + Skill 层）、纯规则文案、无脚本逻辑改动。按 M 级走完整流程（PRD → 设计 → 实现 → 用例 → 报告）。

**待用户确认级别。**