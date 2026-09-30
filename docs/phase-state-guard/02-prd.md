# 02 产品需求文档（PRD）：阶段状态与证据守卫（phase-state-guard）

- 日期：2026-09-30
- 级别：L（用户已确认）
- 上游：`00-原始需求.md`、`01-requirements-analysis.md`
- 上下文：`.handoff/prd.context.md`

## 1. 目标

阶段推进从「模型口述」变成「文件证据 + 脚本校验」：没有真实证据文件就不能进下一阶段；中断后读 state + handoff 即可续跑；人工确认门控保持不变。

## 2. 用户故事

| # | 作为 | 我希望 | 以至于 | 验收 |
|---|------|--------|--------|------|
| US1 | 怕流程被跳过的用户 | AI 说「做完了」不算数，证据文件在才算 | 阶段假完成被脚本拦下 | guard 规则表生效 |
| US2 | 会话中断的用户 | 新会话读 state.yaml + 压缩包就接着干 | 不重扫全库、不复读 00–05 | 恢复协议成文 |
| US3 | 审计/复盘的人 | 每次阶段迁移有 append-only 日志 | 可追溯谁在何时从哪步走到哪步 | state-events.jsonl |
| US4 | S 级用户 | S 级跳过的阶段不要求证据文件 | 小修不被错误 HARD STOP | skipped 字段生效 |
| US5 | 老需求的维护者 | 没有 state.yaml 的旧需求不被强制补建 | 兼容存量目录 | 推断模式 + 可选 --init |

## 3. 功能规格

### FR1 state.yaml 契约

路径 `{目标项目}/docs/{需求标识}/state.yaml`；字段锁定（id / level / phase / status / evidence{00–05, prd, design, test_cases 允许 null} / skipped / updated_at）。S 级括号阶段写 `skipped: true`。**仅 guard 脚本可写**；模型与用户手改视为违规（规则层声明）。

### FR2 阶段枚举

`identified → original_req → analysis → (prd) → (design) → impl → (test_cases) → report → kb_update → done`；与 CLAUDE.md 场景1 / DEVPILOT.md 任务链一一对应，禁止引入 Comet 术语。

### FR3 guard 脚本

`skills/jit-devpilot-init/scripts/devpilot-guard.js`，命令：
- `node devpilot-guard.js <项目> <需求标识> check <目标阶段>`：校验进入条件（规则表按级别），输出 PASS / `[HARD STOP] <缺什么>`
- `node devpilot-guard.js <项目> <需求标识> --apply <目标阶段>`：check 通过后更新 phase 并追加审计事件
- `node devpilot-guard.js <项目> <需求标识> --init [S|M|L]`：为需求补建 state.yaml（可选动作）
- `node devpilot-guard.js <项目> <需求标识> resume`：输出当前 phase、level、下一动作提示（供恢复协议使用）

### FR4 守卫规则表（按级别）

| 想进入 | S 必须已有 | M/L 必须已有 |
|--------|-----------|--------------|
| analysis | 00 | 00 |
| prd | （skipped） | 01 |
| design | （skipped） | 02 |
| impl | 01 + level 已确认 | M：03；L：03 + 03a |
| test_cases | （skipped） | 实现完成证据（`tests/{标识}/` 存在或 state 记录用户确认无测） |
| report | 实现完成证据 | 04（L 另需 04a） |
| kb_update | 05 | 05 |
| done | 8.5 完成或 state 记录跳过理由 | 同左 |

`status: waiting_confirm` 时 check/`--apply` 一律拒绝（人工门控优先）。

### FR5 审计日志

`docs/{标识}/.devpilot/state-events.jsonl`：append-only，每行 `{ts, from, to, evidence, level}`；禁止改写历史行。

### FR6 恢复协议

中断续跑：guard `resume` → 读 state.phase/level → 读 `.handoff/{phase}.context.md`（2.4 法律 L2）→ 报告下一动作；禁止为此全量生成知识库或重读 00–05 全文。恢复协议写入 init SKILL 第 3 步会话协议。

### FR7 流水线接入

CLAUDE.md 场景1 各阶段推进步骤、cicd-rules.md §4：进入新阶段前先 `check`（失败 HARD STOP 即停）；`--apply` 在用户确认该阶段产出后执行。status Skill 本版本不改代码，但 SKILL.md 提示「有 state.yaml 的需求以 state 为准」。

## 4. 非功能需求

- NF1：零新依赖（Node 内置模块 fs/path）
- NF2：无新对外斜杠命令；脚本由流水线内部调用
- NF3：与注入法律 L1–L3 兼容（guard 只读文件存在性，不灌内容）
- NF4：旧需求目录兼容（无 state → 推断模式，不强制迁移）

## 5. 验收标准

- [ ] AC1 缺 00 时 `check analysis` 返回 HARD STOP
- [ ] AC2 S 级 state（prd/design/test_cases skipped）`check impl` 通过且不要求 02/03
- [ ] AC3 M 级缺 05 时 `check kb_update` 返回 HARD STOP
- [ ] AC4 `waiting_confirm` 时 `--apply` 被拒
- [ ] AC5 `--apply` 成功后 phase 更新 + state-events.jsonl 追加一行
- [ ] AC6 `resume` 输出 phase/level/下一动作，未读 00–05 全文
- [ ] AC7 `--init` 可为存量需求补建 state
- [ ] AC8 全程无新斜杠命令、无新依赖
- [ ] AC9 CLAUDE.md / cicd-rules / init SKILL 恢复协议三处口径一致

## 6. 边界与风险

| 风险 | 处理 |
|------|------|
| state 与文档双轨漂移 | 规划 §1.2 原则：文档存在性为事实源，guard 据此回写 state；state 不删文档 |
| guard 误拦（证据在但路径变体） | 规则表路径与 DEVPILOT.md 产出路径一致；HARD STOP 输出具体缺失项便于修正 |
| 模型绕过 guard 直接干活 | 规则层声明 + cicd-rules §4 阻塞步骤接入；机器级防绕过属 Comet 级 runtime，本版本不做（非目标） |
| JSONL 并发写 | 单会话使用，追加写足够；不加锁（记录为已知限制） |

## 7. 范围外

2.6.0（骨架+INDEX）、2.7.0（增量运维）、Verifier 双 Agent、Dashboard、跨平台 runtime。