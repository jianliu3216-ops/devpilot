# Multica 能力调研留档

> 调研时间：2026-07-15
> 调研对象：Multica（https://multica.ai/，GitHub: multica-ai/multica）
> 调研目的：明确 Multica 真实能力清单，重点验证"行为经验积累形成 Skill"是否真实存在
> 调研方法：抓取官网 6 个核心 docs 页面（skills/agents/squads/autopilots/tasks/how-multica-works）+ changelog + usecases + about + download，逐条引用原文证据

---

## 0. 一句话结论

Multica 是 AI coding agent 的**横向编排平台**，硬实力在 task 状态机、16-runtime 抽象、Autopilots、Squads 上；**"行为经验积累形成 Skill"是营销话术，文档无对应机制**。

---

## 1. 核心验证：行为经验积累成 Skill？没有

### 1.1 验证结论

**Multica 不支持 agent 自动将一次执行的经验沉淀成新 Skill。** Skill 是纯静态资产，全部由人手动创建或从外部导入。

### 1.2 证据链

**证据 1 - Skill 只有 4 种创建来源，全部人工触发**（来自 `/docs/skills`）：

> Workspace skills come from four sources:
> - **New** - write the `SKILL.md` and related files directly in the UI
> - **From GitHub** - paste a repo URL ... and Multica pulls the `SKILL.md` and every file in that directory
> - **From ClawHub** - search and import from the ClawHub public marketplace, with version selection
> - **From local** - the daemon scans skill directories on your machine, and you pick which to bring into the workspace

4 种来源都是"人写或人选"，没有"agent 执行完任务后自动生成"的路径。

**证据 2 - Skill 本质是静态知识包**：

> A Skill is a **knowledge pack** for an agent - a `SKILL.md` plus optional supporting files (scripts, configs, reference templates) that tell the agent "when you hit this kind of task, think and act like this."

> Skill = a structured **knowledge pack** (static content + instructions). The agent reads a skill to learn "when I see problem X, here's how to think and what to do."

"learn" 在文档里只出现过这一次，描述的是 agent **读** skill 来学习，不是 agent **写** skill 来积累。

**证据 3 - 版本管理是 edit-in-place，不是演化**：

> After you edit a skill's contents, **only newly created tasks pick up the new version** - tasks already running continue with the old skill.

没有版本号、没有演化历史、没有"从 N 次执行提炼模板"的机制。ClawHub 导入支持"version selection"，但那是外部市场版本选择，不是 agent 自身演化。

**证据 4 - 没有 skill 市场/registry 给 agent 自创 skill 共享**：

文档明确说 "Multica does **not** import them into the workspace skill registry automatically" -- registry 只装人导入的 skill，ClawHub 是外部第三方市场，不是 agent 间的共享池。

**证据 5 - 关键词全面缺失**：

在 skills / agents / squads / autopilots / tasks / how-multica-works 六个核心文档里，以下关键词全部零命中：

- `auto-generate` / `auto-create` / `auto-generate skill`
- `evolve` / `evolution`
- `compound`（除首页营销话术外，文档无具体机制）
- `experience` / `behavior accumulation`
- `self-improve`
- 中文 `积累` / `沉淀` / `经验`

`observe` 仅出现一次，是描述 squad leader 被唤醒去"观察"路由（指派派发），与经验沉淀无关。

### 1.3 与 DevPilot 对比

| 维度 | Multica | DevPilot |
|------|---------|----------|
| Skill 创建 | 4 种人工来源 | 人工编写 jit-* Skill |
| Skill 演化 | edit-in-place，无版本 | CLAUDE.md 版本号 + 变更记录 |
| 知识积累 | ❌ 无机制 | ✅ 知识库 BASE/DETAIL 增量更新 + 需求索引 |
| 跨需求复用 | ❌ 静态 skill 跨 task 通用 | ✅ 知识库作为单一事实源贯穿流程 |

**结论**：DevPilot 的知识库机制（DETAIL 增量更新 + 需求索引 + 变更记录）虽然也是 AI 写而不是 agent 自主沉淀，但**比 Multica 更接近"行为积累"**。

---

## 2. Multica 完整能力清单（7 个维度）

### 2.1 输入侧（任务触发源，7 种）

