# 01 需求分析：阶段状态与证据守卫（phase-state-guard）

- 日期：2026-09-30
- 上游：`docs/phase-state-guard/00-原始需求.md`
- 事实门控：本仓无知识库，基于下钻文件分析

## 1. 现状（下钻结果）

| 位置 | 现状 | 缺口 |
|------|------|------|
| 阶段推进 | CLAUDE.md 场景1 + DEVPILOT.md 任务链，全部 prompt 级 MUST | 无机器可读阶段状态；Agent 口述即可跳 |
| 需求目录 | `docs/{标识}/` 含 00–05 文档 + `.handoff/` | 无 `state.yaml`、无审计日志 |
| 脚本层 | 6 个 Skill 脚本（scan-status / verify-kb-facts / compress 等）已验证 `node --check` 可用 | 无守卫脚本；`skills/jit-devpilot-init/` 目前只有 SKILL.md，可挂 `scripts/` |
| status 扫描 | `scan-status.js` 以 `STAGE_FILES` 常量映射 00–05 文件名 | 可复用其证据存在性判断思路；本版本不改其代码（白名单外） |
| 可恢复 | `.handoff` 压缩包（2.4 已强制） | 缺「从 state 恢复」协议；中断后仍靠读文档 |

## 2. 需求要点 → 落点

| 00 要点 | 落点 |
|---------|------|
| state.yaml 契约 | 设计文档定义（字段锁定自规划 §6.2）；guard 脚本创建/更新 |
| guard 脚本 | 新增 `skills/jit-devpilot-init/scripts/devpilot-guard.js`（无斜杠注册） |
| 审计日志 | `docs/{标识}/.devpilot/state-events.jsonl`（append-only） |
| 阶段枚举 + S 级 skipped | 设计文档状态机 + guard 规则表 |
| 接入流水线 | CLAUDE.md 场景1/阶段推进 + cicd-rules §4 + init SKILL（恢复协议） |
| 人工确认优先 | guard 规则：`waiting_confirm` 禁止 `--apply` |

## 3. 涉及面（L 级依据）

- 新增：guard 脚本（含 state 读写、规则表、审计、`--apply`）≈ 1 个 JS 文件
- 新增契约：state.yaml 字段、阶段枚举、事件日志格式（跨需求目录通用）
- 修改规则层：CLAUDE.md（阶段推进接 guard）、cicd-rules.md、init SKILL（恢复协议）
- 修改流程文档：DEVPILOT.md（场景1 阶段推进描述对齐）
- 触及 3 个模块域（脚本层、协议层、流程层），新增数据契约 → **L 级**

## 4. 疑问项（按默认处理，无阻塞）

- 脚本位置：`skills/jit-devpilot-init/scripts/`（规划 §6.3 推荐，不新增 Skill 目录）
- 状态写入者：仅 guard 脚本 `--apply`；模型禁止手改 state.yaml 跳阶段
- 旧需求目录兼容：无 state.yaml 的旧需求按「状态推断」走 status 扫描，guard 不强制追溯补建（首次使用新需求生效；可选 `--init` 为当前需求补建）

## 5. 🔴 变更分级：**L 级**（规划 §3 已评估，与本次分析一致）

L 级流程：完整 01 → 02 PRD → 03-software-design（HLD+LLD 合并，含状态机图）→ 03a-change-strategy（分批+回滚）→ 04 用例 + 04a 回归清单 → 05 报告。

**待用户确认 L 级。**