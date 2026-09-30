# 01 需求分析：单一入口与自然语言触发（single-nl-entry）

- 日期：2026-09-30
- 上游：`docs/single-nl-entry/00-原始需求.md`
- 版本规划依据：`docs/DEVPILOT_VERSION_PLAN.md` §4（2.3.0）

## 1. 事实门控说明

`L:\jit\devpilot` 自身无 `docs/knowledge-base/`，无准入清单可验。本分析基于直接下钻的仓库文件（init SKILL、CLAUDE.md 触发表、README），结论以文件现状为准。

## 2. 现状盘点（下钻结果）

| 文件 | 现状 |
|------|------|
| `skills/jit-devpilot-init/SKILL.md` | 第 2 步操作菜单：建议区 3 条斜杠 + 表格里又列 14 条斜杠命令 |
| `CLAUDE.md` | 触发方式一（NL）与方式二（斜杠）并列推荐，无主次 |
| `README.md` | L42 出现 `/jit-devpilot-init`；L86 查看进度仍推 `/jit-project-devpilot-status` |
| `快速入门.md`、`DEVPILOT.md`、`docs/DEVPILOT_CLAUDE_CODE_GUIDE.md` | 均含斜杠命令列表，口径分散 |
| 10 个 `skills/jit-*/SKILL.md` YAML description | 未标注「内部调用」性质 |

## 3. 需求要点覆盖（对照 00）

| 00 要点 | 分析结论 |
|---------|----------|
| 菜单收口 ≤1 斜杠 | 涉及 init SKILL 第 2 步重写；建议区 3 条需压成 1 条 |
| NL 表覆盖任务 2–9 + 事实门控 + 环境 | CLAUDE.md 触发方式一已覆盖全部条目，无需发明新关键字，只需声明其为唯一推荐入口 |
| Skill 目录保留 | 仅改 YAML description 文案，不动脚本与目录 |
| 模糊句先确认、修补句建议 S | 写入 CLAUDE.md 会话协议 + init SKILL 菜单提示 |
| 零新斜杠命令 | guard/INDEX 脚本属 2.5/2.6，本版本不涉及 |

## 4. 涉及文件清单（预估）

1. `skills/jit-devpilot-init/SKILL.md` — 菜单重写（核心）
2. `CLAUDE.md` — 触发方式二降级 + 三条路由硬规则
3. `README.md` — L42/L86 收口
4. `快速入门.md` — 斜杠清单改 NL 口径
5. `DEVPILOT.md` — 入口叙述对齐
6. `docs/DEVPILOT_CLAUDE_CODE_GUIDE.md` — 委派协议中的入口表述（仅措辞）
7. 10 个 Skill YAML description — 加「内部调用」说明

约 17 个文件、以文档/规则为主，无业务脚本改动。

## 5. 疑问项（无阻塞项，均按规划默认处理）

- 激活入口名称：保留 `/jit-devpilot-init`（规划 §4.1 已定），不另造短名。
- 旧斜杠兼容警告：属 2.8.0，本版本不做。

## 6. 🔴 变更分级建议

**建议级别：M（中）**

理由：
- 影响 4–15 个文件（约 17 个），但全部为文档/规则/文案，无脚本逻辑改动
- 触及 2 个模块域（Skill 入口层、行为规则层）
- 无数据结构、无接口变更

按 M 级流程：跳过 PRD 不适用（M 需 PRD）；设计走 software-design；代码实现走 TDD（本需求为文档改动，TDD 体现为验收清单逐条核对）；测试用例为验收清单；知识库更新为规划文档状态表更新。

**待用户确认级别后进入 PRD。**