| 触发源 | 机制 | 备注 |
|--------|------|------|
| Issue 指派 | assignee 设为 agent | 几秒内自动开工 |
| @-mention 评论 | 评论里 @agent-name | 不改 assignee、不改状态，轻量拉 agent 看一眼 |
| Direct Chat | 一对一 sandbox 会话 | 脱离 issue，agent 看不到 issue、别人看不到会话 |
| Autopilots cron | cron 表达式 + IANA 时区 | 1 分钟最小粒度，server 每 30 秒扫描触发 |
| Webhook 入站 | autopilot 绑定唯一 webhook URL | POST 任意 JSON，支持 event filter、Idempotency-Key、GitHub X-GitHub-Delivery 去重 |
| 手动触发 | UI "Run now" 或 CLI `multica autopilot trigger <id>` | source 标记为 `manual` |
| API 触发 | trigger schema 预留 `api` kind | **未接线**，UI 标 Deprecated |

### 2.2 执行侧

| 能力 | 说明 |
|------|------|
| 本地 Daemon | 跑在用户自己机器，每 3 秒 poll 任务、每 15 秒心跳 |
| 16 个 AI 编码工具 | Antigravity、Claude Code、CodeBuddy、Codex、Cursor、Copilot、Hermes、Kimi、Kiro CLI、OpenCode、OpenClaw、Pi、Qoder、Trae CLI、DevEco Code、Grok |
| Runtime = daemon × 一个 AI 编码工具 | 同一台机装 2 个工具 + 加入 2 个 workspace = 4 个独立 runtime |
| Cloud Runtime | 仅本地 daemon 模式已上线；cloud runtime 仅 waitlist，未上线 |
| Squads 协作 | leader + 多个 member（agent 或人），leader 被触发后用精确 @mention markdown 派单给最合适的 member；leader 不亲自实现 |
| Self-issue | agent 跑任务时发现相关问题可自己开新 issue |
| Agent 可被设为 project lead | 与人类同等待遇 |
| Anti-loop | leader 自己的评论不触发自己；显式 @mention 已是路由信号时 leader 让路 |

### 2.3 编排侧（task 状态机）

| 能力 | 说明 |
|------|------|
| 状态机 | Queued -> Dispatched -> Running -> Completed / Failed / Cancelled |
| 超时 | dispatched 但未启动 = 5 分钟；running = 2.5 小时；均每 30 秒扫描 |
| 自动重试 | 最多 2 次（1 原始 + 1 重试），仅对 runtime_offline / runtime_recovery / timeout 三类；agent_error 不重试 |
| 自动重试范围 | 仅 issue 触发和 chat 触发的 task；**autopilot task 明确不自动重试**（怕叠加下一次 cron） |
| Session 继承 | 自动重试继承上次 session（用于基础设施故障）；手动 rerun 强制开新 session（避免重放坏输出） |
| 手动 rerun | `POST /api/issues/{id}/rerun` 或 `multica issue rerun`，次数无上限，取消目标 agent 在该 issue 上的 queued/running task，不动其他 agent 的并行任务 |
| 优先级 | autopilot 任务继承 issue priority 语义 |
| 失败回滚 | issue-triggered task 失败后，issue 状态自动从 in_progress 回滚到 todo |
| 队列去重 | leader 已有 queued/dispatched task 时不再入新任务 |

### 2.4 知识/记忆侧

| 能力 | 说明 |
|------|------|
| Skills 系统 | Anthropic Agent Skills 开放标准，SKILL.md + 附属文件 |
| 两类 skill 源 | Workspace skill（云端、团队共享、task 执行时 sync 到 daemon）vs Local skill（本地目录，daemon 扫描后手动挑） |
| 本地扫描双根 | 先扫 provider 自带目录（如 ~/.claude/skills/），再扫跨工具通用目录 ~/.agents/skills/；同名冲突时 provider-specific 胜出 |
| Repo-scoped skill | 检出 repo 时 .claude/skills/ .cursor/skills/ .opencode/skills/ .agents/skills/ 原生生效，无需导入 |
| Skill 注入路径 | Claude Code 用 .claude/skills/、Cursor 用 .cursor/skills/、Antigravity 用 .agents/skills/；Gemini/Hermes/OpenClaw 用 fallback .agent_context/skills/ |
| 版本"快照"语义 | 编辑 skill 后，仅新建 task 拿到新版本，running task 继续用旧版 |
| MCP（Model Context Protocol） | 作为工具通道与 skill 互补；provider-specific，仅 Claude Code、Codex、Cursor、Hermes、Kimi、Kiro CLI、OpenCode、OpenClaw 真正消费 mcp_config |
| Session resumption | task 启动和结束各 pin 一次 session ID；11 个工具真支持；**Gemini 不支持** |
| Sandboxed chat | chat 会话与 issue 体系完全隔离 |
| 第三方 skill 安全 | Multica 不签名、不审计、不沙箱；2026 年 2 月发生过 "ClawHavoc" 事件（恶意 skill 偷 API key），ClawHub 之后加 VirusTotal 扫描 |

### 2.5 集成侧

| 能力 | 说明 |
|------|------|
| Slack Bot | 从 manifest 创建 Slack app，粘 bot + app-level token，支持 @-mention、DM、/issue 命令 |
| Lark（飞书）Bot | 把 Multica agent 绑到 Lark Bot，支持 DM、群 @、/issue |
| GitHub App | 装一次，PR 的 branch/title/body 引用 issue 标识符自动 attach；merge PR 自动把 issue 移到 Done |
| Channels 引擎 | 统一 chat 集成引擎，per-platform adapter（Lark、Slack），管 inbound pipeline、session、授权 |
| Webhook 出站 | autopilot webhook URL（bearer secret，可 rotate） |
| CLI 全套 | agent / squad / issue / autopilot / workspace member 命令均支持 --output json |

### 2.6 部署侧

| 能力 | 说明 |
|------|------|
| Web app | 主前端 |
| Desktop app | 独立于 web app 的桌面客户端 |
| Mobile app (iOS) | 开源，自行编译到 iPhone，**尚未上 App Store** |
| CLI | 完整命令行，含 daemon |
| Self-host | 开源，自己跑 server，支持环境变量配置 |
| Cloud | Multica Cloud 托管 |
| Daemon 部署位置 | 用户自己的机器，API key/代码目录/CPU 全部留在本地，server 永不触碰 |

### 2.7 管理/治理侧

| 能力 | 说明 |
|------|------|
| Workspaces | 顶层隔离单元 |
| Members & Roles | owner / admin / member 三级权限矩阵 |
| Agent 可见性 | Workspace（任意 member 可指派）vs Private（仅 owner/admin/creator 可指派；其他 member 能看到名字和描述但看不到 config 细节，环境变量和 MCP config 被脱敏） |
| Squad 权限 | 创建/改/归档仅 owner/admin；指派和 @-mention 任意 member 可做；squad-leader evaluation 仅 leader agent 自己通过 CLI 写 |
| Agent 归档 | 归档后从日常视图消失，取消正在跑的 task；可恢复 |
| Squad 归档 | 当前 assigned issue 转给 leader agent，禁止新指派，**目前无 unarchive** |
| Concurrency limit | 每个 agent 可配并发上限 |
| 审计轨迹 | issue activity timeline、autopilot run history（含 trigger source、起止时间、状态、失败原因）、webhook delivery history（含 ignored 状态与 reason） |
| Inbox & 订阅 | 通知规则，可 mute 不关心的 issue |
| 三类 token | browser、CLI、daemon 各一套，用途分明 |
| Sign-in 配置 | email + 验证码、Google OAuth、signup allowlist、本地测试码 |
| Webhook URL 安全 | URL 即 bearer token，泄露后可 rotate；**不支持 HMAC 签名验证、不支持 IP allowlist** |
| 反恶意 webhook | 429 限流、Retry-After、未知 token 累计扣分 |

---

## 3. 价值评估：哪些真有价值，哪些是营销

| 能力 | 真实价值 | 备注 |
|------|:--------:|------|
| 16 个 runtime 抽象 | 高 | 唯一硬实力，runtime 与 agent 解耦 |
| Task 状态机 + 重试 + 超时 | 高 | 编排层核心，DevPilot 没有 |
| Autopilots（cron/webhook） | 中高 | 解锁无人值守场景 |
| Squads 多 agent | 中 | leader + workers 编排 |
| Slack/Lark/GitHub 集成 | 中 | 落地企业 IM |
| Self-host + 开源 | 中 | 数据不出网 |
| Desktop/CLI/Web/iOS 多端 | 中 | 入口丰富 |
| 审计轨迹 + 权限矩阵 | 中 | 企业治理基础 |
| **"Compound skills"** | 营销 | 首页话术，文档无机制 |
| **行为积累成 skill** | 没有 | 全靠人写/导入 |
| Skill 安全审计 | 缺失 | ClawHavoc 事故佐证 |
| Webhook 鉴权 | 弱 | 仅 bearer，HMAC 在路上 |
| Cloud runtime | 未上线 | waitlist |
| API 触发 | 未接线 | UI 标 Deprecated |

---

## 4. 关键判断（供 DevPilot 借鉴决策参考）

### 4.1 值得借鉴（真有硬实力）

1. **Task 状态机 + 重试 + 超时**：编排层核心，DevPilot 完全没有
2. **Autopilots（cron/webhook 触发）**：解锁无人值守场景
3. **16-runtime 抽象**：runtime 与 agent 解耦，DevPilot 锁死 Claude Code
4. **Squads leader + workers**：多 agent 编排，DevPilot 是中心化委派
5. **Slack/Lark/GitHub 集成**：落地企业 IM，DevPilot 无外部集成

### 4.2 不值得借鉴

1. **"行为积累成 skill"**：Multica 自己也没有，借鉴无意义
2. **静态 skill 导入体系**：DevPilot 的 jit-* Skill 已是受控自定义格式，不要为了开放性放弃安全（ClawHavoc 事故佐证）
3. **agent 自行创建 issue**：破坏 DevPilot 流程门控
4. **Webhook v1 bearer-only**：Multica 自己也承认是缺陷，DevPilot 若做 webhook 直接上 HMAC

### 4.3 DevPilot 反而更强的点

1. **知识库增量积累机制**：BASE/DETAIL + 需求索引 + 变更记录，比 Multica 静态 skill 更接近"行为积累"
2. **S/M/L 分级 + 流程门控**：DevPilot 的质量管控内核，Multica 完全没有
3. **PRD/设计/测试用例文档产出**：DevPilot 的纵向流水线产物，Multica 不产出

---

## 5. 官网明确未上线 / 缺失的能力

调研中发现的 Multica 自承认局限，留档备查：

- Cloud runtime 未上线（waitlist）
- Autopilot 失败不自动重试、不发 inbox 通知
- API-kind 触发未接通（UI 标 Deprecated）
- Webhook v1 仅 bearer，无 HMAC / IP allowlist
- MCP 支持参差：16 个工具中部分接受字段但忽略
- Gemini 无 session resumption
- Squad 归档无 unarchive
- Private agent 做不到"只对一人可见"
- Skills 不签名、不审计、不沙箱（ClawHavoc 事故）
- Skills 不能由 agent 自动生成或演化

---

## 6. 信息来源

- [Multica 官网首页](https://multica.ai/)
- [Multica About](https://multica.ai/about)
- [Multica Docs](https://multica.ai/docs)
- [Multica Skills 文档](https://multica.ai/docs/skills)
- [Multica Agents 文档](https://multica.ai/docs/agents)
- [Multica Squads 文档](https://multica.ai/docs/squads)
- [Multica Autopilots 文档](https://multica.ai/docs/autopilots)
- [Multica Tasks 文档](https://multica.ai/docs/tasks)
- [Multica How it works](https://multica.ai/docs/how-multica-works)
- [AI coding tools matrix](https://multica.ai/docs/providers)
- [Multica Changelog](https://multica.ai/changelog)
- [Multica Usecases](https://multica.ai/usecases)
- [Multica Download](https://multica.ai/download)
- [GitHub: multica-ai/multica](https://github.com/multica-ai/multica)

> 注：changelog 与 usecases 页面纯客户端渲染（CSR），SSR 不含正文，离线抓取只能拿到骨架；6 个核心 docs 页面已覆盖 skills/agents/tasks/autopilots/squads 的全部能力描述。

---

## 变更记录

| 版本 | 日期 | 变更范围 | 说明 |
|------|------|----------|------|
| v1.0 | 2026-07-15 | 初始创建 | 基于 Multica 官网 6 个核心 docs + about/changelog/usecases/download 页面调研，覆盖 7 个维度能力清单 + 行为积累成 skill 验证结论 |
